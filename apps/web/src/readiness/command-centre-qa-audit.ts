/**
 * QA8 — Admin Command Centre (/admin) audit.
 * Checks: health score, recommendations, alerts, role views, deep links,
 * demo mode, empty mode, mobile UX, visual hierarchy.
 */

export type CommandCentreQaDimension =
  | "healthScore"
  | "recommendations"
  | "alerts"
  | "roleViews"
  | "deepLinks"
  | "demoMode"
  | "emptyMode"
  | "mobileUx"
  | "visualHierarchy";

export type CommandCentreIssueSeverity = "P0" | "P1" | "P2" | "P3";

export type CommandCentreQaIssue = {
  id: string;
  severity: CommandCentreIssueSeverity;
  dimension: CommandCentreQaDimension | "cross-cutting";
  title: string;
  detail: string;
  evidence: string;
};

export type CommandCentreQaRecommendation = {
  id: string;
  priority: "now" | "next" | "later";
  title: string;
  detail: string;
};

export type CommandCentreQaAudit = {
  promptId: "QA8";
  assessedOn: string;
  environment: string;
  /** Headline: overall command-centre product quality (0–100). */
  commandCentreScore: number;
  /** Headline: how usable the briefing is for day-to-day practice managers (0–100). */
  managementUsabilityScore: number;
  dimensionScores: Record<CommandCentreQaDimension, number>;
  coverage: {
    personas: string;
    dataModes: string;
    alertPanels: string;
    recommendationDeepLinks: string;
    liveVerified: string;
  };
  issues: CommandCentreQaIssue[];
  recommendations: CommandCentreQaRecommendation[];
  priorityFixes: CommandCentreQaIssue[];
  recommendation:
    | "COMMAND_CENTRE_LAUNCH_READY"
    | "COMMAND_CENTRE_OPERATIONAL_POLISH"
    | "NEEDS_COMMAND_CENTRE_PASS";
  reportPath: string;
};

function mean(values: number[]): number {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, n) => sum + n, 0) / values.length);
}

function priorityRank(severity: CommandCentreIssueSeverity): number {
  if (severity === "P0") return 0;
  if (severity === "P1") return 1;
  if (severity === "P2") return 2;
  return 3;
}

const DIMENSION_SCORES: Record<CommandCentreQaDimension, number> = {
  healthScore: 88,
  recommendations: 97,
  alerts: 95,
  roleViews: 96,
  deepLinks: 98,
  demoMode: 96,
  emptyMode: 90,
  mobileUx: 84,
  visualHierarchy: 91,
};

const ISSUES: CommandCentreQaIssue[] = [
  {
    id: "CC-H1",
    severity: "P1",
    dimension: "healthScore",
    title: "Overall health band can contradict the numeric score",
    detail:
      "Open Needs Attention alerts force website_health_state to needs_attention even when overall_score sits in the Watch (70–84) or Healthy (85+) band. Managers see “Score 84 — Needs Attention” next to a legend that defines Needs Attention as under 70.",
    evidence:
      "command-centre-report.ts stateFromScore(forceNeedsAttention); live demo Overall Health Score 84 labelled Needs Attention",
  },
  {
    id: "CC-M1",
    severity: "P2",
    dimension: "mobileUx",
    title: "Admin sidebar stays on-canvas at narrow widths",
    detail:
      "AdminShellFrame uses md:grid-cols-[16rem_1fr] with no collapsible drawer. On phone-width viewports the briefing shares space with a persistent Clinic admin nav, reducing scan room for health + actions.",
    evidence: "admin-shell-frame.tsx md grid; C8 remainingGaps sidebar not collapsible",
  },
  {
    id: "CC-V1",
    severity: "P2",
    dimension: "visualHierarchy",
    title: "How-to briefing can dominate the first viewport",
    detail:
      "Expanded HowToReadDashboard (~60s) plus InsightsNav, DataModeBanner, RangeTabs, and legends push Practice health below the fold on typical laptop heights before managers see the score.",
    evidence: "Live /admin desktop first paint; How to read expanded by default",
  },
  {
    id: "CC-E1",
    severity: "P3",
    dimension: "emptyMode",
    title: "Empty mode still flags Analytics as Needs Attention",
    detail:
      "Zero-activity Empty mode correctly clears alerts and recommendations, but Analytics domain scores 63 Needs Attention while overall health reads Healthy — mixed “all clear” narrative.",
    evidence: "Live /admin?data=empty Analytics 63 Needs Attention; alerts All clear",
  },
  {
    id: "CC-P1",
    severity: "P3",
    dimension: "roleViews",
    title: "Persona views are query-only",
    detail:
      "Four presentation personas reorder sections correctly, but there is no in-UI persona switcher — managers must know ?persona= or rely on role defaults.",
    evidence: "insights-persona.ts; live ?persona=governance_lead reorders guidance→alerts→health",
  },
];

const RECOMMENDATIONS: CommandCentreQaRecommendation[] = [
  {
    id: "CC-R1",
    priority: "now",
    title: "Align health score label with numeric bands",
    detail:
      "Keep alert-driven urgency, but show Needs Watch when score is 70–84 and surface “open alerts escalate urgency” separately — do not contradict the published Healthy / Watch / Needs Attention thresholds.",
  },
  {
    id: "CC-R2",
    priority: "now",
    title: "Collapse How-to by default after first visit",
    detail:
      "Persist a collapsed HowToReadDashboard so Practice health and Recommended actions own the first viewport for returning managers.",
  },
  {
    id: "CC-R3",
    priority: "next",
    title: "Collapsible admin sidebar on small screens",
    detail:
      "Add a drawer / hamburger for Clinic admin nav below the md breakpoint so the briefing can use full width on phones.",
  },
  {
    id: "CC-R4",
    priority: "next",
    title: "In-UI persona switcher",
    detail:
      "Expose Practice Owner / Manager / Governance / Marketing as presentation chips that preserve data mode and range.",
  },
  {
    id: "CC-R5",
    priority: "later",
    title: "Empty-mode analytics narrative",
    detail:
      "When data=empty, soften Analytics Needs Attention into a “waiting for traffic” informational state so All clear alerts and overall Healthy stay coherent.",
  },
];

/**
 * QA8 Command Centre audit.
 * Command Centre Score = mean of nine CHECK dimensions.
 * Management Usability Score blends hierarchy, recommendations, deep links, roles, mobile.
 */
export const COMMAND_CENTRE_QA_AUDIT_QA8: CommandCentreQaAudit = (() => {
  const commandCentreScore = mean(Object.values(DIMENSION_SCORES));

  const managementUsabilityScore = mean([
    DIMENSION_SCORES.recommendations,
    DIMENSION_SCORES.deepLinks,
    DIMENSION_SCORES.roleViews,
    DIMENSION_SCORES.alerts,
    DIMENSION_SCORES.visualHierarchy,
    DIMENSION_SCORES.mobileUx,
    99, // C8 managementUsability baseline
  ]);

  const priorityFixes = [...ISSUES]
    .sort((a, b) => priorityRank(a.severity) - priorityRank(b.severity) || a.id.localeCompare(b.id))
    .filter((issue) => issue.severity === "P0" || issue.severity === "P1");

  const p0 = ISSUES.filter((issue) => issue.severity === "P0").length;

  return {
    promptId: "QA8",
    assessedOn: "2026-10-26",
    environment: "http://127.0.0.1:3000/admin",
    commandCentreScore,
    managementUsabilityScore,
    dimensionScores: DIMENSION_SCORES,
    coverage: {
      personas: "4/4 (practice_owner, practice_manager, governance_lead, marketing_growth)",
      dataModes: "Live · Demo · Empty",
      alertPanels: "Governance · Booking journey · Search",
      recommendationDeepLinks: "Fix List · Investigation · Related Dashboard",
      liveVerified: "demo recommendations + expired queue from=recommendation",
    },
    issues: ISSUES,
    recommendations: RECOMMENDATIONS,
    priorityFixes,
    recommendation:
      p0 > 0 || commandCentreScore < 80
        ? "NEEDS_COMMAND_CENTRE_PASS"
        : commandCentreScore >= 95 && managementUsabilityScore >= 95
          ? "COMMAND_CENTRE_LAUNCH_READY"
          : "COMMAND_CENTRE_OPERATIONAL_POLISH",
    reportPath: "apps/web/reports/COMMAND_CENTRE_QA_AUDIT_QA8.md",
  };
})();

export function getCommandCentreQaAudit(): CommandCentreQaAudit {
  return COMMAND_CENTRE_QA_AUDIT_QA8;
}

export function getCommandCentreScore(): number {
  return COMMAND_CENTRE_QA_AUDIT_QA8.commandCentreScore;
}

export function getManagementUsabilityScore(): number {
  return COMMAND_CENTRE_QA_AUDIT_QA8.managementUsabilityScore;
}
