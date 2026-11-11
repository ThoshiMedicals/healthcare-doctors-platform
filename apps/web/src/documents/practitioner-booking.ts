/**
 * Practitioner booking destination policy (presentation + CMS resolution).
 * CMS `bookingUrl` / published payload remains source of truth when it is a
 * practitioner-specific HotDoc URL. Golnar alone has an owner-authorised
 * fallback used when CMS is null, tel:, or clinic-level HotDoc.
 */

import { isPractitionerBookingUrl } from "@/cms/overlay";

function isTelHref(href: string | null | undefined): boolean {
  return typeof href === "string" && /^tel:/i.test(href.trim());
}

function isPhoneOnlyHref(href: string | null | undefined): boolean {
  if (href == null || href === "") return true;
  return isTelHref(href);
}

/** Owner-authorised practitioner HotDoc lightbox URL for Dr Golnar Mortezaei. */
export const GOLNAR_APPROVED_HOTDOC_URL =
  "https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/doctors/dr-golnar-mortezaei-5?wp=w_lightbox";

export const GOLNAR_SLUG = "dr-golnar-mortezaei";
export const GOLNAR_PROFILE_PATH = "doctors/dr-golnar-mortezaei.html";
export const GOLNAR_WELCOME_PATH = "updates/welcome-dr-golnar-mortezaei.html";

export type PractitionerBookingMode = "ONLINE_HOTDOC" | "PHONE_ONLY";

/** Five-practitioner booking matrix (owner-authorised policy). */
export const PRACTITIONER_BOOKING_MATRIX = [
  {
    slug: GOLNAR_SLUG,
    name: "Dr Golnar Mortezaei",
    mode: "ONLINE_HOTDOC" as const,
    profilePath: GOLNAR_PROFILE_PATH,
    approvedHotdocUrl: GOLNAR_APPROVED_HOTDOC_URL,
  },
  {
    slug: "dr-mary-abadir",
    name: "Dr Mary Abadir",
    mode: "PHONE_ONLY" as const,
    profilePath: "doctors/dr-mary-abadir.html",
    approvedHotdocUrl: null,
  },
  {
    slug: "dr-tanya-goodwill",
    name: "Dr Tanya Goodwill",
    mode: "ONLINE_HOTDOC" as const,
    profilePath: "doctors/dr-tanya-goodwill.html",
    /** Insurance slug preserved in golden/CMS — do not invent. */
    approvedHotdocUrl: null,
  },
  {
    slug: "dr-james",
    name: "Dr James Chanaka",
    mode: "ONLINE_HOTDOC" as const,
    profilePath: "doctors/dr-james.html",
    approvedHotdocUrl: null,
  },
  {
    slug: "dr-yamesha-ranatunga",
    name: "Dr Yamesha Ranatunga",
    mode: "ONLINE_HOTDOC" as const,
    profilePath: "doctors/dr-yamesha-ranatunga.html",
    approvedHotdocUrl: null,
  },
] as const;

export function isGolnarProfilePath(pagePath: string): boolean {
  return /^doctors\/dr-golnar-mortezaei\.html$/i.test(pagePath);
}

export function isGolnarWelcomePath(pagePath: string): boolean {
  return /^updates\/welcome-dr-golnar-mortezaei\.html$/i.test(pagePath);
}

export function isGolnarBookingSurfacePath(pagePath: string): boolean {
  return isGolnarProfilePath(pagePath) || isGolnarWelcomePath(pagePath);
}

/** Clinic list HotDoc (…/doctors?wp=…) — not a practitioner deep-link. */
export function isClinicLevelHotdocUrl(href: string | null | undefined): boolean {
  if (!href || isTelHref(href)) return false;
  try {
    const parsed = new URL(href.trim());
    if (parsed.hostname !== "www.hotdoc.com.au") return false;
    return /\/doctors\/?$/i.test(parsed.pathname);
  } catch {
    return false;
  }
}

/**
 * Prefer CMS practitioner HotDoc when present; otherwise Golnar approved fallback.
 * Non-Golnar slugs pass through CMS (including null → caller decides tel/default).
 */
export function resolvePractitionerBookingHref(
  slug: string,
  cmsBookingUrl: string | null | undefined,
): string | null {
  const cms = typeof cmsBookingUrl === "string" ? cmsBookingUrl.trim() : "";
  if (slug !== GOLNAR_SLUG) {
    return cms || null;
  }
  if (cms && isPractitionerBookingUrl(cms)) {
    return cms;
  }
  return GOLNAR_APPROVED_HOTDOC_URL;
}

function needsGolnarHotdocRewrite(href: string | null | undefined): boolean {
  if (!href || isPhoneOnlyHref(href)) return true;
  if (isClinicLevelHotdocUrl(href)) return true;
  if (/hotdoc\.com\.au/i.test(href) && !isPractitionerBookingUrl(href)) return true;
  // Keep other valid practitioner-specific HotDoc URLs from CMS.
  if (isPractitionerBookingUrl(href)) return false;
  return true;
}

function ensureHotdocWidgetAttrs(tag: string): string {
  let next = tag;
  if (!/\bdata-hotdoc-button=/i.test(next)) next = next.replace(/>$/, ' data-hotdoc-button="">');
  if (!/\bdata-hotdoc-widget=/i.test(next)) {
    next = next.replace(/\bdata-hotdoc-button="[^"]*"/i, '$& data-hotdoc-widget="lightbox"');
  }
  if (!/\btarget=/i.test(next)) next = next.replace(/>$/, ' target="_blank">');
  if (!/\brel=/i.test(next)) next = next.replace(/>$/, ' rel="noopener noreferrer">');
  return next;
}

function rewriteBookOpeningTag(tag: string, bookingHref: string): string {
  const href = tag.match(/\bhref="([^"]*)"/i)?.[1] ?? "";
  if (!needsGolnarHotdocRewrite(href)) {
    // Keep CMS practitioner HotDoc; only ensure lightbox widget chrome.
    return isPractitionerBookingUrl(href) ? ensureHotdocWidgetAttrs(tag) : tag;
  }

  let next = tag
    .replace(/\sdata-hotdoc-button="[^"]*"/gi, "")
    .replace(/\sdata-hotdoc-widget="[^"]*"/gi, "")
    .replace(/\starget="[^"]*"/gi, "")
    .replace(/\srel="[^"]*"/gi, "");
  if (/\bhref="/i.test(next)) {
    next = next.replace(/\bhref="[^"]*"/i, `href="${bookingHref}"`);
  } else {
    next = next.replace(/>$/, ` href="${bookingHref}">`);
  }
  next = ensureHotdocWidgetAttrs(next);
  if (/\baria-label="[^"]*Call Reception/i.test(next) || /\baria-label="[^"]*book with/i.test(next)) {
    next = next.replace(/\baria-label="[^"]*"/i, 'aria-label="Book Appointment"');
  }
  return next;
}

function rewriteBookLabel(open: string, label: string, close: string): string {
  const trimmed = label.replace(/\s+/g, " ").trim();
  if (
    !trimmed ||
    /^Call Reception to Book$/i.test(trimmed) ||
    /^Book Appointment Online$/i.test(trimmed) ||
    /^Book(?:&nbsp;|\s)+Appointment$/i.test(trimmed) ||
    /^Call reception to book$/i.test(trimmed)
  ) {
    return `${open}Book Appointment${close}`;
  }
  return `${open}${label}${close}`;
}

/**
 * Rewrite stale phone-only booking copy on Golnar surfaces after ONLINE HotDoc policy.
 * Presentation-only — does not mutate stored CMS revisions.
 */
export function alignGolnarOnlineBookingProse(
  html: string,
  pagePath: string,
  bookingHref: string = GOLNAR_APPROVED_HOTDOC_URL,
): string {
  if (!isGolnarBookingSurfacePath(pagePath)) return html;
  if (!bookingHref || isPhoneOnlyHref(bookingHref)) return html;

  let next = html;

  // Appointment section body (legacy CMS import copy).
  next = next.replace(
    /Please call our reception team on \(07\) 3217 3344 to book with Dr Golnar Mortezaei\.\s*Online booking is not yet linked for this practitioner\./gi,
    "Use the Book Appointment button to open Dr Golnar Mortezaei’s HotDoc booking page, or call reception on (07) 3217 3344 if you need help choosing an appointment type.",
  );
  next = next.replace(
    /Online booking is not yet linked for this practitioner\./gi,
    "Appointments can be booked online through HotDoc, or by contacting our reception team on (07) 3217 3344.",
  );

  // Visible FAQ answers and JSON-LD acceptedAnswer text.
  next = next.replace(
    /Appointments with Dr Golnar Mortezaei are booked by telephone\.\s*Please call reception on \(07\) 3217 3344\./gi,
    "Use the Book Appointment button to open Dr Golnar Mortezaei’s HotDoc booking page, or call reception on (07) 3217 3344.",
  );
  next = next.replace(
    /Appointments with Dr Golnar Mortezaei are booked by telephone\./gi,
    "Appointments with Dr Golnar Mortezaei can be booked online through HotDoc.",
  );

  return next;
}

/**
 * On Golnar profile / welcome surfaces, upgrade tel: or clinic-level HotDoc chrome
 * to the resolved practitioner HotDoc URL with standard lightbox widget attrs.
 * Presentation-only — does not mutate stored revisions.
 */
export function alignGolnarOnlineBookingChrome(
  html: string,
  pagePath: string,
  bookingHref: string = GOLNAR_APPROVED_HOTDOC_URL,
): string {
  if (!isGolnarBookingSurfacePath(pagePath)) return html;
  if (!bookingHref || isPhoneOnlyHref(bookingHref)) return html;

  let next = alignGolnarOnlineBookingProse(html, pagePath, bookingHref);

  // Primary profile / discovery / header / dock / resource booking anchors.
  next = next.replace(/<a\b[^>]*>/gi, (tag) => {
    const isBookControl =
      /\bwmc-book-appointment\b/i.test(tag) ||
      /\bpersistent-care-book\b/i.test(tag) ||
      /\bmobile-header-book\b/i.test(tag) ||
      (/\bresource-link\b/i.test(tag) &&
        (/\bhref="tel:/i.test(tag) || /hotdoc\.com\.au/i.test(tag) || /\bdata-hotdoc-/i.test(tag)));
    if (!isBookControl) return tag;
    // Leave plain Call Clinic / phone display links alone.
    if (/\bpersistent-care-call\b/i.test(tag) || /\bheader-phone\b/i.test(tag) || /\bmobile-header-call\b/i.test(tag)) {
      return tag;
    }
    return rewriteBookOpeningTag(tag, bookingHref);
  });

  next = next.replace(
    /(<a\b[^>]*(?:\bwmc-book-appointment\b|\bpersistent-care-book\b|\bmobile-header-book\b)[^>]*>)([\s\S]*?)(<\/a>)/gi,
    (_full, open: string, label: string, close: string) => rewriteBookLabel(open, label, close),
  );

  next = next.replace(
    /(<a\b[^>]*\bresource-link\b[^>]*(?:hotdoc\.com\.au|data-hotdoc-)[^>]*>\s*<span>)([\s\S]*?)(<\/span>)/gi,
    (_full, open: string, label: string, close: string) => {
      const trimmed = label.replace(/\s+/g, " ").trim();
      if (/^Call reception to book$/i.test(trimmed) || /^Book appointment$/i.test(trimmed)) {
        return `${open}Book appointment${close}`;
      }
      return `${open}${label}${close}`;
    },
  );

  // TOC / in-page #book wording when still phone-only.
  next = next.replace(
    /(<a\b[^>]*\bhref="#book"[^>]*>)\s*Call Reception to Book\s*(<\/a>)/gi,
    "$1Book Appointment$2",
  );

  return next;
}
