import assert from "node:assert/strict";
import test from "node:test";
import {
  applyLaunchSeoRefinements,
  applyRecruitmentEoiHoldHygiene,
  consolidateTelehealthInternalLinks,
  launchSeoMetaEntries,
  launchSeoTitleEntries,
} from "./launch-refinements";

test("launch meta descriptions stay inside the 140–160 CTR band", () => {
  for (const entry of launchSeoMetaEntries()) {
    assert.ok(
      entry.length >= 140 && entry.length <= 160,
      `${entry.path} meta length ${entry.length}`,
    );
  }
});

test("launch title tags stay inside the 50–60 CTR band", () => {
  for (const entry of launchSeoTitleEntries()) {
    assert.ok(
      entry.length >= 50 && entry.length <= 60,
      `${entry.path} title length ${entry.length}`,
    );
  }
});

test("differentiates Allied Health H1s and shortens long knowledge titles", () => {
  const alliedService = applyLaunchSeoRefinements(
    '<html><head><title>x</title></head><body><h1>Allied Health</h1></body></html>',
    "services/allied-health.html",
  );
  assert.match(alliedService, /<h1>Allied Health Services<\/h1>/);

  const alliedTeam = applyLaunchSeoRefinements(
    '<html><head><title>x</title></head><body><h1>Allied Health</h1></body></html>',
    "team-allied-health.html",
  );
  assert.match(alliedTeam, /<h1>Allied Health Team<\/h1>/);

  const tummy = applyLaunchSeoRefinements(
    '<html><head><title>Is A Tummy Bug The Same As Gastro? | Woolloongabba Medical Centre</title></head><body></body></html>',
    "knowledge/articles/is-a-tummy-bug-the-same-as-gastro.html",
  );
  assert.match(tummy, /<title>Tummy Bug or Gastro\? \| Woolloongabba Medical Centre<\/title>/);
});

test("consolidates telehealth utility links to the service canonical", () => {
  const root = consolidateTelehealthInternalLinks(
    '<a href="telehealth.html">Telehealth</a>',
    "patient-information.html",
  );
  assert.match(root, /href="services\/telehealth\.html"/);

  const nested = consolidateTelehealthInternalLinks(
    '<a href="../telehealth.html">Telehealth</a>',
    "services/family-health.html",
  );
  assert.match(nested, /href="\.\.\/services\/telehealth\.html"/);
});

test("HOLD EOI hygiene rewrites child route to join hub stack", () => {
  const html =
    '<a class="button" href="join-our-team/express-interest.html">Express Interest</a>';
  const held = applyRecruitmentEoiHoldHygiene(html, "join-our-team.html", true);
  assert.match(held, /href="#express-interest"/);
  assert.doesNotMatch(held, /express-interest\.html/);

  const nested = applyRecruitmentEoiHoldHygiene(
    '<a href="express-interest.html">EOI</a>',
    "join-our-team/gp-opportunities.html",
    true,
  );
  assert.match(nested, /href="\.\.\/join-our-team\.html#express-interest"/);
});

test("applyLaunchSeoRefinements is idempotent for allied H1", () => {
  const once = applyLaunchSeoRefinements(
    '<html><head></head><body><h1>Allied Health</h1></body></html>',
    "team-allied-health.html",
  );
  assert.equal(applyLaunchSeoRefinements(once, "team-allied-health.html"), once);
});
