import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  injectPatientShareServices,
  isKnowledgePagePath,
  isServicesPagePath,
} from "@/documents/patient-share-services";
import { PATIENT_SHARE_CANONICAL_ORIGIN } from "@/documents/patient-share-core";

const fixtureRoot = path.join(import.meta.dirname, "..", "..", "..", "..", "old-html");

function loadFixture(rel: string): string {
  return readFileSync(path.join(fixtureRoot, rel), "utf8");
}

test("path heuristics: services tree", () => {
  assert.ok(isServicesPagePath("services.html"));
  assert.ok(isServicesPagePath("services/family-health.html"));
  assert.ok(isServicesPagePath("services/medical-procedures/wound-dressings.html"));
  assert.ok(!isServicesPagePath("service.html"));
  assert.ok(!isServicesPagePath("knowledge/index.html"));
  assert.ok(!isServicesPagePath("contact.html"));
});

test("path heuristics: knowledge tree", () => {
  assert.ok(isKnowledgePagePath("knowledge/index.html"));
  assert.ok(isKnowledgePagePath("knowledge/diabetes.html"));
  assert.ok(isKnowledgePagePath("knowledge/articles/why-regular-check-ups-matter.html"));
  assert.ok(!isKnowledgePagePath("knowledge"));
  assert.ok(!isServicesPagePath("updates/index.html"));
});

test("services.html: toolbar after hero h1, canonical URL, idempotent", () => {
  const html = loadFixture("services.html");
  const once = injectPatientShareServices(html, "services.html");
  const twice = injectPatientShareServices(once, "services.html");

  assert.equal(once, twice);
  assert.match(once, /data-wmc-share-root="services"/);
  assert.match(once, /page-hero[\s\S]*<h1[\s\S]*wmc-patient-share--toolbar/);
  assert.match(once, /data-share-url="https:\/\/gabbamedicalcentre\.com\.au\/services\.html"/);
  assert.match(once, /patient-share\.js/);
  assert.match(once, /data-hotdoc-button/);
  assert.match(once, /gabbamedicalcentre\.com\.au\/services\.html" rel="canonical"/i);
});

test("service authority page: preserves related practitioners rail", () => {
  const html = loadFixture("services/family-health.html");
  const once = injectPatientShareServices(html, "services/family-health.html");
  const twice = injectPatientShareServices(once, "services/family-health.html");

  assert.equal(once, twice);
  assert.match(once, /data-wmc-share-root="services"/);
  assert.match(
    once,
    new RegExp(
      `data-share-url="${PATIENT_SHARE_CANONICAL_ORIGIN.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/services/family-health\\.html"`,
    ),
  );
  assert.match(once, /id="related-practitioners"/);
  assert.match(once, /service-authority-article/);
});

test("knowledge article: knowledge root, article prose unchanged at introduction", () => {
  const html = loadFixture("knowledge/articles/why-regular-check-ups-matter.html");
  const rel = "knowledge/articles/why-regular-check-ups-matter.html";
  const once = injectPatientShareServices(html, rel);
  const twice = injectPatientShareServices(once, rel);

  assert.equal(once, twice);
  assert.match(once, /data-wmc-share-root="knowledge"/);
  assert.match(once, /aria-label="Share article"/);
  assert.match(
    once,
    /knowledge\/articles\/why-regular-check-ups-matter\.html" rel="canonical"/,
  );
  assert.match(once, /id="introduction"><h2>Introduction<\/h2>/);
  assert.match(once, /related-practitioners/);
});

test("knowledge hub index", () => {
  const html = loadFixture("knowledge/index.html");
  const once = injectPatientShareServices(html, "knowledge/index.html");
  assert.match(once, /data-wmc-share-root="knowledge"/);
});

test("non-target paths unchanged", () => {
  const html = "<html><body><main>ok</main></body></html>";
  assert.equal(injectPatientShareServices(html, "contact.html"), html);
  assert.equal(injectPatientShareServices(html, "team.html"), html);
});
