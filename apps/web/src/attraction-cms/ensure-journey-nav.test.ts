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
