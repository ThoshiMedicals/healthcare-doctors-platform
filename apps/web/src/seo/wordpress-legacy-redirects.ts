/**
 * WordPress → approved HTML 301 map for SEO equity preservation.
 * Paths are pathname-only (leading slash, no trailing slash).
 * Middleware and cutover configs (nginx / Cloudflare) must stay aligned.
 */
export const WORDPRESS_LEGACY_REDIRECTS: Readonly<Record<string, string>> = {
  // P0 — new practitioner WordPress profiles
  "/doctor/dr-golnar-mortezaei-gp-fracgp": "/doctors/dr-golnar-mortezaei.html",
  "/doctor/dr-james-general-practitioner": "/doctors/dr-james.html",

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

/** CMS practitioners that must appear in the public sitemap (may not exist in old-html/). */
export const SITEMAP_CMS_PRACTITIONER_PATHS = [
  "doctors/dr-golnar-mortezaei.html",
  "doctors/dr-james.html",
  "doctors/dr-yamesha-ranatunga.html",
] as const;

export function normalizeLegacyPathname(pathname: string): string {
  if (!pathname) return "/";
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

export function resolveWordpressLegacyRedirect(pathname: string): string | null {
  const key = normalizeLegacyPathname(pathname);
  return WORDPRESS_LEGACY_REDIRECTS[key] ?? null;
}
