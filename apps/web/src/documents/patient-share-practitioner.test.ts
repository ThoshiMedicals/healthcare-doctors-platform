import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  injectPatientSharePractitioner,
  isDoctorProfilePagePath,
  isPatientHubPagePath,
  isTeamListingPagePath,
} from "@/documents/patient-share-practitioner";
import { PATIENT_SHARE_CANONICAL_ORIGIN } from "@/documents/patient-share-core";

const fixtureRoot = path.join(import.meta.dirname, "..", "..", "..", "..", "old-html");

function loadFixture(rel: string): string {
  return readFileSync(path.join(fixtureRoot, rel), "utf8");
}

test("path heuristics", () => {
  assert.ok(isDoctorProfilePagePath("doctors/dr-tanya-goodwill.html"));
  assert.ok(!isDoctorProfilePagePath("team.html"));
  assert.ok(isTeamListingPagePath("team.html"));
  assert.ok(isTeamListingPagePath("team-general-practitioners.html"));
  assert.ok(!isTeamListingPagePath("doctors/dr-tanya-goodwill.html"));
  assert.ok(isPatientHubPagePath("patient-hub.html"));
});

test("doctor profile: share in actions after Book/Call, preserves HotDoc", () => {
  const html = loadFixture("doctors/dr-tanya-goodwill.html");
  const once = injectPatientSharePractitioner(html, "doctors/dr-tanya-goodwill.html");
  const twice = injectPatientSharePractitioner(once, "doctors/dr-tanya-goodwill.html");

  assert.equal(once, twice);
  assert.match(once, /data-wmc-share-root="practitioner"/);
  assert.match(once, /doctor-profile-actions[\s\S]*data-wmc-share[\s\S]*Book Appointment/);
  assert.match(once, /data-hotdoc-button/);
  assert.match(once, /practitioner-booking-notice/);
  assert.match(
    once,
    new RegExp(
      `data-share-url="${PATIENT_SHARE_CANONICAL_ORIGIN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/doctors/dr-tanya-goodwill\\.html"`,
    ),
  );
  assert.match(once, /patient-share\.js/);
});

test("doctor profile without actions: toolbar after h1 in heading", () => {
  const html =
    `<html><head><link rel="canonical" href="https://gabbamedicalcentre.com.au/doctors/dr-example.html"/></head><body>` +
    `<div class="doctor-profile-heading"><h1>Dr Example</h1></div></body></html>`;
  const out = injectPatientSharePractitioner(html, "doctors/dr-example.html");
  assert.match(out, /wmc-patient-share--toolbar/);
  assert.match(out, /data-wmc-share-root="practitioner"/);
});

test("team.html: share toolbar after hero h1", () => {
  const html = loadFixture("team.html");
  const once = injectPatientSharePractitioner(html, "team.html");
  const twice = injectPatientSharePractitioner(once, "team.html");

  assert.equal(once, twice);
  assert.match(once, /data-wmc-share-root="team"/);
  assert.match(once, /page-hero[\s\S]*<h1[\s\S]*wmc-patient-share--toolbar/);
  assert.match(once, /data-share-url="https:\/\/gabbamedicalcentre\.com\.au\/team\.html"/);
});

test("patient-hub: preferred GP dormant share + sync script", () => {
  const html = readFileSync(path.join(import.meta.dirname, "..", "..", "fixtures", "patient-hub.html"), "utf8");
  const once = injectPatientSharePractitioner(html, "patient-hub.html");
  const twice = injectPatientSharePractitioner(once, "patient-hub.html");

  assert.equal(once, twice);
  assert.match(once, /data-wmc-share-root="preferred-gp"/);
  assert.match(once, /data-wmc-share-preferred-gp="1"/);
  assert.match(once, /data-share-url=""/);
  assert.match(once, /data-wmc-preferred-gp-share-mount="1"[^>]*\bhidden\b/);
  assert.match(once, /aria-hidden="true"/);
  assert.match(once, /data-wmc-share-preferred-gp="1"[^>]*\bdisabled\b/);
  assert.match(once, /id="wmc-preferred-gp-share-sync"/);
  assert.match(once, /setMountVisible/);
  assert.match(once, /wmc\.preferredGp\.v1/);
  assert.match(once, /id="preferred-gp-panel"/);
  assert.match(once, /data-preferred-gp-storage-hook/);
});

test("non-practitioner paths unchanged", () => {
  const html = "<html><body><main>contact</main></body></html>";
  assert.equal(injectPatientSharePractitioner(html, "contact.html"), html);
});
