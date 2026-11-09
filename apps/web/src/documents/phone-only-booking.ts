/**
 * Phone-only practitioner booking presentation helpers.
 * Derives CTAs from existing tel:/HotDoc hrefs — no new booking-mode schema.
 */

const ONLINE_BOOKING_PHRASES: Array<{ re: RegExp; phoneOnly: string }> = [
  {
    re: /Appointments can be booked online through HotDoc or by contacting our reception team on \(07\) 3217 3344\.?\s*Reception can also help you choose the most appropriate appointment type\.?/gi,
    phoneOnly:
      "To arrange an appointment, please contact our reception team on (07) 3217 3344. Reception can help you choose the most appropriate appointment type.",
  },
  {
    re: /Appointments can be booked online through HotDoc or by contacting our reception team[^.]*\./gi,
    phoneOnly: "To arrange an appointment, please contact our reception team on (07) 3217 3344.",
  },
  {
    re: /appointments can be booked online or by contacting our reception team/gi,
    phoneOnly: "To arrange an appointment, please contact our reception team",
  },
  {
    re: /booked online through HotDoc or by contacting our reception team/gi,
    phoneOnly: "arranged by contacting our reception team",
  },
  {
    re: /booked online or by contacting our reception team/gi,
    phoneOnly: "arranged by contacting our reception team",
  },
];

export function isTelBookingHref(href: string | null | undefined): boolean {
  return typeof href === "string" && /^tel:/i.test(href.trim());
}

/** null or tel: booking destinations are phone-only; HotDoc URLs are online. */
export function isPhoneOnlyBookingHref(href: string | null | undefined): boolean {
  if (href == null || href === "") return true;
  return isTelBookingHref(href);
}

/** True when the primary practitioner profile CTA is a telephone booking link. */
export function htmlIndicatesPhoneOnlyPractitioner(html: string): boolean {
  if (!/<div\b[^>]*\bdoctor-profile-actions\b/i.test(html)) return false;
  const block = html.match(/<div\b[^>]*\bdoctor-profile-actions\b[^>]*>[\s\S]*?<\/div>/i)?.[0] || "";
  const primary = block.match(
    /<a\b[^>]*\bwmc-book-appointment\b[^>]*\bhref="([^"]+)"[^>]*>/i,
  );
  if (!primary) return false;
  return isTelBookingHref(primary[1]);
}

/**
 * Rewrite welcome/update prose that incorrectly advertises online booking
 * when the practitioner booking destination is phone-only.
 * Presentation-layer only — does not mutate stored page revisions.
 */
export function alignPhoneOnlyBookingProse(html: string, bookingHref: string | null | undefined): string {
  if (!isPhoneOnlyBookingHref(bookingHref)) return html;
  let next = html;
  for (const rule of ONLINE_BOOKING_PHRASES) {
    next = next.replace(rule.re, rule.phoneOnly);
  }
  // Meta descriptions that still advertise online booking for phone-only doctors.
  next = next.replace(
    /(<meta\b[^>]*\bname=["']description["'][^>]*\bcontent=["'])([^"']*)(["'][^>]*>)/gi,
    (full, open: string, content: string, close: string) => {
      if (!/book(?:ing)?(?:\s+an)?\s+appointment online|book online/i.test(content)) return full;
      const rewritten = content
        .replace(/and book an appointment online with/gi, "and contact reception to arrange an appointment at")
        .replace(/book an appointment online with/gi, "contact reception to arrange an appointment at")
        .replace(/book(?:ing)? online/gi, "contacting reception");
      return `${open}${rewritten}${close}`;
    },
  );
  // Convert leftover HotDoc "Book Appointment Online" CTAs on welcome pages to tel.
  next = next.replace(
    /<a\b([^>]*?\bhref="https?:\/\/(?:www\.)?hotdoc\.com\.au[^"]*"[^>]*)>\s*Book Appointment Online\s*<\/a>/gi,
    (_full, attrs: string) => {
      const nextAttrs = attrs
        .replace(/\sdata-hotdoc-button="[^"]*"/gi, "")
        .replace(/\sdata-hotdoc-widget="[^"]*"/gi, "")
        .replace(/\bhref="[^"]*"/i, 'href="tel:+61732173344"')
        .replace(/\srel="noopener"/gi, "");
      return `<a${nextAttrs}>Call Reception to Book</a>`;
    },
  );
  return next;
}

function convertHotDocBookAnchor(tag: string): string {
  if (!/\bhref="/i.test(tag)) return tag;
  if (/\bhref="tel:/i.test(tag)) return tag;
  if (!/hotdoc\.com\.au|data-hotdoc-button/i.test(tag)) return tag;

  let next = tag
    .replace(/\sdata-hotdoc-button="[^"]*"/gi, "")
    .replace(/\sdata-hotdoc-widget="[^"]*"/gi, "")
    .replace(/\bhref="[^"]*"/i, 'href="tel:+61732173344"');

  if (/\baria-label="[^"]*Book/i.test(next)) {
    next = next.replace(/\baria-label="[^"]*"/i, 'aria-label="Call Reception to Book"');
  } else if (!/\baria-label="/i.test(next)) {
    next = next.replace(/>$/, ' aria-label="Call Reception to Book">');
  }
  return next;
}

/**
 * On phone-only doctor profiles, keep page chrome from implying HotDoc availability
 * for that practitioner. Preserves Digital Reception and clinic Call controls.
 */
export function alignPhoneOnlyPractitionerChrome(html: string, pagePath: string): string {
  if (!/^doctors\/.+\.html$/i.test(pagePath)) return html;
  if (!htmlIndicatesPhoneOnlyPractitioner(html)) return html;

  let next = html;

  // On-this-page TOC often still says "Book Appointment" for #book.
  next = next.replace(
    /(<a\b[^>]*\bhref="#book"[^>]*>)\s*Book Appointment\s*(<\/a>)/gi,
    "$1Call Reception to Book$2",
  );

  // Header + mobile chrome Book Appointment HotDoc → Call Reception.
  next = next.replace(
    /<a\b[^>]*(?:\bheader-cta\b|\bmobile-header-book\b)[^>]*>/gi,
    (tag) => convertHotDocBookAnchor(tag),
  );

  next = next.replace(
    /(<a\b[^>]*href="tel:\+61732173344"[^>]*(?:\bheader-cta\b|\bmobile-header-book\b|\bwmc-book-appointment\b)[^>]*>)\s*Book(?:&nbsp;|\s)+Appointment\s*(<\/a>)/gi,
    "$1Call Reception to Book$2",
  );
  next = next.replace(
    /(<a\b[^>]*(?:\bheader-cta\b|\bmobile-header-book\b)[^>]*href="tel:\+61732173344"[^>]*>)\s*Book(?:&nbsp;|\s)+Appointment\s*(<\/a>)/gi,
    "$1Call Reception to Book$2",
  );

  // Sticky dock Book action: force tel + Call Reception label; strip HotDoc attrs.
  next = next.replace(
    /(<nav\b[^>]*\bpersistent-care-actions\b(?![^>]*recruitment)[^>]*>[\s\S]*?<a\b)([^>]*\bpersistent-care-book\b[^>]*)(>)([\s\S]*?)(<\/a>)/i,
    (_full, open: string, attrs: string, gt: string, label: string, close: string) => {
      let nextAttrs = attrs
        .replace(/\sdata-hotdoc-button="[^"]*"/gi, "")
        .replace(/\sdata-hotdoc-widget="[^"]*"/gi, "");
      if (!/\bhref="tel:/i.test(nextAttrs)) {
        if (/\bhref="/i.test(nextAttrs)) {
          nextAttrs = nextAttrs.replace(/\bhref="[^"]*"/i, 'href="tel:+61732173344"');
        } else {
          nextAttrs += ' href="tel:+61732173344"';
        }
      }
      const nextLabel = /Book\s+Appointment/i.test(label) ? "Call Reception to Book" : label;
      return `${open}${nextAttrs}${gt}${nextLabel}${close}`;
    },
  );

  return next;
}
