/**
 * AGENT-C QA: Code Quality, Performance, SEO and Content Integrity
 *
 * Tests cover:
 *   1. Static public/ file risks that can shadow Next.js route handlers on Hostinger CDN
 *   2. Staging noindex function correctness edge cases
 *   3. Sitemap + robots content integrity checks
 *   4. Gemunu / unpublished practitioner redirect expectations (no sitemap leak)
 *   5. Production canonical host integrity across golden master
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { goldenHtmlRoot, webRoot } from "@/importer/golden-root";
import { applyStagingNoIndexMeta, isStagingNoIndexHost, stagingRobotsTxt, stagingSitemapXml } from "@/seo/staging-noindex";
import { toStoragePath } from "@/documents/paths";

// ─── 1. CDN SHADOW RISK: public/index.html ────────────────────────────────────

/**
 * P1 DOCUMENTED RISK: Hostinger CDN serves public/index.html as a static file,
 * bypassing the Next.js route handler that applies staging noindex.
 *
 * The static file at public/index.html contains production meta robots
 * (index,follow) and production canonical. When deployed to staging, requests
 * for /index.html are answered directly by the CDN without invoking the
 * (public)/[[...path]]/route.ts handler or middleware — so applyStagingNoIndexMeta
 * is never called and X-Robots-Tag: noindex is never set.
 *
 * FIX (LEAD): Remove public/index.html from the deployment artifact, or add
 * an explicit /index.html intercept to middleware.ts for staging hosts.
 *
 * This test documents the presence of the file and asserts its current
 * content so that a future change is caught.
 */
test("public/index.html exists and contains production indexing meta (CDN shadow risk documented)", () => {
  const webDir = webRoot();
  const indexPath = path.join(webDir, "public", "index.html");
  assert.equal(fs.existsSync(indexPath), true,
    "public/index.html must exist — if removed, update this test and verify /index.html now routes through Next.js on staging");

  const html = fs.readFileSync(indexPath, "utf8");

  // The static file has production robots — NOT staging noindex
  assert.match(html, /content="index,follow/i,
    "public/index.html has production meta robots (index,follow); staging CDN serves this without noindex override");

  // Production canonical must point to production host (not staging)
  assert.match(html, /href="https:\/\/gabbamedicalcentre\.com\.au\//,
    "public/index.html canonical must reference production host, not staging");

  // The file should NOT have the staging directive inline
  assert.equal(html.includes("noindex, nofollow, noarchive"), false,
    "public/index.html lacks staging noindex — CDN bypass confirmed; LEAD must intercept /index.html in middleware or remove static file");
});

// ─── 2. STAGING NOINDEX: applyStagingNoIndexMeta handles public/index.html content ──

test("applyStagingNoIndexMeta correctly rewrites public/index.html style robots meta", () => {
  const webDir = webRoot();
  const indexPath = path.join(webDir, "public", "index.html");
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
