import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveWordpressLegacyRedirect,
  SITEMAP_CMS_PRACTITIONER_PATHS,
} from "./wordpress-legacy-redirects";

test("P0 retired practitioner WordPress slugs map to GP directory", () => {
  assert.equal(
    resolveWordpressLegacyRedirect("/doctor/dr-golnar-mortezaei-gp-fracgp/"),
    "/team-general-practitioners.html",
  );
  assert.equal(
    resolveWordpressLegacyRedirect("/doctor/dr-james-general-practitioner"),
    "/team-general-practitioners.html",
  );
});

test("active WordPress doctor slugs map to live profile HTML", () => {
  assert.equal(
    resolveWordpressLegacyRedirect("/doctor/dr-tanya-goodwill/"),
    "/doctors/dr-tanya-goodwill.html",
  );
  assert.equal(
    resolveWordpressLegacyRedirect("/doctor/dr-kooshyar-karimi"),
    "/doctors/dr-kooshyar-karimi.html",
  );
  assert.equal(
    resolveWordpressLegacyRedirect("/doctor/dr-steven-chang-chiropractor/"),
    "/doctors/dr-steven-chang.html",
  );
});

test("P0 retired Next profiles and telehealth utility consolidate without chains", () => {
  assert.equal(
    resolveWordpressLegacyRedirect("/doctors/dr-golnar-mortezaei.html"),
    "/team-general-practitioners.html",
  );
  assert.equal(
    resolveWordpressLegacyRedirect("/doctors/dr-james.html"),
    "/team-general-practitioners.html",
  );
  assert.equal(
    resolveWordpressLegacyRedirect("/doctors/dr-yamesha-ranatunga.html"),
    "/team-general-practitioners.html",
  );
  assert.equal(
    resolveWordpressLegacyRedirect("/telehealth.html"),
    "/services/telehealth.html",
  );
  // Destinations themselves must not redirect again.
  assert.equal(resolveWordpressLegacyRedirect("/team-general-practitioners.html"), null);
  assert.equal(resolveWordpressLegacyRedirect("/services/telehealth.html"), null);
});

test("P0 SEO landers never resolve to homepage", () => {
  const paths = [
    "/bulk-billing-doctors-woolloongabba/",
    "/family-doctors-woolloongabba/",
    "/skin-cancer-clinic-doctors-brisbane/",
    "/your-complete-guide-to-a-skin-check-at-gabba-medical-centre/",
    "/free-flu-vaccine-woolloongabba-2026/",
    "/diabetes-doctor-woolloongabba/",
    "/local-gp-woolloongabba/",
    "/find-the-best-doctor-near-me-in-brisbane/",
    "/services/sexual-health-doctors/",
    "/services/travel-health-doctors/",
  ];
  for (const path of paths) {
    const target = resolveWordpressLegacyRedirect(path);
    assert.ok(target, path);
    assert.notEqual(target, "/");
    assert.notEqual(target, "/index.html");
  }
});

test("sitemap CMS practitioner extras stay empty after orphan retirement", () => {
  assert.deepEqual([...SITEMAP_CMS_PRACTITIONER_PATHS], []);
});
