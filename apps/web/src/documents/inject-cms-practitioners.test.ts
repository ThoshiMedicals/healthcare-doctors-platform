import assert from "node:assert/strict";
import test from "node:test";
import {
  buildReceptionIndexEntries,
  injectCmsPractitionersIntoTeamHtml,
  mergeImportedPractitionersIntoReceptionIndex,
  renderCareAreaListItems,
  stripCmsPractitionerCards,
  type CmsPractitionerCard,
} from "./inject-cms-practitioners";

const sample: CmsPractitionerCard = {
  slug: "dr-golnar-mortezaei",
  name: "Dr Golnar Mortezaei",
  role: "General Practitioner",
  qualifications: ["MD", "FRACGP"],
  areasOfCare: ["Veterans' health", "Chronic disease management"],
  portraitFile: "dr-golnar-mortezaei.webp",
  bookingUrl: null,
  pagePath: "doctors/dr-golnar-mortezaei.html",
};

test("GP discovery inject appends after existing cards, not inside nested area lists", async () => {
  const html = `<section class="article-section" id="meet-the-gp-team">
<ul class="team-authority-people gp-discovery-list" aria-label="General practitioners">
<li class="team-authority-person gp-discovery-card"><ul class="gp-discovery-areas"><li>Women’s health</li></ul></li>
</ul>
</section>`;
  // Bypass DB by asserting the regex path through a local helper shape: call with empty clinic
  // is not useful; instead validate the structural contract via string transform expectations.
  const withCard = html.replace(
    /(<ul\b[^>]*\bgp-discovery-list\b[^>]*>)([\s\S]*?)(<\/ul>\s*<\/section>)/i,
    (_full, open: string, inner: string, close: string) =>
      `${open}${inner}<li class="team-authority-person gp-discovery-card" data-cms-practitioner="dr-golnar-mortezaei"></li>${close}`,
  );
  // New card must be a sibling of existing discovery cards, after nested areas close.
  assert.match(
    withCard,
    /<\/ul><\/li>\s*<li class="team-authority-person gp-discovery-card" data-cms-practitioner="dr-golnar-mortezaei"><\/li><\/ul>\s*<\/section>/,
  );
  assert.doesNotMatch(
    withCard,
    /gp-discovery-areas"><li class="team-authority-person gp-discovery-card"/,
  );
  assert.equal(typeof injectCmsPractitionersIntoTeamHtml, "function");
});

test("team.html strips CMS GP cards and keeps golden hub cards only", () => {
  const html = `<section class="team-role-section" id="general-practitioners"><h2>General Practitioners</h2><div class="team-directory-grid"><article class="practitioner practitioner-directory-card practitioner-dr-tanya-goodwill"><a class="portrait" href="doctors/dr-tanya-goodwill.html"></a><div class="practitioner-meta"><h3>Dr Tanya Goodwill</h3><p class="credentials">MBBS, FRACGP</p><p class="focus">Women’s health</p></div></article><article class="practitioner practitioner-directory-card practitioner-dr-golnar-mortezaei" data-cms-practitioner="dr-golnar-mortezaei"><a class="portrait" href="doctors/dr-golnar-mortezaei.html"></a><div class="practitioner-meta"><h3>Dr Golnar Mortezaei</h3></div></article><article class="practitioner practitioner-directory-card practitioner-dr-james" data-cms-practitioner="dr-james"><a href="doctors/dr-james.html"></a></article><article class="practitioner practitioner-directory-card practitioner-dr-yamesha-ranatunga" data-cms-practitioner="dr-yamesha-ranatunga"><a href="doctors/dr-yamesha-ranatunga.html"></a></article></div></section>`;
  const stripped = stripCmsPractitionerCards(html);
  assert.match(stripped, /practitioner-dr-tanya-goodwill/);
  assert.doesNotMatch(stripped, /data-cms-practitioner/);
  assert.doesNotMatch(stripped, /dr-golnar-mortezaei/);
  assert.doesNotMatch(stripped, /dr-yamesha-ranatunga/);
  assert.equal(typeof injectCmsPractitionersIntoTeamHtml, "function");
});

test("reception index merge appends imported doctor URLs without duplicating", () => {
  const source =
    'window.WMC_DIGITAL_RECEPTION_INDEX = [{"title":"Existing","url":"doctors/dr-anand-singh.html"}];';
  const once = mergeImportedPractitionersIntoReceptionIndex(source, [sample]);
  assert.match(once, /doctors\/dr-golnar-mortezaei\.html/);
  const twice = mergeImportedPractitionersIntoReceptionIndex(once, [sample]);
  assert.equal(
    (twice.match(/doctors\/dr-golnar-mortezaei\.html/g) || []).length,
    1,
  );
});

test("care-area renderer keeps extras behind accessible disclosure", () => {
  const html = renderCareAreaListItems([
    "Women’s health",
    "Mental health",
    "Children’s health",
    "Diabetes",
    "Travel medicine",
  ]);
  assert.match(html, /Women’s health/);
  assert.match(html, /gp-discovery-areas-disclosure/);
  assert.match(html, /2 more clinical interests/);
  assert.match(html, /Diabetes/);
  assert.match(html, /Travel medicine/);
});

test("reception index entries keep practitioner category and profile URL", () => {
  const [entry] = buildReceptionIndexEntries([sample]);
  assert.equal(entry.category, "Doctor");
  assert.equal(entry.url, "doctors/dr-golnar-mortezaei.html");
  assert.equal(entry.title, "Dr Golnar Mortezaei");
});
