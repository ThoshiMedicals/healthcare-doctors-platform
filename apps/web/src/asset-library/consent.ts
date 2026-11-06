import { prisma } from "@/db/prisma";

export async function createAssetConsent(input: {
  clinicId: string;
  consentVersion: string;
  subjectDisplayName: string;
  channelsAllowed?: string[];
  relatedStoryId?: string;
  notes?: string;
}) {
  return prisma.attractionAssetConsent.create({
    data: {
      clinicId: input.clinicId,
      consentVersion: input.consentVersion,
      subjectDisplayName: input.subjectDisplayName,
      status: "draft",
      channelsAllowedJson: input.channelsAllowed ?? [],
      channelsDeniedJson: ["job_boards", "recruitment_agencies", "paid_testimonial_networks"],
      relatedStoryId: input.relatedStoryId,
      notes: input.notes,
    },
  });
}

export async function signAssetConsent(input: {
  clinicId: string;
  consentId: string;
  signedByName: string;
  documentUri?: string;
  channelsAllowed: string[];
}) {
  const consent = await prisma.attractionAssetConsent.findFirst({
    where: { id: input.consentId, clinicId: input.clinicId },
  });
  if (!consent) throw new Error("Consent not found");
  if (consent.status === "withdrawn") throw new Error("Cannot sign withdrawn consent");

  return prisma.attractionAssetConsent.update({
    where: { id: consent.id },
    data: {
      status: "signed",
      signedAt: new Date(),
      signedByName: input.signedByName,
      documentUri: input.documentUri,
      channelsAllowedJson: input.channelsAllowed,
      retentionUntil: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000),
    },
  });
}

export async function linkAssetToConsent(input: {
  clinicId: string;
  assetRowId: string;
  consentId: string;
}) {
  const [asset, consent] = await Promise.all([
    prisma.attractionAsset.findFirst({ where: { id: input.assetRowId, clinicId: input.clinicId } }),
    prisma.attractionAssetConsent.findFirst({
      where: { id: input.consentId, clinicId: input.clinicId },
    }),
  ]);
  if (!asset) throw new Error("Asset not found");
  if (!consent) throw new Error("Consent not found");

  return prisma.attractionAsset.update({
    where: { id: asset.id },
    data: {
      consentRecordId: consent.id,
      consentRef: consent.consentVersion,
      relatedStoryId: consent.relatedStoryId ?? asset.relatedStoryId,
    },
  });
}

export async function linkAssetToStory(input: {
  clinicId: string;
  assetRowId: string;
  storyId: string;
}) {
  const [asset, story] = await Promise.all([
    prisma.attractionAsset.findFirst({ where: { id: input.assetRowId, clinicId: input.clinicId } }),
    prisma.gpStory.findFirst({ where: { id: input.storyId, clinicId: input.clinicId } }),
  ]);
  if (!asset) throw new Error("Asset not found");
  if (!story) throw new Error("Story not found");

  return prisma.attractionAsset.update({
    where: { id: asset.id },
    data: {
      relatedStoryId: story.id,
      relatedStoryRef: `gp-story:${story.id}`,
    },
  });
}
