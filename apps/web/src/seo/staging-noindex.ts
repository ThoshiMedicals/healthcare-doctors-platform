import { hostnameFromHostHeader } from "@/clinics/host";

/** Header / meta value for non-production preview hosts. Never enable on production apex. */
export const STAGING_ROBOTS_DIRECTIVE = "noindex, nofollow, noarchive";

/**
 * Staging / preview indexing lock.
 * - STAGING_NOINDEX=true (Hostinger env) — explicit
 * - *.hostingersite.com — Hostinger preview hostnames
 * - UAT_QUICK_TUNNEL=true — local Cloudflare tunnel UAT
 * Production apex hosts never match these rules.
 */
export function isStagingNoIndexHost(hostHeader: string | null | undefined): boolean {
  if (process.env.STAGING_NOINDEX === "true") return true;
  if (process.env.UAT_QUICK_TUNNEL === "true") return true;
  const host = hostnameFromHostHeader(hostHeader).toLowerCase();
  if (!host) return false;
  if (host.endsWith(".hostingersite.com")) return true;
  return false;
}

/** robots.txt body for staging — Disallow alone is not enough; pair with X-Robots-Tag + meta. */
export function stagingRobotsTxt(): string {
  return [
    "# Staging / preview — not for indexing",
    "User-agent: *",
    "Disallow: /",
    "",
  ].join("\n");
}

/** Empty urlset so staging does not advertise production (or staging) URLs for crawl. */
export function stagingSitemapXml(): string {
  return `<?xml version="1.0" encoding="utf-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n</urlset>\n`;
}

/**
 * Force meta robots to staging directive. Preserves production canonical link tags.
 * Idempotent when already set to the staging directive.
 */
export function applyStagingNoIndexMeta(html: string): string {
  const directive = STAGING_ROBOTS_DIRECTIVE;
  if (!html.includes("<head") && !html.includes("<HEAD")) {
    return html;
  }
  const robotsTag = `<meta name="robots" content="${directive}"/>`;
  const googleTag = `<meta name="googlebot" content="${directive}"/>`;

  let next = html.replace(
    /<meta\b[^>]*\bname=["']robots["'][^>]*>/gi,
    robotsTag,
  );
  if (!/<meta\b[^>]*\bname=["']robots["']/i.test(next)) {
    next = next.replace(/<\/head>/i, `  ${robotsTag}\n</head>`);
  }

  if (/<meta\b[^>]*\bname=["']googlebot["']/i.test(next)) {
    next = next.replace(/<meta\b[^>]*\bname=["']googlebot["'][^>]*>/gi, googleTag);
  } else {
    next = next.replace(/<\/head>/i, `  ${googleTag}\n</head>`);
  }

  return next;
}
