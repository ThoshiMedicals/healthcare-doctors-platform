/**
 * QA1 — Complete homepage audit against platform architecture + visual system.
 * Live review on UAT `http://127.0.0.1:3100/` (2026-10-26) + markup/CSS evidence.
 */

export type HomepageSectionId =
  | "hero"
  | "navigation"
  | "trust-row"
  | "booking-cta"
  | "digital-reception-cta"
  | "service-pathways"
  | "practitioner-pathways"
  | "footer";

export type HomepageCheckId =
  | "visualConsistency"
  | "typography"
  | "spacing"
  | "componentUsage"
  | "trustVisibility"
  | "conversionHierarchy"
  | "mobileLayout"
  | "desktopLayout"
  | "accessibility";

export type HomepageIssueSeverity = "P0" | "P1" | "P2" | "P3";
export type HomepageIssueCategory = "functional" | "visual" | "design-system";

export type HomepageSectionScore = {
  id: HomepageSectionId;
  label: string;
  score: number;
  notes: string[];
};

export type HomepageIssue = {
  id: string;
  category: HomepageIssueCategory;
  severity: HomepageIssueSeverity;
  section: HomepageSectionId | "cross-cutting";
  title: string;
  detail: string;
  evidence: string;
};

export type HomepageQaAudit = {
  promptId: "QA1";
  assessedOn: string;
  environment: string;
  scope: string[];
  /** Weighted homepage score 0–100. */
  homepageScore: number;
  sectionScores: HomepageSectionScore[];
  checkScores: Record<HomepageCheckId, number>;
  functionalIssues: HomepageIssue[];
  visualIssues: HomepageIssue[];
  designSystemDeviations: HomepageIssue[];
  priorityFixes: HomepageIssue[];
  recommendation: "MATCHES_ARCHITECTURE" | "MATCHES_WITH_POLISH" | "NEEDS_HOMEPAGE_PASS";
  reportPath: string;
};

function mean(values: number[]): number {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, n) => sum + n, 0) / values.length);
}

const SECTION_SCORES: HomepageSectionScore[] = [
  {
    id: "hero",
    label: "Hero",
    score: 90,
    notes: [
      "Brand-led H1 slogan + supporting sentence + dual CTAs + clinic photo",
      "Hours + AGPAL / bulk billing / Open 7 days trust ladder in-hero",
      "Mobile stacks photo then copy; Call becomes quieter text vs desktop outline button",
    ],
  },
  {
    id: "navigation",
    label: "Navigation",
    score: 88,
    notes: [
      "Primary nav covers Services · Team · About · Patient Information · Health Advice · Updates · Contact",
      "Desktop header Book + phone; ≤1024 dock owns Book/Call/Ask (L5)",
      "Skip link + menu toggle present",
    ],
  },
  {
    id: "trust-row",
    label: "Trust row",
    score: 91,
    notes: [
      "Hero trust chips + story AGPAL line + patient-info logos + footer trust marks",
      "Accreditation copy cites ACSQHC register through 22 March 2029",
    ],
  },
  {
    id: "booking-cta",
    label: "Booking CTA",
    score: 93,
    notes: [
      "HotDoc lightbox on header, hero, new-patient, HotDoc, mid-page book band, and persistent dock",
      "booking-resilience.js fallback dialog present",
      "Book remains the primary labelled action across breakpoints",
    ],
  },
  {
    id: "digital-reception-cta",
    label: "Digital Reception CTA",
    score: 89,
    notes: [
      "Dock-integrated Ask / Digital Reception (teal assist) — matches platform architecture",
      "Not in primary nav (intentional); disclosure + search dialog via digital-reception.js",
      "Mobile uses compact “Ask us” label beside Book/Call",
    ],
  },
  {
    id: "service-pathways",
    label: "Service pathways",
    score: 86,
    notes: [
      "Six hub rows (Family · Women’s · Men’s · Children’s · Mental · Chronic) + View All Services",
      "Title links only — row body not fully clickable",
    ],
  },
  {
    id: "practitioner-pathways",
    label: "Practitioner pathways",
    score: 84,
    notes: [
      "Carousel with portraits, credentials, focus areas, View profile, Meet Our Team",
      "Duplicate accessible names (portrait + profile link) add SR noise",
      "Early placement after hero can feel directory-like before narrative",
    ],
  },
  {
    id: "footer",
    label: "Footer",
    score: 85,
    notes: [
      "Identity, trust marks, hours, contact, three accordion nav groups, policy links",
      "details open by default duplicates visible h3 + summary labels",
      "Accessible name “Call Call …” on phone link",
    ],
  },
];

const CHECK_SCORES: Record<HomepageCheckId, number> = {
  visualConsistency: 87,
  typography: 86,
  spacing: 88,
  componentUsage: 85,
  trustVisibility: 92,
  conversionHierarchy: 90,
  mobileLayout: 84,
  desktopLayout: 91,
  accessibility: 82,
};

const FUNCTIONAL: HomepageIssue[] = [
  {
    id: "F1",
    category: "functional",
    severity: "P1",
    section: "footer",
    title: "Footer phone announces “Call Call …”",
    detail: "Accessible name duplicates “Call” (likely icon text + link text), confusing for screen readers.",
    evidence: "a11y tree name on footer tel link; index.html footer-contact",
  },
  {
    id: "F2",
    category: "functional",
    severity: "P1",
    section: "practitioner-pathways",
    title: "Duplicate practitioner profile controls",
    detail: "Portrait and “View profile” share the same accessible name for each doctor, doubling tab stops.",
    evidence: "index.html .portrait + .team-practitioner-profile-link",
  },
  {
    id: "F3",
    category: "functional",
    severity: "P2",
    section: "booking-cta",
    title: "Empty-named HotDoc store hotspot links",
    detail: "Poster hotspot anchors expose nameless links alongside labelled App Store / Google Play controls.",
    evidence: "index.html .hotdoc-poster-hotspot (a11y tree refs without name)",
  },
  {
    id: "F4",
    category: "functional",
    severity: "P2",
    section: "service-pathways",
    title: "Service pathway hit area is title-only",
    detail: "Supporting copy is not part of the link; mobile tap targets are smaller than the visual row.",
    evidence: "index.html .healthcare-service-row / .service-title-link",
  },
  {
    id: "F5",
    category: "functional",
    severity: "P3",
    section: "hero",
    title: "Mobile hero preload uses desktop asset",
    detail: "max-width 700px preload points at hero-final-desktop.webp instead of a mobile crop.",
    evidence: "index.html <link rel=preload media=(max-width: 700px)>",
  },
];

const VISUAL: HomepageIssue[] = [
  {
    id: "V1",
    category: "visual",
    severity: "P1",
    section: "hero",
    title: "Mobile hero headline can clip at scroll edge",
    detail: "On ~390px width, H1 can sit under sticky header chrome when scrolling the stacked hero copy.",
    evidence: "UAT mobile screenshot qa1-homepage-mobile.png",
  },
  {
    id: "V2",
    category: "visual",
    severity: "P2",
    section: "booking-cta",
    title: "CTA density remains high",
    detail: "Book appears in header/dock, hero, new-patient, HotDoc, and book band — strong conversion but visually busy mid-page.",
    evidence: "Live homepage + 4H residual notes",
  },
  {
    id: "V3",
    category: "visual",
    severity: "P2",
    section: "practitioner-pathways",
    title: "Team carousel feels directory-like early",
    detail: "Practitioners appear immediately after hero before philosophy/story, competing with brand narrative.",
    evidence: "index.html section order #home → #team",
  },
  {
    id: "V4",
    category: "visual",
    severity: "P3",
    section: "hero",
    title: "Mobile Call Clinic quieter than desktop pair",
    detail: "Desktop uses matched Book/Call pills; mobile Call is underlined text — hierarchy intentional but visually uneven.",
    evidence: "UAT mobile hero CTAs",
  },
];

const DESIGN_SYSTEM: HomepageIssue[] = [
  {
    id: "D1",
    category: "design-system",
    severity: "P1",
    section: "cross-cutting",
    title: "styles.css patch layering with !important",
    detail: "Hero, dock, and trust rules accumulate repeated overrides — hard to reason about component tokens.",
    evidence: "apps/web/public/styles.css (hero/dock/trust blocks)",
  },
  {
    id: "D2",
    category: "design-system",
    severity: "P2",
    section: "footer",
    title: "Footer accordion duplicates headings",
    detail: "Visible h3 plus always-open <details><summary> repeats the same section title.",
    evidence: "index.html .footer-accordion-native[open]",
  },
  {
    id: "D3",
    category: "design-system",
    severity: "P2",
    section: "cross-cutting",
    title: "Typography tokens only partially migrated",
    detail: "Libre Baskerville + Inter in use; 4G token scaffold not fully applied sitewide.",
    evidence: "4H audit · index.html font links",
  },
  {
    id: "D4",
    category: "design-system",
    severity: "P3",
    section: "trust-row",
    title: "Trust marks reuse inconsistent containers",
    detail: "Hero chips, story trust-line, info logos, and footer marks share assets but not one component pattern.",
    evidence: ".hero-trust-refined · .trust-line · .info-trust-logos · .footer-trust",
  },
];

const ALL_ISSUES = [...FUNCTIONAL, ...VISUAL, ...DESIGN_SYSTEM];

function priorityRank(severity: HomepageIssueSeverity): number {
  if (severity === "P0") return 0;
  if (severity === "P1") return 1;
  if (severity === "P2") return 2;
  return 3;
}

/**
 * QA1 homepage audit.
 * Homepage Score = mean(section scores) blended with mean(check scores) at 60/40.
 */
export const HOMEPAGE_QA_AUDIT_QA1: HomepageQaAudit = (() => {
  const sectionMean = mean(SECTION_SCORES.map((row) => row.score));
  const checkMean = mean(Object.values(CHECK_SCORES));
  const homepageScore = Math.round(sectionMean * 0.6 + checkMean * 0.4);
  const priorityFixes = [...ALL_ISSUES]
    .sort((a, b) => priorityRank(a.severity) - priorityRank(b.severity) || a.id.localeCompare(b.id))
    .filter((issue) => issue.severity === "P0" || issue.severity === "P1")
    .slice(0, 8);

  const p0 = ALL_ISSUES.filter((issue) => issue.severity === "P0").length;

  return {
    promptId: "QA1",
    assessedOn: "2026-10-26",
    environment: "http://127.0.0.1:3100/",
    scope: [
      "public/index.html",
      "public/styles.css",
      "public/digital-reception.js",
      "public/booking-resilience.js",
      "hero",
      "navigation",
      "trust-row",
      "booking-cta",
      "digital-reception-cta",
      "service-pathways",
      "practitioner-pathways",
      "footer",
    ],
    homepageScore,
    sectionScores: SECTION_SCORES,
    checkScores: CHECK_SCORES,
    functionalIssues: FUNCTIONAL,
    visualIssues: VISUAL,
    designSystemDeviations: DESIGN_SYSTEM,
    priorityFixes,
    recommendation:
      p0 > 0 || homepageScore < 80
        ? "NEEDS_HOMEPAGE_PASS"
        : homepageScore >= 90
          ? "MATCHES_ARCHITECTURE"
          : "MATCHES_WITH_POLISH",
    reportPath: "apps/web/reports/HOMEPAGE_QA_AUDIT_QA1.md",
  };
})();

export function getHomepageQaAudit(): HomepageQaAudit {
  return HOMEPAGE_QA_AUDIT_QA1;
}

export function getHomepageScore(): number {
  return HOMEPAGE_QA_AUDIT_QA1.homepageScore;
}

export function listHomepagePriorityFixes(): HomepageIssue[] {
  return HOMEPAGE_QA_AUDIT_QA1.priorityFixes;
}
