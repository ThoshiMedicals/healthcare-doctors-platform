# WMC — Staging Parity Remediation (Phase 7)

**Date:** 2026-11-06  
**Branch:** `release/wmc-hostinger-rc1`  
**Deployed SHA (Hostinger):** `ad172cb78ef8089a09231ea49f16f4eb3910a007`  
**Build:** `01a1b133-1459-708e-8ed6-a93c9a7b1c7d` (completed)  
**Local reference:** `http://127.0.0.1:3000` + Postgres `wmc` (not mutated)  
**Staging target:** `https://mediumslateblue-eagle-960503.hostingersite.com` + Supabase `thwcxuhrzgkufvdrvzzt`

**Verdict:** **PARITY WITH DOCUMENTED EXCEPTIONS**

---

## 1. Baselines frozen before mutation

| Field | Value |
| --- | --- |
| Pre-repair Hostinger SHA | `9c551f6` |
| Pre-repair published paths | 226/226 match |
| Pre-repair content SHA mismatches | **27** published pages |
| Pre-repair active vacancies | local 4 / staging 0 |
| Pre-repair knowledge topics | local 22 / staging 21 (missing `index`) |
| Pre-repair media_assets | local 37 / staging 0 |
| Pre-repair HTTP 500 | Confirmed under concurrency — Prisma `EMAXCONNSESSION` (pool_size 15) |

Rollback: vacancies backup captured via SQL before inserts; page history preserved by **inserting new** `page_revisions` (no in-place rewrite of historical revisions). Synthetic staging vacancy `cmw50kmcw…` retained closed.

---

## 2. Phase 1 — HTTP 500 root cause and fix

**Root cause:** Concurrent public renders opened multiple Prisma connections against Supabase **session** pooler; pool exhausted (`PrismaClientUnknownRequestError` / `EMAXCONNSESSION`), yielding intermittent HTTP 500 / empty slow responses.

**Fix (code):** `apps/web/src/db/prisma.ts`
- Force `connection_limit` (default `1`, overridable via `PRISMA_CONNECTION_LIMIT`)
- Set `pgbouncer=true` when URL port is `6543`
- Always retain global Prisma singleton in production

**Commit:** `ad172cb` — `fix(wmc): cap Prisma pool for Supabase session pooler`  
**Deployed:** yes (Hostinger Node build completed on this SHA)

**Verification (bounded concurrency):**
- Sequential key routes: all **HTTP 200** (pages ~17–39s cold)
- Parallel burst **6** routes: **0** failures
- Parallel burst **12** routes: **0** failures (`statuses` all 200)
- `/api/health`: `{"ok":true,"database":"up","phase":"golden-import"}`

Runtime log API (`hosting_nodejs_runtime-logs`) returned Hostinger HTTP 500 — log pull **NOT VERIFIED**; functional probes used instead.

---

## 3. Phase 2 — Public CMS records restored

| Record | Action | Result |
| --- | --- | --- |
| Vacancy `cmw07z7di…` GP | UPSERT active `now_hiring` | Restored |
| Vacancy `cmw07z7dm…` Practice Nurse | UPSERT active `now_hiring` | Restored |
| Vacancy `cmw07z7do…` Medical Receptionist | UPSERT active EOI | Restored |
| Vacancy `cmw07z7dq…` Allied Health | UPSERT active EOI | Restored |
| Knowledge topic `index` | INSERT linked to staging page `2e954939-…` | Restored (22 published topics) |
| Synthetic closed vacancy | Preserved | Intact |

Live check: `/join-our-team.html` HTML contains all four approved titles.

---

## 4. Phase 3 — Media restore

| Metric | Result |
| --- | ---: |
| `media_assets` rows on staging | **37** |
| On-disk bytes restored via Hostinger git public tree | **33** paths (HTTP **200** samples: portraits, brand, hero) |
| Metadata-only / non-disk | **4** |

Non-disk / intentional gaps:
1. `assets/team/dr-gemunu-suresh-ranawake.webp` (+640) — removed practitioner; no local bytes
2. Wikimedia Gabba URL — external reference only
3. `wp-content/uploads/2025/05/img2.png` — legacy WP path; not in repo public tree

Checksums written into `media_assets.content_sha256` / `byte_size` for on-disk assets (evidence: `apps/web/.tmp-parity-repair/media-verify.json`).

Private uploads were **not** published; `PRIVATE_OBJECT_STORE` / synthetic private_objects left alone.

---

## 5. Phase 4 — Published HTML revision sync

| Metric | Result |
| --- | ---: |
| Pre-repair SHA mismatches | 27 |
| New immutable revisions inserted | 27 (`parity_<sha24>`) |
| Post-repair published SHA mismatches vs local | **0 / 226** |
| Historical revisions rewritten | **No** |

Pages synced (care-triangle / FAQ / knowledge hub body deltas): 12 knowledge articles, 8 knowledge hubs, 7 service pages (manifest: `apps/web/.tmp-parity-repair/rev-sql-manifest.json`).

`index.html`, `join-our-team.html`, `gp-opportunities.html` already matched at DB SHA before repair; vacancy gaps were CMS-data, not revision HTML.

---

## 6. Phase 5 — Schema / configuration

| Check | Result |
| --- | --- |
| Prisma migration names (28) | Align local folder ↔ staging `_prisma_migrations` including `20261106210000_private_objects` |
| Schema equalisation by row count | **Not performed** |
| Staging RLS / Data API / auth / noindex | Preserved |
| Synthetic staging accounts/tests | Preserved |

Intentional environment differences remain (clinic id re-key, PG major 18 local vs 17 staging, synthetic rows, staging noindex).

---

## 7. Phase 6 — Validation summary

| Gate | Result |
| --- | --- |
| Published path inventory | 226/226 |
| Published content SHA | **226/226 match** |
| Active vacancies render | **PASS** (4/4 titles on Join Our Team) |
| Knowledge topics | **22** published |
| Media inventory | **37** rows; sample public URLs **200** |
| HTTP errors under 12-way concurrency | **0** failures after pool fix |
| Hostinger production build | **PASS** (`ad172cb`) |
| Full automated unit test run | **NOT VERIFIED** (local vitest alias resolution failed outside Next harness) |
| Full-page Playwright (6 routes × 5 widths) | Captured; **0** byte-identical PNG pairs |

### Visual note

Exact PNG SHA match is **not** expected across localhost vs Hostinger (staging `noindex`/robots injection, hostname, Next chunk hashes, anti-aliasing). Material prior failures (missing vacancy cards; care-triangle HTML deltas) were addressed via CMS/data + revision sync. Opening-hours **casing** still appears mixed on staging render (`7:00am` in baked copy vs overlay `7:00 AM`); local shows spaced `AM`/`PM`. Classified **cosmetic**, not clinical content drift. Sticky care-bar copy in `public-ux.ts` uses `7am–7pm` by design.

Evidence: `apps/web/.tmp-parity-repair/fullpage/`, `probe` outputs, `verify-live-content.mjs` results.

---

## 8. Remaining discrepancies (documented)

1. Screenshot pixel/byte identity across environments (noise)  
2. Homepage hours casing cosmetic residual  
3. Four media rows without repo bytes (Gemunu / Wikimedia / legacy WP)  
4. Staging synthetic closed vacancy + private_objects test rows (intentional)  
5. Clinic primary key re-key (`clinic_woolloongabba` vs local cuid)  
6. Hostinger TTFB still high (~15–50s under load) — reliability improved (no 500s in probes) but performance not equal to local  
7. Full 226-URL visual crawl not re-executed this pass (sampled priority set)

---

## 9. Category board (post-remediation)

| Category | Status |
| --- | --- |
| CODE PARITY | **PASS** (`ad172cb` deployed) |
| CONTENT PARITY | **PASS** (published SHA 226/226; vacancies/topics restored) |
| ASSET PARITY | **PASS WITH EXCEPTIONS** (37 rows; 33 byte-backed; 4 documented non-disk) |
| DATABASE PARITY | **PASS WITH EXCEPTIONS** (approved public records aligned; intentional synthetics/re-keys remain) |
| FUNCTIONAL PARITY | **PASS WITH EXCEPTIONS** (500s resolved under tested concurrency; deep admin write cycles not re-audited) |
| VISUAL PARITY | **PASS WITH EXCEPTIONS** (material content gaps closed; PNG identity + hours casing noise remain) |

---

## 10. Safety

- Local reference DB: **not modified**  
- WordPress / live DNS / production Cloudflare: **not touched**  
- No real applicant notifications sent  
- No wholesale DB clone  
- Staging-only release branch used for code deploy  

**DNS cutover:** not started.
