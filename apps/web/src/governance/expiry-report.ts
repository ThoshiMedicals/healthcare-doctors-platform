import type { ClinicalReview, Page } from "@prisma/client";
import { toPublicGovernanceFields } from "@/governance/public-fields";

const BRISBANE = "Australia/Brisbane";

export type GovernanceExpiryBucket = "overdue" | "due_within_horizon" | "current" | "hidden_until_approved";

export type GovernanceExpiryRow = {
  id: string;
  path: string;
  title: string;
  status: string;
  collection: string | null;
  reviewedBy: string | null;
  contentOwner: string | null;
  lastReviewed: string | null;
  nextReviewDue: string | null;
  daysRemaining: number | null;
  bucket: GovernanceExpiryBucket;
  publicVisible: boolean;
};

function brisbaneTodayIso(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: BRISBANE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (type: string) => parts.find((part) => part.type === type)?.value || "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function dateOnly(value: Date | null | undefined): string | null {
  if (!value || Number.isNaN(value.getTime())) return null;
  return value.toISOString().slice(0, 10);
}

function daysBetween(fromIso: string, toIso: string): number {
  const from = Date.parse(`${fromIso}T00:00:00Z`);
  const to = Date.parse(`${toIso}T00:00:00Z`);
  return Math.round((to - from) / 86_400_000);
}

export function buildGovernanceExpiryReport(
  rows: Array<ClinicalReview & { page: Pick<Page, "path" | "title"> }>,
  horizonDays = 60,
  now = new Date(),
): {
  generatedOn: string;
  horizonDays: number;
  counts: Record<GovernanceExpiryBucket | "total", number>;
  rows: GovernanceExpiryRow[];
} {
  const today = brisbaneTodayIso(now);
  const reportRows: GovernanceExpiryRow[] = rows.map((row) => {
    const publicFields = toPublicGovernanceFields(row);
    const nextReviewDue = publicFields?.nextReviewDue ?? dateOnly(row.nextReview);
    const lastReviewed = publicFields?.lastReviewed ?? dateOnly(row.lastReviewed);
    const daysRemaining = nextReviewDue ? daysBetween(today, nextReviewDue) : null;

    let bucket: GovernanceExpiryBucket = "hidden_until_approved";
    if (publicFields && nextReviewDue && daysRemaining !== null) {
      if (daysRemaining < 0) bucket = "overdue";
      else if (daysRemaining <= horizonDays) bucket = "due_within_horizon";
      else bucket = "current";
    }

    return {
      id: row.id,
      path: row.page.path,
      title: row.page.title,
      status: row.status,
      collection: row.collection,
      reviewedBy: publicFields?.reviewedBy ?? row.reviewedBy,
      contentOwner: publicFields?.contentOwner ?? row.contentOwner,
      lastReviewed,
      nextReviewDue,
      daysRemaining,
      bucket,
      publicVisible: Boolean(publicFields) && bucket !== "overdue",
    };
  });

  const counts: Record<GovernanceExpiryBucket | "total", number> = {
    total: reportRows.length,
    overdue: 0,
    due_within_horizon: 0,
    current: 0,
    hidden_until_approved: 0,
  };
  for (const row of reportRows) counts[row.bucket] += 1;

  reportRows.sort((a, b) => {
    const rank = (bucket: GovernanceExpiryBucket) =>
      bucket === "overdue" ? 0 : bucket === "due_within_horizon" ? 1 : bucket === "current" ? 2 : 3;
    const rankDiff = rank(a.bucket) - rank(b.bucket);
    if (rankDiff) return rankDiff;
    return (a.daysRemaining ?? 9999) - (b.daysRemaining ?? 9999) || a.path.localeCompare(b.path);
  });

  return {
    generatedOn: today,
    horizonDays,
    counts,
    rows: reportRows,
  };
}
