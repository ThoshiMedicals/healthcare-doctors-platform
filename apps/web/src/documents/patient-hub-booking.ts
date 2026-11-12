/**
 * Patient hub / dashboard booking link resolution.
 * Maps preferred practitioner slug → { mode, href } using approved phone-only,
 * insurance-slug pass-through, Golnar fallback, and clinic HotDoc defaults.
 */

import { DEFAULT_CLINIC_BRANDING } from "@/clinics/branding";
import { hotdocPathHasInsuranceRestriction } from "@/documents/booking-restriction-notice";
import { isPhoneOnlyBookingHref } from "@/documents/phone-only-booking";
import {
  GOLNAR_APPROVED_HOTDOC_URL,
  MARY_SLUG,
  practitionerBookingModeForSlug,
  resolvePractitionerBookingHref,
} from "@/documents/practitioner-booking";

/** TF-PHONE-02 — patient reception `tel:` */
export const PATIENT_HUB_CLINIC_TEL = "tel:+61732173344";

/** TF-HOTDOC-01 — clinic-level HotDoc lightbox (general booking). */
export const PATIENT_HUB_CLINIC_HOTDOC_URL = DEFAULT_CLINIC_BRANDING.hotdocUrl;

export type PatientHubBookingMode = "ONLINE" | "PHONE_ONLY";

export type PatientHubBookingDestination = {
  mode: PatientHubBookingMode;
  href: string;
};

function destinationFromHref(href: string): PatientHubBookingDestination {
  if (isPhoneOnlyBookingHref(href)) {
    return { mode: "PHONE_ONLY", href };
  }
  return { mode: "ONLINE", href };
}

/** Dashboard “Book Appointment” with no preferred GP — clinic HotDoc list. */
export function resolvePatientHubGeneralBooking(): PatientHubBookingDestination {
  return { mode: "ONLINE", href: PATIENT_HUB_CLINIC_HOTDOC_URL };
}

/**
 * Preferred GP book CTA — respects Mary phone-only, Golnar approved HotDoc,
 * and preserves CMS HotDoc slugs (insurance / Usman male-patients) unchanged.
 */
export function resolvePatientHubPreferredGpBooking(
  practitionerSlug: string,
  cmsBookingUrl?: string | null,
): PatientHubBookingDestination {
  const slug = practitionerSlug.trim().toLowerCase();
  const policyMode = practitionerBookingModeForSlug(slug);

  if (policyMode === "PHONE_ONLY" || slug === MARY_SLUG) {
    return { mode: "PHONE_ONLY", href: PATIENT_HUB_CLINIC_TEL };
  }

  const resolved = resolvePractitionerBookingHref(slug, cmsBookingUrl);
  if (resolved) {
    return destinationFromHref(resolved);
  }

  return { mode: "PHONE_ONLY", href: PATIENT_HUB_CLINIC_TEL };
}

/** True when the resolved href encodes the insurance bulk-bill restriction slug. */
export function preferredGpBookingHasInsuranceRestriction(
  destination: PatientHubBookingDestination,
): boolean {
  return destination.mode === "ONLINE" && hotdocPathHasInsuranceRestriction(destination.href);
}

export {
  GOLNAR_APPROVED_HOTDOC_URL,
  MARY_SLUG,
  resolvePractitionerBookingHref,
};
