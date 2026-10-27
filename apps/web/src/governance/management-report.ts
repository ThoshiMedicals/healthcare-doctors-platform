import type { ClinicalReview, ContentCollection, Page } from "@prisma/client";

const BRISBANE = "Australia/Brisbane";

export const GOVERNANCE_SEGMENTS = [
  "services",
  "health_advice",
  "patient_information",
  "practitioners",
  "updates",
  "other",
] as const;

export type GovernanceSegment = (typeof GOVERNANCE_SEGMENTS)[number];

export const GOVERNANCE_SEGMENT_LABEL: Record<GovernanceSegment, string> = {
  services: "Services",
  health_advice: "Health Advice",
  patient_information: "Patient Information",
  practitioners: "Practitioners",
  updates: "Updates",
  other: "Other",
};

export type GovernanceManagementFlags = {
  awaiting_review: boolean;
  due_within_60_days: boolean;
  expired: boolean;
  missing_ownership: boolean;
  missing_approval: boolean;
  missing_review_metadata: boolean;
};

export type GovernanceManagementRow = {
  id: string;
  path: string;
  title: string;
  status: string;
  collection: ContentCollection | null;
  segment: GovernanceSegment;
  contentOwner: string | null;
  reviewedBy: string | null;
  approvedBy: string | null;
  lastReviewed: string | null;
  nextReviewDue: string | null;
  daysRemaining: number | null;
  flags: GovernanceManagementFlags;
};

export type SegmentBreakdown = {
  segment: GovernanceSegment;
  label: string;
  total: number;
  awaiting_review: number;
  due_within_60_days: number;
  expired: number;
  missing_ownership: number;
  missing_approval: number;
  missing_review_metadata: number;
};

export type MonthlyWorkloadRow = {
  month: string;
  label: string;
  due_count: number;
  expired_in_month: number;
};

export type ReviewCalendarDay = {
  date: string;
  due_count: number;
  expired_count: number;
};

export type PracticeGovernanceManagementReport = {
  dashboard: "governance_management";
  generated_on: string;
  horizon_days: number;
  calendar_month: string;
  calendar_month_label: string;
  totals: {
    total: number;
    awaiting_review: number;
    due_within_60_days: number;
    expired: number;
    missing_ownership: number;
    missing_approval: number;
    missing_review_metadata: number;
  };
  breakdowns: SegmentBreakdown[];
  workload_by_month: MonthlyWorkloadRow[];
  review_calendar: ReviewCalendarDay[];
  pages_awaiting_review: GovernanceManagementRow[];
  pages_due_within_60_days: GovernanceManagementRow[];
  pages_expired: GovernanceManagementRow[];
  pages_missing_ownership: GovernanceManagementRow[];
  pages_missing_approval: GovernanceManagementRow[];
  pages_missing_review_metadata: GovernanceManagementRow[];
  rows: GovernanceManagementRow[];
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

function addMonthsIso(isoDay: string, months: number): string {
  const [y, m] = isoDay.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1 + months, 1));
  return utc.toISOString().slice(0, 7);
}

function monthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleString("en-AU", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function segmentForCollection(collection: ContentCollection | string | null | undefined): GovernanceSegment {
  switch (collection) {
    case "service":
      return "services";
    case "knowledge_topic":
    case "knowledge_article":
      return "health_advice";
    case "practice_information":
    case "faq":
      return "patient_information";
    case "practitioner":
      return "practitioners";
    case "update":
      return "updates";
    default:
      return "other";
  }
}

function blank(value: string | null | undefined): boolean {
  return !String(value || "").trim();
}

function classifyFlags(
  row: ClinicalReview,
  today: string,
  horizonDays: number,
): { flags: GovernanceManagementFlags; daysRemaining: number | null; nextReviewDue: string | null; lastReviewed: string | null } {
  const nextReviewDue = dateOnly(row.nextReview);
  const lastReviewed = dateOnly(row.lastReviewed);
  const daysRemaining = nextReviewDue ? daysBetween(today, nextReviewDue) : null;

  const awaiting_review = row.status === "draft" || row.status === "under_review" || row.status === "review_due";
  const expired = daysRemaining !== null && daysRemaining < 0;
  const due_within_60_days = daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= horizonDays;
  const missing_ownership = blank(row.contentOwner);
  const missing_approval =
    (row.status !== "approved" && row.status !== "published") || blank(row.approvedBy) || !row.approvedAt;
  const missing_review_metadata =
    blank(row.reviewedBy) || !row.lastReviewed || !row.nextReview || blank(row.evidenceReference);

  return {
    flags: {
      awaiting_review,
      due_within_60_days,
      expired,
      missing_ownership,
      missing_approval,
      missing_review_metadata,
    },
    daysRemaining,
    nextReviewDue,
    lastReviewed,
  };
}

function emptySegment(segment: GovernanceSegment): SegmentBreakdown {
  return {
    segment,
    label: GOVERNANCE_SEGMENT_LABEL[segment],
    total: 0,
    awaiting_review: 0,
    due_within_60_days: 0,
    expired: 0,
    missing_ownership: 0,
    missing_approval: 0,
    missing_review_metadata: 0,
  };
}

function sortByUrgency(a: GovernanceManagementRow, b: GovernanceManagementRow): number {
  const rank = (row: GovernanceManagementRow) => {
    if (row.flags.expired) return 0;
    if (row.flags.due_within_60_days) return 1;
    if (row.flags.awaiting_review) return 2;
    if (row.flags.missing_approval) return 3;
    if (row.flags.missing_ownership || row.flags.missing_review_metadata) return 4;
    return 5;
  };
  return rank(a) - rank(b) || (a.daysRemaining ?? 9999) - (b.daysRemaining ?? 9999) || a.path.localeCompare(b.path);
}

/**
 * Governance-management reporting for practice monitoring.
 * Does not change public attribution or invent review dates.
 */
export function buildPracticeGovernanceManagementReport(
  rows: Array<ClinicalReview & { page: Pick<Page, "path" | "title"> }>,
  horizonDays = 60,
  now = new Date(),
): PracticeGovernanceManagementReport {
  const today = brisbaneTodayIso(now);
  const reportRows: GovernanceManagementRow[] = rows.map((row) => {
    const classified = classifyFlags(row, today, horizonDays);
    return {
      id: row.id,
      path: row.page.path,
      title: row.page.title,
      status: row.status,
      collection: row.collection,
      segment: segmentForCollection(row.collection),
      contentOwner: row.contentOwner,
      reviewedBy: row.reviewedBy,
      approvedBy: row.approvedBy,
      lastReviewed: classified.lastReviewed,
      nextReviewDue: classified.nextReviewDue,
      daysRemaining: classified.daysRemaining,
      flags: classified.flags,
    };
  });

  reportRows.sort(sortByUrgency);

  const totals = {
    total: reportRows.length,
    awaiting_review: 0,
    due_within_60_days: 0,
    expired: 0,
    missing_ownership: 0,
    missing_approval: 0,
    missing_review_metadata: 0,
  };

  const breakdownMap = new Map<GovernanceSegment, SegmentBreakdown>(
    GOVERNANCE_SEGMENTS.map((segment) => [segment, emptySegment(segment)]),
  );

  for (const row of reportRows) {
    if (row.flags.awaiting_review) totals.awaiting_review += 1;
    if (row.flags.due_within_60_days) totals.due_within_60_days += 1;
    if (row.flags.expired) totals.expired += 1;
    if (row.flags.missing_ownership) totals.missing_ownership += 1;
    if (row.flags.missing_approval) totals.missing_approval += 1;
    if (row.flags.missing_review_metadata) totals.missing_review_metadata += 1;

    const bucket = breakdownMap.get(row.segment)!;
    bucket.total += 1;
    if (row.flags.awaiting_review) bucket.awaiting_review += 1;
    if (row.flags.due_within_60_days) bucket.due_within_60_days += 1;
    if (row.flags.expired) bucket.expired += 1;
    if (row.flags.missing_ownership) bucket.missing_ownership += 1;
    if (row.flags.missing_approval) bucket.missing_approval += 1;
    if (row.flags.missing_review_metadata) bucket.missing_review_metadata += 1;
  }

  const monthCounts = new Map<string, { due_count: number; expired_in_month: number }>();
  const startMonth = today.slice(0, 7);
  for (let i = 0; i < 12; i++) {
    const month = addMonthsIso(`${startMonth}-01`, i);
    monthCounts.set(month, { due_count: 0, expired_in_month: 0 });
  }

  for (const row of reportRows) {
    if (!row.nextReviewDue) continue;
    const month = row.nextReviewDue.slice(0, 7);
    const entry = monthCounts.get(month) || { due_count: 0, expired_in_month: 0 };
    if (row.flags.expired) entry.expired_in_month += 1;
    else entry.due_count += 1;
    monthCounts.set(month, entry);
  }

  const workload_by_month: MonthlyWorkloadRow[] = [...monthCounts.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .filter(([month, counts]) => month >= startMonth || counts.due_count > 0 || counts.expired_in_month > 0)
    .map(([month, counts]) => ({
      month,
      label: monthLabel(month),
      due_count: counts.due_count,
      expired_in_month: counts.expired_in_month,
    }));

  const calendar_month = startMonth;
  const [calYear, calMonth] = calendar_month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(calYear, calMonth, 0)).getUTCDate();
  const dayCounts = new Map<string, { due_count: number; expired_count: number }>();
  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${calendar_month}-${String(day).padStart(2, "0")}`;
    dayCounts.set(date, { due_count: 0, expired_count: 0 });
  }
  for (const row of reportRows) {
    if (!row.nextReviewDue || !row.nextReviewDue.startsWith(calendar_month)) continue;
    const entry = dayCounts.get(row.nextReviewDue);
    if (!entry) continue;
    if (row.flags.expired) entry.expired_count += 1;
    else entry.due_count += 1;
  }
  const review_calendar: ReviewCalendarDay[] = [...dayCounts.entries()].map(([date, counts]) => ({
    date,
    due_count: counts.due_count,
    expired_count: counts.expired_count,
  }));

  return {
    dashboard: "governance_management",
    generated_on: today,
    horizon_days: horizonDays,
    calendar_month,
    calendar_month_label: monthLabel(calendar_month),
    totals,
    breakdowns: GOVERNANCE_SEGMENTS.map((segment) => breakdownMap.get(segment)!).filter(
      (row) => row.total > 0 || row.segment !== "other",
    ),
    workload_by_month,
    review_calendar,
    pages_awaiting_review: reportRows.filter((row) => row.flags.awaiting_review),
    pages_due_within_60_days: reportRows.filter((row) => row.flags.due_within_60_days),
    pages_expired: reportRows.filter((row) => row.flags.expired),
    pages_missing_ownership: reportRows.filter((row) => row.flags.missing_ownership),
    pages_missing_approval: reportRows.filter((row) => row.flags.missing_approval),
    pages_missing_review_metadata: reportRows.filter((row) => row.flags.missing_review_metadata),
    rows: reportRows,
  };
}
