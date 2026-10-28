import assert from "node:assert/strict";
import test from "node:test";
import { optimiseHomepageDelivery } from "./performance";
import { applyAccessibilityClosure } from "./accessibility";

test("home delivery keeps the approved hero and reserves dimensions", () => {
  const source = [
    '<link href="assets/hero-final-desktop.webp" media="(max-width: 700px)" rel="preload"/>',
    '<source media="(max-width: 700px)" srcset="assets/hero-final-desktop.webp"/>',
    '<img src="assets/clinic-reception.png"/>',
    '<img src="assets/location-storefront-polished.webp"/>',
    '<img src="assets/brand/agpal-mark.webp"/>',
  ].join("");
  const result = optimiseHomepageDelivery(source, "index.html");
  assert.match(result, /srcset="assets\/hero-final-mobile\.webp"/);
  assert.match(result, /href="assets\/hero-final-mobile\.webp"/);
  assert.match(result, /width="1080" height="870"/);
  assert.match(result, /width="1800" height="1013"/);
  assert.match(result, /width="386" height="386"/);
  assert.match(result, /srcset="assets\/performance\/clinic-reception-720\.webp 720w,/);
  assert.match(result, /srcset="assets\/performance\/location-storefront-720\.webp 720w,/);
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
