/** Text-node helpers. Replacements escape markup so a content value cannot change page structure. */

export function decodeText(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

export function escapeText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function replaceTaggedText(html: string, pattern: RegExp, nextText: string): string {
  return html.replace(pattern, (_match, open: string, current: string, close: string) => {
    if (decodeText(current) === nextText) return `${open}${current}${close}`;
    return `${open}${escapeText(nextText)}${close}`;
  });
}

export function listItemTexts(innerHtml: string): string[] {
  return [...innerHtml.matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi)].map((match) =>
    decodeText(match[1].replace(/<[^>]+>/g, "")),
  );
}

/** Replaces visible list labels and keeps every existing element. */
export function replaceListLabels(innerHtml: string, labels: readonly string[]): string | null {
  const current = listItemTexts(innerHtml);
  if (current.length !== labels.length) return null;
  let index = 0;
  return innerHtml.replace(/<li\b[^>]*>[\s\S]*?<\/li>/gi, (item) => {
    const label = labels[index] ?? "";
    index += 1;
    return replaceVisibleLabel(item, label);
  });
}

function replaceVisibleLabel(item: string, label: string): string {
  if (decodeText(item.replace(/<[^>]+>/g, "")) === label) return item;
  const matches = [...item.matchAll(/>([^<]+)</g)];
  const last = matches.at(-1);
  if (!last || last.index == null) return item;
  return `${item.slice(0, last.index)}>${escapeText(label)}<${item.slice(last.index + last[0].length)}`;
}
