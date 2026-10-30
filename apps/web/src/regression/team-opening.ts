/**
 * Targeted Team-page recovery assessment.
 * Never edits the approved golden HTML. A repair is permitted only if the
 * published opening is damaged and every byte from the first practitioner
 * section through the footer remains identical to the approved source.
 */
export type TeamOpeningAssessment = {
  status: "healthy" | "opening-damaged" | "other-drift" | "unsafe";
  missing: string[];
  reason: string;
};

const FIRST_PRACTITIONER_SECTION =
  '<section class="team-role-section" id="general-practitioners">';

const REQUIRED_OPENING = [
  ["page hero", '<section class="page-hero">'],
  ["page H1", '<h1>'],
  ["introductory content", '<p class="lede">'],
  ["breadcrumb", '<div class="breadcrumb-bar">'],
  ["on-this-page navigation", 'class="on-this-page"'],
  ["healthcare team introduction", '<div class="team-directory-intro">'],
  ["team department navigation", 'class="team-ecosystem-nav"'],
] as const;

function head(html: string): string | null {
  const end = html.indexOf("</head>");
  return end >= 0 ? html.slice(0, end + "</head>".length) : null;
}

export function assessTeamOpening(
  publishedHtml: string,
  goldenHtml: string,
): TeamOpeningAssessment {
  const missingInGolden = REQUIRED_OPENING.filter(([, token]) => !goldenHtml.includes(token));
  if (missingInGolden.length > 0 || !goldenHtml.includes(FIRST_PRACTITIONER_SECTION)) {
    return { status: "unsafe", missing: [], reason: "Approved source is missing expected Team-page markers." };
  }

  const missing = REQUIRED_OPENING.filter(([, token]) => !publishedHtml.includes(token)).map(([name]) => name);
  if (publishedHtml === goldenHtml) {
    return { status: "healthy", missing, reason: "Published immutable HTML exactly matches the approved golden master." };
  }
  if (missing.length === 0) {
    return {
      status: "other-drift", missing,
      reason: "Opening markers remain present. Diagnose the actual response and computed CSS before changing the database.",
    };
  }
  if (!head(publishedHtml) || head(publishedHtml) !== head(goldenHtml)) {
    return {
      status: "unsafe", missing,
      reason: "HTML head or SEO/schema source differs; an automatic revision switch is not safe.",
    };
  }
  const publishedSection = publishedHtml.indexOf(FIRST_PRACTITIONER_SECTION);
  const goldenSection = goldenHtml.indexOf(FIRST_PRACTITIONER_SECTION);
  if (publishedSection < 0 || publishedHtml.slice(publishedSection) !== goldenHtml.slice(goldenSection)) {
    return {
      status: "unsafe", missing,
      reason: "Practitioner sections, booking links, remaining content, or footer differ; preserve them and investigate manually.",
    };
  }
  return {
    status: "opening-damaged", missing,
    reason: "Opening is incomplete, while HTML head and all content from the first practitioner section through the footer match the golden master exactly.",
  };
}
