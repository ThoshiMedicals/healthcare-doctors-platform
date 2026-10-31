import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { applyPublicUxRefinements } from "./public-ux";

const nav = (prefix = "") =>
  '<nav aria-label="Primary navigation" id="primary-nav" class="shell" data-nav-owner="about" data-nav-is-hub="false">' +
  `<a href="${prefix}about-us.html" data-nav-key="about" aria-current="location">About Us</a>` +
  `<a href="${prefix}updates/index.html" data-nav-key="updates">Updates</a>` +
  `<a href="${prefix}contact.html" data-nav-key="contact">Contact</a>` +
  "</nav>";

test("inserts Join Our Team between Updates and Contact with relative nested URL", () => {
  const html = `<html><head><title>Services</title></head><body>${nav("../")}<main>Services</main></body></html>`;
  const actual = applyPublicUxRefinements(html, "services/family-health.html");
  assert.match(actual, /data-nav-key="updates">Updates<\/a><a href="\.\.\/join-our-team\.html" data-nav-key="join-team">Join Our Team<\/a><a href="\.\.\/contact\.html"/);
  assert.ok(actual.includes('data-nav-owner="about"'));
  assert.ok(actual.includes('data-nav-key="about" aria-current="location"'));
  assert.equal(applyPublicUxRefinements(actual, "services/family-health.html"), actual);
});

test("Join Our Team owns only its own nav active state", () => {
  const html = `<html><head></head><body>${nav()}</body></html>`;
  const actual = applyPublicUxRefinements(html, "join-our-team.html");
  assert.match(actual, /data-nav-owner="join-team"/);
  assert.match(actual, /data-nav-key="join-team" aria-current="page"/);
  assert.ok(!actual.includes('data-nav-key="about" aria-current="location"'));
  assert.equal(applyPublicUxRefinements(actual, "join-our-team.html"), actual);
});

test("adds After Hours Care beside existing hours link without removing existing content", () => {
  const html = '<html><head></head><body>' + nav() +
    '<div role="group" aria-label="Opening hours" class="hero-hours-refined">' +
    '<span>Mon–Thu 7am–7pm</span>' +
    '<a class="hero-hours-link" href="contact.html">View all hours <span aria-hidden="true">→</span></a>' +
    '</div></body></html>';
  const actual = applyPublicUxRefinements(html, "index.html");
  assert.match(actual, /class="hero-hours-actions"/);
  assert.match(actual, /href="after-hours-care\.html">After Hours Care/);
  assert.match(actual, /href="contact\.html">View all hours/);
  assert.match(actual, /<span>Mon–Thu 7am–7pm<\/span>/);
  assert.equal(applyPublicUxRefinements(actual, "index.html"), actual);
});

test("removes the topic wayfinding bar and keeps the breadcrumb", () => {
  const html =
    '<main><nav class="topic-wayfinding" aria-label="Related topic"><div class="shell"><a href="../services/chronic-disease-care.html">Need ongoing diabetes care?</a></div></nav><div class="breadcrumb-bar">Home</div></main>';
  const actual = applyPublicUxRefinements(html, "knowledge/diabetes.html");
  assert.equal(actual.includes("topic-wayfinding"), false);
  assert.equal(actual.includes("Need ongoing diabetes care?"), false);
  assert.match(actual, /class="breadcrumb-bar"/);
  assert.equal(applyPublicUxRefinements(actual, "knowledge/diabetes.html"), actual);
});

test("leaves SEO head, internal classifications and unmodified pages untouched", () => {
  const html = '<html><head><link rel="canonical" href="/services.html"></head><body class="service-tier-hub"><span class="service-tier-chip">Service hub</span></body></html>';
  assert.equal(applyPublicUxRefinements(html, "services.html"), html);
});


test("actual published golden pages receive Join Our Team in the right position", () => {
  for (const page of [
    "index.html",
    "services.html",
    "services/family-health.html",
    "join-our-team.html",
    "team.html",
    "knowledge/index.html",
    "knowledge/articles/when-should-i-be-concerned-about-a-fever.html",
  ]) {
    const content = readFileSync(path.resolve(process.cwd(), "../../old-html", page), "utf8");
    const result = applyPublicUxRefinements(content, page);
    const nav = result.match(/<nav\b[^>]*\bid="primary-nav"[^>]*>[\s\S]*?<\/nav>/i)?.[0] ?? "";
    assert.match(nav, /data-nav-key="updates"[\s\S]*?data-nav-key="join-team"[\s\S]*?data-nav-key="contact"/, page);
    assert.match(nav, /Join Our Team<\/a>/, page);
    assert.equal(applyPublicUxRefinements(result, page), result, page);
  }
});

test("the real homepage opening-hours block includes both links", () => {
  const content = readFileSync(path.resolve(process.cwd(), "../../old-html/index.html"), "utf8");
  const result = applyPublicUxRefinements(content, "index.html");
  assert.match(result, /class="hero-hours-actions"/);
  assert.match(result, /href="contact\.html">View all hours/);
  assert.match(result, /href="after-hours-care\.html">After Hours Care/);
  assert.match(result, /styles\.css\?v=wmc-hero-group-20261030/);
});

test("the direct static index also contains all release-critical links", () => {
  const content = readFileSync(path.resolve(process.cwd(), "public/index.html"), "utf8");
  assert.match(content, /data-nav-key="updates"[\s\S]*?data-nav-key="join-team"[\s\S]*?data-nav-key="contact"/);
  assert.match(content, /href="after-hours-care\.html">After Hours Care/);
  assert.match(content, /href="\/favicon\.ico\?v=hd-symbol-20261029b"/);
  assert.doesNotMatch(content, /<link\b[^>]*href="assets\/brand\/wmc-brand-mark\.webp"/);
});
