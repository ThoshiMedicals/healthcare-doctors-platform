import assert from "node:assert/strict";
import test from "node:test";
import { applyPublicUxRefinements, wrapExcessGpDiscoveryAreas } from "./public-ux";
import { PRACTITIONER_GROWTH_STYLE } from "./inject-practitioner-growth";

test("wrapExcessGpDiscoveryAreas collapses 4th+ items into disclosure without dropping content", () => {
  const html =
    '<ul class="gp-discovery-areas"><li>One</li><li>Two</li><li>Three</li><li>Four</li><li>Five</li></ul>';
  const actual = wrapExcessGpDiscoveryAreas(html);
  assert.match(actual, /<li>One<\/li><li>Two<\/li><li>Three<\/li>/);
  assert.match(actual, /gp-discovery-areas-disclosure/);
  assert.match(actual, /2 more clinical interests/);
  assert.match(actual, /<li>Four<\/li>/);
  assert.match(actual, /<li>Five<\/li>/);
  assert.equal(wrapExcessGpDiscoveryAreas(actual), actual);
});

test("wrapExcessGpDiscoveryAreas leaves short lists unchanged", () => {
  const html = '<ul class="gp-discovery-areas"><li>One</li><li>Two</li></ul>';
  assert.equal(wrapExcessGpDiscoveryAreas(html), html);
});

test("public UX injects practitioner directory card layout stylesheet", () => {
  const html =
    '<html><head><title>Team</title></head><body class="has-persistent-care-actions"><div class="team-directory-grid"><article class="practitioner practitioner-directory-card"><a class="portrait" href="#"><img alt="" width="800" height="1000" src="x.webp"/></a><div class="practitioner-meta"><h3>Dr Example</h3><p class="credentials">FRACGP</p><p class="focus">Family health</p><a class="text-link" href="#">View profile</a></div></article></div></body></html>';
  const actual = applyPublicUxRefinements(html, "team.html");
  assert.match(actual, /id="wmc-practitioner-directory-cards"/);
  assert.match(actual, /\.team-directory-grid\{[^}]*grid-auto-rows:auto/);
  assert.match(actual, /\.team-directory-grid \.practitioner[^{]*\{[^}]*height:auto/);
  assert.match(actual, /padding-bottom:calc\(108px/);
  assert.equal(applyPublicUxRefinements(actual, "team.html"), actual);
});

test("growth badge stylesheet keeps subdued wrapping badges", () => {
  assert.match(PRACTITIONER_GROWTH_STYLE, /wmc-practitioner-badge\{[^}]*font-size:\.62rem/);
  assert.match(PRACTITIONER_GROWTH_STYLE, /white-space:normal/);
  assert.match(PRACTITIONER_GROWTH_STYLE, /overflow-wrap:anywhere/);
  assert.match(PRACTITIONER_GROWTH_STYLE, /max-width:100%/);
  assert.match(PRACTITIONER_GROWTH_STYLE, /team-authority-person \.wmc-practitioner-badges/);
  assert.match(PRACTITIONER_GROWTH_STYLE, /grid-template-columns:none!important/);
});

test("team pages receive full-width intro and hero copy rules", () => {
  const html =
    '<html><head></head><body class="wmc-long-page"><section class="page-hero"><div class="shell page-hero-inner"><h1>Team</h1><p class="lede">Lede</p></div></section><div class="shell on-this-page-shell"><nav class="on-this-page"><div class="on-this-page-links"></div></nav></div><div class="shell team-directory"><div class="team-directory-intro"><p>Intro</p></div><section class="team-role-section"><p class="team-role-copy">Copy</p></section></div></body></html>';
  const actual = applyPublicUxRefinements(html, "team.html");
  assert.match(actual, /id="wmc-team-copy-fullwidth"/);
  assert.match(actual, /\.shell\.team-directory \.team-role-section \.team-role-copy\{[^}]*max-width:none/);
  assert.match(actual, /\.page-hero-inner\{[^}]*max-width:min\(100%,var\(--max/);
  assert.match(actual, /body:has\(\.shell\.team-directory\)[\s\S]*?\.page-hero \.lede[\s\S]*?max-width:none!important/);
  assert.equal(applyPublicUxRefinements(actual, "team.html"), actual);
});

test("GP discovery pages receive content-hugging cards and sidebar spacing rules", () => {
  const html =
    '<html><head></head><body class="team-authority-subpage has-action-dock"><div class="page-layout"><aside class="page-nav"></aside><article class="article"><ul class="gp-discovery-list"><li class="gp-discovery-card"><div class="team-authority-photo"></div><div class="gp-discovery-info"><h3 class="gp-discovery-name">Dr Example</h3><ul class="gp-discovery-areas"><li>A</li><li>B</li><li>C</li><li>D</li></ul></div><div class="gp-discovery-actions"><a class="gp-discovery-profile" href="#">View Profile</a><a class="gp-discovery-book" href="#">Book</a></div></li></ul></article></div></body></html>';
  const actual = applyPublicUxRefinements(html, "team-general-practitioners.html");
  assert.match(actual, /id="wmc-practitioner-directory-cards"/);
  assert.match(actual, /gp-discovery-areas-disclosure/);
  assert.match(actual, /\.team-authority-subpage \.page-layout\{[^}]*gap:48px/);
  assert.match(actual, /1 more clinical interest/);
  assert.match(actual, /\.gp-discovery-list\{[^}]*grid-auto-rows:auto/);
  assert.match(actual, /\.gp-discovery-info\{[^}]*gap:\.35rem/);
  assert.match(actual, /grid-template-columns:none!important/);
  assert.match(actual, /grid-row:1\/span 3!important/);
  assert.match(actual, /\.gp-discovery-actions\{[^}]*grid-column:2!important/);
});
