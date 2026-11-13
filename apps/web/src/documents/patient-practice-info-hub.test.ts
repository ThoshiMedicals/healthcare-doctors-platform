import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { DEFAULT_CLINIC_BRANDING } from "@/clinics/branding";
import {
  PATIENT_PRACTICE_INFO_HUB_PATH,
  PATIENT_PRACTICE_INFO_SECTIONS,
  injectPatientPracticeInfoHub,
} from "./patient-practice-info-hub";

const fixturePath = path.join(
  process.cwd(),
  "fixtures",
  "practice-information-hub.html",
);

test("PATIENT_PRACTICE_INFO_SECTIONS: nine Trust Facts-aligned cards, existing routes only", () => {
  assert.equal(PATIENT_PRACTICE_INFO_SECTIONS.length, 9);
  const allowed = new Set([
    "contact.html",
    "contact.html#hours",
    "access-parking.html",
    "accessibility.html",
    "fees-billing.html",
    "telehealth.html",
    "book-appointment.html",
    "after-hours-care.html",
  ]);
  for (const section of PATIENT_PRACTICE_INFO_SECTIONS) {
    assert.ok(allowed.has(section.href), section.key);
  }
  for (const section of PATIENT_PRACTICE_INFO_SECTIONS) {
    assert.match(section.href, /\.html/);
    assert.ok(section.label.length > 0);
    assert.ok(section.description.length > 0);
  }
  const billing = PATIENT_PRACTICE_INFO_SECTIONS.find((s) => s.key === "billing-fees");
  assert.equal(billing?.secondaryHref, "bulk-billing.html");
  const appt = PATIENT_PRACTICE_INFO_SECTIONS.find((s) => s.key === "appointment-information");
  assert.equal(appt?.secondaryHref, "practice-policies.html");
});

test("injectPatientPracticeInfoHub: hub path only, strip + DR delegate + idempotent", () => {
  const minimal = `<html><head></head><body>
<main><article>
<section id="practice-info-strip"><p>mount</p></section>
</article>
<div class="patient-hub-task-grid" data-wmc-practice-info-sections="grid"><a href="x">Old</a></div>
<button data-open-digital-reception="" type="button">DR</button>
</body></html>`;

  const once = injectPatientPracticeInfoHub(minimal, PATIENT_PRACTICE_INFO_HUB_PATH, DEFAULT_CLINIC_BRANDING);
  const twice = injectPatientPracticeInfoHub(once, PATIENT_PRACTICE_INFO_HUB_PATH, DEFAULT_CLINIC_BRANDING);

  assert.match(once, /id="practice-info-strip"/);
  assert.match(once, /Hello Home Doctor/);
  assert.match(once, /tel:\+61732173344/);
  assert.match(once, /mailto:reception@gabbamedicalcentre\.com\.au/);
  assert.match(once, /Woolloongabba Medical Centre/);
  assert.match(once, /wmc-digital-reception-open-delegate/);
  assert.match(once, /aria-label="Open Digital Reception — ask for the next step"/);
  assert.match(once, /href="fees-billing\.html"/);
  assert.match(once, /href="after-hours-care\.html"/);
  assert.doesNotMatch(once, /<a href="x">Old<\/a>/);

  assert.equal((twice.match(/wmc-patient-practice-info-hub/g) || []).length, 1);
  assert.equal((twice.match(/wmc-digital-reception-open-delegate/g) || []).length, 1);
});

test("injectPatientPracticeInfoHub: other paths unchanged", () => {
  const html = "<html><body><section id=\"practice-info-strip\">x</section></body></html>";
  assert.equal(injectPatientPracticeInfoHub(html, "patient-hub.html"), html);
});

test("fixture: quick actions and section grid present before SSR", () => {
  const raw = readFileSync(fixturePath, "utf8");
  assert.match(raw, /data-open-digital-reception/);
  assert.match(raw, /aria-label="Open Digital Reception — ask for the next step"/);
  assert.match(raw, /href="patient-hub\.html"/);
  assert.match(raw, /data-wmc-practice-info-sections="grid"/);
  assert.match(raw, /id="practice-info-strip"/);
});
