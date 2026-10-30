import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { goldenHtmlRoot } from "@/importer/golden-root";
import { assessTeamOpening } from "@/regression/team-opening";
import { applyOverlay } from "@/cms/overlay";
import { applyAccessibilityClosure } from "@/documents/accessibility";
import { optimiseHomepageDelivery } from "@/documents/performance";
import { applyPublicUxRefinements } from "@/documents/public-ux";
import { applyFaviconLinks } from "@/documents/favicon";

const golden = fs.readFileSync(path.join(goldenHtmlRoot(), "team.html"), "utf8");
const sectionAnchor = '<section class="team-role-section" id="general-practitioners">';

test("approved team.html contains the entire opening and all preserved sections", () => {
  const assessment = assessTeamOpening(golden, golden);
  assert.equal(assessment.status, "healthy");
  assert.match(golden, /<section class="page-hero">/);
  assert.match(golden, /<h1>Healthcare is strongest when people work together\.<\/h1>/);
  assert.match(golden, /<p class="lede">Our healthcare team works together/);
  assert.match(golden, /class="team-directory-intro"/);
  assert.match(golden, /class="team-ecosystem-nav"/);
  assert.match(golden, /id="general-practitioners"/);
  assert.match(golden, /id="specialist-care"/);
  assert.match(golden, /id="allied-health"/);
  assert.match(golden, /<footer\b/);
});

test("approved published-page transformations retain team opening and practitioner cards", () => {
  const overlaid = applyOverlay(golden, {});
  assert.equal(overlaid.html, golden);
  const rendered = applyFaviconLinks(applyPublicUxRefinements(
    optimiseHomepageDelivery(applyAccessibilityClosure(overlaid.html, "team.html"), "team.html"),
    "team.html",
  ));
  assert.match(rendered, /<section class="page-hero">/);
  assert.match(rendered, /<h1>Healthcare is strongest when people work together\.<\/h1>/);
  assert.match(rendered, /<p class="lede">Our healthcare team works together/);
  assert.match(rendered, /class="team-directory-intro"/);
  assert.match(rendered, /class="team-ecosystem-nav"/);
  assert.match(rendered, /href="doctors\/dr-tanya-goodwill\.html"/);
  assert.match(rendered, /href="doctors\/dr-mary-abadir\.html"/);
  assert.match(rendered, /href="doctors\/dr-steven-chang\.html"/);
  assert.match(rendered, /href="https:\/\/gabbamedicalcentre\.com\.au\/team\.html" rel="canonical"/);
  assert.match(rendered, /type="application\/ld\+json"/);
  assert.match(rendered, /<footer\b/);
});

test("one-page recovery recognises missing opening only when all later content is byte-for-byte identical", () => {
  const broken = golden
    .replace(/<section class="page-hero">[\s\S]*?<\/section>/, "")
    .replace(/<div class="team-directory-intro">[\s\S]*?<\/div>/, "")
    .replace(/<nav aria-label="Our Team sections"[\s\S]*?<\/nav>/, "");
  assert.equal(assessTeamOpening(broken, golden).status, "opening-damaged");
  assert.equal(broken.slice(broken.indexOf(sectionAnchor)), golden.slice(golden.indexOf(sectionAnchor)));
});

test("recovery refuses publication when practitioner cards or footer changed", () => {
  const broken = golden.replace(/<section class="page-hero">[\s\S]*?<\/section>/, "");
  const modifiedCard = broken.replace('href="doctors/dr-tanya-goodwill.html"', 'href="doctors/other.html"');
  assert.equal(assessTeamOpening(modifiedCard, golden).status, "unsafe");
  const modifiedFooter = broken.replace("©", "Copyright");
  assert.equal(assessTeamOpening(modifiedFooter, golden).status, "unsafe");
});

test("recovery refuses publication when SEO or structured data changed", () => {
  const broken = golden.replace(/<section class="page-hero">[\s\S]*?<\/section>/, "");
  const changedCanonical = broken.replace("https://gabbamedicalcentre.com.au/team.html", "https://example.org/team.html");
  assert.equal(assessTeamOpening(changedCanonical, golden).status, "unsafe");
});

test("an intact opening with unrelated edits requires investigation, not forced restoration", () => {
  const changed = golden.replace("Our GPs are usually the central clinical point for your care.", "Our GPs are the central point for patient care.");
  assert.equal(assessTeamOpening(changed, golden).status, "other-drift");
});
