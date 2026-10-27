/**
 * QA3 — Service template audit (all `old-html/services/*.html`, 29 pages).
 * Live UAT review + static scan; conversion/trust/pathway rails enriched by `site.js`.
 */

export type ServiceQaDimension =
  | "hero"
  | "conversionBands"
  | "trustStrips"
  | "relatedPractitioners"
  | "knowledgePathways"
  | "authorityStructure"
  | "internalLinking"
  | "mobileResponsiveness";

export type ServiceIssueSeverity = "P0" | "P1" | "P2" | "P3";

export type ServiceQaIssue = {
  id: string;
  severity: ServiceIssueSeverity;
  kind: "template-deviation" | "visual-inconsistency" | "missing-connection";
  dimension: ServiceQaDimension | "cross-cutting";
  title: string;
  detail: string;
  evidence: string;
  affected?: string[];
};

export type ServiceQaAudit = {
  promptId: "QA3";
  assessedOn: string;
  environment: string;
  templateCount: number;
  /** Headline service template score 0–100. */
  serviceScore: number;
  dimensionScores: Record<ServiceQaDimension, number>;
  templateFamilies: {
    serviceHub: string[];
    focusedService: string[];
    independentProvider: string[];
  };
  templateDeviations: ServiceQaIssue[];
  visualInconsistencies: ServiceQaIssue[];
  missingConnections: ServiceQaIssue[];
  priorityFixes: ServiceQaIssue[];
  recommendation: "SERVICE_TEMPLATES_ALIGNED" | "ALIGNED_WITH_POLISH" | "NEEDS_SERVICE_PASS";
  reportPath: string;
};

function mean(values: number[]): number {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, n) => sum + n, 0) / values.length);
}

function priorityRank(severity: ServiceIssueSeverity): number {
  if (severity === "P0") return 0;
  if (severity === "P1") return 1;
  if (severity === "P2") return 2;
  return 3;
}

const DIMENSION_SCORES: Record<ServiceQaDimension, number> = {
  hero: 91,
  conversionBands: 90,
  trustStrips: 88,
  relatedPractitioners: 78,
  knowledgePathways: 92,
  authorityStructure: 86,
  internalLinking: 84,
  mobileResponsiveness: 87,
};

/** Hub-style templates (homepage service pathways + broad IA). */
const SERVICE_HUBS = [
  "family-health.html",
  "womens-health.html",
  "mens-health.html",
  "childrens-health.html",
  "mental-health.html",
  "chronic-disease-care.html",
  "preventive-healthcare.html",
  "skin-checks.html",
  "skin-cancer-care.html",
  "medical-procedures.html",
  "allied-health.html",
  "telehealth.html",
  "vaccinations.html",
];

const INDEPENDENT_PROVIDERS = ["pathology.html", "pharmacy.html", "radiology.html"];

/** Focused procedure / niche pages with thinner practitioner graphs. */
const FOCUSED_NO_DOCTOR_LINKS = [
  "breast-check.html",
  "ear-care-ear-syringing.html",
  "ecg.html",
  "iron-infusions.html",
  "nebulising.html",
  "pap-smear-cervical-screening.html",
  "pre-pregnancy-care.html",
  "prostate-care.html",
  "spirometry.html",
  "wound-dressings.html",
];

const TEMPLATE_DEVIATIONS: ServiceQaIssue[] = [
  {
    id: "S-T1",
    severity: "P2",
    kind: "template-deviation",
    dimension: "hero",
    title: "Two hero badges: Service hub vs Focused service",
    detail: "Intentional family split is clear live, but static HTML alone does not declare the family — badge/copy come from runtime/content conventions.",
    evidence: "UAT Family Health (SERVICE HUB) vs ECG (FOCUSED SERVICE)",
  },
  {
    id: "S-T2",
    severity: "P2",
    kind: "template-deviation",
    dimension: "conversionBands",
    title: "Hub conversion bands largely runtime-injected",
    detail: "Static conversion-band chrome appears on 13/29 (mostly focused pages); hubs rely on site.js for Book this service / pathway rails.",
    evidence: "Static scan conversionBand 13/29; live Family Health via site.js",
  },
  {
    id: "S-T3",
    severity: "P3",
    kind: "template-deviation",
    dimension: "authorityStructure",
    title: "Related Services heading coverage uneven in static HTML",
    detail: "All pages link to other services; authored “Related Services” section chrome is inconsistent before runtime normalisation.",
    evidence: "Static scan relatedServices heading 13/29; internalServices 29/29",
  },
];

const VISUAL_INCONSISTENCIES: ServiceQaIssue[] = [
  {
    id: "S-V1",
    severity: "P2",
    kind: "visual-inconsistency",
    dimension: "relatedPractitioners",
    title: "Empty practitioner card vs populated hub lists",
    detail: "Focused pages show “Ask reception which practitioner is available” while hubs list named profiles — same rail, uneven visual density.",
    evidence: "UAT /services/ecg.html vs /services/family-health.html",
    affected: FOCUSED_NO_DOCTOR_LINKS,
  },
  {
    id: "S-V2",
    severity: "P1",
    kind: "visual-inconsistency",
    dimension: "cross-cutting",
    title: "Call accessible name duplicates “Call Call …”",
    detail: "Same sitewide tel labelling defect as homepage/practitioner audits.",
    evidence: "UAT a11y tree on service pages",
  },
  {
    id: "S-V3",
    severity: "P3",
    kind: "visual-inconsistency",
    dimension: "hero",
    title: "Independent-provider heroes share clinic conversion chrome",
    detail: "Pathology / Radiology / Pharmacy still surface Book Appointment dock while copy marks independent providers — can read as clinic-owned booking.",
    evidence: "pathology.html · radiology.html · pharmacy.html",
    affected: INDEPENDENT_PROVIDERS,
  },
];

const MISSING_CONNECTIONS: ServiceQaIssue[] = [
  {
    id: "S-M1",
    severity: "P1",
    kind: "missing-connection",
    dimension: "relatedPractitioners",
    title: "14 services lack doctor deep-links in authored HTML",
    detail: "Runtime rail still appears, but without published profile links authority pathway stops at Meet Our Team / reception.",
    evidence: "Static scan internalDoctors missing 14/29",
    affected: [
      ...FOCUSED_NO_DOCTOR_LINKS,
      ...INDEPENDENT_PROVIDERS,
      "telehealth.html",
    ],
  },
  {
    id: "S-M2",
    severity: "P2",
    kind: "missing-connection",
    dimension: "relatedPractitioners",
    title: "Some procedure pages only have a single practitioner link",
    detail: "Implanon / IUD pages have one doctor link — thin vs hub peer sets.",
    evidence: "Static scan thinAuthority",
    affected: ["implanon-insertion-removal.html", "iud-insertion-removal.html"],
  },
  {
    id: "S-M3",
    severity: "P3",
    kind: "missing-connection",
    dimension: "internalLinking",
    title: "Knowledge volume varies while always present",
    detail: "Every service has knowledge links; focused pages often 4–6 guides vs richer hubs.",
    evidence: "Static knowledgeLinks across services/",
  },
];

const ALL_ISSUES = [...TEMPLATE_DEVIATIONS, ...VISUAL_INCONSISTENCIES, ...MISSING_CONNECTIONS];

/**
 * QA3 service template audit.
 * Service Score = mean of eight dimension scores.
 */
export const SERVICE_QA_AUDIT_QA3: ServiceQaAudit = (() => {
  const serviceScore = mean(Object.values(DIMENSION_SCORES));
  const priorityFixes = [...ALL_ISSUES]
    .sort((a, b) => priorityRank(a.severity) - priorityRank(b.severity) || a.id.localeCompare(b.id))
    .filter((issue) => issue.severity === "P0" || issue.severity === "P1");

  const focusedService = [
    "antenatal-postnatal-care.html",
    "breast-check.html",
    "ear-care-ear-syringing.html",
    "ecg.html",
    "implanon-insertion-removal.html",
    "iron-infusions.html",
    "iud-insertion-removal.html",
    "nebulising.html",
    "pap-smear-cervical-screening.html",
    "pre-pregnancy-care.html",
    "prostate-care.html",
    "spirometry.html",
    "wound-dressings.html",
  ];

  const p0 = ALL_ISSUES.filter((issue) => issue.severity === "P0").length;

  return {
    promptId: "QA3",
    assessedOn: "2026-10-26",
    environment: "http://127.0.0.1:3100/",
    templateCount: 29,
    serviceScore,
    dimensionScores: DIMENSION_SCORES,
    templateFamilies: {
      serviceHub: SERVICE_HUBS,
      focusedService,
      independentProvider: INDEPENDENT_PROVIDERS,
    },
    templateDeviations: TEMPLATE_DEVIATIONS,
    visualInconsistencies: VISUAL_INCONSISTENCIES,
    missingConnections: MISSING_CONNECTIONS,
    priorityFixes,
    recommendation:
      p0 > 0 || serviceScore < 80
        ? "NEEDS_SERVICE_PASS"
        : serviceScore >= 90 && DIMENSION_SCORES.relatedPractitioners >= 88
          ? "SERVICE_TEMPLATES_ALIGNED"
          : "ALIGNED_WITH_POLISH",
    reportPath: "apps/web/reports/SERVICE_QA_AUDIT_QA3.md",
  };
})();

export function getServiceQaAudit(): ServiceQaAudit {
  return SERVICE_QA_AUDIT_QA3;
}

export function getServiceScore(): number {
  return SERVICE_QA_AUDIT_QA3.serviceScore;
}
