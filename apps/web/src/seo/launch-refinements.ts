/**
 * Launch SEO refinements applied at public render time.
 * Preserves page body content; adjusts titles, meta descriptions, H1 differentiation,
 * telehealth internal-link consolidation, and HOLD-safe EOI href hygiene only.
 */

export const TELEHEALTH_CANONICAL_PATH = "services/telehealth.html";

/** Paths that must 301 to an approved destination and stay out of the sitemap. */
export const SEO_CONSOLIDATED_REDIRECT_SOURCES = ["telehealth.html"] as const;

const META_BY_PATH: Readonly<Record<string, string>> = {
  "join-our-team.html":
    "Explore VR GP opportunities at Woolloongabba Medical Centre. Patient-centred culture, career pathways and confidential interest for Brisbane's inner south.",
  "services/telehealth.html":
    "GP telehealth at Woolloongabba Medical Centre: when remote care suits follow-up or results, Medicare notes, and when an in-person visit is safer.",
  "knowledge/articles/back-pain-when-should-i-see-a-gp.html":
    "Most back pain settles with time, but persistent, severe or nerve-related symptoms may need a GP assessment at Woolloongabba Medical Centre.",
  "knowledge/articles/why-won-t-my-cough-go-away.html":
    "A cough can linger after infection. Learn when ongoing cough needs GP review at Woolloongabba Medical Centre for infection, asthma or other causes.",
  "updates/open-seven-days.html":
    "Woolloongabba Medical Centre is open seven days, with Saturday and Sunday appointments available. Check current opening hours before you book.",
  "knowledge/articles/sleep-problems-explained.html":
    "Sleep problems include more than trouble falling asleep. Learn common patterns and when to speak with a GP at Woolloongabba Medical Centre today.",
  "knowledge/articles/understanding-type-2-diabetes.html":
    "A type 2 diabetes diagnosis raises many questions about ongoing care. Learn how your GP can help at Woolloongabba Medical Centre, Woolloongabba.",
  "knowledge/articles/when-should-i-be-concerned-about-blood-pressure.html":
    "One unusual blood-pressure reading can be unsettling. Learn when repeat checks and a GP review can help at Woolloongabba Medical Centre today.",
  "knowledge/articles/when-should-i-seek-adhd-assessment.html":
    "Distraction or restlessness is common. Learn when an ADHD assessment with your GP may help at Woolloongabba Medical Centre in Woolloongabba.",
  "knowledge/articles/when-should-i-see-a-gp-about-headaches.html":
    "Headaches are common, but pattern, severity and new warning signs matter. Learn when GP review helps at Woolloongabba Medical Centre, Brisbane.",
  "knowledge/articles/when-should-i-speak-to-a-gp-about-sleep.html":
    "Not every restless night needs an appointment. Learn when sleep issues warrant a GP review at Woolloongabba Medical Centre in Woolloongabba today.",
};

const TITLE_BY_PATH: Readonly<Record<string, string>> = {
  "knowledge/articles/is-a-tummy-bug-the-same-as-gastro.html":
    "Tummy Bug or Gastro? | Woolloongabba Medical Centre",
  "knowledge/articles/is-a-water-infection-the-same-as-a-uti.html":
    "Water Infection or UTI? | Woolloongabba Medical Centre",
};

const H1_BY_PATH: Readonly<Record<string, string>> = {
  "services/allied-health.html": "Allied Health Services",
  "team-allied-health.html": "Allied Health Team",
};

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function replaceMetaDescription(html: string, description: string): string {
  const safe = escapeHtmlAttr(description);
  let next = html.replace(
    /(<meta\b[^>]*\bname=["']description["'][^>]*\bcontent=["'])([^"']*)(["'])/i,
    `$1${safe}$3`,
  );
  next = next.replace(
    /(<meta\b[^>]*\bcontent=["'])([^"']*)(["'][^>]*\bname=["']description["'])/i,
    `$1${safe}$3`,
  );
  // Keep og/twitter descriptions aligned when present.
  next = next.replace(
    /(<meta\b[^>]*\bproperty=["']og:description["'][^>]*\bcontent=["'])([^"']*)(["'])/i,
    `$1${safe}$3`,
  );
  next = next.replace(
    /(<meta\b[^>]*\bcontent=["'])([^"']*)(["'][^>]*\bproperty=["']og:description["'])/i,
    `$1${safe}$3`,
  );
  next = next.replace(
    /(<meta\b[^>]*\bname=["']twitter:description["'][^>]*\bcontent=["'])([^"']*)(["'])/i,
    `$1${safe}$3`,
  );
  next = next.replace(
    /(<meta\b[^>]*\bcontent=["'])([^"']*)(["'][^>]*\bname=["']twitter:description["'])/i,
    `$1${safe}$3`,
  );
  return next;
}

function replaceTitle(html: string, title: string): string {
  const safe = title.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  let next = html.replace(/<title>[^<]*<\/title>/i, `<title>${safe}</title>`);
  const ogSafe = escapeHtmlAttr(title);
  next = next.replace(
    /(<meta\b[^>]*\bproperty=["']og:title["'][^>]*\bcontent=["'])([^"']*)(["'])/i,
    `$1${ogSafe}$3`,
  );
  next = next.replace(
    /(<meta\b[^>]*\bcontent=["'])([^"']*)(["'][^>]*\bproperty=["']og:title["'])/i,
    `$1${ogSafe}$3`,
  );
  next = next.replace(
    /(<meta\b[^>]*\bname=["']twitter:title["'][^>]*\bcontent=["'])([^"']*)(["'])/i,
    `$1${ogSafe}$3`,
  );
  next = next.replace(
    /(<meta\b[^>]*\bcontent=["'])([^"']*)(["'][^>]*\bname=["']twitter:title["'])/i,
    `$1${ogSafe}$3`,
  );
  return next;
}

function replaceFirstH1(html: string, h1: string): string {
  const safe = h1.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return html.replace(/<h1(\b[^>]*)>[\s\S]*?<\/h1>/i, `<h1$1>${safe}</h1>`);
}

/** Rewrite root telehealth utility links to the canonical service path. */
export function consolidateTelehealthInternalLinks(html: string, pagePath: string): string {
  const normalized = pagePath.replace(/^\/+/, "").replace(/\\/g, "/");
  // Nested pages need ../services/telehealth.html; root pages need services/telehealth.html.
  const depth = Math.max(0, normalized.split("/").length - 1);
  const prefix = depth > 0 ? "../".repeat(depth) : "";
  const target = `${prefix}${TELEHEALTH_CANONICAL_PATH}`;

  return html
    .replace(/(href=["'])(?:\.\.\/)*telehealth\.html(["'])/gi, `$1${target}$2`)
    .replace(
      /(href=["'])https:\/\/gabbamedicalcentre\.com\.au\/telehealth\.html(["'])/gi,
      `$1https://gabbamedicalcentre.com.au/${TELEHEALTH_CANONICAL_PATH}$2`,
    );
}

/**
 * Under recruitment HOLD, rewrite unpublished form-route CTAs to join-hub anchors
 * (confidential conversation + readiness portal) so hubs never dead-end into 404s.
 */
export function applyRecruitmentEoiHoldHygiene(html: string, pagePath: string, holdActive: boolean): string {
  if (!holdActive) return html;
  const normalized = pagePath.replace(/^\/+/, "").replace(/\\/g, "/");
  const onJoinHub = normalized === "join-our-team.html";
  const depth = Math.max(0, normalized.split("/").length - 1);
  const hubPrefix = onJoinHub ? "" : `${depth > 0 ? "../".repeat(depth) : ""}join-our-team.html`;
  const eoiHref = onJoinHub ? "#confidential-conversation" : `${hubPrefix}#confidential-conversation`;
  const readinessHref = onJoinHub ? "#gp-readiness-portal" : `${hubPrefix}#gp-readiness-portal`;

  let next = html.replace(
    /(href=["'])(?:\.\.\/)*(?:join-our-team\/)?express-interest\.html(?:#[^"']*)?(["'])/gi,
    `$1${eoiHref}$2`,
  );
  next = next.replace(
    /(href=["'])(?:\.\.\/)*(?:join-our-team\/)?doctor-readiness\.html(?:#[^"']*)?(["'])/gi,
    `$1${readinessHref}$2`,
  );
  // Soften crawl signals on any remaining form-route mentions.
  next = next.replace(
    /(<a\b[^>]*href=["'][^"']*(?:express-interest|doctor-readiness)\.html[^"']*["'][^>]*)(>)/gi,
    (full, open: string, close: string) => {
      if (/\brel=/i.test(open)) return full;
      return `${open} rel="nofollow"${close}`;
    },
  );
  // Vacancy inject / DB HTML often keep "Express Interest" after href rewrite — align labels.
  next = next.replace(
    /(<a\b[^>]*href=["'][^"']*(?:#confidential-conversation|join-our-team\.html#confidential-conversation)[^"']*["'][^>]*>)\s*Express Interest\s*(<\/a>)/gi,
    "$1Confidential conversation$2",
  );
  next = next.replace(/>Pack\s*(?:&amp;|&)\s*Express Interest</gi, ">Pack &amp; next step<");
  return next;
}

export function applyLaunchSeoRefinements(
  html: string,
  pagePath: string,
  options: { recruitmentHoldActive?: boolean } = {},
): string {
  const normalized = pagePath.replace(/^\/+/, "").replace(/\\/g, "/");
  let next = html;

  const meta = META_BY_PATH[normalized];
  if (meta) next = replaceMetaDescription(next, meta);

  const title = TITLE_BY_PATH[normalized];
  if (title) next = replaceTitle(next, title);

  const h1 = H1_BY_PATH[normalized];
  if (h1) next = replaceFirstH1(next, h1);

  next = consolidateTelehealthInternalLinks(next, normalized);
  next = applyRecruitmentEoiHoldHygiene(next, normalized, options.recruitmentHoldActive === true);

  return next;
}

export function isSeoConsolidatedSourcePath(pagePath: string): boolean {
  const normalized = pagePath.replace(/^\/+/, "").replace(/\\/g, "/");
  return (SEO_CONSOLIDATED_REDIRECT_SOURCES as readonly string[]).includes(normalized);
}

/** Exported for unit tests — lengths must stay inside CTR-safe bands. */
export function launchSeoMetaEntries(): Array<{ path: string; description: string; length: number }> {
  return Object.entries(META_BY_PATH).map(([path, description]) => ({
    path,
    description,
    length: description.length,
  }));
}

export function launchSeoTitleEntries(): Array<{ path: string; title: string; length: number }> {
  return Object.entries(TITLE_BY_PATH).map(([path, title]) => ({
    path,
    title,
    length: title.length,
  }));
}
