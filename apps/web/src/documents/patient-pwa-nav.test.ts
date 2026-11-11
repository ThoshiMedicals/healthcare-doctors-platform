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

const hotdocDock =
  '<nav aria-label="Appointment actions" class="persistent-care-actions"><div class="persistent-care-actions-inner">' +
  '<a class="persistent-care-book wmc-book-appointment" data-hotdoc-button="" data-hotdoc-widget="lightbox" href="https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/doctors?wp=w_lightbox">Book Appointment</a>' +
  '<a aria-label="Call Woolloongabba Medical Centre on (07) 3217 3344" class="persistent-care-call" href="tel:+61732173344">Call Clinic</a>' +
  "</div></nav>";

const phoneOnlyDock =
  '<nav aria-label="Appointment actions" class="persistent-care-actions"><div class="persistent-care-actions-inner">' +
  '<a aria-label="Call reception to book with Dr Mary Abadir" class="persistent-care-book wmc-book-appointment" href="tel:+61732173344">Call Reception to Book</a>' +
  '<a aria-label="Call Woolloongabba Medical Centre on (07) 3217 3344" class="persistent-care-call" href="tel:+61732173344">Call Clinic</a>' +
  "</div></nav>";

function page(opts: { prefix?: string; dock?: string; bodyClass?: string }): string {
  const prefix = opts.prefix ?? "";
  const dock = opts.dock ?? hotdocDock;
  return (
    `<html><head><title>Page</title></head><body class="${opts.bodyClass ?? ""}">` +
    `<a class="skip-link" href="#main">Skip to content</a>` +
    `<header><div class="shell header-inner">${nav(prefix)}</div></header>` +
    `<main><h1>Content</h1></main>` +
    `${dock}` +
    `<footer>Footer</footer>` +
    `</body></html>`
  );
}

test("PWA-NAV: injects standalone quicknav right after the header, mirroring the existing HotDoc dock", () => {
  const html = page({});
  const result = applyPublicUxRefinements(html, "services.html");

  // Hidden by default; only shown in installed-PWA standalone mode.
  assert.match(result, /<style id="wmc-patient-pwa-quicknav">[\s\S]*?\.patient-pwa-quicknav\{display:none\}/);
  assert.match(result, /@media \(display-mode:standalone\)/);

  const quicknav = result.match(/<nav\b[^>]*data-pwa-standalone-nav="true"[^>]*>[\s\S]*?<\/nav>/i)?.[0];
  assert.ok(quicknav, "quicknav nav present");
  assert.match(quicknav!, /aria-label="Patient quick access"/);

  // Positioned right after </header>, before <main> — never a floating overlay.
  assert.ok(result.indexOf("</header>") < result.indexOf('data-pwa-standalone-nav="true"'));
  assert.ok(result.indexOf('data-pwa-standalone-nav="true"') < result.indexOf("<main>"));

  // Book link mirrors the dock's existing HotDoc href/attrs verbatim — never invented.
  assert.match(
    quicknav!,
    /class="patient-pwa-quicknav-link patient-pwa-quicknav-book" data-hotdoc-button="" data-hotdoc-widget="lightbox" aria-label="Book an appointment" href="https:\/\/www\.hotdoc\.com\.au\/medical-centres\/woolloongabba-QLD-4102\/t-medicals-woolloongabba-medical-centre\/doctors\?wp=w_lightbox"/,
  );
  assert.match(quicknav!, />Book<\/span><\/a>/);

  // Doctors / Services / Digital Reception / Contact — no invented paths.
  assert.match(quicknav!, /href="team-general-practitioners\.html"/);
  assert.match(quicknav!, /href="services\.html"/);
  assert.match(quicknav!, /href="contact\.html"/);
  assert.match(quicknav!, /data-open-digital-reception=""/);
  assert.match(quicknav!, /<button[^>]*patient-pwa-quicknav-reception[^>]*>/);

  // Client enhancement script referenced via the immutable /wmc-cache/ path.
  assert.match(result, /<script defer="" src="\/wmc-cache\/patient-pwa-nav\.js\?v=wmc-patient-pwa-nav-20261111a"><\/script>/);

  // The original booking dock's HotDoc/Call hrefs are unaffected by this feature
  // (the dock itself is independently stabilised by existing, unrelated logic).
  const originalDock = result.match(/<nav\b[^>]*\bclass="persistent-care-actions"[^>]*>[\s\S]*?<\/nav>/i)?.[0] ?? "";
  assert.match(
    originalDock,
    /class="persistent-care-book wmc-book-appointment" data-hotdoc-button="" data-hotdoc-widget="lightbox" href="https:\/\/www\.hotdoc\.com\.au\/medical-centres\/woolloongabba-QLD-4102\/t-medicals-woolloongabba-medical-centre\/doctors\?wp=w_lightbox">Book Appointment</,
  );
  assert.match(originalDock, /class="persistent-care-call" href="tel:\+61732173344">Call Clinic</);

  // Idempotent re-application.
  assert.equal(applyPublicUxRefinements(result, "services.html"), result);
});

test("PWA-NAV: phone-only dock (e.g. Mary/Usman pattern) yields a Call entry, never an invented HotDoc link", () => {
  const html = page({ dock: phoneOnlyDock });
  const result = applyPublicUxRefinements(html, "doctors/dr-mary-abadir.html");
  const quicknav = result.match(/<nav\b[^>]*data-pwa-standalone-nav="true"[^>]*>[\s\S]*?<\/nav>/i)?.[0] ?? "";

  assert.match(
    quicknav,
    /class="patient-pwa-quicknav-link patient-pwa-quicknav-book" aria-label="Call reception to book with Dr Mary Abadir" href="tel:\+61732173344"/,
  );
  assert.doesNotMatch(quicknav, /data-hotdoc-button/);
  assert.match(quicknav, />Call<\/span><\/a>/);
  assert.equal(applyPublicUxRefinements(result, "doctors/dr-mary-abadir.html"), result);
});

test("PWA-NAV: nested pages resolve shortcuts with the correct relative prefix", () => {
  const html = page({ prefix: "../" });
  const result = applyPublicUxRefinements(html, "doctors/dr-tanya-goodwill.html");
  const quicknav = result.match(/<nav\b[^>]*data-pwa-standalone-nav="true"[^>]*>[\s\S]*?<\/nav>/i)?.[0] ?? "";

  assert.match(quicknav, /href="\.\.\/team-general-practitioners\.html"/);
  assert.match(quicknav, /href="\.\.\/services\.html"/);
  assert.match(quicknav, /href="\.\.\/contact\.html"/);
  assert.equal(applyPublicUxRefinements(result, "doctors/dr-tanya-goodwill.html"), result);
});

test("PWA-NAV: recruitment / Express Interest / EV surfaces never receive the patient quicknav", () => {
  for (const pagePath of [
    "join-our-team.html",
    "join-our-team/express-interest.html",
    "about-us/practice-experience.html",
  ]) {
    const html = page({});
    const result = applyPublicUxRefinements(html, pagePath);
    assert.doesNotMatch(result, /data-pwa-standalone-nav/, pagePath);
    assert.doesNotMatch(result, /id="wmc-patient-pwa-quicknav"/, pagePath);
    assert.doesNotMatch(result, /patient-pwa-nav\.js/, pagePath);
    // Re-running this feature's own inject stays a no-op here (full-pipeline
    // idempotency on these recruitment surfaces is covered by their own
    // dedicated tests elsewhere; this test only guards the patient quicknav).
    const reApplied = applyPublicUxRefinements(result, pagePath);
    assert.doesNotMatch(reApplied, /data-pwa-standalone-nav/, pagePath);
    assert.doesNotMatch(reApplied, /id="wmc-patient-pwa-quicknav"/, pagePath);
    assert.doesNotMatch(reApplied, /patient-pwa-nav\.js/, pagePath);
  }
});

test("PWA-NAV: pages without the approved booking dock are left alone (no invented booking link)", () => {
  const html =
    `<html><head></head><body>${nav()}<header></header><main>No dock here</main></body></html>`;
  const result = applyPublicUxRefinements(html, "recruitment-hold-notice.html");
  assert.doesNotMatch(result, /data-pwa-standalone-nav/);
  assert.doesNotMatch(result, /id="wmc-patient-pwa-quicknav"/);
  assert.equal(applyPublicUxRefinements(result, "recruitment-hold-notice.html"), result);
});

test("PWA-NAV: re-applying to a page that lost its dock cleans up a stale quicknav inject", () => {
  const withDock = applyPublicUxRefinements(page({}), "services.html");
  assert.match(withDock, /data-pwa-standalone-nav/);
  const dockStripped = withDock.replace(
    /<nav\b[^>]*class="persistent-care-actions"[^>]*>[\s\S]*?<\/nav>/i,
    "",
  );
  const reApplied = applyPublicUxRefinements(dockStripped, "services.html");
  assert.doesNotMatch(reApplied, /data-pwa-standalone-nav/);
  assert.doesNotMatch(reApplied, /id="wmc-patient-pwa-quicknav"/);
});

test("PWA-NAV: golden homepage receives the standalone quicknav without any golden-master edit", () => {
  const content = readFileSync(path.resolve(process.cwd(), "../../old-html/index.html"), "utf8");
  const result = applyPublicUxRefinements(content, "index.html");
  const quicknav = result.match(/<nav\b[^>]*data-pwa-standalone-nav="true"[^>]*>[\s\S]*?<\/nav>/i)?.[0];
  assert.ok(quicknav, "quicknav present on golden homepage");
  assert.match(quicknav!, /href="https:\/\/www\.hotdoc\.com\.au\/medical-centres\/woolloongabba-QLD-4102/);
  assert.match(quicknav!, /href="team-general-practitioners\.html"/);
  assert.match(quicknav!, /href="services\.html"/);
  assert.match(quicknav!, /href="contact\.html"/);
  assert.equal(applyPublicUxRefinements(result, "index.html"), result);
});

test("PWA-NAV: golden phone-only practitioner profile (Dr Mary Abadir) gets a Call shortcut, not HotDoc", () => {
  const content = readFileSync(
    path.resolve(process.cwd(), "../../old-html/doctors/dr-mary-abadir.html"),
    "utf8",
  );
  const result = applyPublicUxRefinements(content, "doctors/dr-mary-abadir.html");
  const quicknav = result.match(/<nav\b[^>]*data-pwa-standalone-nav="true"[^>]*>[\s\S]*?<\/nav>/i)?.[0];
  assert.ok(quicknav, "quicknav present on Mary's profile");
  assert.match(quicknav!, /patient-pwa-quicknav-book" aria-label="[^"]*Mary Abadir[^"]*" href="tel:\+61732173344"/);
  assert.doesNotMatch(quicknav!, /data-hotdoc-button/);
  assert.match(quicknav!, /href="\.\.\/team-general-practitioners\.html"/);
  assert.equal(applyPublicUxRefinements(result, "doctors/dr-mary-abadir.html"), result);
});

test("PWA-NAV: golden Join Our Team recruitment prospectus is excluded (HOLD-safe)", () => {
  const content = readFileSync(path.resolve(process.cwd(), "../../old-html/join-our-team.html"), "utf8");
  const result = applyPublicUxRefinements(content, "join-our-team.html");
  assert.doesNotMatch(result, /data-pwa-standalone-nav/);
  assert.doesNotMatch(result, /id="wmc-patient-pwa-quicknav"/);
  assert.equal(applyPublicUxRefinements(result, "join-our-team.html"), result);
});
