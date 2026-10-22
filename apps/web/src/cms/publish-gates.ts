import { governanceCompletionGaps } from "../governance/status";

export type PublishGateInput = {
  reviewer: string | null;
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

export type PublishGateResult = { ok: true } | { ok: false; reasons: string[] };

export type ContentPublicationEvidence = {
  reviewedBy: string | null;
  reviewerSignedAt: Date | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  approvalReference: string | null;
  evidenceReference: string | null;
  contentOwner: string | null;
  reviewedContentSha256: string | null;
  contentSha256: string | null;
  pagePath: string | null;
  nextReview: Date | null;
  publisherName: string | null;
  releaseChecksAccepted: boolean;
  linksVerified: boolean;
};

/**
 * Fail-closed release gate. A page is stored only after this returns ok.
 * Passing the gate does not compile HTML.
 */
export function evaluatePublishGates(input: PublishGateInput): PublishGateResult {
  const reasons: string[] = [];

  if (!input.reviewer?.trim()) reasons.push("Reviewer is required.");
  if (!input.evidenceReference?.trim()) reasons.push("Evidence reference is required.");
  if (!validDate(input.approvedAt)) reasons.push("Approval date is required.");
  if (!input.approvalReference?.trim()) reasons.push("Approval reference is required.");
  if (!input.contentSha256 || !input.reviewedContentSha256) {
    reasons.push("Content fingerprint and reviewed fingerprint are required.");
  } else if (input.contentSha256 !== input.reviewedContentSha256) {
    reasons.push("Reviewed content fingerprint does not match the current content.");
  }
  if (!input.contentOwner?.trim()) reasons.push("Content owner is required.");
  if (!validDate(input.dueDate)) reasons.push("Due date is required.");
  if (!input.articlePath?.trim() || input.articlePath.includes("..")) {
    reasons.push("A safe article path is required.");
  }
  if (!validDate(input.reviewerSignedAt)) reasons.push("Clinical or operational reviewer sign-off is required.");
  if (validDate(input.reviewerSignedAt) && validDate(input.approvedAt) && utcDay(input.approvedAt) < utcDay(input.reviewerSignedAt)) {
    reasons.push("Practice approval must follow reviewer sign-off.");
  }
  if (!input.sourceVerificationComplete) reasons.push("Source verification is incomplete.");
  if (!input.seoReviewComplete) reasons.push("SEO review is incomplete.");
  if (!input.accessibilityReviewComplete) reasons.push("Accessibility review is incomplete.");
  if (!input.internalLinksVerified) reasons.push("Internal links are not verified.");
  if (!validDate(input.nextReviewDate) || !validDate(input.publicationDate) || input.nextReviewDate <= input.publicationDate) {
    reasons.push("Next review date must be later than the publication date.");
  }
  if (!input.liveVerifiedBy?.trim()) {
    reasons.push("A named operator must confirm the deployment.");
  }

  return reasons.length === 0 ? { ok: true } : { ok: false, reasons };
}

/**
 * Same gate for every published record. The approval date is the recorded
 * release deadline, and the evidence reference is the source-verification
 * record. Structural release checks still have to pass on their own.
 */
export function evaluateContentPublication(evidence: ContentPublicationEvidence): PublishGateResult {
  const gate = evaluatePublishGates({
    reviewer: evidence.reviewedBy,
    contentOwner: evidence.contentOwner,
    dueDate: evidence.approvedAt,
    articlePath: evidence.pagePath,
    contentSha256: evidence.contentSha256,
    reviewedContentSha256: evidence.reviewedContentSha256,
    reviewerSignedAt: evidence.reviewerSignedAt,
    approvedAt: evidence.approvedAt,
    approvalReference: evidence.approvalReference,
    evidenceReference: evidence.evidenceReference,
    sourceVerificationComplete: Boolean(evidence.evidenceReference?.trim()),
    seoReviewComplete: evidence.releaseChecksAccepted,
    accessibilityReviewComplete: evidence.releaseChecksAccepted,
    internalLinksVerified: evidence.linksVerified,
    nextReviewDate: evidence.nextReview,
    publicationDate: evidence.approvedAt,
    liveVerifiedBy: evidence.publisherName,
  });
  const gaps = governanceCompletionGaps({
    reviewedBy: evidence.reviewedBy,
    approvedBy: evidence.approvedBy,
    approvedAt: evidence.approvedAt,
    evidenceReference: evidence.evidenceReference,
    fingerprint: evidence.reviewedContentSha256,
  });
  const reasons = [...(gate.ok ? [] : gate.reasons), ...gaps.filter((gap) => (gate.ok ? true : !gate.reasons.includes(gap)))];
  return reasons.length === 0 ? { ok: true } : { ok: false, reasons };
}

export type ImagePublicationEvidence = {
  reviewedBy: string | null;
  evidenceReference: string | null;
  approvedAt: Date | null;
  proposalSha256: string | null;
  reviewedSha256: string | null;
  storagePath: string | null;
  publisherName: string | null;
  /** True only after the replacement file has passed the existing format and size checks. */
  fileChecksAccepted: boolean;
};

/**
 * Same reviewer, evidence, approval date, and fingerprint gate as page
 * publication. The fingerprint is the proposed file signature.
 */
export function evaluateImagePublication(evidence: ImagePublicationEvidence): PublishGateResult {
  const nextReview = validDate(evidence.approvedAt) ? new Date(evidence.approvedAt.getTime() + 24 * 60 * 60 * 1000) : null;
  const decision = evaluateContentPublication({
    reviewedBy: evidence.reviewedBy,
    reviewerSignedAt: evidence.approvedAt,
    approvedBy: evidence.reviewedBy,
    approvedAt: evidence.approvedAt,
    approvalReference: evidence.evidenceReference,
    evidenceReference: evidence.evidenceReference,
    contentOwner: evidence.reviewedBy,
    reviewedContentSha256: evidence.reviewedSha256,
    contentSha256: evidence.proposalSha256,
    pagePath: evidence.storagePath,
    nextReview,
    publisherName: evidence.publisherName,
    releaseChecksAccepted: evidence.fileChecksAccepted,
    linksVerified: evidence.fileChecksAccepted,
  });
  if (decision.ok) return decision;
  const reasons = [...new Set(decision.reasons.map(imageReason))];
  const shown = reasons.filter((reason) => IMAGE_REASONS.has(reason));
  return { ok: false, reasons: shown.length > 0 ? shown : reasons };
}

const IMAGE_REASONS = new Set([
  "Reviewer is required.",
  "Evidence reference is required.",
  "Approval date is required.",
  "Image fingerprint is required.",
  "Reviewed image fingerprint does not match the proposed file.",
]);

function imageReason(reason: string): string {
  if (reason === "Reviewed content fingerprint does not match the current content.") {
    return "Reviewed image fingerprint does not match the proposed file.";
  }
  if (reason === "Content fingerprint and reviewed fingerprint are required." || reason === "Fingerprint is required.") {
    return "Image fingerprint is required.";
  }
  return reason;
}

function validDate(value: Date | null): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

/** Approval is stored as a calendar date, so same-day sign-off still follows. */
function utcDay(value: Date): number {
  return Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate());
}
