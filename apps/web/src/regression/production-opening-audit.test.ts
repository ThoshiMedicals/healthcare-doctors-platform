import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { goldenHtmlRoot, listHtmlFiles } from "@/importer/golden-root";
import { auditPublishedOpening, openingFeatures, stageMissing, type RecoveryKind } from "@/regression/production-opening-audit";

const root = goldenHtmlRoot();
const priority = [
  "team.html",
  "services/family-health.html",
  "services/mens-health.html",
  "services/childrens-health.html",
  "services/mental-health.html",
  "services/chronic-disease-care.html",
  "services/skin-checks.html",
  "doctors/dr-tanya-goodwill.html",
  "doctors/dr-wasantha-hettiarchchi.html",
  "doctors/dr-kooshyar-karimi.html",
];
const all = [...priority, ...listHtmlFiles(root).filter(p => p.startsWith("knowledge/") && p.endsWith(".html"))];

function kind(p: string): RecoveryKind {
  return p === "team.html" ? "team" :
    p.startsWith("services/") ? "service" :
    p.startsWith("doctors/") ? "practitioner" :
    p.startsWith("knowledge/articles/") ? "knowledge-article" : "knowledge-hub";
}
function read(p: string): string {
  return fs.readFileSync(path.join(root, p), "utf8");
}
function removeHero(html: string): string {
  return html.replace(/<section\b[^>]*class="[^"]*\bpage-hero\b[^"]*"[^>]*>[\s\S]*?<\/section>/i, "");
}

test("all 119 targeted pages have their expected opening in the approved source", () => {
  assert.equal(new Set(all).size, 119);
  for (const p of all) {
    const html = read(p);
    const missing = openingFeatures(kind(p)).filter(f => !f.present(html)).map(f => f.name);
    assert.deepEqual(missing, [], p + ": missing golden markers");
    assert.equal(auditPublishedOpening(kind(p), html, html, html).status, "healthy", p);
  }
});

test("service page with removed hero qualifies only when protected content stays exactly approved", () => {
  const page = read("services/family-health.html");
  const broken = removeHero(page);
  const result = auditPublishedOpening("service", page, page, broken);
  assert.equal(result.status, "opening-damaged");
  assert.deepEqual(result.missing.sort(), ["H1", "introductory content", "page hero"].sort());
  assert.equal(result.headPreserved, true);
  assert.equal(result.downstreamPreserved, true);
});

test("service introduction is independently checked, even when the hero remains", () => {
  const page = read("services/skin-checks.html");
  const broken = page.replace(/<section\b[^>]*id="introduction"[^>]*>[\s\S]*?<\/section>/i, "");
  const result = auditPublishedOpening("service", page, page, broken);
  assert.equal(result.status, "opening-damaged");
  assert.ok(result.missing.includes("service introduction"));
});

test("practitioner header damage is detected without expecting a generic lede", () => {
  const page = read("doctors/dr-tanya-goodwill.html");
  const broken = removeHero(page);
  const result = auditPublishedOpening("practitioner", page, page, broken);
  assert.equal(result.status, "opening-damaged");
  assert.ok(result.missing.includes("practitioner profile header"));
  assert.ok(result.missing.includes("practitioner care introduction"));
});

test("Knowledge article damaged opening and introduction are detected", () => {
  const page = read("knowledge/articles/understanding-type-2-diabetes.html");
  const broken = removeHero(page).replace(/<section\b[^>]*id="introduction"[^>]*>[\s\S]*?<\/section>/i, "");
  const result = auditPublishedOpening("knowledge-article", page, page, broken);
  assert.equal(result.status, "opening-damaged");
  assert.ok(result.missing.includes("knowledge introduction"));
});

test("surgical recovery is refused if cards, downstream content, schema, or canonical changed", () => {
  const page = read("doctors/dr-kooshyar-karimi.html");
  const broken = removeHero(page);
  const changedBooking = broken.replace(/href="https:\/\/www\.hotdoc\.com\.au\//, 'href="https://example.org/');
  assert.equal(auditPublishedOpening("practitioner", page, page, changedBooking).status, "unsafe");
  const changedMeta = broken.replace(/rel="canonical"/, 'rel="alternate"');
  assert.equal(auditPublishedOpening("practitioner", page, page, changedMeta).status, "unsafe");
});

test("edited copy is other-drift and absent database revision is unsafe", () => {
  const page = read("knowledge/heart.html");
  const edited = page.replace("Understand blood pressure readings, cardiovascular risk, cholesterol and preventive checks.", "An introductory guide to cardiovascular health.");
  assert.equal(auditPublishedOpening("knowledge-hub", page, page, edited).status, "other-drift");
  assert.equal(auditPublishedOpening("knowledge-hub", page, page, null).status, "unsafe");
  assert.equal(stageMissing("knowledge-hub", page, null).length > 0, true);
});

test("repository source mismatch is never considered healthy", () => {
  const page = read("team.html");
  const changedRepo = page.replace("Healthcare is strongest", "Healthcare can be strongest");
  assert.equal(auditPublishedOpening("team", changedRepo, page, page).status, "unsafe");
});
