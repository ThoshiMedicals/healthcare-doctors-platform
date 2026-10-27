/**
 * QA4 — Educational / Knowledge Centre template audit.
 * Corpus: old-html/knowledge (22 topic hubs + 87 articles = 109).
 * Live UAT samples + static scan; governance strips depend on `governance-published.js`.
 */

export type KnowledgeQaDimension =
  | "typography"
  | "readability"
  | "governanceStrips"
  | "authorVisibility"
  | "reviewInformation"
  | "knowledgePathways"
  | "conversionBands"
  | "internalLinking";

export type KnowledgeIssueSeverity = "P0" | "P1" | "P2" | "P3";

export type KnowledgeQaIssue = {
  id: string;
  severity: KnowledgeIssueSeverity;
  kind: "authority" | "ux" | "visual";
  dimension: KnowledgeQaDimension | "cross-cutting";
  title: string;
  detail: string;
  evidence: string;
  affectedCount?: number;
};

export type KnowledgeQaAudit = {
  promptId: "QA4";
  assessedOn: string;
  environment: string;
  templateCount: number;
  topicCount: number;
  articleCount: number;
  /** Pathways, conversion, readability, linking UX (0–100). */
  knowledgeUxScore: number;
  /** Governance, author, review, clinical authority signals (0–100). */
  authorityScore: number;
  /** Typography + visual shell consistency (0–100). */
  visualScore: number;
  /** Mean of the three headline scores. */
  complianceScore: number;
  dimensionScores: Record<KnowledgeQaDimension, number>;
  issues: KnowledgeQaIssue[];
  priorityFixes: KnowledgeQaIssue[];
  recommendation: "EDUCATION_TEMPLATES_ALIGNED" | "UX_ALIGNED_AUTHORITY_POLISH" | "NEEDS_KNOWLEDGE_PASS";
  reportPath: string;
};

function mean(values: number[]): number {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, n) => sum + n, 0) / values.length);
}

function priorityRank(severity: KnowledgeIssueSeverity): number {
  if (severity === "P0") return 0;
  if (severity === "P1") return 1;
  if (severity === "P2") return 2;
  return 3;
}

const DIMENSION_SCORES: Record<KnowledgeQaDimension, number> = {
  typography: 90,
  readability: 88,
  governanceStrips: 62,
  authorVisibility: 72,
  reviewInformation: 70,
  knowledgePathways: 92,
  conversionBands: 91,
  internalLinking: 89,
};

const ISSUES: KnowledgeQaIssue[] = [
  {
    id: "K-A1",
    severity: "P1",
    kind: "authority",
    dimension: "governanceStrips",
    title: "Published governance registry is empty",
    detail:
      "All 109 knowledge pages ship `data-governance-review` hosts, but `governance-published.js` freezes an empty map — Reviewed by / Last reviewed / Next review never render live.",
    evidence: "apps/web/public/governance-published.js → window.WMC_APPROVED_GOVERNANCE = Object.freeze({})",
    affectedCount: 109,
  },
  {
    id: "K-A2",
    severity: "P1",
    kind: "authority",
    dimension: "authorVisibility",
    title: "No named clinical authors on educational pages",
    detail:
      "Article bylines are generic (“Patient education · Australian primary-care context · Updated …”). Zero bylines name a clinician; JSON-LD author is Organization only.",
    evidence: "Static scan bylineMentionsDr 0/87; live why-preventive-healthcare-matters.html",
    affectedCount: 87,
  },
  {
    id: "K-A3",
    severity: "P2",
    kind: "authority",
    dimension: "reviewInformation",
    title: "Review metadata limited to byline Updated date",
    detail:
      "74/87 articles show an Updated stamp; topic hubs have none. Full clinical review fields never surface because the published registry is empty.",
    evidence: "Static byline 74/87 articles; live governance host remains hidden",
    affectedCount: 35,
  },
  {
    id: "K-U1",
    severity: "P2",
    kind: "ux",
    dimension: "authorVisibility",
    title: "Byline chrome missing on 13 articles and all topic hubs",
    detail: "Uneven meta strip under the hero — most articles have knowledge-byline; 13 articles and 22 topics do not.",
    evidence: "Static scan byline ok 74/109",
    affectedCount: 35,
  },
  {
    id: "K-U2",
    severity: "P3",
    kind: "ux",
    dimension: "readability",
    title: "No reading-time or key-takeaway aids",
    detail:
      "Readability relies on sectioned H2s, On This Page, and knowledge-reading.js mobile section toggle — no estimated read time or summary box.",
    evidence: "Static readabilityAids 0/109; knowledge-reading.js section browse only",
  },
  {
    id: "K-V1",
    severity: "P2",
    kind: "visual",
    dimension: "cross-cutting",
    title: "Call accessible name duplicates “Call Call …”",
    detail: "Same sitewide tel labelling defect as QA1–QA3.",
    evidence: "UAT a11y tree on knowledge articles and hubs",
  },
  {
    id: "K-U3",
    severity: "P3",
    kind: "ux",
    dimension: "knowledgePathways",
    title: "Topic hubs use guide grids instead of Related Guides chrome",
    detail:
      "Intentional hub pattern (patient-guide cards + search). Related-guides heading pattern is article-centric (87/109).",
    evidence: "Static relatedKnowledge missingSample = topic hubs",
  },
];

/**
 * QA4 educational content audit.
 * Knowledge UX = mean(typography, readability, pathways, conversion, linking).
 * Authority = mean(governance, author, review) blended with clinical link strength.
 * Visual = typography-led visual consistency score.
 */
export const KNOWLEDGE_QA_AUDIT_QA4: KnowledgeQaAudit = (() => {
  const knowledgeUxScore = mean([
    DIMENSION_SCORES.typography,
    DIMENSION_SCORES.readability,
    DIMENSION_SCORES.knowledgePathways,
    DIMENSION_SCORES.conversionBands,
    DIMENSION_SCORES.internalLinking,
  ]);

  // Clinical pathways (practitioners + AU sources + services) partially offset empty governance.
  const authorityScore = mean([
    DIMENSION_SCORES.governanceStrips,
    DIMENSION_SCORES.authorVisibility,
    DIMENSION_SCORES.reviewInformation,
    88, // related practitioners / trusted AU resources / service links on articles
  ]);

  const visualScore = mean([DIMENSION_SCORES.typography, 86, 85]);
  const complianceScore = mean([knowledgeUxScore, authorityScore, visualScore]);

  const priorityFixes = [...ISSUES]
    .sort((a, b) => priorityRank(a.severity) - priorityRank(b.severity) || a.id.localeCompare(b.id))
    .filter((issue) => issue.severity === "P0" || issue.severity === "P1");

  const p0 = ISSUES.filter((issue) => issue.severity === "P0").length;

  return {
    promptId: "QA4",
    assessedOn: "2026-10-26",
    environment: "http://127.0.0.1:3100/",
    templateCount: 109,
    topicCount: 22,
    articleCount: 87,
    knowledgeUxScore,
    authorityScore,
    visualScore,
    complianceScore,
    dimensionScores: DIMENSION_SCORES,
    issues: ISSUES,
    priorityFixes,
    recommendation:
      p0 > 0 || knowledgeUxScore < 80
        ? "NEEDS_KNOWLEDGE_PASS"
        : authorityScore >= 85 && knowledgeUxScore >= 90
          ? "EDUCATION_TEMPLATES_ALIGNED"
          : "UX_ALIGNED_AUTHORITY_POLISH",
    reportPath: "apps/web/reports/KNOWLEDGE_QA_AUDIT_QA4.md",
  };
})();

export function getKnowledgeQaAudit(): KnowledgeQaAudit {
  return KNOWLEDGE_QA_AUDIT_QA4;
}

export function getKnowledgeUxScore(): number {
  return KNOWLEDGE_QA_AUDIT_QA4.knowledgeUxScore;
}

export function getKnowledgeAuthorityScore(): number {
  return KNOWLEDGE_QA_AUDIT_QA4.authorityScore;
}

export function getKnowledgeVisualScore(): number {
  return KNOWLEDGE_QA_AUDIT_QA4.visualScore;
}
