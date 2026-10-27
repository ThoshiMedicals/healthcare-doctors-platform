/**
 * QA9 — Executive Dashboard (/admin/executive) audit.
 * Checks: KPI cards, color usage, trend indicators, charts, exports,
 * explanations, demo mode, responsiveness.
 */

export type ExecutiveQaDimension =
  | "kpiCards"
  | "colorUsage"
  | "trendIndicators"
  | "charts"
  | "exports"
  | "explanations"
  | "demoMode"
  | "responsiveness";

export type ExecutiveIssueSeverity = "P0" | "P1" | "P2" | "P3";

export type ExecutiveQaIssue = {
  id: string;
  severity: ExecutiveIssueSeverity;
  dimension: ExecutiveQaDimension | "cross-cutting";
  title: string;
  detail: string;
  evidence: string;
};

export type ExecutiveQaRecommendation = {
  id: string;
  priority: "now" | "next" | "later";
  title: string;
  detail: string;
};

export type ExecutiveDashboardQaAudit = {
  promptId: "QA9";
  assessedOn: string;
  environment: string;
  /** Visual presentation quality (0–100). */
  visualScore: number;
  /** Functional completeness for managers (0–100). */
  functionalScore: number;
  /** Suitability as a board/practice-manager briefing surface (0–100). */
  executiveReadinessScore: number;
  dimensionScores: Record<ExecutiveQaDimension, number>;
  coverage: {
    kpiTiles: string;
    charts: string;
    exportActions: string;
    dataModes: string;
    sections: string;
  };
  issues: ExecutiveQaIssue[];
  recommendations: ExecutiveQaRecommendation[];
  priorityFixes: ExecutiveQaIssue[];
  recommendation:
    | "EXECUTIVE_DASHBOARD_LAUNCH_READY"
    | "EXECUTIVE_DASHBOARD_OPERATIONAL_POLISH"
    | "NEEDS_EXECUTIVE_DASHBOARD_PASS";
  reportPath: string;
};

function mean(values: number[]): number {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, n) => sum + n, 0) / values.length);
}

function priorityRank(severity: ExecutiveIssueSeverity): number {
  if (severity === "P0") return 0;
  if (severity === "P1") return 1;
  if (severity === "P2") return 2;
  return 3;
}

const DIMENSION_SCORES: Record<ExecutiveQaDimension, number> = {
  kpiCards: 94,
  colorUsage: 92,
  trendIndicators: 95,
  charts: 86,
  exports: 88,
  explanations: 96,
  demoMode: 95,
  responsiveness: 85,
};

const ISSUES: ExecutiveQaIssue[] = [
  {
    id: "EX-F1",
    severity: "P1",
    dimension: "cross-cutting",
    title: "Investigation filters bleed onto Executive",
    detail:
      "After visiting a governance recommendation queue, InsightsFilterSync keeps queue=expired&from=recommendation on /admin/executive. The investigation banner shows “Viewing · Expired” on Website overview, and Monthly report inherits those query params.",
    evidence:
      "Live /admin/executive?data=demo — InvestigationBanner + Monthly href includes queue=expired&from=recommendation",
  },
  {
    id: "EX-C1",
    severity: "P2",
    dimension: "charts",
    title: "Charts lack accessible data-table alternatives",
    detail:
      "Four SVG line charts expose aria-label titles and latest values, but no paired data table or rich tooltip — managers relying on assistive tech cannot read the full daily series.",
    evidence: "LineChart in dashboard-ui/components.tsx; C8 remainingGaps charts lack data tables",
  },
  {
    id: "EX-K1",
    severity: "P2",
    dimension: "kpiCards",
    title: "Booking click rate duplicated across sections",
    detail:
      "Booking click rate appears in both “How the website is performing” and “Bookings”, inflating scan load without new information.",
    evidence: "executive/page.tsx MetricCard booking_intent in performance + bookings",
  },
  {
    id: "EX-E1",
    severity: "P2",
    dimension: "exports",
    title: "No export audit trail",
    detail:
      "CSV and PDF downloads work from the header, but there is no record of who exported which range/mode — weak for governance of board packs.",
    evidence: "api/admin/exports/executive; C8 remainingGaps no export audit trail",
  },
  {
    id: "EX-M1",
    severity: "P2",
    dimension: "responsiveness",
    title: "Sidebar competes with KPI grid on narrow widths",
    detail:
      "Executive uses sm/xl responsive grids and scaling SVG charts, but AdminShellFrame keeps a 16rem sidebar from md up with no drawer — phone-width briefing space is tight.",
    evidence: "admin-shell-frame.tsx md:grid-cols-[16rem_1fr]; executive page sm:grid-cols-2 xl:grid-cols-4",
  },
  {
    id: "EX-Y1",
    severity: "P3",
    dimension: "exports",
    title: "Monthly report lacks KPI/chart drill-through",
    detail:
      "Monthly website report is shareable for meetings but still lacks investigation continuity called out in D8 (NA-1/NA-2).",
    evidence: "executive/monthly/page.tsx; admin-dashboard-maturity remainingGaps",
  },
];

const RECOMMENDATIONS: ExecutiveQaRecommendation[] = [
  {
    id: "EX-R1",
    priority: "now",
    title: "Scope investigation filters to destination dashboards",
    detail:
      "Do not persist governance queue/from onto Executive/Monthly unless the user intentionally investigates from that surface. Clear filter should strip queue/from from InsightsFilterSync when leaving governance.",
  },
  {
    id: "EX-R2",
    priority: "now",
    title: "Deduplicate Booking click rate on Executive",
    detail:
      "Keep the rate once in the headline strip (or Bookings only) so the first viewport scans four distinct KPIs.",
  },
  {
    id: "EX-R3",
    priority: "next",
    title: "Add chart data tables / expandable series",
    detail:
      "Pair each LineChart with a visually hidden or collapsible daily table so series are accessible beyond the SVG.",
  },
  {
    id: "EX-R4",
    priority: "next",
    title: "Collapsible admin chrome on small screens",
    detail:
      "Same shell gap as QA8 — free full width for KPI grids and charts on phones.",
  },
  {
    id: "EX-R5",
    priority: "later",
    title: "Export audit + monthly drill-through",
    detail:
      "Log export actor/range/mode; add KPI links on monthly report into Conversion / Digital Reception investigations.",
  },
];

/**
 * QA9 Executive Dashboard audit.
 * Visual = mean(kpi, color, charts, responsiveness, trends).
 * Functional = mean(kpi, trends, charts, exports, explanations, demo).
 * Executive-readiness = mean(visual, functional, explanations).
 */
export const EXECUTIVE_DASHBOARD_QA_AUDIT_QA9: ExecutiveDashboardQaAudit = (() => {
  const visualScore = mean([
    DIMENSION_SCORES.kpiCards,
    DIMENSION_SCORES.colorUsage,
    DIMENSION_SCORES.charts,
    DIMENSION_SCORES.responsiveness,
    DIMENSION_SCORES.trendIndicators,
  ]);

  const functionalScore = mean([
    DIMENSION_SCORES.kpiCards,
    DIMENSION_SCORES.trendIndicators,
    DIMENSION_SCORES.charts,
    DIMENSION_SCORES.exports,
    DIMENSION_SCORES.explanations,
    DIMENSION_SCORES.demoMode,
  ]);

  const executiveReadinessScore = mean([
    visualScore,
    functionalScore,
    DIMENSION_SCORES.explanations,
    DIMENSION_SCORES.exports,
  ]);

  const priorityFixes = [...ISSUES]
    .sort((a, b) => priorityRank(a.severity) - priorityRank(b.severity) || a.id.localeCompare(b.id))
    .filter((issue) => issue.severity === "P0" || issue.severity === "P1");

  const p0 = ISSUES.filter((issue) => issue.severity === "P0").length;

  return {
    promptId: "QA9",
    assessedOn: "2026-10-26",
    environment: "http://127.0.0.1:3000/admin/executive",
    visualScore,
    functionalScore,
    executiveReadinessScore,
    dimensionScores: DIMENSION_SCORES,
    coverage: {
      kpiTiles: "14 actionable + 1 informational (sessions)",
      charts: "4 line charts + placement bars",
      exportActions: "CSV · PDF · Monthly report",
      dataModes: "Live · Demo · Empty",
      sections: "Performance · Patients · Bookings · Calls · Digital Reception",
    },
    issues: ISSUES,
    recommendations: RECOMMENDATIONS,
    priorityFixes,
    recommendation:
      p0 > 0 || executiveReadinessScore < 80
        ? "NEEDS_EXECUTIVE_DASHBOARD_PASS"
        : executiveReadinessScore >= 95 && visualScore >= 92
          ? "EXECUTIVE_DASHBOARD_LAUNCH_READY"
          : "EXECUTIVE_DASHBOARD_OPERATIONAL_POLISH",
    reportPath: "apps/web/reports/EXECUTIVE_DASHBOARD_QA_AUDIT_QA9.md",
  };
})();

export function getExecutiveDashboardQaAudit(): ExecutiveDashboardQaAudit {
  return EXECUTIVE_DASHBOARD_QA_AUDIT_QA9;
}

export function getExecutiveVisualScore(): number {
  return EXECUTIVE_DASHBOARD_QA_AUDIT_QA9.visualScore;
}

export function getExecutiveFunctionalScore(): number {
  return EXECUTIVE_DASHBOARD_QA_AUDIT_QA9.functionalScore;
}

export function getExecutiveReadinessScore(): number {
  return EXECUTIVE_DASHBOARD_QA_AUDIT_QA9.executiveReadinessScore;
}
