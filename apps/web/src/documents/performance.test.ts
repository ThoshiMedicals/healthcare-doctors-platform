import assert from "node:assert/strict";
import test from "node:test";
import { optimiseHomepageDelivery } from "./performance";
import { applyAccessibilityClosure } from "./accessibility";

test("home delivery keeps the approved hero and reserves dimensions", () => {
  const source = [
    '<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400&amp;display=swap" rel="stylesheet"/>',
    '<link href="assets/hero-final-desktop.webp" media="(max-width: 700px)" rel="preload"/>',
    '<source media="(max-width: 700px)" srcset="assets/hero-final-desktop.webp"/>',
    '<img class="hero-photo" decoding="async" fetchpriority="high" height="941" src="assets/hero-final-desktop.webp" width="1672"/>',
    '<img src="assets/clinic-reception.png"/>',
    '<img src="assets/location-storefront-polished.webp"/>',
    '<img src="assets/brand/agpal-mark.webp"/>',
    '<img src="assets/community/gabba-stadium-precinct-aerial.webp" width="1800" height="1013"/>',
    '<img src="assets/patient-information/new-patients-welcome-hero.webp"/>',
  ].join("");
  const result = optimiseHomepageDelivery(source, "index.html");
  assert.match(result, /srcset="assets\/hero-final-mobile\.webp"/);
  assert.match(result, /href="assets\/hero-final-mobile\.webp"/);
  assert.match(result, /class="hero-photo"[^>]*sizes="/);
  assert.match(result, /data-wmc-font-defer="true"/);
  assert.match(result, /rel="preload" as="style"/);
  assert.match(result, /width="1080" height="870"/);
  assert.match(result, /width="1800" height="1013"/);
  assert.match(result, /width="386" height="386"/);
  assert.match(result, /srcset="assets\/performance\/clinic-reception-720\.webp 720w,/);
  assert.match(result, /srcset="assets\/performance\/location-storefront-720\.webp 720w,/);
  assert.match(result, /srcset="assets\/performance\/gabba-stadium-900\.webp 900w,/);
  assert.match(result, /srcset="assets\/performance\/new-patients-welcome-600\.webp 600w,/);
});

test("google fonts delivery keeps a single deferred stylesheet path", () => {
  const source = [
    "<head>",
    '<link href="https://fonts.googleapis.com" rel="preconnect"/>',
    '<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>',
    '<link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&amp;family=Inter:wght@400;500;600&amp;display=swap" rel="preload" as="style" data-wmc-font-defer="true" onload="this.onload=null;this.rel=\'stylesheet\'"/>',
    '<link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&amp;family=Inter:wght@400;500;600&amp;display=swap" rel="stylesheet"/>',
    "</head><body></body>",
  ].join("");
  const once = optimiseHomepageDelivery(source, "index.html");
  const twice = optimiseHomepageDelivery(once, "index.html");
  const css2 = twice.match(/fonts\.googleapis\.com\/css2/g) || [];
  // One preload + one noscript stylesheet = two mentions, never a live duplicate stylesheet.
  assert.equal(css2.length, 2);
  assert.match(twice, /data-wmc-font-defer="true"/);
  assert.equal((twice.match(/rel="stylesheet"/g) || []).length, 1);
  assert.match(twice, /Libre\+Baskerville:wght@400;700/);
  assert.match(twice, /Inter:wght@400;500;600/);
  assert.equal(twice, optimiseHomepageDelivery(twice, "index.html"));
});

test("delivery changes reserve shared image dimensions without touching page copy", () => {
  const source = '<h1>Patient care</h1><img src="../assets/brand/bulk-billing-practice.png"/>';
  const result = optimiseHomepageDelivery(source, "services/family-health.html");
  assert.match(result, /width="1080" height="1080"/);
  assert.match(result, /<h1>Patient care<\/h1>/);
  assert.ok(!result.includes("assets/performance/"));
});

test("accessible link names include their visible labels", () => {
  const source = [
    '<a aria-label="Call Woolloongabba Medical Centre on (07) 3217 3344" class="persistent-care-call">Call Clinic</a>',
    '<a aria-label="View Dr Tanya Goodwill profile" class="team-practitioner-profile-link">View profile</a>',
    '<a aria-label="View opening hours, open seven days" class="hero-trust-refined-item hero-trust-refined-link">Open 7 days</a>',
  ].join("");
  const result = applyAccessibilityClosure(source, "index.html");
  assert.match(result, /aria-label="Call Clinic — Woolloongabba Medical Centre/);
  assert.match(result, /aria-label="View profile — Dr Tanya Goodwill"/);
  assert.match(result, /aria-label="Open 7 days — view opening hours"/);
  assert.match(result, />View profile<\/a>/);
  assert.match(result, />Open 7 days<\/a>/);
});

test("alt text stays meaningful without duplicating the full HotDoc poster copy", () => {
  const source = '<img alt="Book your favourite doctor any time in the HotDoc app. Woolloongabba Medical Centre, (07) 3217 3344. App Store and Google Play badges." src="assets/patient-information/hotdoc-online-booking-day-night.webp"/>';
  const result = applyAccessibilityClosure(source, "index.html");
  assert.match(result, /alt="Book appointments with Woolloongabba Medical Centre using HotDoc"/);
  assert.equal(result.includes("App Store and Google Play badges"), false);
});

test("hero trust logos receive informative alt text", () => {
  const source = [
    '<span class="hero-trust-logo hero-trust-logo-agpal">',
    '<img alt="" data-local-asset="agpal-mark" src="assets/brand/agpal-mark.webp"/>',
    "</span>",
    '<span class="hero-trust-logo hero-trust-logo-bulk"><img alt="" src="assets/brand/bulk-billing-practice.png"/></span>',
  ].join("");
  const result = applyAccessibilityClosure(source, "index.html");
  assert.match(result, /alt="Accredited General Practice"/);
  assert.match(result, /alt="Medicare Bulk Billing Practice"/);
  assert.equal(result.includes('alt=""'), false);
});

test("GP discovery cards get contextual accessible names without changing visible copy", () => {
  const source =
    '<li class="gp-discovery-card"><h3 class="gp-discovery-name">Dr Usman Gul</h3>' +
    '<a class="gp-discovery-profile" href="doctors/dr-usman-gul.html" aria-label="View profile for Dr Usman Gul">View Profile</a>' +
    '<a class="button gp-discovery-book" href="#" aria-label="Book Appointment">Book Appointment</a>' +
    '<p class="gp-discovery-note">Booking conditions apply — please check the <a href="doctors/dr-usman-gul.html">practitioner profile</a> before booking.</p>' +
    "</li>";
  const result = applyAccessibilityClosure(source, "team-general-practitioners.html");
  assert.match(result, /aria-label="View Dr Usman Gul practitioner profile"/);
  assert.match(result, /aria-label="Book an appointment with Dr Usman Gul"/);
  assert.match(result, /aria-label="View Dr Usman Gul practitioner profile">practitioner profile</);
  assert.match(result, />View Profile</);
  assert.match(result, />Book Appointment</);
  assert.match(result, />practitioner profile</);
});
