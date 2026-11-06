import type { GpStoryAttribution, GpStoryFormat, Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";

export type CreateVersionInput = {
  clinicId: string;
  storyId: string;
  format: GpStoryFormat;
  bodyText: string;
  pullQuoteText?: string;
  transcriptText?: string;
  attribution: GpStoryAttribution;
  publicByline?: string;
  structureJson?: Prisma.InputJsonValue;
  editorUserId?: string;
};

export async function createStoryVersion(input: CreateVersionInput) {
  const story = await prisma.gpStory.findFirst({
    where: { id: input.storyId, clinicId: input.clinicId },
  });
  if (!story) throw new Error("Story not found");
  if (input.format === "video" && !input.transcriptText?.trim()) {
    throw new Error("transcriptText required for video format");
  }
  if (input.format === "pull_quote") {
    const words = (input.pullQuoteText ?? input.bodyText).trim().split(/\s+/).length;
    if (words < 8 || words > 30) {
      // Soft guidance from 12–22; allow slight buffer for drafts
      // still require some text
      if (!(input.pullQuoteText ?? input.bodyText).trim()) {
        throw new Error("pull quote text required");
      }
    }
  }

  const latest = await prisma.gpStoryVersion.findFirst({
    where: { storyId: input.storyId, format: input.format },
    orderBy: { versionNumber: "desc" },
  });

  const version = await prisma.gpStoryVersion.create({
    data: {
      storyId: input.storyId,
      versionNumber: (latest?.versionNumber ?? 0) + 1,
      format: input.format,
      statusSnapshot: story.status === "invited" || story.status === "briefed" ? "drafting" : story.status,
      bodyText: input.bodyText,
      pullQuoteText: input.pullQuoteText,
      transcriptText: input.transcriptText,
      attribution: input.attribution,
      publicByline: input.publicByline,
      structureJson: input.structureJson,
      editorUserId: input.editorUserId,
    },
  });

  if (["invited", "briefed", "interviewed", "changes_requested"].includes(story.status)) {
    await prisma.gpStory.update({
      where: { id: story.id },
      data: { status: "drafting" },
    });
  }

  return version;
}
