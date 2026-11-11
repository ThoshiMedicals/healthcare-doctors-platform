/**
 * Apply governed Page SEO columns into served HTML <head>.
 * Does not mutate immutable PageRevision rows — injection is serve-time only.
 */

export type PageSeoFields = {
  title: string;
  description: string;
  canonicalPath: string;
  robots: string;
  indexable: boolean;
  openGraph: unknown;
};

export type PageSeoDraft = {
  title?: string;
  description?: string;
  canonicalPath?: string;
  robots?: string;
  indexable?: boolean;
  ogTitle?: string;
  ogDescription?: string;
};

export type CanonicalValidation =
  | { ok: true; canonicalPath: string }
  | { ok: false; reason: string };

const TITLE_MAX = 70;
const DESCRIPTION_MAX = 320;

export function validateCanonicalPath(raw: string, pagePath: string): CanonicalValidation {
  const value = raw.trim();
  if (!value) return { ok: false, reason: "Canonical path is required." };
  if (/^https?:\/\//i.test(value)) {
    return { ok: false, reason: "Canonical must be a site path (not an absolute URL)." };
  }
  if (value.includes("://") || value.includes(" ")) {
    return { ok: false, reason: "Canonical path contains invalid characters." };
  }
  const normalized = value.replace(/^\//, "");
  if (normalized !== pagePath.replace(/^\//, "") && normalized !== pagePath) {
    // Allow intentional alias only when it still ends with the page leaf — block cross-site hijack.
    if (!normalized.endsWith(pagePath.split("/").pop() ?? pagePath)) {
      return {
        ok: false,
        reason: "Canonical path must stay on this page’s public path architecture.",
      };
    }
  }
  return { ok: true, canonicalPath: normalized === "" ? "/" : normalized };
}

export function validateSeoDraft(draft: PageSeoDraft, pagePath: string): string[] {
  const problems: string[] = [];
  if (draft.title != null) {
    const title = draft.title.trim();
    if (!title) problems.push("Meta title is required.");
    if (title.length > TITLE_MAX) problems.push(`Meta title must be ${TITLE_MAX} characters or fewer.`);
  }
  if (draft.description != null) {
    const description = draft.description.trim();
    if (!description) problems.push("Meta description is required.");
    if (description.length > DESCRIPTION_MAX) {
      problems.push(`Meta description must be ${DESCRIPTION_MAX} characters or fewer.`);
    }
  }
  if (draft.canonicalPath != null) {
    const canonical = validateCanonicalPath(draft.canonicalPath, pagePath);
    if (!canonical.ok) problems.push(canonical.reason);
  }
  if (draft.robots != null) {
    const robots = draft.robots.trim().toLowerCase();
    if (!robots) problems.push("Robots directive is required.");
    if (robots.includes("index") && robots.includes("noindex")) {
      problems.push("Robots cannot request both index and noindex.");
    }
  }
  return problems;
}

export function parseSeoDraft(value: unknown): PageSeoDraft | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  return {
    title: row.title != null ? String(row.title) : undefined,
    description: row.description != null ? String(row.description) : undefined,
    canonicalPath: row.canonicalPath != null ? String(row.canonicalPath) : undefined,
    robots: row.robots != null ? String(row.robots) : undefined,
    indexable: typeof row.indexable === "boolean" ? row.indexable : undefined,
    ogTitle: row.ogTitle != null ? String(row.ogTitle) : undefined,
    ogDescription: row.ogDescription != null ? String(row.ogDescription) : undefined,
  };
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function upsertMetaByName(html: string, name: string, content: string): string {
  const re = new RegExp(`<meta\\b[^>]*\\bname=["']${name}["'][^>]*>`, "i");
  const tag = `<meta name="${name}" content="${escapeAttr(content)}">`;
  if (re.test(html)) return html.replace(re, tag);
  return html.replace(/<\/head>/i, `${tag}\n</head>`);
}

function upsertMetaByProperty(html: string, property: string, content: string): string {
  const re = new RegExp(`<meta\\b[^>]*\\bproperty=["']${property}["'][^>]*>`, "i");
  const tag = `<meta property="${property}" content="${escapeAttr(content)}">`;
  if (re.test(html)) return html.replace(re, tag);
  return html.replace(/<\/head>/i, `${tag}\n</head>`);
}

function upsertTitle(html: string, title: string): string {
  if (/<title\b[^>]*>[\s\S]*?<\/title>/i.test(html)) {
    return html.replace(/<title\b[^>]*>[\s\S]*?<\/title>/i, `<title>${escapeAttr(title)}</title>`);
  }
  return html.replace(/<\/head>/i, `<title>${escapeAttr(title)}</title>\n</head>`);
}

function upsertCanonical(html: string, canonicalPath: string): string {
  const href = canonicalPath === "/" ? "/" : `/${canonicalPath.replace(/^\//, "")}`;
  const re = /<link\b[^>]*\brel=["']canonical["'][^>]*>/i;
  const tag = `<link rel="canonical" href="${escapeAttr(href)}">`;
  if (re.test(html)) return html.replace(re, tag);
  return html.replace(/<\/head>/i, `${tag}\n</head>`);
}

function readOg(openGraph: unknown): { title?: string; description?: string } {
  if (!openGraph || typeof openGraph !== "object" || Array.isArray(openGraph)) return {};
  const row = openGraph as Record<string, unknown>;
  return {
    title: row.title != null ? String(row.title) : undefined,
    description: row.description != null ? String(row.description) : undefined,
  };
}

/**
 * Inject Page SEO into HTML. When indexable is false, forces noindex even if robots says index.
 */
export function applyPageSeoToHtml(html: string, seo: PageSeoFields): string {
  let next = html;
  next = upsertTitle(next, seo.title);
  next = upsertMetaByName(next, "description", seo.description);
  const robots = seo.indexable
    ? seo.robots
    : seo.robots.toLowerCase().includes("noindex")
      ? seo.robots
      : "noindex,follow";
  next = upsertMetaByName(next, "robots", robots);
  next = upsertCanonical(next, seo.canonicalPath);
  const og = readOg(seo.openGraph);
  next = upsertMetaByProperty(next, "og:title", og.title || seo.title);
  next = upsertMetaByProperty(next, "og:description", og.description || seo.description);
  next = upsertMetaByProperty(next, "og:type", "website");
  return next;
}

export function mergeSeoDraftOntoPage(
  page: PageSeoFields,
  draft: PageSeoDraft,
): PageSeoFields {
  const og = readOg(page.openGraph);
  return {
    title: draft.title?.trim() || page.title,
    description: draft.description?.trim() || page.description,
    canonicalPath: draft.canonicalPath?.trim() || page.canonicalPath,
    robots: draft.robots?.trim() || page.robots,
    indexable: draft.indexable ?? page.indexable,
    openGraph: {
      title: draft.ogTitle?.trim() || og.title || draft.title?.trim() || page.title,
      description:
        draft.ogDescription?.trim() || og.description || draft.description?.trim() || page.description,
    },
  };
}
