import type { ClinicalReview } from "@prisma/client";

export type PublicGovernanceFields = {
  reviewedBy: string;
  contentOwner: string;
  lastReviewed: string;
  nextReviewDue: string;
};

function dateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}

/**
 * The only governance fields allowed on a public page.
 * Returns null until reviewer sign-off, practice approval, evidence, and a content fingerprint exist.
 */
export function toPublicGovernanceFields(review: ClinicalReview): PublicGovernanceFields | null {
  if (review.status !== "approved" && review.status !== "published") return null;
  if (!review.reviewedBy || !review.contentOwner || !review.lastReviewed || !review.nextReview) return null;
  if (!review.reviewerSignedAt || !review.approvedAt) return null;
  if (!review.approvalReference || !review.evidenceReference || !review.reviewedContentSha256) return null;
  if (review.nextReview <= review.approvedAt) return null;

  return {
    reviewedBy: review.reviewedBy,
    contentOwner: review.contentOwner,
    lastReviewed: dateOnly(review.lastReviewed),
    nextReviewDue: dateOnly(review.nextReview),
  };
}
