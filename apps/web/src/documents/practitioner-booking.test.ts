import assert from "node:assert/strict";
import test from "node:test";
import {
  alignGolnarOnlineBookingChrome,
  GOLNAR_APPROVED_HOTDOC_URL,
  isClinicLevelHotdocUrl,
  isGolnarWelcomePath,
  PRACTITIONER_BOOKING_MATRIX,
  resolvePractitionerBookingHref,
} from "./practitioner-booking";
import { alignPhoneOnlyPractitionerChrome } from "./phone-only-booking";

const CLINIC_HOTDOC =
  "https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/doctors?wp=w_lightbox";

test("five-practitioner booking matrix modes", () => {
  assert.equal(PRACTITIONER_BOOKING_MATRIX.length, 5);
  const bySlug = Object.fromEntries(PRACTITIONER_BOOKING_MATRIX.map((row) => [row.slug, row]));
  assert.equal(bySlug["dr-golnar-mortezaei"].mode, "ONLINE_HOTDOC");
  assert.equal(bySlug["dr-golnar-mortezaei"].approvedHotdocUrl, GOLNAR_APPROVED_HOTDOC_URL);
  assert.equal(bySlug["dr-mary-abadir"].mode, "PHONE_ONLY");
  assert.equal(bySlug["dr-tanya-goodwill"].mode, "ONLINE_HOTDOC");
  assert.equal(bySlug["dr-james"].mode, "ONLINE_HOTDOC");
  assert.equal(bySlug["dr-yamesha-ranatunga"].mode, "ONLINE_HOTDOC");
});

test("resolvePractitionerBookingHref prefers CMS practitioner HotDoc for Golnar", () => {
  const cms =
    "https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/doctors/dr-golnar-mortezaei-5?wp=w_lightbox";
  assert.equal(resolvePractitionerBookingHref("dr-golnar-mortezaei", cms), cms);
});

test("resolvePractitionerBookingHref falls back when CMS is null, tel, or clinic-level", () => {
  assert.equal(resolvePractitionerBookingHref("dr-golnar-mortezaei", null), GOLNAR_APPROVED_HOTDOC_URL);
  assert.equal(
    resolvePractitionerBookingHref("dr-golnar-mortezaei", "tel:+61732173344"),
    GOLNAR_APPROVED_HOTDOC_URL,
  );
  assert.equal(
    resolvePractitionerBookingHref("dr-golnar-mortezaei", CLINIC_HOTDOC),
    GOLNAR_APPROVED_HOTDOC_URL,
  );
  assert.equal(isClinicLevelHotdocUrl(CLINIC_HOTDOC), true);
});

test("resolvePractitionerBookingHref does not invent URLs for other slugs", () => {
  assert.equal(resolvePractitionerBookingHref("dr-mary-abadir", null), null);
  assert.equal(resolvePractitionerBookingHref("dr-mary-abadir", "tel:+61732173344"), "tel:+61732173344");
  assert.equal(resolvePractitionerBookingHref("dr-james", null), null);
});

test("Golnar fallback never applies to Mary or other practitioners", () => {
  assert.notEqual(
    resolvePractitionerBookingHref("dr-mary-abadir", null),
    GOLNAR_APPROVED_HOTDOC_URL,
  );
  assert.equal(
    resolvePractitionerBookingHref("dr-tanya-goodwill", CLINIC_HOTDOC),
    CLINIC_HOTDOC,
  );
  assert.equal(
    resolvePractitionerBookingHref(
      "dr-james",
      "https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/doctors/dr-james-chanaka-1?wp=w_lightbox",
    ),
    "https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/doctors/dr-james-chanaka-1?wp=w_lightbox",
  );
});

test("Golnar welcome/profile chrome upgrades clinic HotDoc and tel to authorised URL", () => {
  assert.equal(isGolnarWelcomePath("updates/welcome-dr-golnar-mortezaei.html"), true);
  const html = `<html><body>
  <header><div class="header-cta"><a class="wmc-book-appointment header-cta" data-hotdoc-button="" data-hotdoc-widget="lightbox" href="${CLINIC_HOTDOC}">Book Appointment</a></div></header>
  <div class="doctor-profile-actions"><a class="button wmc-book-appointment" href="tel:+61732173344">Call Reception to Book</a></div>
  <nav class="persistent-care-actions" aria-label="Care actions">
    <a class="persistent-care-book wmc-book-appointment" data-hotdoc-button="" href="${CLINIC_HOTDOC}">Book Appointment</a>
    <button type="button" class="digital-reception-launcher">Digital Reception</button>
  </nav>
  </body></html>`;
  const welcome = alignGolnarOnlineBookingChrome(html, "updates/welcome-dr-golnar-mortezaei.html");
  assert.match(welcome, new RegExp(GOLNAR_APPROVED_HOTDOC_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(welcome, /data-hotdoc-widget="lightbox"/);
  assert.match(welcome, /target="_blank"/);
  assert.match(welcome, /rel="noopener noreferrer"/);
  assert.match(welcome, /Book Appointment/);
  assert.doesNotMatch(welcome, /Call Reception to Book/);
  assert.match(welcome, /digital-reception-launcher/);

  const profile = alignGolnarOnlineBookingChrome(html, "doctors/dr-golnar-mortezaei.html");
  assert.match(profile, /dr-golnar-mortezaei-5\?wp=w_lightbox/);
  assert.match(profile, /doctor-profile-actions[\s\S]*Book Appointment/);
});

test("Mary phone-only chrome remains intact after Golnar online policy", () => {
  const html = `<html><body>
  <header><div class="header-cta"><a class="wmc-book-appointment header-cta" data-hotdoc-button="" data-hotdoc-widget="lightbox" href="${CLINIC_HOTDOC}">Book Appointment</a></div></header>
  <div class="doctor-profile-actions"><a class="button wmc-book-appointment" href="tel:+61732173344">Call Reception to Book</a></div>
  <nav class="persistent-care-actions" aria-label="Care actions">
    <a class="persistent-care-book wmc-book-appointment" data-hotdoc-button="" href="${CLINIC_HOTDOC}">Book Appointment</a>
  </nav>
  </body></html>`;
  const unchangedByGolnar = alignGolnarOnlineBookingChrome(html, "doctors/dr-mary-abadir.html");
  assert.equal(unchangedByGolnar, html);
  const next = alignPhoneOnlyPractitionerChrome(html, "doctors/dr-mary-abadir.html");
  assert.match(next, /persistent-care-book[^>]*href="tel:\+61732173344"/);
  assert.doesNotMatch(next, /persistent-care-book[^>]*data-hotdoc-button/);
  assert.match(next, /Call Reception to Book/);
});

test("Golnar welcome is not forced phone-only by alignPhoneOnlyPractitionerChrome", () => {
  const html = `<html><body>
  <header><div class="header-cta"><a class="wmc-book-appointment header-cta" data-hotdoc-button="" data-hotdoc-widget="lightbox" href="${GOLNAR_APPROVED_HOTDOC_URL}">Book Appointment</a></div></header>
  <nav class="persistent-care-actions"><a class="persistent-care-book wmc-book-appointment" data-hotdoc-button="" href="${GOLNAR_APPROVED_HOTDOC_URL}">Book Appointment</a></nav>
  </body></html>`;
  assert.equal(
    alignPhoneOnlyPractitionerChrome(html, "updates/welcome-dr-golnar-mortezaei.html"),
    html,
  );
});
