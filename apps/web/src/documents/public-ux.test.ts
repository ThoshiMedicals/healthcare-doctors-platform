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

test("leaves SEO head and internal classifications intact while adding clinic slug", () => {
  const html = '<html><head><link rel="canonical" href="/services.html"></head><body class="service-tier-hub"><main>Services</main></body></html>';
  const actual = applyPublicUxRefinements(html, "services.html");
  assert.match(actual, /data-clinic-slug="woolloongabba"/);
  assert.match(actual, /data-practice-name="Woolloongabba Medical Centre"/);
  assert.match(actual, /rel="canonical" href="\/services\.html"/);
  assert.match(actual, /service-tier-hub/);
  assert.equal(applyPublicUxRefinements(actual, "services.html"), actual);
});

test("uses ClinicProfile practice name for patient form handoff copy", () => {
  const html =
    '<html><body><form data-patient-form-request method="post"><p class="form-email-handoff">old</p></form></body></html>';
  const actual = applyPublicUxRefinements(html, "patient-forms.html", {
    clinicSlug: "example",
    branding: { practiceName: "Example Medical Centre", clinicSlug: "example" },
  });
  assert.match(actual, /Example Medical Centre/);
  assert.match(actual, /data-clinic-slug="example"/);
  assert.match(actual, /action="\/api\/clinics\/example\/form-requests"/);
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

test("About Us hub receives Practice Experience card without golden-master edit", () => {
  const content = readFileSync(path.resolve(process.cwd(), "../../old-html/about-us.html"), "utf8");
  const result = applyPublicUxRefinements(content, "about-us.html");
  assert.match(result, /data-pe-hub-card="true"/);
  assert.match(result, /href="about-us\/practice-experience\.html">Practice Experience Hub/);
  assert.match(result, /id="careers"/);
  assert.equal(applyPublicUxRefinements(result, "about-us.html"), result);
});

test("Contact moves network callout after the map without golden-master edit", () => {
  const content = readFileSync(path.resolve(process.cwd(), "../../old-html/contact.html"), "utf8");
  const result = applyPublicUxRefinements(content, "contact.html");
  const article = result.match(/<article\b[^>]*\bclass="[^"]*\barticle\b[^"]*"[^>]*>[\s\S]*?<\/article>/i)?.[0] ?? "";
  assert.match(
    article,
    /Find us\.[\s\S]*network-authority-callout[\s\S]*Plan your visit and access care/i,
  );
  assert.doesNotMatch(
    article,
    /network-authority-callout[\s\S]*Find us\./i,
  );
  assert.equal(applyPublicUxRefinements(result, "contact.html"), result);
});

test("Join Our Team becomes a GP recruitment prospectus without golden-master edit", () => {
  const content = readFileSync(path.resolve(process.cwd(), "../../old-html/join-our-team.html"), "utf8");
  const result = applyPublicUxRefinements(content, "join-our-team.html");
  assert.match(result, /data-gp-recruit-layout="true"/);
  assert.match(result, /data-recruitment-evidence-panel="true"/);
  assert.match(result, /Opportunity Snapshot/);
  assert.match(result, /Current Opportunity/);
  assert.match(result, /VR General Practitioner/);
  assert.match(result, /Request Callback/);
  assert.match(result, /Current employer will not be contacted/);
  assert.match(result, /class="gp-recruit-hero"/);
  assert.match(
    result,
    /A Supported VR GP Role at an Established Inner-South Practice\./,
  );
  assert.match(result, /No CV required for an initial discussion/);
  assert.match(result, /Request a Confidential Discussion/);
  assert.match(result, /Roshan Samarawickrema/);
  assert.match(result, /Confidential Means Confidential/);
  assert.match(result, /recruitment representatives/);
  assert.match(result, /id="commercial-opportunity"/);
  assert.match(result, /gp-recruit-stat-value--xl">75%/);
  assert.match(result, /Minimum Guarantee/);
  assert.doesNotMatch(result, /id="why-demand-exists"/);
  assert.doesNotMatch(result, /Why Demand Exists/);
  assert.match(result, /Demand Is Already On The Books/);
  assert.match(result, /id="wmc-gp-recruitment"/);
  assert.match(result, /\/wmc-cache\/styles\.min\.css\?v=wmc-gp-recruit-20261110f/);
  assert.match(result, /id="gp-joining-map"/);
  assert.ok(result.indexOf('id="gp-joining-map"') < result.indexOf('id="why-gps-choose"'));
  assert.match(result, /top:calc\(10rem \+ env\(safe-area-inset-top/);
  assert.match(result, /GP Readiness &amp; Onboarding Portal/);
  assert.match(result, /data-gp-readiness-open="true"/);
  assert.match(result, /Call About Joining/);
  assert.match(result, /gp-readiness-portal\.js\?v=wmc-gp-readiness-20261110a/);
  assert.match(result, /id="gp-readiness-portal"/);
  assert.match(
    result,
    /gp-recruit-actions--inline[\s\S]*?GP Readiness &amp; Onboarding Portal[\s\S]*?Request a Confidential Discussion[\s\S]*?Call About Joining/,
  );
  assert.match(result, /persistent-care-readiness[^>]*>GP Portal</);
  assert.match(result, /persistent-care-book[^>]*>Discuss</);
  assert.match(
    result,
    /persistent-care-actions--recruitment[\s\S]*?persistent-care-readiness[\s\S]*?data-gp-readiness-open="true"[\s\S]*?persistent-care-book[\s\S]*?persistent-care-call[^>]*>Call</,
  );
  assert.match(result, /grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(result, /100% Medicare Bulk Billing/);
  assert.match(result, /tel:\+61481706474/);
  assert.match(result, /mailto:roshan@tmedicals\.com\.au\?subject=GP%20opportunity%20%E2%80%94%20Woolloongabba/);
  assert.match(result, /body=Hi%20Roshan/);
  assert.doesNotMatch(result, /mailto:reception@gabbamedicalcentre\.com\.au\?subject=Confidential%20GP%20enquiry/);
  assert.doesNotMatch(result, /subject=Confidential%20GP%20enquiry/);
  assert.match(result, /Onsite pathology/);
  assert.match(result, /gp-recruit-stat-value">10\+/);
  assert.match(result, /gp-recruit-stat-value">5\+/);
  assert.match(result, /max-height:calc\(100vh - 12rem/);
  assert.match(result, /scroll-margin-top:calc\(5\.5rem \+ env\(safe-area-inset-top/);
  assert.match(result, /position:relative;z-index:1;top:auto/);
  assert.doesNotMatch(result, /position:static!important;top:auto!important/);
  assert.match(result, /gp-recruit-opportunity-follow/);
  assert.match(result, /gp-recruit-hero-aside-card/);
  assert.match(result, /Hero opportunity summary/);
  assert.match(result, /Next to The Gabba stadium/);
  assert.match(result, /Onsite chemist &amp; radiology/);
  assert.match(result, /Dr Wasantha Hettiarchchi/);
  assert.doesNotMatch(result, /Dr Steven Chang/);
  assert.match(result, /What happens next/);
  assert.match(result, /Explore Practice Experience in detail/);
  assert.match(result, /Explore Practice Support in detail/);
  assert.match(result, /footer-trust[\s\S]*?bulk-billing-practice\.png/);
  assert.match(result, /gp-recruit-vacancy-featured-points\{[\s\S]*?grid-template-columns:1fr 1fr/);
  assert.ok(
    result.indexOf('class="gp-recruit-hero"') <
      result.indexOf('aria-label="Hero opportunity summary"') &&
      result.indexOf('aria-label="Hero opportunity summary"') <
        result.indexOf('id="commercial-opportunity"'),
  );
  assert.doesNotMatch(result, /gp-recruit-breadcrumb/);
  assert.match(result, /gp-recruit-team-trust/);
  assert.match(result, /id="current-opportunities"/);
  assert.match(result, /Current Opportunities/);
  assert.match(result, /careers-vacancies:start/);
  assert.match(result, /data-gp-recruit-vacancies/);
  assert.match(result, /id="understanding-the-opportunity"/);
  assert.match(result, /Understanding the Opportunity/);
  assert.match(result, /How does the 75% arrangement work/);
  assert.match(result, /How are patients allocated/);
  assert.match(result, /Is weekend work required/);
  assert.match(result, /Can sessions be part-time/);
  assert.match(result, /What support is available/);
  assert.match(result, /What software does the clinic use/);
  assert.match(result, /What is onboarding like/);
  assert.match(result, /Who responds to recruitment enquiries/);
  assert.match(result, /Is This Opportunity Right For You/);
  assert.match(result, /id="confidential-conversation"/);
  assert.match(result, /gp-recruit-final-actions/);
  assert.match(result, /Call Roshan Samarawickrema/);
  assert.match(result, /curious about fit/);
  assert.match(result, /current employer is never contacted/);
  assert.match(result, /id="at-a-glance"/);
  assert.match(result, /Practice scale/);
  assert.match(result, /Days Open/);
  assert.match(result, /Accredited Practice/);
  assert.match(result, /gabba-stadium-precinct-aerial\.webp/);
  assert.doesNotMatch(result, /Dr Golnar Mortezaei/);
  assert.doesNotMatch(result, /Dr James Chanaka/);
  assert.match(result, /Dr Wasantha Hettiarchchi/);
  assert.match(result, /Featured Opportunity/);
  assert.match(result, /data-offer-featured="true"/);
  assert.match(result, /Now hiring/);
  assert.doesNotMatch(result, /<p class="gp-recruit-lede"/);
  assert.doesNotMatch(result, /Supported by an established patient community/);
  assert.doesNotMatch(result, /Billing Split/);
  assert.match(result, /gp-recruit-final-copy/);
  assert.match(result, /gp-recruit-differentiator-aside/);
  assert.doesNotMatch(result, /id="visual-proof"|Verified practice photography/);
  assert.ok(
    result.indexOf('id="why-different"') < result.indexOf('id="current-opportunities"') &&
      result.indexOf('id="current-opportunities"') < result.indexOf('id="understanding-the-opportunity"') &&
      result.indexOf('id="understanding-the-opportunity"') < result.indexOf('id="why-gps-choose"'),
  );
  assert.ok(
    result.indexOf('class="gp-recruit-hero"') < result.indexOf("data-recruitment-evidence-panel") &&
      result.indexOf("data-recruitment-evidence-panel") < result.indexOf('id="at-a-glance"') &&
      result.indexOf('class="gp-recruit-hero"') < result.indexOf('id="at-a-glance"'),
  );
  assert.match(result, /\$250\/hr Minimum/);
  assert.doesNotMatch(result, /<\s*1 Month|Typical Time to Build a Busy Patient List/);
  assert.doesNotMatch(result, /clinic-reception\.png/);
  assert.doesNotMatch(result, /institutional-exterior-consistent/);
  assert.doesNotMatch(result, /figcaption>Reception</);
  assert.doesNotMatch(result, /careers-page-hero/);
  assert.doesNotMatch(result, /Designed for Long-Term GP Success/);
  assert.doesNotMatch(result, /We Are Looking For GPs Who/);
  assert.doesNotMatch(
    result,
    /class="[^"]*\bon-this-page-shell\b|data-ev-journey-nav="true"/i,
  );
  assert.match(result, /Am I ready to talk\?/);
  assert.equal(applyPublicUxRefinements(result, "join-our-team.html"), result);
});

test("recruitment mobile polish styles shared contact channels on related pages", () => {
  const html = `<html><head></head><body class="has-persistent-care-actions" data-ev="true">
<main><article><h1>GP Opportunities</h1></article></main>
<nav class="persistent-care-actions persistent-care-actions--recruitment"><a href="#">Discuss</a></nav>
</body></html>`;
  const result = applyPublicUxRefinements(html, "join-our-team/gp-opportunities.html");
  assert.match(result, /id="wmc-recruit-mobile"/);
  assert.match(result, /\.gp-recruit-contact-channels a/);
  assert.match(result, /min-height:44px/);
  assert.match(result, /\.attraction-matrix/);
  assert.match(result, /Stack support\/checklist matrices/);
  assert.match(result, /data-recruitment-contact="true"/);
  assert.match(result, /gp-recruit-shared-trust/);
  assert.equal(applyPublicUxRefinements(result, "join-our-team/gp-opportunities.html"), result);
});

test("Express Interest enquiry stage is contact, confidentiality, form, submit only", () => {
  const html = `<html><head></head><body class="has-persistent-care-actions">
<section class="page-hero"><div class="shell"><p class="eyebrow">Ready for a conversation?</p><h1>Introduce yourself</h1><p class="lede">Explore opportunities first.</p></div></section>
<aside class="page-nav" id="related-pages"><div class="nav-title">For doctors joining</div><a href="doctor-readiness.html">Am I ready to talk?</a><a href="gp-opportunities.html">GP Opportunities</a></aside>
<article data-ev-article="true">
<section class="attraction-next-step" data-attraction-next="true"><h2>We’ll take it from here</h2><p>Explore our opportunities</p></section>
<form id="eoi-form" class="attraction-tool-panel" data-clinic-slug="woolloongabba">
<div class="eoi-field-grid">
<label><span class="attr-field-label">Name</span><input name="name" required/></label>
<label><span class="attr-field-label">Email</span><input name="email" type="email" required/></label>
<label><span class="attr-field-label">Phone</span><input name="phone" type="tel"/></label>
</div>
<label><span class="attr-field-label">Your message</span><textarea name="availabilityNotes"></textarea></label>
<fieldset class="eoi-optional-details"><legend>Optional</legend>
<input name="ahpraRegistration"/><input name="medicareProviderNumber"/><input name="currentPractice"/>
</fieldset>
<button class="button" type="submit">Send my note</button>
</form>
</article>
<nav class="persistent-care-actions persistent-care-actions--recruitment"><a href="#eoi-form">Express Interest</a></nav>
<div class="footer-nav footer-nav-explore"><h3>Explore for GPs</h3><a href="gp-opportunities.html">GP Opportunities</a></div>
</body></html>`;
  const result = applyPublicUxRefinements(html, "join-our-team/express-interest.html");
  assert.match(result, /data-eoi-focus="true"/);
  assert.match(result, /data-recruitment-contact="true"/);
  assert.match(result, /Roshan Samarawickrema/);
  assert.match(result, /Confidential Means Confidential/);
  assert.match(result, /name="phone"[^>]*required/);
  assert.match(result, /name="preferredContact"/);
  assert.match(result, /Optional message/);
  assert.match(result, /Request a Confidential Discussion/);
  assert.match(result, /Request a confidential discussion/);
  assert.doesNotMatch(result, /name="ahpraRegistration"/);
  assert.doesNotMatch(result, /name="medicareProviderNumber"/);
  assert.doesNotMatch(result, /name="currentPractice"/);
  assert.doesNotMatch(result, /id="related-pages"/);
  assert.doesNotMatch(result, /Am I ready to talk/);
  assert.doesNotMatch(result, /<section[^>]*attraction-next-step/);
  assert.doesNotMatch(result, /We’ll take it from here/);
  assert.doesNotMatch(result, /Explore for GPs/);
  assert.doesNotMatch(result, /Introduce yourself/);
  assert.doesNotMatch(result, /<nav[^>]*persistent-care-actions/);
  const contactIdx = result.indexOf("data-recruitment-contact");
  const trustIdx = result.indexOf("Confidential Means Confidential");
  const formIdx = result.indexOf('id="eoi-form"');
  assert.ok(contactIdx >= 0 && trustIdx > contactIdx && formIdx > trustIdx);
  assert.equal(applyPublicUxRefinements(result, "join-our-team/express-interest.html"), result);
});

test("the real homepage opening-hours block includes both links", () => {
  const content = readFileSync(path.resolve(process.cwd(), "../../old-html/index.html"), "utf8");
  const result = applyPublicUxRefinements(content, "index.html");
  assert.match(result, /class="hero-hours-actions"/);
  assert.match(result, /href="contact\.html">View all hours/);
  assert.match(result, /href="after-hours-care\.html">After Hours Care/);
  assert.match(result, /\/wmc-cache\/styles\.min\.css\?v=wmc-updates-dr-mobile-20261106e/);
  assert.match(result, /\/wmc-cache\/site\.js\?v=wmc-golnar-hotdoc-online-20261111a/);
  assert.match(result, /class="brand"[^>]*href="\/"/);
  assert.doesNotMatch(result, /class="brand"[^>]*href="index\.html"/);
  assert.match(result, /#patient-information \.info-trust-logos a\{[\s\S]*?width:136px!important/);
  assert.match(result, /@media \(min-width:1025px\)\{[\s\S]*?\.hero-picture \.hero-photo\{[\s\S]*?object-fit:cover!important/);
  assert.match(result, /#story a\.trust-line[\s\S]*?border-top:0!important/);
  assert.match(result, /info-trust-logos[\s\S]*?agpal-mark\.webp(?:\?[^"]*)?" width="192"/);
  assert.match(result, /info-trust-logos[\s\S]*?bulk-billing-practice\.png" width="256"/);
  assert.match(result, /#patient-information \.info-trust-logos img[\s\S]*?object-fit:contain!important/);
  assert.match(result, /#hotdoc-app \.hotdoc-benefits a\{[\s\S]*?text-decoration:none!important/);
  assert.match(result, /\.hero-visual\{[\s\S]*?order:1!important/);
  assert.match(result, /hero-content-panel>h1\{[\s\S]*?text-align:center!important/);
  assert.match(result, /href="recalls-and-reminders\.html">Receive reminders/);
  assert.match(result, /href="book-appointment\.html#booking-help">Reschedule appointments/);
  assert.match(result, /href="book-appointment\.html#using-the-hotdoc-app">Manage family bookings/);
  assert.match(result, /href="book-appointment\.html">Book appointments/);
  assert.match(result, /digital-reception\.js\?v=wmc-dr-dock-cls-20261107/);
  assert.match(result, /data-clinic-slug="woolloongabba"/);
  assert.match(result, /<body[^>]*\bhas-action-dock\b/);
  assert.match(result, /digital-reception-launcher digital-reception-dock-action/);
  assert.match(result, /aria-label="Book, call, and reception"/);
  assert.match(result, /hero hero--authority-v6/);
  assert.match(result, /#home\.hero\.hero--authority-v6/);
  assert.match(result, /hero-content-panel/);
  assert.match(result, /id="wmc-hero-authority-v6"/);
  assert.match(result, /Your trusted local doctors/);
  assert.match(result, /understand your health journey/);
  assert.match(result, /AGPAL Accredited/);
  assert.match(result, /Bulk Billing Available/);
  assert.match(result, /Open 7 Days/);
  assert.match(result, /Experienced GP Team/);
  assert.match(result, /Continuity of Care/);
  assert.match(result, /Meet Our Doctors/);
  assert.match(result, /Call \(07\) 3217 3344/);
  assert.match(result, /max-width:520px/);
  assert.match(result, /hero-stats-bar/);
  assert.match(result, /href="#continuity"[^>]*>[\s\S]*?Continuity of Care/);
  assert.match(result, /href="contact\.html"[^>]*>[\s\S]*?Open 7 Days/);
  assert.match(result, /href="agpal-accreditation\.html"[^>]*>[\s\S]*?AGPAL Accredited/);
  assert.match(result, /href="team\.html"[^>]*>[\s\S]*?Experienced GP Team/);
  assert.match(result, /data-open-digital-reception/);
  assert.match(result, /object-fit:contain!important/);
  assert.match(result, /hero-practitioner-strip/);
  assert.match(result, /Doctors who take the time to know you/);
  assert.match(result, /assets\/team\/dr-tanya-goodwill-96\.webp/);
  assert.match(result, /assets\/team\/dr-tanya-goodwill-192\.webp 192w/);
  assert.match(result, /assets\/team\/dr-mary-abadir-96\.webp/);
  assert.doesNotMatch(result, /hero-practitioner-avatar[^>]*dr-tanya-goodwill-640\.webp/);
  assert.match(result, /hero-visual[\s\S]*?hero-final-desktop\.webp/);
  assert.match(result, /as="image"[^>]*hero-final-desktop\.webp/);
  assert.doesNotMatch(result, /id="team"/);
  assert.doesNotMatch(result, /home-practitioner-track/);
  assert.doesNotMatch(result, /class="hero-team-mosaic"/);
  assert.doesNotMatch(result, /20\+\s*Years/);
  assert.doesNotMatch(result, /hero--desktop-split/);
  assert.equal(applyPublicUxRefinements(result, "index.html"), result);
});

test("the direct static index also contains all release-critical links", () => {
  const content = readFileSync(path.resolve(process.cwd(), "public/index.html"), "utf8");
  assert.match(content, /data-nav-key="updates"[\s\S]*?data-nav-key="join-team"[\s\S]*?data-nav-key="contact"/);
  assert.match(content, /href="after-hours-care\.html">After Hours Care/);
  assert.match(content, /href="\/favicon\.ico\?v=hd-tm-caring-short-20261111b"/);
  assert.doesNotMatch(content, /<link\b[^>]*href="assets\/brand\/wmc-brand-mark\.webp"/);
});

test("wires Samuel Stafford directory portrait and keeps profile hero image", () => {
  const directoryHtml =
    '<html><head></head><body><article class="practitioner practitioner-directory-card practitioner-mr-samuel-stafford">' +
    '<a aria-label="View Mr Samuel Stafford profile" class="portrait practitioner-no-photo" href="doctors/mr-samuel-stafford.html">' +
    '<span class="practitioner-no-photo-text">Mr Samuel Stafford</span></a></article></body></html>';
  const directory = applyPublicUxRefinements(directoryHtml, "team.html");
  assert.match(directory, /assets\/team\/mr-samuel-stafford\.webp/);
  assert.match(directory, /data-practitioner-image="true"/);
  assert.doesNotMatch(directory, /practitioner-no-photo/);
  assert.equal(applyPublicUxRefinements(directory, "team.html"), directory);

  const profileHtml =
    '<html><head><meta content="https://gabbamedicalcentre.com.au/assets/hero-final-desktop.webp" property="og:image"/>' +
    '<meta content="https://gabbamedicalcentre.com.au/assets/hero-final-desktop.webp" name="twitter:image"/></head>' +
    '<body><div class="shell doctor-profile-hero"><div class="doctor-profile-heading"><h1>Mr Samuel Stafford</h1></div></div></body></html>';
  const profile = applyPublicUxRefinements(profileHtml, "doctors/mr-samuel-stafford.html");
  assert.match(profile, /\.\.\/assets\/team\/mr-samuel-stafford\.webp/);
  assert.match(profile, /doctor-profile-photo/);
  assert.match(profile, /og:image"\/>/);
  assert.match(profile, /content="https:\/\/gabbamedicalcentre\.com\.au\/assets\/team\/mr-samuel-stafford\.webp"/);
  assert.equal(applyPublicUxRefinements(profile, "doctors/mr-samuel-stafford.html"), profile);
});

test("moves View all General Practitioners to the bottom-left of the GP section", () => {
  const html =
    '<html><head></head><body><div class="shell team-directory">' +
    '<section class="team-role-section" id="general-practitioners">' +
    "<h2>General Practitioners</h2>" +
    '<p class="team-role-copy">Our GPs are usually the central clinical point for your care.</p>' +
    '<p class="team-role-page-link"><a class="text-link" href="team-general-practitioners.html">View all General Practitioners →</a></p>' +
    '<div class="team-directory-grid"><article class="practitioner"><div class="practitioner-meta"><h3>Dr Tanya</h3></div></article></div>' +
    "</section></div></body></html>";
  const actual = applyPublicUxRefinements(html, "team.html");
  const section = actual.match(
    /<section\b[^>]*id="general-practitioners"[^>]*>[\s\S]*?<\/section>/i,
  )?.[0];
  assert.ok(section);
  assert.match(
    section!,
    /team-directory-grid[\s\S]*<\/div>\s*<p class="team-role-page-link"><a class="text-link" href="team-general-practitioners\.html">View all General Practitioners →<\/a><\/p>/i,
  );
  assert.doesNotMatch(
    section!,
    /team-role-copy[\s\S]*team-role-page-link[\s\S]*team-directory-grid/i,
  );
  assert.match(actual, /#general-practitioners > \.team-role-page-link\{[^}]*margin:28px 0 0/);
  assert.equal(applyPublicUxRefinements(actual, "team.html"), actual);
});
