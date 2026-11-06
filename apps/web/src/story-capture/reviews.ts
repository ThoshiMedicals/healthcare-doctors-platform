import type {
  GpStoryReviewDecision,
  GpStoryReviewRole,
  GpStoryStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/db/prisma";
import { isHumanReviewerId } from "@/attraction-cms/schema-rules";

const FORBIDDEN_REVIEWERS = new Set(["system", "auto", "bot", "automation"]);

function assertHuman(reviewerId: string) {
  if (!isHumanReviewerId(reviewerId) || FORBIDDEN_REVIEWERS.has(reviewerId.toLowerCase())) {
    throw new Error("Human gates only — reviewerId cannot be system/auto");
  }
}

const DECISION_MAP: Record<
  GpStoryReviewDecision,
  { from: GpStoryStatus[]; to: GpStoryStatus }
> = {
  approve_advance: {
    from: ["invited", "briefed", "interviewed", "drafting", "gp_review", "editorial_review", "changes_requested"],
    to: "approved", // refined below by context
  },
  request_changes: {
    from: ["gp_review", "editorial_review", "approved"],
    to: "changes_requested",
  },
  pause: {
    from: ["invited", "briefed", "interviewed", "drafting", "gp_review", "editorial_review", "approved"],
    to: "paused",
  },
  withdraw: {
    from: [
      "invited",
      "briefed",
      "interviewed",
      "drafting",
      "gp_review",
      "editorial_review",
      "changes_requested",
      "approved",
      "published",
      "paused",
    ],
    to: "withdrawn",
  },
  archive: {
    from: ["paused", "withdrawn", "approved", "changes_requested", "invited"],
    to: "archived",
  },
  approve_publish: {
    from: ["approved"],
    to: "published",
  },
  acknowledge_withdrawal: {
    from: ["published", "approved", "editorial_review", "gp_review", "drafting"],
    to: "withdrawn",
  },
};

function resolveAdvanceTarget(from: GpStoryStatus): GpStoryStatus {
  switch (from) {
    case "invited":
      return "briefed";
    case "briefed":
      return "interviewed";
    case "interviewed":
      return "drafting";
    case "drafting":
    case "changes_requested":
      return "gp_review";
    case "gp_review":
      return "editorial_review";
    case "editorial_review":
      return "approved";
    default:
      return "approved";
  }
}

export type RecordReviewInput = {
  clinicId: string;
  storyId: string;
  decision: GpStoryReviewDecision;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: GpStoryReviewRole;
  rationale: string;
  versionId?: string;
  checklistSnapshot?: Prisma.InputJsonValue;
};

export async function recordStoryReview(input: RecordReviewInput) {
  assertHuman(input.reviewerId);
  if (!input.reviewerName.trim() || !input.rationale.trim()) {
    throw new Error("reviewerName and rationale required");
  }

  const story = await prisma.gpStory.findFirst({
    where: { id: input.storyId, clinicId: input.clinicId },
  });
  if (!story) throw new Error("Story not found");

  const map = DECISION_MAP[input.decision];
  if (!map.from.includes(story.status)) {
    throw new Error(`Decision ${input.decision} not allowed from ${story.status}`);
  }

  let toStatus = map.to;
  if (input.decision === "approve_advance") {
    toStatus = resolveAdvanceTarget(story.status);
  }

  // Editorial approve requires signed consent
  if (input.decision === "approve_advance" && story.status === "editorial_review") {
    const signed = await prisma.gpStoryConsent.findFirst({
      where: { storyId: story.id, status: "signed" },
    });
    if (!signed) throw new Error("Signed consent required before editorial approval");
  }

  if (input.decision === "approve_publish") {
    const signed = await prisma.gpStoryConsent.findFirst({
      where: { storyId: story.id, status: "signed" },
    });
    if (!signed) throw new Error("Signed consent required before publish");
  }

  return prisma.$transaction(async (tx) => {
    const event = await tx.gpStoryReviewEvent.create({
      data: {
        storyId: story.id,
        fromStatus: story.status,
        toStatus,
        decision: input.decision,
        reviewerRole: input.reviewerRole,
        reviewerId: input.reviewerId,
        reviewerName: input.reviewerName.trim(),
        rationale: input.rationale.trim(),
        checklistSnapshot: input.checklistSnapshot,
        versionId: input.versionId,
      },
    });

    const storyUpdate: {
      status: GpStoryStatus;
      publishedAt?: Date;
      withdrawnAt?: Date;
      archivedAt?: Date;
    } = { status: toStatus };

    if (toStatus === "published") storyUpdate.publishedAt = new Date();
    if (toStatus === "withdrawn") storyUpdate.withdrawnAt = new Date();
    if (toStatus === "archived") storyUpdate.archivedAt = new Date();

    const updated = await tx.gpStory.update({
      where: { id: story.id },
      data: storyUpdate,
    });

    if (input.decision === "approve_advance" && toStatus === "approved" && input.versionId) {
      await tx.gpStoryVersion.update({
        where: { id: input.versionId },
        data: { editorialApprovedAt: new Date() },
      });
    }
    if (story.status === "gp_review" && input.decision === "approve_advance" && input.versionId) {
      await tx.gpStoryVersion.update({
        where: { id: input.versionId },
        data: { gpApprovedAt: new Date() },
      });
    }

    return { event, story: updated };
  });
}
