export type ReadinessSeverity = "critical" | "high" | "medium" | "low";
export type ReadinessStatus = "ready" | "partial" | "blocked";

export type PlatformReadinessScorecard = {
  promptId: string;
  title: string;
  assessedOn: string;
  productionReadinessScore: number;
  goLiveRecommendation: string;
  goLiveSummary: string;
  issueCounts: Record<ReadinessSeverity, number>;
  domains: Array<{ id: string; label: string; status: ReadinessStatus; score: number }>;
  issues: Array<{ id: string; severity: ReadinessSeverity; domain: string; summary: string; evidence: string }>;
  gatesBeforeGoLive: string[];
  reportPath: string;
  baselinePromptId?: string;
  baselineScore?: number;
};

/**
 * Published L1 launch reassessment (closes 3H Critical/High gates).
 * Narrative: old-html/qa/PLATFORM_READINESS_AUDIT_L1.md
 * Superseded for cutover decision by PLATFORM_READINESS_SCORECARD_L7.
 */
export const PLATFORM_READINESS_SCORECARD_L1: PlatformReadinessScorecard = {
  promptId: "L1",
  title: "Platform Readiness — Launch blockers cleared",
  assessedOn: "2026-10-26",
  baselinePromptId: "3H",
  baselineScore: 72,
  productionReadinessScore: 86,
  goLiveRecommendation: "CLEAR_TO_SHIP",
  goLiveSummary:
    "Critical and High 3H gates closed: HotDoc practitioner deep-links live-verified (13/13), search-index manifest resynced (206 routes), navigation ownership complete (208/208). Production Readiness 86. Medium items remain as dated follow-ups and do not block cutover.",
  issueCounts: { critical: 0, high: 0, medium: 2, low: 3 },
  domains: [
    { id: "digital_reception", label: "Digital Reception", status: "ready", score: 9 },
    { id: "search", label: "Search", status: "ready", score: 9 },
    { id: "authority_graph", label: "Authority Graph", status: "ready", score: 9 },
    { id: "booking_paths", label: "Booking Paths", status: "ready", score: 10 },
    { id: "analytics", label: "Analytics", status: "ready", score: 10 },
    { id: "governance", label: "Governance", status: "ready", score: 9 },
    { id: "mobile_ux", label: "Mobile UX", status: "ready", score: 9 },
    { id: "accessibility", label: "Accessibility", status: "ready", score: 9 },
    { id: "page_performance", label: "Page Performance", status: "partial", score: 9 },
    { id: "internal_links", label: "Internal Links", status: "ready", score: 10 },
    { id: "structured_data", label: "Structured Data", status: "ready", score: 9 },
  ],
  issues: [
    {
      id: "M4",
      severity: "medium",
      domain: "page_performance",
      summary: "Large PNG poster sources remain beside WebP (HTML prefers WebP)",
      evidence: "apps/web/public/assets/patient-information/",
    },
    {
      id: "M5",
      severity: "medium",
      domain: "digital_reception",
      summary: "Some intent phrases still unmatched (mode=none)",
      evidence: ".tmp-pdf-convert/intent-audit.txt",
    },
    {
      id: "L1",
      severity: "low",
      domain: "authority_graph",
      summary: "Doctor to knowledge related edges not fully reciprocal",
      evidence: "apps/web/public/search-index/",
    },
    {
      id: "L2",
      severity: "low",
      domain: "governance",
      summary: "Public governance stamps empty until approval (by design / fail-closed); publish pipeline ready",
      evidence: "apps/web/reports/GOVERNANCE_PUBLICATION_CHECKLIST_L2.md",
    },
    {
      id: "L3",
      severity: "low",
      domain: "page_performance",
      summary: "Large digital-reception-index.js compatibility corpus",
      evidence: "apps/web/public/digital-reception-index.js",
    },
  ],

  gatesBeforeGoLive: [
    "C1 HotDoc live verify — CLOSED (HOTDOC_LIVE_VERIFY_L1.json, 13/13)",
    "H1 search-index manifest sync — CLOSED (206 routes, bytes match golden)",
    "H2 navigation ownership — CLOSED (208/208; import-validation passed)",
    "L6 analytics warehouse — CLOSED (apps/web/data/measurement-events.json · warehouse feed)",
    "Post-launch: intent unmatched phrases (M5), PNG cleanup (M4)",
  ],
  reportPath: "old-html/qa/PLATFORM_READINESS_AUDIT_L1.md",
};

/**
 * Final launch-candidate audit (PROMPT L7).
 * Narrative: apps/web/reports/LAUNCH_CANDIDATE_AUDIT_L7.md
 * JSON: apps/web/reports/LAUNCH_CANDIDATE_SCORECARD_L7.json
 */
export const PLATFORM_READINESS_SCORECARD_L7: PlatformReadinessScorecard = {
  promptId: "L7",
  title: "Final launch-candidate audit",
  assessedOn: "2026-10-26",
  baselinePromptId: "L1",
  baselineScore: 86,
  productionReadinessScore: 86,
  goLiveRecommendation: "CLEAR_TO_SHIP",
  goLiveSummary:
    "Final launch-candidate audit: 0 Critical, 0 High. Domain average 9.1 → readiness 86. HotDoc 13/13, search 206 routes, warehouse analytics live, trust strips and mobile dock hierarchy verified. Ship; schedule M4/M5 post-launch.",
  issueCounts: { critical: 0, high: 0, medium: 2, low: 3 },
  domains: [
    { id: "search", label: "Search", status: "ready", score: 9 },
    { id: "digital_reception", label: "Digital Reception", status: "ready", score: 9 },
    { id: "booking", label: "Booking", status: "ready", score: 10 },
    { id: "authority_graph", label: "Authority Graph", status: "ready", score: 9 },
    { id: "governance", label: "Governance", status: "ready", score: 9 },
    { id: "analytics", label: "Analytics", status: "ready", score: 10 },
    { id: "trust_signals", label: "Trust Signals", status: "ready", score: 9 },
    { id: "mobile_ux", label: "Mobile UX", status: "ready", score: 9 },
    { id: "accessibility", label: "Accessibility", status: "ready", score: 9 },
    { id: "performance", label: "Performance", status: "partial", score: 8 },
  ],
  issues: [
    {
      id: "M4",
      severity: "medium",
      domain: "performance",
      summary: "Large PNG poster sources remain beside WebP (HTML prefers WebP)",
      evidence: "apps/web/public/assets/patient-information/",
    },
    {
      id: "M5",
      severity: "medium",
      domain: "digital_reception",
      summary: "Some intent phrases still unmatched (mode=none); 8 phrases in intent-audit",
      evidence: ".tmp-pdf-convert/intent-audit.txt",
    },
    {
      id: "L1",
      severity: "low",
      domain: "authority_graph",
      summary: "Doctor to knowledge related edges not fully reciprocal",
      evidence: "apps/web/public/search-index/",
    },
    {
      id: "L2",
      severity: "low",
      domain: "governance",
      summary: "Public governance stamps empty until approval (by design / fail-closed); publish pipeline ready",
      evidence: "apps/web/reports/GOVERNANCE_PUBLICATION_CHECKLIST_L2.md",
    },
    {
      id: "L3",
      severity: "low",
      domain: "performance",
      summary: "Large digital-reception-index.js compatibility corpus (~0.95 MB)",
      evidence: "apps/web/public/digital-reception-index.js",
    },
  ],
  gatesBeforeGoLive: [
    "C1 HotDoc live verify — CLOSED (13/13)",
    "H1 search-index manifest — CLOSED (206 routes)",
    "H2 navigation ownership — CLOSED (208/208)",
    "L2–L6 trust / mobile / analytics — CLOSED",
    "Post-launch: intent unmatched phrases (M5), PNG cleanup (M4)",
  ],
  reportPath: "apps/web/reports/LAUNCH_CANDIDATE_AUDIT_L7.md",
};

/** @deprecated Prefer PLATFORM_READINESS_SCORECARD_L1; retained for historical reference. */
export const PLATFORM_READINESS_SCORECARD_3H: PlatformReadinessScorecard = {
  promptId: "3H",
  title: "Platform Readiness Audit",
  assessedOn: "2026-10-26",
  productionReadinessScore: 72,
  goLiveRecommendation: "CONDITIONAL_NOT_CLEAR_TO_SHIP",
  goLiveSummary:
    "Do not cut over until Critical and High issues are closed: live HotDoc practitioner verification, search-index manifest sync (3 missing patient routes), and navigation ownership for 6 articles.",
  issueCounts: { critical: 1, high: 2, medium: 5, low: 4 },
  domains: [
    { id: "digital_reception", label: "Digital Reception", status: "partial", score: 8 },
    { id: "search", label: "Search", status: "partial", score: 7 },
    { id: "authority_graph", label: "Authority Graph", status: "ready", score: 8 },
    { id: "booking_paths", label: "Booking Paths", status: "partial", score: 7 },
    { id: "analytics", label: "Analytics", status: "partial", score: 8 },
    { id: "governance", label: "Governance", status: "ready", score: 9 },
    { id: "mobile_ux", label: "Mobile UX", status: "ready", score: 9 },
    { id: "accessibility", label: "Accessibility", status: "ready", score: 8 },
    { id: "page_performance", label: "Page Performance", status: "partial", score: 7 },
    { id: "internal_links", label: "Internal Links", status: "partial", score: 8 },
    { id: "structured_data", label: "Structured Data", status: "ready", score: 9 },
  ],
  issues: [],
  gatesBeforeGoLive: [],
  reportPath: "old-html/qa/PLATFORM_READINESS_AUDIT_3H.md",
};

export function getPlatformReadinessScorecard(): PlatformReadinessScorecard {
  return PLATFORM_READINESS_SCORECARD_L7;
}

export function isClearToShip(card: PlatformReadinessScorecard = getPlatformReadinessScorecard()): boolean {
  return (
    (card.goLiveRecommendation === "CLEAR_TO_SHIP" ||
      card.goLiveRecommendation === "GO_CLEAR_TO_SHIP") &&
    card.issueCounts.critical === 0 &&
    card.issueCounts.high === 0 &&
    card.productionReadinessScore >= 85
  );
}
