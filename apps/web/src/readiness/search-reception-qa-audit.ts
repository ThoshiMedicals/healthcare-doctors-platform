/**
 * QA5 — Search and Digital Reception experience audit.
 * Surfaces: Digital Reception (sitewide), Knowledge Centre guide search (hubs),
 * measurement.js analytics, search-index shards + aliases.
 */

export type SearchReceptionDimension =
  | "searchQuality"
  | "intentRouting"
  | "destinationRouting"
  | "zeroResultBehaviour"
  | "searchVisibility"
  | "mobileUx"
  | "accessibility"
  | "analyticsTracking";

export type SearchIssueSeverity = "P0" | "P1" | "P2" | "P3";

export type SearchReceptionIssue = {
  id: string;
  severity: SearchIssueSeverity;
  kind: "search" | "resolution" | "ux";
  dimension: SearchReceptionDimension | "cross-cutting";
  title: string;
  detail: string;
  evidence: string;
};

export type SearchUxFinding = {
  id: string;
  area: string;
  verdict: "strong" | "good" | "gap";
  summary: string;
};

export type SearchReceptionQaAudit = {
  promptId: "QA5";
  assessedOn: string;
  environment: string;
  /** Ranking, shards, aliases, clinical vs task separation (0–100). */
  searchScore: number;
  /** Intent → destination / care-journey / emergency resolution (0–100). */
  resolutionScore: number;
  /** Mean of the eight check dimensions. */
  complianceScore: number;
  dimensionScores: Record<SearchReceptionDimension, number>;
  uxFindings: SearchUxFinding[];
  issues: SearchReceptionIssue[];
  priorityFixes: SearchReceptionIssue[];
  liveChecks: { query: string; resultType: string; note: string }[];
  recommendation:
    | "SEARCH_AND_RECEPTION_ALIGNED"
    | "STRONG_RESOLUTION_VISIBILITY_POLISH"
    | "NEEDS_SEARCH_PASS";
  reportPath: string;
};

function mean(values: number[]): number {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, n) => sum + n, 0) / values.length);
}

function priorityRank(severity: SearchIssueSeverity): number {
  if (severity === "P0") return 0;
  if (severity === "P1") return 1;
  if (severity === "P2") return 2;
  return 3;
}

const DIMENSION_SCORES: Record<SearchReceptionDimension, number> = {
  searchQuality: 89,
  intentRouting: 90,
  destinationRouting: 88,
  zeroResultBehaviour: 91,
  searchVisibility: 74,
  mobileUx: 87,
  accessibility: 90,
  analyticsTracking: 92,
};

const UX_FINDINGS: SearchUxFinding[] = [
  {
    id: "UX-1",
    area: "Digital Reception panel",
    verdict: "strong",
    summary:
      "Modal dialog with disclosure, labelled search, quick topics, Book/Call actions, and polite live status.",
  },
  {
    id: "UX-2",
    area: "Care journeys",
    verdict: "strong",
    summary:
      "Clinical queries render Information → Service → Practitioner → Booking steps with More-on-topic expansion.",
  },
  {
    id: "UX-3",
    area: "Zero-result / unmatched clinical",
    verdict: "strong",
    summary:
      "Honest no_result with Browse Health Advice; unmatched rash/breathing language falls back to Family Health + GP directory.",
  },
  {
    id: "UX-4",
    area: "Search visibility",
    verdict: "gap",
    summary:
      "No header/global site search. Discovery depends on dock Digital Reception (“Ask us”) plus Knowledge hub guide finder only.",
  },
  {
    id: "UX-5",
    area: "Mobile dock",
    verdict: "good",
    summary:
      "Launcher sits in persistent care dock with compact “Ask us” label; panel is usable over Book/Call.",
  },
  {
    id: "UX-6",
    area: "Accessibility",
    verdict: "strong",
    summary:
      "role=dialog, aria-modal, labelled title/disclosure, focus to input on open, aria-live results, Escape/close.",
  },
  {
    id: "UX-7",
    area: "Analytics privacy",
    verdict: "strong",
    summary:
      "intent_bucket + result_type + counts to dataLayer/event log; raw queries stay in short-TTL debug store only.",
  },
  {
    id: "UX-8",
    area: "Intent coverage polish",
    verdict: "good",
    summary:
      "Admin shortcuts (parking, fees, test results) resolve cleanly; a few conversational phrases historically under-routed in offline intent audits.",
  },
];

const ISSUES: SearchReceptionIssue[] = [
  {
    id: "R-V1",
    severity: "P1",
    kind: "ux",
    dimension: "searchVisibility",
    title: "No global header search entry point",
    detail:
      "Patients must discover Digital Reception in the dock or use Knowledge hub guide search. Homepage and most templates have no visible search field.",
    evidence: "UAT index.html — hasHeaderSearch false; DR launcher only",
  },
  {
    id: "R-I1",
    severity: "P2",
    kind: "resolution",
    dimension: "intentRouting",
    title: "Some conversational intents under-specified in offline audit",
    detail:
      "Prior intent-audit showed mode=none for phrases like “see a doctor” / “register”; live “see a doctor” resolved as direct_page, but coverage should be locked with regression cases.",
    evidence: ".tmp-pdf-convert/intent-audit.txt + live debug query log",
  },
  {
    id: "R-D1",
    severity: "P2",
    kind: "resolution",
    dimension: "destinationRouting",
    title: "Clinical journeys often fall back to GP directory",
    detail:
      "Headache care journey correctly shows guide + Family Health, but Step 3 uses GP directory when no published practitioner lead matches.",
    evidence: "UAT headache → Guided answer · GP directory",
  },
  {
    id: "R-U1",
    severity: "P3",
    kind: "ux",
    dimension: "searchQuality",
    title: "Two search systems (DR vs Knowledge guide finder)",
    detail:
      "Knowledge hubs use knowledge-search.js (titles/aliases only); Digital Reception uses shard index + journeys. Behaviour differs by surface.",
    evidence: "knowledge-search.js vs digital-reception.js",
  },
  {
    id: "R-A1",
    severity: "P3",
    kind: "ux",
    dimension: "cross-cutting",
    title: "Call Call accessible-name duplication sitewide",
    detail: "Same tel labelling defect as QA1–QA4 on pages hosting Digital Reception.",
    evidence: "UAT a11y tree footer Call Call",
  },
];

const LIVE_CHECKS = [
  { query: "Parking", resultType: "direct_page", note: "Access & Parking destination; intent parking_access" },
  { query: "headache", resultType: "care_journey", note: "Guide + Family Health + GP directory + Book" },
  { query: "rash", resultType: "care_journey", note: "Clinically unmatched honest Family Health fallback path" },
  { query: "chest pain emergency", resultType: "emergency", note: "000 / Lifeline / ED / urgent GP" },
  { query: "xyzzyzfoobar999", resultType: "no_result", note: "Browse Health Advice CTA; result_count 0" },
  { query: "see a doctor", resultType: "direct_page", note: "Live resolved (offline audit previously mode=none)" },
];

/**
 * QA5 search + Digital Reception audit.
 * Search Score = mean(quality, intent, destination, zero-result, visibility).
 * Resolution Score = mean(intent, destination, zero-result).
 */
export const SEARCH_RECEPTION_QA_AUDIT_QA5: SearchReceptionQaAudit = (() => {
  const searchScore = mean([
    DIMENSION_SCORES.searchQuality,
    DIMENSION_SCORES.intentRouting,
    DIMENSION_SCORES.destinationRouting,
    DIMENSION_SCORES.zeroResultBehaviour,
    DIMENSION_SCORES.searchVisibility,
  ]);
  const resolutionScore = mean([
    DIMENSION_SCORES.intentRouting,
    DIMENSION_SCORES.destinationRouting,
    DIMENSION_SCORES.zeroResultBehaviour,
  ]);
  const complianceScore = mean(Object.values(DIMENSION_SCORES));
  const priorityFixes = [...ISSUES]
    .sort((a, b) => priorityRank(a.severity) - priorityRank(b.severity) || a.id.localeCompare(b.id))
    .filter((issue) => issue.severity === "P0" || issue.severity === "P1");

  const p0 = ISSUES.filter((issue) => issue.severity === "P0").length;

  return {
    promptId: "QA5",
    assessedOn: "2026-10-26",
    environment: "http://127.0.0.1:3100/",
    searchScore,
    resolutionScore,
    complianceScore,
    dimensionScores: DIMENSION_SCORES,
    uxFindings: UX_FINDINGS,
    issues: ISSUES,
    priorityFixes,
    liveChecks: LIVE_CHECKS,
    recommendation:
      p0 > 0 || searchScore < 75
        ? "NEEDS_SEARCH_PASS"
        : searchScore >= 90 && DIMENSION_SCORES.searchVisibility >= 85
          ? "SEARCH_AND_RECEPTION_ALIGNED"
          : "STRONG_RESOLUTION_VISIBILITY_POLISH",
    reportPath: "apps/web/reports/SEARCH_RECEPTION_QA_AUDIT_QA5.md",
  };
})();

export function getSearchReceptionQaAudit(): SearchReceptionQaAudit {
  return SEARCH_RECEPTION_QA_AUDIT_QA5;
}

export function getSearchScore(): number {
  return SEARCH_RECEPTION_QA_AUDIT_QA5.searchScore;
}

export function getResolutionScore(): number {
  return SEARCH_RECEPTION_QA_AUDIT_QA5.resolutionScore;
}
