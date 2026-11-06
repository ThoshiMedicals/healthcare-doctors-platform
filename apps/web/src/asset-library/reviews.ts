import type {
  AttractionAssetReviewDecision,
  AttractionAssetStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/db/prisma";
import { isHumanReviewerId } from "@/attraction-cms/schema-rules";
import { LIFECYCLE_TRANSITIONS, nextReviewDate, publishBlockedReasons } from "./lifecycle";

export async function recordAssetReview(input: {
  clinicId: string;
  assetRowId: string;
  decision: AttractionAssetReviewDecision;
  reviewerId: string;
  reviewerName: string;
  rationale: string;
  checklistJson?: Prisma.InputJsonValue;
}) {
  if (!isHumanReviewerId(input.reviewerId)) {
    throw new Error("Human review only — reviewerId cannot be system/auto");
  }
  if (!input.rationale.trim()) throw new Error("rationale required");

  const asset = await prisma.attractionAsset.findFirst({
    where: { id: input.assetRowId, clinicId: input.clinicId },
  });
  if (!asset) throw new Error("Asset not found");

  const transition = LIFECYCLE_TRANSITIONS[input.decision];
  if (!transition) throw new Error(`Unknown decision ${input.decision}`);
  if (!transition.from.includes(asset.status)) {
    throw new Error(`Decision ${input.decision} not allowed from ${asset.status}`);
  }

  if (input.decision === "publish") {
    const blockers = publishBlockedReasons({
      rightsClass: asset.rightsClass,
      consentRecordId: asset.consentRecordId,
      altText: asset.altText,
      caption: asset.caption,
      kind: asset.kind,
      quoteText: asset.quoteText,
    });
    if (blockers.length) {
      throw new Error(`Publish blocked: ${blockers.join("; ")}`);
    }
  }

  const toStatus = transition.to as AttractionAssetStatus;

  return prisma.$transaction(async (tx) => {
    const event = await tx.attractionAssetReviewEvent.create({
      data: {
        assetId: asset.id,
        fromStatus: asset.status,
        toStatus,
        decision: input.decision,
        reviewerId: input.reviewerId,
        reviewerName: input.reviewerName.trim(),
        rationale: input.rationale.trim(),
        checklistJson: input.checklistJson,
      },
    });

    const data: {
      status: AttractionAssetStatus;
      lastReviewedAt?: Date;
      nextReviewAt?: Date | null;
      withdrawnAt?: Date | null;
      placeholderKind?: string | null;
    } = { status: toStatus };

    if (["approve", "publish", "mark_review_due"].includes(input.decision)) {
      data.lastReviewedAt = new Date();
      data.nextReviewAt = nextReviewDate(new Date(), asset.kind);
    }
    if (input.decision === "withdraw") {
      data.withdrawnAt = new Date();
    }
    if (input.decision === "replace_placeholder") {
      data.placeholderKind = "pending_shoot";
    }

    const updated = await tx.attractionAsset.update({
      where: { id: asset.id },
      data,
    });

    return { event, asset: updated };
  });
}
