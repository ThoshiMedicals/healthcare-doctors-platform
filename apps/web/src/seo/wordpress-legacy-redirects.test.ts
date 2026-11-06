import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveWordpressLegacyRedirect,
  SITEMAP_CMS_PRACTITIONER_PATHS,
} from "./wordpress-legacy-redirects";

test("P0 practitioner WordPress slugs map in one hop", () => {
  assert.equal(
    resolveWordpressLegacyRedirect("/doctor/dr-golnar-mortezaei-gp-fracgp/"),
    "/doctors/dr-golnar-mortezaei.html",
  );
  assert.equal(
    resolveWordpressLegacyRedirect("/doctor/dr-james-general-practitioner"),
    "/doctors/dr-james.html",
  );
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

test("sitemap CMS practitioner list covers Golnar, James, Yamesha", () => {
  assert.deepEqual([...SITEMAP_CMS_PRACTITIONER_PATHS].sort(), [
    "doctors/dr-golnar-mortezaei.html",
    "doctors/dr-james.html",
    "doctors/dr-yamesha-ranatunga.html",
  ]);
});
