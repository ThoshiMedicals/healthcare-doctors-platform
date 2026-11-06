import type { GpStoryAttribution, GpStoryReuseChannel } from "@prisma/client";
import { prisma } from "@/db/prisma";
import {
  CURRENT_CONSENT_VERSION,
  DEFAULT_SIGN_ALLOW,
  HARD_BLOCK_CHANNELS,
  isHardBlockedChannel,
} from "./channels";
import { syncReusePoliciesFromConsent } from "./reuse";

export type CreateConsentVersionInput = {
  clinicId: string;
  storyId: string;
  consentVersion?: string;
  channelsAllowed?: GpStoryReuseChannel[];
  attributionChosen?: GpStoryAttribution;
  linkedVersionId?: string;
};

export async function shareConsentSummary(clinicId: string, storyId: string) {
  const story = await prisma.gpStory.findFirst({ where: { id: storyId, clinicId } });
  if (!story) throw new Error("Story not found");

  const consent = await prisma.gpStoryConsent.findFirst({
    where: { storyId, status: { in: ["not_started", "summary_shared"] } },
    orderBy: { createdAt: "desc" },
  });
  if (!consent) throw new Error("No active consent draft");

  const updated = await prisma.gpStoryConsent.update({
    where: { id: consent.id },
    data: { status: "summary_shared" },
  });

  if (story.status === "invited") {
    await prisma.gpStory.update({ where: { id: storyId }, data: { status: "briefed" } });
  }
  return updated;
}

export async function linkConsentToDraft(input: {
  clinicId: string;
  storyId: string;
  consentId: string;
  versionId: string;
}) {
  const story = await prisma.gpStory.findFirst({ where: { id: input.storyId, clinicId: input.clinicId } });
  if (!story) throw new Error("Story not found");
  const version = await prisma.gpStoryVersion.findFirst({
    where: { id: input.versionId, storyId: input.storyId },
  });
  if (!version) throw new Error("Version not found");

  return prisma.gpStoryConsent.update({
    where: { id: input.consentId },
    data: { status: "draft_linked", linkedVersionId: input.versionId },
  });
}

export async function createConsentVersion(input: CreateConsentVersionInput) {
  const story = await prisma.gpStory.findFirst({
    where: { id: input.storyId, clinicId: input.clinicId },
  });
  if (!story) throw new Error("Story not found");

  // Supersede prior open consents
  await prisma.gpStoryConsent.updateMany({
    where: {
      storyId: input.storyId,
      status: { in: ["not_started", "summary_shared", "draft_linked", "signed"] },
    },
    data: { status: "superseded" },
  });

  const channelsAllowed = input.channelsAllowed ?? [...DEFAULT_SIGN_ALLOW];
  for (const ch of channelsAllowed) {
    if (isHardBlockedChannel(ch)) {
      throw new Error(`Cannot allow hard-blocked channel: ${ch}`);
    }
  }

  return prisma.gpStoryConsent.create({
    data: {
      storyId: input.storyId,
      consentVersion: input.consentVersion ?? CURRENT_CONSENT_VERSION,
      status: "not_started",
      attributionChosen: input.attributionChosen,
      linkedVersionId: input.linkedVersionId,
      channelsAllowedJson: channelsAllowed,
      channelsDeniedJson: [...HARD_BLOCK_CHANNELS],
    },
  });
}

export async function signConsent(input: {
  clinicId: string;
  storyId: string;
  consentId: string;
  signedByName: string;
  signedByEmail?: string;
  documentUri?: string;
  attributionChosen: GpStoryAttribution;
  channelsAllowed: GpStoryReuseChannel[];
  commercialSilenceAck: boolean;
  patientPrivacyAck: boolean;
  editRightsAck: boolean;
  recordingAudioVideo?: boolean;
  actorUserId?: string;
}) {
  if (!input.commercialSilenceAck || !input.patientPrivacyAck || !input.editRightsAck) {
    throw new Error("All consent acknowledgements required before signing");
  }
  if (!input.signedByName.trim()) throw new Error("signedByName required");

  for (const ch of input.channelsAllowed) {
    if (isHardBlockedChannel(ch)) {
      throw new Error(`Cannot sign allow for hard-blocked channel: ${ch}`);
    }
  }

  const story = await prisma.gpStory.findFirst({
    where: { id: input.storyId, clinicId: input.clinicId },
  });
  if (!story) throw new Error("Story not found");

  const consent = await prisma.gpStoryConsent.findFirst({
    where: { id: input.consentId, storyId: input.storyId },
  });
  if (!consent) throw new Error("Consent not found");
  if (consent.status === "withdrawn" || consent.status === "superseded") {
    throw new Error("Cannot sign withdrawn/superseded consent");
  }

  const signed = await prisma.gpStoryConsent.update({
    where: { id: consent.id },
    data: {
      status: "signed",
      signedAt: new Date(),
      signedByName: input.signedByName.trim(),
      signedByEmail: input.signedByEmail,
      documentUri: input.documentUri,
      attributionChosen: input.attributionChosen,
      channelsAllowedJson: input.channelsAllowed,
      channelsDeniedJson: [...HARD_BLOCK_CHANNELS],
      commercialSilenceAck: true,
      patientPrivacyAck: true,
      editRightsAck: true,
      recordingAudioVideo: input.recordingAudioVideo ?? false,
      retentionUntil: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000),
    },
  });

  await syncReusePoliciesFromConsent({
    storyId: input.storyId,
    channelsAllowed: input.channelsAllowed,
    channelsDenied: [...HARD_BLOCK_CHANNELS],
    createdByUserId: input.actorUserId,
  });

  return signed;
}
