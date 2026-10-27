/**
 * QA10 — Digital Reception dashboard (/admin/digital-reception) audit.
 * Checks: gauges, funnels, intent charts, recommendations, filters,
 * drill-through, help content, demo mode.
 */

export type DigitalReceptionQaDimension =
  | "gauges"
  | "funnels"
  | "intentCharts"
  | "recommendations"
  | "filters"
  | "drillThrough"
  | "helpContent"
  | "demoMode";

export type DigitalReceptionIssueSeverity = "P0" | "P1" | "P2" | "P3";

export type DigitalReceptionQaIssue = {
  id: string;
  severity: DigitalReceptionIssueSeverity;
  dimension: DigitalReceptionQaDimension | "cross-cutting";
  title: string;
  detail: string;
  evidence: string;
};

export type DigitalReceptionQaRecommendation = {
  id: string;
  priority: "now" | "next" | "later";
  title: string;
  detail: string;
};

export type DigitalReceptionQaAudit = {
  promptId: "QA10";
  assessedOn: string;
  environment: string;
  /** Search intelligence quality (0–100). */
  searchIntelligenceScore: number;
  /** Manager usability of the Search dashboard (0–100). */
  usabilityScore: number;
  /** Ability to act on flagged intents / funnel stalls (0–100). */
  actionabilityScore: number;
  dimensionScores: Record<DigitalReceptionQaDimension, number>;
  coverage: {
    gauges: string;
    funnelStages: string;
    intentBars: string;
    watchlist: string;
    dataModes: string;
  };
  issues: DigitalReceptionQaIssue[];
  recommendations: DigitalReceptionQaRecommendation[];
  priorityFixes: DigitalReceptionQaIssue[];
  recommendation:
    | "DIGITAL_RECEPTION_LAUNCH_READY"
    | "DIGITAL_RECEPTION_OPERATIONAL_POLISH"
    | "NEEDS_DIGITAL_RECEPTION_PASS";
  reportPath: string;
};

function mean(values: number[]): number {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, n) => sum + n, 0) / values.length);
}

function priorityRank(severity: DigitalReceptionIssueSeverity): number {
  if (severity === "P0") return 0;
  if (severity === "P1") return 1;
  if (severity === "P2") return 2;
  return 3;
}

const DIMENSION_SCORES: Record<DigitalReceptionQaDimension, number> = {
  gauges: 94,
  funnels: 93,
  intentCharts: 95,
  recommendations: 78,
  filters: 82,
  drillThrough: 94,
  helpContent: 96,
  demoMode: 95,
};

const ISSUES: DigitalReceptionQaIssue[] = [
  {
    id: "DR-F1",
    severity: "P1",
    dimension: "filters",
    title: "Governance queue filters pollute Search recommendations",
    detail:
      "Persisted queue=expired&from=* from InsightsFilterSync shows “Viewing · Expired” on Online search and injects governance remediation steps (“Re-review and update next review due date”) while investigating Vaccine intents — wrong action list for reception managers.",
    evidence:
      "Live /admin/digital-reception?data=demo&intent=vaccination — banner From chart + Viewing · Expired + governance Recommendations",
  },
  {
    id: "DR-R1",
    severity: "P2",
    dimension: "recommendations",
    title: "No native Recommended Actions panel on Digital Reception",
    detail:
      "Actionability relies on flagged intents, watchlist cards, and funnel drop badges. Unlike Command Centre, there is no prioritised RecommendedActionsPanel with Fix List / Investigation / Related Dashboard triples for search fixes.",
    evidence: "digital-reception/page.tsx — FlaggedIntentPanel + WatchlistCards only",
  },
  {
    id: "DR-X1",
    severity: "P2",
    dimension: "filters",
    title: "Intent focus lacks clear filter chrome",
    detail:
      "intent=vaccination correctly Focuses bars and flagged rows, but managers get no chip/pill strip showing active intent/service filters beyond the investigation banner (which may show the wrong queue).",
    evidence: "Live intent=vaccination Focused badges; no dedicated filter chip UI",
  },
  {
    id: "DR-E1",
    severity: "P3",
    dimension: "demoMode",
    title: "Export is CSV-only",
    detail:
      "Header offers Download CSV; no PDF summary unlike Executive — weaker for sharing search briefings in practice meetings.",
    evidence: "digital-reception/page.tsx ExportActions csvHref only",
  },
  {
    id: "DR-H1",
    severity: "P3",
    dimension: "helpContent",
    title: "Flagged-intents empty copy says “watchlist”",
    detail:
      "Empty FlaggedIntentPanel title is “Nothing on the watchlist” even though the Watchlist section is separate — confuses the scan order for flagged vs always-on intents.",
    evidence: "FlaggedIntentPanel EmptyState title in visuals.tsx",
  },
];

const RECOMMENDATIONS: DigitalReceptionQaRecommendation[] = [
  {
    id: "DR-REC1",
    priority: "now",
    title: "Isolate investigation filters by dashboard family",
    detail:
      "Clear governance queue/from when entering Digital Reception unless the arrival was from a governance surface. Intent investigations should recommend search/content fixes, not clinical review due dates.",
  },
  {
    id: "DR-REC2",
    priority: "now",
    title: "Show active intent/service filter chips",
    detail:
      "When intent or service focus is active, render clear chips with one-click clear that only strip those params.",
  },
  {
    id: "DR-REC3",
    priority: "next",
    title: "Add search Recommended Actions strip",
    detail:
      "Surface top flagged intents + watchlist reds as prioritised actions with Fix List / Investigation / Related Dashboard (Conversion / Pages) links.",
  },
  {
    id: "DR-REC4",
    priority: "next",
    title: "Fix flagged empty-state copy",
    detail: "Use “No high-volume low-resolution intents” consistently; reserve “watchlist” for the watchlist section.",
  },
  {
    id: "DR-REC5",
    priority: "later",
    title: "Optional PDF export for Search briefings",
    detail: "Match Executive PDF summary for reception leadership packs.",
  },
];

/**
 * QA10 Digital Reception audit.
 * Search intelligence = gauges + funnels + intent charts + demo fidelity.
 * Usability = help + filters + gauges + funnels.
 * Actionability = recommendations + drill-through + intent charts + filters.
 */
export const DIGITAL_RECEPTION_QA_AUDIT_QA10: DigitalReceptionQaAudit = (() => {
  const searchIntelligenceScore = mean([
    DIMENSION_SCORES.gauges,
    DIMENSION_SCORES.funnels,
    DIMENSION_SCORES.intentCharts,
    DIMENSION_SCORES.demoMode,
  ]);

  const usabilityScore = mean([
    DIMENSION_SCORES.helpContent,
    DIMENSION_SCORES.filters,
    DIMENSION_SCORES.gauges,
    DIMENSION_SCORES.funnels,
  ]);

  const actionabilityScore = mean([
    DIMENSION_SCORES.recommendations,
    DIMENSION_SCORES.drillThrough,
    DIMENSION_SCORES.intentCharts,
    DIMENSION_SCORES.filters,
  ]);

  const priorityFixes = [...ISSUES]
    .sort((a, b) => priorityRank(a.severity) - priorityRank(b.severity) || a.id.localeCompare(b.id))
    .filter((issue) => issue.severity === "P0" || issue.severity === "P1");

  const p0 = ISSUES.filter((issue) => issue.severity === "P0").length;

  return {
    promptId: "QA10",
    assessedOn: "2026-10-26",
    environment: "http://127.0.0.1:3000/admin/digital-reception",
    searchIntelligenceScore,
    usabilityScore,
    actionabilityScore,
    dimensionScores: DIMENSION_SCORES,
    coverage: {
      gauges: "Resolution · Open rate · Searches · Zero-result",
      funnelStages: "Open → Search → Result click → Booking → Call",
      intentBars: "Top 10 intents + destination bars",
      watchlist: "New patient · HotDoc message · Vaccine",
      dataModes: "Live · Demo · Empty",
    },
    issues: ISSUES,
    recommendations: RECOMMENDATIONS,
    priorityFixes,
    recommendation:
      p0 > 0 || actionabilityScore < 75
        ? "NEEDS_DIGITAL_RECEPTION_PASS"
        : searchIntelligenceScore >= 95 && actionabilityScore >= 92
          ? "DIGITAL_RECEPTION_LAUNCH_READY"
          : "DIGITAL_RECEPTION_OPERATIONAL_POLISH",
    reportPath: "apps/web/reports/DIGITAL_RECEPTION_QA_AUDIT_QA10.md",
  };
})();

export function getDigitalReceptionQaAudit(): DigitalReceptionQaAudit {
  return DIGITAL_RECEPTION_QA_AUDIT_QA10;
}

export function getSearchIntelligenceScore(): number {
  return DIGITAL_RECEPTION_QA_AUDIT_QA10.searchIntelligenceScore;
}

export function getDigitalReceptionUsabilityScore(): number {
  return DIGITAL_RECEPTION_QA_AUDIT_QA10.usabilityScore;
}

export function getDigitalReceptionActionabilityScore(): number {
  return DIGITAL_RECEPTION_QA_AUDIT_QA10.actionabilityScore;
}
