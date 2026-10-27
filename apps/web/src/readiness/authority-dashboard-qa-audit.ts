/**
 * QA11 — Practitioner + Service Authority dashboards audit.
 * Checks: tier labels, charts, colors, badges, recommendations,
 * filter behaviour, explanations, visual consistency, actionability.
 */

export type AuthorityQaDimension =
  | "tierLabels"
  | "charts"
  | "colors"
  | "badges"
  | "recommendations"
  | "filterBehaviour"
  | "explanations"
  | "visualConsistency"
  | "actionability";

export type AuthorityIssueSeverity = "P0" | "P1" | "P2" | "P3";

export type AuthorityQaIssue = {
  id: string;
  severity: AuthorityIssueSeverity;
  dimension: AuthorityQaDimension | "cross-cutting";
  title: string;
  detail: string;
  evidence: string;
  /** When true, issue was found in live QA and patched in the same pass. */
  patchedInPass?: boolean;
};

export type AuthorityQaRecommendation = {
  id: string;
  priority: "now" | "next" | "later";
  title: string;
  detail: string;
};

export type AuthorityDashboardQaAudit = {
  promptId: "QA11";
  assessedOn: string;
  environment: string;
  /** Combined Practitioner + Service Authority product quality (0–100). */
  authorityDashboardScore: number;
  /** Practice-manager usability across both authority surfaces (0–100). */
  managementUsabilityScore: number;
  dimensionScores: Record<AuthorityQaDimension, number>;
  coverage: {
    practitionerTiers: string;
    serviceTiers: string;
    charts: string;
    tierFilter: string;
    dataModes: string;
  };
  issues: AuthorityQaIssue[];
  recommendations: AuthorityQaRecommendation[];
  priorityFixes: AuthorityQaIssue[];
  recommendation:
    | "AUTHORITY_DASHBOARD_LAUNCH_READY"
    | "AUTHORITY_DASHBOARD_OPERATIONAL_POLISH"
    | "NEEDS_AUTHORITY_DASHBOARD_PASS";
  reportPath: string;
};

function mean(values: number[]): number {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, n) => sum + n, 0) / values.length);
}

function priorityRank(severity: AuthorityIssueSeverity): number {
  if (severity === "P0") return 0;
  if (severity === "P1") return 1;
  if (severity === "P2") return 2;
  return 3;
}

/** Post-patch scores (tier-filter crash fixed during QA11). */
const DIMENSION_SCORES: Record<AuthorityQaDimension, number> = {
  tierLabels: 93,
  charts: 90,
  colors: 93,
  badges: 94,
  recommendations: 80,
  filterBehaviour: 88,
  explanations: 95,
  visualConsistency: 86,
  actionability: 88,
};

const ISSUES: AuthorityQaIssue[] = [
  {
    id: "AU-C1",
    severity: "P0",
    dimension: "filterBehaviour",
    title: "Tier filter crashed both Authority dashboards",
    detail:
      "Clicking Building links / Needs more links threw AUTHORITY_TIER_FRIENDLY is not defined on roster titles when tier= was set — blocking the primary investigate-roster path.",
    evidence:
      "Live crash on /admin/practitioner-authority?tier=Developing and /admin/service-authority?tier=Thin; patched by importing AUTHORITY_TIER_FRIENDLY in both page.tsx files",
    patchedInPass: true,
  },
  {
    id: "AU-G1",
    severity: "P1",
    dimension: "recommendations",
    title: "Governance investigation filters pollute Authority banners",
    detail:
      "Persisted queue=expired shows Viewing · Expired and clinical-review remediation steps on Doctor/Service strength pages, competing with tier investigation copy.",
    evidence: "Live Demo Authority pages — From chart / Viewing · Expired + governance Recommendations",
  },
  {
    id: "AU-V1",
    severity: "P2",
    dimension: "visualConsistency",
    title: "Practitioner vs Service tier chrome differs",
    detail:
      "Practitioners use three TierSummaryCards; Services use TierDistribution stacks + conversion mix. Friendly labels match, but managers learn two layouts for the same Hub/Developing/Thin model.",
    evidence: "practitioner-authority/visuals TierSummaryCards vs service-authority TierDistribution",
  },
  {
    id: "AU-R1",
    severity: "P2",
    dimension: "recommendations",
    title: "No native Recommended Actions strip",
    detail:
      "Actionability is tier investigate + chart focus + Conversion links. There is no prioritised RecommendedActionsPanel for high-authority/low-booking profiles (as Command Centre surfaces for Tanya).",
    evidence: "PA/SA pages — AuthorityInvestigationBlock only when tier filtered",
  },
  {
    id: "AU-S1",
    severity: "P3",
    dimension: "tierLabels",
    title: "Service section still names Hub / Developing / Thin in copy",
    detail:
      "UI badges use Well connected / Building links / Needs more links, but the Link strength section description still says “Hub ≥ 40 · Developing ≥ 14 · Thin < 14”.",
    evidence: "service-authority/page.tsx sa-tiers description",
  },
  {
    id: "AU-D1",
    severity: "P3",
    dimension: "visualConsistency",
    title: "Service title casing inconsistency (diabetes)",
    detail:
      "Demo rankings show lowercase “diabetes” beside title-cased peers (Family Health, Skin Checks).",
    evidence: "Live service-authority Demo ranked-by-views list",
  },
];

const RECOMMENDATIONS: AuthorityQaRecommendation[] = [
  {
    id: "AU-REC1",
    priority: "now",
    title: "Keep AUTHORITY_TIER_FRIENDLY imports covered by regression",
    detail:
      "Add a smoke assertion that tier=Developing and tier=Thin roster titles render without throwing (covers the P0 found in QA11).",
  },
  {
    id: "AU-REC2",
    priority: "now",
    title: "Isolate governance investigation filters from Authority",
    detail:
      "Do not show Expired review remediation on Doctor/Service strength unless arrival was from governance.",
  },
  {
    id: "AU-REC3",
    priority: "next",
    title: "Align tier investigation chrome across PA/SA",
    detail:
      "Share one TierSummary + optional conversion-mix pattern so managers learn one authority model.",
  },
  {
    id: "AU-REC4",
    priority: "next",
    title: "Authority Recommended Actions for high-view low-booking hubs",
    detail:
      "Surface Tanya-style convert-authority actions on the Doctor dashboard itself with Fix List / Investigation / Related Dashboard.",
  },
  {
    id: "AU-REC5",
    priority: "later",
    title: "Friendly-only tier copy + title casing cleanup",
    detail:
      "Replace remaining Hub/Developing/Thin prose on Service sections; normalise service display titles.",
  },
];

/**
 * QA11 Authority dashboards audit.
 * Authority Dashboard Score = mean of nine CHECK dimensions.
 * Management Usability = explanations + badges + tiers + filters + actionability + consistency.
 */
export const AUTHORITY_DASHBOARD_QA_AUDIT_QA11: AuthorityDashboardQaAudit = (() => {
  const authorityDashboardScore = mean(Object.values(DIMENSION_SCORES));

  const managementUsabilityScore = mean([
    DIMENSION_SCORES.explanations,
    DIMENSION_SCORES.badges,
    DIMENSION_SCORES.tierLabels,
    DIMENSION_SCORES.filterBehaviour,
    DIMENSION_SCORES.actionability,
    DIMENSION_SCORES.visualConsistency,
  ]);

  const openIssues = ISSUES.filter((issue) => !issue.patchedInPass);
  const priorityFixes = [...openIssues]
    .sort((a, b) => priorityRank(a.severity) - priorityRank(b.severity) || a.id.localeCompare(b.id))
    .filter((issue) => issue.severity === "P0" || issue.severity === "P1");

  const openP0 = openIssues.filter((issue) => issue.severity === "P0").length;

  return {
    promptId: "QA11",
    assessedOn: "2026-10-26",
    environment: "http://127.0.0.1:3000/admin/{practitioner,service}-authority",
    authorityDashboardScore,
    managementUsabilityScore,
    dimensionScores: DIMENSION_SCORES,
    coverage: {
      practitionerTiers: "Well connected 8 · Building links 5 · Needs more links 0 (Demo)",
      serviceTiers: "Well connected 4 · Building links 10 · Needs more links 16 (Demo)",
      charts: "PA comparison + rankings · SA rankings + DR entry + conversion stacks",
      tierFilter: "Developing / Thin roster filter verified after import patch",
      dataModes: "Live · Demo · Empty",
    },
    issues: ISSUES,
    recommendations: RECOMMENDATIONS,
    priorityFixes,
    recommendation:
      openP0 > 0 || authorityDashboardScore < 80
        ? "NEEDS_AUTHORITY_DASHBOARD_PASS"
        : authorityDashboardScore >= 95 && managementUsabilityScore >= 94
          ? "AUTHORITY_DASHBOARD_LAUNCH_READY"
          : "AUTHORITY_DASHBOARD_OPERATIONAL_POLISH",
    reportPath: "apps/web/reports/AUTHORITY_DASHBOARD_QA_AUDIT_QA11.md",
  };
})();

export function getAuthorityDashboardQaAudit(): AuthorityDashboardQaAudit {
  return AUTHORITY_DASHBOARD_QA_AUDIT_QA11;
}

export function getAuthorityDashboardScore(): number {
  return AUTHORITY_DASHBOARD_QA_AUDIT_QA11.authorityDashboardScore;
}

export function getAuthorityManagementUsabilityScore(): number {
  return AUTHORITY_DASHBOARD_QA_AUDIT_QA11.managementUsabilityScore;
}
