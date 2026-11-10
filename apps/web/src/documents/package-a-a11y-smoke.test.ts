import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { applyAccessibilityClosure } from "./accessibility";
import { applyPublicUxRefinements } from "./public-ux";
import { alignPhoneOnlyBookingProse, alignPhoneOnlyPractitionerChrome } from "./phone-only-booking";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../../old-html");

function accessibleName(attrs: string, inner: string): string {
  const aria = attrs.match(/\baria-label="([^"]+)"/i)?.[1];
  if (aria) return aria.trim();
  const text = inner.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  if (text) return text;
  return [...inner.matchAll(/\balt="([^"]+)"/gi)].map((m) => m[1]).filter(Boolean).join(" ").trim();
}

function emptyNamedAnchors(html: string): string[] {
  const out: string[] = [];
  for (const m of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    if (!accessibleName(m[1], m[2])) out.push(m[0].slice(0, 160));
  }
  return out;
}

test("A11Y-001: homepage image-only links gain accessible names after closure", () => {
  const raw = readFileSync(path.join(root, "index.html"), "utf8");
  // Seed a bare image link that would otherwise have an empty accessible name.
  const seeded = raw.replace(
    "</body>",
    `<a href="agpal-accreditation.html"><img src="assets/brand/agpal-mark.webp" alt="Accredited General Practice"/></a></body>`,
  );
  const html = applyPublicUxRefinements(applyAccessibilityClosure(seeded, "index.html"), "index.html");
  const empty = emptyNamedAnchors(html);
  assert.equal(empty.length, 0, empty.slice(0, 5).join("\n"));
});

test("S1-R4: Golnar welcome + profile CTAs expose keyboard-operable named controls", () => {
  const welcomeSeed = `<!DOCTYPE html><html lang="en-AU"><head>
<meta content="Learn more about Dr Golnar Mortezaei and book an appointment online with Woolloongabba Medical Centre." name="description"/>
</head><body>
<a class="wmc-book-appointment header-cta" data-hotdoc-button="" href="https://www.hotdoc.com.au/clinic">Book Appointment</a>
<p class="update-article-summary">Dr Mortezaei is now accepting new patients and appointments can be booked online or by contacting our reception team.</p>
<nav class="persistent-care-actions"><a class="persistent-care-book" data-hotdoc-button="" href="https://www.hotdoc.com.au/clinic">Book Appointment</a>
<button type="button" class="digital-reception-launcher" aria-expanded="false" aria-controls="digital-reception-panel">Digital Reception</button></nav>
</body></html>`;
  const welcome = applyPublicUxRefinements(
    alignPhoneOnlyPractitionerChrome(
      alignPhoneOnlyBookingProse(welcomeSeed, null),
      "updates/welcome-dr-golnar-mortezaei.html",
    ),
    "updates/welcome-dr-golnar-mortezaei.html",
  );
  assert.doesNotMatch(welcome, /book an appointment online/i);
  assert.match(welcome, /aria-label="Call Reception to Book"|Call Reception to Book/);
  assert.match(welcome, /digital-reception-launcher[^>]*aria-expanded="false"/);
  assert.match(welcome, /href="tel:\+61732173344"/);

  const profile = applyPublicUxRefinements(
    `<div class="doctor-profile-actions"><a class="button wmc-book-appointment" href="tel:+61732173344">Call Reception to Book</a></div>
     <button type="button" class="menu-toggle" aria-controls="primary-nav" aria-expanded="false">Menu</button>
     <nav id="primary-nav"><a href="../contact.html" data-nav-key="contact">Contact</a></nav>`,
    "doctors/dr-golnar-mortezaei.html",
  );
  assert.match(profile, /menu-toggle[^>]*aria-expanded="false"/);
  assert.match(profile, /href="tel:\+61732173344"[^>]*>Call Reception to Book</);
});

test("S1-R4: phone CTAs are activatable links (no positive tabindex traps on primary CTAs)", () => {
  const html = applyPublicUxRefinements(
    alignPhoneOnlyPractitionerChrome(
      `<a class="button wmc-book-appointment" href="tel:+61732173344">Call Reception to Book</a>
       <a class="header-cta wmc-book-appointment" data-hotdoc-button="" href="https://www.hotdoc.com.au/x">Book Appointment</a>`,
      "updates/welcome-dr-golnar-mortezaei.html",
    ),
    "updates/welcome-dr-golnar-mortezaei.html",
  );
  for (const m of html.matchAll(/<a\b([^>]*)>/gi)) {
    const attrs = m[1];
    if (!/wmc-book-appointment|header-cta|persistent-care-book/i.test(attrs)) continue;
    assert.doesNotMatch(attrs, /\btabindex="-[0-9]+"/i, attrs);
    assert.match(attrs, /\bhref="/i, attrs);
  }
});
