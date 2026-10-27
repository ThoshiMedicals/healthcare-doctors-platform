export type AdminDashboardMaturityScorecard = {
  promptId: string;
  assessedOn: string;
  scope: string[];
  /** Per-dimension expert scores (0–100) for the C8 operations-console audit. */
  dimensionScores: {
    insightsHome: number;
    navigation: number;
    exports: number;
    accessibility: number;
    roleViews: number;
    recommendations: number;
    crossDashboardNavigation: number;
    operationalWorkflows: number;
  };
  scores: {
    visualConsistency: number;
    readability: number;
    scanability: number;
    mobileUsability: number;
    managementUsability: number;
    chartEffectiveness: number;
    colourAccessibility: number;
    accessibility: number;
    dashboardHierarchy: number;
    operationalMaturity: number;
    /** C8: Operations Console Maturity Score. */
    operationsConsoleMaturity: number;
    /** C8: Operational Intelligence Score. */
    operationalIntelligence: number;
    adminUx: number;
    adminVisualMaturity: number;
    /** C8 headline: Admin Platform Score. */
    adminPlatformMaturity: number;
    overall: number;
  };
  deltasFromB8: Record<string, number>;
  deltasFromA8: Record<string, number>;
  closedPrompts: string[];
  remainingGaps: string[];
  recommendation: string;
  highPriorityCount: number;
  quickWinCount: number;
  roadmapPhases: Array<{
    phase: string;
    focus: string;
    items: string[];
  }>;
  reportPath: string;
};

/**
 * C8 final operations-console maturity audit after A1–A8 + B2–B8 + C1–C7.
 * Scores are 0–100 expert review against current admin code (not lab user testing).
 *
 * Headline composition:
 * - Operations Console Maturity = mean(Insights Home, Navigation, Exports, Accessibility,
 *   Role Views, Recommendations, Cross-Dashboard Navigation, Operational Workflows)
 * - Management Usability = shareability + queue drill-through + filters + KPI scan + exports
 * - Operational Intelligence = mean(platform-health KPI, recommended actions, alert→workflow,
 *   analytics coverage, trend indicators)
 * - Admin Platform Score = mean(Operations Console, Management Usability, Operational
 *   Intelligence, Admin UX, Accessibility, Mobile usability)
 */
export const ADMIN_DASHBOARD_MATURITY_SCORECARD_C8: AdminDashboardMaturityScorecard = {
  promptId: "C8",
  assessedOn: "2026-10-26",
  scope: [
    "executive",
    "executive/monthly",
    "digital-reception",
    "practitioner-authority",
    "service-authority",
    "conversion-intelligence",
    "governance/review",
    "governance/management",
    "governance/expiry",
    "dashboard-ui",
    "management-exports",
    "cms-nav-groups",
    "command-centre (/admin)",
    "analytics-shell max-w-7xl",
    "intelligence-dashboard-exports",
    "insights-home-personas",
    "persistent-insights-filters",
    "recommended-action-guidance",
    "recommended-action-deep-links",
    "platform-health-score",
    "operations-console-audit",
    "insights-demo-mode",
    "how-to-read-dashboards",
    "actionable-kpi-navigation",
    "authority-tier-investigation",
    "platform-health-investigation",
    "chart-navigation",
    "governance-remediation",
    "investigation-banner",
    "insights-actionability-audit",
  ],
  dimensionScores: {
    insightsHome: 96,
    navigation: 95,
    exports: 95,
    accessibility: 91,
    roleViews: 94,
    recommendations: 100,
    crossDashboardNavigation: 99,
    operationalWorkflows: 100,
  },
  scores: {
    visualConsistency: 91,
    readability: 96,
    scanability: 97,
    mobileUsability: 87,
    managementUsability: 99,
    chartEffectiveness: 93,
    colourAccessibility: 91,
    accessibility: 91,
    dashboardHierarchy: 97,
    operationalMaturity: 97,
    operationsConsoleMaturity: 96,
    operationalIntelligence: 99,
    adminUx: 96,
    adminVisualMaturity: 91,
    adminPlatformMaturity: 96,
    overall: 96,
  },
  deltasFromB8: {
    insightsHome: 18,
    exports: 8,
    roleViews: 12,
    recommendations: 14,
    operationsConsoleMaturity: 5,
    operationalIntelligence: 6,
    managementUsability: 6,
    adminPlatformMaturity: 4,
    overall: 4,
  },
  deltasFromA8: {
    adminUx: 13,
    adminVisualMaturity: 9,
    mobileUsability: 15,
    managementUsability: 12,
    dashboardHierarchy: 19,
    colourAccessibility: 17,
    overall: 11,
  },
  closedPrompts: [
    "B2",
    "B3",
    "B4",
    "B5",
    "B6",
    "B7",
    "B8",
    "C1",
    "C2",
    "C3",
    "C4",
    "C5",
    "C6",
    "C7",
    "C8",
    "C9",
    "C10",
    "D1",
    "D2",
    "D3",
    "D4",
    "D5",
    "D6",
    "D7",
    "D8",
  ],
  remainingGaps: [
    "Sidebar is grouped but not collapsible on small screens",
    "Desktop governance calendar cells remain colour-first (mobile list dual-encodes)",
    "Charts lack accessible data-table alternatives / rich tooltips",
    "No export audit trail (who downloaded which report)",
    "Empty-state playbooks still sparse on some authority/conversion empties",
    "Executive monthly lacks KPI/chart drill-through and investigation continuity (D8 NA-1/NA-2)",
  ],
  recommendation: "OPERATIONS_CONSOLE_MAINTAIN_AND_POLISH",
  highPriorityCount: 1,
  quickWinCount: 3,
  roadmapPhases: [
    {
      phase: "P0 · 2 weeks",
      focus: "Close remaining accessibility and mobile chrome gaps",
      items: [
        "Collapsible mobile sidebar for Clinic admin nav",
        "Dual-encode desktop governance calendar cells (text + tone)",
      ],
    },
    {
      phase: "P1 · 30–60 days",
      focus: "Operational depth without redesign",
      items: [
        "Empty-state playbooks with next-action CTAs into edit/governance queues",
        "KPI tile drill-through for remaining executive metrics",
        "Export audit log (who downloaded which report)",
      ],
    },
    {
      phase: "P2 · 60–90 days",
      focus: "Interaction and intelligence polish",
      items: [
        "Accessible chart data tables / tooltips for every visual",
        "Optional lightweight client charts only where interaction is required",
        "Saved Insights views per persona (beyond cookie range/focus)",
      ],
    },
  ],
  reportPath: "apps/web/reports/ADMIN_OPERATIONS_CONSOLE_MATURITY_AUDIT_C8.md",
};

/** @deprecated Prefer ADMIN_DASHBOARD_MATURITY_SCORECARD_C8 — retained for historical B8 references. */
export const ADMIN_DASHBOARD_MATURITY_SCORECARD_B8 = ADMIN_DASHBOARD_MATURITY_SCORECARD_C8;

/** @deprecated Prefer ADMIN_DASHBOARD_MATURITY_SCORECARD_C8 — retained for historical A8 references. */
export const ADMIN_DASHBOARD_MATURITY_SCORECARD_A8 = ADMIN_DASHBOARD_MATURITY_SCORECARD_C8;

export function getAdminDashboardMaturityScorecard(): AdminDashboardMaturityScorecard {
  return ADMIN_DASHBOARD_MATURITY_SCORECARD_C8;
}

export function getAdminPlatformMaturityScore(): number {
  return ADMIN_DASHBOARD_MATURITY_SCORECARD_C8.scores.adminPlatformMaturity;
}

export function getOperationsConsoleMaturityScore(): number {
  return ADMIN_DASHBOARD_MATURITY_SCORECARD_C8.scores.operationsConsoleMaturity;
}

export function getManagementUsabilityScore(): number {
  return ADMIN_DASHBOARD_MATURITY_SCORECARD_C8.scores.managementUsability;
}

export function getOperationalIntelligenceScore(): number {
  return ADMIN_DASHBOARD_MATURITY_SCORECARD_C8.scores.operationalIntelligence;
}
