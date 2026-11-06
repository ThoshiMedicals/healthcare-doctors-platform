import type { GpStoryReuseChannel } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { CHANNEL_SURFACE } from "./channels";
import { assertChannelReusable } from "./reuse";

export type CreatePlacementInput = {
  clinicId: string;
  storyId: string;
  versionId: string;
  channel: GpStoryReuseChannel;
  moduleKey?: string;
  surfacePath?: string;
};

export async function createPlacement(input: CreatePlacementInput) {
  const story = await prisma.gpStory.findFirst({
    where: { id: input.storyId, clinicId: input.clinicId },
  });
  if (!story) throw new Error("Story not found");
  if (!["approved", "published"].includes(story.status)) {
    throw new Error("Story must be approved before placement planning");
  }

  const version = await prisma.gpStoryVersion.findFirst({
    where: { id: input.versionId, storyId: input.storyId },
  });
  if (!version) throw new Error("Version not found");

  await assertChannelReusable(input.storyId, input.channel);

  const surface = CHANNEL_SURFACE[input.channel];
  return prisma.gpStoryPlacement.create({
    data: {
      storyId: input.storyId,
      versionId: input.versionId,
      channel: input.channel,
      surfacePath: input.surfacePath ?? surface.surfacePath,
      moduleKey: input.moduleKey ?? surface.moduleKey,
      live: false,
    },
  });
}

export async function goLivePlacement(input: {
  clinicId: string;
  storyId: string;
  placementId: string;
  actorUserId: string;
  actorName: string;
}) {
  const story = await prisma.gpStory.findFirst({
    where: { id: input.storyId, clinicId: input.clinicId },
  });
  if (!story) throw new Error("Story not found");

  const placement = await prisma.gpStoryPlacement.findFirst({
    where: { id: input.placementId, storyId: input.storyId },
  });
  if (!placement) throw new Error("Placement not found");

  await assertChannelReusable(input.storyId, placement.channel);

  return prisma.$transaction(async (tx) => {
    const live = await tx.gpStoryPlacement.update({
      where: { id: placement.id },
      data: {
        live: true,
        wentLiveAt: new Date(),
        takenDownAt: null,
        takeDownReason: null,
      },
    });

    await tx.gpStory.update({
      where: { id: story.id },
      data: {
        status: "published",
        publishedAt: story.publishedAt ?? new Date(),
      },
    });

    await tx.gpStoryReviewEvent.create({
      data: {
        storyId: story.id,
        fromStatus: story.status,
        toStatus: "published",
        decision: "approve_publish",
        reviewerRole: "practice_manager",
        reviewerId: input.actorUserId,
        reviewerName: input.actorName,
        rationale: `Placement go-live on ${placement.channel} → ${placement.surfacePath}`,
        versionId: placement.versionId,
      },
    });

    return live;
  });
}

export async function takeDownPlacement(input: {
  clinicId: string;
  storyId: string;
  placementId: string;
  reason: string;
}) {
  const story = await prisma.gpStory.findFirst({
    where: { id: input.storyId, clinicId: input.clinicId },
  });
  if (!story) throw new Error("Story not found");
  const placement = await prisma.gpStoryPlacement.findFirst({
    where: { id: input.placementId, storyId: input.storyId },
  });
  if (!placement) throw new Error("Placement not found");

  return prisma.gpStoryPlacement.update({
    where: { id: placement.id },
    data: {
      live: false,
      takenDownAt: new Date(),
      takeDownReason: input.reason,
    },
  });
}

/** Live placements eligible for Practice Experience / Opportunities / Pack consumers. */
export async function listLivePlacementsForSurface(
  clinicId: string,
  channel: GpStoryReuseChannel,
) {
  return prisma.gpStoryPlacement.findMany({
    where: {
      live: true,
      channel,
      story: { clinicId, status: { in: ["published"] }, withdrawnAt: null },
    },
    include: {
      version: true,
      story: {
        select: {
          id: true,
          workingTitle: true,
          primaryCategory: true,
          honestyCueEnabled: true,
          compositeExampleFlag: true,
        },
      },
    },
    orderBy: { wentLiveAt: "desc" },
  });
}
