/** Replace only legacy favicon links in served public HTML. Never modify stored golden pages. */
const ICON_LINK = /<link\b(?=[^>]*\brel\s*=\s*(["'])(?:icon|shortcut\s+icon|apple-touch-icon(?:-precomposed)?)\1)[^>]*\/?>\s*/gi;

export const FAVICON_TAGS = [
  '<link rel="icon" href="/favicon.ico?v=wmc-1" type="image/x-icon" sizes="any"/>',
  '<link rel="icon" href="/favicon-16x16.png?v=wmc-1" type="image/png" sizes="16x16"/>',
  '<link rel="icon" href="/favicon-32x32.png?v=wmc-1" type="image/png" sizes="32x32"/>',
  '<link rel="apple-touch-icon" href="/apple-touch-icon.png?v=wmc-1" sizes="180x180"/>',
].join("\n");

export function applyFaviconLinks(html: string): string {
  if (!/<head\b[^>]*>/i.test(html)) return html;
  const withoutLegacyIcons = html.replace(ICON_LINK, "");
  return withoutLegacyIcons.replace(/<head\b[^>]*>\s*/i, (head) => `${head.trimEnd()}\n${FAVICON_TAGS}\n`);
}
