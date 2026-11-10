import assert from "node:assert/strict";
import test from "node:test";
import {
  alignPhoneOnlyBookingProse,
  alignPhoneOnlyPractitionerChrome,
  htmlIndicatesPhoneOnlyPractitioner,
  isGolnarWelcomePath,
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

test("S1-R1/R2: meta content-before-name and summary grammar are corrected", () => {
  const html = `<html><head>
<meta content="Now welcoming new patients. Learn more about Dr Golnar Mortezaei and book an appointment online with Woolloongabba Medical Centre." name="description"/>
<meta property="og:description" content="Learn more and book an appointment online with Woolloongabba Medical Centre."/>
<meta name="twitter:description" content="Book an appointment online with Woolloongabba Medical Centre."/>
<script type="application/ld+json">{"description":"Learn more about Dr Golnar and book an appointment online with Woolloongabba Medical Centre."}</script>
</head><body>
<p class="update-article-summary">We are pleased to welcome Dr Golnar Mortezaei to Woolloongabba Medical Centre. Dr Mortezaei is now accepting new patients and appointments can be booked online or by contacting our reception team.</p>
<p>Appointments can be booked online through HotDoc or by contacting our reception team on (07) 3217 3344. Reception can also help you choose the most appropriate appointment type.</p>
<a href="https://www.hotdoc.com.au/x">Book Appointment Online</a>
</body></html>`;
  const next = alignPhoneOnlyBookingProse(html, null);
  assert.match(next, /contact reception to arrange an appointment at Woolloongabba Medical Centre/);
  assert.doesNotMatch(next, /book an appointment online/i);
  assert.match(next, /accepting new patients\. To arrange an appointment, please contact our reception team/);
  assert.doesNotMatch(next, /patients and To arrange/i);
  assert.doesNotMatch(next, /booked online through HotDoc/i);
  assert.match(next, /href="tel:\+61732173344"[^>]*>Call Reception to Book</);
  assert.equal(alignPhoneOnlyBookingProse(html, "https://www.hotdoc.com.au/x"), html);
});

test("S1-R3: Golnar welcome chrome converts HotDoc Book to Call Reception", () => {
  assert.equal(isGolnarWelcomePath("updates/welcome-dr-golnar-mortezaei.html"), true);
  const html = `<html><body>
  <header><div class="header-cta"><a class="wmc-book-appointment header-cta" data-hotdoc-button="" data-hotdoc-widget="lightbox" href="https://www.hotdoc.com.au/clinic">Book Appointment</a></div></header>
  <a class="button wmc-book-appointment" data-hotdoc-button="" href="https://www.hotdoc.com.au/clinic">Book Appointment</a>
  <nav class="persistent-care-actions" aria-label="Care actions">
    <a class="persistent-care-book wmc-book-appointment" data-hotdoc-button="" href="https://www.hotdoc.com.au/clinic">Book Appointment</a>
    <button type="button" class="digital-reception-launcher">Digital Reception</button>
  </nav>
  </body></html>`;
  const next = alignPhoneOnlyPractitionerChrome(html, "updates/welcome-dr-golnar-mortezaei.html");
  assert.match(next, /header-cta[^>]*href="tel:\+61732173344"/);
  assert.match(next, /persistent-care-book[^>]*href="tel:\+61732173344"/);
  assert.doesNotMatch(next, /persistent-care-book[^>]*data-hotdoc-button/);
  assert.match(next, /digital-reception-launcher/);
  assert.match(next, /Call Reception to Book/);
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
  assert.doesNotMatch(next, /persistent-care-book[^>]*data-hotdoc-button/);
  const onlineHtml = html.replace('href="tel:+61732173344"', 'href="https://www.hotdoc.com.au/dr-x"');
  assert.equal(
    alignPhoneOnlyPractitionerChrome(onlineHtml, "doctors/dr-james.html"),
    onlineHtml,
  );
});
