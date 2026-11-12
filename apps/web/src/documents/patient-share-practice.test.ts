import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_CLINIC_BRANDING } from "@/clinics/branding";
import {
  PATIENT_SHARE_CANONICAL_ORIGIN,
  ensurePatientShareRuntime,
} from "@/documents/patient-share-core";
import {
  PATIENT_PRACTICE_SHARE_PATHS,
  injectPatientSharePractice,
} from "@/documents/patient-share-practice";

const HERO_SHELL =
  `<html><head>` +
  `<link rel="canonical" href="https://gabbamedicalcentre.com.au/contact.html"/>` +
  `<meta property="og:title" content="Contact | Woolloongabba Medical Centre"/>` +
  `</head><body><main>` +
  `<section class="page-hero"><div class="shell"><h1>Contact us</h1></div></section>` +
  `<p>body</p></main></body></html>`;

test("PATIENT_PRACTICE_SHARE_PATHS lists Trust Facts practice routes", () => {
  const required = [
    "practice-information-hub.html",
    "contact.html",
    "access-parking.html",
    "accessibility.html",
    "telehealth.html",
    "after-hours-care.html",
    "fees-billing.html",
    "bulk-billing.html",
    "book-appointment.html",
  ];
  for (const p of required) {
    assert.ok(PATIENT_PRACTICE_SHARE_PATHS.has(p), p);
  }
});

test("injectPatientSharePractice: mounts toolbar after hero h1 with runtime", () => {
  const once = injectPatientSharePractice(HERO_SHELL, "contact.html");
  const twice = injectPatientSharePractice(once, "contact.html");

  assert.match(once, /class="wmc-patient-share--toolbar"/);
  assert.match(once, /<h1>Contact us<\/h1><div class="wmc-patient-share--toolbar"/);
  assert.match(once, /data-wmc-share-root="practice"/);
  assert.match(once, /data-share-url="https:\/\/gabbamedicalcentre\.com\.au\/contact\.html"/);
  assert.match(once, /aria-label="Share this page"/);
  assert.match(once, /data-wmc-patient-share-runtime="1"/);
  assert.equal((once.match(/data-wmc-share-root="practice"/g) || []).length, 1);
  assert.equal(once, twice);
});

test("injectPatientSharePractice: contact + hub include Share phone from Trust Facts", () => {
  for (const path of ["contact.html", "practice-information-hub.html"] as const) {
    const html = HERO_SHELL.replace(
      'href="https://gabbamedicalcentre.com.au/contact.html"',
      `href="https://gabbamedicalcentre.com.au/${path}"`,
    );
    const out = injectPatientSharePractice(html, path);
    assert.match(out, /aria-label="Share phone"/);
    assert.match(
      out,
      new RegExp(
        `data-share-text="${DEFAULT_CLINIC_BRANDING.phoneDisplay.replace(/[()]/g, "\\$&")}"`,
      ),
    );
    assert.match(out, /data-share-url="https:\/\/gabbamedicalcentre\.com\.au\/contact\.html"/);
  }
});

test("injectPatientSharePractice: fees-billing share has no fee amounts in text attribute", () => {
  const html =
    `<html><head>` +
    `<link rel="canonical" href="https://gabbamedicalcentre.com.au/fees-billing.html"/>` +
    `<meta property="og:title" content="Fees &amp; Billing | WMC"/>` +
    `<meta property="og:description" content="Medicare bulk billing and when fees may apply."/>` +
    `</head><body><main><section class="page-hero"><h1>Fees</h1></section></main></body></html>`;
  const out = injectPatientSharePractice(html, "fees-billing.html");
  const primaryBtn = out.match(
    /<button[^>]*aria-label="Share this page"[^>]*>/i,
  )?.[0];
  assert.ok(primaryBtn);
  assert.doesNotMatch(primaryBtn, /data-share-text=/);
  assert.doesNotMatch(primaryBtn, /\$|€|£/);
});

test("injectPatientSharePractice: non-practice paths unchanged", () => {
  const html = "<html><body><h1>x</h1></body></html>";
  assert.equal(injectPatientSharePractice(html, "services.html"), html);
  assert.equal(injectPatientSharePractice(html, "doctors/dr-tanya-goodwill.html"), html);
});

test("injectPatientSharePractice: falls back to practice-info-strip when no h1", () => {
  const html =
    `<html><body><main>` +
    `<section id="practice-info-strip" data-wmc-trust-facts-strip="mount"><p>strip</p></section>` +
    `</main></body></html>`;
  const out = injectPatientSharePractice(html, "access-parking.html");
  assert.match(
    out,
    /id="practice-info-strip"[^>]*><div class="wmc-patient-share--toolbar"/,
  );
  assert.doesNotMatch(out, /aria-label="Share phone"/);
});

test("injectPatientSharePractice: canonical built when link missing", () => {
  const html =
    `<html><head><title>Telehealth</title></head><body>` +
    `<section class="page-hero"><h1>Telehealth</h1></section></body></html>`;
  const out = injectPatientSharePractice(html, "telehealth.html");
  assert.match(
    out,
    new RegExp(
      `data-share-url="${PATIENT_SHARE_CANONICAL_ORIGIN}/telehealth\\.html"`,
    ),
  );
});

test("ensurePatientShareRuntime composes with practice inject idempotently", () => {
  const wired = injectPatientSharePractice(HERO_SHELL, "contact.html");
  const again = ensurePatientShareRuntime(wired);
  assert.equal(wired, again);
});
