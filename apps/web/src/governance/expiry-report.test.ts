import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildGovernanceExpiryReport } from "./expiry-report";
import type { ClinicalReview, Page } from "@prisma/client";

function review(
  overrides: Partial<ClinicalReview> & { path: string; title?: string },
): ClinicalReview & { page: Pick<Page, "path" | "title"> } {
  const now = new Date("2026-10-25T00:00:00.000Z");
  return {
    id: overrides.id || overrides.path,
    clinicId: "clinic",
    pageId: overrides.path,
    collection: overrides.collection ?? "practitioner",
    reviewType: overrides.reviewType ?? "clinical",
    status: overrides.status ?? "draft",
    reviewedBy: overrides.reviewedBy ?? null,
    contentOwner: overrides.contentOwner ?? null,
    lastReviewed: overrides.lastReviewed ?? null,
    nextReview: overrides.nextReview ?? null,
    contentOwnerSubmittedBy: null,
    contentOwnerSubmittedAt: null,
    reviewerSignedBy: null,
    reviewerSignedAt: overrides.reviewerSignedAt ?? null,
    approvedBy: overrides.approvedBy ?? null,
    approvedAt: overrides.approvedAt ?? null,
    approvalReference: overrides.approvalReference ?? null,
    evidenceReference: overrides.evidenceReference ?? null,
    reviewedContentSha256: overrides.reviewedContentSha256 ?? null,
    createdAt: now,
    updatedAt: now,
    page: { path: overrides.path, title: overrides.title || overrides.path },
  };
}

describe("buildGovernanceExpiryReport", () => {
  it("keeps incomplete reviews hidden until approval", () => {
    const report = buildGovernanceExpiryReport(
      [review({ path: "doctors/dr-tanya-goodwill.html", status: "draft" })],
      60,
      new Date("2026-10-25T00:00:00.000Z"),
    );
    assert.equal(report.counts.hidden_until_approved, 1);
    assert.equal(report.rows[0]?.publicVisible, false);
  });

  it("flags overdue and due-soon approved reviews", () => {
    const report = buildGovernanceExpiryReport(
      [
        review({
          path: "doctors/dr-a.html",
          status: "approved",
          reviewedBy: "Clinical Team",
          contentOwner: "Practice management",
          lastReviewed: new Date("2025-01-01T00:00:00.000Z"),
          nextReview: new Date("2026-09-01T00:00:00.000Z"),
          reviewerSignedAt: new Date("2025-01-01T00:00:00.000Z"),
          approvedBy: "Approver",
          approvedAt: new Date("2025-01-02T00:00:00.000Z"),
          approvalReference: "APR-1",
          evidenceReference: "secure/apr-1",
          reviewedContentSha256: "a".repeat(64),
        }),
        review({
          path: "doctors/dr-b.html",
          status: "approved",
          reviewedBy: "Clinical Team",
          contentOwner: "Practice management",
          lastReviewed: new Date("2026-09-01T00:00:00.000Z"),
          nextReview: new Date("2026-11-15T00:00:00.000Z"),
          reviewerSignedAt: new Date("2026-09-01T00:00:00.000Z"),
          approvedBy: "Approver",
          approvedAt: new Date("2026-09-02T00:00:00.000Z"),
          approvalReference: "APR-2",
          evidenceReference: "secure/apr-2",
          reviewedContentSha256: "b".repeat(64),
        }),
      ],
      60,
      new Date("2026-10-25T00:00:00.000Z"),
    );

    assert.equal(report.counts.overdue, 1);
    assert.equal(report.counts.due_within_horizon, 1);
    assert.equal(report.rows.find((row) => row.path.endsWith("dr-a.html"))?.publicVisible, false);
    assert.equal(report.rows.find((row) => row.path.endsWith("dr-b.html"))?.publicVisible, true);
  });
});
