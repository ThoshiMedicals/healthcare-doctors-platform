/**
 * Phase 3C — Patient Practice Information Hub (Class B fixture `practice-information-hub.html`).
 * Trust Facts strip via ClinicBranding; section card routes align with WMC-TRUST-FACTS-REGISTER.
 */

import { DEFAULT_CLINIC_BRANDING, escapeHtmlAttr, type ClinicBranding } from "@/clinics/branding";
import {
  ensureDigitalReceptionOpenAriaLabels,
  ensureDigitalReceptionOpenDelegate,
} from "@/documents/patient-hub-digital-reception";
export const PATIENT_PRACTICE_INFO_HUB_PATH = "practice-information-hub.html" as const;

export type PatientPracticeInfoSection = {
  key: string;
  /** Display title — matches Phase 3C IA section labels only */
  label: string;
  href: string;
  description: string;
  secondaryHref?: string;
  secondaryNote?: string;
};

/** Nine hub sections → existing public routes only (no invented policies or fees). */
export const PATIENT_PRACTICE_INFO_SECTIONS: readonly PatientPracticeInfoSection[] = [
  {
    key: "contact",
    label: "Contact",
    href: "contact.html",
    description: "Phone, email, fax, and reception.",
  },
  {
    key: "opening-hours",
    label: "Opening Hours",
    href: "contact.html#hours",
    description: "Weekday and weekend opening times.",
  },
  {
    key: "directions",
    label: "Directions",
    href: "contact.html",
    description: "Maps, address, and how to find us.",
  },
  {
    key: "parking",
    label: "Parking",
    href: "access-parking.html",
    description: "Street and nearby parking guidance.",
  },
  {
    key: "accessibility",
    label: "Accessibility",
    href: "accessibility.html",
    description: "Access, facilities, and support options.",
  },
  {
    key: "billing-fees",
    label: "Billing & Fees",
    href: "fees-billing.html",
    description: "Medicare, fees, and when charges may apply.",
    secondaryHref: "bulk-billing.html",
    secondaryNote: "Bulk billing",
  },
  {
    key: "telehealth",
    label: "Telehealth",
    href: "telehealth.html",
    description: "Remote consultations and how they work.",
  },
  {
    key: "appointment-information",
    label: "Appointment Information",
    href: "book-appointment.html",
    description: "Book online and what to expect.",
    secondaryHref: "practice-policies.html",
    secondaryNote: "Practice policies",
  },
  {
    key: "after-hours-care",
    label: "After Hours Care",
    href: "after-hours-care.html",
    description: "When the clinic is closed and who to call.",
  },
] as const;

const PATIENT_PRACTICE_INFO_STYLE_ID = "wmc-patient-practice-info-hub";

const PATIENT_PRACTICE_INFO_STYLE = `<style id="${PATIENT_PRACTICE_INFO_STYLE_ID}">
.patient-practice-info-reception-row{display:flex;flex-wrap:wrap;gap:10px;margin-top:14px}
.patient-practice-info-reception-row .button{flex:1 1 140px;min-height:48px;text-align:center}
.patient-dashboard-practice-grid{display:grid;gap:12px}
@media(min-width:640px){.patient-dashboard-practice-grid{grid-template-columns:1fr 1fr}}
.patient-dashboard-practice-grid address{font-style:normal;margin:.35rem 0 0}
.patient-practice-info-sections .patient-hub-task-grid{display:grid;gap:12px}
@media(min-width:480px){.patient-practice-info-sections .patient-hub-task-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media(min-width:960px){.patient-practice-info-sections .patient-hub-task-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
</style>`;

function practiceTelHref(phoneTel: string): string {
  const tel = String(phoneTel || "").trim();
  if (!tel) return "tel:+61732173344";
  const normalized = tel.trim();
  if (/^tel:/i.test(normalized)) return normalized;
  if (normalized.startsWith("+")) return `tel:${normalized.replace(/\s/g, "")}`;
  const digits = normalized.replace(/\D/g, "");
  if (digits.startsWith("61")) return `tel:+${digits}`;
  if (digits.startsWith("0")) return `tel:+61${digits.slice(1)}`;
  return `tel:+61${digits}`;
}

function practiceInfoStripHtml(branding: ClinicBranding): string {
  const address = `${branding.streetAddress}, ${branding.suburb} ${branding.state} ${branding.postcode}`;
  const telHref = practiceTelHref(branding.phoneTel);
  return (
    `<section class="article-section patient-dashboard-practice" id="practice-info-strip" data-wmc-trust-facts-strip="mount" aria-label="Practice details">` +
    `<div class="patient-dashboard-practice-grid">` +
    `<div>` +
    `<p class="eyebrow">At a glance</p>` +
    `<p><strong>${escapeHtmlAttr(branding.practiceName)}</strong></p>` +
    `<address>${escapeHtmlAttr(address)}</address>` +
    `<p><a class="text-link" href="contact.html">Contact &amp; location →</a></p>` +
    `</div>` +
    `<div class="contact-hours-detail" aria-label="Opening hours summary">` +
    `<strong>Hours</strong>` +
    `<span><b>Mon–Thu</b> 7:00 AM–7:00 PM</span>` +
    `<span><b>Friday</b> 8:00 AM–5:00 PM</span>` +
    `<span><b>Saturday</b> 9:00 AM–5:00 PM</span>` +
    `<span><b>Sunday</b> 9:00 AM–3:00 PM</span>` +
    `</div>` +
    `<div>` +
    `<p><strong>Phone</strong><br/><a href="${escapeHtmlAttr(telHref)}">${escapeHtmlAttr(branding.phoneDisplay)}</a></p>` +
    `<p><strong>Email</strong><br/><a href="mailto:${escapeHtmlAttr(branding.email)}">${escapeHtmlAttr(branding.email)}</a></p>` +
    `<p><strong>After hours</strong><br/><a href="after-hours-care.html">Hello Home Doctor <strong>134 100</strong></a></p>` +
    `</div>` +
    `</div></section>`
  );
}

function sectionCardHtml(section: PatientPracticeInfoSection): string {
  let span = escapeHtmlAttr(section.description);
  if (section.secondaryHref && section.secondaryNote) {
    span += ` Includes ${escapeHtmlAttr(section.secondaryNote)}.`;
  }
  return (
    `<a href="${escapeHtmlAttr(section.href)}">` +
    `<strong>${escapeHtmlAttr(section.label)}</strong>` +
    `<span>${span}</span>` +
    `</a>`
  );
}

export function patientPracticeInfoSectionsGridHtml(): string {
  return PATIENT_PRACTICE_INFO_SECTIONS.map(sectionCardHtml).join("");
}

const STRIP_MOUNT =
  /<section\b[^>]*\bid="practice-info-strip"[^>]*>[\s\S]*?<\/section>/i;

/** SSR inject for `practice-information-hub.html` — idempotent. */
export function injectPatientPracticeInfoHub(
  html: string,
  pagePath: string,
  branding: ClinicBranding = DEFAULT_CLINIC_BRANDING,
): string {
  if (!/^practice-information-hub\.html$/i.test(pagePath)) return html;

  let next = html;

  next = next.replace(
    new RegExp(`<style\\b[^>]*id="${PATIENT_PRACTICE_INFO_STYLE_ID}"[\\s\\S]*?<\\/style>\\s*`, "i"),
    "",
  );
  next = next.replace(/<\/head>/i, `${PATIENT_PRACTICE_INFO_STYLE}</head>`);

  const strip = practiceInfoStripHtml(branding);
  next = STRIP_MOUNT.test(next)
    ? next.replace(STRIP_MOUNT, strip)
    : next.replace(/<\/article>/i, `${strip}</article>`);

  const gridInner = patientPracticeInfoSectionsGridHtml();
  if (/<div class="patient-hub-task-grid"[^>]*data-wmc-practice-info-sections="grid">/i.test(next)) {
    next = next.replace(
      /(<div class="patient-hub-task-grid"[^>]*data-wmc-practice-info-sections="grid"[^>]*>)[\s\S]*?(<\/div>)/i,
      `$1${gridInner}$2`,
    );
  }

  next = ensureDigitalReceptionOpenAriaLabels(next, pagePath);
  next = ensureDigitalReceptionOpenDelegate(next);
  return next;
}