import type { ClinicalReview, Page } from "@prisma/client";
import type { GovernancePublishSource } from "@/governance/publish-registry";

/**
 * Fixture ClinicalReview rows for publication capability tests only.
 * These are NOT live practice approvals and must never be written to
 * production governance-published.js without authorised staff sign-off.
 */
function baseReview(
  overrides: Partial<ClinicalReview> & { page: Pick<Page, "path"> },
): GovernancePublishSource {
  const now = new Date("2026-10-01T00:00:00.000Z");
  return {
    id: "sample-review",
    clinicId: "clinic-sample",
    pageId: "page-sample",
    collection: "service",
    reviewType: "clinical",
    status: "approved",
    reviewedBy: "Woolloongabba Medical Centre Clinical Team",
    contentOwner: "Practice management",
    lastReviewed: now,
    nextReview: new Date("2027-04-01T00:00:00.000Z"),
    contentOwnerSubmittedBy: "Sample Owner",
    contentOwnerSubmittedAt: new Date("2026-09-20T00:00:00.000Z"),
    reviewerSignedBy: "Sample Reviewer",
    reviewerSignedAt: now,
    approvedBy: "Practice Approver",
    approvedAt: now,
    approvalReference: "SAMPLE-APPROVAL-REF",
    evidenceReference: "SAMPLE-EVIDENCE-REF",
    reviewedContentSha256: "a".repeat(64),
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/** Three pages that should appear in a published public bundle. */
export function samplePublishedGovernanceSources(
  now = new Date("2026-10-26T00:00:00.000Z"),
): GovernancePublishSource[] {
  void now;
  return [
    baseReview({
      id: "sample-womens-health",
      pageId: "page-womens",
      page: { path: "services/womens-health.html" },
      reviewedBy: "Woolloongabba Medical Centre Clinical Team",
      contentOwner: "Women's health clinical lead",
      lastReviewed: new Date("2026-09-15T00:00:00.000Z"),
      reviewerSignedAt: new Date("2026-09-15T00:00:00.000Z"),
      approvedAt: new Date("2026-09-16T00:00:00.000Z"),
      nextReview: new Date("2027-03-16T00:00:00.000Z"),
      reviewedContentSha256: "b".repeat(64),
    }),
    baseReview({
      id: "sample-telehealth",
      pageId: "page-telehealth",
      page: { path: "telehealth.html" },
      reviewType: "operational",
      reviewedBy: "Practice operations",
      contentOwner: "Patient services",
      lastReviewed: new Date("2026-10-01T00:00:00.000Z"),
      reviewerSignedAt: new Date("2026-10-01T00:00:00.000Z"),
      approvedAt: new Date("2026-10-02T00:00:00.000Z"),
      nextReview: new Date("2027-04-02T00:00:00.000Z"),
      reviewedContentSha256: "c".repeat(64),
    }),
    baseReview({
      id: "sample-privacy",
      pageId: "page-privacy",
      page: { path: "patient-information/privacy.html" },
      reviewType: "institutional",
      status: "published",
      reviewedBy: "Practice management",
      contentOwner: "Practice management",
      lastReviewed: new Date("2026-08-01T00:00:00.000Z"),
      reviewerSignedAt: new Date("2026-08-01T00:00:00.000Z"),
      approvedAt: new Date("2026-08-02T00:00:00.000Z"),
      nextReview: new Date("2027-02-02T00:00:00.000Z"),
      reviewedContentSha256: "d".repeat(64),
    }),
  ];
}

/** Incomplete / unsafe rows that must never enter the public bundle. */
export function sampleFailClosedGovernanceSources(): GovernancePublishSource[] {
  return [
    baseReview({
      id: "draft",
      status: "draft",
      page: { path: "services/draft-only.html" },
    }),
    baseReview({
      id: "missing-owner",
      contentOwner: null,
      page: { path: "services/no-owner.html" },
    }),
    baseReview({
      id: "placeholder-reviewer",
      reviewedBy: "TBD",
      page: { path: "services/placeholder-reviewer.html" },
    }),
    baseReview({
      id: "overdue",
      nextReview: new Date("2026-01-01T00:00:00.000Z"),
      approvedAt: new Date("2025-06-01T00:00:00.000Z"),
      lastReviewed: new Date("2025-06-01T00:00:00.000Z"),
      reviewerSignedAt: new Date("2025-06-01T00:00:00.000Z"),
      page: { path: "services/overdue.html" },
    }),
    baseReview({
      id: "no-evidence",
      evidenceReference: null,
      page: { path: "services/no-evidence.html" },
    }),
    baseReview({
      id: "no-fingerprint",
      reviewedContentSha256: null,
      page: { path: "services/no-fingerprint.html" },
    }),
  ];
}
