import assert from "node:assert/strict";
import test from "node:test";
import {
  applyAuthoritySeoRefinements,
  dedupeTelehealthRelatedPractitioners,
  enrichPractitionerPersonSchema,
  ensureKnowledgeHubAuthorityRails,
  ensureServiceTrustLinks,
  ensureSupportServiceNextSteps,
} from "./authority-refinements";

test("dedupes empty telehealth related-practitioners section", () => {
  const html =
    `<section class="article-section" id="related-practitioners"><p>Empty continuity note. Individual practitioners are not listed here.</p></section>` +
    `<section class="article-section" id="related-practitioners"><div class="practitioner-knowledge-links"><a href="../doctors/dr-tanya-goodwill.html">Tanya</a></div></section>`;
  const next = dedupeTelehealthRelatedPractitioners(html, "services/telehealth.html");
  assert.equal((next.match(/id="related-practitioners"/g) || []).length, 1);
  assert.match(next, /practitioner-knowledge-links/);
  assert.doesNotMatch(next, /Individual practitioners are not listed here/);
});

test("enriches Person schema with areaServed and canonical sameAs", () => {
  const html =
    `<script type="application/ld+json">${JSON.stringify({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Person",
          name: "Dr Tanya Goodwill",
          url: "https://gabbamedicalcentre.com.au/doctors/dr-tanya-goodwill.html",
          sameAs: ["https://gabbamedicalcentre.com.au/doctor/dr-tanya-goodwill/"],
          image: "https://gabbamedicalcentre.com.au/assets/team/dr-tanya-goodwill.webp",
        },
      ],
    })}</script>`;
  const next = enrichPractitionerPersonSchema(html, "doctors/dr-tanya-goodwill.html");
  const json = JSON.parse(next.match(/<script[^>]*>([\s\S]*?)<\/script>/i)![1]);
  const person = json["@graph"][0];
  assert.deepEqual(person.areaServed[0], "Woolloongabba");
  assert.ok(person.areaServed.includes("Kangaroo Point"));
  assert.deepEqual(person.sameAs, ["https://gabbamedicalcentre.com.au/doctors/dr-tanya-goodwill.html"]);
});

test("injects knowledge hub practitioner rails once", () => {
  const html =
    '<main><section id="related-care-at-woolloongabba-medical-centre"></section><section class="knowledge-final-cta"><h2>Book</h2></section></main>';
  const once = ensureKnowledgeHubAuthorityRails(html, "knowledge/family-health.html");
  assert.match(once, /id="related-practitioners"/);
  assert.match(once, /dr-tanya-goodwill\.html/);
  assert.match(once, /dr-wasantha-hettiarchchi\.html/);
  assert.match(once, /dr-james\.html/);
  assert.equal(ensureKnowledgeHubAuthorityRails(once, "knowledge/family-health.html"), once);
});

test("adds AGPAL and continuity trust links on family health service", () => {
  const html =
    '<section id="practical-information"><div class="resource-links"><a class="resource-link" href="../faqs.html">FAQs</a></div></section>';
  const next = ensureServiceTrustLinks(html, "services/family-health.html");
  assert.match(next, /agpal-accreditation\.html/);
  assert.match(next, /philosophy-of-care\.html/);
  assert.equal(ensureServiceTrustLinks(next, "services/family-health.html"), next);
});

test("adds GP next-step links on pathology without inventing practitioners", () => {
  const html =
    '<main><section id="practical-information"><div class="resource-links"><a class="resource-link" href="../faqs.html">FAQs</a></div></section></main>';
  const next = ensureSupportServiceNextSteps(html, "services/pathology.html");
  assert.match(next, /team-general-practitioners\.html/);
  assert.match(next, /data-seo-support-next="gp-directory"/);
  assert.doesNotMatch(next, /id="related-practitioners"/);
  assert.equal(ensureSupportServiceNextSteps(next, "services/pathology.html"), next);
});

test("adds GP next-step links on allied-health when practitioner rail is empty", () => {
  const html =
    '<main><section id="related-services"><div class="resource-links"><a class="resource-link" href="../services/family-health.html">Family</a></div></section></main>';
  const next = ensureSupportServiceNextSteps(html, "services/allied-health.html");
  assert.match(next, /team-general-practitioners\.html/);
  assert.match(next, /contact\.html/);
});

test("applyAuthoritySeoRefinements is idempotent on telehealth", () => {
  const html =
    `<section id="related-practitioners"><p>Individual practitioners are not listed here.</p></section>` +
    `<section id="related-practitioners"><div class="practitioner-knowledge-links"><a href="../doctors/dr-tanya-goodwill.html">Tanya</a></div></section>`;
  const once = applyAuthoritySeoRefinements(html, "services/telehealth.html");
  assert.equal(applyAuthoritySeoRefinements(once, "services/telehealth.html"), once);
});
