/**
 * Accessibility corrections applied when a page is served.
 * The stored golden revision is left unchanged, so layout, navigation, and visible text stay as approved.
 * The footer contact label needs a group role before the existing name is announced.
 * The 404 page has a level-1 heading and then footer level-3 headings, so those footer headings are announced as level 2.
 */
export function applyAccessibilityClosure(html: string, pagePath: string): string {
  const next = html.replace(
    /<div class="footer-contact" aria-label="Practice contact and location">/g,
    '<div class="footer-contact" role="group" aria-label="Practice contact and location">',
  );
  const namesCorrected = next.replace(/<a\b[^>]*>/gi, tag => {
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
        (_, doctor: string) => `aria-label="View profile — ${doctor}"`,
      );
    }
    return tag;
  });
  if (pagePath !== "404.html") return namesCorrected;
  return namesCorrected.replace(/<footer\b[\s\S]*<\/footer>/i, (footer) => footer.replace(/<h3>/g, '<h3 aria-level="2">'));
}
