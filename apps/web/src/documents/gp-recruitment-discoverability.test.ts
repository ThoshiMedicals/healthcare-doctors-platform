import assert from "node:assert/strict";
import test from "node:test";
import { injectGpRecruitmentDiscoverability } from "./gp-recruitment-discoverability";

test("injects GP discover band on team and doctor profiles", () => {
  const team = injectGpRecruitmentDiscoverability(
    "<html><head></head><body><main></main><footer></footer></body></html>",
    "team.html",
  );
  assert.match(team, /data-gp-recruit-discover="true"/);
  assert.match(team, /join-our-team\.html/);
  assert.match(team, /practice-experience\.html/);
  assert.match(team, /gp-opportunities\.html/);
  assert.equal(injectGpRecruitmentDiscoverability(team, "team.html"), team);

  const profile = injectGpRecruitmentDiscoverability(
    "<html><head></head><body><main></main><footer></footer></body></html>",
    "doctors/dr-tanya-goodwill.html",
  );
  assert.match(profile, /\.\.\/join-our-team\.html/);
});

test("skips non-entry pages", () => {
  const html = "<main>fees</main>";
  assert.equal(injectGpRecruitmentDiscoverability(html, "fees-billing.html"), html);
});
