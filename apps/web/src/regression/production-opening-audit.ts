/** Read-only structural comparison for Production Gap recovery planning. */
export type RecoveryKind = "team" | "service" | "practitioner" | "knowledge-article" | "knowledge-hub";
export type RecoveryStatus = "healthy" | "opening-damaged" | "other-drift" | "unsafe";

export type OpeningAudit = {
  status: RecoveryStatus;
  missing: string[];
  repositoryMatchesGolden: boolean;
  publishedMatchesGolden: boolean;
  headPreserved: boolean;
  chromePreserved: boolean;
  downstreamPreserved: boolean;
  reason: string;
};

type Feature = { name: string; present: (html: string) => boolean };

const main = (html: string) => html.match(/<main\b[^>]*>[\s\S]*?<\/main>/i)?.[0] ?? "";
const hasClass = (html: string, className: string) =>
  new RegExp('class="[^"]*\\b' + className + '\\b[^"]*"', "i").test(html);
const hasSection = (html: string, id: string) =>
  new RegExp('<section\\b[^>]*\\bid="' + id + '"[^>]*>', "i").test(main(html));
const hasSectionParagraph = (html: string, id: string) => {
  const match = main(html).match(new RegExp('<section\\b[^>]*\\bid="' + id + '"[^>]*>([\\s\\S]*?)<\\/section>', "i"));
  return Boolean(match && /<p\b[^>]*>[^<\s]/i.test(match[1]));
};

export function openingFeatures(kind: RecoveryKind): Feature[] {
  const base: Feature[] = [
    { name: "page hero", present: h => /<section\b[^>]*class="[^"]*\bpage-hero\b[^"]*"/i.test(main(h)) },
    { name: "H1", present: h => /<h1\b[^>]*>[\s\S]*?<\/h1>/i.test(main(h)) },
    { name: "introductory content", present: h => /<p\b[^>]*class="[^"]*\blede\b[^"]*"/i.test(main(h)) },
    { name: "breadcrumb", present: h => hasClass(main(h), "breadcrumb-bar") && /aria-label="Breadcrumb"/i.test(main(h)) },
  ];
  if (kind === "team") return base.concat([
    { name: "healthcare team introduction", present: h => hasClass(main(h), "team-directory-intro") },
    { name: "team department navigation", present: h => hasClass(main(h), "team-ecosystem-nav") },
  ]);
  if (kind === "service") return base.concat([
    { name: "service introduction", present: h => hasSectionParagraph(h, "introduction") },
  ]);
  if (kind === "practitioner") return base.filter(f => f.name !== "introductory content").concat([
    { name: "practitioner profile header", present: h => hasClass(main(h), "doctor-profile-heading") },
    { name: "practitioner role", present: h => hasClass(main(h), "doctor-role") },
    { name: "practitioner care introduction", present: h => hasClass(main(h), "practitioner-care-overview") },
  ]);
  if (kind === "knowledge-article") return base.concat([
    { name: "knowledge introduction", present: h => hasSectionParagraph(h, "introduction") },
  ]);
  return base;
}

function htmlHead(html: string): string | null {
  const end = html.indexOf("</head>");
  return end < 0 ? null : html.slice(0, end + 7);
}

function htmlChrome(html: string): string | null {
  const header = html.match(/<header\b[^>]*>[\s\S]*?<\/header>/i)?.[0];
  if (!header) return null;
  return header;
}

function bookingDestinations(html: string): string[] {
  return [...html.matchAll(/<a\b[^>]*href="([^"]+)"/gi)]
    .map(m => m[1])
    .filter(url => /^https:\/\/www\.hotdoc\.com\.au\/|^tel:/i.test(url));
}

function protectedAnchor(html: string, kind: RecoveryKind): string | null {
  const doc = main(html);
  if (!doc) return null;
  if (kind === "team") {
    return doc.match(/<section\b[^>]*class="[^"]*\bteam-role-section\b[^"]*"[^>]*id="general-practitioners"[^>]*>/i)?.[0] ?? null;
  }
  if (kind === "practitioner") {
    return doc.match(/<section\b[^>]*class="[^"]*\barticle-section\b[^"]*"[^>]*id="biography"[^>]*>/i)?.[0] ?? null;
  }
  if (kind === "service" || kind === "knowledge-article") {
    const sections = [...doc.matchAll(/<section\b[^>]*class="[^"]*\barticle-section\b[^"]*"[^>]*>/gi)];
    return sections[1]?.[0] ?? null;
  }
  return doc.match(/<section\b[^>]*class="[^"]*\bpage-main\b[^"]*"[^>]*>/i)?.[0] ?? null;
}

export function auditPublishedOpening(
  kind: RecoveryKind,
  repositoryHtml: string,
  goldenHtml: string,
  publishedHtml: string | null,
): OpeningAudit {
  const sourceOK = repositoryHtml === goldenHtml;
  const sourceFeatures = openingFeatures(kind).filter(f => !f.present(goldenHtml)).map(f => f.name);
  const missing = publishedHtml
    ? openingFeatures(kind).filter(f => f.present(goldenHtml) && !f.present(publishedHtml)).map(f => f.name)
    : openingFeatures(kind).map(f => f.name);
  const headOK = Boolean(publishedHtml && htmlHead(goldenHtml) && htmlHead(publishedHtml) === htmlHead(goldenHtml));
  const chromeOK = Boolean(publishedHtml && htmlChrome(goldenHtml) && htmlChrome(publishedHtml) === htmlChrome(goldenHtml));
  // Remaining appointment destinations must be approved ones; disappearing links
  // in a missing hero may be restored only from the frozen golden source.
  const approvedLinks = new Set(bookingDestinations(goldenHtml));
  const bookingOK = Boolean(publishedHtml && bookingDestinations(publishedHtml).every(url => approvedLinks.has(url)));
  const anchor = protectedAnchor(goldenHtml, kind);
  const goldenAt = anchor ? goldenHtml.indexOf(anchor) : -1;
  const publishedAt = anchor && publishedHtml ? publishedHtml.indexOf(anchor) : -1;
  const tailOK = Boolean(publishedHtml && goldenAt >= 0 && publishedAt >= 0 &&
    goldenHtml.slice(goldenAt) === publishedHtml!.slice(publishedAt));

  const make = (status: RecoveryStatus, reason: string): OpeningAudit => ({
    status, missing, repositoryMatchesGolden: sourceOK,
    publishedMatchesGolden: publishedHtml === goldenHtml, headPreserved: headOK,
    chromePreserved: chromeOK && bookingOK, downstreamPreserved: tailOK, reason,
  });
  if (!sourceOK || sourceFeatures.length) {
    return make("unsafe", "Repository or golden source differs, or required golden markers are absent: " + sourceFeatures.join(", "));
  }
  if (publishedHtml == null) return make("unsafe", "Published immutable HTML revision missing.");
  if (publishedHtml === goldenHtml) return make("healthy", "Published revision exactly matches repository and approved golden master.");
  if (!headOK) return make("unsafe", "Published HTML head differs; SEO, canonical, or structured-data preservation cannot be guaranteed.");
  if (!chromeOK || !bookingOK) return make("unsafe", "Header, navigation or remaining appointment destinations differ from the approved source.");
  if (missing.length === 0) return make("other-drift", "All expected opening elements exist; content differs. Do not republish automatically.");
  if (!tailOK) return make("unsafe", "Opening elements are missing AND downstream content differs. Manual review is required.");
  return make("opening-damaged", "Opening-only damage confirmed. Head and all content after the protected boundary are byte-identical.");
}

export function stageMissing(kind: RecoveryKind, goldenHtml: string, currentHtml: string | null): string[] {
  return openingFeatures(kind)
    .filter(f => f.present(goldenHtml) && (!currentHtml || !f.present(currentHtml)))
    .map(f => f.name);
}
