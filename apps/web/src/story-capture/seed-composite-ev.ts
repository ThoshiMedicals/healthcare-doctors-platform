/**
 * Seed composite (non-named) Story Capture rows for Experience Validation surfaces.
 * No fake named doctors. Uses composite role labels only.
 */
import type { GpStoryReuseChannel } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { CURRENT_CONSENT_VERSION } from "./channels";
import { createStory } from "./stories";
import { createStoryVersion } from "./versions";
import { syncReusePoliciesFromConsent } from "./reuse";
import { createPlacement, goLivePlacement } from "./placements";

const CHANNELS: GpStoryReuseChannel[] = [
  "practice_experience_web",
  "gp_opportunities_rail",
  "internal_proposal_pack",
];

const COMPOSITES = [
  {
    key: "ev-composite-continuity",
    title: "EV composite · continuity consulting",
    subject: "Composite GP · continuity",
    quote:
      "Continuity shows up as familiar faces and unfinished stories that return — nursing handoffs keep the day coherent.",
    channel: "practice_experience_web" as const,
    moduleKey: "continuity",
  },
  {
    key: "ev-composite-opportunities",
    title: "EV composite · practice fit",
    subject: "Composite GP · practice fit",
    quote:
      "I needed to know how nursing and reception actually protect consulting time before deciding whether a conversation made sense.",
    channel: "gp_opportunities_rail" as const,
    moduleKey: "gp-opportunities",
  },
  {
    key: "ev-composite-pack",
    title: "EV composite · opportunity pack",
    subject: "Composite GP · practice support",
    quote:
      "Support shows up as nursing cover on procedure days and reception protecting consulting time — not as slogans.",
    channel: "internal_proposal_pack" as const,
    moduleKey: "opportunity-pack",
  },
];

export async function seedCompositeStoriesForEv(clinicId: string, actorUserId: string) {
  const created: string[] = [];
  const skipped: string[] = [];

  for (const item of COMPOSITES) {
    const existing = await prisma.gpStory.findFirst({
      where: {
        clinicId,
        workingTitle: item.title,
        compositeExampleFlag: true,
      },
    });
    if (existing) {
      skipped.push(existing.id);
      continue;
    }

    const story = await createStory({
      clinicId,
      workingTitle: item.title,
      subjectDisplayName: item.subject,
      primaryCategory: "established",
      createdByUserId: actorUserId,
      internalNotes: `Experience Validation composite placeholder (${item.key}). Replace via consented Story Capture.`,
    });

    await prisma.gpStory.update({
      where: { id: story.id },
      data: {
        compositeExampleFlag: true,
        honestyCueEnabled: true,
        status: "approved",
      },
    });

    const consent = await prisma.gpStoryConsent.findFirst({
      where: { storyId: story.id },
      orderBy: { createdAt: "desc" },
    });
    if (consent) {
      await prisma.gpStoryConsent.update({
        where: { id: consent.id },
        data: {
          consentVersion: CURRENT_CONSENT_VERSION,
          status: "signed",
          channelsAllowedJson: CHANNELS,
          channelsDeniedJson: [
            "job_boards",
            "recruitment_agencies",
            "paid_testimonial_networks",
            "third_clinic_sites",
          ],
          signedAt: new Date(),
          signedByName: item.subject,
          attributionChosen: "role_label_only",
          commercialSilenceAck: true,
          patientPrivacyAck: true,
          editRightsAck: true,
        },
      });
    }

    await syncReusePoliciesFromConsent({
      storyId: story.id,
      channelsAllowed: CHANNELS,
      channelsDenied: ["job_boards", "recruitment_agencies"],
      createdByUserId: actorUserId,
    });

    const version = await createStoryVersion({
      clinicId,
      storyId: story.id,
      format: "pull_quote",
      bodyText: item.quote,
      pullQuoteText: item.quote,
      attribution: "role_label_only",
      publicByline: item.subject,
      editorUserId: actorUserId,
    });

    const placement = await createPlacement({
      clinicId,
      storyId: story.id,
      versionId: version.id,
      channel: item.channel,
      moduleKey: item.moduleKey,
    });

    await goLivePlacement({
      clinicId,
      storyId: story.id,
      placementId: placement.id,
      actorUserId,
      actorName: "EV composite seed",
    });

    created.push(story.id);
  }

  return { createdCount: created.length, skippedCount: skipped.length, created, skipped };
}
