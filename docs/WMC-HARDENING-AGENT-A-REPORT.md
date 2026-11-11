# WMC Hardening — Agent A Report (Post-PWA)

| Field | Value |
| --- | --- |
| Agent | A — Post-PWA Release Hardening |
| Worktree | `C:\Users\RoshanSamarawickrema\Desktop\WMC-hardening-post-pwa` |
| Branch | `hardening/wmc-post-pwa` |
| Baseline | `a8309dbcd2b1458f5228d50ff4f9bc48b5d8e625` |
| Staging | `https://mediumslateblue-eagle-960503.hostingersite.com` |
| Staging build | `01a1c862-5c31-71eb-9f64-9a014901a683` (archive `wmc-pwa-layout-a8309db.zip`) |
| Supabase staging | `thwcxuhrzgkufvdrvzzt` |
| Date | 2026-11-11 |
| Push / deploy | **Not performed** |
| Staging DB writes | **Not performed** |
| Agent B files | **Not touched** (`phone-only-booking*`, Golnar booking matrix) |

**Verdict: READY FOR INTEGRATION** (with documented ops gaps; local dirty tree has one safe SEO sync only).

---

## A — PWA security (fail-closed SW)

**PASS (code + unit/sandbox tests).**

Contract (source of truth `apps/web/src/pwa/cache-policy.ts`, mirrored in `apps/web/public/sw.js`):

- Intercepts **only** GET same-origin paths on `SHELL_ALLOWLIST` (`/offline.html`, favicons, `/manifest.webmanifest`, `/icons/icon-192.png`, `/icons/icon-512.png`).
- Independent deny: `/admin`, `/api/auth`, `/api/admin`, and all `/api/clinics/<slug>/…` (incl. form/EOI/readiness/career).
- Ordinary CMS HTML is **not** allow-listed and is left untouched (no `respondWith`) so durable HTML cache / ETag paths stay server-owned.
- Defense-in-depth: no cache of Set-Cookie / Authorization / `no-store` / `private` responses.

Tests run (all pass):

- `src/pwa/cache-policy.test.ts`
- `src/pwa/sw-contract.test.ts`
- `src/pwa/offline-shell.test.ts`
- `src/documents/pwa-meta.test.ts`

**No caching expansion. No new SW tests added** — existing coverage already asserts mirror identity, non-intercept of admin/auth/clinic APIs/CMS, and offline fallback scope.

Staging HTTP: `/sw.js` returns 200 with the fail-closed contract header comment and allow-list mirror present.

---

## B — PWA install (staging HTTP)

**PASS for HTTP asset presence. Physical Android / iOS install: UNVERIFIED.**

| Asset | Staging status |
| --- | --- |
| `/manifest.webmanifest` | 200 (name/short_name/icons/shortcuts/start_url present). Note: `Content-Type: text/plain` at Hostinger edge (suboptimal MIME; browsers still consume it). |
| `/sw.js` | 200 |
| `/offline.html` | 200, meta `noindex, nofollow`, call + retry UX |
| `/icons/icon-192.png`, `/icons/icon-512.png` | 200 PNG |
| `/icons/icon-96.png`, maskable icons | 200 (referenced by manifest) |

Not performed: Add to Home Screen / install prompt / standalone mode on a physical Android or iOS device.

---

## C — Recruitment HOLD

**PASS on staging (policy unchanged).**

| Check | Result |
| --- | --- |
| Informational hub `/join-our-team.html` | **200** + `X-Robots-Tag: noindex, nofollow, noarchive` (+ meta robots) |
| Informational child `/join-our-team/gp-faq.html` | **200** + same noindex |
| Form `/join-our-team/express-interest.html` | **404** |
| Form `/join-our-team/doctor-readiness.html` | **404** |
| EOI API `POST /api/clinics/woolloongabba/gp-pipeline/eoi` | **403** |
| Career API `POST /api/clinics/woolloongabba/career-applications` | **403** |

Note: legacy path `/api/gp-eoi` is not the production EOI route (404/405). HOLD enforcement is on the clinic-scoped pipeline route above.

Logic tests pass: `recruitment-hold.test.ts`, `recruitment-hold-route.test.ts`.

---

## D — CMS P0 (logic vs DB)

| Suite | Result |
| --- | --- |
| `page-lifecycle.logic.test.ts` | **PASS** |
| `page-seo.test.ts` | **PASS** |
| `draft-preview.test.ts` | **PASS** |
| `admin-hardening.test.ts` | **PASS** |
| `staff-create.test.ts` | **PASS** |
| HOLD route / importer HOLD | **PASS** |
| `page-lifecycle.db.test.ts` | **SKIP / UNVERIFIED** — requires `WMC_P0_TEST_DATABASE_URL` (disposable DB). Not set in this worktree; suite correctly skips (`# SKIP`). |
| `super-admin-grant.test.ts` (DB path) | **FAIL / UNVERIFIED** — worktree has no `apps/web/.env` / `DATABASE_URL` (see E). |

Postgres for local disposable/integration tests was **unavailable** in this worktree (no `.env`). No schema or CMS lifecycle code changes made.

---

## E — Full `npm test` classification

Reproduced from `apps/web` on baseline + Agent A sitemap sync.

### After Agent A sitemap fix

| Metric | Value |
| --- | --- |
| tests | 465 |
| pass | **463** |
| fail | **2** |
| skip (describe) | page-lifecycle DB integration skipped when env unset |

### Exact failures / skips

| # | Name | File | Classification | Cause | Agent A repair? |
| --- | --- | --- | --- | --- | --- |
| 1 | `page lifecycle DB integration` | `src/cms/page-lifecycle.db.test.ts` | **Expected skip / env-gated** (often counted among “~4 suite gaps”) | `WMC_P0_TEST_DATABASE_URL` unset → describe skipped | No — needs disposable Postgres; not a product defect |
| 2 | `creates a deputy, grants Super Admin, and removes the trial accounts` | `src/cms/super-admin-grant.test.ts` | **Env / DB unavailable** | `ENOENT` opening `apps/web/.env` for `DATABASE_URL` | No — operator/env; out of hardening code scope |
| 3 | `navigation, header, footer, schema, accessibility, and Digital Reception match the golden master` | `src/regression/golden-master.test.ts` | **Env / DB unavailable** | Prisma: `Environment variable not found: DATABASE_URL` | No — needs seeded local/clinic DB |
| 4 | `approved sitemap and robots are served unchanged` | `src/seo/launch.test.ts` | **In-scope product drift (repaired)** | `old-html/sitemap.xml` vs `public/seo-approved/sitemap.xml` differed by missing `https://gabbamedicalcentre.com.au/telehealth.html` in seo-approved | **Yes** — synced seo-approved → golden |

Pre-fix baseline of this worktree: **3 fails + 1 skip** (sitemap + 2 DB-env). Post-fix: **2 fails + 1 skip**.

Scoped Agent A re-run (PWA + HOLD + CMS logic + SEO): **85/85 pass**.

---

## F — Sitemap / SEO

### Golden vs `public/seo-approved` drift

- `robots.txt`: already byte-identical (**PASS**).
- `sitemap.xml`: seo-approved was missing the root hub URL `telehealth.html` (golden had 157 `<loc>`, approved 156). First content divergence at that entry.

**Contained fix applied:** copied `old-html/sitemap.xml` → `apps/web/public/seo-approved/sitemap.xml` (hashes equal). `launch.test.ts` now passes. Left dirty (no commit).

### Staging SEO lock — ops gap (not fixed by code alone)

| Resource | Observed on staging | Expected for staging |
| --- | --- | --- |
| `/sitemap.xml` | Empty urlset + `X-Robots-Tag` noindex + `cache-control: no-store` | **PASS** (Next/middleware path) |
| `/robots.txt` | Static-looking **57-byte** body: Googlebot `Disallow: /` + `User-agent: *` **`Allow: /`**. No `X-Robots-Tag`, no `cache-control: no-store`, no Next `platform`/`panel` headers | **FAIL vs app contract** — should be `stagingRobotsTxt()` (`User-agent: *` / `Disallow: /`) via middleware/route |

Interpretation: Hostinger edge is **short-circuiting `/robots.txt` with a static file**, bypassing Next middleware (`src/middleware.ts`) and `src/app/robots.txt/route.ts`. HTML pages still carry staging noindex headers (verified on join-our-team).

**Production / staging remediations (operator):**

1. On Hostinger site files / `public_html`, **delete any root `robots.txt`** (and purge CDN if present) so requests hit the Node app.
2. Re-check: body must match `stagingRobotsTxt()`, headers must include `X-Robots-Tag: noindex, nofollow, noarchive` and `cache-control: no-store`.
3. Keep production robots/sitemap only under `public/seo-approved/` (already the design); never publish a root static `robots.txt` in the deploy artifact.
4. After Agent A merge, re-archive-deploy if production sitemap must include `telehealth.html` before apex cutover.
5. Confirm production apex never sets `STAGING_NOINDEX=true`.

---

## G — Off-server DB backup

**No independently restorable off-box backup of staging Supabase was found.**

| Candidate | Finding |
| --- | --- |
| In-DB `_wmc_backup_*` tables (staging) | Present (p0 / pwa_layout / unified 20261111 snapshots of clinics/pages/inventory/migrations). These live **inside** the same database — useful for in-place content rollback, **not** disaster recovery if the project is lost. |
| `deployment/backups/` | **Absent** in this worktree |
| `~/WMC-Backups/20261015T143108` | Local Windows `.pgdata` tree copy + source from **2026-10-15** — restore via `deployment/restore-local.ps1` only for local Postgres; **not** a staging/production Supabase `pg_dump` |
| `deployment/backup-database.sh` package | Script exists (VPS/Docker-oriented); **no filed off-box package** for current Hostinger+Supabase staging |

### Operator steps to create a restorable off-box backup (do not skip)

1. Prefer Supabase Dashboard → Project `thwcxuhrzgkufvdrvzzt` → **Database → Backups** (PITR / daily) and confirm retention; download or note restore procedure for the org.
2. Additionally take a logical dump via **Direct** connection (not pooler):  
   `pg_dump --no-owner --no-acl -Fc -f wmc-staging-YYYYMMDD.dump "$DIRECT_URL"`  
   Store the file **off-server** (encrypted drive / object storage), not only in-repo or in `_wmc_backup_*` tables.
3. Package media separately if required (`storage/images`, Hostinger persistent uploads) per `deployment/LAUNCH.md` / Hostinger readiness docs.
4. Record stamp path + restore drill in `docs/WMC-PRODUCTION-READINESS-EVIDENCE.md` (still a cutover blocker historically).
5. Do **not** treat `_wmc_backup_*` tables as the sole backup.

---

## H — GitHub preservation plan (no push performed)

Confirmed via Hostinger `hosting_get-deployment` for build `01a1c862-…`:

- `source_type`: **archive** (`wmc-pwa-layout-a8309db.zip`)
- `gitAutoDeployment`: **null**

Therefore pushing the `a8309db` lineage to GitHub **does not** auto-deploy Hostinger while auto-deploy remains disconnected.

### Safe preservation sequence (operator / integration lead)

1. Keep Hostinger **Git auto-deploy disconnected** (`gitAutoDeployment` null). Prefer archive deploys until a dedicated release branch is intentionally wired.
2. From the hardening worktree (or main checkout), ensure commits exist for:
   - baseline `a8309db` (already on branch)
   - Agent A dirty fix (`seo-approved/sitemap.xml`) if integrating
   - Agent B Golnar/phone-only commits when ready
3. Push **without** pointing Hostinger at the branch yet, e.g.:
   - `git push -u origin hardening/wmc-post-pwa`
   - and/or annotated tag `git tag -a wmc-post-pwa-a8309db -m "…" && git push origin wmc-post-pwa-a8309db`
4. Optional: open a PR into `development` / release branch per `deployment/SOURCE-CONTROL.md` — merge does not deploy until Hostinger Git is reconnected or an archive is uploaded.
5. Only after explicit GO: reconnect Git auto-deploy to a **immutable release branch/tag**, or continue archive uploads (`hosting_deploy` / hPanel archive) naming the SHA in the zip.
6. Do **not** force-push `main`/`staging`; do not reconnect auto-deploy to a dirty laptop branch.

Remote already configured: `https://github.com/ThoshiMedicals/healthcare-doctors-platform.git`.

---

## Changed files (Agent A)

| Path | Change |
| --- | --- |
| `apps/web/public/seo-approved/sitemap.xml` | Synced to golden `old-html/sitemap.xml` (adds missing `telehealth.html` loc) |
| `docs/WMC-HARDENING-AGENT-A-REPORT.md` | This report |

Commit: **not created** (dirty tree preferred).

---

## Test summary (honest)

| Run | Result |
| --- | --- |
| PWA + HOLD + CMS logic + SEO scoped (85 tests) | **PASS 85/85** |
| Full `npm test` after sitemap fix | **PASS 463 / FAIL 2** (both DB/env) + page-lifecycle DB **skipped** |
| Staging HTTP PWA/HOLD | **PASS** except staging `/robots.txt` static short-circuit (**ops FAIL**) |
| Physical device PWA install | **UNVERIFIED** |
| CMS DB integration / golden-master DB / super-admin DB | **UNVERIFIED** without local `.env` + Postgres |

---

## READY FOR INTEGRATION?

**YES — Agent A is READY FOR INTEGRATION.**

Blockers for *production cutover* (not Agent A merge blockers): off-box Supabase dump evidence, staging `robots.txt` Hostinger static short-circuit cleanup, physical PWA install smoke, and reconnect/archive deploy discipline for GitHub.
