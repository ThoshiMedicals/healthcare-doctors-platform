/**
 * Attraction journey pages were published with `#related-pages` nested inside
 * `.breadcrumb-bar` while `.page-layout` kept only the article. Golden CSS still
 * reserves a 280px sidebar column, so the article collapses to sidebar width.
 *
 * Re-home the journey aside into `.page-layout` (first child) without removing
 * any navigation links or page copy.
 */
export function repairAttractionJourneyLayout(html: string): string {
  if (!/\bpage-layout\b/i.test(html)) return html;

  const asideRe =
    /<aside\b(?=[^>]*(?:id=["']related-pages["']|data-ev-journey-nav=["']true["']))[^>]*>[\s\S]*?<\/aside>/i;
  const asideMatch = html.match(asideRe);
  if (!asideMatch) return html;

  const aside = asideMatch[0];
  const layoutOpenRe = /<div\b([^>]*\bclass=["'][^"']*\bpage-layout\b[^"']*["'][^>]*)>/i;
  const layoutOpen = html.match(layoutOpenRe);
  if (!layoutOpen) return html;

  const afterLayout = html.slice((layoutOpen.index ?? 0) + layoutOpen[0].length, (layoutOpen.index ?? 0) + layoutOpen[0].length + 280);
  if (/^\s*<aside\b(?=[^>]*(?:id=["']related-pages["']|data-ev-journey-nav=["']true["']))/i.test(afterLayout)) {
    return html;
  }

  let next = html.replace(asideRe, "");
  next = next.replace(layoutOpenRe, (open) => `${open}${aside}`);
  return next;
}
