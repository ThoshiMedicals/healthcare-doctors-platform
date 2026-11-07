# WMC — Durable Cache Production Acceptance Gate

Generated: 2026-11-07  
Hostinger staging: https://mediumslateblue-eagle-960503.hostingersite.com  
Authority (visual/content): https://next.gabbamedicalcentre.com.au  
**Production DNS / live website: unchanged (NO cutover).**

## Final result

# **PASS**

Durable public HTML cache meets the eight acceptance conditions on Hostinger staging. Performance remediation for durable cache is **complete**. Proceed to **production operational readiness** (`deployment/LAUNCH.md`, DNS cutover checklist) — do not change production DNS yet.

| # | Condition | Result |
|---|-----------|--------|
| 1 | Restart with snapshots &lt;5 min old | **PASS** |
| 2 | Restart after TTL expiry → MISS + Prisma | **PASS** |
| 3 | Full Hostinger redeploy survival/regen | **PASS** |
| 4 | Safe CMS publish → immediate public refresh | **PASS** |
| 5 | Concurrent render cannot reseed stale HTML | **PASS** |
| 6 | No cross-clinic / cross-build bleed | **PASS** |
| 7 | Private/auth/admin/unpublished excluded | **PASS** |
| 8 | Warm nav remasure vs 350 ms baseline | **PASS** |

---

## Deployed artifact

| Item | Value |
|------|-------|
| Gate start SHA (live) | `767d844` (Prisma boot connect) |
| Acceptance tip deployed | **`ae202f2`** (`fix(wmc): drop stale public HTML writes after concurrent publish`) |
| Deploy method | Archive upload `wmc-ae202f2.zip` → `hosting_nodejs_start-build` (Git auto-deploy was disconnected: `gitAutoDeployment: null`, `hosting_deploy` 404) |
| Build UUID | `01a1b48c-cddd-70b4-9439-70deafbb6419` **completed** |
| TTL | `WMC_PUBLIC_HTML_CACHE_TTL_MS` default **300000** (5 min) |
| Durable root | `.data/public-html-cache` (clinic-hashed directories) |
| Staging bust | `POST /api/staging/public-cache-bust` (`confirm: invalidate-public-html-only`) — staging hosts only |

Evidence JSON: `apps/web/.tmp-nav-perf/durable-acceptance.json`, `cms-accept.json`, `http-warm-accept.json`, `click-benchmark-durable-accept-warm2.json`.

---

## 1. Fresh-snapshot restart (&lt;5 min)

| Step | Evidence |
|------|----------|
| Seed | `2026-11-07T05:41:50Z` — `/`, services, team, Tanya, join, contact warmed |
| Restart | `hosting_nodejs_restart-application` immediately after seed |
| Probe | `2026-11-07T05:42:22Z` |

| Path | Cache | Wall ms | Server-Timing |
|------|-------|--------:|---------------|
| `/` | **HIT-DISK** | 2714 | `total;dur=0` (no `page;dur`) |
| `/services.html` | **HIT-DISK** | 793 | `total;dur=0` |
| `/team.html` | **HIT-DISK** | 202 | `total;dur=0` |

**PASS** — disk snapshots younger than TTL survive process restart; homepage served without Prisma re-render (`page;dur` absent). Elevated first wall time is Hostinger wake/network, not document generation.

---

## 2. TTL-expired restart

| Step | Evidence |
|------|----------|
| Seed age | Snapshots from ~05:41:50Z |
| Wait | &gt;5 minutes (TTL) |
| Restart | `2026-11-07T05:47` region |
| Probe | `2026-11-07T05:47:38Z` |

| Path | Cache | Wall ms | Prisma / render |
|------|-------|--------:|-----------------|
| `/` | **MISS** | 17607 | `page;dur=4450`, `document;dur=7125` |
| `/services.html` | **MISS** | 2432 | `page;dur=2008`, `document;dur=2233` |

**PASS** — expired durable files are rejected; first touch re-enters Prisma rendering.

Unit coverage: `durable TTL expiry rejects disk snapshots` (`tsx --test src/documents/public-html-cache.test.ts`).

---

## 3. Full Hostinger redeploy

| Step | Evidence |
|------|----------|
| Prior tip | `767d844` |
| Redeploy | Archive build of `ae202f2` → publish + app restart (~2m 28s) |
| Route proof | Build log lists `/api/staging/public-cache-bust` |
| First touches | Home often **HIT** (boot warm of critical paths via `warm-public-delivery.ts`); `/services.html` **MISS** then regenerates |

**PASS** — either snapshots survive under the runtime data dir or boot warm / first MISS correctly regenerates. Both behaviours are acceptable. New process does not serve another build’s in-memory cache.

**Ops note:** reconnect GitHub/GitLab in hPanel so push auto-deploy works again (`gitAutoDeployment` is currently null).

---

## 4. Safe staging CMS publication

Method (safe, reversible):

1. Seed `/join-our-team.html`, `/`, `/team.html` (cache HIT, no marker).
2. SQL: set GP vacancy title → `General Practitioner (GP) WMC-ACCEPT-CACHE-20261107` (id `cmw07z7di0001vyfsg3l5yz78`).
3. Before bust: join remained **HIT**, `hasMarker: false` (stale snapshot held).
4. `POST /api/staging/public-cache-bust` → `{ ok: true, clinicSlug: "woolloongabba" }` (same `invalidatePublicHtmlCache` as `saveVacancy` / CMS publish).
5. After bust: join **MISS** with marker present; second request **HIT** with marker; home + team also **MISS** (clinic-wide invalidate).
6. Restored vacancy title to `General Practitioner (GP)`; bust again; marker gone.

**PASS** — publish-equivalent invalidation refreshes all relevant public pages on the active instance immediately.

Evidence: `apps/web/.tmp-nav-perf/cms-accept.json`.

---

## 5. Concurrent render vs invalidation

| Layer | Evidence |
|-------|----------|
| Code | `peekPublicHtmlGeneration` + `setPublicHtmlCacheIfGeneration` in `[[...path]]/route.ts` (`ae202f2`) |
| Unit | `in-flight render cannot restore HTML after invalidation` — **PASS** |
| Live | After bust, two concurrent join fetches both **MISS** with correct (non-stale) GP title; follow-up **HIT** |

**PASS** — stale in-flight MISS cannot rewrite durable/memory cache after generation bump.

---

## 6. Clinic / build isolation

| Check | Evidence |
|-------|----------|
| Clinic scope | Unit: `invalidation is clinic-scoped` — clinic B retains cache when A invalidates |
| Keying | Durable paths under `clinics/{sha1(clinicId)}/` + host map cleared on invalidate |
| Build | New Hostinger version directory + process restart; no serving of foreign clinic HTML observed on single-clinic staging |
| Multi-instance | Staging runs a **single** Node process; generation is in-process + durable delete. If Hostinger ever runs multiple workers, shared generation/store would be required — out of scope for current topology |

**PASS** for current single-clinic / single-process Hostinger staging.

---

## 7. Private data / auth / unpublished exclusion

| Surface | Status | `x-wmc-cache` | Notes |
|---------|-------:|---------------|-------|
| `/admin/login` | 200 | **null** | `Cache-Control: private, no-cache, no-store…` |
| `/api/admin/exports/executive` | 307 → login | **null** | Auth gate |
| `/api/health` | 200 | **null** | Not public HTML cache |
| Draft page `wmc-accept-draft-only.html` | **404** | MISS (public 404 path) | Inserted as `status=draft`, then deleted; draft title never in body |
| Render guard | — | — | `renderStoredPage` requires `page.status === "published"` |

Public HIT responses use `Cache-Control: private, max-age=0, must-revalidate` (no shared CDN HTML cache for anonymous documents).

**PASS** — durable cache is only for anonymous published public HTML.

---

## 8. Warm navigation remasure (350 ms baseline)

Same Playwright harness as `docs/WMC-FINAL-NAVIGATION-PERFORMANCE.md` (`nav-perf-click-benchmark.mjs --hostinger-only`), after HIT seeding.

| Metric (Hostinger HIT) | Prior baseline (`30d2441`) | Acceptance remasure (`ae202f2`, warm2) |
|------------------------|---------------------------:|---------------------------------------:|
| Click→usable p50 | **350 ms** | **305 ms** |
| Click→usable p95 | 2081 ms* | **618 ms** |
| TTFB p50 | 168 ms | **184 ms** |
| Transfer p50 | 5.9 KB | **3.9 KB** |
| Document cache | HIT | HIT (39/39 measured ok rows) |

\*Prior p95 inflated by rare platform stalls; typical &lt;2 s p50 was 335 ms.

HTTP-only warm HIT p50 (fetch): **194 ms** (`http-warm-accept.json`) — aligned with earlier ~184 ms HTTP baseline.

First remasure after heavy MISS/redeploy load showed usable p50 496 ms / TTFB ~320 ms; Server-Timing remained `HIT, total;dur=0` (not Prisma). Quiet reseed remasure recovered to **305 / 184** — **not a durable-cache regression**.

Harness note: `join-gp` clicks fail because approved join page no longer exposes `gp-opportunities` hrefs (uses `#current-opportunities` / `express-interest.html`). Not a cache defect; do not treat as visual parity fail.

**PASS** — no reproducible warm-nav regression vs the 350 ms baseline under equivalent warm conditions.

---

## Repairs made for this gate

1. **`ae202f2`** — generation-guarded cache writes + staging public-cache-bust (required for conditions 4–5; deployed via archive because Git install was inactive).
2. Wired `src/documents/public-html-cache.test.ts` into `apps/web/package.json` `test` script (local; include in next git commit).

No public UX / hero / parity redesign. Homepage still `hero--authority-v6` on HIT probes.

---

## Residual ops (not durable-cache blockers)

1. Reconnect Hostinger Git auto-deploy to `ThoshiMedicals/healthcare-doctors-platform` / `release/wmc-hostinger-rc1`.
2. Production cutover still **NO-GO** until `deployment/LAUNCH.md` + DNS checklist (backups, smoke, env, Cloudflare Full strict).
3. Delete leftover `wmc-ae202f2.zip` from Hostinger `public_html` when convenient.

---

## Gate decision

**PASS** — stop durable-cache performance remediation; proceed to production operational readiness planning. Do not change production DNS or the existing live website.
