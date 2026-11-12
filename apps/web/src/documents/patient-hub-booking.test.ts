import assert from "node:assert/strict";
import test from "node:test";
import { INSURANCE_BULK_BILL_SLUG } from "./booking-restriction-notice";
import {
  GOLNAR_APPROVED_HOTDOC_URL,
  MARY_SLUG,
  PATIENT_HUB_CLINIC_HOTDOC_URL,
  PATIENT_HUB_CLINIC_TEL,
  preferredGpBookingHasInsuranceRestriction,
  resolvePatientHubGeneralBooking,
  resolvePatientHubPreferredGpBooking,
} from "./patient-hub-booking";

const hotdoc = (slug: string) =>
  `https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/doctors/${slug}?wp=w_lightbox`;

test("general patient hub booking uses clinic HotDoc lightbox", () => {
  const dest = resolvePatientHubGeneralBooking();
  assert.equal(dest.mode, "ONLINE");
  assert.equal(dest.href, PATIENT_HUB_CLINIC_HOTDOC_URL);
  assert.match(dest.href, /\/doctors\?wp=w_lightbox$/);
});

test("Mary preferred GP is always PHONE_ONLY — never HotDoc", () => {
  const dest = resolvePatientHubPreferredGpBooking(MARY_SLUG, hotdoc("dr-mary-should-not-be-used"));
  assert.equal(dest.mode, "PHONE_ONLY");
  assert.equal(dest.href, PATIENT_HUB_CLINIC_TEL);
  assert.doesNotMatch(dest.href, /hotdoc\.com\.au/i);
});

test("Golnar preferred GP is ONLINE with approved HotDoc when CMS is empty", () => {
  const dest = resolvePatientHubPreferredGpBooking("dr-golnar-mortezaei", null);
  assert.equal(dest.mode, "ONLINE");
  assert.equal(dest.href, GOLNAR_APPROVED_HOTDOC_URL);
});

test("Golnar keeps CMS practitioner HotDoc when present", () => {
  const cms = hotdoc("dr-golnar-mortezaei-5");
  const dest = resolvePatientHubPreferredGpBooking("dr-golnar-mortezaei", cms);
  assert.equal(dest.mode, "ONLINE");
  assert.equal(dest.href, cms);
});

test("insurance slug practitioners preserve restriction path", () => {
  const tanya = hotdoc(`dr-tanya-goodwill-${INSURANCE_BULK_BILL_SLUG}`);
  const dest = resolvePatientHubPreferredGpBooking("dr-tanya-goodwill", tanya);
  assert.equal(dest.mode, "ONLINE");
  assert.equal(dest.href, tanya);
  assert.ok(preferredGpBookingHasInsuranceRestriction(dest));
});

test("Usman male-patients slug passes through unchanged", () => {
  const usman = hotdoc("dr-usman-gul-strictly-seeing-male-patients-only");
  const dest = resolvePatientHubPreferredGpBooking("dr-usman-gul", usman);
  assert.equal(dest.mode, "ONLINE");
  assert.equal(dest.href, usman);
  assert.match(dest.href, /strictly-seeing-male-patients-only/);
  assert.equal(preferredGpBookingHasInsuranceRestriction(dest), false);
});
