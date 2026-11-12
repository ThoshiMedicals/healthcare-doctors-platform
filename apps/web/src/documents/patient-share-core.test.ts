import assert from "node:assert/strict";
import test from "node:test";
import {
  PATIENT_SHARE_CANONICAL_ORIGIN,
  PATIENT_SHARE_SCRIPT_HREF,
  ensurePatientShareRuntime,
  normalisePagePath,
  patientShareButtonHtml,
  resolveCanonicalShareUrl,
  resolveShareTitle,
} from "@/documents/patient-share-core";
import { injectPatientShareExperience } from "@/documents/patient-share";

test("normalisePagePath strips query hash and leading slash", () => {
  assert.equal(normalisePagePath("/doctors/dr-tanya-goodwill.html?x=1#y"), "doctors/dr-tanya-goodwill.html");
});

test("resolveCanonicalShareUrl prefers production canonical link", () => {
  const html =
    `<link rel="canonical" href="https://gabbamedicalcentre.com.au/doctors/dr-tanya-goodwill.html"/>`;
  assert.equal(
    resolveCanonicalShareUrl(html, "doctors/dr-tanya-goodwill.html"),
    "https://gabbamedicalcentre.com.au/doctors/dr-tanya-goodwill.html",
  );
});

test("resolveCanonicalShareUrl builds from pagePath when canonical missing", () => {
  assert.equal(
    resolveCanonicalShareUrl("<html></html>", "knowledge/flu.html"),
    `${PATIENT_SHARE_CANONICAL_ORIGIN}/knowledge/flu.html`,
  );
  assert.equal(resolveCanonicalShareUrl("<html></html>", "index.html"), `${PATIENT_SHARE_CANONICAL_ORIGIN}/`);
});

test("resolveShareTitle prefers og:title", () => {
  const html = `<meta property="og:title" content="Flu advice | Woolloongabba Medical Centre"/><title>Other</title>`;
  assert.equal(resolveShareTitle(html, "Fallback"), "Flu advice | Woolloongabba Medical Centre");
});

test("patientShareButtonHtml emits data-wmc-share and accessible label", () => {
  const btn = patientShareButtonHtml({
    url: "https://gabbamedicalcentre.com.au/contact.html",
    title: "Contact",
    surface: "practice",
    label: "Share this page",
  });
  assert.match(btn, /data-wmc-share/);
  assert.match(btn, /data-share-url="https:\/\/gabbamedicalcentre\.com\.au\/contact\.html"/);
  assert.match(btn, /aria-label="Share this page"/);
});

test("ensurePatientShareRuntime is idempotent and injects script + live region", () => {
  const once = ensurePatientShareRuntime("<html><head></head><body></body></html>");
  const twice = ensurePatientShareRuntime(once);
  assert.equal(once, twice);
  assert.match(once, new RegExp(PATIENT_SHARE_SCRIPT_HREF.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(once, /id="wmc-patient-share-live"/);
  assert.match(once, /id="wmc-patient-share"/);
});

test("page-level share toolbar CSS hides at desktop (≥768px) without affecting preferred-GP class", () => {
  const once = ensurePatientShareRuntime("<html><head></head><body></body></html>");
  assert.match(
    once,
    /@media \(min-width:768px\)\{\s*\.wmc-patient-share--toolbar\{display:none!important\}/,
  );
  assert.match(once, /\.doctor-profile-actions \.wmc-patient-share\{margin-left:0\}/);
  assert.doesNotMatch(once, /\.wmc-preferred-gp-share\{[^}]*display:\s*none/);
  assert.doesNotMatch(
    once,
    /@media \(min-width:768px\)\{[^}]*\.doctor-profile-actions/,
  );
});

test("injectPatientShareExperience no-ops on non-target minimal HTML", () => {
  const html = "<html><body><main>ok</main></body></html>";
  assert.equal(injectPatientShareExperience(html, "patient-forms.html"), html);
});
