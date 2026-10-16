/** Extracts approved page regions. Comparison is exact text, not a normalised rewrite. */

export type PageRegions = {
  header: string | null;
  navigation: string | null;
  footer: string | null;
  schema: string[];
  skipLink: string | null;
  mainOpen: string | null;
  appointmentActions: string | null;
  digitalReceptionScripts: string[];
};

export function pageRegions(html: string): PageRegions {
  return {
    header: extractElement(html, "header"),
    navigation: extractElement(html, "nav", (openTag) => /id=["']primary-nav["']/.test(openTag)),
    footer: extractElement(html, "footer"),
    schema: extractSchema(html),
    skipLink: extractElement(html, "a", (openTag) => /class=["'][^"']*\bskip-link\b/.test(openTag)),
    mainOpen: html.match(/<main\b[^>]*>/i)?.[0] ?? null,
    appointmentActions: extractElement(
      html,
      "nav",
      (openTag) => /class=["'][^"']*\bpersistent-care-actions\b/.test(openTag),
    ),
    digitalReceptionScripts: extractDigitalReceptionScripts(html),
  };
}

export function extractSchema(html: string): string[] {
  return [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi)].map(
    (match) => match[0],
  );
}

export function extractDigitalReceptionScripts(html: string): string[] {
  return [
    ...html.matchAll(/<script\b[^>]*src=["'][^"']*digital-reception(?:-index)?\.js(?:\?[^"']*)?["'][^>]*>\s*<\/script>/gi),
  ].map((match) => match[0]);
}

export function extractElement(
  html: string,
  tag: string,
  predicate?: (openTag: string) => boolean,
): string | null {
  const openPattern = new RegExp(`<${tag}\\b`, "gi");
  const lower = html.toLowerCase();
  const tagLower = tag.toLowerCase();
  for (const match of html.matchAll(openPattern)) {
    const start = match.index ?? 0;
    const openEnd = html.indexOf(">", start);
    if (openEnd === -1) return null;
    const openTag = html.slice(start, openEnd + 1);
    if (predicate && !predicate(openTag)) continue;
    if (openTag.endsWith("/>")) return openTag;

    let depth = 1;
    let cursor = openEnd + 1;
    while (cursor < html.length) {
      const nextOpen = lower.indexOf(`<${tagLower}`, cursor);
      const nextClose = lower.indexOf(`</${tagLower}>`, cursor);
      if (nextClose === -1) return null;
      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth += 1;
        cursor = nextOpen + tagLower.length + 1;
        continue;
      }
      depth -= 1;
      if (depth === 0) return html.slice(start, nextClose + tagLower.length + 3);
      cursor = nextClose + tagLower.length + 3;
    }
  }
  return null;
}

export function firstDifference(expected: string, actual: string): number {
  const length = Math.min(expected.length, actual.length);
  for (let index = 0; index < length; index += 1) {
    if (expected[index] !== actual[index]) return index;
  }
  return length;
}
