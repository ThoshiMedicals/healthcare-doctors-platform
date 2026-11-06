# WMC RC1 — Test Stabilisation Report

**Date:** 2026-11-06  
**Branch:** `release/wmc-hostinger-rc1`  
**Mode:** GitHub backup + automated-test stabilisation only — **no Hostinger deploy, no DNS, no WordPress, no production DB changes.**

---

## 1. GitHub push verification (Phase 1–2)

| Check | Result |
| --- | --- |
| Active release branch | `release/wmc-hostinger-rc1` |
| Pre-stabilisation tip (pushed) | `e161209307a30759eaba97410bfa5c9b9dd79be2` |
| Remote | `ThoshiMedicals/healthcare-doctors-platform` → `origin/release/wmc-hostinger-rc1` |
| Push style | Non-force; branch only; default branch unchanged |
| Secrets / `.env` / applicant data / private backups | Not included (confirmed at RC1 sync; `.env` remains local) |
| Auto production deploy risk | **None** — Actions `rg01-release-gate-validation` / `fp03-phase6-validation` bind only to other branches (`rg01-release-gate-repairs`, etc.). Hostinger `gitAutoDeployment` for gabba was null at readiness audit. |
| WordPress production | Unaffected |
| Local UAT (`127.0.0.1:3100` / `next.`) | Left running; `/api/health` remained `database:up` throughout |

**Push result (Phase 2):** `origin/release/wmc-hostinger-rc1` = `e161209` (exact intended release commit at push time).

---

## 2. Commit SHAs

| Role | SHA |
| --- | --- |
| Original pushed RC1 tip | `e161209307a30759eaba97410bfa5c9b9dd79be2` |
| Test stabilisation (honesty, public-ux, CMS parse, QA, SA grant) | `ea50be42313c92c7ebdedbf9157f7d7ce069b39d` |
| Golden CRLF compare hardening | `dd7774d647988be029a00c5505d33e3d71bf62a9` |
| **Final local tip (post-stabilisation)** | **`dd7774d647988be029a00c5505d33e3d71bf62a9`** |

Stabilisation commits were held local until validation completed, then pushed with this report.

---

## 3. Original 14 failing tests and resolutions

| # | Failing test | Source | Classification | Resolution |
| --- | --- | --- | --- | --- |
| 1 | `practice_experience:hub passes schema validation` | `attraction-cms/validate-schema.test.ts` | Outdated honesty fixture vs schema rules | Updated `hub-content` honestyLine to include `not job advertisements` + `practice experience` |
| 2 | `catchment_analysis:… schema validation` | same | Fixture honesty drift | Catchment honestyLine now includes `qualitative` + `fabricated` |
| 3 | `continuity_network:… schema validation` | same | Fixture honesty drift | Continuity honestyLine now includes `marketplace` |
| 4 | `clinical_interests:… schema validation` | same | Fixture honesty drift | Clinical interests honestyLine now includes `marketplace` |
| 5 | `placeholder copy avoids hiring-agency tone` | `practice-experience/schema-guards.test.ts` | Same hub honesty gap | Fixed by hub honestyLine update |
| 6 | `Join Our Team becomes a GP recruitment prospectus…` | `documents/public-ux.test.ts` | Stale bust expectation | Expect `gp-readiness-portal.js?v=wmc-gp-readiness-20261106a` (matches recruitment module) |
| 7 | `Express Interest enquiry stage…` (idempotency) | `public-ux.test.ts` | Genuine idempotency defect | Skip sticky inject on EOI; strip leftover sticky CSS/script |
| 8 | `the real homepage opening-hours…` (idempotency) | `public-ux.test.ts` | Genuine idempotency defect | Always strip+re-append hero v6 style before `</head>` |
| 9 | `actual published golden pages receive Join Our Team…` | `public-ux.test.ts` | Same index idempotency | Fixed by hero style order fix |
| 10 | `an unchanged service page matches the approved page` | `cms/publish-render.test.ts` | Genuine CMS parse defect | `service-document` now reads/writes `practitioner-knowledge-link` markup (legacy `resource-link` retained) |
| 11 | `creates a deputy, grants Super Admin…` | `cms/super-admin-grant.test.ts` | Local DB pollution (extra SAs) | Temporarily park extra enabled Super Admins; restore in `finally` |
| 12 | `public and golden scripts parse, keeping all 12 valid peer records` | `readiness/booking-funnel-qa-audit.test.ts` | Windows CRLF marker miss | Normalise `\r\n` before PEERS slice (data already 12 peers) |
| 13 | `exposes consistency… for all templates` | `readiness/practitioner-qa-audit.test.ts` | Stale expectation (Gemunu removed) | Expect **12** templates; audit comment updated |
| 14 | `navigation… match the golden master` | `regression/golden-master.test.ts` | Local DB drift + CRLF | Restored `join-our-team.html` published revision from golden (local UAT DB only); CRLF-normalise region compares |

Approved golden-master HTML under `old-html/` was **not** edited to force passes. Recruitment / hero / Join Our Team overlays remain in `public-ux` / recruitment modules.

---

## 4. New test results

| Environment | Command | Result |
| --- | --- | --- |
| Primary workspace @ `dd7774d` | `npm test` (apps/web) | **347 pass / 0 fail** |
| Clean detached worktree @ `dd7774d` | `npm ci` → `prisma generate` → `npm test` | **347 pass / 0 fail** |

---

## 5. Full build / lint / TypeScript

| Check | Result | Notes |
| --- | --- | --- |
| Clean `npm ci` (worktree) | **PASS** | Isolated from UAT `node_modules` |
| `npx prisma generate` (worktree) | **PASS** | Did not touch UAT-locked DLLs |
| `npx next build` (worktree, distDir `.next`) | **PASS** | Compiled successfully; static generation OK |
| `npm run lint` (primary) | **PASS** (exit 0) | Pre-existing unused-var / `<img>` warnings only |
| Standalone `tsc --noEmit` | **CONDITIONAL** | Fails on orphan `vitest` imports in two non-suite test files (`asset-library/lifecycle.test.ts`, `attraction-analytics/aggregate.test.ts`). Next production build typecheck **PASS**. |
| Local UAT during verification | **Unaffected** | Health remained `ok` / `database:up` |

---

## 6. Prisma and migration verification

| Check | Result |
| --- | --- |
| `prisma migrate status` | **27 migrations found; database schema is up to date** |
| Destructive migrations | **None run** |
| Production database | **Not modified** |
| Local join-our-team revision restore | Local UAT DB only — re-pointed published revision to golden bytes so chrome regions match; public-ux still applies at render |

---

## 7. Remaining P0 blockers (Hostinger / cutover — unchanged)

These are **outside** this RC1 GitHub/test scope (see `docs/WMC-HOSTINGER-WEBAPP-RELEASE-READINESS.md` / production evidence):

- Formal Hostinger Web App staging deploy not yet executed  
- Off-box backup / smoke / env hardening for true production cutover  
- DNS cutover still **NO-GO** until staging evidence is logged  
- WordPress remains live production front until cutover approval  

**Automated tests are no longer a P0 blocker for starting Hostinger staging.**

---

## 8. Production unmodified confirmation

- No Hostinger deployment  
- No DNS changes  
- No WordPress modifications  
- No production Postgres changes  
- No force-push; `main` not merged  
- No automatic production deployment enabled  

---

## 9. Readiness for Hostinger staging

**Verdict: CONDITIONAL GO for Hostinger Web App staging**

| Gate | Status |
| --- | --- |
| Full platform on GitHub release branch | **GO** (`release/wmc-hostinger-rc1` @ `dd7774d` after push) |
| Automated suite green | **GO** (347/347) |
| Clean install + Prisma generate + production build | **GO** |
| Lint | **GO** (warnings only) |
| Standalone tsc (vitest orphans) | **CONDITIONAL** — not blocking Next build |
| Staging deploy itself | **NOT STARTED** (explicitly out of scope here) |

---

## 10. Exact next action for Hostinger staging

1. Confirm remote tip: `git fetch origin && git rev-parse origin/release/wmc-hostinger-rc1` equals `dd7774d647988be029a00c5505d33e3d71bf62a9`.  
2. On Hostinger Web App (Node), create/select a **staging** hostname (not apex).  
3. Connect Git deploy to `ThoshiMedicals/healthcare-doctors-platform` branch `release/wmc-hostinger-rc1` at `dd7774d` (or pull that SHA).  
4. Provision **external Postgres** + set env from `.env.example` (`DATABASE_URL`, `AUTH_*`, durable `IMAGE_STORE_DIR` / `CAREER_RESUME_DIR` / `GP_READINESS_STORAGE_DIR`).  
5. Run `prisma migrate deploy` against staging DB only; `npm run build`; start standalone.  
6. Smoke against staging URL only — **do not** change public DNS or WordPress.
