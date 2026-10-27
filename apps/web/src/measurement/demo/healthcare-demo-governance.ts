import type { ClinicalReview, ContentCollection, Page } from "@prisma/client";

export type DemoGovernanceRow = ClinicalReview & { page: Pick<Page, "path" | "title"> };

function daysFrom(iso: string, days: number): Date {
  const base = new Date(`${iso}T00:00:00.000Z`);
  base.setUTCDate(base.getUTCDate() + days);
  return base;
}

/**
 * Synthetic clinical-review rows for Governance Demo mode (C9).
 * Separate from Prisma production reviews — never written to the database.
 */
export function buildHealthcareDemoGovernanceRows(
  now = new Date(),
  clinicId = "demo-clinic",
): DemoGovernanceRow[] {
  const today = now.toISOString().slice(0, 10);
  const stamp = new Date(`${today}T00:00:00.000Z`);

  function row(
    path: string,
    title: string,
    collection: ContentCollection,
    overrides: Partial<ClinicalReview> = {},
  ): DemoGovernanceRow {
    return {
      id: overrides.id ?? `demo-${path}`,
      clinicId,
      pageId: overrides.pageId ?? `demo-page-${path}`,
      collection,
      reviewType: overrides.reviewType ?? "clinical",
      status: overrides.status ?? "approved",
      reviewedBy: overrides.reviewedBy !== undefined ? overrides.reviewedBy : "Clinical Team",
      contentOwner:
        overrides.contentOwner !== undefined ? overrides.contentOwner : "Practice management",
      lastReviewed:
        overrides.lastReviewed !== undefined ? overrides.lastReviewed : daysFrom(today, -90),
      nextReview: overrides.nextReview !== undefined ? overrides.nextReview : daysFrom(today, 30),
      contentOwnerSubmittedBy: null,
      contentOwnerSubmittedAt: null,
      reviewerSignedBy: null,
      reviewerSignedAt:
        overrides.reviewerSignedAt !== undefined ? overrides.reviewerSignedAt : daysFrom(today, -89),
      approvedBy: overrides.approvedBy !== undefined ? overrides.approvedBy : "Practice Approver",
      approvedAt: overrides.approvedAt !== undefined ? overrides.approvedAt : daysFrom(today, -88),
      approvalReference: overrides.approvalReference ?? "demo-approval",
      evidenceReference: overrides.evidenceReference ?? "secure/demo",
      reviewedContentSha256: overrides.reviewedContentSha256 ?? "a".repeat(64),
      createdAt: stamp,
      updatedAt: stamp,
      page: { path, title },
    };
  }

  return [
    row("doctors/dr-tanya-goodwill.html", "Dr Tanya Goodwill", "practitioner", {
      status: "published",
      nextReview: daysFrom(today, 45),
    }),
    row("doctors/dr-sumita-singh.html", "Dr Sumita Singh", "practitioner", {
      status: "draft",
      contentOwner: null,
      approvedBy: null,
      approvedAt: null,
      nextReview: null,
      lastReviewed: null,
    }),
    row("services/skin-checks.html", "Skin checks", "service", {
      status: "approved",
      nextReview: daysFrom(today, 20),
    }),
    row("services/womens-health.html", "Women's health", "service", {
      status: "published",
      nextReview: daysFrom(today, -12),
      lastReviewed: daysFrom(today, -190),
    }),
    row("services/mental-health.html", "Mental health", "service", {
      status: "approved",
      nextReview: daysFrom(today, 55),
    }),
    row("services/diabetes.html", "Diabetes", "service", {
      status: "draft",
      reviewedBy: null,
      approvedBy: null,
      approvedAt: null,
      nextReview: null,
      lastReviewed: null,
      contentOwner: "Chronic care lead",
    }),
    row(
      "knowledge/articles/when-should-i-book-a-skin-check.html",
      "When should I book a skin check?",
      "knowledge_article",
      {
        status: "published",
        nextReview: daysFrom(today, -5),
        lastReviewed: daysFrom(today, -200),
      },
    ),
    row(
      "knowledge/articles/preparing-for-a-diabetes-review.html",
      "Preparing for a diabetes review",
      "knowledge_article",
      {
        status: "approved",
        nextReview: daysFrom(today, 40),
      },
    ),
    row("new-patients.html", "New patients", "practice_information", {
      status: "published",
      nextReview: daysFrom(today, 10),
      contentOwner: null,
    }),
    row("fees-billing.html", "Fees & billing", "practice_information", {
      status: "approved",
      nextReview: daysFrom(today, 70),
    }),
    row("telehealth.html", "Telehealth", "practice_information", {
      status: "draft",
      contentOwner: "Reception lead",
      approvedBy: null,
      approvedAt: null,
      nextReview: daysFrom(today, 25),
    }),
    row("updates/flu-clinic-open.html", "Flu clinic open", "update", {
      status: "published",
      nextReview: daysFrom(today, 15),
    }),
  ];
}

export const HEALTHCARE_DEMO_GOVERNANCE_META = {
  id: "wmc-healthcare-demo-governance-v1",
  label: "Healthcare demo governance queues",
  description: "Synthetic review rows spanning practitioners, services, advice, patient info, and updates.",
  storage: "apps/web/src/measurement/demo/healthcare-demo-governance.ts",
} as const;
