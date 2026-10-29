import assert from "node:assert/strict";
import test from "node:test";
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

test("leaves SEO head, internal classifications and unmodified pages untouched", () => {
  const html = '<html><head><link rel="canonical" href="/services.html"></head><body class="service-tier-hub"><span class="service-tier-chip">Service hub</span></body></html>';
  assert.equal(applyPublicUxRefinements(html, "services.html"), html);
});
