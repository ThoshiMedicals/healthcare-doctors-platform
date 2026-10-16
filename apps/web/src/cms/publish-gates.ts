export type PublishGateInput = {
  contentOwner: string | null;
  dueDate: Date | null;
  articlePath: string | null;
  contentSha256: string | null;
  reviewedContentSha256: string | null;
  reviewerSignedAt: Date | null;
  approvedAt: Date | null;
  approvalReference: string | null;
  evidenceReference: string | null;
  sourceVerificationComplete: boolean;
  seoReviewComplete: boolean;
  accessibilityReviewComplete: boolean;
  internalLinksVerified: boolean;
  nextReviewDate: Date | null;
  publicationDate: Date | null;
  liveVerifiedBy: string | null;
};

export type PublishGateResult =
  | { ok: true }
  | { ok: false; reasons: string[] };

/**
 * Mirrors the approved publishing gate. Passing gates does not compile HTML
 * during the infrastructure phase.
 */
export function evaluatePublishGates(input: PublishGateInput): PublishGateResult {
  const reasons: string[] = [];

  if (!input.contentOwner?.trim()) reasons.push("Content owner is required.");
  if (!input.dueDate) reasons.push("Due date is required.");
  if (!input.articlePath?.trim() || input.articlePath.includes("..")) {
    reasons.push("A safe article path is required.");
  }
  if (!input.contentSha256 || !input.reviewedContentSha256) {
    reasons.push("Content fingerprint and reviewed fingerprint are required.");
  } else if (input.contentSha256 !== input.reviewedContentSha256) {
    reasons.push("Reviewed content fingerprint does not match the current content.");
  }
  if (!input.reviewerSignedAt) reasons.push("Clinical or operational reviewer sign-off is required.");
  if (!input.approvedAt || !input.approvalReference?.trim()) {
    reasons.push("Practice approval name, date, and reference are required.");
  }
  if (input.reviewerSignedAt && input.approvedAt && input.approvedAt < input.reviewerSignedAt) {
    reasons.push("Practice approval must follow reviewer sign-off.");
  }
  if (!input.evidenceReference?.trim()) reasons.push("Evidence reference is required.");
  if (!input.sourceVerificationComplete) reasons.push("Source verification is incomplete.");
  if (!input.seoReviewComplete) reasons.push("SEO review is incomplete.");
  if (!input.accessibilityReviewComplete) reasons.push("Accessibility review is incomplete.");
  if (!input.internalLinksVerified) reasons.push("Internal links are not verified.");
  if (!input.nextReviewDate || !input.publicationDate || input.nextReviewDate <= input.publicationDate) {
    reasons.push("Next review date must be later than the publication date.");
  }
  if (!input.liveVerifiedBy?.trim()) {
    reasons.push("A named operator must confirm the deployment.");
  }

  return reasons.length === 0 ? { ok: true } : { ok: false, reasons };
}
