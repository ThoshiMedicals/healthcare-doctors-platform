# WMC — Hostinger Performance Remediation

**Date:** 2026-11-07  
**Branch:** `release/wmc-hostinger-rc1`  
**App tip:** `0e237a3` (`fix(wmc): cache public HTML and cut per-page Prisma work`)  
**Staging:** `https://mediumslateblue-eagle-960503.hostingersite.com`  
**Local reference:** `http://127.0.0.1:3000`  
**Hostinger build:** `01a1b313-8af1-73d0-b287-5654be7df088` (completed, commit `0e237a3`)  
**Evidence:** `apps/web/.tmp-perf-remediation/`  
**Prior:** `docs/WMC-FINAL-RELEASE-CANDIDATE-GATE.md` (GO FOR CUTOVER PLANNING; DNS still NO-GO)

---

## Final verdict

# **PASS**

Hosted warm navigation improved by roughly an order of magnitude with **0** HTTP 500s under concurrency 6/12. Public content markers preserved (hero authority v6, vacancies, staging noindex). Production performance readiness: **ready for cutover planning**; DNS/production cutover remains **NO-GO** until ops checklist items outside this workstream are closed.

---

## 1. Before / after (Hostinger)

| Probe | Before | After (`0e237a3`) | Notes |
| --- | ---: | ---: | --- |
| Warm sequential p50 | **2865 ms** | **210 ms** | 3 rounds × 9 routes |
| Warm sequential p95 | **12014 ms** | **1741 ms** | After p95 includes first-touch MISS rows |
| Warm HIT typical | n/a | **~180–220 ms** | `x-wmc-cache: HIT` |
| Page-to-page nav p50 | **2741 ms** | **184 ms** | Fetch matrix, warm |
| Page-to-page nav p95 | **3690 ms** | **226 ms** | Fetch matrix, warm |
| Playwright DOM nav p50 / p95 | (historically multi-second) | **289 / 449 ms** | Chromium `domcontentloaded` |
| Cache proof (patient-information) | n/a | MISS **1405 ms** → HIT **180 ms** | Same process |
| Concurrency 6 p50 / p95 | ~14 s / ~25 s (prior RC c6) | **198 / 320 ms** | 0×500 |
| Concurrency 12 p50 / p95 | 0×500 but slow | **220 / 473 ms** | 0×500, 0 DB error signals |
| Local warm p50 / p95 | 91 / 235 ms | unchanged class (~90–200 ms) | Local Postgres still fast |

Cold / first-touch MISS on Hostinger remains ~1.2–2.0 s (`document` stage ≈ 1.2 s remote Prisma). That is expected with session-pooler round-trips; warm HIT is the dominant UX for page-to-page browsing.

---

## 2. Root causes

1. **Per-request remote Prisma fan-out** on every public SSR (`force-dynamic`), amplified by Hostinger → Supabase latency and `connection_limit=1` (required to avoid `EMAXCONNSESSION`).
2. **`publishedRepeats`** ran five list queries on **every** page.
3. **`injectPractitionerGrowth`** queried all published practitioners on **every** page (only team/doctor paths need it).
4. **Duplicate clinic lookup** after `resolveClinicFromRequest`, plus **duplicate careers inject** in `getPublishedDocument` (UX later wiped early inject anyway).
5. **No HTML response cache** — every navigation re-rendered full overlays/injects.

Not fixed by raising `connection_limit` (would re-risk pooler exhaustion). Hostinger agency resource metrics API returned empty website buckets for this order; capacity inference uses functional probes instead.

---

## 3. Changes made

| Area | Change |
| --- | --- |
| `apps/web/src/documents/public-html-cache.ts` | In-process clinic+path HTML cache + repeats/host caches; generation-based invalidation; 5 min TTL safety net |
| `apps/web/src/app/(public)/[[...path]]/route.ts` | Serve cache HIT/MISS; `Server-Timing` + `x-wmc-cache`; `Cache-Control: private, no-store` (no shared CDN auth bleed) |
| `apps/web/src/documents/render-published-document.ts` | Stage timings; reuse resolved clinic; remove early careers inject |
| `apps/web/src/documents/inject-practitioner-growth.ts` | Skip DB unless team / doctors path |
| `apps/web/src/cms/repeat-bindings.ts` | Cache `publishedRepeats` per clinic generation |
| `apps/web/src/clinics/resolve-clinic.ts` | Short host→clinic cache |
| Invalidation hooks | `publishEntity`, vacancy save/delete, doctor-profile publish, EV promote |

**Commit:** `0e237a3`  
**Pooler tip retained:** `ad172cb` (ancestor; do not raise `connection_limit` blindly).

---

## 4. Cache invalidation evidence

| Evidence | Result |
| --- | --- |
| Unit tests `public-html-cache.test.ts` | HIT until clinic invalidation; clinic-scoped; repeats share generation |
| Live Hostinger HIT/MISS headers | Confirmed (`x-wmc-cache`, `Server-Timing`) |
| Publish / vacancy / practitioner / EV hooks | Wired to `invalidatePublicHtmlCache(clinicId)` |
| Auth/admin/private | Public route only; responses `private, no-store` |

Live CMS mutation against staging was **not** required for this gate (unit + hook wiring + process cache proof). Process restart also clears memory cache (deploy already restarted).

---

## 5. Content / functional smokes (post-deploy)

| Check | Result |
| --- | --- |
| `/api/health` | `{"ok":true,"database":"up","phase":"golden-import"}` |
| Homepage `hero--authority-v6` | Present |
| Join Our Team 4 vacancies + `data-careers-vacancies-root` | Present |
| Staging `noindex` | Present |
| Parity spot HTML sizes local vs Hostinger | Near-equal (+ staging noindex bytes) |
| HTTP 500 under c6/c12 | **0** |
| Production build on Hostinger | Completed successfully |

---

## 6. Instrumentation (safe)

- Response headers: `x-wmc-cache: HIT|MISS`, `Server-Timing: cache;desc=…, document;dur=…, inject;dur=…, ux;dur=…, total;dur=…`
- No secrets, connection strings, or payload bodies in timing logs.

Example MISS: `document;dur=1215, inject;dur=0, ux;dur=3` (non-team path skips growth query).

---

## 7. Prisma pool posture

- Keep `connection_limit` default **1** (or explicit low `PRISMA_CONNECTION_LIMIT`) against Supabase **session** pooler.
- Do **not** raise blindly: prior exhaustion caused intermittent 500s under concurrency.
- HTML/repeats caching reduces concurrent query pressure further.

---

## 8. Production performance readiness

| Question | Answer |
| --- | --- |
| Is Hostinger staging navigation acceptably fast when warm? | **Yes** (~200 ms HIT; Playwright ~300 ms) |
| Are first hits still slower? | **Yes** (~1–2 s) — plan for warm/keepalive or edge HTML cache later if apex needs sub-second cold |
| DNS cutover? | Still **NO-GO** — ops evidence / `LAUNCH.md` items unchanged by this work |
| Cutover planning? | Remains **GO FOR CUTOVER PLANNING**; performance no longer a soft blocker for planning |

---

## Gate board

| Board | Result |
| --- | --- |
| Hosted warm TTFB improvement | **PASS** |
| Navigation UX | **PASS** |
| Concurrency stability | **PASS** |
| Content / SEO / staging noindex preserved | **PASS** |
| Cache invalidation design + tests | **PASS** |
| Overall remediation | **PASS** |
