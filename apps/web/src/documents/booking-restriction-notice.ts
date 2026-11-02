/**
 * Data-driven insurance booking notices derived from HotDoc practitioner URLs.
 * Source of truth: slug segment `does-not-bulk-bill-for-insurance-patients`.
 * Does not invent notices for phone-only or other HotDoc restriction slugs.
 */

export const INSURANCE_BULK_BILL_SLUG = "does-not-bulk-bill-for-insurance-patients";

const HOTDOC_HOST = "www.hotdoc.com.au";

export function hotdocPathHasInsuranceRestriction(href: string): boolean {
  if (!href || href.startsWith("tel:")) return false;
  try {
    const url = new URL(href, `https://${HOTDOC_HOST}`);
    if (url.hostname !== HOTDOC_HOST) return false;
    return url.pathname.includes(INSURANCE_BULK_BILL_SLUG);
  } catch {
    return href.includes(INSURANCE_BULK_BILL_SLUG);
  }
}

/** `…/doctors/dr-tanya-goodwill-does-not-bulk-bill-for-insurance-patients` → `Dr Tanya Goodwill` */
export function practitionerDisplayNameFromInsuranceHotdocUrl(href: string): string | null {
  if (!hotdocPathHasInsuranceRestriction(href)) return null;
  let pathname = href;
  try {
    pathname = new URL(href, `https://${HOTDOC_HOST}`).pathname;
  } catch {
    /* keep href */
  }
  const match = pathname.match(/\/doctors\/([^/?#]+)/i);
  if (!match) return null;
  const stem = match[1].replace(new RegExp(`-?${INSURANCE_BULK_BILL_SLUG}$`, "i"), "");
  if (!stem) return null;
  const parts = stem.split("-").filter(Boolean);
  if (!parts.length) return null;
  return parts
    .map((part, index) => {
      const lower = part.toLowerCase();
      if (index === 0 && lower === "dr") return "Dr";
      if (index === 0 && lower === "mr") return "Mr";
      if (index === 0 && lower === "ms") return "Ms";
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

export function insuranceBookingNoticeText(name: string): string {
  return `Booking note: ${name} does not bulk bill for insurance patients.`;
}

export function insuranceBookingNoticeHtml(name: string): string {
  return `<p class="practitioner-booking-notice"><strong>Booking note:</strong> ${name} does not bulk bill for insurance patients.</p>`;
}

function firstInsuranceHref(chunk: string): string | null {
  const matches = chunk.matchAll(/\bhref="(https:\/\/www\.hotdoc\.com\.au[^"]+)"/gi);
  for (const match of matches) {
    if (hotdocPathHasInsuranceRestriction(match[1])) return match[1];
  }
  return null;
}

/**
 * Injects insurance booking notices beside profile / published-lead booking CTAs
 * when the HotDoc destination encodes the insurance restriction and no notice exists yet.
 * Leaves Mary (tel) and Usman (other slug + existing notice) unchanged.
 */
export function ensureInsuranceBookingNoticesInHtml(html: string): string {
  let next = html;

  next = next.replace(/<div class="doctor-profile-actions">[\s\S]*?<\/div>/gi, (actions, offset, full) => {
    // Avoid lookahead backtracking past an existing notice into a later </div>.
    if (/^\s*<p class="practitioner-booking-notice\b/i.test(full.slice(offset + actions.length))) return actions;
    const href = firstInsuranceHref(actions);
    if (!href) return actions;
    const name = practitionerDisplayNameFromInsuranceHotdocUrl(href);
    if (!name) return actions;
    return `${actions}${insuranceBookingNoticeHtml(name)}`;
  });

  next = next.replace(
    /(<div class="service-lead-booking">)([\s\S]*?)(<\/div>\s*<div class="service-clinic-booking")/gi,
    (full, open, inner, close) => {
      if (/class="practitioner-booking-notice\b/i.test(inner)) return full;
      const href = firstInsuranceHref(inner);
      if (!href) return full;
      const name = practitionerDisplayNameFromInsuranceHotdocUrl(href);
      if (!name) return full;
      return `${open}${inner}${insuranceBookingNoticeHtml(name)}${close}`;
    },
  );

  return next;
}
