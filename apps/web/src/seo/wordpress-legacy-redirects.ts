/**
 * WordPress → approved HTML 301 map for SEO equity preservation.
 * Paths are pathname-only (leading slash, no trailing slash).
 * Middleware and cutover configs (nginx / Cloudflare) must stay aligned.
 */
export const WORDPRESS_LEGACY_REDIRECTS: Readonly<Record<string, string>> = {
  // P0 — retired CMS practitioner WordPress slugs → live GP directory (not 404 profiles)
  "/doctor/dr-golnar-mortezaei-gp-fracgp": "/team-general-practitioners.html",
  "/doctor/dr-james-general-practitioner": "/team-general-practitioners.html",
  // Gemunu on_hold / intentionally unpublished — never 301 into a 404 profile
  "/doctor/dr-gemunu-suresh-ranawake": "/team-general-practitioners.html",

  // P0 — retired Next-native profile URLs (Golnar / James / Yamesha / Gemunu) → GP directory
  "/doctors/dr-golnar-mortezaei.html": "/team-general-practitioners.html",
  "/doctors/dr-james.html": "/team-general-practitioners.html",
  "/doctors/dr-yamesha-ranatunga.html": "/team-general-practitioners.html",
  "/doctors/dr-gemunu-suresh-ranawake.html": "/team-general-practitioners.html",

  // Active WordPress /doctor/* equity → live .html profiles (align middleware with nginx)
  "/doctor/dr-anand-singh": "/doctors/dr-anand-singh.html",
  "/doctor/dr-debra-larkins": "/doctors/dr-debra-larkins.html",
  "/doctor/dr-kooshyar-karimi": "/doctors/dr-kooshyar-karimi.html",
  "/doctor/dr-mary-abadir": "/doctors/dr-mary-abadir.html",
  "/doctor/dr-nirupa-sivathasan": "/doctors/dr-nirupa-sivathasan.html",
  "/doctor/dr-sambo-luon": "/doctors/dr-sambo-luon.html",
  "/doctor/dr-steven-chang-chiropractor": "/doctors/dr-steven-chang.html",
  "/doctor/dr-sumita-singh": "/doctors/dr-sumita-singh.html",
  "/doctor/dr-tanya-goodwill": "/doctors/dr-tanya-goodwill.html",
  "/doctor/dr-usman-gul": "/doctors/dr-usman-gul.html",
  "/doctor/dr-wasantha-hettiarchchi": "/doctors/dr-wasantha-hettiarchchi.html",
  "/doctor/mr-samuel-stafford": "/doctors/mr-samuel-stafford.html",

  // P0 — telehealth cannibalisation: utility → canonical service page
  "/telehealth.html": "/services/telehealth.html",

  // P0 — promote approved SEO landing reviews
  "/bulk-billing-doctors-woolloongabba": "/bulk-billing.html",
  "/family-doctors-woolloongabba": "/services/family-health.html",
  "/skin-cancer-clinic-doctors-brisbane": "/services/skin-checks.html",
  "/your-complete-guide-to-a-skin-check-at-gabba-medical-centre":
    "/knowledge/articles/when-should-i-book-a-skin-check.html",
  "/free-flu-vaccine-woolloongabba-2026": "/services/vaccinations.html",

  // P0 — resolved intent destinations (not homepage)
  // Diabetes doctor / care & GP support → chronic disease GP service
  "/diabetes-doctor-woolloongabba": "/services/chronic-disease-care.html",
  // Local GP / family healthcare guide → GP directory
  "/local-gp-woolloongabba": "/team-general-practitioners.html",
  // Best doctor near me → GP directory
  "/find-the-best-doctor-near-me-in-brisbane": "/team-general-practitioners.html",
  // Sexual health (confidential testing/support) → family GP care (no dedicated page)
  "/services/sexual-health-doctors": "/services/family-health.html",
  // Travel health / vaccines → vaccinations service
  "/services/travel-health-doctors": "/services/vaccinations.html",
};

/**
 * Extra CMS practitioner paths forced into the public sitemap beyond golden HTML.
 * Empty after retirement of Golnar / James / Yamesha (404 profiles — do not re-list).
 */
export const SITEMAP_CMS_PRACTITIONER_PATHS = [] as const;

export function normalizeLegacyPathname(pathname: string): string {
  if (!pathname) return "/";
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

export function resolveWordpressLegacyRedirect(pathname: string): string | null {
  const key = normalizeLegacyPathname(pathname);
  return WORDPRESS_LEGACY_REDIRECTS[key] ?? null;
}
