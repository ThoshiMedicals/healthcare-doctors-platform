import assert from "node:assert/strict";
import test from "node:test";
import {
  ensureUnifiedRecruitmentJourneyNav,
  rewriteStaleExpressInterestLabels,
} from "./ensure-journey-nav";

test("replaces stale Express Interest CTA with Confidential conversation + Explore pack order", () => {
  const stale = `<html><body><aside id="related-pages" data-ev-journey-nav="true"><div class="nav-title">For doctors joining</div><a href="../join-our-team.html">Join Our Team</a><a href="express-interest.html" class="nav-cta-primary">Express Interest</a></aside><main></main></body></html>`;
  const next = ensureUnifiedRecruitmentJourneyNav(stale, "join-our-team/gp-opportunities.html");
  assert.match(next, /Confidential conversation/);
  assert.doesNotMatch(next, />Express Interest</);
  assert.match(next, /nav-group-title">Explore[\s\S]*opportunity-pack\.html[\s\S]*nav-group-title">Check readiness/);
  assert.match(next, /aria-current="page"[^>]*>GP Opportunities</);
  assert.equal(ensureUnifiedRecruitmentJourneyNav(next, "join-our-team/gp-opportunities.html"), next);
});

test("restores journey rail as first child of page-layout (not breadcrumb-bar)", () => {
  const html = `<main><div class="breadcrumb-bar"><nav class="breadcrumb">Home</nav></div><section class="page-main"><div class="shell page-layout"><aside class="page-nav" id="related-pages">stale</aside><article class="article pe-article"><p>Body</p></article></div></section></main>`;
  const next = ensureUnifiedRecruitmentJourneyNav(html, "about-us/practice-experience.html");
  assert.match(
    next,
    /class="[^"]*\bpage-layout\b[^"]*"[^>]*>\s*<aside[^>]*data-ev-journey-nav="true"/i,
  );
  assert.doesNotMatch(next, /breadcrumb-bar[\s\S]*data-ev-journey-nav="true"[\s\S]*page-layout/i);
  assert.match(next, /data-ev-journey-nav="true"[\s\S]*<article class="article pe-article"/i);
  assert.equal((next.match(/data-ev-journey-nav="true"/g) || []).length, 1);
});

const TWELVE_LAYOUT_PATHS = [
  "about-us/practice-experience.html",
  "about-us/community-catchment.html",
  "about-us/continuity-in-practice.html",
  "about-us/clinical-interests.html",
  "join-our-team/gp-opportunities.html",
  "join-our-team/practice-support.html",
  "join-our-team/registrar-pathway.html",
  "join-our-team/opportunity-pack.html",
  "join-our-team/gp-faq.html",
  "join-our-team/provider-number-readiness.html",
  "join-our-team/dpa-navigator.html",
  "join-our-team/session-planner.html",
] as const;

for (const path of TWELVE_LAYOUT_PATHS) {
  test(`page-layout rail contract: ${path}`, () => {
    const html = `<div class="shell page-layout"><aside class="page-nav" id="related-pages">old</aside><article class="article"><h1>x</h1></article></div>`;
    const next = ensureUnifiedRecruitmentJourneyNav(html, path);
    assert.match(next, /page-layout[^>]*>\s*<aside[^>]*data-ev-journey-nav="true"/i);
    assert.match(next, /data-ev-journey-nav="true"[\s\S]*<article class="article"/i);
  });
}

test("rewrites Express Interest labels already pointed at confidential stack", () => {
  const html =
    '<a href="../join-our-team.html#confidential-conversation">Express Interest</a>';
  assert.match(
    rewriteStaleExpressInterestLabels(html),
    />Confidential conversation</,
  );
});

test("does not inject journey rail on join hub or EOI", () => {
  const hub = ensureUnifiedRecruitmentJourneyNav("<main>hub</main>", "join-our-team.html");
  assert.equal(hub, "<main>hub</main>");
  const eoi = ensureUnifiedRecruitmentJourneyNav(
    '<aside id="related-pages">x</aside>',
    "join-our-team/express-interest.html",
  );
  assert.match(eoi, /id="related-pages"/);
});
