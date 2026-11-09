import assert from "node:assert/strict";
import test from "node:test";
import {
  alignPhoneOnlyBookingProse,
  alignPhoneOnlyPractitionerChrome,
  htmlIndicatesPhoneOnlyPractitioner,
  isPhoneOnlyBookingHref,
} from "./phone-only-booking";

test("phone-only booking href detection", () => {
  assert.equal(isPhoneOnlyBookingHref(null), true);
  assert.equal(isPhoneOnlyBookingHref(""), true);
  assert.equal(isPhoneOnlyBookingHref("tel:+61732173344"), true);
  assert.equal(isPhoneOnlyBookingHref("https://www.hotdoc.com.au/example"), false);
});

test("htmlIndicatesPhoneOnlyPractitioner reads primary profile CTA", () => {
  const phone = `<div class="doctor-profile-actions"><a class="button wmc-book-appointment" href="tel:+61732173344">Call Reception to Book</a></div>`;
  const online = `<div class="doctor-profile-actions"><a class="button wmc-book-appointment" data-hotdoc-button="" href="https://www.hotdoc.com.au/x">Book Appointment</a></div>`;
  assert.equal(htmlIndicatesPhoneOnlyPractitioner(phone), true);
  assert.equal(htmlIndicatesPhoneOnlyPractitioner(online), false);
});

test("alignPhoneOnlyBookingProse rewrites Golnar-style online wording", () => {
  const html =
    "<p>Appointments can be booked online through HotDoc or by contacting our reception team on (07) 3217 3344. Reception can also help you choose the most appropriate appointment type.</p>";
  const next = alignPhoneOnlyBookingProse(html, null);
  assert.match(next, /contact our reception team/i);
  assert.doesNotMatch(next, /booked online through HotDoc/i);
  assert.equal(alignPhoneOnlyBookingProse(html, "https://www.hotdoc.com.au/x"), html);
});

test("alignPhoneOnlyPractitionerChrome updates TOC header and dock on phone-only profiles", () => {
  const html = `<html><body>
  <header><div class="header-cta"><a class="wmc-book-appointment header-cta" data-hotdoc-button="" data-hotdoc-widget="lightbox" href="https://www.hotdoc.com.au/clinic">Book Appointment</a></div></header>
  <a href="#book">Book Appointment</a>
  <div class="doctor-profile-actions"><a class="button wmc-book-appointment wmc-book-practitioner" href="tel:+61732173344">Call Reception to Book</a></div>
  <nav class="persistent-care-actions" aria-label="Care actions">
    <a class="persistent-care-book wmc-book-appointment" data-hotdoc-button="" href="https://www.hotdoc.com.au/clinic">Book Appointment</a>
    <a class="persistent-care-call" href="tel:+61732173344">Call</a>
  </nav>
  </body></html>`;
  const next = alignPhoneOnlyPractitionerChrome(html, "doctors/dr-golnar-mortezaei.html");
  assert.match(next, /href="#book">Call Reception to Book</);
  assert.match(next, /persistent-care-book[^>]*href="tel:\+61732173344"/);
  assert.doesNotMatch(
    next,
    /persistent-care-book[^>]*data-hotdoc-button/,
  );
  assert.match(next, /header-cta[^>]*href="tel:\+61732173344"/);
  // Online doctor pages unchanged.
  const onlineHtml = html.replace('href="tel:+61732173344"', 'href="https://www.hotdoc.com.au/dr-x"');
  assert.equal(
    alignPhoneOnlyPractitionerChrome(onlineHtml, "doctors/dr-james.html"),
    onlineHtml,
  );
});
