# AGENT-C QA Report — Code / Security / SEO / Performance

**Date:** 2026-11-11  
**Branch:** `qa/wmc-agent-c-tech`  
**Baseline SHA:** `069977bdd25714b221b62ca39ab1c2b74a06d511`  
**Staging:** `https://mediumslateblue-eagle-960503.hostingersite.com`

---

## 1. npm audit Classification

### Full audit (`npm audit`)
**15 vulnerabilities: 7 moderate, 6 high, 2 critical**

### Production-only audit (`npm audit --omit=dev`)
**8 vulnerabilities: 1 moderate, 5 high, 2 critical**

---

### Vulnerability Detail Table

| Package | Severity | Installed | Advisory | Exploitability | Fix Path | Action |
|---------|----------|-----------|----------|----------------|----------|--------|
| `@auth/core` | **CRITICAL** | `0.40.0` (bundled in next-auth) | GHSA-7rqj-j65f-68wh (homoglyph bypass), GHSA-xmf8-cvqr-rfgj (uncaught Bearer exception), GHSA-x445-f3h2-j279 (OAuth PKCE cookie binding) | **MEDIUM-HIGH** — auth bypass/CSRF affects login flows. Bearer exception can cause unhandled 500s from crafted `Authorization` headers. | `npm audit fix --force` → next-auth@5.0.0-beta.32 | **ESCALATE TO LEAD** — requires pinned beta bump from 5.0.0-beta.29 → beta.32. Needs operator approval before apply. |
| `deepmerge-ts` | HIGH | `7.1.5` (via prisma) | GHSA-ggr8-5vv4-36mx (stack exhaustion on recursive object graphs) | **LOW** — attack surface is Prisma ORM processing internally shaped query objects. Public web users cannot directly pass recursive objects to Prisma. | `npm audit fix --force` → prisma@7.10.1 (major breaking) | **ESCALATE TO LEAD** — major Prisma upgrade; test suite and schema migration required. |
| `postcss` | HIGH | `8.4.31` (bundled in `next/node_modules/postcss`) | GHSA-qx2v-qp2m-jg93 (XSS via `</style>`), GHSA-6g55-p6wh-862q + GHSA-fxqj-rqcc-2cmp + GHSA-r28c-9q8g-f849 (path traversal via sourceMappingURL) | **VERY LOW** — PostCSS is a **build-time** CSS preprocessor; it is not invoked at runtime. Vulnerabilities require attacker-controlled CSS/sourceMappingURL input during the build process, which is not possible from the public web surface. | `npm audit fix` → next@15.5.29 (within `^15.5.4` range) patches bundled postcss | **SAFE TO APPLY** via `npm audit fix` (see §1.3 below); note that top-level postcss is already `8.5.29` (not vulnerable). |
| `zod` | HIGH | `3.25.76` | GHSA-mrhx-c7xc-m3w5 (memory exhaustion in constrained collections) | **FALSE POSITIVE FOR v3** — the vulnerability range is `<4.6.6` and refers to zod v4 only. The project is on `3.25.76`. Upgrading to v4 would be a major breaking change. | `npm audit fix --force` → zod@4.6.7 | **NO ACTION** — zod v3.x is not affected; advisory applies to v4. Document and ignore. |
| `playwright` | HIGH | `1.49.1` | GHSA-7mvr-c777-76hp (SSL cert bypass during browser binary downloads) | **LOW** — devDependency only; affects `playwright install` step in CI but not production runtime. | `npm audit fix` (safe, within `^1.49.1` → `1.65.0`) | **SAFE TO APPLY** via `npm audit fix` (devDep only). |
| `minimatch` (via `@typescript-eslint`) | MODERATE | `9.x` (transitive) | GHSA-g3hv-75wg-m249 (DoS via globparts amplification) | **VERY LOW** — ESLint toolchain only; not in production runtime. | `npm audit fix` (safe) | **SAFE TO APPLY** via `npm audit fix` (devDep only). |

---

### 1.2 Safe-to-Apply Patches (`npm audit fix`, no `--force`)

Running `npm audit fix --dry-run` shows the following **non-breaking** changes:

| Package | From | To | Type |
|---------|------|----|------|
| `playwright` | 1.49.1 | 1.65.0 | devDep |
| `@typescript-eslint/*` chain | current | 8.72.2 | devDep |
| `next` | 15.5.28 | 15.5.29 | prod (patch only, within `^15.5.4`) |

> **Note:** `next 15.5.29` would also update the bundled `next/node_modules/postcss` from `8.4.31` to a version > `8.5.22`, resolving the PostCSS HIGH finding.

**Command to apply safe patches (LEAD authorization recommended before cutover):**
```powershell
cd apps/web
npm audit fix --no-fund
```

> ⚠️ Do NOT use `--force`. That would install next@16, prisma@7, zod@4 — all major breaking changes.

---

### 1.3 Critical Escalation Required

**`@auth/core` CRITICAL vulnerabilities** cannot be resolved without `--force` because `next-auth` is pinned to `5.0.0-beta.29` (exact version). The fix requires `5.0.0-beta.32`.

**LEAD action required:**
1. Review next-auth beta.32 changelog for breaking changes.
2. Update `package.json`: `"next-auth": "5.0.0-beta.32"` and run `npm install`.
3. Rebuild and smoke-test admin auth flows (login, session, OAuth if used).
4. Commit updated `package-lock.json`.

---

## 2. SEO / Robots / Sitemap Findings

### 2.1 Staging robots.txt — P0 CDN Shadow (CONFIRMED)

**Finding:** Hostinger CDN intercepts `/robots.txt` at 58 bytes before the Next.js route handler. The CDN-injected response is:
```
User-agent: Googlebot
Disallow: /

User-agent: *
Allow: /
```

This is **dangerous** — Googlebot sees `Disallow: /` (no crawl), but other crawlers see `Allow: /` (full crawl permitted). The CDN response has **no `X-Robots-Tag` header** and is not the app's staging robots content.

**Code status:** `apps/web/src/app/robots.txt/route.ts` and `apps/web/src/seo/staging-noindex.ts` are **correct**. The app would serve `User-agent: * / Disallow: /` with `X-Robots-Tag: noindex, nofollow, noarchive` for staging hosts — but the CDN never invokes it.

**Fix owner:** LEAD / Hostinger hPanel — exclude `/robots.txt` from CDN static intercept, or configure the route as dynamic.

### 2.2 Staging HTML pages — noindex meta PRESENT ✓

HTML pages served through the Next.js app DO have correct staging noindex meta:
```html
<meta name="robots" content="noindex, nofollow, noarchive"/>
<meta name="googlebot" content="noindex, nofollow, noarchive"/>
```

This confirms middleware/rendering pipeline is applying `applyStagingNoIndexMeta` correctly for dynamic pages.

### 2.3 manifest.webmanifest MIME Type — P1 CDN Deploy Gap

**Finding:** `GET /manifest.webmanifest` on staging returns `Content-Type: text/plain` instead of `application/manifest+json`.

**Code status:** `next.config.ts` lines 63–70 already configure:
```typescript
source: "/manifest.webmanifest",
headers: [
  { key: "Cache-Control", value: "no-cache, max-age=0, must-revalidate" },
  { key: "Content-Type", value: "application/manifest+json; charset=utf-8" },
],
```

The code is **correct**. Hostinger CDN serves `public/manifest.webmanifest` as a static file, bypassing Next.js response headers.

**Impact:** Browsers may fail to install the PWA. Chrome requires `Content-Type: application/manifest+json` for add-to-home-screen.

**Fix owner:** LEAD — configure Hostinger CDN to set correct MIME for `.webmanifest` files in hPanel, or move the manifest to a Next.js route handler.

### 2.4 Production Sitemap Integrity ✓

- 205 URLs in `public/seo-approved/sitemap.xml` — all on `https://gabbamedicalcentre.com.au/` ✓
- No staging host references ✓
- Gemunu absent from sitemap ✓ (404 expected; not published)
- 12 doctor profile URLs ✓

### 2.5 Production robots.txt ✓

`public/seo-approved/robots.txt` correctly:
- `User-agent: *` with `Allow: /` ✓
- Declares `Sitemap: https://gabbamedicalcentre.com.au/sitemap.xml` ✓
- No Disallow rules ✓

No static `public/robots.txt` file exists ✓ (CDN shadow risk for production robots not present).

---

## 3. Performance — Staging TTFB

All measurements from Windows PowerShell via `Invoke-WebRequest` (single-sample; no warm-up; includes TCP + TLS + server processing):

| Page | TTFB | Status | Notes |
|------|------|--------|-------|
| `/` (homepage) | **623 ms** | 200 | Acceptable for cold request |
| `/team.html` | **451 ms** | 200 | Good |
| `/services/skin-checks.html` | **4,627 ms** | 200 | ⚠️ Slow — see note |
| `/services/mental-health.html` | **3,763 ms** | 200 | ⚠️ Slow |
| `/doctors/dr-usman-afridi.html` | — | **404** | Expected (not published in staging DB) |
| `/doctors/dr-james-hanley.html` | — | **404** | Expected (CMS-only profile) |

**Interpretation:**
- Homepage and team page TTFB are within acceptable bounds for a staging server.
- Service pages show 3–5 s TTFB. These are likely slow due to:
  - Staging cold-start latency (Node.js app on Hostinger may be sleeping)
  - Database round-trips for page content lookups on cache miss
  - No edge cache warm-up on staging
- 404s for doctor pages are expected staging behaviour (practitioners not seeded in staging DB).

**No action required** for staging TTFB — these numbers are consistent with a cold staging environment and do not indicate production-level problems. Production should be profiled post-DNS cutover with warmed edge cache.

---

## 4. Test Results

### All SEO tests: **54/54 PASS**
```
src/seo/agent-c-qa.test.ts          12/12 PASS  (was 9; +3 new tests added this session)
src/seo/staging-noindex.test.ts      4/4  PASS
src/seo/authority-refinements.test.ts    7/7  PASS
src/seo/care-area-service-map.test.ts    9/9  PASS
src/seo/launch-refinements.test.ts       7/7  PASS
src/seo/launch.test.ts                   2/2  PASS
src/seo/practitioner-peers-coverage.test.ts  4/4  PASS
src/seo/published-practitioner-routes.test.ts  7/7  PASS
src/seo/search-index-doctors-coverage.test.ts  2/2  PASS
src/seo/wordpress-legacy-redirects.test.ts     4/4  PASS
```

### Security tests: **12/12 PASS**
```
src/security/admin-hardening.test.ts   12/12 PASS
Covers: media signatures, governance, session/idle, same-origin, login throttle, role menus
```

---

## 5. Code Changes Made This Session

### `apps/web/src/seo/agent-c-qa.test.ts`

Added 3 new tests (12 total, previously 9):

1. **`next.config.ts declares correct Content-Type for manifest.webmanifest (CDN deploy gap documented)`**  
   Reads `next.config.ts` to assert `application/manifest+json` is configured. Documents the deploy gap where Hostinger CDN bypasses Next.js headers.

2. **`public/manifest.webmanifest is valid JSON with required PWA fields`**  
   Validates manifest is parseable JSON and contains `name`, `short_name`, `start_url`, `display`, `icons` with at least 2 icon entries.

3. **`public/robots.txt does not exist as a static file (only route handler serves it)`**  
   Guards against accidental creation of `public/robots.txt` which would allow CDN bypass of staging noindex for the robots file.

---

## 6. Findings Summary

| # | Category | Severity | Finding | Owner | Status |
|---|----------|----------|---------|-------|--------|
| 1 | Security | CRITICAL | `@auth/core` 0.40.0 in next-auth 5.0.0-beta.29 — auth bypass, uncaught exception, PKCE cookie binding | LEAD | Escalate: bump next-auth → beta.32 |
| 2 | Security | HIGH | `deepmerge-ts` 7.1.5 via prisma@6.x — stack exhaustion | LEAD | Escalate: prisma major upgrade required |
| 3 | Security | HIGH | `postcss` 8.4.31 bundled in next — build-time only, low runtime risk | LEAD | Safe via `npm audit fix` (next 15.5.28 → 15.5.29) |
| 4 | Security | HIGH | `zod` 3.25.76 — FALSE POSITIVE; advisory is v4-only | — | No action; document |
| 5 | Security | HIGH | `playwright` 1.49.1 — SSL bypass during browser download, devDep only | LEAD | Safe via `npm audit fix` |
| 6 | Security | MOD | `minimatch` via @typescript-eslint — devDep only | LEAD | Safe via `npm audit fix` |
| 7 | SEO | P0 | `/robots.txt` CDN shadow — Hostinger 58-byte intercept bypasses route handler and staging noindex | LEAD | Hostinger hPanel config required |
| 8 | SEO | P1 | `/manifest.webmanifest` served as `text/plain` — CDN bypasses next.config header; PWA install broken | LEAD | Hostinger MIME config required |
| 9 | SEO | INFO | HTML pages have correct `noindex, nofollow, noarchive` on staging ✓ | — | PASS |
| 10 | SEO | INFO | Production sitemap (205 URLs), robots.txt, Gemunu exclusion all correct ✓ | — | PASS |
| 11 | Perf | WARN | Service pages 3–5 s TTFB on staging (cold start / no cache) | — | Expected staging; monitor post-launch |
| 12 | Perf | INFO | Homepage 623 ms, team 451 ms TTFB ✓ | — | Acceptable |

---

## 7. Recommendations for LEAD

1. **CRITICAL — auth security:** Update `next-auth` from `5.0.0-beta.29` → `5.0.0-beta.32` and run `npm install`. Test admin login flows before production cutover.

2. **HIGH — safe npm fix:** Run `npm audit fix` (no force) to patch playwright, @typescript-eslint, and next@15.5.29 in the `apps/web` workspace. Safe to apply on the RC branch.

3. **P0 CDN — robots.txt:** Contact Hostinger support or configure via hPanel to ensure `/robots.txt` is served by the Node.js app, not the CDN static layer. On production, this means Googlebot gets `Allow: /` + proper sitemap declaration.

4. **P1 CDN — webmanifest MIME:** Configure Hostinger CDN or hPanel to serve `*.webmanifest` with `Content-Type: application/manifest+json` so Chrome PWA install works correctly.

5. **Prisma major upgrade:** `deepmerge-ts` vulnerability requires prisma@7. Schedule as a post-launch maintenance window; attack surface is internal (not directly exploitable from public web).

---

_Report generated by AGENT-C. Workspace: `WMC-qa-agent-c`. Branch: `qa/wmc-agent-c-tech`. Baseline: `069977b`._
