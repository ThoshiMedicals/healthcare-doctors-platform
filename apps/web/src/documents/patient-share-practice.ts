/**
 * Phase 3D Agent 3 — practice-information share mounts (Trust Facts URLs only).
 */

import { DEFAULT_CLINIC_BRANDING } from "@/clinics/branding";
import {
  PATIENT_SHARE_CANONICAL_ORIGIN,
  ensurePatientShareRuntime,
  normalisePagePath,
  patientShareButtonHtml,
  resolveCanonicalShareUrl,
  resolveShareTitle,
  type PatientSharePayload,
} from "@/documents/patient-share-core";
import { PATIENT_PRACTICE_INFO_HUB_PATH } from "@/documents/patient-practice-info-hub";

/** Trust Facts–aligned public routes (existing URLs only). */
export const PATIENT_PRACTICE_SHARE_PATHS = new Set([
  PATIENT_PRACTICE_INFO_HUB_PATH,
  "contact.html",
  "access-parking.html",
  "accessibility.html",
  "telehealth.html",
  "after-hours-care.html",
  "fees-billing.html",
  "bulk-billing.html",
  "book-appointment.html",
]);

const PRACTICE_SHARE_ROOT = "practice";
const PRACTICE_SHARE_MOUNTED_RE = new RegExp(
  `data-wmc-share-root=["']${PRACTICE_SHARE_ROOT}["']`,
  "i",
);

const PHONE_SECONDARY_PATHS = new Set([
  PATIENT_PRACTICE_INFO_HUB_PATH,
  "contact.html",
]);

const CONTACT_CANONICAL_URL = `${PATIENT_SHARE_CANONICAL_ORIGIN}/contact.html`;

function shareButtonMarkup(payload: PatientSharePayload): string {
  const full = patientShareButtonHtml({ ...payload, surface: PRACTICE_SHARE_ROOT });
  const inner = full.match(/<button[\s\S]*?<\/button>/i);
  return inner ? inner[0] : full;
}

function practiceShareToolbarHtml(
  primary: PatientSharePayload,
  secondary?: PatientSharePayload,
): string {
  const parts = [shareButtonMarkup(primary)];
  if (secondary) parts.push(shareButtonMarkup(secondary));
  return (
    `<div class="wmc-patient-share--toolbar">` +
    `<span class="wmc-patient-share" data-wmc-share-root="${PRACTICE_SHARE_ROOT}">` +
    parts.join("") +
    `</span></div>`
  );
}

function resolvePracticeShareText(pagePath: string, html: string): string | undefined {
  const path = normalisePagePath(pagePath);
  if (path === "fees-billing.html") {
    return undefined;
  }
  const og =
    html.match(
      /<meta\b[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["'][^>]*>/i,
    ) ||
    html.match(
      /<meta\b[^>]*content=["']([^"']+)["'][^>]*property=["']og:description["'][^>]*>/i,
    );
  const desc = og?.[1]?.trim();
  if (!desc || /\$\d/.test(desc)) return undefined;
  return desc;
}

function injectToolbarAfterHeroH1(html: string, toolbar: string): string {
  const heroBlock = html.match(
    /<section\b[^>]*\bpage-hero\b[^>]*>[\s\S]*?<h1\b[^>]*>[\s\S]*?<\/h1>/i,
  );
  if (heroBlock?.[0]) {
    return html.replace(heroBlock[0], `${heroBlock[0]}${toolbar}`);
  }
  const mainH1 = html.match(/<main\b[^>]*>[\s\S]*?<h1\b[^>]*>[\s\S]*?<\/h1>/i);
  if (mainH1?.[0]) {
    return html.replace(mainH1[0], `${mainH1[0]}${toolbar}`);
  }
  const anyH1 = html.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/i);
  if (anyH1?.[0]) {
    return html.replace(anyH1[0], `${anyH1[0]}${toolbar}`);
  }
  return html;
}

function phoneSecondaryPayload(html: string): PatientSharePayload {
  return {
    url: CONTACT_CANONICAL_URL,
    title: resolveShareTitle(html, `${DEFAULT_CLINIC_BRANDING.practiceName} — Contact`),
    text: DEFAULT_CLINIC_BRANDING.phoneDisplay,
    surface: PRACTICE_SHARE_ROOT,
    label: "Share phone",
  };
}

export function injectPatientSharePractice(html: string, pagePath: string): string {
  const path = normalisePagePath(pagePath);
  if (!PATIENT_PRACTICE_SHARE_PATHS.has(path)) {
    return html;
  }
  if (PRACTICE_SHARE_MOUNTED_RE.test(html)) {
    return ensurePatientShareRuntime(html);
  }

  const url = resolveCanonicalShareUrl(html, path);
  const title = resolveShareTitle(html, DEFAULT_CLINIC_BRANDING.practiceName);
  const text = resolvePracticeShareText(path, html);

  const primary: PatientSharePayload = {
    url,
    title,
    text,
    surface: PRACTICE_SHARE_ROOT,
    label: "Share this page",
  };

  const secondary = PHONE_SECONDARY_PATHS.has(path)
    ? phoneSecondaryPayload(html)
    : undefined;

  const toolbar = practiceShareToolbarHtml(primary, secondary);
  let next = injectToolbarAfterHeroH1(html, toolbar);
  if (next === html) {
    const strip = html.match(/<section\b[^>]*\bid=["']practice-info-strip["'][^>]*>/i);
    if (strip?.[0]) {
      next = html.replace(strip[0], `${strip[0]}${toolbar}`);
    }
  }

  if (next === html) {
    return ensurePatientShareRuntime(html);
  }

  return ensurePatientShareRuntime(next);
}
