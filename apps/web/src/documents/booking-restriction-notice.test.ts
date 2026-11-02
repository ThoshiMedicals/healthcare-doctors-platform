import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  ensureInsuranceBookingNoticesInHtml,
  hotdocPathHasInsuranceRestriction,
  insuranceBookingNoticeHtml,
  insuranceBookingNoticeText,
  practitionerDisplayNameFromInsuranceHotdocUrl,
} from "./booking-restriction-notice";
import { applyPublicUxRefinements } from "./public-ux";

const hotdoc = (slug: string) =>
  `https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/doctors/${slug}?wp=w_lightbox`;

const insuranceProfiles = [
  ["dr-tanya-goodwill.html", "Dr Tanya Goodwill", "dr-tanya-goodwill-does-not-bulk-bill-for-insurance-patients"],
  ["dr-sumita-singh.html", "Dr Sumita Singh", "dr-sumita-singh-does-not-bulk-bill-for-insurance-patients"],
  ["dr-anand-singh.html", "Dr Anand Singh", "dr-anand-singh-does-not-bulk-bill-for-insurance-patients"],
  ["dr-debra-larkins.html", "Dr Debra Larkins", "dr-debra-larkins-does-not-bulk-bill-for-insurance-patients"],
  ["dr-sambo-luon.html", "Dr Sambo Luon", "dr-sambo-luon-does-not-bulk-bill-for-insurance-patients"],
] as const;

test("detects insurance restriction only on matching HotDoc slugs", () => {
  assert.equal(hotdocPathHasInsuranceRestriction(hotdoc("dr-sumita-singh-does-not-bulk-bill-for-insurance-patients")), true);
  assert.equal(hotdocPathHasInsuranceRestriction(hotdoc("dr-usman-gul-strictly-seeing-male-patients-only")), false);
  assert.equal(hotdocPathHasInsuranceRestriction("tel:+61732173344"), false);
  assert.equal(hotdocPathHasInsuranceRestriction(hotdoc("dr-kooshyar-karimi-2")), false);
});

test("derives display names from insurance HotDoc slugs", () => {
  for (const [, name, slug] of insuranceProfiles) {
    assert.equal(practitionerDisplayNameFromInsuranceHotdocUrl(hotdoc(slug)), name);
  }
  assert.equal(practitionerDisplayNameFromInsuranceHotdocUrl(hotdoc("dr-usman-gul-strictly-seeing-male-patients-only")), null);
});

test("notice wording matches the approved booking note pattern", () => {
  assert.equal(
    insuranceBookingNoticeText("Dr Sumita Singh"),
    "Booking note: Dr Sumita Singh does not bulk bill for insurance patients.",
  );
  assert.equal(
    insuranceBookingNoticeHtml("Dr Anand Singh"),
    '<p class="practitioner-booking-notice"><strong>Booking note:</strong> Dr Anand Singh does not bulk bill for insurance patients.</p>',
  );
});

test("injects insurance notices on profiles that lack them and stays idempotent", () => {
  const actions =
    `<div class="doctor-profile-actions"><a class="button wmc-book-appointment" href="${hotdoc("dr-tanya-goodwill-does-not-bulk-bill-for-insurance-patients")}">Book Appointment</a></div>`;
  const once = ensureInsuranceBookingNoticesInHtml(`<main>${actions}</main>`);
  assert.match(once, /practitioner-booking-notice[\s\S]*Dr Tanya Goodwill does not bulk bill for insurance patients/);
  assert.equal(ensureInsuranceBookingNoticesInHtml(once), once);
});

test("does not invent insurance notices for Mary phone-only or Usman male-only paths", () => {
  const mary =
    '<div class="doctor-profile-actions"><a class="button wmc-book-appointment" href="tel:+61732173344">Call Reception to Book</a></div>';
  const usman =
    '<div class="doctor-profile-heading">' +
    '<p class="practitioner-booking-notice">Current booking restrictions apply. <a href="../patient-information.html">Read booking conditions</a> before booking.</p>' +
    `<div class="doctor-profile-actions"><a class="button wmc-book-appointment" href="${hotdoc("dr-usman-gul-strictly-seeing-male-patients-only")}">Book Appointment</a></div>` +
    "</div>";
  assert.equal(ensureInsuranceBookingNoticesInHtml(`<main>${mary}</main>`), `<main>${mary}</main>`);
  const usmanOut = ensureInsuranceBookingNoticesInHtml(`<main>${usman}</main>`);
  assert.equal(usmanOut, `<main>${usman}</main>`);
  assert.doesNotMatch(usmanOut, /does not bulk bill for insurance patients/);
});

test("preserves existing Mental Health and Skin Checks insurance notices", () => {
  const root = path.resolve(process.cwd(), "../../old-html");
  for (const page of ["services/mental-health.html", "services/skin-checks.html"]) {
    const source = readFileSync(path.join(root, page), "utf8");
    const ensured = ensureInsuranceBookingNoticesInHtml(source);
    const notices = ensured.match(/class="practitioner-booking-notice"/g) || [];
    assert.equal(notices.length, (source.match(/class="practitioner-booking-notice"/g) || []).length, page);
    assert.match(ensured, /does not bulk bill for insurance patients/, page);
  }
});

test("golden insurance profiles receive generated notices through public UX", () => {
  const root = path.resolve(process.cwd(), "../../old-html/doctors");
  for (const [file, name, slug] of insuranceProfiles) {
    const source = readFileSync(path.join(root, file), "utf8");
    assert.doesNotMatch(source, /class="practitioner-booking-notice"/, file);
    const result = applyPublicUxRefinements(source, `doctors/${file}`);
    assert.match(
      result,
      new RegExp(`practitioner-booking-notice[\\s\\S]*${name} does not bulk bill for insurance patients`),
      file,
    );
    assert.match(result, new RegExp(`/doctors/${slug}\\?wp=w_lightbox`), file);
    assert.equal(applyPublicUxRefinements(result, `doctors/${file}`), result, file);
  }
});

test("Mary and Usman golden profiles stay free of insurance notices", () => {
  const root = path.resolve(process.cwd(), "../../old-html/doctors");
  for (const file of ["dr-mary-abadir.html", "dr-usman-gul.html"]) {
    const result = applyPublicUxRefinements(readFileSync(path.join(root, file), "utf8"), `doctors/${file}`);
    assert.doesNotMatch(result, /does not bulk bill for insurance patients/, file);
  }
  const usman = applyPublicUxRefinements(
    readFileSync(path.join(root, "dr-usman-gul.html"), "utf8"),
    "doctors/dr-usman-gul.html",
  );
  assert.match(usman, /Current booking restrictions apply/);
  assert.match(usman, /strictly-seeing-male-patients-only/);
});
