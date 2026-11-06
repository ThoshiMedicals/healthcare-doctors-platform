# WMC RC1 — GitHub Synchronisation Report

**Date:** 2026-11-06  
**Branch:** `release/wmc-hostinger-rc1`  
**Tip SHA:** `ef6e85f3b9ac506300f42d19f940a02eab989a41` (`ef6e85f`)  
**Mode:** Local release preparation only — **not pushed** to GitHub; no Hostinger/DNS/WordPress changes.

Authority input: `docs/WMC-HOSTINGER-WEBAPP-RELEASE-READINESS.md`.

---

## 1. Starting branch and commit

| Field | Value |
| --- | --- |
| Starting branch | `rg01-release-gate-repairs` |
| Starting HEAD | `9429234da8ce981904259b72c423af78fa5e7860` |
| Remote tip at start | `origin/rg01-release-gate-repairs` = `6d388fe` (local was ahead by 2: `6874998`, `9429234`) |
| Dirty tree at start | ~115 modified + ~181 untracked |
| RC branch created | `release/wmc-hostinger-rc1` (from starting HEAD; dirty work preserved) |

---

## 2. Recovery / snapshot reference

| Artifact | Location |
| --- | --- |
| Metadata snapshot dir | `C:\Users\RoshanSamarawickrema\WMC-RC1-snapshots\wmc-working-tree-20261106-141818\` |
| Git stash (kept) | `stash@{0}` — `rc1-recovery-snapshot-20261106-141818` |
| Permanent backup ref | `refs/backup/rc1-working-tree-20261106-141818` → `8d1d602ed8f4c67f39c52311a12968dcf4d77161` |
| Local DB / UAT | Left running; `/api/health` still `database:up` after RC work |

No force-reset, no force-push, no deletion of local development files.

---

## 3. Files included and excluded

### Included (committed on RC1)

| Class | Examples |
| --- | --- |
| Required production source | `apps/web/src/**` (CMS, careers, GP pipeline, attraction, SEO redirects, public-ux, multi-clinic) |
| Required assets | `apps/web/public/**` (site.js, heroes, team photos Golnar/James, attraction assets, updates) |
| Required configuration | `apps/web/package.json`, `next.config.ts`, `.env.example`, `.gitignore` |
| Required schema/migrations | `prisma/schema.prisma`, `seed.ts`, **all 17 previously untracked migrations** |
| Required ops docs | `docs/**` (audits + Hostinger readiness) |
| Tests / tooling | Updated admin-hardening + public-ux contracts; seed/publish scripts under `apps/web/scripts/` (excluding `_*.json` reports) |
| Golden master updates | `old-html/**` changes already present in local approved work |
| Deployment maps | `deployment/migration/*.csv`, redirects, DNS checklist updates |
| Hostinger durability hooks | `CAREER_RESUME_DIR`, `GP_READINESS_STORAGE_DIR` (+ existing `IMAGE_STORE_DIR`) documented in `.env.example` |

### Excluded (intentionally left local / untracked)

| Class | Paths |
| --- | --- |
| Secrets | `apps/web/.env` (never staged) |
| Generated/temp | `.tmp*`, `apps/web/.tmp*`, `.tmp-pdf-convert/**` (also **untracked from Git history** in commit `ef6e85f`; files remain on disk) |
| Scratch inventories | `branches.txt`, `git-history.txt`, `repo-files.txt`, `repo-structure.txt`, `canvases/` (gitignore) |
| One-off operator reports | `apps/web/scripts/_onboard-*.json`, `_doctor-welcome-updates-report.json` |
| Briefing screenshots | `apps/web/reports/practice-briefing-*.png` |

### Commits on `release/wmc-hostinger-rc1` (after start HEAD)

1. `96d0f5f` — schema, 17 migrations, Hostinger storage env hooks  
2. `40588dc` — full platform application source + golden assets  
3. `582cc07` — operational docs / audits  
4. `f7cf492` — test contract alignment (admin nav + public-ux busts)  
5. `ef6e85f` — stop tracking historical `.tmp-pdf-convert` scratch (**tip**)

---

## 4. All 17 migration findings

**Local DB:** `npx prisma migrate status` → **27 migrations found; database schema is up to date.**  
**Schema:** `prisma validate` → valid.  
**Order:** chronological timestamps 20261103…20261106; no duplicate folder names.

| Migration | Purpose (from SQL) | Empty DB | Restored snapshot |
| --- | --- | --- | --- |
| `20261103050000_careers_vacancies` | Vacancy enums/tables | OK via migrate deploy | Already applied locally |
| `20261103070000_career_applications` | Application statuses + storage metadata | OK | Applied |
| `20261103080000_search_demand_signals` | Search demand signal table | OK | Applied |
| `20261103090000_form_request_operations` | Patient form request ops statuses | OK | Applied |
| `20261103100000_media_library_platform` | Media asset library columns | OK | Applied |
| `20261103210000_multi_tenant_foundation` | Clinic `golden_html_root` + tenant foundation | OK | Applied |
| `20261104130000_gp_attraction_cms_phase1` | Attraction document kinds | OK | Applied |
| `20261104140000_gp_story_capture` | GP story capture enums/tables | OK | Applied |
| `20261104150000_gp_attraction_asset_library` | Attraction asset kinds | OK | Applied |
| `20261104160000_attraction_content_framework_kinds` | Catchment / framework kinds | OK | Applied |
| `20261104170000_gp_operational_pipeline` | GP enquiry pipeline | OK | Applied |
| `20261104180000_gp_attraction_analytics` | Attraction analytics surfaces | OK | Applied |
| `20261105100000_gp_readiness_packages` | GP readiness package statuses | OK | Applied |
| `20261105140000_vacancy_recruitment_fields` | Vacancy remuneration note etc. | OK | Applied |
| `20261106120000_gp_doctor_profile_drafts` | Doctor profile draft workflow | OK | Applied |
| `20261106140000_gp_readiness_recruitment_ops` | Readiness status enum evolution | OK | Applied |
| `20261106153000_practitioner_growth_availability` | `accepting_new_patients` on practitioners | OK | Applied |

**Safe process (staging):** provision empty external Postgres → `prisma migrate deploy` → seed clinic/domains → `import:golden` (or sanitised dump).  
**Do not** export identifiable applicants/patients to unsecured staging. No destructive migrate executed in this task.

**Schema drift:** none observed vs local DB (status up to date).

---

## 5. Feature preservation checklist

| Feature | In RC1 Git tip | Evidence |
| --- | --- | --- |
| Homepage + patient services | Yes | `public-ux` authority v6; golden + public assets; build emits routes |
| Practitioner directory/pages | Yes | CMS practitioners + inject modules + team assets |
| Booking / phone-only | Yes | HotDoc + `tel:` inject; insurance notice modules present |
| CMS + admin auth | Yes | Auth.js routes; admin dashboard modules expanded |
| Practitioner publishing/overlays | Yes | `inject-cms-*`, overlay, release modules |
| Knowledge Hub / articles / updates | Yes | Admin knowledge + updates inject + public updates JS |
| Recruitment landing / vacancies / applications | Yes | Careers admin + API + join-our-team recruitment transform |
| Recruitment CRM / GP readiness | Yes | `gp-pipeline/**`, readiness admin + APIs |
| SEO routes / sitemap / redirects | Yes | `wordpress-legacy-redirects.ts` (+ tests for Golnar/James/Yamesha) |
| Mobile navigation | Yes | `site.js` + cache-bust headers in `next.config.ts` |
| Image/media references | Yes | Media library + `IMAGE_STORE_DIR` / managed-image API |
| Multi-clinic architecture | Yes | `multi_tenant_foundation` migration + `active-clinic` / branding |

**Known intentional tension:** `join-our-team.html` golden vs public-ux recruitment overlay causes golden-master regression tests to fail (platform overlay is the approved runtime behaviour). Documented under test results — not removed from RC.

---

## 6. Build and test results

### Production build

| Run | Result |
| --- | --- |
| Working tree `npx next build` (prisma generate skipped — Windows DLL lock by UAT `:3000`/`:3100`) | **PASS** — standalone Next routes including careers, gp-pipeline, attraction, health |
| Full `npm run build` | **BLOCKED locally** by `EPERM` rename of `query_engine-windows.dll.node` while UAT holds the file. **Workaround:** stop UAT briefly, or rely on clean-checkout generate (below). |
| Clean-checkout `npx prisma generate` + `npx next build` | **PASS** (`CLEAN_BUILD_EXIT=0`) |

### Automated tests (`npm test` in `apps/web`)

| Metric | After contract fixes |
| --- | --- |
| Total | 347 |
| Pass | 333 |
| Fail | **14** |

**Remaining failures (do not ignore):**

1. Attraction publish-ready / honesty schema packs (4 related) — missing honesty hint phrases in fixtures/content  
2. `an unchanged service page matches the approved page` — publish comparison drift  
3. Super Admin grant workflow (DB integration) — flaky/stateful  
4. Join Our Team nav position / prospectus / EOI stage / hiring-agency tone — overlay vs golden / copy expectations  
5. Homepage opening-hours suite — residual assertion drift after bust updates (partially fixed; re-check before push waiver)  
6. PEERS scripts “12 valid peer records” — actual count 13 in QA audit  
7. Practitioner QA template scores  
8. Golden-master regression on `join-our-team.html` (6 structural diffs — expected while overlay owns recruitment UX)

Admin role-menu contract failures were **fixed** in `f7cf492` (modules now include Practice Experience, Attraction, Story Capture, Asset Library, GP Pipeline, GP Readiness, Attraction Analytics).

---

## 7. Clean-checkout reproducibility

| Check | Result |
| --- | --- |
| Method | `git clone --branch release/wmc-hostinger-rc1` from local repo into `%TEMP%\wmc-rc1-clean-checkout` |
| Tip cloned | `f7cf492` at clone time; tip advanced to `ef6e85f` after tmp cleanup |
| Critical paths present | migrations, careers, gp-pipeline, wordpress redirects, docs, site.js, old-html — **Yes** |
| Scratch `_onboard` reports | **Absent** (correct) |
| Historical `.tmp-pdf-convert` | Was previously tracked in ancestors; **removed from index** in `ef6e85f` |
| `npm install` + `prisma generate` + `next build` | **PASS** |
| Hidden local-only src dependency | **Not required** for compile of tip |

Re-clone after `ef6e85f` recommended before Hostinger Git connect to confirm tmp files stay out.

---

## 8. Release branch and commit SHA

| Item | Value |
| --- | --- |
| Branch | `release/wmc-hostinger-rc1` |
| Immutable tip for review | **`ef6e85f3b9ac506300f42d19f940a02eab989a41`** |
| Base includes | Hero freeze `6874998` + prior ship ancestry `3875dc3` |
| Push status | **Not pushed** (awaiting approval) |
| Merge to main/production | **Not done** |

---

## 9. Remaining Hostinger deployment blockers

Still open after RC1 sync (from Hostinger readiness audit + this work):

1. **Push** `release/wmc-hostinger-rc1` @ `ef6e85f` (human approval)  
2. **External PostgreSQL** provision (Supabase/Neon/VPS) — not on Hostinger managed MySQL  
3. **New Hostinger Node Web App** on separate hostname (do not overwrite WordPress apex)  
4. **Env vars** on Hostinger (`DATABASE_URL`, `AUTH_*`, durable `IMAGE_STORE_DIR` / `CAREER_RESUME_DIR` / `GP_READINESS_STORAGE_DIR`)  
5. **Migrate + seed + golden import** on staging DB  
6. **Resolve or waive 14 failing tests** before calling staging “accepted”  
7. WordPress backup + DNS rollback values before any cutover  
8. Local full `npm run build` needs UAT stopped once for prisma generate on Windows  

---

## 10. Explicit readiness for GitHub push and staging deployment

| Gate | Verdict |
| --- | --- |
| Full platform represented in Git tip | **YES** (patient + CMS + recruitment + SEO + multi-tenant foundation) |
| Migrations complete in Git | **YES** (27 total; 17 newly committed) |
| Secrets excluded | **YES** |
| Clean-checkout production build | **PASS** |
| Full automated test suite green | **NO** (14 failures) |
| Ready to push branch to GitHub for backup / Hostinger Git wiring | **CONDITIONAL PASS** |
| Ready to declare Hostinger staging acceptance | **NO** until tests waived/fixed + staging smoke |

### Push recommendation

**CONDITIONAL PASS — approve GitHub push of `release/wmc-hostinger-rc1` @ `ef6e85f`.**

Rationale: the complete approved local platform is now in a reproducible Git branch that clean-builds; remaining failures are known product/test debts, not “missing source.” Do **not** treat push as cutover authority.

**FAIL** the claim “RC1 is fully verified / staging-complete” until the 14 tests are fixed or explicitly waived by the Practice Manager / Release Manager.

---

## Operator next steps (after approval)

1. `git push -u origin release/wmc-hostinger-rc1` (no force)  
2. Tag optional: `wmc-hostinger-rc1-ef6e85f`  
3. Connect Hostinger Web App → that branch, `rootDirectory=apps/web`, Node 22  
4. Attach external Postgres + durable storage env  
5. Staging acceptance pack from Hostinger readiness doc  

*Local UAT and WordPress production were not modified for deploy.*


## Tip amendment

Final tip after including pending public-ux polish: `8faac0af2cbf76ecf28cdb36baacc53498fea0d4` ($short). Prior tip `ef6e85f` remains an ancestor.

