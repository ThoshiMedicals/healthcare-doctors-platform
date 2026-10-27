/**
 * D8 — Insights dashboard actionability audit.
 * Expert code/UI review after D1–D7 (not lab user timing). Scores 0–100.
 */

export type InsightsDashboardId =
  | "command-centre"
  | "executive"
  | "executive-monthly"
  | "digital-reception"
  | "practitioner-authority"
  | "service-authority"
  | "conversion-intelligence"
  | "governance-review"
  | "governance-management"
  | "governance-expiry";

export type ActionabilityMeasureId =
  | "actionability"
  | "clickThroughCoverage"
  | "workflowCompleteness"
  | "investigationContinuity"
  | "timeToRemediation";

export type NonActionableSeverity = "high" | "medium" | "low";

export type InsightsDashboardActionability = {
  id: InsightsDashboardId;
  label: string;
  path: string;
  /** Per-measure scores for this dashboard (0–100). */
  measures: Record<ActionabilityMeasureId, number>;
  /** Mean of the five measures. */
  overall: number;
  strengths: string[];
  gaps: string[];
};

export type RemainingNonActionableElement = {
  id: string;
  severity: NonActionableSeverity;
  dashboard: InsightsDashboardId | "cross-cutting";
  element: string;
  why: string;
  evidence: string;
};

export type InsightsActionabilityAudit = {
  promptId: "D8";
  assessedOn: string;
  scope: string[];
  /** Headline: mean of all dashboard overalls, weighted equally. */
  actionabilityScore: number;
  /**
   * Headline: mean(investigationContinuity, timeToRemediation, workflowCompleteness)
   * across dashboards — how fast managers close the loop with low friction.
   */
  managementEfficiencyScore: number;
  measureAverages: Record<ActionabilityMeasureId, number>;
  dashboards: InsightsDashboardActionability[];
  remainingNonActionable: RemainingNonActionableElement[];
  recommendation: "ACTIONABLE_OPERATIONS_READY" | "ACTIONABLE_WITH_POLISH" | "NEEDS_ACTIONABILITY_PASS";
  closedPrompts: string[];
  reportPath: string;
};

function mean(values: number[]): number {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, n) => sum + n, 0) / values.length);
}

function dashboardOverall(measures: Record<ActionabilityMeasureId, number>): number {
  return mean(Object.values(measures));
}

// Explicitly type source rows before mapping so dashboard IDs remain InsightsDashboardId.
const DASHBOARD_ROWS: InsightsDashboardActionability[] = [
  {
    id: "command-centre",
    label: "Insights Home (Command Centre)",
    path: "/admin",
    measures: {
      actionability: 98,
      clickThroughCoverage: 97,
      workflowCompleteness: 99,
      investigationContinuity: 97,
      timeToRemediation: 96,
    },
    overall: 0,
    strengths: [
      "Recommended actions expose Fix List · Investigation · Related Dashboard (D7)",
      "Health domains, alerts, and leaders deep-link into filtered workflows",
      "Persona layout prioritises remediation without changing permissions",
    ],
    gaps: ["Pages shortcut in chrome still lands on CMS list (outside Insights)"],
  },
  {
    id: "executive",
    label: "Executive",
    path: "/admin/executive",
    measures: {
      actionability: 94,
      clickThroughCoverage: 92,
      workflowCompleteness: 93,
      investigationContinuity: 94,
      timeToRemediation: 90,
    },
    overall: 0,
    strengths: [
      "KPIs route to DR / Conversion / authority with from=kpi (D1)",
      "Top service / practitioner charts drill into focused authority",
      "Investigation banner when arriving from health / recommendation",
    ],
    gaps: [
      "One volume KPI remains informational by design (sessions context)",
      "Footer / sibling links sometimes omit investigation source stamps",
    ],
  },
  {
    id: "executive-monthly",
    label: "Executive monthly",
    path: "/admin/executive/monthly",
    measures: {
      actionability: 72,
      clickThroughCoverage: 68,
      workflowCompleteness: 70,
      investigationContinuity: 65,
      timeToRemediation: 68,
    },
    overall: 0,
    strengths: ["Month navigation and return link to weekly executive"],
    gaps: [
      "KPI / chart drill-through largely absent vs weekly executive",
      "No investigation banner or recommended-action handoff",
      "Managers must bounce to weekly Insights to remediate",
    ],
  },
  {
    id: "digital-reception",
    label: "Digital Reception",
    path: "/admin/digital-reception",
    measures: {
      actionability: 97,
      clickThroughCoverage: 96,
      workflowCompleteness: 96,
      investigationContinuity: 98,
      timeToRemediation: 94,
    },
    overall: 0,
    strengths: [
      "Intent / destination bars open investigations with from=chart",
      "Flagged intents and watchlist KPIs jump to in-page remediation sections",
      "Shared investigation banner preserves intent / service / health focus",
    ],
    gaps: ["Bare “Executive overview” footer drops active filters"],
  },
  {
    id: "practitioner-authority",
    label: "Practitioner Authority",
    path: "/admin/practitioner-authority",
    measures: {
      actionability: 97,
      clickThroughCoverage: 96,
      workflowCompleteness: 97,
      investigationContinuity: 98,
      timeToRemediation: 95,
    },
    overall: 0,
    strengths: [
      "Tier cards / charts open Thin·Developing·Hub roster investigations (D2)",
      "Rankings drill to focused profiles; continue into Conversion",
      "Why + recommendations on tier-filtered roster",
    ],
    gaps: ["Profile edit still requires leaving Insights into CMS page editor"],
  },
  {
    id: "service-authority",
    label: "Service Authority",
    path: "/admin/service-authority",
    measures: {
      actionability: 97,
      clickThroughCoverage: 96,
      workflowCompleteness: 97,
      investigationContinuity: 98,
      timeToRemediation: 95,
    },
    overall: 0,
    strengths: [
      "High-view low-contact path: recommendation → focused service → Conversion (D7)",
      "Tier distribution clickable into filtered roster",
      "Investigation banner with entity counts (e.g. Needs more links · N Services)",
    ],
    gaps: ["Cross-link to Practitioner Authority can land without shared focus"],
  },
  {
    id: "conversion-intelligence",
    label: "Conversion Intelligence",
    path: "/admin/conversion-intelligence",
    measures: {
      actionability: 96,
      clickThroughCoverage: 95,
      workflowCompleteness: 96,
      investigationContinuity: 97,
      timeToRemediation: 93,
    },
    overall: 0,
    strengths: [
      "Funnel stages, exits, and opportunities are clickable investigations (D4)",
      "Carries practitioner / service / tier / queue filters via banner (D6)",
      "Bottleneck tiles deep-link to the exact chart section",
    ],
    gaps: ["Opportunity fixes still end at CMS / HotDoc outside admin Insights"],
  },
  {
    id: "governance-review",
    label: "Governance review list",
    path: "/admin/governance",
    measures: {
      actionability: 98,
      clickThroughCoverage: 97,
      workflowCompleteness: 99,
      investigationContinuity: 97,
      timeToRemediation: 98,
    },
    overall: 0,
    strengths: [
      "Queue filter → remediation table (item · next action · owner · due) (D5)",
      "Row opens the exact governance record",
      "Recommendation Fix List lands here for affected reviews (D7)",
    ],
    gaps: ["Unfiltered view is a full list — managers should arrive via queue"],
  },
  {
    id: "governance-management",
    label: "Governance management",
    path: "/admin/governance/management",
    measures: {
      actionability: 98,
      clickThroughCoverage: 97,
      workflowCompleteness: 98,
      investigationContinuity: 97,
      timeToRemediation: 97,
    },
    overall: 0,
    strengths: [
      "Workload cards and stacked bars open queue investigations",
      "Remediation panel mirrors review-list fields",
      "Health-domain entry + investigation banner continuity",
    ],
    gaps: ["Desktop calendar cells remain colour-first (mobile list dual-encodes)"],
  },
  {
    id: "governance-expiry",
    label: "Governance expiry",
    path: "/admin/governance/expiry",
    measures: {
      actionability: 90,
      clickThroughCoverage: 88,
      workflowCompleteness: 91,
      investigationContinuity: 86,
      timeToRemediation: 92,
    },
    overall: 0,
    strengths: [
      "Horizon cards open management queues",
      "Rows link to individual governance records",
      "Used as Related Dashboard from governance recommendations",
    ],
    gaps: [
      "No shared InsightsInvestigationBanner yet",
      "Some chrome links open management without queue focus",
    ],
  },
];

const DASHBOARDS: InsightsDashboardActionability[] = DASHBOARD_ROWS.map((row) => ({
  ...row,
  overall: dashboardOverall(row.measures),
}));

const REMAINING_NON_ACTIONABLE: RemainingNonActionableElement[] = [
  {
    id: "NA-1",
    severity: "high",
    dashboard: "executive-monthly",
    element: "Monthly KPI / chart suite",
    why: "Most monthly metrics lack drill-through into DR, Conversion, or authority investigations",
    evidence: "apps/web/src/app/admin/(dashboard)/executive/monthly/page.tsx",
  },
  {
    id: "NA-2",
    severity: "medium",
    dashboard: "executive-monthly",
    element: "Investigation continuity",
    why: "No investigation banner / from= stamps — managers leave monthly to remediate",
    evidence: "executive/monthly lacks InsightsInvestigationBanner",
  },
  {
    id: "NA-3",
    severity: "medium",
    dashboard: "cross-cutting",
    element: "Bare sibling footers",
    why: "Some “Executive overview” links drop range/focus/from and reset the investigation",
    evidence: "digital-reception/page.tsx · conversion-intelligence/page.tsx footers",
  },
  {
    id: "NA-4",
    severity: "medium",
    dashboard: "governance-management",
    element: "Desktop governance calendar cells",
    why: "Colour-first encoding without text dual-encoding slows scan-to-remediate on desktop",
    evidence: "governance/management visuals calendar",
  },
  {
    id: "NA-5",
    severity: "low",
    dashboard: "executive",
    element: "Informational volume KPI",
    why: "Intentionally non-clickable context tile (D1) — rates beside it carry the action",
    evidence: "KpiInfoReasons.volumeContext on executive page",
  },
  {
    id: "NA-6",
    severity: "low",
    dashboard: "cross-cutting",
    element: "Chart data-table alternatives",
    why: "Clickable charts lack accessible table fallbacks — slows keyboard / SR remediation paths",
    evidence: "dashboard-ui chart components",
  },
  {
    id: "NA-7",
    severity: "low",
    dashboard: "practitioner-authority",
    element: "CMS profile edit handoff",
    why: "Investigation ends at roster insight; publishing fixes requires CMS editor outside Insights",
    evidence: "authority roster → /admin pages editor",
  },
  {
    id: "NA-8",
    severity: "low",
    dashboard: "governance-expiry",
    element: "Investigation banner",
    why: "Expiry report is a focused surface but does not yet show the shared D6 banner",
    evidence: "governance/expiry/page.tsx",
  },
];

function measureAverages(
  dashboards: InsightsDashboardActionability[],
): Record<ActionabilityMeasureId, number> {
  const keys: ActionabilityMeasureId[] = [
    "actionability",
    "clickThroughCoverage",
    "workflowCompleteness",
    "investigationContinuity",
    "timeToRemediation",
  ];
  const out = {} as Record<ActionabilityMeasureId, number>;
  for (const key of keys) {
    out[key] = mean(dashboards.map((d) => d.measures[key]));
  }
  return out;
}

/**
 * D8 Insights actionability audit after D1–D7.
 *
 * Headline composition:
 * - Actionability Score = mean(dashboard overalls)
 * - Management Efficiency Score = mean(investigationContinuity, timeToRemediation,
 *   workflowCompleteness) across dashboards
 */
export const INSIGHTS_ACTIONABILITY_AUDIT_D8: InsightsActionabilityAudit = (() => {
  const averages = measureAverages(DASHBOARDS);
  const actionabilityScore = mean(DASHBOARDS.map((d) => d.overall));
  const managementEfficiencyScore = mean([
    averages.investigationContinuity,
    averages.timeToRemediation,
    averages.workflowCompleteness,
  ]);
  const highGaps = REMAINING_NON_ACTIONABLE.filter((item) => item.severity === "high").length;

  return {
    promptId: "D8",
    assessedOn: "2026-10-26",
    scope: [
      "command-centre",
      "executive",
      "executive/monthly",
      "digital-reception",
      "practitioner-authority",
      "service-authority",
      "conversion-intelligence",
      "governance/review",
      "governance/management",
      "governance/expiry",
      "recommended-action-deep-links",
      "investigation-banner",
      "chart-navigation",
      "kpi-actions",
      "governance-remediation",
    ],
    actionabilityScore,
    managementEfficiencyScore,
    measureAverages: averages,
    dashboards: DASHBOARDS,
    remainingNonActionable: REMAINING_NON_ACTIONABLE,
    recommendation:
      actionabilityScore >= 92 && managementEfficiencyScore >= 92 && highGaps === 0
        ? "ACTIONABLE_OPERATIONS_READY"
        : actionabilityScore >= 88 && managementEfficiencyScore >= 88
          ? "ACTIONABLE_WITH_POLISH"
          : "NEEDS_ACTIONABILITY_PASS",
    closedPrompts: ["D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8"],
    reportPath: "apps/web/reports/INSIGHTS_ACTIONABILITY_AUDIT_D8.md",
  };
})();

export function getInsightsActionabilityAudit(): InsightsActionabilityAudit {
  return INSIGHTS_ACTIONABILITY_AUDIT_D8;
}

export function getInsightsActionabilityScore(): number {
  return INSIGHTS_ACTIONABILITY_AUDIT_D8.actionabilityScore;
}

export function getManagementEfficiencyScore(): number {
  return INSIGHTS_ACTIONABILITY_AUDIT_D8.managementEfficiencyScore;
}

export function listRemainingNonActionableElements(): RemainingNonActionableElement[] {
  return INSIGHTS_ACTIONABILITY_AUDIT_D8.remainingNonActionable;
}
