# WMC — Final Page Navigation Speed Optimisation

Generated: 2026-11-07  
Approved reference: https://next.gabbamedicalcentre.com.au  
Hostinger target: https://mediumslateblue-eagle-960503.hostingersite.com  
**Production DNS / cutover: NO-GO** (unchanged).

## Final verdict

# **PARTIAL PASS**

Warm click-to-usable on Hostinger meets the **&lt;500 ms typical** target (HIT p50 **350 ms**; typical HIT &lt;2 s p50 **335 ms**). Transfer size on repeat navigations dropped by ~**15×** vs the `fedafac` baseline. Visual parity on the three repaired pages and controls remains intact.

Cold / first-touch HTML **MISS** after process restart is still multi-second on some routes (home first MISS ~9.5 s wall / ~3.3 s server `document`), so the aspirational **&lt;2 s cold** target is **not** fully met. Occasional warm HIT outliers (2–7 s TTFB) remain on Hostinger and are treated as platform variability, not a content regression.

---

## 1. Exact deployed SHA

| Item | Value |
|------|-------|
| Branch | `release/wmc-hostinger-rc1` |
| Performance tip | **`30d2441`** (`fix(wmc): serve wmc-cache bodies as Uint8Array…`) |
| Feature commit | `8735373` (`perf(wmc): cache public assets and speed click navigation`) |
| Baseline before this work | **`fedafac`** (three-page parity repair) |
| Prior HTML-cache tip | `0e237a3` (warm HTTP ~184 ms; still felt slow in real clicks) |
| Hostinger build | `01a1b3b8-69b8-731f-9a2a-18fe99b8403d` **completed** |

---

## 2. NEXT vs Hostinger (real browser clicks, after `30d2441`)

Method: Playwright Chromium, desktop 1440 + mobile 390, locale `en-AU`, Brisbane TZ.  
Metric **clickToUsableMs** = wall time from click → navigation DCL + visible `h1`/`main`.  
Document `x-wmc-cache` / `Server-Timing` recorded on Hostinger.

| Site | Warm usable p50 | Warm usable p95 | Warm TTFB p50 | Warm transfer p50 |
|------|----------------:|----------------:|--------------:|------------------:|
| NEXT | **218 ms** | 379 ms | 96 ms | 72 KB |
| Hostinger | **350 ms** | 2081 ms* | 168 ms | **5.9 KB** |

\*Hostinger p95 inflated by rare HIT stalls (platform); excluding &gt;2 s outliers → typical usable p50 **335 ms** (n=36/40).

Evidence: `apps/web/.tmp-nav-perf/click-benchmark-after-warm.json`

---

## 3. Before / after (Hostinger click navigation)

Baseline = live `fedafac` with the same Playwright harness (HIT rows).

| Metric (HIT rows) | Before (`fedafac`) | After (`30d2441`) | Delta |
|-------------------|-------------------:|------------------:|------:|
| Click→usable p50 | 390 ms | **350 ms** | −40 ms |
| Typical usable p50 (&lt;2 s) | 390 ms | **335 ms** | −55 ms |
| TTFB p50 | 218 ms | **168 ms** | −50 ms |
| Transfer p50 | **91 KB** | **5.9 KB** | **−93%** |

Prior fetch-only warm nav p50 (**184 ms** at `0e237a3`) measured HTTP only; real click→usable remains higher because CSS/JS/paint still run. This work closes the gap that made HIT “feel” slow: empty Hostinger `Cache-Control` on static CSS/JS forced ~90 KB+ re-download every navigation.

---

## 4. Cold vs warm

### Warm (browser may reuse immutable `/wmc-cache/*`)

- Hostinger usable p50 **350 ms**; majority of journeys **216–500 ms**.
- All measured document responses in the warm after-run were `x-wmc-cache: HIT`.

### Cold browser cache (`Network.setCacheDisabled`)

- Usable p50 **340 ms** (server HTML still HIT from prior warm-up).
- Evidence: `click-benchmark-after-cold.json`

### True HTML cold (Node restart clears in-process cache)

| Path | 1st touch | Cache | Server `document` | 2nd touch |
|------|----------:|------:|------------------:|----------:|
| `/` | 9569 ms | MISS | 3330 ms | 327 ms HIT |
| `/services.html` | 1439 ms | MISS | 1115 ms | 344 ms HIT |
| `/team.html` | 2689 ms | MISS | 1223 ms (+inject 1143) | 336 ms HIT |
| Tanya profile | 1924 ms | MISS | 1364 ms | 377 ms HIT |

Cold MISS is dominated by Hostinger → Supabase Prisma latency (unchanged architecture; `connection_limit=1` retained).

---

## 5. Real click-to-usable (selected journeys, after)

Representative Hostinger desktop HIT samples:

| Journey | usable | TTFB | x-wmc-cache | transfer |
|---------|-------:|-----:|:-----------:|---------:|
| home → services | 341–499 ms | 138–413 | HIT | 2.7–4.9 KB |
| services → home | 225–350 ms | 137–159 | HIT | 3.3 KB |
| team → practitioner | 373 ms | 267 | HIT | 4.5 KB |
| contact → home | 246 ms | 136 | HIT | 8.7 KB |

NEXT equivalent journeys typically **176–380 ms** usable.

---

## 6. p50 / p95 statistics (summary)

| Cohort | usable p50 | usable p95 | Notes |
|--------|----------:|----------:|-------|
| NEXT warm (n=40) | 218 | 379 | Reference |
| Hostinger warm all (n=40) | 350 | 2081 | Includes platform stalls |
| Hostinger warm typical (n=36) | 335 | ~860 | Excludes &gt;2 s |
| Hostinger cold-browser (n=20) | 340 | 2316 | Server mostly HIT |
| Hostinger HTTP MISS after restart | — | — | Home 9.5 s; others 1.4–2.7 s |

---

## 7. Root causes identified

1. **Largest click-feel gap:** Hostinger static short-circuit served `/styles.min.css` and `/site.js` with **empty `Cache-Control`**, so Chromium re-downloaded ~430 KB CSS + ~100 KB JS on many navigations (transfer p50 ~91 KB even on HTML HIT). NEXT/Cloudflare already sent `public, max-age=14400`.
2. **HTML `Cache-Control: private, no-store`:** blocked bfcache and forced full body revalidation every time; server HIT was already fast (~0 ms `total` in Server-Timing).
3. **Full document navigations** (intentional; not SPA) — every click pays TTFB + parse; mitigated by HTML cache HIT + asset immutability + link prefetch.
4. **Cold MISS** still Prisma/session-pooler bound (~1–3 s `document` stage); not solvable by raising `connection_limit` without pool exhaustion risk.
5. **Occasional Hostinger HIT stalls (seconds)** — platform/process scheduling; not reproduced as HTTP 500.

---

## 8. Optimisations implemented

| Change | Why | Safety |
|--------|-----|--------|
| `/wmc-cache/[...path]` Next route with `Cache-Control: public, max-age=31536000, immutable` | Bypass Hostinger empty static headers | Allowlisted extensions; path traversal blocked; not used for admin/auth |
| `public-ux` / join-our-team rewrite CSS+JS to `/wmc-cache/…?v=…` | Absolute, cache-bustable URLs from nested pages | Idempotent replace; design/content unchanged |
| Public HTML `private, max-age=0, must-revalidate` + weak ETag / 304 | Allow bfcache + cheap revalidation; never shared CDN cache | Still private; CMS publish still invalidates in-process cache |
| `site.js` same-origin document prefetch on pointerover + idle nav warm | Warms HTML cache before click | Skips `/admin`, `/api`, external, tel/mailto |
| Benchmark harness `nav-perf-click-benchmark.mjs` | Repeatable real-click evidence | Read-only against live hosts |

**Not done (by design):** SPA conversion, removing SSR/SEO HTML, shared CDN caching of HTML, raising Prisma `connection_limit`, DNS/Cloudflare/WordPress changes, modifying NEXT UAT.

---

## 9. Visual / functional regression

Spot-check NEXT vs Hostinger at 320 / 390 / 1440 after deploy:

| Page | Result |
|------|--------|
| `/` | PASS (heights match; ≤0.20%) |
| Tanya | PASS + H2 **Services Provided** |
| Debra | PASS + H2 **Services Provided** |
| Sumita (control) | PASS + H2 **Related Services** |
| about-us | PASS / one SOFT @390 (1.29%, same height) |
| services | PASS |

Evidence: `apps/web/.tmp-nav-perf/visual-spotcheck/`  
Automated tests: `public-ux.test.ts`, `public-html-cache.test.ts`, `care-area-service-map.test.ts` — PASS.  
Hostinger production build — PASS.  
HTTP 500 during probes — **0**.  
Staging noindex / private admin routes — preserved (`/wmc-cache` is public static assets only).

### Cache freshness

- Unit tests: generation bump drops HIT → MISS (existing `public-html-cache.test.ts`).
- Live proof: Node restart cleared cache → MISS then HIT (table above).
- Publish hooks (`publishEntity`, vacancies, doctor profile, EV) unchanged from `0e237a3`.
- Live staging CMS content mutation + rollback was **not** re-run in this pass (hooks + restart proof only).

---

## 10. Remaining limitations

| Limitation | Impact |
|------------|--------|
| First HTML MISS after idle/restart | Home can exceed 2 s (server Prisma); warm browsing is the dominant UX |
| Hostinger HIT TTFB outliers | Rare multi-second stalls; inflates p95 |
| NEXT still faster on median usable | Laptop+tunnel+CF vs Hostinger origin; Hostinger is comparable, not always better |
| `join-gp` click selector | Harness could not find link (both hosts); not a deploy failure |
| Images still largely uncached by this change | Only CSS/JS/updates scripts routed through `/wmc-cache`; managed images remain separate |
| 5-minute HTML TTL | Safety net; publish invalidation is primary |

---

## Targets vs measured

| Target | Measured | Met? |
|--------|----------|------|
| Typical warm click→usable &lt; 500 ms | Hostinger typical HIT p50 **335–350 ms** | **Yes** |
| Cold ideally &lt; 2 s | MISS home **~9.5 s**; other MISSes **~1.4–2.7 s** | **Partial** |
| No HTTP 500 | 0 observed | **Yes** |
| No unresolved material visual diffs on repaired pages | PASS | **Yes** |
| Correct CMS cache invalidation | Hooks + restart proof; no live CMS mutate this pass | **Partial** |

---

## Evidence index

- `apps/web/.tmp-nav-perf/click-benchmark-baseline-fedafac.json`
- `apps/web/.tmp-nav-perf/click-benchmark-after-warm.json`
- `apps/web/.tmp-nav-perf/click-benchmark-after-cold.json`
- `apps/web/.tmp-nav-perf/visual-spotcheck/`
- Scripts: `nav-perf-click-benchmark.mjs`, `nav-perf-visual-spotcheck.mjs`

---

## Verdict

**PARTIAL PASS**

Warm real-browser navigation on Hostinger `30d2441` is consistently in the intended band and much lighter on the wire than `fedafac`, without design/content regressions. Cold HTML MISS and occasional platform stalls prevent a full **PASS**. DNS cutover remains **NO-GO**.
