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

test("the real homepage opening-hours block includes both links", () => {
  const content = readFileSync(path.resolve(process.cwd(), "../../old-html/index.html"), "utf8");
  const result = applyPublicUxRefinements(content, "index.html");
  assert.match(result, /class="hero-hours-actions"/);
  assert.match(result, /href="contact\.html">View all hours/);
  assert.match(result, /href="after-hours-care\.html">After Hours Care/);
  assert.match(result, /styles\.css\?v=wmc-hero-authority-v6f-20261105/);
  assert.match(result, /site\.js\?v=wmc-hero-authority-v6f-20261105/);
  assert.match(result, /#hotdoc-app \.hotdoc-benefits a\{[\s\S]*?text-decoration:none!important/);
  assert.match(result, /\.hero-visual\{[\s\S]*?order:1!important/);
  assert.match(result, /hero-content-panel>h1\{[\s\S]*?text-align:center!important/);
  assert.match(result, /href="recalls-and-reminders\.html">Receive reminders/);
  assert.match(result, /href="book-appointment\.html#booking-help">Reschedule appointments/);
  assert.match(result, /href="book-appointment\.html#using-the-hotdoc-app">Manage family bookings/);
  assert.match(result, /href="book-appointment\.html">Book appointments/);
  assert.match(result, /digital-reception\.js\?v=wmc-search-signals-20261103/);
  assert.match(result, /data-clinic-slug="woolloongabba"/);
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
  assert.match(result, /dr-tanya-goodwill-640\.webp/);
  assert.match(result, /dr-mary-abadir-640\.webp/);
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
  assert.match(content, /href="\/favicon\.ico\?v=hd-symbol-20261029b"/);
  assert.doesNotMatch(content, /<link\b[^>]*href="assets\/brand\/wmc-brand-mark\.webp"/);
});
