import type { ClinicalReview, Page } from "@prisma/client";
import { toPublicGovernanceFields } from "@/governance/public-fields";

/** Shape consumed by `site.js` via `window.WMC_APPROVED_GOVERNANCE`. */
export type PublicGovernanceBundleEntry = {
  status: "approved";
  reviewedBy: string;
  lastReviewed: string;
  nextReview: string;
  contentOwner: string;
};

export type PublicGovernanceBundle = Record<string, PublicGovernanceBundleEntry>;

export type GovernancePublishSource = ClinicalReview & {
  page: Pick<Page, "path">;
};

const BRISBANE = "Australia/Brisbane";
const PLACEHOLDERS = new Set(["[date]", "[department]", "[reviewer]", "tbd", "todo", "placeholder"]);

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

function isPlaceholder(value: string): boolean {
  return PLACEHOLDERS.has(value.trim().toLowerCase()) || value.trim().length < 3;
}

/**
 * Fail-closed public strip readiness for the four patient-facing fields.
 * Private evidence (approver, fingerprint, references) is checked via toPublicGovernanceFields.
 */
export function publicStripFieldGaps(
  fields: { reviewedBy: string; contentOwner: string; lastReviewed: string; nextReviewDue: string } | null,
  now = new Date(),
): string[] {
  if (!fields) return ["Approved governance evidence is incomplete."];
  const gaps: string[] = [];
  if (isPlaceholder(fields.reviewedBy)) gaps.push("Reviewed By is missing or a placeholder.");
  if (isPlaceholder(fields.contentOwner)) gaps.push("Content Owner is missing or a placeholder.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fields.lastReviewed)) gaps.push("Last Reviewed must be YYYY-MM-DD.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fields.nextReviewDue)) gaps.push("Next Review Due must be YYYY-MM-DD.");
  if (fields.nextReviewDue <= fields.lastReviewed) {
    gaps.push("Next Review Due must be later than Last Reviewed.");
  }
  const today = brisbaneTodayIso(now);
  if (fields.nextReviewDue < today) {
    gaps.push("Next Review Due has passed; complete a new review before public attribution.");
  }
  return gaps;
}

/**
 * Build the public registry from ClinicalReview rows.
 * Incomplete, draft, overdue, or private-only records are omitted (fail-closed).
 */
export function buildPublicGovernanceBundle(
  rows: readonly GovernancePublishSource[],
  now = new Date(),
): { bundle: PublicGovernanceBundle; included: number; omitted: number } {
  const bundle: PublicGovernanceBundle = {};
  let omitted = 0;

  for (const row of rows) {
    const fields = toPublicGovernanceFields(row);
    const gaps = publicStripFieldGaps(fields, now);
    if (!fields || gaps.length > 0) {
      omitted += 1;
      continue;
    }
    bundle[row.page.path] = {
      status: "approved",
      reviewedBy: fields.reviewedBy,
      lastReviewed: fields.lastReviewed,
      nextReview: fields.nextReviewDue,
      contentOwner: fields.contentOwner,
    };
  }

  return { bundle, included: Object.keys(bundle).length, omitted };
}

/** Stable JS payload for `governance-published.js` (apps/web/public + old-html). */
export function renderGovernancePublishedJs(bundle: PublicGovernanceBundle): string {
  const ordered = Object.fromEntries(Object.entries(bundle).sort(([a], [b]) => a.localeCompare(b)));
  const data = JSON.stringify(ordered)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026");
  return (
    "/* Generated from approved ClinicalReview records.\n" +
    "   Do not edit; never include private evidence or draft reviews. */\n" +
    `window.WMC_APPROVED_GOVERNANCE = Object.freeze(${data});\n`
  );
}
