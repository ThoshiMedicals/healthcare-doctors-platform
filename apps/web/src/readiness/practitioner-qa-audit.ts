/**
 * QA2 — Practitioner profile template audit.
 * Live UAT review + static scan of all `old-html/doctors/*.html` (13 templates).
 */

export type PractitionerQaDimension =
  | "bookingPaths"
  | "contactActions"
  | "authoritySections"
  | "relatedServices"
  | "relatedKnowledge"
  | "trustStrips"
  | "profileImagery"
  | "typography"
  | "spacing"
  | "mobileBehaviour";

export type PractitionerIssueSeverity = "P0" | "P1" | "P2" | "P3";

export type PractitionerQaIssue = {
  id: string;
  severity: PractitionerIssueSeverity;
  dimension: PractitionerQaDimension | "cross-cutting";
  title: string;
  detail: string;
  evidence: string;
  affected?: string[];
};

export type PractitionerQaAudit = {
  promptId: "QA2";
  assessedOn: string;
  environment: string;
  templateCount: number;
  templatePaths: string[];
  /** One design language across profiles (0–100). */
  consistencyScore: number;
  /** Visual polish / imagery / type / spacing (0–100). */
  visualScore: number;
  /** Booking, contact, authority, pathways function (0–100). */
  functionalScore: number;
  /** Mean of the three headline scores. */
  complianceScore: number;
  dimensionScores: Record<PractitionerQaDimension, number>;
  conversionModel: {
    primary: string;
    phoneOnlyVariant: string[];
    hotdocDeepLinkCount: number;
    runtimeEnrichment: string[];
  };
  issues: PractitionerQaIssue[];
  priorityFixes: PractitionerQaIssue[];
  recommendation: "ONE_LANGUAGE_ONE_MODEL" | "ONE_LANGUAGE_WITH_POLISH" | "NEEDS_TEMPLATE_PASS";
  reportPath: string;
};

function mean(values: number[]): number {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, n) => sum + n, 0) / values.length);
}

function priorityRank(severity: PractitionerIssueSeverity): number {
  if (severity === "P0") return 0;
  if (severity === "P1") return 1;
  if (severity === "P2") return 2;
  return 3;
}

const DIMENSION_SCORES: Record<PractitionerQaDimension, number> = {
  bookingPaths: 90,
  contactActions: 84,
  authoritySections: 92,
  relatedServices: 91,
  relatedKnowledge: 90,
  trustStrips: 88,
  profileImagery: 78,
  typography: 86,
  spacing: 88,
  mobileBehaviour: 87,
};

const ISSUES: PractitionerQaIssue[] = [
  {
    id: "P-F1",
    severity: "P1",
    dimension: "contactActions",
    title: "Call control announces “Call Call …”",
    detail: "Accessible name duplicates “Call” on profile hero/footer tel links (sitewide pattern).",
    evidence: "UAT a11y tree on /doctors/dr-tanya-goodwill.html and peers",
  },
  {
    id: "P-V1",
    severity: "P1",
    dimension: "profileImagery",
    title: "Two profiles ship without practitioner photography",
    detail: "Hero lacks doctor-profile-photo / team asset — layout still works but breaks visual parity.",
    evidence: "old-html/doctors scan",
    affected: ["dr-nirupa-sivathasan.html", "mr-samuel-stafford.html"],
  },
  {
    id: "P-C1",
    severity: "P2",
    dimension: "typography",
    title: "Qualification string formatting drifts",
    detail: "MBBS/FRACGP vs M.B.B.Ch vs long chiropractic degrees vs honest empty copy — readable but not one typographic convention.",
    evidence: "Qualifications blocks across GP / O&G / chiro / physio templates",
  },
  {
    id: "P-C2",
    severity: "P2",
    dimension: "authoritySections",
    title: "Aside remains Patient Information ops list",
    detail: "Primary chrome still lists booking/fees ops; peer authority lives in-page after Related Services (4G residual).",
    evidence: "aside#related-pages on practitioner templates",
  },
  {
    id: "P-F2",
    severity: "P2",
    dimension: "bookingPaths",
    title: "Phone-only booking variant must stay visually primary",
    detail: "Dr Mary Abadir correctly uses Call Reception (no HotDoc deep-link). Dock still exposes Book Appointment chrome that can confuse unless labels stay phone-first.",
    evidence: "UAT /doctors/dr-mary-abadir.html — Call reception to book",
    affected: ["dr-mary-abadir.html"],
  },
  {
    id: "P-V2",
    severity: "P2",
    dimension: "profileImagery",
    title: "Thin care-highlight sets look sparse in hero",
    detail: "Profiles with only 1–2 chips (e.g. General practice · Primary care) leave large empty hero space vs rich GP profiles.",
    evidence: "UAT /doctors/dr-nirupa-sivathasan.html",
    affected: ["dr-nirupa-sivathasan.html"],
  },
  {
    id: "P-F3",
    severity: "P3",
    dimension: "relatedKnowledge",
    title: "Related guide volume varies widely",
    detail: "All templates include Patient guides; count ranges ~3–18. Empty-state honesty is good; density is uneven.",
    evidence: "Static link counts across doctors/*.html",
  },
  {
    id: "P-C3",
    severity: "P3",
    dimension: "cross-cutting",
    title: "Authority enrichment depends on site.js runtime",
    detail: "Expertise caption, Ready-to-book band, and peer band are injected — static HTML alone under-represents the design language.",
    evidence: "apps/web/public/site.js practitioner enrichment",
  },
];

/**
 * QA2 practitioner profile audit after 4E authority + conversion dock model.
 *
 * Consistency = shared template + shared conversion grammar across 13 profiles.
 * Visual = imagery, type, spacing, trust presentation.
 * Functional = booking/contact/authority/related pathways.
 */
export const PRACTITIONER_QA_AUDIT_QA2: PractitionerQaAudit = (() => {
  const consistencyScore = mean([
    DIMENSION_SCORES.authoritySections,
    DIMENSION_SCORES.relatedServices,
    DIMENSION_SCORES.relatedKnowledge,
    DIMENSION_SCORES.bookingPaths,
    DIMENSION_SCORES.typography,
    DIMENSION_SCORES.spacing,
  ]);
  const visualScore = mean([
    DIMENSION_SCORES.profileImagery,
    DIMENSION_SCORES.typography,
    DIMENSION_SCORES.spacing,
    DIMENSION_SCORES.trustStrips,
    DIMENSION_SCORES.mobileBehaviour,
  ]);
  const functionalScore = mean([
    DIMENSION_SCORES.bookingPaths,
    DIMENSION_SCORES.contactActions,
    DIMENSION_SCORES.authoritySections,
    DIMENSION_SCORES.relatedServices,
    DIMENSION_SCORES.relatedKnowledge,
    DIMENSION_SCORES.mobileBehaviour,
  ]);
  const complianceScore = mean([consistencyScore, visualScore, functionalScore]);
  const priorityFixes = [...ISSUES]
    .sort((a, b) => priorityRank(a.severity) - priorityRank(b.severity) || a.id.localeCompare(b.id))
    .filter((issue) => issue.severity === "P0" || issue.severity === "P1");

  const p0 = ISSUES.filter((issue) => issue.severity === "P0").length;

  return {
    promptId: "QA2",
    assessedOn: "2026-10-26",
    environment: "http://127.0.0.1:3100/",
    templateCount: 13,
    templatePaths: [
      "old-html/doctors/dr-anand-singh.html",
      "old-html/doctors/dr-debra-larkins.html",
      "old-html/doctors/dr-gemunu-suresh-ranawake.html",
      "old-html/doctors/dr-kooshyar-karimi.html",
      "old-html/doctors/dr-mary-abadir.html",
      "old-html/doctors/dr-nirupa-sivathasan.html",
      "old-html/doctors/dr-sambo-luon.html",
      "old-html/doctors/dr-steven-chang.html",
      "old-html/doctors/dr-sumita-singh.html",
      "old-html/doctors/dr-tanya-goodwill.html",
      "old-html/doctors/dr-usman-gul.html",
      "old-html/doctors/dr-wasantha-hettiarchchi.html",
      "old-html/doctors/mr-samuel-stafford.html",
    ],
    consistencyScore,
    visualScore,
    functionalScore,
    complianceScore,
    dimensionScores: DIMENSION_SCORES,
    conversionModel: {
      primary: "HotDoc practitioner deep-link Book Appointment + Call + Digital Reception dock",
      phoneOnlyVariant: ["dr-mary-abadir.html"],
      hotdocDeepLinkCount: 12,
      runtimeEnrichment: [
        "Published areas of care caption",
        "Ready to book with {name} mid-page band",
        "Other practitioners in related care areas peer band",
      ],
    },
    issues: ISSUES,
    priorityFixes,
    recommendation:
      p0 > 0 || complianceScore < 80
        ? "NEEDS_TEMPLATE_PASS"
        : consistencyScore >= 90 && functionalScore >= 90
          ? "ONE_LANGUAGE_ONE_MODEL"
          : "ONE_LANGUAGE_WITH_POLISH",
    reportPath: "apps/web/reports/PRACTITIONER_QA_AUDIT_QA2.md",
  };
})();

export function getPractitionerQaAudit(): PractitionerQaAudit {
  return PRACTITIONER_QA_AUDIT_QA2;
}

export function getPractitionerConsistencyScore(): number {
  return PRACTITIONER_QA_AUDIT_QA2.consistencyScore;
}

export function getPractitionerVisualScore(): number {
  return PRACTITIONER_QA_AUDIT_QA2.visualScore;
}

export function getPractitionerFunctionalScore(): number {
  return PRACTITIONER_QA_AUDIT_QA2.functionalScore;
}
