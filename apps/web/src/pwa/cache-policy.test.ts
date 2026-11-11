import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  NEVER_CACHE_PATTERNS,
  NEVER_CACHE_PREFIXES,
  OFFLINE_FALLBACK_PATH,
  SHELL_ALLOWLIST,
  isCacheEligibleRequest,
  isNetworkOnlyPath,
  isShellAssetPath,
  responseHeadersAreCacheSafe,
} from "./cache-policy";

const publicDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../public");

/**
 * Sensitive path exclusion matrix. Every one of these must be network-only —
 * never read from or written to a Cache Storage cache — covering admin pages,
 * CMS preview auth, admin session rules, NextAuth, admin JSON APIs, and every
 * clinic-scoped form/EOI/readiness/career submission endpoint.
 */
const NEVER_CACHE_PATHS = [
  // Admin dashboard + auth + preview + session lifecycle.
  "/admin",
  "/admin/login",
  "/admin/forgot-password",
  "/admin/session-end",
  "/admin/pages",
  "/admin/pages/abc-123",
  "/admin/preview/9f3c2a7b-token",
  "/admin/operations/patient-requests",
  "/admin/operations/patient-requests/req-1",
  "/admin/gp-pipeline",
  "/admin/recruitment/gp-readiness",
  // NextAuth.
  "/api/auth/session",
  "/api/auth/csrf",
  "/api/auth/callback/credentials",
  "/api/auth/signin",
  "/api/auth/signout",
  // Admin-only JSON APIs.
  "/api/admin/gp-pipeline/eoi",
  "/api/admin/exports/governance",
  "/api/admin/story-capture/stories",
  "/api/admin/career-applications/abc/resume",
  // Clinic-scoped public submission APIs — forms, EOI, readiness, careers.
  "/api/clinics/woolloongabba/form-requests",
  "/api/clinics/woolloongabba/career-applications",
  "/api/clinics/woolloongabba/gp-pipeline/eoi",
  "/api/clinics/woolloongabba/gp-pipeline/readiness",
  "/api/clinics/woolloongabba/gp-pipeline/readiness-package",
  "/api/clinics/woolloongabba/gp-pipeline/session-match",
  // Every other clinic-scoped API, even ones not individually named above.
  "/api/clinics/woolloongabba/search-signals",
] as const;

test("sensitive path exclusion matrix: admin/auth/preview/clinic-submission paths are always network-only", () => {
  for (const sensitivePath of NEVER_CACHE_PATHS) {
    assert.equal(isNetworkOnlyPath(sensitivePath), true, sensitivePath);
    assert.equal(isCacheEligibleRequest("GET", sensitivePath), false, sensitivePath);
    // A hypothetical POST must be excluded too — defense in depth independent of method.
    assert.equal(isCacheEligibleRequest("POST", sensitivePath), false, sensitivePath);
  }
});

test("absolute URLs resolve to the same pathname-based decision as bare paths", () => {
  for (const sensitivePath of NEVER_CACHE_PATHS.slice(0, 5)) {
    assert.equal(
      isNetworkOnlyPath(`https://next.gabbamedicalcentre.com.au${sensitivePath}`),
      true,
      sensitivePath,
    );
  }
});

test("admin/auth isolation: no admin or auth path ever appears on the shell allow-list", () => {
  for (const shellPath of SHELL_ALLOWLIST) {
    assert.equal(isNetworkOnlyPath(shellPath), false, shellPath);
    for (const prefix of NEVER_CACHE_PREFIXES) {
      assert.equal(shellPath.startsWith(prefix), false, `${shellPath} vs ${prefix}`);
    }
  }
});

test("no non-GET request is ever cache-eligible, even for a shell asset", () => {
  for (const shellPath of SHELL_ALLOWLIST) {
    assert.equal(isCacheEligibleRequest("GET", shellPath), true, shellPath);
    for (const method of ["POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]) {
      assert.equal(isCacheEligibleRequest(method, shellPath), false, `${method} ${shellPath}`);
    }
  }
});

test("shell allow-list is a small, explicit, static set with no CMS pages", () => {
  assert.ok(SHELL_ALLOWLIST.includes(OFFLINE_FALLBACK_PATH));
  assert.equal(SHELL_ALLOWLIST.includes("/"), false);
  assert.equal(SHELL_ALLOWLIST.includes("/index.html"), false);
  // offline.html ships directly in public/ (this agent's own static asset).
  // Favicons are generated at build time (scripts/generate-favicons.mjs) and
  // manifest.webmanifest is owned by the platform agent, so neither is expected to
  // exist in a fresh checkout — the service worker's `cache.add` is designed
  // to soft-fail per asset for exactly this reason.
  assert.ok(existsSync(path.join(publicDir, OFFLINE_FALLBACK_PATH)), "offline.html should exist in public/");
});

test("ordinary public CMS pages are neither network-only-flagged nor cache-eligible", () => {
  const cmsPaths = ["/", "/doctors/dr-example.html", "/services/skin-checks.html", "/updates/article.html"];
  for (const cmsPath of cmsPaths) {
    assert.equal(isNetworkOnlyPath(cmsPath), false, cmsPath);
    assert.equal(isShellAssetPath(cmsPath), false, cmsPath);
    assert.equal(isCacheEligibleRequest("GET", cmsPath), false, cmsPath);
  }
});

test("responseHeadersAreCacheSafe rejects Set-Cookie, Authorization, no-store, and private responses", () => {
  assert.equal(responseHeadersAreCacheSafe(200, { "set-cookie": "authjs.session-token=x" }), false);
  assert.equal(responseHeadersAreCacheSafe(200, { authorization: "Bearer x" }), false);
  assert.equal(responseHeadersAreCacheSafe(200, { "cache-control": "private, max-age=0, must-revalidate" }), false);
  assert.equal(responseHeadersAreCacheSafe(200, { "cache-control": "no-store" }), false);
  assert.equal(responseHeadersAreCacheSafe(304, { "cache-control": "public, max-age=60" }), false);
  assert.equal(responseHeadersAreCacheSafe(200, { "cache-control": "public, max-age=60" }), true);
  assert.equal(responseHeadersAreCacheSafe(200, new Headers({ "cache-control": "public, max-age=60" })), true);
  assert.equal(
    responseHeadersAreCacheSafe(200, [["Cache-Control", "public, max-age=60"]] as const),
    true,
  );
});

test("NEVER_CACHE_PATTERNS cover the full clinic gp-pipeline family and are anchored to the path start", () => {
  for (const suffix of ["form-requests", "career-applications", "gp-pipeline/eoi", "gp-pipeline/readiness", "gp-pipeline/readiness-package", "gp-pipeline/session-match"]) {
    assert.ok(
      NEVER_CACHE_PATTERNS.some((pattern) => pattern.test(`/api/clinics/some-clinic/${suffix}`)),
      suffix,
    );
  }
  // Not anchored to an unrelated path that merely contains the same words elsewhere.
  assert.equal(
    NEVER_CACHE_PATTERNS.some((pattern) => pattern.test("/blog/form-requests-explained")),
    false,
  );
});

/**
 * Manifest must not change canonical hosts or undermine SEO. The platform
 * agent owns manifest.webmanifest; this test is deliberately tolerant of it not
 * existing yet, but enforces the contract the moment it lands.
 */
test("manifest.webmanifest (if present) stays same-origin and does not redeclare a different canonical host", () => {
  const manifestPath = path.join(publicDir, "manifest.webmanifest");
  if (!existsSync(manifestPath)) return; // platform agent has not landed it yet
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as Record<string, unknown>;
  for (const key of ["start_url", "scope", "id"] as const) {
    const value = manifest[key];
    if (typeof value !== "string" || value.length === 0) continue;
    const isAbsolute = /^https?:\/\//i.test(value);
    if (isAbsolute) {
      const url = new URL(value);
      assert.equal(url.protocol, "https:", `${key} must be https`);
      assert.match(
        url.hostname,
        /(^|\.)gabbamedicalcentre\.com\.au$/,
        `${key} must stay on the approved production host, got ${url.hostname}`,
      );
    } else {
      assert.equal(value.startsWith("//"), false, `${key} must not be protocol-relative to a third-party host`);
    }
  }
});
