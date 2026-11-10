/**
 * Accessibility corrections applied when a page is served.
 * The stored golden revision is left unchanged, so layout, navigation, and visible text stay as approved.
 * The footer contact label needs a group role before the existing name is announced.
 * The 404 page has a level-1 heading and then footer level-3 headings, so those footer headings are announced as level 2.
 */

function doctorNameFromHref(href: string): string {
  const file = href.split("/").pop()?.replace(/\.html$/i, "") || "";
  const parts = file.split("-").filter(Boolean);
  if (!parts.length) return "";
  return parts
    .map((part, index) => {
      if (index === 0 && /^(dr|mr)$/i.test(part)) {
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      }
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join(" ");
}

function withAriaLabel(attrs: string, label: string): string {
  const safe = label.replace(/"/g, "&quot;");
  if (/\baria-label="/i.test(attrs)) {
    return attrs.replace(/\baria-label="[^"]*"/i, `aria-label="${safe}"`);
  }
  if (/\s>$/.test(attrs) || attrs.endsWith(" ")) return `${attrs}aria-label="${safe}"`;
  return `${attrs} aria-label="${safe}"`;
}

/** Map each GP discovery card inner HTML without truncating on nested <li>. */
function mapGpDiscoveryCards(html: string, mapInner: (inner: string) => string): string {
  const lower = html.toLowerCase();
  let result = "";
  let cursor = 0;
  let searchFrom = 0;

  while (searchFrom < html.length) {
    const classHit = lower.indexOf("gp-discovery-card", searchFrom);
    if (classHit < 0) break;
    const openStart = html.lastIndexOf("<li", classHit);
    if (openStart < 0 || openStart < cursor) {
      searchFrom = classHit + 16;
      continue;
    }
    const openEnd = html.indexOf(">", openStart);
    if (openEnd < 0) break;

    let depth = 1;
    let pos = openEnd + 1;
    let closeAt = -1;
    while (pos < html.length && depth > 0) {
      const nextOpen = lower.indexOf("<li", pos);
      const nextClose = lower.indexOf("</li>", pos);
      if (nextClose < 0) break;
      if (nextOpen >= 0 && nextOpen < nextClose) {
        depth += 1;
        pos = nextOpen + 3;
        continue;
      }
      depth -= 1;
      if (depth === 0) {
        closeAt = nextClose;
        break;
      }
      pos = nextClose + 5;
    }
    if (closeAt < 0) {
      searchFrom = classHit + 16;
      continue;
    }

    const open = html.slice(openStart, openEnd + 1);
    const inner = html.slice(openEnd + 1, closeAt);
    result += html.slice(cursor, openStart) + open + mapInner(inner) + "</li>";
    cursor = closeAt + 5;
    searchFrom = cursor;
  }

  return result + html.slice(cursor);
}

function enhanceGpDiscoveryCard(inner: string): string {
  const doctor =
    inner
      .match(/<h3\b[^>]*\bgp-discovery-name\b[^>]*>([\s\S]*?)<\/h3>/i)?.[1]
      ?.replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim() || "";
  if (!doctor) return inner;
  const safeDoctor = doctor.replace(/"/g, "&quot;");

  let card = inner.replace(
    /<a\b([^>]*href="((?:\.\.\/)*doctors\/[^"]+)"[^>]*)>(\s*practitioner profile\s*)<\/a>/gi,
    (full, attrs: string, _href: string, text: string) =>
      `<a${withAriaLabel(attrs, `View ${safeDoctor} practitioner profile`)}>${text}</a>`,
  );

  card = card.replace(
    /(<a\b[^>]*\bgp-discovery-profile\b[^>]*\baria-label=")View profile for ([^"]+)(")/gi,
    `$1View $2 practitioner profile$3`,
  );

  card = card.replace(/<a\b([^>]*\bgp-discovery-book\b[^>]*)>/gi, (full, attrs: string) => {
    if (!/\baria-label="Book Appointment"/i.test(attrs)) return full;
    return `<a${withAriaLabel(attrs, `Book an appointment with ${safeDoctor}`)}>`;
  });

  return card;
}

export function applyAccessibilityClosure(html: string, pagePath: string): string {
  const next = html.replace(
    /<div class="footer-contact" aria-label="Practice contact and location">/g,
    '<div class="footer-contact" role="group" aria-label="Practice contact and location">',
  );

  // Also catch bare "practitioner profile" links outside imperfect card parses.
  const notesNamed = mapGpDiscoveryCards(next, enhanceGpDiscoveryCard).replace(
    /<a\b([^>]*href="((?:\.\.\/)*doctors\/[^"]+)"[^>]*)>(\s*practitioner profile\s*)<\/a>/gi,
    (full, attrs: string, href: string, text: string) => {
      if (/\baria-label="/i.test(attrs)) return full;
      const doctor = doctorNameFromHref(href);
      if (!doctor) return full;
      return `<a${withAriaLabel(attrs, `View ${doctor} practitioner profile`)}>${text}</a>`;
    },
  );

  const namesCorrected = notesNamed
    .replace(/<a\b[^>]*>/gi, (tag) => {
      if (tag.includes('class="persistent-care-call"')) {
        return tag.replace(
          'aria-label="Call Woolloongabba Medical Centre on (07) 3217 3344"',
          'aria-label="Call Clinic — Woolloongabba Medical Centre on (07) 3217 3344"',
        );
      }
      if (tag.includes('class="button button-call-polished"')) {
        return tag.replace(
          'aria-label="Call Woolloongabba Medical Centre"',
          'aria-label="Call Clinic — Woolloongabba Medical Centre"',
        );
      }
      if (tag.includes('class="hero-trust-refined-item hero-trust-refined-link"')) {
        return tag.replace(
          'aria-label="View opening hours, open seven days"',
          'aria-label="Open 7 days — view opening hours"',
        );
      }
      if (tag.includes("team-practitioner-profile-link")) {
        return tag.replace(
          /aria-label="View (Dr [^"]+) profile"/,
          (_m, doctor: string) => `aria-label="View profile — ${doctor}"`,
        );
      }
      return tag;
    })
    .replace(
      'alt="Book your favourite doctor any time in the HotDoc app. Woolloongabba Medical Centre, (07) 3217 3344. App Store and Google Play badges."',
      'alt="Book appointments with Woolloongabba Medical Centre using HotDoc"',
    );

  // Hero trust logos: same marks elsewhere use informative alt; empty alt was flagged as Missing Alt Text.
  const heroTrustAlts = namesCorrected
    .replace(
      /(<span class="hero-trust-logo hero-trust-logo-agpal">\s*<img )alt=""/,
      '$1alt="Accredited General Practice"',
    )
    .replace(
      /(<span class="hero-trust-logo hero-trust-logo-bulk"><img )alt=""/,
      '$1alt="Medicare Bulk Billing Practice"',
    );

  // A11Y-001: image-only links without aria-label inherit an accessible name from the image alt.
  const namedImageLinks = heroTrustAlts.replace(
    /<a\b([^>]*)>([\s\S]*?)<\/a>/gi,
    (full, attrs: string, inner: string) => {
      if (/\baria-label="/i.test(attrs) || /\baria-labelledby="/i.test(attrs)) return full;
      const text = inner.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      if (text) return full;
      const alt = inner.match(/<img\b[^>]*\balt="([^"]+)"/i)?.[1]?.trim();
      if (!alt) return full;
      const safe = alt.replace(/"/g, "&quot;");
      if (/\s>$/.test(attrs) || attrs.endsWith(" ")) {
        return `<a${attrs}aria-label="${safe}">${inner}</a>`;
      }
      return `<a${attrs} aria-label="${safe}">${inner}</a>`;
    },
  );

  if (pagePath !== "404.html") return namedImageLinks;
  return namedImageLinks.replace(/<footer\b[\s\S]*<\/footer>/i, (footer) =>
    footer.replace(/<h3>/g, '<h3 aria-level="2">'),
  );
}
