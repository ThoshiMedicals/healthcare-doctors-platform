import assert from "node:assert/strict";
import test from "node:test";
import { enrichRecruitmentAuthorityPages } from "./recruitment-authority-enrichment";

const thinRegistrar = `<html><head></head><body data-ev="true"><main>
<section class="article-section"><p>Registrar places depend on capacity.</p><ol><li>Learn</li></ol></section>
<section id="recommended-next" data-attraction-next="true"><p>Next</p></section>
</main></body></html>`;

test("enrichment adds authority snapshot and registrar depth", () => {
  const once = enrichRecruitmentAuthorityPages(thinRegistrar, "join-our-team/registrar-pathway.html");
  assert.match(once, /data-recruitment-authority-panel="true"/);
  assert.match(once, /data-recruitment-page-depth="registrar"/);
  assert.match(once, /70,000\+/);
  assert.match(once, /75%/);
  assert.match(once, /\$250\/hr/);
  assert.match(once, /AGPAL/);
  assert.match(once, /Practice Experience/);
  assert.equal(
    enrichRecruitmentAuthorityPages(once, "join-our-team/registrar-pathway.html"),
    once,
  );
});

test("enrichment skips join hub and patient pages", () => {
  const hub = enrichRecruitmentAuthorityPages("<main>hub</main>", "join-our-team.html");
  assert.equal(hub, "<main>hub</main>");
  const fees = enrichRecruitmentAuthorityPages("<main>fees</main>", "fees-billing.html");
  assert.equal(fees, "<main>fees</main>");
});

test("enrichment surfaces commercial clarity on opportunities", () => {
  const html = `<html><head></head><body><main>
<section class="article-section"><h2>Fit</h2><p>Explore fit.</p></section>
<section id="recommended-next" data-attraction-next="true"></section>
</main></body></html>`;
  const result = enrichRecruitmentAuthorityPages(html, "join-our-team/gp-opportunities.html");
  assert.match(result, /Opportunity clarity/);
  assert.match(result, /Clinical Interests/);
  assert.match(result, /\$250\/hr/);
});
