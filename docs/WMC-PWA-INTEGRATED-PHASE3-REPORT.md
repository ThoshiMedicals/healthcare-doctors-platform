# WMC Patient PWA — Integrated Phase 3 Report

**Worktree:** `C:\Users\RoshanSamarawickrema\Desktop\WMC-pwa-integrated`  
**Branch:** `wip/pwa-integrated`  
**Base tip:** `7fbb04e` (unified Sprint2 + CMS P0)  
**Date:** 2026-11-11  
**Scope:** Local integration only — no commit, push, merge, or Hostinger/DNS/Supabase changes.

---

## A. Agent integration results

| Agent | Contribution | Integrated |
| --- | --- | --- |
| Platform | `manifest.webmanifest`, `pwa-meta.ts` (head/theme/safe-area/install tip), icon generator, `render-published-document` wiring, `next.config` manifest headers, build script | Yes |
| Patient UX | `patient-pwa-nav.js`, SSR quick-nav inject in `public-ux.ts`, cold/warm probe script, tests | Yes |
| Security | Fail-closed `sw.js` + `cache-policy.ts`, `offline.html`, SW contract tests | Yes |

**Integration repairs applied after merge:**

1. Aligned SW `SHELL_ALLOWLIST` to `/manifest.webmanifest` (+ `/icons/icon-192.png`, `/icons/icon-512.png`) in both `cache-policy.ts` and `public/sw.js`.
2. Added public-only service-worker registration via `applyPwaServiceWorkerRegister` inside `applyPwaMeta` (admin/auth never receive it).
3. Merged `package.json` test entries for PWA suites; preserved `generate-pwa-icons.mjs` on `build`.
4. Added `Cache-Control: no-cache` for `/sw.js` and `/offline.html` in `next.config.ts`.
5. Updated security tests that still referenced `/manifest.json`.

---

## B. Root capabilities landed

- Installable web app metadata (manifest, theme-color, Apple capable/title, viewport-fit=cover).
- Generated maskable + any-purpose icons (build-time; `public/icons/` gitignored).
- Standalone-only safe-area CSS + dismissible install tip (sessionStorage only).
- Patient quick-nav for standalone / PWA display mode (Book / Doctors / Services / Reception / Contact).
- Fail-closed service worker: intercepts **only** GET same-origin shell allow-list; never admin, auth, clinic submission APIs, or CMS HTML pages.
- Offline fallback page at `/offline.html` (noindex, accessible, no personalised data).

---

## C. Shared components / styles corrected

| Area | File(s) |
| --- | --- |
| PWA head + install + SW register | `apps/web/src/documents/pwa-meta.ts` |
| Document pipeline | `apps/web/src/documents/render-published-document.ts` |
| Patient standalone nav | `apps/web/src/documents/public-ux.ts`, `apps/web/public/patient-pwa-nav.js` |
| Cache policy + SW | `apps/web/src/pwa/cache-policy.ts`, `apps/web/public/sw.js` |
| Headers | `apps/web/next.config.ts` |
| Icons | `apps/web/scripts/generate-pwa-icons.mjs` |

---

## D. Exact changed-file list (integrated worktree)

**Modified**

- `apps/web/.gitignore`
- `apps/web/next.config.ts`
- `apps/web/package.json`
- `apps/web/scripts/uat.mjs`
- `apps/web/src/documents/public-ux.ts`
- `apps/web/src/documents/render-published-document.ts`

**Added**

- `apps/web/public/manifest.webmanifest`
- `apps/web/public/offline.html`
- `apps/web/public/patient-pwa-nav.js`
- `apps/web/public/sw.js`
- `apps/web/scripts/generate-pwa-icons.mjs`
- `apps/web/scripts/patient-pwa-cold-warm-probe.mjs`
- `apps/web/src/documents/patient-pwa-nav.test.ts`
- `apps/web/src/documents/pwa-meta.ts`
- `apps/web/src/documents/pwa-meta.test.ts`
- `apps/web/src/pwa/` (`cache-policy.ts`, `cache-policy.test.ts`, `sw-contract.test.ts`, `offline-shell.test.ts`, …)
- `docs/WMC-PWA-PHASE0-BASELINE.md`
- `docs/WMC-PWA-BASELINE-STAGING-TIMINGS.txt`
- `docs/WMC-PWA-BUILD-LOG.txt`
- `docs/WMC-PWA-INTEGRATED-PHASE3-REPORT.md` (this file)

**Generated at build (not committed):** `apps/web/public/icons/*`

---

## E. Before / after evidence

| Check | Result |
| --- | --- |
| Focused PWA + HOLD + booking tests | **70/70 pass** |
| ESLint on PWA-touched paths | **Pass** (`pwa-meta.ts`, `public-ux.ts`, `cache-policy.ts`, `next.config.ts`) |
| `npm run build` | **Compiled successfully** (exit 0); Windows EPERM on one traced `_app.js` copy — non-blocking in this environment; logged in `WMC-PWA-BUILD-LOG.txt` |
| Full-repo `tsc --noEmit` | Pre-existing failures only (`vitest` missing in unrelated tests; `approved-content-manifest.test.ts` typing) — **not introduced by PWA** |
| Live Hostinger / tunnel visual install flow | **Not re-run in this integration pass** (local unit + build only) |

---

## F. Responsive / patient UX verification

- Quick-nav CSS is standalone-gated (`display-mode: standalone` / iOS standalone class path via patient script).
- Safe-area insets accounted for against booking dock height variable.
- Keyboard focus styles present on quick-nav links.
- Full multi-viewport visual matrix for PWA chrome: **not performed** on Hostinger in this pass (local implementation gate only).

---

## G. Accessibility verification (automated / static)

- Offline page tests: single `h1`, accessible names on controls, no focus trap, explicit button types, noindex — **pass**.
- Install tip: `role="note"`, `aria-live="polite"`, dismiss control labelled — present in injected markup.
- Full axe / keyboard browser pass on staging: **not performed** this pass.

---

## H. Recruitment HOLD regression

- `recruitment-hold-route.test.ts` + `importer/recruitment-hold.test.ts`: **pass**.
- No HOLD env vars changed.
- No EOI / readiness / form routes enabled.
- SW never caches clinic gp-pipeline or form-request APIs (deny patterns + tests).

---

## I. CMS, booking, SEO regression

- Booking restriction + phone-only booking tests: **pass**.
- Manifest uses relative `start_url` / `scope` (same-origin); security test asserts no foreign canonical host.
- Staging noindex / SEO modules not altered by this integration.
- Document renderer still applies favicon + PWA meta on published HTML only.

---

## J. Performance and production-build results

- No new heavyweight client libraries.
- SW is fail-closed shell-only (does not shadow durable HTML cache / `publicCacheEpoch`).
- Icons generated at build from existing brand mark.
- Cold-start Hostinger behaviour unchanged by this local work; baseline notes remain in Phase 0 docs.
- Production build: **PASS** (compile success).

---

## K. Integration risks (Patient PWA ↔ other streams)

| Stream | Overlap | Risk |
| --- | --- | --- |
| 12-page layout recovery (`WMC-page-layout-recovery`) | Touches `ensure-journey-nav.ts` / `ev-shell.ts` only — **no shared dirty files** with this PWA tree | Low — merge order: either first; re-run both test suites after combine |
| Dirty main / CMS P0 lockup logo | Separate worktree; logo not in this branch | Do not copy logo into PWA tree without operator ask |
| `public-ux.ts` | PWA patient nav inject lives here; future layout/global UX edits will collide | Integrate via branch review; bump patient-pwa-nav cache token if inject changes |
| Hostinger staging `7fbb04e` | Staging does **not** include this PWA work until a future authorised deploy | Expected |

---

## L. Final verdict

**PATIENT PWA INTEGRATION — COMMIT CANDIDATE READY**

Conditions:

- Remains **local-only** until an explicit commit/push/deploy authorisation.
- Production remains **NO-GO**.
- Combine with layout-recovery branch only through a separate integration review (file sets currently disjoint).
- Optional follow-up before ship: live install/offline smoke on UAT (`127.0.0.1:3100` + tunnel) and resolve the Windows traced-file EPERM if it appears on the release machine.
