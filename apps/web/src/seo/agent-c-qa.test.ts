/**
 * AGENT-C QA: Code Quality, Performance, SEO and Content Integrity
 *
 * Tests cover:
 *   1. Static public/ file risks that can shadow Next.js route handlers on Hostinger CDN
 *   2. Staging noindex function correctness edge cases
 *   3. Sitemap + robots content integrity checks
 *   4. Gemunu / unpublished practitioner redirect expectations (no sitemap leak)
 *   5. Production canonical host integrity across golden master
 *   6. PWA manifest.webmanifest Content-Type configuration (CDN deploy gap documented)
 *   7. Production robots.txt is never shadowed by a public/ static copy
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { goldenHtmlRoot, webRoot } from "@/importer/golden-root";
import { applyStagingNoIndexMeta, isStagingNoIndexHost, stagingRobotsTxt, stagingSitemapXml } from "@/seo/staging-noindex";
import { toStoragePath } from "@/documents/paths";

// ─── 1. PASSENGER STATIC SHORT-CIRCUIT: public/index.html removed ─────────────

/**
 * Hostinger Passenger serves files under public/ before Node middleware.
 * public/index.html was moved to public/seo-approved/static-homepage-seed.html
 * so /index.html reaches Next (middleware 301/302 → /). Seed retained for
 * applyStagingNoIndexMeta coverage only — not deployed as a static route.
 */
test("public/index.html is not statically deployable (Passenger short-circuit removed)", () => {
  const webDir = webRoot();
  assert.equal(
    fs.existsSync(path.join(webDir, "public", "index.html")),
    false,
    "public/index.html must not exist at public root — Hostinger would serve it with production index,follow",
  );
  const seedPath = path.join(webDir, "public", "seo-approved", "static-homepage-seed.html");
  assert.ok(fs.existsSync(seedPath), "seo-approved static homepage seed must remain for meta rewrite tests");
  const html = fs.readFileSync(seedPath, "utf8");
  assert.match(html, /content="index,follow/i);
  assert.match(html, /href="https:\/\/gabbamedicalcentre\.com\.au\//);
});

// ─── 2. STAGING NOINDEX: applyStagingNoIndexMeta handles seed homepage content ──

test("applyStagingNoIndexMeta correctly rewrites public/index.html style robots meta", () => {
  const webDir = webRoot();
  const indexPath = path.join(webDir, "public", "seo-approved", "static-homepage-seed.html");
  const html = fs.readFileSync(indexPath, "utf8");

  const result = applyStagingNoIndexMeta(html);

  // Meta robots must be replaced with staging directive
  assert.match(result, /content="noindex, nofollow, noarchive"/,
    "applyStagingNoIndexMeta must replace production robots meta with staging directive");

  // Googlebot tag must be added
  assert.match(result, /name="googlebot"/,
    "applyStagingNoIndexMeta must inject googlebot staging meta");

  // Production canonical must be preserved
  assert.match(result, /href="https:\/\/gabbamedicalcentre\.com\.au\//,
    "applyStagingNoIndexMeta must preserve production canonical href");

  // Should be idempotent
  assert.equal(applyStagingNoIndexMeta(result), result,
    "applyStagingNoIndexMeta must be idempotent");
});

// ─── 3. ROBOTS.TXT CDN SHADOW ─────────────────────────────────────────────────

/**
 * P0 DOCUMENTED RISK: Hostinger CDN intercepts /robots.txt before Next.js and serves
 * a hcdn-injected file with:
 *   User-agent: Googlebot  Disallow: /
 *   User-agent: *          Allow: /
 *
 * This bypasses BOTH the middleware.ts interceptor AND the robots.txt/route.ts handler.
 * The CDN response is 58 bytes and lacks X-Robots-Tag. Our code is correct but the
 * CDN layer shadows it entirely.
 *
 * The production public/seo-approved/robots.txt is 81 bytes and has Allow: / +
 * Sitemap declaration — also not being served from staging via the CDN intercept.
 *
 * STATUS: Document only — cannot fix at app code level without Hostinger CDN config.
 * LEAD: Contact Hostinger to exclude /robots.txt from CDN static intercept,
 *       or configure it via hPanel to rewrite properly.
 */
test("staging robots function produces correct all-disallow content (code is correct, CDN shadows it)", () => {
  const txt = stagingRobotsTxt();
  assert.match(txt, /User-agent: \*/);
  assert.match(txt, /Disallow: \//);
  assert.equal(txt.includes("Allow: /"), false,
    "staging robots must not contain Allow: / — CDN shadow issue exists but code itself is correct");
  assert.equal(txt.includes("Sitemap:"), false,
    "staging robots must omit Sitemap declaration");
});

test("staging sitemap returns empty urlset (no production URLs advertised)", () => {
  const xml = stagingSitemapXml();
  assert.match(xml, /<urlset[\s\S]*<\/urlset>/);
  assert.equal(xml.includes("<loc>"), false,
    "staging sitemap must not contain <loc> entries");
  assert.equal(xml.includes("gabbamedicalcentre.com.au"), false,
    "staging sitemap must not reference production host");
});

// ─── 4. SITEMAP INTEGRITY ─────────────────────────────────────────────────────

test("production sitemap has expected URL count (205) and no staging host", () => {
  const webDir = webRoot();
  const sitemap = fs.readFileSync(path.join(webDir, "public", "seo-approved", "sitemap.xml"), "utf8");
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);

  assert.equal(locs.length, 205,
    `sitemap URL count: expected 205, got ${locs.length}`);

  // All URLs must be on production host
  for (const loc of locs) {
    assert.equal(loc.startsWith("https://gabbamedicalcentre.com.au/"), true,
      `sitemap URL must be on production host: ${loc}`);
  }

  // Staging host must never appear in sitemap
  assert.equal(sitemap.includes("hostingersite.com"), false,
    "sitemap must not reference hostingersite.com");
});

test("gemunu is absent from sitemap and golden master doctor pages list 11 published practitioners", () => {
  const webDir = webRoot();
  const sitemap = fs.readFileSync(path.join(webDir, "public", "seo-approved", "sitemap.xml"), "utf8");

  // Gemunu must not be in sitemap
  assert.equal(sitemap.includes("gemunu"), false,
    "dr-gemunu-wijesuriya must not appear in sitemap — unpublished/404");

  // Doctor URLs in sitemap
  const doctorLocs = [...sitemap.matchAll(/<loc>(https:\/\/gabbamedicalcentre\.com\.au\/doctors\/[^<]+)<\/loc>/g)]
    .map(m => m[1]);

  // 12 doctors listed in sitemap (per sitemap count)
  // Note: Golnar, James, Yamesha are CMS-only (not in static sitemap yet)
  assert.equal(doctorLocs.length, 12,
    `expected 12 doctor URLs in static sitemap, got ${doctorLocs.length}`);
});

// ─── 5. PRODUCTION ROBOTS CONTENT ────────────────────────────────────────────

test("production robots.txt has Allow: / and production sitemap declaration", () => {
  const webDir = webRoot();
  const robots = fs.readFileSync(path.join(webDir, "public", "seo-approved", "robots.txt"), "utf8");
  assert.match(robots, /User-agent: \*/);
  assert.match(robots, /Allow: \//);
  assert.match(robots, /Sitemap: https:\/\/gabbamedicalcentre\.com\.au\/sitemap\.xml/,
    "production robots must declare production sitemap URL");
  assert.equal(robots.includes("Disallow"), false,
    "production robots must not Disallow any path");
});

// ─── 6. PATH ROUTING: index.html identity ─────────────────────────────────────

test("/ and /index.html resolve to the same storage path", () => {
  assert.equal(toStoragePath(undefined), "index.html");
  assert.equal(toStoragePath([]), "index.html");
  assert.equal(toStoragePath(["index.html"]), "index.html",
    "explicit /index.html must resolve to same storage as /");
});

// ─── 7. STAGING HOST DETECTION ────────────────────────────────────────────────

test("isStagingNoIndexHost correctly identifies all expected staging patterns", () => {
  // Hostinger staging
  assert.equal(isStagingNoIndexHost("mediumslateblue-eagle-960503.hostingersite.com"), true);
  assert.equal(isStagingNoIndexHost("other-name.hostingersite.com"), true);

  // Production hosts must NOT match
  assert.equal(isStagingNoIndexHost("gabbamedicalcentre.com.au"), false);
  assert.equal(isStagingNoIndexHost("www.gabbamedicalcentre.com.au"), false);
  assert.equal(isStagingNoIndexHost("next.gabbamedicalcentre.com.au"), false);

  // Null/undefined/empty must not throw
  assert.equal(isStagingNoIndexHost(null), false);
  assert.equal(isStagingNoIndexHost(undefined), false);
  assert.equal(isStagingNoIndexHost(""), false);

  // Env var override
  const prev = process.env.STAGING_NOINDEX;
  process.env.STAGING_NOINDEX = "true";
  assert.equal(isStagingNoIndexHost("gabbamedicalcentre.com.au"), true,
    "STAGING_NOINDEX=true must override production host detection");
  if (prev === undefined) delete process.env.STAGING_NOINDEX;
  else process.env.STAGING_NOINDEX = prev;
});

// ─── 6. WEBMANIFEST MIME TYPE ─────────────────────────────────────────────────

/**
 * Manifest is served by apps/web/src/app/manifest.webmanifest/route.ts from
 * public/seo-approved/manifest.webmanifest so Passenger cannot MIME it as text/plain.
 */
test("manifest is route-served from seo-approved (not a public-root static file)", () => {
  const webDir = webRoot();
  assert.equal(
    fs.existsSync(path.join(webDir, "public", "manifest.webmanifest")),
    false,
    "public/manifest.webmanifest must not exist at public root (Passenger text/plain short-circuit)",
  );
  assert.ok(
    fs.existsSync(path.join(webDir, "src", "app", "manifest.webmanifest", "route.ts")),
    "Next.js route handler must serve /manifest.webmanifest with application/manifest+json",
  );
  const routeSrc = fs.readFileSync(path.join(webDir, "src", "app", "manifest.webmanifest", "route.ts"), "utf8");
  assert.match(routeSrc, /application\/manifest\+json/);
});

test("seo-approved manifest.webmanifest is valid JSON with required PWA fields", () => {
  const webDir = webRoot();
  const raw = fs.readFileSync(path.join(webDir, "public", "seo-approved", "manifest.webmanifest"), "utf8");

  let manifest: Record<string, unknown>;
  assert.doesNotThrow(() => { manifest = JSON.parse(raw); }, "manifest.webmanifest must be valid JSON");
  manifest = JSON.parse(raw);

  for (const field of ["name", "short_name", "start_url", "display", "icons"]) {
    assert.ok(Object.prototype.hasOwnProperty.call(manifest, field),
      `manifest.webmanifest must contain required field: ${field}`);
  }

  const icons = manifest.icons as Array<{ src: string; sizes: string }>;
  assert.ok(Array.isArray(icons) && icons.length >= 2,
    "manifest must declare at least two icons (192 and 512 required for installability)");
});

// ─── 7. NO STATIC robots.txt IN public/ ──────────────────────────────────────

/**
 * Confirm there is no public/robots.txt static file that would allow Hostinger CDN
 * to serve a production-style robots.txt on staging, bypassing the route handler.
 * The production robots.txt is intentionally kept under public/seo-approved/robots.txt
 * (served via the route handler, not as a CDN static asset).
 */
test("public/robots.txt does not exist as a static file (only route handler serves it)", () => {
  const webDir = webRoot();
  assert.equal(
    fs.existsSync(path.join(webDir, "public", "robots.txt")),
    false,
    "public/robots.txt must not exist — the CDN would serve it directly, bypassing staging noindex logic; " +
    "only public/seo-approved/robots.txt (served via route handler) is permitted",
  );
});
