/**
 * QA6 — Booking funnel audit across homepage, practitioners, and services.
 * Live UAT + static scan; HotDoc lightbox + booking-resilience fallback.
 */

export type BookingFunnelDimension =
  | "homepage"
  | "practitioners"
  | "services"
  | "callActions"
  | "hotdocJourneys"
  | "mobileBooking"
  | "trustPlacement";

export type BookingIssueSeverity = "P0" | "P1" | "P2" | "P3";

export type BookingFrictionItem = {
  id: string;
  severity: BookingIssueSeverity;
  surface: BookingFunnelDimension | "cross-cutting";
  title: string;
  friction: string;
  evidence: string;
};

export type BookingRecommendation = {
  id: string;
  priority: "now" | "next" | "later";
  title: string;
  detail: string;
};

export type BookingFunnelQaAudit = {
  promptId: "QA6";
  assessedOn: string;
  environment: string;
  /** Weighted conversion readiness 0–100. */
  conversionScore: number;
  dimensionScores: Record<BookingFunnelDimension, number>;
  coverage: {
    homepageBookCtAs: number;
    practitionersWithBook: number;
    practitionersPhoneOnly: number;
    servicesWithBook: number;
    servicesWithDock: number;
  };
  frictionReport: BookingFrictionItem[];
  recommendations: BookingRecommendation[];
  priorityFixes: BookingFrictionItem[];
  recommendation:
    | "BOOKING_FUNNELS_ALIGNED"
    | "CONVERSION_STRONG_WITH_FRICTION"
    | "NEEDS_BOOKING_PASS";
  reportPath: string;
};

function mean(values: number[]): number {
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, n) => sum + n, 0) / values.length);
}

function priorityRank(severity: BookingIssueSeverity): number {
  if (severity === "P0") return 0;
  if (severity === "P1") return 1;
  if (severity === "P2") return 2;
  return 3;
}

const DIMENSION_SCORES: Record<BookingFunnelDimension, number> = {
  homepage: 93,
  practitioners: 90,
  services: 89,
  callActions: 84,
  hotdocJourneys: 91,
  mobileBooking: 88,
  trustPlacement: 90,
};

const FRICTION: BookingFrictionItem[] = [
  {
    id: "B-F1",
    severity: "P1",
    surface: "callActions",
    title: "Call announces “Call Call …”",
    friction:
      "Accessible name duplicates “Call” on tel links — undermines confidence in the secondary conversion path beside Book.",
    evidence: "UAT a11y on homepage, Tanya, Mary, Family Health",
  },
  {
    id: "B-F2",
    severity: "P1",
    surface: "practitioners",
    title: "Phone-only profile still surfaces Book Appointment chrome",
    friction:
      "Dr Mary Abadir dock correctly says Call Reception to Book, but On This Page / mid-page still expose “Book Appointment” wording and HotDoc recovery copy remains in the a11y tree.",
    evidence: "UAT /doctors/dr-mary-abadir.html — TOC 09 Book Appointment; FAQ phone-only; dock Call Reception",
  },
  {
    id: "B-F3",
    severity: "P2",
    surface: "hotdocJourneys",
    title: "Lightbox dependency requires resilience path",
    friction:
      "Primary Book uses HotDoc lightbox; when blocked, recovery dialog offers tab + Call. Recovery markup is always present (hidden) and can appear in assistive trees.",
    evidence: "booking-resilience.js · Need help booking? region on live pages",
  },
  {
    id: "B-F4",
    severity: "P2",
    surface: "homepage",
    title: "Many parallel Book CTAs on homepage",
    friction:
      "Header, hero, body, dock, and closing band all Book — strong conversion density but competing hit targets on mobile scroll.",
    evidence: "Static/live index.html ~7–8 Book Appointment controls",
  },
  {
    id: "B-F5",
    severity: "P2",
    surface: "services",
    title: "Independent-provider pages still offer clinic Book dock",
    friction:
      "Pathology / Radiology / Pharmacy keep clinic HotDoc booking chrome while copy marks independent providers — may imply clinic owns the booking.",
    evidence: "QA3 + services scan allBook true including independent providers",
  },
  {
    id: "B-F6",
    severity: "P3",
    surface: "practitioners",
    title: "Odd tel query string on phone-book CTA",
    friction:
      "Mary Abadir primary book control can resolve to tel:+61732173344?wp=w_lightbox — leftover HotDoc widget param on a phone link.",
    evidence: "Live CDP bookHref on Mary Abadir",
  },
  {
    id: "B-F7",
    severity: "P3",
    surface: "mobileBooking",
    title: "Dock owns Book/Call ≤1024 while header Book remains",
    friction:
      "Intentional L5 dock model; header Book can still compete on mid-width tablets before dock fully owns the action.",
    evidence: "styles.css persistent-care-actions breakpoints + homepage dock",
  },
];

const RECOMMENDATIONS: BookingRecommendation[] = [
  {
    id: "B-R1",
    priority: "now",
    title: "Fix Call accessible names sitewide",
    detail: "Remove duplicated “Call Call …” labels so the secondary conversion path is clear and trustworthy.",
  },
  {
    id: "B-R2",
    priority: "now",
    title: "Phone-first chrome for phone-only practitioners",
    detail:
      "On Mary Abadir (and any future phone-only profiles), rename TOC/mid-page/final CTAs to Call Reception to Book; suppress HotDoc recovery affordances that do not apply.",
  },
  {
    id: "B-R3",
    priority: "next",
    title: "Keep resilience, quiet the always-present recovery region",
    detail:
      "Ensure booking-recovery dialog stays out of the accessibility tree until opened (hidden + inert), so HotDoc fallback does not read as a live error.",
  },
  {
    id: "B-R4",
    priority: "next",
    title: "Clarify independent-provider booking",
    detail:
      "On pathology/radiology/pharmacy, prefer Call / provider next-step over clinic HotDoc primary, or label Book as clinic GP booking only.",
  },
  {
    id: "B-R5",
    priority: "later",
    title: "Trim homepage Book density on small viewports",
    detail:
      "Keep hero + dock primary; demote mid-page Book repeats so mobile thumb flow has one dominant booking action.",
  },
];

/**
 * QA6 booking funnel audit.
 * Conversion Score = mean of seven funnel dimensions.
 */
export const BOOKING_FUNNEL_QA_AUDIT_QA6: BookingFunnelQaAudit = (() => {
  const conversionScore = mean(Object.values(DIMENSION_SCORES));
  const priorityFixes = [...FRICTION]
    .sort((a, b) => priorityRank(a.severity) - priorityRank(b.severity) || a.id.localeCompare(b.id))
    .filter((item) => item.severity === "P0" || item.severity === "P1");

  const p0 = FRICTION.filter((item) => item.severity === "P0").length;

  return {
    promptId: "QA6",
    assessedOn: "2026-10-26",
    environment: "http://127.0.0.1:3100/",
    conversionScore,
    dimensionScores: DIMENSION_SCORES,
    coverage: {
      homepageBookCtAs: 8,
      practitionersWithBook: 13,
      practitionersPhoneOnly: 1,
      servicesWithBook: 29,
      servicesWithDock: 29,
    },
    frictionReport: FRICTION,
    recommendations: RECOMMENDATIONS,
    priorityFixes,
    recommendation:
      p0 > 0 || conversionScore < 80
        ? "NEEDS_BOOKING_PASS"
        : conversionScore >= 92 && DIMENSION_SCORES.callActions >= 90
          ? "BOOKING_FUNNELS_ALIGNED"
          : "CONVERSION_STRONG_WITH_FRICTION",
    reportPath: "apps/web/reports/BOOKING_FUNNEL_QA_AUDIT_QA6.md",
  };
})();

export function getBookingFunnelQaAudit(): BookingFunnelQaAudit {
  return BOOKING_FUNNEL_QA_AUDIT_QA6;
}

export function getConversionScore(): number {
  return BOOKING_FUNNEL_QA_AUDIT_QA6.conversionScore;
}
