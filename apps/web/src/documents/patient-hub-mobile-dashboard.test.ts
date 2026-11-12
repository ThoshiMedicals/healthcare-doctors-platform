import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { applyPatientHubDigitalReception } from "./patient-hub-digital-reception";
import { injectPatientInstallIos } from "./patient-install-ios";
import {
  PATIENT_HUB_MOBILE_DASHBOARD_MARKER,
  refinePatientHubMobileDashboard,
} from "./patient-hub-mobile-dashboard";
import { injectPatientSharePractitioner } from "./patient-share-practitioner";

const fixture = readFileSync(
  path.join(import.meta.dirname, "..", "..", "fixtures", "patient-hub.html"),
  "utf8",
);

test("refinePatientHubMobileDashboard: approved section order and copy", () => {
  const once = refinePatientHubMobileDashboard(fixture, "patient-hub.html");
  const twice = refinePatientHubMobileDashboard(once, "patient-hub.html");

  assert.match(once, /class="[^"]*patient-hub-page/);
  assert.match(once, /Your care, made easier\./);
  assert.match(once, /data-wmc-hub-dashboard="1"/);
  assert.match(once, /id="preferred-gp-panel"/);
  assert.match(once, /Book Appointment/);
  assert.match(once, /patient-hub-dr-primary/);
  assert.match(once, /Find a Doctor/);
  assert.match(once, /Health Information/);
  assert.match(once, /data-wmc-hub-install-card/);
  assert.match(once, /patient-hub-practice-details/);
  assert.match(once, /Practice information/);
  assert.doesNotMatch(once, /id="patient-dashboard-secondary"/);
  assert.doesNotMatch(once, /medical records|prescriptions|pathology/i);

  const bodyStart = once.indexOf("<body");
  const gp = once.indexOf('id="preferred-gp-panel"', bodyStart);
  const actions = once.indexOf('class="patient-hub-task-grid patient-hub-dashboard-actions"', bodyStart);
  const install = once.indexOf("data-wmc-hub-install-card", bodyStart);
  const practice = once.indexOf('<details class="patient-hub-practice-details"', bodyStart);
  assert.ok(gp > -1 && actions > gp);
  assert.ok(install > actions);
  assert.ok(practice > install);

  assert.equal(
    (once.match(new RegExp(`${PATIENT_HUB_MOBILE_DASHBOARD_MARKER}:start`, "g")) || []).length,
    1,
  );
  assert.equal(twice.includes('id="preferred-gp-panel"'), true);
  assert.equal(
    (twice.match(new RegExp(`${PATIENT_HUB_MOBILE_DASHBOARD_MARKER}:start`, "g")) || []).length,
    1,
  );
});

test("refinePatientHubMobileDashboard: composes with DR, iOS install, preferred-GP share", () => {
  let html = refinePatientHubMobileDashboard(fixture, "patient-hub.html");
  html = applyPatientHubDigitalReception(html, "patient-hub.html");
  html = injectPatientInstallIos(html, "patient-hub.html");
  html = injectPatientSharePractitioner(html, "patient-hub.html");

  assert.equal((html.match(/patient-hub-dr-primary/g) || []).length, 1);
  assert.match(html, /id="wmc-ios-install"/);
  assert.match(html, /data-wmc-ios-install-inline="1"/);
  assert.match(html, /data-wmc-share-preferred-gp="1"/);
  assert.match(html, /id="preferred-gp-panel"/);

  const installCard = html.indexOf("data-wmc-hub-install-card");
  const ios = html.indexOf('id="wmc-ios-install"');
  assert.ok(ios > installCard);
});

test("refinePatientHubMobileDashboard: non-hub untouched", () => {
  const page = "<html><body><main>ok</main></body></html>";
  assert.equal(refinePatientHubMobileDashboard(page, "about-us.html"), page);
});
