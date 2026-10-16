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
  if (pagePath !== "404.html") return next;
  return next.replace(/<footer\b[\s\S]*<\/footer>/i, (footer) => footer.replace(/<h3>/g, '<h3 aria-level="2">'));
}
