import assert from "node:assert/strict";
import test from "node:test";
import { repairAttractionJourneyLayout } from "./repair-attraction-journey-layout";

test("moves journey aside from breadcrumb-bar into page-layout without dropping links", () => {
  const html = `<main>
<div class="breadcrumb-bar"><div class="shell"><nav aria-label="Breadcrumb">Home</nav></div>
<aside aria-label="Pages for doctors considering joining" class="page-nav" id="related-pages" data-ev-journey-nav="true"><div class="nav-title">For doctors joining</div><a href="../join-our-team.html">Join Our Team</a><a href="practice-experience.html">Practice Experience</a></aside></div>
<section class="page-main"><div class="shell page-layout">
<article class="article pe-article"><h1>Practice Experience</h1><p>Keep all copy.</p></article>
</div></section>
</main>`;

  const next = repairAttractionJourneyLayout(html);
  assert.match(next, /page-layout">\s*<aside[^>]*id="related-pages"/);
  assert.match(next, /Practice Experience/);
  assert.match(next, /Keep all copy/);
  assert.match(next, /For doctors joining/);
  assert.doesNotMatch(next, /breadcrumb-bar"><div class="shell">[\s\S]*?<\/div>\s*<aside[^>]*id="related-pages"/);
  assert.equal(repairAttractionJourneyLayout(next), next);
});

test("leaves correct page-layout aside placement alone", () => {
  const html = `<div class="breadcrumb-bar"><div class="shell">crumbs</div></div>
<div class="shell page-layout"><aside id="related-pages" data-ev-journey-nav="true">nav</aside><article>body</article></div>`;
  assert.equal(repairAttractionJourneyLayout(html), html);
});
