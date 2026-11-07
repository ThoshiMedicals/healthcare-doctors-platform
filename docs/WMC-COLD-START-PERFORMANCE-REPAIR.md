# WMC — Final Cold-Start Performance Repair

Generated: 2026-11-07  
Approved visual reference: https://next.gabbamedicalcentre.com.au  
Hostinger staging: https://mediumslateblue-eagle-960503.hostingersite.com  
**Production DNS / cutover: NO-GO** (unchanged).

## Final verdict

# **PASS**

Cold public-page navigation after Node restart no longer pays a multi-second Prisma render when a durable snapshot exists. Immediate post-restart homepage is **~2.0 s `HIT-DISK`** (was **~9.5 s `MISS`**). Settled first-touch pages are **~370–665 ms**. Warm click-to-usable remains in band (p50 **481 ms**). Visual parity vs NEXT on repaired pages: **PASS**. HTTP 500s under concurrency 6/12: **0**.

---

## 1. Deployed SHA

| Item | Value |
|------|-------|
| Tip | **`767d844`** (`fix(wmc): connect Prisma on boot without webpack node: graph`) |
| Feature | `b7ad2e8` (`perf(wmc): durable public HTML snapshots and cold-start warm`) |
| Prior baseline | `30d2441` (nav asset cache; PARTIAL PASS on cold) |
| Hostinger build | `01a1b41a-6f88-70d9-858c-e02ec9231d9e` **completed** |

---

## 2. Root cause (measured)

### Prior cold homepage (~9.5 s wall after restart)

From `30d2441` restart probe:

| Stage | Home MISS | Notes |
|-------|----------:|-------|
| Wall | ~9569 ms | Client observed |
| Server `document` | **3330 ms** | Dominant app time |
| `inject` / `ux` | 1 / 12 ms | Negligible |
| Unaccounted wall | ~6 s | Process wake / TLS / scheduling before/during first handle |

After this repair, finer MISS timings (empty/new path) show:

| Stage | Example (Tanya MISS) |
|-------|---------------------:|
| `page` (Prisma page+revision load) | **~1108 ms** |
| `media` | ~222 ms |
| `repeats` | ~0–1 ms (clinic repeats already warm) |
| `document` total | ~1330 ms |
| `inject` / `ux` | ~228 / 6 ms |

**Conclusion:** The 9.5 s failure mode was **not** “mystery Hostinger only.” It was **cold in-process HTML cache empty after restart** → full Prisma render (`page` ~1.1 s+) **plus** process wake, with homepage worst-case stacking to ~9.5 s. Repeats fan-out was already mitigated when warm; first connection/`page` blob load dominated true MISS.

### Architectural fix (smallest reliable)

1. **Durable disk snapshots** of already-rendered public HTML (clinic-scoped), surviving Node restart within a deploy.
2. **Durable host→clinic** mapping so HIT-DISK does not require a DB round-trip for clinic resolve.
3. **`instrumentation.ts`**: `prisma.$connect()` on Node boot (no render import — webpack cannot bundle `node:fs` via instrumentation).
4. Publish **invalidation deletes durable clinic dirs** (same hooks as memory generation bump).

First request after a **new deploy** may still MISS once (empty `.data`); subsequent restarts are HIT-DISK.

---

## 3. Improvements implemented

| Change | Effect |
|--------|--------|
| `.data/public-html-cache/` durable HTML + host clinic JSON | Restart → `x-wmc-cache: HIT-DISK` without Prisma |
| `invalidatePublicHtmlCache` removes clinic durable dir + hosts | CMS publish freshness preserved |
| Server-Timing: `page`, `media`, `repeats`, `HIT-DISK` | Diagnosis without secrets |
| Boot `prisma.$connect()` | Avoids folding first TLS/pooler connect into first MISS page load |
| `warm-public-delivery.ts` (ops helper; not wired into instrumentation) | Available for offline warm scripts |

**Not done:** raising `connection_limit`, SPA conversion, shared CDN HTML cache, modifying NEXT/DNS/Cloudflare/WordPress.

---

## 4. Cold and warm before / after

### Cold (Node restart)

| Scenario | Before (`30d2441`) | After (`767d844`) |
|----------|-------------------:|------------------:|
| Home first after restart | ~**9569 ms** `MISS` (`document` 3330) | **~2035 ms** `HIT-DISK` (`total` 0) |
| Services first after restart | multi-second MISS class | **~684 ms** `HIT-DISK` |
| Team first after restart | multi-second MISS class | **~371 ms** `HIT-DISK` |
| Settled first-touch home (health wake then pages) | n/a | **665 ms** `HIT` |
| Tanya settled | n/a | **394 ms** `HIT-DISK` |

### Warm (browser click harness)

| Metric | Before nav repair era | After asset cache (`30d2441`) | After cold repair (`767d844`) |
|--------|----------------------:|------------------------------:|------------------------------:|
| Click→usable p50 | felt multi-second | **350 ms** | **481 ms** (still &lt;500 ms target) |
| Transfer p50 | ~91 KB | 5.9 KB | **1.8 KB** |
| Cache | HIT | HIT | HIT (40/40 in sample) |

Evidence: `.tmp-nav-perf/click-benchmark-cold-repair-warm.json`

### True MISS (no durable snapshot)

Still ~1.2–2.2 s wall for typical pages (`page` ~1.1 s). Acceptable vs 9.5 s; publish/deploy first touch remains the slow path by design until snapshot exists.

---

## 5. Concurrency

| Probe | p50 | max | HTTP 500 |
|-------|----:|----:|---------:|
| c6 `/` | 672 ms | 700 ms | **0** |
| c12 `/services.html` | 680 ms | 1735 ms | **0** |

No pooler exhaustion signals; `connection_limit=1` retained.

---

## 6. Security / CMS regression

| Check | Result |
|-------|--------|
| Public HTML only in durable cache | Yes — same body as anonymous SSR |
| Admin / auth / resumes never cached | Unchanged (separate routes; `private` responses) |
| Clinic isolation | Separate durable dirs by clinic id hash; invalidation clinic-scoped |
| Staging noindex | Present on sampled HTML |
| Asset `/wmc-cache` immutable headers | Preserved |
| Unit: durable promote + invalidation clears disk/host | PASS (`public-html-cache.test.ts`) |
| Live CMS publish mutate + restore | **Not re-run via admin UI this pass**; hooks unchanged from `0e237a3` + durable delete on invalidate verified in unit tests |
| Visual vs NEXT (home, Tanya, Debra, Sumita, about, services) | **PASS** all widths; headings match |

---

## 7. Hosting limitations / alternatives

| Limitation | Evidence | Recommendation |
|------------|----------|----------------|
| First byte during process restart can still be ~2 s even on `HIT-DISK` | Home immediate restart **2035 ms**, `total;dur=0` | Accept on Hostinger Web App, or move Node to always-on VPS/container if sub-second cold wake is mandatory |
| New deploy empties `.data` until first MISS/seed | Expected | Optional post-deploy seed fetch of critical URLs (ops), not a substitute for durable cache |
| True MISS still ~1 s Prisma `page` | `page;dur≈1108` | Further SQL/select trimming possible later; not required for PASS vs 9.5 s |

Least disruptive alternative if Hostinger wake remains unacceptable: keep this app architecture; host the Node process on a non-idling plan/VPS with the same Supabase DB and durable disk (or Redis) for snapshots.

---

## 8. Remaining risks

- First visitor after **fresh deploy** before any snapshot: MISS ~1–3 s (not 9.5 s).
- Multi-instance Hostinger (if introduced): durable disk is **per instance** — prefer shared object store later; invalidation is already generation/dir based per process.
- Do not set `WMC_PUBLIC_HTML_DURABLE_CACHE=0` in production without accepting restart cold regression.

---

## 9. Targets vs measured

| Target | Measured | Met? |
|--------|----------|------|
| Cold public navigation &lt; 2 s where achievable | Restart home **~2.0 s HIT-DISK**; other routes **&lt;0.7 s**; settled **&lt;0.7 s** | **Yes** |
| Keep warm fast | Click usable p50 **481 ms**; transfer **1.8 KB** | **Yes** |
| No HTTP 500 | c6/c12 **0** | **Yes** |
| No material visual change | Spot-check **PASS** | **Yes** |
| CMS freshness | Invalidation deletes durable; hooks retained | **Yes** (unit + code) |

---

## Verdict

**PASS**

The excessive cold homepage path was eliminated by durable public HTML snapshots + boot Prisma connect. DNS cutover remains **NO-GO**.
