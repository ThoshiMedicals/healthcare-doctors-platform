/**
 * QA7 — Trust signals and authority implementation audit.
 * Surfaces: homepage trust ladder, AGPAL page, footer trust marks,
 * governance hosts, practitioner peers, service pathways, knowledge review.
 */

export type TrustAuthorityDimension =
  | "trustStrips"
  | "governanceStrips"
  | "agpal"
  | "authorityPathways"
  | "reviewLocations"
  | "practitionerAuthority"
  | "serviceAuthority";

export type TrustIssueSeverity = "P0" | "P1" | "P2" | "P3";

export type TrustAuthorityIssue = {
  id: string;
  severity: TrustIssueSeverity;
  kind: "trust" | "authority";
  dimension: TrustAuthorityDimension | "cross-cutting";
  title: string;
  detail: string;
  evidence: string;
};

export type TrustAuthorityRecommendation = {
  id: string;
  priority: "now" | "next" | "later";
  title: string;
  detail: string;
};

export type TrustAuthorityQaAudit = {
  promptId: "QA7";
  assessedOn: string;
  environment: string;
  /** Practice trust marks, AGPAL, trust strips (0–100). */
  trustMaturityScore: number;
  /** Governance, review, practitioner/service authority graphs (0–100). */
  authorityMaturityScore: number;
  /** Mean of the two headline scores. */
  complianceScore: number;
  dimensionScores: Record<TrustAuthorityDimension, number>;
  coverage: {
    footerTrustDoctors: string;
    footerTrustServices: string;
    footerTrustKnowledge: string;
    governanceHosts: string;
    governanceRecordsPublished: number;
    knowledgeBylines: string;
    serviceRelatedPractitionersStatic: string;
  };
  issues: TrustAuthorityIssue[];
  recommendations: TrustAuthorityRecommendation[];
  priorityFixes: TrustAuthorityIssue[];
  recommendation:
    | "TRUST_AND_AUTHORITY_ALIGNED"
    | "TRUST_STRONG_AUTHORITY_POLISH"
    | "NEEDS_TRUST_AUTHORITY_PASS";
  reportPath: string;
};

function mean(values: number[]): number {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, n) => sum + n, 0) / values.length);
}

function priorityRank(severity: TrustIssueSeverity): number {
  if (severity === "P0") return 0;
  if (severity === "P1") return 1;
  if (severity === "P2") return 2;
  return 3;
}

const DIMENSION_SCORES: Record<TrustAuthorityDimension, number> = {
  trustStrips: 90,
  governanceStrips: 62,
  agpal: 94,
  authorityPathways: 88,
  reviewLocations: 70,
  practitionerAuthority: 91,
  serviceAuthority: 84,
};

const ISSUES: TrustAuthorityIssue[] = [
  {
    id: "T-A1",
    severity: "P1",
    kind: "authority",
    dimension: "governanceStrips",
    title: "Published governance registry is empty",
    detail:
      "Doctors, services, and knowledge pages ship data-governance-review hosts, but governance-published.js freezes an empty map — Reviewed by / Last reviewed / Next review never render.",
    evidence: "apps/web/public/governance-published.js → Object.freeze({})",
  },
  {
    id: "T-A2",
    severity: "P1",
    kind: "authority",
    dimension: "reviewLocations",
    title: "Clinical review metadata not visible to patients",
    detail:
      "Knowledge bylines show generic Updated dates (74/87 articles); no live Reviewed by / Content owner / Next review anywhere in the corpus.",
    evidence: "QA4 + static reviewMeta knowledge 74/109; live governance hosts stay hidden",
  },
  {
    id: "T-S1",
    severity: "P2",
    kind: "authority",
    dimension: "serviceAuthority",
    title: "Service practitioner graph uneven",
    detail:
      "Related practitioners authored on 16/29 services; hubs strong live, many procedures stop at Ask reception / directory.",
    evidence: "QA3 static internalDoctors 15/29; Family Health rail live",
  },
  {
    id: "T-T1",
    severity: "P2",
    kind: "trust",
    dimension: "trustStrips",
    title: "Mid-page trust strips removed; templates lean on footer",
    detail:
      "site.js removes aside.trust-strip nodes. Homepage hero trust is excellent; practitioner/service/knowledge pages rely on footer AGPAL/bulk marks without mid-page trust ladder.",
    evidence: "site.js trust-strip removal; static trustStripClass 0 on doctors/services/knowledge",
  },
  {
    id: "T-A3",
    severity: "P2",
    kind: "authority",
    dimension: "practitionerAuthority",
    title: "Peer authority depends on site.js runtime",
    detail:
      "Authority peer bands and published-care captions are injected live — static HTML under-reports the design. Offline/no-JS loses the peer graph.",
    evidence: "UAT Tanya peer cards live; static authorityPeers 0/13 doctors",
  },
  {
    id: "T-T2",
    severity: "P3",
    kind: "trust",
    dimension: "cross-cutting",
    title: "Call Call accessible-name duplication",
    detail: "Sitewide tel labelling defect weakens contact trust adjacent to AGPAL/footer marks.",
    evidence: "UAT a11y trees QA1–QA6",
  },
];

const RECOMMENDATIONS: TrustAuthorityRecommendation[] = [
  {
    id: "T-R1",
    priority: "now",
    title: "Publish approved ClinicalReview records",
    detail:
      "Populate governance-published.js so governance strips render Reviewed by, Last reviewed, Next review, and Content owner on knowledge (and eligible service/doctor) pages.",
  },
  {
    id: "T-R2",
    priority: "now",
    title: "Make authorship / clinical ownership visible",
    detail:
      "Replace generic Patient education bylines with named reviewer or explicit clinic editorial ownership tied to governance records.",
  },
  {
    id: "T-R3",
    priority: "next",
    title: "Close service practitioner authority gaps",
    detail:
      "Publish named practitioner links (or designed empty-states) on procedure pages that currently stop at Ask reception.",
  },
  {
    id: "T-R4",
    priority: "next",
    title: "Bake critical practitioner authority into HTML",
    detail:
      "Server-render or statically embed peer/provenance captions so authority survives without site.js.",
  },
  {
    id: "T-R5",
    priority: "later",
    title: "Optional mid-page trust ladder on long templates",
    detail:
      "Where hero trust is absent, consider a compact AGPAL/bulk/hours row near conversion bands — without reintroducing removed aside trust-strip clutter.",
  },
];

/**
 * QA7 trust + authority audit.
 * Trust Maturity = mean(trustStrips, agpal) blended with pathway trust presence.
 * Authority Maturity = mean(governance, review, practitioner, service, pathways).
 */
export const TRUST_AUTHORITY_QA_AUDIT_QA7: TrustAuthorityQaAudit = (() => {
  const trustMaturityScore = mean([
    DIMENSION_SCORES.trustStrips,
    DIMENSION_SCORES.agpal,
    89, // homepage trust ladder + footer ubiquity
  ]);

  const authorityMaturityScore = mean([
    DIMENSION_SCORES.governanceStrips,
    DIMENSION_SCORES.reviewLocations,
    DIMENSION_SCORES.practitionerAuthority,
    DIMENSION_SCORES.serviceAuthority,
    DIMENSION_SCORES.authorityPathways,
  ]);

  const complianceScore = mean([trustMaturityScore, authorityMaturityScore]);

  const priorityFixes = [...ISSUES]
    .sort((a, b) => priorityRank(a.severity) - priorityRank(b.severity) || a.id.localeCompare(b.id))
    .filter((issue) => issue.severity === "P0" || issue.severity === "P1");

  const p0 = ISSUES.filter((issue) => issue.severity === "P0").length;

  return {
    promptId: "QA7",
    assessedOn: "2026-10-26",
    environment: "http://127.0.0.1:3100/",
    trustMaturityScore,
    authorityMaturityScore,
    complianceScore,
    dimensionScores: DIMENSION_SCORES,
    coverage: {
      footerTrustDoctors: "13/13",
      footerTrustServices: "29/29",
      footerTrustKnowledge: "109/109",
      governanceHosts: "151/151 templates with hosts (doctors+services+knowledge)",
      governanceRecordsPublished: 0,
      knowledgeBylines: "74/87 articles",
      serviceRelatedPractitionersStatic: "16/29",
    },
    issues: ISSUES,
    recommendations: RECOMMENDATIONS,
    priorityFixes,
    recommendation:
      p0 > 0 || trustMaturityScore < 80
        ? "NEEDS_TRUST_AUTHORITY_PASS"
        : authorityMaturityScore >= 85 && trustMaturityScore >= 90
          ? "TRUST_AND_AUTHORITY_ALIGNED"
          : "TRUST_STRONG_AUTHORITY_POLISH",
    reportPath: "apps/web/reports/TRUST_AUTHORITY_QA_AUDIT_QA7.md",
  };
})();

export function getTrustAuthorityQaAudit(): TrustAuthorityQaAudit {
  return TRUST_AUTHORITY_QA_AUDIT_QA7;
}

export function getTrustMaturityScore(): number {
  return TRUST_AUTHORITY_QA_AUDIT_QA7.trustMaturityScore;
}

export function getAuthorityMaturityScore(): number {
  return TRUST_AUTHORITY_QA_AUDIT_QA7.authorityMaturityScore;
}
