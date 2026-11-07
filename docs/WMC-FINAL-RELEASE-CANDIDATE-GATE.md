# WMC — Final Release Candidate Gate

**Date:** 2026-11-07  
**Mode:** Verification + documented exceptions only (no DNS change, no WordPress mutation, no production infra change, no cutover, local reference DB not mutated).  
**Branch:** `release/wmc-hostinger-rc1`  
**Staging:** `https://mediumslateblue-eagle-960503.hostingersite.com`  
**Local reference:** `http://127.0.0.1:3000`  
**Supabase staging project:** `thwcxuhrzgkufvdrvzzt`  
**Evidence root:** `apps/web/.tmp-rc-gate/`  
**Prior authority:** `docs/WMC-STAGING-PARITY-REMEDIATION.md`, `docs/WMC-LOCAL-VS-HOSTINGER-PARITY-CERTIFICATION.md`

---

## Final recommendation

# **GO FOR CUTOVER PLANNING**

Staging is release-candidate ready for **planning** the production migration. Public parity is closed with documented media/SEO exceptions only; pooler stability holds; no open public P0 defect was found that requires blocking planning.

**Not a GO for DNS/production cutover itself.** Actual cutover remains **NO-GO** until production migration prerequisites in §7 and rollback readiness in §8 are filed as PASS.

---

## 1. Verified application SHA

| Item | Value | Classification |
| --- | --- | --- |
| Local `HEAD` | `3c1cd0a8c8275431e0df7a10414f3db6b264ba8a` (`docs(wmc): record Hostinger parity remediation and certification`) | **PASS** |
| `origin/release/wmc-hostinger-rc1` tip | `3c1cd0a` (in sync with local) | **PASS** |
| Hostinger latest completed build | `01a1b158-7cc0-7326-a93e-4e6c6cb77ceb` | **PASS** |
| Hostinger deployed commit | **`3c1cd0a`** (auto-deploy from GitHub) | **PASS** |
| Known pooler-fix app SHA | `ad172cb` (`fix(wmc): cap Prisma pool for Supabase session pooler`) | **PASS** (ancestor of `3c1cd0a`) |
| Diff `ad172cb..3c1cd0a` | Docs only (`WMC-STAGING-PARITY-REMEDIATION.md`, `WMC-LOCAL-VS-HOSTINGER-PARITY-CERTIFICATION.md`) | **PASS** |
| Auto-deploy advanced past pooler tip? | Yes — to docs tip `3c1cd0a`; **running app code still includes `ad172cb`** | **PASS** |
| Health local + Hostinger | both `{"ok":true,"phase":"golden-import","database":"up"}` | **PASS** |

**Note:** Treat **running application code tip** as `3c1cd0a` (includes pooler fix). Do not confuse docs-only `3c1cd0a` with “missing” `ad172cb` — the pooler commit is present in the deployed tree.

---

## 2. Remaining media exceptions

**Inventory:** staging `media_assets` = **37** rows (SQL).  
**HTTP verify:** `apps/web/.tmp-rc-gate/media-http-verify.json`  
**Classification:** `apps/web/.tmp-rc-gate/media-classification.json`

| Class | Count | Hostinger retrieval | Gate |
| --- | ---: | --- | --- |
| Repo-backed public assets | **33** | **HTTP 200** | **PASS** |
| Intentional Gemunu missing (on-hold / removed practitioner; no publish) | **2** | **HTTP 404** | **PASS** (documented exception; do not restore) |
| Legacy WP path `wp-content/uploads/2025/05/img2.png` | **1** | **HTTP 404** on Hostinger Next app | **PASS WITH EXCEPTIONS** |
| External Wikimedia Gabba URL | **1** | **HTTP 200** with browser UA (earlier bot HEAD got 429) | **PASS WITH EXCEPTIONS** |

### Unavailable / non-disk assets (individual)

1. `assets/team/dr-gemunu-suresh-ranawake.webp` — missing on disk; Hostinger **404**; **intentional** (do not publish on-hold Gemunu content).  
2. `assets/team/dr-gemunu-suresh-ranawake-640.webp` — same as above.  
3. `wp-content/uploads/2025/05/img2.png` — legacy WordPress path; **no repo public bytes**; Hostinger Next **404**.  
4. `https://upload.wikimedia.org/wikipedia/commons/3/3d/The_Gabba_from_Ipswich_Road_2026.jpg` — external URL row; retrieval **200** (UA-sensitive; bot traffic may 429).

**Asset parity board:** **PASS WITH EXCEPTIONS** (33/33 approved public disk assets live; 4 documented non-disk rows unchanged).

---

## 3. Visual parity result

**Method:** Playwright Chromium full-page screenshots, local vs Hostinger, widths **320 / 390 / 768 / 1024 / 1440**.  
**Routes (14):** Homepage, Services, Team, Dr Tanya, Dr Mary, Knowledge index, Knowledge ADHD hub, sample article (blood pressure), Join Our Team, GP Opportunities, Practice Experience, Patient Information, Contact, Booking (`/book-appointment.html`).  
**Evidence:** `apps/web/.tmp-rc-gate/fullpage/` (140 PNGs) + `visual-compare-summary.json`.

| Metric | Result | Classification |
| --- | --- | --- |
| Pairs captured without nav failure | **70 / 70** | **PASS** |
| Byte-identical PNG pairs | **0 / 70** | Expected cross-host noise — **not a content FAIL** |
| Material HTML signal check (phone, hero authority class, bulk-billing markers) | Local ≡ Hostinger; Hostinger adds staging `noindex` meta only | **PASS** |
| Vacancy titles on Join Our Team (4 approved) | All present on Hostinger | **PASS** |
| Cosmetic hours casing (`7:00am` vs `7:00 AM`) | Still present on Hostinger HTML mixture | **PASS WITH EXCEPTIONS** (cosmetic) |

**Noise sources (do not treat as design regression):** staging `noindex` meta / `X-Robots-Tag`, hostname, Next chunk hashes, anti-aliasing, full-page scroll composition.

**Visual parity board:** **PASS WITH EXCEPTIONS**.

---

## 4. Performance measurements

**Evidence:** `apps/web/.tmp-rc-gate/perf-probe.json`  
**Constraint:** bounded concurrency (warmup → sequential → c=2/4/6); shared Hostinger limits respected.

| Probe | n | median | p95 | HTTP 500 | DB error signals | Gate |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Local sequential (12 routes) | 12 | **97 ms** | **248 ms** | **0** | **0** | **PASS** |
| Hostinger warmup sequential | 3 | **3085 ms** | 3090 ms | **0** | **0** | **PASS** |
| Hostinger sequential (12 routes) | 12 | **3404 ms** | **5063 ms** | **0** | **0** | **PASS** |
| Hostinger concurrency 2 | 12 | **5094 ms** | **7346 ms** | **0** | **0** | **PASS** |
| Hostinger concurrency 4 | 12 | **9860 ms** | **14218 ms** | **0** | **0** | **PASS** |
| Hostinger concurrency 6 | 12 | **14039 ms** | **24664 ms** | **0** | **0** | **PASS** |

### TTFB / latency interpretation

| Cause | Evidence | Notes |
| --- | --- | --- |
| Next SSR / HTML render | HTML responses ~3–5s sequential after warm | Dominant on Hostinger vs local ~100 ms |
| DB latency / pooler | Post-`ad172cb` **0** `EMAXCONNSESSION` / 500 under c≤6 | Pooler fix holding |
| Cold start | Hostinger Node may sleep when idle | First-hit latency expected; monitor in production plan |
| Network / shared hosting | Latency rises with concurrency (c6 p95 ~25s) | Capacity characteristic; not architecture change warranted for staging |
| Hostinger runtime log API | `hosting_nodejs_runtime-logs` → platform HTTP 500 | **NOT VERIFIED** (use functional probes) |

**No small safe hosting-architecture change indicated by this evidence.** Document Hostinger cold-start + concurrency latency as production acceptance risks.

**Runtime stability board:** **PASS** (errors) / **PASS WITH EXCEPTIONS** (absolute TTFB vs local).

---

## 5. Storage recovery status

| Item | Evidence | Classification |
| --- | --- | --- |
| `PRIVATE_OBJECT_STORE` env key present on Hostinger | `hosting_nodejs_list-environment-variables` shows key (value masked) | **PASS** (key present; value not readable via API) |
| `private_objects` table populated | **3** synthetic rows with non-zero `bytes` payloads (career_resume + gp_readiness) | **PASS** |
| Survive redeploy | Rows still present after auto-deploy of `3c1cd0a` | **PASS** (DB-backed durability signal) |
| CV / GP readiness code path | `apps/web/src/storage/private-object-store.ts` + careers/GP wiring | **PASS** (code) |
| End-to-end authenticated upload/retrieve/delete AT | Not re-executed this gate (no real applicant data; deep admin cycle) | **NOT VERIFIED** |
| Retention / deletion policy controls | Partial product contracts exist (e.g. story-capture retention); careers purge workflow not re-audited live | **NOT VERIFIED** |
| Storage growth controls | Not measured against quotas this pass | **NOT VERIFIED** |
| Public media in Git | 33 approved assets served from deploy public tree | **PASS** |
| Staging DB logical backup/restore drill | Pre-import/remediation backups referenced historically; formal restore drill not re-run this gate | **NOT VERIFIED** |

**Storage recovery board:** **PASS WITH EXCEPTIONS** (postgres private store live + synthetic payloads durable across redeploy; full admin AT / retention ops still open).

---

## 6. Unresolved P0 / P1 defects

### P0 (block actual production cutover — not cutover *planning*)

| ID | Defect | Status |
| --- | --- | --- |
| P0-1 | Production off-box DB + private-object backup/restore evidence | **FAIL** / open (see `deployment/DNS-CUTOVER-CHECKLIST.md` / LAUNCH ops) |
| P0-2 | Production env isolation (`AUTH_*`, Postgres not public, separate from staging Supabase) | **NOT VERIFIED** for production target |
| P0-3 | Cloudflare Full (strict) + origin cert + DNS rollback values recorded | **FAIL** / open for apex |
| P0-4 | Formal production smoke log on the chosen production host | **FAIL** / open |

### P1 (should close during cutover planning)

| ID | Defect | Status |
| --- | --- | --- |
| P1-1 | Hostinger CDN `robots.txt` for `*.hostingersite.com` still `Allow: /` for `*` (app empty-sitemap + HTML/`X-Robots-Tag` noindex **PASS**) | **PASS WITH EXCEPTIONS** / residual |
| P1-2 | Hostinger absolute TTFB / cold-start under concurrency | **PASS WITH EXCEPTIONS** |
| P1-3 | Cosmetic homepage hours casing | **PASS WITH EXCEPTIONS** |
| P1-4 | Legacy WP media row + Wikimedia external row | Documented exceptions |
| P1-5 | Deep CMS publish lifecycle + CV retention/deletion live AT | **NOT VERIFIED** |
| P1-6 | Hostinger runtime log API unreliable | **NOT VERIFIED** |

### Public staging defects found this gate that require immediate code fix

**None.** No tiny verified public defect required a code change.

---

## 7. Production migration prerequisites

Classify each for **cutover planning readiness** (planning may start; item must be closed before DNS move).

| Prerequisite | Classification | Notes |
| --- | --- | --- |
| Freeze / tag immutable RC SHA for production (recommend ship from known tip containing `ad172cb`, currently `3c1cd0a`) | **PASS** for planning | Prefer annotated tag; disable accidental docs-only auto-deploy to production |
| Staging public content parity | **PASS WITH EXCEPTIONS** | 226 published pages; 4 careers roles; 22 knowledge topics; 15 published practitioners |
| Staging noindex / empty sitemap | **PASS** (HTML + `X-Robots-Tag` + empty sitemap); robots.txt CDN **PARTIAL** | Production must flip to indexable robots/sitemap |
| Legacy WP URL preservation / redirects | **PASS** (code present: `wordpress-legacy-redirects` + middleware) | Execute redirect acceptance matrix before cutover |
| SEO transition plan (canonicals, sitemap, Search Console) | **NOT VERIFIED** as filed runbook for Hostinger Web App path | Required planning deliverable |
| Production DB separate from staging Supabase | **NOT VERIFIED** | Do not reuse `thwcxuhrzgkufvdrvzzt` for production |
| Production env (`AUTH_*`, `DATABASE_URL`, store dirs / `PRIVATE_OBJECT_STORE`) | **NOT VERIFIED** on production host | Hostinger replace-env is full-replace — operator runbook required |
| Staging DB backup + restore drill | **NOT VERIFIED** this gate | Required before content freeze |
| Private-object backup/recovery runbook | **PASS WITH EXCEPTIONS** | Postgres store chosen; export/restore procedure still needed |
| Auth/admin access model on production | **NOT VERIFIED** | Seed then remove seed password per LAUNCH posture |
| CMS publish lifecycle acceptance | **NOT VERIFIED** live deep cycle | Include draft→review→publish→rollback |
| CV/GP retention & deletion controls | **NOT VERIFIED** | Policy + admin actions before accepting real applications |
| Storage growth / quota monitoring | **NOT VERIFIED** | |
| Architecture decision: Hostinger Node Web App vs VPS Docker (`LAUNCH.md`) | **PASS WITH EXCEPTIONS** for staging Web App; production path must be explicitly chosen | `LAUNCH.md` still VPS-centric; Hostinger staging is proven |
| WordPress remains live until cutover | **PASS** | Unchanged this gate |
| DNS cutover checklist complete | **FAIL** today | Planning artifact; not executed |

---

## 8. Rollback readiness

| Item | Classification | Notes |
| --- | --- | --- |
| Staging Git rollback | **PASS** | Redeploy prior SHA via Hostinger Git auto-deploy / build |
| Staging DB page history | **PASS** | Immutable `page_revisions`; remediation used insert-not-rewrite |
| Production DNS rollback values recorded | **FAIL** | Still open per DNS checklist |
| Production backup package available off-box | **FAIL** | No filed package this gate |
| WordPress fallback while DNS unchanged | **PASS** | Apex still WordPress; safest rollback is “do not cut over yet” |
| Feature rollback for pooler fix | **PASS** | Keep `ad172cb` ancestry in any production ship SHA |

**Rollback board for cutover planning:** **PASS WITH EXCEPTIONS** (staging recoverable; production rollback evidence incomplete — blocks cutover, not planning).

---

## Category board (this gate)

| Category | Result |
| --- | --- |
| 1. Verified application SHA | **PASS** (`3c1cd0a` deployed; includes `ad172cb`) |
| 2. Remaining media exceptions | **PASS WITH EXCEPTIONS** |
| 3. Visual parity | **PASS WITH EXCEPTIONS** |
| 4. Performance / stability | **PASS** (0×500) / **PASS WITH EXCEPTIONS** (TTFB) |
| 5. Storage recovery | **PASS WITH EXCEPTIONS** |
| 6. Unresolved P0/P1 | P0 open for **cutover**; none newly blocking **planning** |
| 7. Production migration prerequisites | Mixed — planning checklist ready; several **NOT VERIFIED** / **FAIL** until filed |
| 8. Rollback readiness | **PASS WITH EXCEPTIONS** (staging yes; production DNS/backup no) |

---

## CMS inventory snapshot (staging SQL)

| Metric | Count |
| --- | ---: |
| `media_assets` | 37 |
| `private_objects` | 3 (synthetic) |
| Pages with published revision | 226 |
| Knowledge topics | 22 |
| Vacancies total | 5 (4 approved roles + 1 synthetic closed) |
| Vacancies `now_hiring` | 2 |
| Vacancies `expression_of_interest` | 2 |
| Practitioners `published` | 15 |

---

## Safety record

- Local reference DB: **not mutated**  
- Live WordPress / public DNS / Cloudflare apex: **not touched**  
- No production private data copied  
- Gemunu content: **not published**  
- Vacancies: **not invented**  
- Code/deploy changes this gate: **none** (document + evidence only)  
- Commit: **not created** (per policy)

---

## Recommendation (repeat)

**GO FOR CUTOVER PLANNING**

Proceed to write the production cutover plan (host choice, env isolation, backups, SEO flip, redirects, smoke, DNS rollback).  
Remain **NO-GO for DNS/production cutover** until §6 P0 items and §7/§8 production evidence are PASS.
