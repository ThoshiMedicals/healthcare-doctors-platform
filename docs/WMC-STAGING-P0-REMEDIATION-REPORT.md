# WMC — Staging P0 Remediation Report

**Date:** 2026-11-06  
**Branch:** `release/wmc-hostinger-rc1`  
**Staging host:** `https://mediumslateblue-eagle-960503.hostingersite.com`  
**Supabase:** `wmc-hostinger-staging` (`thwcxuhrzgkufvdrvzzt`)  
**Pre-remediation tip:** `a545991`  
**Scope:** Phase 6 — SEO noindex, approved local practitioner/Attraction parity, durable private storage, CMS/recruitment readiness

---

## Original P0 issues

| # | Issue | Pre-fix status |
| --- | --- | --- |
| 1 | Staging noindex | FAIL — public pages indexable; robots Allow; sitemap advertised production URLs |
| 2 | Missing approved local practitioner / Attraction content | FAIL — staging 207 pages / 12 practitioners vs local 226 / 15 |
| 3 | Private upload persistence | NOT VERIFIED — Hostinger deploy tree not durable for CVs / GP readiness |

---

## Exact repairs

### Phase 1 — Staging SEO indexing lock (code)

| Item | Implementation |
| --- | --- |
| Detection | `isStagingNoIndexHost()` — `*.hostingersite.com`, `STAGING_NOINDEX=true`, or `UAT_QUICK_TUNNEL=true` |
| X-Robots-Tag | Middleware + public HTML route + optional `next.config` headers when `STAGING_NOINDEX=true` |
| Meta robots | `applyStagingNoIndexMeta()` rewrites `robots` / `googlebot`; **preserves production canonical link tags** |
| robots.txt | Staging body: `Disallow: /` (no Sitemap line) |
| sitemap.xml | Empty urlset (no loc entries) |
| Production safety | Apex `gabbamedicalcentre.com.au` is **not** matched by host rule; WordPress apex untouched |

**Files:** `apps/web/src/seo/staging-noindex.ts`, `.test.ts`, `middleware.ts`, `next.config.ts`, `src/app/(public)/[[...path]]/route.ts`, `package.json` (test include)

### Phase 2 — Approved local content restore (database only)

Source of truth: local published CMS export (not golden-only). Gap vs golden = post-golden Attraction + three practitioners.

| Practitioner | ID | Status | Booking | Portrait |
| --- | --- | --- | --- | --- |
| Dr Golnar Mortezaei | `cmw4brle60007vyccj4m7u3nb` | published | phone-only (`booking_url` null) | `../assets/team/dr-golnar-mortezaei.webp` |
| Dr James Chanaka | `cmw4brm8u000hvyccuku7wzdl` | published | HotDoc URL present | `../assets/team/dr-james.webp` |
| Dr Yamesha Ranatunga | `cmw4d33gh0007vylsew0deys5` | published | HotDoc URL present | null (approved local also null; asset absent in repo) |
| Dr Gemunu Suresh Ranawake | — | **kept unpublished** | — | not restored as published (local `on_hold`) |

**Pages restored (19):** 3 practitioner HTML, 2 welcome updates, 4 about-us Attraction, 10 join-our-team Attraction.

**Method:** base64 chunk stage → `_wmc_apply_parity_page` → practitioner upserts → helper objects dropped.

**Live HTTP (pre-code redeploy):** all restored Attraction + practitioner paths return **200**; Golnar/James portraits **200**.

### Phase 3 — Durable private storage (code + schema)

| Decision | Detail |
| --- | --- |
| Hostinger filesystem | Not reliable across redeploy for private docs |
| Chosen store | Postgres `private_objects` in staging Supabase (Prisma; app role only) |
| Activation | `PRIVATE_OBJECT_STORE=postgres` (runtime) |
| Fallback | Existing `CAREER_RESUME_DIR` / `GP_READINESS_STORAGE_DIR` filesystem paths |
| Keys | Unpredictable `purpose/<48-hex>/<safeName>`; storage path prefix `pg:` |
| Public access | Table RLS on; `anon`/`authenticated` revoked; no public object URLs |
| Secrets | No `service_role` in browser; retrieve only via authenticated admin routes |

**Files:** `src/storage/private-object-store.ts`, Prisma model + migration `20261106210000_private_objects`, careers + GP readiness upload/retrieve wiring.

**Env note:** Hostinger `replace-environment-variables` is a **full replace**. Agent does **not** hold staging `DATABASE_URL`, so env was **not** rewritten. Operator must add (without deleting existing keys):

- `STAGING_NOINDEX=true` (belt-and-suspenders for build-time static headers; host match already covers HTML)
- `PRIVATE_OBJECT_STORE=postgres`

Then restart/rebuild as appropriate.

### Phase 4 — CMS / recruitment acceptance

Deferred until code SHA is live with `PRIVATE_OBJECT_STORE=postgres`. Synthetic-only plan remains: draft→publish, vacancy/application, GP readiness upload/retrieve, deny unauthenticated. No real applicant data.

---

## Final counts (staging DB)

| Metric | Value |
| --- | --- |
| Published pages | **226** (matches approved local published count) |
| Published practitioners | **15** |
| All practitioners | **15** (Gemunu not present as published; on_hold preserved by omission) |
| Golden subset | Preserved (207 + 19 approved deltas) |

---

## Verification matrix

| Check | Result |
| --- | --- |
| Restored pages HTTP 200 | **PASS** (content already live via DB) |
| Attraction link destinations | **PASS** (spot-checked restored paths) |
| Staging HTML X-Robots + meta | **PASS** on live `369cd06` (`noindex, nofollow, noarchive`) |
| Staging sitemap.xml | **PASS** — empty urlset + X-Robots |
| Staging robots.txt | **PARTIAL** — Hostinger CDN (`hcdn`) injects platform robots for `*.hostingersite.com` (Googlebot Disallow; `*` Allow). App route is correct; CDN may override `/robots.txt` only |
| Production canonicals | **PASS** — preserved on HTML (e.g. services, practitioners) |
| Storage durability end-to-end | **PENDING** operator `PRIVATE_OBJECT_STORE=postgres` (agent lacks `DATABASE_URL` for safe full env replace) |
| CMS / recruitment synthetic AT | **PENDING** after private-store env |
| Automated tests | **PASS** — 351/351 |
| Production build | **PASS** |
| Hostinger deploy | **PASS** — auto-deploy `369cd06` completed |
| Production WordPress / DNS / CF | **Unchanged** |
| Local UAT | **Unchanged** |

---

## GitHub / Hostinger SHA

| Item | Value |
| --- | --- |
| Pre-fix deployed SHA | `a545991` |
| Remediation commits | `ee05803` (noindex + private_objects), `369cd06` (robots/sitemap app routes) |
| Hostinger post-deploy SHA | **`369cd06261dfe5c830a703734fadbd2512e8e6a1`** |

---

## Remaining launch blockers

1. Operator adds `PRIVATE_OBJECT_STORE=postgres` (and optionally `STAGING_NOINDEX=true`) in hPanel **without** deleting `DATABASE_URL` / auth vars — Hostinger replace API is full-replace and agent cannot read masked secrets.
2. Complete synthetic CMS + recruitment + private-doc durability tests on staging after env is set.
3. Existing production cutover ops checklist (VPS backup, formal smoke, Cloudflare Full strict, etc.).

---

## Verdict

**PARTIAL PASS** — approved local content parity restored (226/15); live HTML noindex + empty sitemap verified on Hostinger tip `369cd06`; private storage code shipped but durability AT blocked on env; CMS/recruitment AT pending.
