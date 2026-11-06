import assert from "node:assert/strict";
import test from "node:test";
import {
  injectProfileWelcomeUpdateLink,
  injectWelcomeUpdateAuthorityLinks,
} from "./inject-cms-updates";

test("welcome Golnar article gains profile, chronic service, and phone booking links", () => {
  const html = `<main><article><h1>Welcome</h1></article></main>`;
  const next = injectWelcomeUpdateAuthorityLinks(
    "updates/welcome-dr-golnar-mortezaei.html",
    html,
    null,
  );
  assert.match(next, /doctors\/dr-golnar-mortezaei\.html/);
  assert.match(next, /services\/chronic-disease-care\.html/);
  assert.match(next, /tel:\+61732173344/);
  assert.match(next, /data-cms-welcome-links="true"/);
  assert.doesNotMatch(next, /womens-health/);
});

test("welcome James article uses HotDoc override when provided", () => {
  const html = `<main><article><h1>Welcome</h1></article></main>`;
  const next = injectWelcomeUpdateAuthorityLinks(
    "updates/welcome-dr-james-chanaka.html",
    html,
    "https://www.hotdoc.com.au/james",
  );
  assert.match(next, /doctors\/dr-james\.html/);
  assert.match(next, /services\/childrens-health\.html/);
  assert.match(next, /services\/mental-health\.html/);
  assert.match(next, /hotdoc\.com\.au\/james/);
});

test("profile gains welcome update link once", () => {
  const html = `<section id="related-services"><div class="resource-links"><a class="resource-link" href="../services/family-health.html"><span>Family</span></a></div></section>`;
  const once = injectProfileWelcomeUpdateLink(
    "doctors/dr-golnar-mortezaei.html",
    html,
    "updates/welcome-dr-golnar-mortezaei.html",
  );
  const twice = injectProfileWelcomeUpdateLink(
    "doctors/dr-golnar-mortezaei.html",
    once,
    "updates/welcome-dr-golnar-mortezaei.html",
  );
  assert.equal(
    (twice.match(/welcome-dr-golnar-mortezaei\.html/g) || []).length,
    1,
  );
});
