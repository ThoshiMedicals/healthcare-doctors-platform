export type ParsedDocument = {
  title: string;
  description: string;
  canonical: string;
  robots: string;
  indexable: boolean;
  openGraph: Record<string, string>;
  schemaBlocks: string[];
  navOwner: string;
  navIsHub: boolean;
  navRoute: string;
};

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function tagAttributes(tag: string): Record<string, string> {
  const attributes: Record<string, string> = {};
  const pattern = /([^\s=/>]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  for (const match of tag.matchAll(pattern)) {
    attributes[match[1].toLowerCase()] = match[2] ?? match[3] ?? "";
  }
  return attributes;
}

export function parseDocument(html: string, relativePath: string): ParsedDocument {
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  const title = decodeEntities(titleMatch?.[1]?.trim() ?? relativePath);

  let description = "";
  let robots = "index,follow,max-image-preview:large";
  const openGraph: Record<string, string> = {};

  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const attributes = tagAttributes(tag);
    const content = attributes.content ?? "";
    if (attributes.name === "description") description = decodeEntities(content);
    if (attributes.name === "robots") robots = content;
    if (attributes.property?.startsWith("og:") || attributes.name?.startsWith("twitter:")) {
      const key = attributes.property ?? attributes.name;
      openGraph[key] = decodeEntities(content);
    }
  }

  let canonical = "";
  for (const tag of html.match(/<link\b[^>]*>/gi) ?? []) {
    const attributes = tagAttributes(tag);
    if (attributes.rel === "canonical") canonical = attributes.href ?? "";
  }

  const schemaBlocks: string[] = [];
  const schemaPattern = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  for (const match of html.matchAll(schemaPattern)) {
    schemaBlocks.push(match[1]);
  }

  const navTag = html.match(/<nav\b[^>]*id=["']primary-nav["'][^>]*>/i)?.[0] ?? "";
  const nav = tagAttributes(navTag);

  return {
    title,
    description,
    canonical,
    robots,
    indexable: !/noindex/i.test(robots),
    openGraph,
    schemaBlocks,
    navOwner: nav["data-nav-owner"] ?? "",
    navIsHub: nav["data-nav-is-hub"] === "true",
    navRoute: nav["data-nav-route"] ?? "",
  };
}

export function localReferences(html: string, fromPath: string): string[] {
  const refs = new Set<string>();
  const attrPattern = /\b(?:href|src|data-local-team-src)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
  for (const match of html.matchAll(attrPattern)) {
    const resolved = resolveLocal(fromPath, match[1] ?? match[2] ?? "");
    if (resolved) refs.add(resolved);
  }
  const srcsetPattern = /\bsrcset\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
  for (const match of html.matchAll(srcsetPattern)) {
    const value = match[1] ?? match[2] ?? "";
    for (const part of value.split(",")) {
      const url = part.trim().split(/\s+/)[0] ?? "";
      const resolved = resolveLocal(fromPath, url);
      if (resolved) refs.add(resolved);
    }
  }
  return [...refs].sort();
}

export function resolveLocal(fromPath: string, rawHref: string): string | null {
  const href = rawHref.trim();
  if (!href || href.startsWith("#") || href.startsWith("?") || href.startsWith("//")) return null;
  if (/^(?:[a-z][a-z0-9+.-]*:)/i.test(href)) return null;
  const withoutHash = href.split("#")[0]?.split("?")[0] ?? "";
  if (!withoutHash) return null;
  const base = fromPath.includes("/") ? fromPath.slice(0, fromPath.lastIndexOf("/") + 1) : "";
  let pathname = "";
  try {
    pathname = decodeURIComponent(new URL(withoutHash, `https://gabbamedicalcentre.com.au/${base}`).pathname);
  } catch {
    return null;
  }
  pathname = pathname.replace(/^\/+/, "");
  if (!pathname) return "index.html";
  return pathname;
}

export function parseSchemaBlocks(blocks: readonly string[]): { valid: number; invalid: string[] } {
  const invalid: string[] = [];
  let valid = 0;
  for (const block of blocks) {
    try {
      JSON.parse(block);
      valid += 1;
    } catch (error) {
      invalid.push(error instanceof Error ? error.message : "Invalid JSON-LD");
    }
  }
  return { valid, invalid };
}
