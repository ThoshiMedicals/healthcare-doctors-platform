# WMC — Localhost vs Hostinger Parity Certification

**Date:** 2026-11-06 (remediation close-out)  
**Companion:** `docs/WMC-STAGING-PARITY-REMEDIATION.md`  
**Verdict:** **PARITY WITH DOCUMENTED EXCEPTIONS**

Localhost (`http://127.0.0.1:3000` + Postgres `wmc`) remains the approved public reference. Hostinger staging was repaired against that reference; historical FAIL findings from the verification-only pass are retained below as baseline context, then superseded by post-remediation results.

Evidence: `apps/web/.tmp-parity-cert/` (original audit), `apps/web/.tmp-parity-repair/` (repair + revalidation).

---

## 0. Post-remediation baselines

| Field | Localhost | Hostinger staging |
| --- | --- | --- |
| App URL | `http://127.0.0.1:3000` | `https://mediumslateblue-eagle-960503.hostingersite.com` |
| Health | `ok` / `database:up` | `ok` / `database:up` / `phase:golden-import` |
| Git branch | `release/wmc-hostinger-rc1` | `release/wmc-hostinger-rc1` |
| Git SHA | `ad172cb` (pool fix + prior tip) | **`ad172cb`** build `01a1b133-…` |
| Published paths | 226 | 226 |
| Published content SHA match | — | **226 / 226** |
| Active vacancies | 4 | **4** (synthetic closed retained) |
| Knowledge topics published | 22 | **22** |
| Media assets | 37 | **37** |
| HTTP 500 under 12-way concurrency | n/a | **0 failures** (after Prisma pool fix) |

---

## 1. Original verification baselines (pre-repair)

| Field | Localhost (source of truth) | Hostinger staging (target) |
| --- | --- | --- |
| Git SHA | `9c551f674ac25b8ebb6e90b114f2f767c59286f2` | `9c551f6` (build `01a1b10e-…`) |
| Vacancies | 4 active | 0 active (+1 synthetic closed) |
| Media assets | 37 | 0 |
| Knowledge topics | 22 | 21 |
| Content SHA mismatches | — | 27 published pages |
| Intermittent HTTP 500 | No | Yes (`EMAXCONNSESSION`) |

Path inventory was already **226/226**. Code tree at `9c551f6` already matched.

---

## 2. Category board

### After remediation

| Category | Status | Notes |
| --- | --- | --- |
| CODE PARITY | **PASS** | Deployed SHA `ad172cb` includes Prisma pool cap |
| CONTENT PARITY | **PASS** | Published SHA 226/226; vacancies + topic index restored |
| ASSET PARITY | **PASS WITH EXCEPTIONS** | 37 CMS rows; 33 repo-backed bytes; 4 documented non-disk |
| DATABASE PARITY | **PASS WITH EXCEPTIONS** | Approved public records aligned; synthetics/re-keys intentional |
| FUNCTIONAL PARITY | **PASS WITH EXCEPTIONS** | 500s cleared under tested concurrency; deep admin cycles not re-audited |
| VISUAL PARITY | **PASS WITH EXCEPTIONS** | Material vacancy/HTML gaps closed; PNG identity + hours casing noise remain |

### Original verification-only board (superseded)

CODE PASS · CONTENT FAIL · VISUAL FAIL · ASSET FAIL · FUNCTIONAL FAIL · DATABASE FAIL → see conversation audit artefacts under `.tmp-parity-cert/`.

---

## 3. Confirmed repairs

1. **Prisma pooler exhaustion → HTTP 500** fixed and redeployed (`ad172cb`).  
2. **Four approved active vacancies** restored with original IDs/titles/terms.  
3. **Knowledge topic `index`** restored (22 topics).  
4. **37 `media_assets`** rows restored; public git assets verified loading.  
5. **27 immutable page revisions** published to eliminate content SHA drift (care-triangle / knowledge / services bodies).

---

## 4. Documented exceptions (acceptable / residual)

| Exception | Classification |
| --- | --- |
| Staging `noindex` / empty sitemap / hostname | Intentional |
| Clinic id `clinic_woolloongabba` vs local cuid | Intentional re-key |
| Synthetic closed vacancy + private_objects + staging admin | Intentional |
| Gemunu portrait files missing on disk | Intentional practitioner removal |
| Wikimedia / legacy `wp-content` media rows | External / legacy; no repo bytes |
| Homepage hours casing (`7:00am` vs `7:00 AM`) | Cosmetic residual |
| Full-page PNG SHA never identical across hosts | Environment noise |
| Hostinger TTFB still high | Performance; not content parity |
| Full 226-URL visual re-crawl | Sampled priority set this pass |

---

## 5. Visual sampling (post-repair)

Playwright Chromium full-page captures: 6 routes × 5 widths (320–1440) → 30 pairs under `.tmp-parity-repair/fullpage/`.

- Status: all captured without navigation errors  
- Byte-identical PNG: **0 / 30** (expected cross-host noise)  
- Material prior fail (empty vacancy strip): **resolved in HTML** (all four roles present on Join Our Team)

Do not treat PNG SHA mismatch alone as content failure when published SHA and vacancy/topic inventories match.

---

## 6. Functional probes (post-repair)

| Check | Result |
| --- | --- |
| `/api/health` | PASS |
| Join Our Team vacancy titles (4) | PASS |
| Knowledge index topic copy | PASS |
| Sample media HTTP 200 | PASS |
| 6-way + 12-way concurrent HTML | PASS (0×500) |
| Hostinger `npm run build` deploy | PASS |
| Local vitest via bare CLI | NOT VERIFIED (alias resolution) |

---

## 7. Cutover

**DNS cutover:** not authorised / not started.  
Production WordPress / Cloudflare apex: unchanged.

---

## 8. Verdict

**PARITY WITH DOCUMENTED EXCEPTIONS**

Approved localhost public content, media inventory (with documented non-disk rows), launch-critical careers rendering, and published revision hashes now align with Hostinger staging at tip `ad172cb`, subject only to the intentional environment differences and cosmetic residuals listed above.
