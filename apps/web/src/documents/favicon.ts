/** Replace legacy favicon links in served public HTML; leave golden pages unchanged. */
const ICON_LINK = /<link\b(?=[^>]*\brel\s*=\s*(["'])(?:icon|shortcut\s+icon|apple-touch-icon(?:-precomposed)?)\1)[^>]*\/?>\s*/gi;

export const FAVICON_TAGS = [
  '<link rel="icon" href="/favicon.ico" sizes="any">',
  '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">',
  '<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">',
  '<link rel="apple-touch-icon" href="/apple-touch-icon.png">',
].join("\n");

export function applyFaviconLinks(html: string): string {
  if (!/<head\b[^>]*>/i.test(html)) return html;
  const withoutLegacyIcons = html.replace(ICON_LINK, "");
  return withoutLegacyIcons.replace(/<head\b[^>]*>\s*/i, head => `${head.trimEnd()}\n${FAVICON_TAGS}\n`);
}
