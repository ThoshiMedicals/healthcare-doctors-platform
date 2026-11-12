import assert from "node:assert/strict";
import test from "node:test";
import {
  HOMEPAGE_PATIENT_APP_MARKER,
  injectHomepagePatientAppDiscovery,
} from "./homepage-patient-app-discovery";

const home = `<html><head></head><body>
<section id="hotdoc-app"><h2>HotDoc</h2></section>
<section id="patient-information"><div class="information-list"><a href="services.html"><span>Our Services</span></a></div></section>
<footer><nav class="footer-nav footer-nav-patient"><a href="faqs.html">FAQs</a></nav></footer>
</body></html>`;

test("injectHomepagePatientAppDiscovery: index only, before patient-information, idempotent", () => {
  const once = injectHomepagePatientAppDiscovery(home, "index.html");
  const twice = injectHomepagePatientAppDiscovery(once, "index.html");

  assert.match(once, new RegExp(`id="patient-app"`));
  assert.match(once, /Explore the Patient App/);
  assert.match(once, /href="patient-hub\.html"/);
  assert.match(once, /href="install-wmc-app\.html"/);
  assert.match(once, /preferred-gp-panel/);
  assert.match(once, /practice-information-hub\.html/);
  assert.match(once, /Save a preferred GP/);
  assert.doesNotMatch(once, /medical records|prescriptions|pathology results/i);
  assert.doesNotMatch(once, /faster appointment/i);
  assert.equal((once.match(new RegExp(`${HOMEPAGE_PATIENT_APP_MARKER}:start`, "g")) || []).length, 1);
  assert.equal(twice, once);

  const infoIdx = once.indexOf('id="patient-information"');
  const appIdx = once.indexOf('id="patient-app"');
  assert.ok(appIdx > -1 && appIdx < infoIdx);

  assert.match(once, /information-list">[\s\S]*?href="patient-hub\.html"/);
  assert.match(once, /footer-nav-patient[\s\S]*?href="patient-hub\.html"/);
});

test("injectHomepagePatientAppDiscovery: non-home untouched", () => {
  assert.equal(injectHomepagePatientAppDiscovery(home, "about-us.html"), home);
});
