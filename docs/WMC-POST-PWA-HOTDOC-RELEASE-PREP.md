# WMC — Golnar HotDoc + Post-PWA Hardening: Release Preparation

| Field | Value |
| --- | --- |
| Branch | `integration/wmc-post-pwa-booking` |
| Baseline ancestor | `a8309dbcd2b1458f5228d50ff4f9bc48b5d8e625` |
| Staging project | `thwcxuhrzgkufvdrvzzt` (`wmc-hostinger-staging`) |
| Staging migrations | **32** applied (`supabase_migrations.schema_migrations`) — this release needs **no schema migration** |
| Date | 2026-11-11 |
| Push / Hostinger deploy | **Not performed** |
| Staging DB writes | **Not performed** |

## A — Dr Golnar 301 root cause and repair

**Root cause:** Middleware WordPress legacy map in `apps/web/src/seo/wordpress-legacy-redirects.ts` forced:

- `/doctors/dr-golnar-mortezaei.html` → `/team-general-practitioners.html` (301)
- (same pattern for James + Yamesha)

This ran **before** CMS page lookup. Staging DB already has these pages **`status=published`** with published revisions (verified read-only). No duplicate profile created; no clinical content invented.

**Code repair (this commit):**

- Removed Next-native 301s for Golnar / James / Yamesha published profiles.
- Mapped WP equity `/doctor/dr-golnar-mortezaei-gp-fracgp` → `/doctors/dr-golnar-mortezaei.html` (and James WP slug → profile).
- Kept Gemunu → GP directory (intentionally unpublished).

After archive deploy, profile should return **HTTP 200** from published CMS HTML. No staging CMS publish required for the page itself (already published).

## B — Booking matrix

| Practitioner | Mode | Notes |
| --- | --- | --- |
| Golnar | ONLINE HotDoc | CMS `booking_url` currently **null** → authorised fallback `…/dr-golnar-mortezaei-5?wp=w_lightbox` |
| Mary | PHONE_ONLY | Resolver never invents Golnar URL for Mary |
| Tanya | ONLINE | Untouched |
| James | ONLINE | CMS has practitioner HotDoc URL |
| Yamesha | ONLINE | Untouched |

## C — CMS implications

- Optional durable CMS: set Golnar practitioner `bookingUrl` to authorised HotDoc URL and publish (not done by agents).
- Profile pages already published — redirect removal is sufficient for 200.
- Cache bust: public-ux token `wmc-golnar-hotdoc-online-20261111a`.

## D — Robots / sitemap

- Repo has **no** `public/robots.txt` short-circuit file; production robots/sitemap served from `public/seo-approved/` via Next routes.
- Staging Hostinger may still short-circuit `/robots.txt` with a **server-side** static file — do **not** delete without verifying Node route responds with `stagingRobotsTxt()` (`Disallow: /`). Operator Hostinger filesystem check remains.
- Telehealth sitemap sync preserved.
- Static sitemap still omits Golnar/James/Yamesha (CMS-only; no dynamic merge) — documented, not claimed as complete.

## E — PWA / HOLD

Focused suite including PWA + HOLD: **PASS**. No HOLD or SW policy changes.

## F — Tests / build

- Focused: **128/128 PASS**
- Full `npm test`: **464 pass**; **3 env DB leaf failures** (unavailable `localhost:5432`):
  1. `unpublishes to stop public serve then restores through publish gate`
  2. `creates a deputy, grants Super Admin, and removes the trial accounts`
  3. `navigation, header, footer, schema, accessibility, and Digital Reception match the golden master`
- ESLint booking/SEO touchpoints: **PASS**
- `npm run build`: **PASS**

## G–H — Commit / archive

| Field | Value |
| --- | --- |
| Feature commit | `a8a3cb806c51b3637ce91a6bd78f024f874af7aa` |
| Message | `feat(wmc): Golnar HotDoc online booking + post-PWA sitemap hardening` |
| Release archive | `wmc-post-pwa-hotdoc-a8a3cb8.zip` |
| Archive SHA-256 | `ACC342868C5B02F754F6DA4689EE74BF5AE636D8F2FC73EF03E514447D6BC3D0` |
| Method | `git archive` of `a8a3cb8` (sidecar on Desktop is authoritative) |
| Rollback | `wmc-pwa-layout-a8309db.zip` / `6808FECD1266A92B17A37098995D4392FD8327D4DD20FE9C6CA6B0C2F56B0488` |

## I — Database backup readiness

**BLOCKER for deploy authorisation.** No independently restorable off-server dump of `thwcxuhrzgkufvdrvzzt` found. Only:

- In-DB `_wmc_backup_*` tables (same server)
- Local `~/WMC-Backups/20261015T143108` Postgres datadir (not staging Supabase)

## J — Staging deploy instructions (after explicit GO + backup)

1. Confirm `gitAutoDeployment` null.
2. Upload `wmc-post-pwa-hotdoc-<SHA>.zip`.
3. Wait for Hostinger build completed.
4. Smoke: Golnar profile **200** (not 301); CTA → `dr-golnar-mortezaei-5`; Mary phone-only; HOLD; PWA assets; telehealth sitemap on production path only.
5. Rollback: re-upload `wmc-pwa-layout-a8309db.zip` SHA-256 `6808FECD1266A92B17A37098995D4392FD8327D4DD20FE9C6CA6B0C2F56B0488`.

## K — Production blockers

Off-box backup, physical PWA install, staging robots Hostinger short-circuit, formal smoke, DNS/env cutover checklist — production **NO-GO**.

## L — Verdict

**POST-PWA HOTDOC RELEASE — BLOCKED** for staging deploy authorisation until an independently restorable off-server backup of `thwcxuhrzgkufvdrvzzt` is verified. Local commit + archive preparation are complete.
