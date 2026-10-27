import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ClinicalReview, Page } from "@prisma/client";
import {
  buildPracticeGovernanceManagementReport,
  segmentForCollection,
} from "./management-report";

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

describe("governance management report (3G)", () => {
  it("maps collections to Services, Health Advice, Patient Information, Practitioners, Updates", () => {
    assert.equal(segmentForCollection("service"), "services");
    assert.equal(segmentForCollection("knowledge_article"), "health_advice");
    assert.equal(segmentForCollection("knowledge_topic"), "health_advice");
    assert.equal(segmentForCollection("practice_information"), "patient_information");
    assert.equal(segmentForCollection("faq"), "patient_information");
    assert.equal(segmentForCollection("practitioner"), "practitioners");
    assert.equal(segmentForCollection("update"), "updates");
  });

  it("reports awaiting, due, expired, ownership, approval, and metadata gaps with breakdowns and monthly workload", () => {
    const now = new Date("2026-10-26T02:00:00.000Z");
    const report = buildPracticeGovernanceManagementReport(
      [
        review({
          path: "doctors/dr-a.html",
          collection: "practitioner",
          status: "draft",
        }),
        review({
          path: "services/skin-checks.html",
          collection: "service",
          status: "approved",
          reviewedBy: "Clinical Team",
          contentOwner: "Practice management",
          lastReviewed: new Date("2026-09-01T00:00:00.000Z"),
          nextReview: new Date("2026-11-15T00:00:00.000Z"),
          approvedBy: "Approver",
          approvedAt: new Date("2026-09-02T00:00:00.000Z"),
          evidenceReference: "secure/1",
          reviewedContentSha256: "a".repeat(64),
        }),
        review({
          path: "knowledge/articles/diabetes.html",
          collection: "knowledge_article",
          status: "published",
          reviewedBy: "Clinical Team",
          contentOwner: "Practice management",
          lastReviewed: new Date("2025-01-01T00:00:00.000Z"),
          nextReview: new Date("2026-09-01T00:00:00.000Z"),
          approvedBy: "Approver",
          approvedAt: new Date("2025-01-02T00:00:00.000Z"),
          evidenceReference: "secure/2",
          reviewedContentSha256: "b".repeat(64),
        }),
        review({
          path: "fees-billing.html",
          collection: "practice_information",
          status: "under_review",
          reviewedBy: "Ops",
          contentOwner: null,
          lastReviewed: null,
          nextReview: null,
        }),
        review({
          path: "updates/october.html",
          collection: "update",
          status: "approved",
          reviewedBy: "Editor",
          contentOwner: "Comms",
          lastReviewed: new Date("2026-10-01T00:00:00.000Z"),
          nextReview: new Date("2026-12-01T00:00:00.000Z"),
          approvedBy: null,
          approvedAt: null,
          evidenceReference: "secure/3",
        }),
      ],
      60,
      now,
    );

    assert.equal(report.dashboard, "governance_management");
    assert.equal(report.totals.total, 5);
    assert.ok(report.totals.awaiting_review >= 2);
    assert.equal(report.totals.due_within_60_days, 2);
    assert.equal(report.totals.expired, 1);
    assert.ok(report.totals.missing_ownership >= 2);
    assert.ok(report.totals.missing_approval >= 2);
    assert.ok(report.totals.missing_review_metadata >= 2);

    const labels = report.breakdowns.map((row) => row.label);
    assert.ok(labels.includes("Services"));
    assert.ok(labels.includes("Health Advice"));
    assert.ok(labels.includes("Patient Information"));
    assert.ok(labels.includes("Practitioners"));
    assert.ok(labels.includes("Updates"));

    assert.equal(report.pages_expired[0]?.path, "knowledge/articles/diabetes.html");
    assert.ok(report.pages_due_within_60_days.some((row) => row.path === "services/skin-checks.html"));
    assert.ok(report.pages_due_within_60_days.some((row) => row.path === "updates/october.html"));
    assert.ok(report.pages_missing_ownership.some((row) => row.path === "fees-billing.html"));
    assert.ok(report.pages_missing_approval.some((row) => row.path === "updates/october.html"));
    assert.ok(report.workload_by_month.some((row) => row.month === "2026-11" && row.due_count >= 1));
    assert.ok(report.workload_by_month.some((row) => row.month === "2026-09" && row.expired_in_month >= 1));
    assert.equal(report.calendar_month, "2026-10");
    assert.ok(report.review_calendar.length >= 28);
    assert.ok(report.review_calendar.every((day) => day.date.startsWith("2026-10-")));
  });
});
