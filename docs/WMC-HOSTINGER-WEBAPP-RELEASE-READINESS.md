# WMC — Hostinger Web App Release Readiness

**Date:** 2026-11-06  
**Mode:** Read-only architecture verification and release preparation (no deploy, no DNS change, no DB mutation, no app code change).  
**Repository:** `ThoshiMedicals/healthcare-doctors-platform` (local folder `WMC-Master-Project`)  
**Target posture:** Hostinger **managed Node.js Web App** with GitHub integration — not an automatic assumption of full-stack VPS for the Next.js process.

**Related prior audits (inputs, not re-run as authority):**
- `docs/WMC-BUSINESS-VALUE-ADOPTION-AUDIT.md`
- `docs/WMC-PRODUCTION-LAUNCH-GO-LIVE-AUDIT.md` (GO WITH CONDITIONS, 68/100, VPS-oriented ops)
- `docs/WMC-PRODUCTION-READINESS-EVIDENCE.md` (8/8 LAUNCH.md ops FAIL as of 2026-11-03)
- `deployment/LAUNCH.md` (VPS Docker Compose guide; explicitly supersedes Hostinger — **re-evaluated** below for managed Web App)
- `deployment/HOSTINGER.md` (marked SUPERSEDED — historical; this document is the Hostinger Web App path)

---

## 1. Executive recommendation

**Verdict: GO WITH CONDITIONS for a Hostinger managed Node.js Web App architecture — NO-GO for production cutover today.**

| Question | Answer |
| --- | --- |
| Can Next.js 15 run on Hostinger managed Web Apps? | **Yes** — Hostinger supports `app_type: next`, detects standalone output, Node 18/20/22/24. Proven on this same Hostinger account (`cornflowerblue-lark-260002.hostingersite.com`, Next 15.5.x, completed build 2026-11-04). |
| Can the complete WMC platform be reproduced from GitHub as it sits today? | **No.** Local HEAD is ahead of remote; the working tree holds ~180 untracked paths and ~115 modified paths that include migrations, recruitment, multi-tenant foundation, media library, and the entire `docs/` tree. Remote `apps/web/src` ≈ **295** files; local `apps/web/src` ≈ **515** files. |
| Does Hostinger managed hosting provide PostgreSQL? | **No.** Official Hostinger docs: PostgreSQL is not on Web/Cloud plans; MySQL only on-platform. Prisma datasource is `provider = "postgresql"`. Required pattern: **external Postgres** (Hostinger documents Supabase for Node.js apps) **or** Postgres on the existing Hostinger VPS. |
| Is the live public site WordPress? | **Yes (observed).** Hostinger API: `gabbamedicalcentre.com.au` `website_type: wordpress`. Live HTML includes `/wp-content/` and `wp-json` Link headers. |
| Should apex DNS move now? | **No.** Keep WordPress operational until an independent Hostinger Web App staging hostname passes acceptance. |

**Least-disruptive production shape (recommended):**

```text
GitHub branch (immutable RC SHA)
  → Hostinger managed Node.js Web App (Next.js standalone, rootDirectory = apps/web)
  → External PostgreSQL (Supabase / Neon / or Postgres on Hostinger VPS 1828819)
  → Persistent media outside hbuilds/current (IMAGE_STORE_DIR + resume/readiness paths)
  → Cloudflare DNS / proxy / TLS only (do not use CF Pages as app host)
```

Do **not** deploy the Next.js app onto the existing WordPress document root of `gabbamedicalcentre.com.au` until staging is signed off. Hostinger `hosting_deploy` overwrites site contents.

---

## 2. Actual architecture (observed)

### 2.1 What runs today

| Layer | Observed fact | Classification |
| --- | --- | --- |
| Public apex `https://gabbamedicalcentre.com.au` | Hostinger shared/cloud site, **WordPress**, username `u621074518`, WP install id `23985916`, created 2025-10-14 | FACT |
| Staging / preview `https://next.gabbamedicalcentre.com.au` | Laptop UAT on `127.0.0.1:3100` + Cloudflare tunnel (`UAT_QUICK_TUNNEL`); health `{"ok":true,"phase":"golden-import","database":"up"}`; `X-Robots-Tag: noindex, nofollow` | FACT (2026-11-06) |
| Local Next.js | `apps/web` Next 15.5.x, `output: "standalone"`, Prisma → PostgreSQL, Auth.js (`next-auth` 5 beta), CMS, golden-master HTML in DB revisions | FACT |
| Local Postgres | Laptop (`DATABASE_URL` present in `apps/web/.env`; secrets not disclosed) | FACT |
| Hostinger account Web Apps | 36 websites listed; several `website_type: nodejs` (e.g. `docjob.com.au`, `tmedicals.com.au`, `hitnews.lk`) | FACT |
| Hostinger VPS | VM id `1828819`, Ubuntu 24.04, KVM 1 (1 vCPU / 4 GB / 50 GB), running, public IPv4 `200.97.170.180` | FACT |
| Prior written deploy guide | `deployment/LAUNCH.md` = Docker Compose on VPS (postgres + web + nginx). States “Do not deploy to Hostinger.” | FACT (policy to revise for Web App path) |

### 2.2 Target architecture (recommendation)

```text
                    ┌─────────────────────────────────────┐
  Patients/Staff    │ Cloudflare (DNS / proxy / WAF / TLS) │
                    └───────────────┬─────────────────────┘
                                    │ after cutover only
                    ┌───────────────▼─────────────────────┐
                    │ Hostinger Node.js Web App           │
                    │  - GitHub auto-deploy               │
                    │  - rootDirectory: apps/web          │
                    │  - appType: next                    │
                    │  - nodeVersion: 22 (LTS)            │
                    │  - build: npm run build             │
                    │  - standalone server (Hostinger)    │
                    └───────┬─────────────────┬───────────┘
                            │                 │
               DATABASE_URL │                 │ IMAGE_STORE_DIR +
                            │                 │ storage/* outside hbuilds
               ┌────────────▼──────┐   ┌──────▼──────────────────┐
               │ External Postgres │   │ Persistent media path   │
               │ (Supabase/Neon OR │   │ or object storage       │
               │  VPS Postgres)    │   │ (survives redeploy)     │
               └───────────────────┘   └─────────────────────────┘

  UNTIL CUTOVER:
    apex/www → existing WordPress on Hostinger (unchanged)
    next.    → laptop tunnel UAT OR new *.hostingersite.com Web App staging
    MX/email → unchanged
```

### 2.3 Role of Cloudflare

| Role | Appropriate? |
| --- | --- |
| DNS for apex / www / next | Yes |
| Proxy + TLS termination | Yes (Full (strict) once origin is Hostinger SSL or custom cert) |
| App host (Pages / Workers as primary Next runtime) | **No** for this stack — superseded fail path per project rules |
| Bulk redirects at edge (WordPress URL map) | Optional complement to `apps/web/src/middleware.ts` + `wordpress-legacy-redirects.ts` |

### 2.4 Cold start behaviour (Hostinger platform fact)

Hostinger docs (Node.js overview, updated 2026-10-21): after idle traffic the Node process may stop and restart on the next request. **Implication:** first hit latency; Prisma must reconnect. Not a hard blocker for a clinic site, but acceptance tests must include a cold-start check. Mark monitoring P1.

---

## 3. GitHub completeness assessment (Phase A)

### 3.1 Git state (commands run 2026-11-06)

| Item | Value |
| --- | --- |
| Branch | `rg01-release-gate-repairs` tracking `origin/rg01-release-gate-repairs` |
| Local HEAD | `9429234da8ce981904259b72c423af78fa5e7860` — `docs(wmc): note homepage hero freeze SHA 6874998 in working memory` |
| Remote tip | `6d388feba87ab1eb97f9907db1d32b8e04dc3e56` — `docs(wmc): record release SHA 3875dc3 and DNS cutover NO-GO checklist` |
| Local ahead of remote | **2 commits** (not pushed): `6874998` hero freeze authority v6; `9429234` working-memory note |
| Prior filed ship tip | `3875dc3` — Phase 1B/1C authority + insurance-notice gate (ancestor of remote tip) |
| Remote URL | `https://github.com/ThoshiMedicals/healthcare-doctors-platform.git` |
| Dirty working tree | **~115 modified**, **~181 untracked** (approx. from `git status --porcelain`) |
| `docs/` in Git | **0 tracked files** — entire `docs/` directory is local-only / untracked |
| Prisma migrations tracked | **11** migration files under Git |
| Prisma migrations on disk | **27** migration directories (17 untracked SQL migrations) |
| `old-html/` in Git | **567** tracked paths (golden master present remotely) |
| `gh` CLI | Not installed on this workstation |

### 3.2 Can a clean checkout reproduce “approved local”?

| Check | Result |
| --- | --- |
| Clean checkout of `origin/rg01-release-gate-repairs` @ `6d388fe` | Builds the **pushed** app (standalone Next + tracked migrations). Does **not** include local uncommitted recruitment/media/multi-tenant/docs work. |
| Clean checkout of local HEAD `9429234` (if pushed) | Adds homepage hero freeze (`6874998`) vs remote tip. Still missing dirty-tree features. |
| Dirty working tree “complete local” | Depends on untracked migrations, untracked `src/**`, modified `public-ux.ts` / `site.js`, local Postgres data, local `storage/`, and `.env` — **not GitHub-reproducible**. |

**Conclusion (FACT):** A successful local UAT build does **not** prove GitHub contains the complete application.

### 3.3 Local-only / non-GitHub dependencies

| Dependency | In GitHub? | Notes |
| --- | --- | --- |
| Application source (`apps/web/src`) | Partial | ~220 local-only/untracked source files vs remote |
| Prisma schema + migrations (careers, media, multi-tenant, attraction, growth) | Partial / untracked | Required for “complete” local schema |
| Golden HTML `old-html/` | Yes (tracked) | Import still needs `npm run import:golden` + DB |
| `apps/web/.env` | No (gitignored) | Secrets/env only |
| Local Postgres data (published pages, CMS users, applications) | No | DB dump required for content fidelity |
| `storage/images`, `storage/career-resumes`, `storage/gp-readiness-packages` | No | Runtime filesystem |
| Cloudflare tunnel / `next.` hostname | No | Operator laptop process |
| `docs/WMC-*.md` audits | No | Untracked; operational knowledge lives only locally until committed |

### 3.4 Release candidate recommendation

| Candidate | SHA | Use when |
| --- | --- | --- |
| **Patient-site minimum RC (already on GitHub ancestry)** | `3875dc3` (full: `3875dc34edae2bf39cb591835455484876803acc`) | Historical release artifact with Phase 1B/1C + insurance notices; prior A–E audit PASS |
| **Preferred patient-site RC once pushed** | `6874998` (or branch tip including it) | Adds frozen homepage authority hero v6 — already local HEAD parent; **must be pushed** before Hostinger Git deploy can see it |
| **“Complete local platform” RC** | **Does not exist yet** | Requires deliberate commit of P0 source + migrations (exclude `.tmp*`, secrets, scratch) onto a release branch, then immutable tag |

**Recommended GitHub branch for Hostinger Git integration:** create / use a dedicated branch such as `release/wmc-hostinger-webapp` cut from the chosen immutable SHA after push. Do **not** point Hostinger auto-deploy at a dirty laptop working tree or at `main` (`origin/main` tip `575c4b4` is an early merge, not the WMC release line).

**Do not push/merge from this audit** (restriction observed).

---

## 4. Hostinger compatibility matrix (Phase B)

Sources: Hostinger API schemas (`hosting_deploy`, `hosting_nodejs_*`), Hostinger support articles (MySQL-only on Web/Cloud; Supabase for Postgres; Node.js file structure), Hostinger Node.js docs (frameworks, idle stop), and this codebase.

| Component | Evidence | Classification |
| --- | --- | --- |
| Next.js 15 App Router + SSR | `apps/web`; Hostinger `app_type: next`; same-account Next 15 deploy completed | **COMPATIBLE** |
| `output: "standalone"` | `apps/web/next.config.ts` L8; Hostinger build log: “Detected Next.js standalone server output” | **COMPATIBLE** |
| Node version | Local Node **v24.20.0**; Hostinger supports 18/20/22/24; no `engines` in `package.json` | **REQUIRES CONFIGURATION** — set Hostinger **Node 22 LTS** explicitly |
| Package manager | npm (`package-lock` expected under `apps/web`) | **COMPATIBLE** (set `packageManager: npm`) |
| Install / build / start | Root wrappers + `apps/web` scripts: `build` = prisma generate + asset scripts + `next build`; `start` = `next start`; Hostinger starts standalone for Next (entry ignored) | **REQUIRES CONFIGURATION** — `rootDirectory: apps/web`, `buildScript: build`, `outputDirectory: .next` |
| Monorepo layout | App lives in `apps/web`, not repo root | **REQUIRES CONFIGURATION** |
| Prisma generate | `postinstall` + `build` run `prisma generate` | **COMPATIBLE** |
| PostgreSQL | `schema.prisma` `provider = "postgresql"`; Hostinger Web/Cloud = MySQL only | **REQUIRES CONFIGURATION** — external Postgres (not code change if `DATABASE_URL` points at Postgres). **UNSUPPORTED** as “Hostinger managed MySQL only” without migration (do **not** switch to MySQL for cutover). |
| SSL / pooling | Runtime `DATABASE_URL`; Supabase pooler recommended by Hostinger for IPv4 | **REQUIRES CONFIGURATION** |
| Auth.js sessions / cookies | `AUTH_SECRET`, `AUTH_URL`, `AUTH_TRUST_HOST`; middleware uses secure cookie salt behind HTTPS | **REQUIRES CONFIGURATION** — set `AUTH_URL` to staging/prod HTTPS origin; `AUTH_TRUST_HOST=true` |
| Host / clinic resolve | `apps/web/src/clinics/host.ts` + seeded clinic domains | **REQUIRES CONFIGURATION** — seed staging hostname into clinic domains; production apex/www already designed in seed |
| API routes / CMS / publish | App Router API + server actions; DB-backed page revisions | **COMPATIBLE** (with Postgres) |
| File uploads / media | `IMAGE_STORE_DIR` / `storage/images` (`image-store.ts`); media library writes under public/storage; careers resumes `storage/career-resumes`; GP readiness `storage/gp-readiness-packages` | **REQUIRES CODE CHANGE or path config** — Hostinger redeploy replaces `hbuilds/current`; writes inside app dir are lost. Point stores **outside** `hbuilds/` / `public_html` **or** move to object storage. Careers/readiness paths are hard-coded to `process.cwd()` → **REQUIRES CODE CHANGE** for durable Hostinger deploys. |
| Sharp | Dependency; `serverExternalPackages: ["sharp"]` | **COMPATIBLE** (Linux build on Hostinger) — verify on first staging build |
| Scheduled / background jobs | No Redis/cron worker observed as hard dependency; governance/measurement scripts are CLI | **COMPATIBLE** (no always-on worker required for patient site) |
| WebSockets | Not a required public path | **COMPATIBLE** / N/A |
| Redis | Not required | **COMPATIBLE** / N/A |
| Docker on Web App | Not used by managed Web App path | **N/A** (VPS Docker remains optional for Postgres-only) |
| Email notify | Resend / webhook optional (`RESEND_*`, `FORM_REQUEST_*`, `CAREER_APPLICATION_*`) | **REQUIRES CONFIGURATION** — app stores requests even without email |
| Logging | Hostinger `hosting_nodejs_runtime-logs` | **COMPATIBLE** |
| Writable FS | Needed for storage paths | **REQUIRES CONFIGURATION** — durable path outside release symlink |
| Env vars | `hosting_nodejs_replace-environment-variables` (full replace; masked on read) | **REQUIRES CONFIGURATION** |
| Custom domain / HTTPS | Hostinger Web App + Cloudflare | **REQUIRES CONFIGURATION** — attach domain only after staging; do not overwrite WP |
| Idle process stop | Hostinger platform behaviour | **REQUIRES CONFIGURATION** (ops awareness) / accept cold start |
| UAT quick tunnel flag | `UAT_QUICK_TUNNEL` forces noindex + `.next-uat` | **REQUIRES CONFIGURATION** — must be **unset** on Hostinger production/staging builds |

### 4.1 True managed-hosting incompatibilities (with evidence)

1. **No on-platform PostgreSQL** — Hostinger: “PostgreSQL … supported on VPS”; Node.js MySQL article: “Hostinger currently offers MySQL databases only” on shared/managed; app Prisma = PostgreSQL.  
   **Least disruptive fix:** External managed Postgres (Supabase wizard Hostinger documents) **or** run Postgres only on VPS `1828819` and point Web App `DATABASE_URL` at it (firewall allow Hostinger Web App egress). **Do not** rewrite schema to MySQL for launch.

2. **Ephemeral release filesystem** — Hostinger file structure: each deploy creates new `versions/{build-id}` and re-points `current`; edits under `hbuilds`/`public_html` overwritten. App writes portraits/resumes under cwd-relative `storage/**`.  
   **Least disruptive fix:** Set `IMAGE_STORE_DIR` to a durable directory **outside** `hbuilds` (e.g. `~/domains/<staging>/persistent/images`) **and** patch careers/readiness roots similarly (code change) **or** object storage. Without this, CMS image replacements and resumes disappear after redeploy.

3. **GitHub incompleteness** — not a Hostinger limit, but blocks reproducible Web App deploy of “complete local.”

There is **no** requirement to choose VPS merely because the stack is Next.js + Postgres + admin. VPS is only required if you insist on co-locating Postgres/Docker volumes without an external DB; the Next.js process itself is Web-App-compatible.

---

## 5. Data and content preservation plan (Phase C)

### 5.1 Sources of truth

| Asset | Source of truth | Location |
| --- | --- | --- |
| Application code / golden HTML package | Git | `apps/web`, `old-html/` |
| Published public pages (immutable revisions) | PostgreSQL | Imported from golden HTML + CMS publish |
| Practitioners, services, knowledge, updates | PostgreSQL (+ HTML inject overlays) | CMS collections |
| Admin users / roles / memberships | PostgreSQL | Auth.js + Prisma |
| Recruitment vacancies / applications / pipeline | PostgreSQL (+ resume files on disk) | Untracked migrations locally — verify before RC |
| Uploaded / replaced images | `IMAGE_STORE_DIR` (`storage/images`) overlaying `public/` | Volume on VPS compose; local disk on laptop |
| Secrets | Environment | Hostinger env UI / `.env` (never commit) |
| Live WordPress content | WordPress MySQL + `wp-content` | Hostinger site `gabbamedicalcentre.com.au` — **preserve until cutover**; not the Next.js content source |
| SEO redirects map | Code + optional Cloudflare/nginx CSV | `wordpress-legacy-redirects.ts`, `deployment/migration/*.csv` |

### 5.2 Deployment inventory

1. **GitHub-managed application code** — Next.js app, `old-html`, Prisma migrations (once committed), public static assets in Git, deploy scripts.  
2. **Database-managed content and records** — clinics, domains, page revisions, practitioners, services, knowledge, updates, forms, careers, audit logs, measurement events.  
3. **Persistent uploaded media** — `storage/images/{live,archive,pending}`, career resumes, GP readiness uploads; Git `public/assets/**` originals.  
4. **Environment-managed secrets** — `DATABASE_URL`, `AUTH_SECRET`, optional Resend/webhooks, seed admin (temporary).  
5. **External services / ops config** — HotDoc widgets (client-side), Cloudflare DNS, Hostinger Web App settings, email MX (unchanged), optional Supabase.

### 5.3 Database preparation (non-destructive)

- Provision **new** Postgres for Hostinger staging (empty).  
- Run `prisma migrate deploy` for the **RC migration set** only.  
- Import golden HTML / restore a **sanitised** dump from local UAT if needed for content parity.  
- **Do not** load live applicant PII into an unsecured or shared staging DB without access controls.  
- **Do not** mutate the WordPress MySQL DB as part of Next.js cutover.  
- Backup local UAT Postgres + `storage/` before any experimental migrate.

### 5.4 Backup / restore posture

| Artifact | Script / method | Status |
| --- | --- | --- |
| VPS-oriented backup | `deployment/backup-database.sh` → `database.sql` + `images.tar.gz` | Designed for Docker Compose volumes — adapt for external Postgres + Hostinger persistent dir |
| Filed off-box backup evidence | Prior audit | **FAIL / absent** (`deployment/backups/` not present) |
| WordPress backup | Hostinger WP tools | **NOT VERIFIED** in this pass — operator should take WP backup before any domain reassignment |

---

## 6. Functional verification matrix (Phase D)

Evidence rules: route existence alone ≠ VERIFIED. Classifications below reflect **this audit’s live/runtime checks** plus prior filed UAT/`next.` evidence where cited.

### 6.1 Workflow traces

| Workflow | Implementation touchpoints | Evidence class |
| --- | --- | --- |
| Patient: Search → Service → Practitioner → Booking | Reception index API, service/practitioner HTML from DB + inject modules, HotDoc / `tel:` CTAs, sticky care bar | **VERIFIED** on UAT/`next.` in prior go-live audit; **NOT TESTED** on Hostinger Web App |
| Admin: Login → Edit → Review → Publish → Public | Auth.js `/admin`, CMS actions, publish gates, `render-published-document` | **VERIFIED** locally/UAT historically; **NOT TESTED** on Hostinger |
| Practitioner: Create/Update → Publish → Directory → Booking | CMS practitioners + inject; phone-only paths for Mary/Golnar patterns | **VERIFIED** in code/tests (`inject-cms-*`, booking notices); **NOT TESTED** on Hostinger |
| Recruitment: Vacancy → Application → Notify → Record → Follow-up | Careers modules + Resend/webhook; much of this is **untracked** vs GitHub | Local capability **NOT fully in GitHub**; Hostinger **NOT TESTED**; email delivery **NOT TESTED** without Resend keys |
| SEO: Legacy URL → Redirect → Canonical → Sitemap → Indexing | `middleware.ts` + `wordpress-legacy-redirects.ts`; `public/robots.txt` / `sitemap.xml`; UAT noindex via tunnel flag | Middleware **VERIFIED** in tests/UAT; apex WordPress SEO **separate**; Hostinger staging indexing rules **NOT TESTED** |

### 6.2 Explicit checks

| Check | Status | Notes |
| --- | --- | --- |
| Practitioner profiles + booking options | VERIFIED (UAT/`next.` prior) / NOT TESTED (Hostinger) | Include new GPs Golnar/James/Yamesha per prior audit |
| Phone-only practitioner booking | VERIFIED (code/tests + prior hotfix) | Mary / Golnar `tel:` — no invented insurance notices |
| Mobile nav / keyboard a11y | VERIFIED (prior recovery + `site.js`) / NOT TESTED (Hostinger) | Cache-bust `site.js` headers in `next.config.ts` |
| Contact / recruitment forms | PARTIAL | Storage path works in code; notify needs env; Hostinger persistence risk |
| Notification delivery | NOT TESTED | Requires `RESEND_API_KEY` or webhook |
| Practitioner/service images | VERIFIED (UAT) / NOT TESTED (Hostinger persistence) | Managed-image API + store |
| Clinic resolution by hostname | VERIFIED (local/UAT host helpers) / NOT TESTED (Hostinger hostname) | Must seed staging host |
| Staging noindex / prod index | VERIFIED (`next.` noindex header present 2026-11-06) | Hostinger staging must set robots/noindex without `UAT_QUICK_TUNNEL` or with explicit header/env |
| Legacy `.html` URL preservation | VERIFIED (design + tests) / NOT TESTED (Hostinger) | |
| Canonical www/apex | NOT TESTED on Hostinger | `publicHostRedirectUrl` + CF/Hostinger domain rules |
| Obsolete practitioner links (Gemunu) | VERIFIED policy in prior recovery | Confirm 404/410 on staging |
| Live apex WordPress still up | VERIFIED | HTTP 200, `wp-content`, 2026-11-06 |
| Local UAT health | VERIFIED | `:3100` and `next.` `database:up` |

---

## 7. P0 release blockers

| ID | Blocker | Owner type | Prerequisite | Verification | Completion criterion |
| --- | --- | --- | --- | --- | --- |
| P0-1 | GitHub does not contain complete deployable tree | Release Manager + Dev | Decide RC scope (patient-min vs full local) | `git status` clean on RC branch; clean clone build | Clean clone of RC SHA builds; migrations present; no reliance on untracked P0 files |
| P0-2 | Push chosen RC commits (`6874998`+) and open Hostinger Git connection | DevOps | GitHub App connected in hPanel | Hostinger deploy sees correct commit | Staging build log shows expected SHA / branch |
| P0-3 | Provision external PostgreSQL | Database Architect | Choose Supabase/Neon/VPS Postgres | `psql` / Prisma migrate from staging | `prisma migrate deploy` succeeds; `/api/health` → `database:up` |
| P0-4 | Configure Hostinger Web App (separate staging domain) | DevOps | New `*.hostingersite.com` or unused addon — **not** WP apex | `hosting_get-deployment` completed | Next.js serves staging URL; WP apex unchanged |
| P0-5 | Set production-like env (no secrets in Git) | DevOps | Env inventory §8 | Masked key list via Hostinger API; auth login works | Admin login + public homepage 200 |
| P0-6 | Durable media/resume storage outside release dir | Engineer | Persistent path or object storage | Upload → redeploy → asset still 200 | Survives one no-op redeploy |
| P0-7 | Golden import / content restore on staging DB | CMS operator | Empty staging DB + RC | Smoke: home, 3 services, 3 doctors, book CTA | Content parity checklist signed |
| P0-8 | Acceptance test pack on Hostinger staging | QA / Practice Manager | P0-4…7 | §8 checklist executed + logged | Written PASS; no DNS change yet |
| P0-9 | WordPress + DNS rollback package | Ops | Hostinger WP backup; record current DNS | Artifact store off-box | Rollback can restore WP within RTO target |
| P0-10 | Do not set `UAT_QUICK_TUNNEL` on Hostinger; define staging robots policy | DevOps | Env review | Response headers on staging | Staging noindex until cutover; prod indexable only at GO |

### P1 (important, post-launch OK)

- Resend/webhook notification proof for careers + patient forms  
- Cold-start latency monitor / uptime ping to reduce idle stops  
- Adapt `backup-database.sh` for external Postgres + Hostinger persistent media  
- Cloudflare Full (strict) confirmation for apex after origin switch  
- Edge bulk redirects for residual WP URLs  
- Commit `docs/` audits to Git for institutional memory  
- Reception training for phone-only GPs  

### P2 (defer)

- Multi-clinic / network hub  
- Full recruitment CRM maturity  
- Object-storage abstraction beyond durable disk path  
- Replacing `LAUNCH.md` VPS guide entirely (keep as alternate)  

---

## 8. Step-by-step deployment plan (Phase E–F)

### 8.1 Hostinger deployment configuration (staging)

Create a **new** Node.js Web App (do **not** deploy onto `gabbamedicalcentre.com.au` while it is WordPress).

| Setting | Value |
| --- | --- |
| Source | GitHub `ThoshiMedicals/healthcare-doctors-platform` |
| Branch | `release/wmc-hostinger-webapp` (or RC branch) @ immutable SHA |
| `type` / `appType` | `nodejs` / `next` |
| `nodeVersion` | `22` |
| `rootDirectory` | `apps/web` |
| `buildScript` | `build` |
| `outputDirectory` | `.next` |
| `packageManager` | `npm` |
| `entryFile` | omit (ignored for Next) |

API-equivalent (do not execute in this audit): `hosting_deploy` with the above fields.

### 8.2 Environment variable names (no values)

Set via Hostinger Node.js env UI / `hosting_nodejs_replace-environment-variables` (**full replace** — send complete set).

| Name | Purpose | Storage |
| --- | --- | --- |
| `DATABASE_URL` | Prisma/Postgres connection (use pooler URL if Supabase) | Hostinger env |
| `AUTH_SECRET` | Auth.js signing secret | Hostinger env |
| `AUTH_URL` | Public HTTPS origin of **this** Web App | Hostinger env |
| `AUTH_TRUST_HOST` | `true` behind Hostinger/CF proxy | Hostinger env |
| `DEFAULT_CLINIC_SLUG` | `woolloongabba` | Hostinger env |
| `IMAGE_STORE_DIR` | Absolute durable path outside `hbuilds` | Hostinger env + filesystem |
| `PUBLIC_ASSET_ROOT` | Optional override for public assets | Hostinger env |
| `SEED_ADMIN_USERNAME` / `SEED_ADMIN_PASSWORD` / `SEED_ADMIN_EMAIL` | First seed only; remove after | Hostinger env (temporary) |
| `FORM_REQUEST_NOTIFY_EMAIL` | Patient form notify inbox | Hostinger env |
| `CAREER_APPLICATION_NOTIFY_EMAIL` | Careers notify inbox | Hostinger env |
| `RESEND_API_KEY` / `RESEND_FROM_EMAIL` | Optional email delivery | Hostinger env |
| `FORM_REQUEST_NOTIFY_WEBHOOK_URL` / `CAREER_APPLICATION_NOTIFY_WEBHOOK_URL` | Optional webhooks | Hostinger env |
| `GOLDEN_HTML_ROOT` | Only if import job uses alternate path | Hostinger env / one-off |

**Must unset / never set on Hostinger:** `UAT_QUICK_TUNNEL`.

Build-time note: Hostinger loads env during build. After env changes that affect Next build-time behaviour, **rebuild** (restart alone is insufficient for baked values).

### 8.3 Non-destructive staging sequence

1. Snapshot WordPress (`gabbamedicalcentre.com.au`) and record current DNS (A/AAAA/CNAME for apex, www, next; leave MX untouched).  
2. Push RC branch/SHA to GitHub (operator action — out of scope for this read-only audit).  
3. Create Hostinger Node.js Web App on a **new** hostname (e.g. unused `*.hostingersite.com`).  
4. Provision external Postgres; set `DATABASE_URL`.  
5. Set Auth + clinic env; create durable media directories; set `IMAGE_STORE_DIR`.  
6. Deploy from Git; poll `hosting_get-deployment` until `completed`.  
7. SSH/File Manager: confirm writable persistent dirs (NOT VERIFIED until operator checks).  
8. Run `npx prisma migrate deploy` in the deployed app context (method: Hostinger shell/one-off — **NOT VERIFIED** exact Hostinger UX; alternative: CI migrate job against staging DB before traffic).  
9. Seed clinic + import golden HTML (or restore sanitised dump).  
10. Run acceptance checklist (§8.4).  
11. Only after PASS: plan cutover (§8.5).

### 8.4 Acceptance test checklist (Hostinger staging)

- [ ] `/api/health` → `ok` + `database:up`  
- [ ] `/` homepage 200; hero/authority presentation matches RC  
- [ ] Three service pages + three practitioner pages 200  
- [ ] HotDoc book CTA present where expected; phone-only profiles use `tel:` only  
- [ ] Insurance notice on configured HotDoc slug practitioner(s)  
- [ ] `/admin/login` works; publish → public page updates  
- [ ] Image replace survives **redeploy**  
- [ ] Contact form stores request; careers application stores row (+ resume if in scope)  
- [ ] Mobile nav opens/closes; keyboard path usable  
- [ ] Sample WordPress legacy paths 301 to `.html` destinations  
- [ ] Staging sends `noindex` (header or robots)  
- [ ] Cold start: wait idle / force restart → first request recovers  
- [ ] Apex WordPress still unchanged  

### 8.5 Production cutover sequence (only after staging PASS)

1. Final off-box backup of staging DB + media; final WP backup.  
2. Record DNS rollback values.  
3. Attach `gabbamedicalcentre.com.au` / `www` to the **validated** Node Web App **or** point Cloudflare to Hostinger Web App origin — choose one operator-run method; **do not** leave two conflicting origins.  
4. Prefer: keep WP files intact on old vhost until Node domain swap proven; Hostinger domain move may convert site type — verify in hPanel (**NOT VERIFIED** exact UI path).  
5. Set `AUTH_URL=https://gabbamedicalcentre.com.au`; rebuild if required.  
6. Seed/ensure clinic domains include apex + www.  
7. Flip indexability (remove staging noindex).  
8. Run `deployment/smoke-test.sh` adapted to apex URL; Practice Manager sign-off.  
9. Submit sitemap in GSC.  
10. Monitor 24h (§8.7).

**`next` hostname:** either retire laptop tunnel and point `next.` at staging Web App, or keep as pre-prod; do not leave conflicting tunnels after apex cutover without a written decision.

**Email:** do not modify MX / mail-related DNS during web cutover.

### 8.6 Immediate rollback

1. Restore Cloudflare/Hostinger DNS to pre-cutover values (WordPress origin).  
2. Confirm apex serves WordPress 200.  
3. Leave Hostinger Node staging app running for diagnosis (do not delete).  
4. If DB was written only on staging, no WP data loss; if any shared resource was touched, restore from WP backup.  
5. Communicate to reception: public site rolled back; booking phone/HotDoc on WP as before.

### 8.7 Monitoring

**First 24 hours**
- `/api/health` uptime  
- Homepage + 5 services + 3 doctors + book/tel CTAs hourly  
- Admin login check  
- GSC crawl errors / 404 spike  
- Hostinger runtime logs for 5xx  
- Confirm WP is not still receiving apex traffic unexpectedly  

**First 30 days**
- Weekly backup restore drill (staging)  
- Redirect sample (legacy WP URLs)  
- Form/careers notification success rate  
- Cold-start / idle behaviour  
- Dependency/security patches (avoid forced Next 16 major on cutover week)  

---

## 9. Rollback plan (summary)

| Layer | Rollback action |
| --- | --- |
| DNS / public traffic | Re-point apex/www to WordPress Hostinger site (recorded values) |
| Hostinger Node app | Keep; stop auto-deploy if bad commits; redeploy last good SHA |
| Database | Restore Postgres from pre-cutover dump to staging/prod DB (never into WP MySQL) |
| Media | Restore persistent media directory / object bucket |
| Email | No change if MX untouched |
| `next.` | Re-enable laptop tunnel UAT if needed for diagnosis |

---

## 10. Explicit GO / GO WITH CONDITIONS / NO-GO verdict

### Platform architecture (Hostinger Web App + external Postgres)

**GO WITH CONDITIONS**

Conditions = P0-1…P0-10 above. Next.js on managed Web App is evidenced; Postgres and durable uploads are configuration/code prerequisites, not a reason to abandon Web Apps for VPS-only without cause.

### Production DNS cutover (apex / www)

**NO-GO**

Reasons (facts):
1. GitHub remote does not hold the complete local application.  
2. No Hostinger Web App staging deployment of **this** repo has been executed or accepted.  
3. External Postgres for WMC on Hostinger is not provisioned/evidenced.  
4. Durable upload storage strategy not implemented/verified on Hostinger.  
5. Prior 8-item ops evidence pack remains FAIL for the old VPS path; equivalent evidence not yet filed for the Web App path.  
6. Live WordPress site must remain authoritative for patients until independent validation.

### Score context

Prior launch readiness **68/100** remains directionally valid: product/UAT strong; **reproducible production hosting** is the gate. This Hostinger Web App path is viable and preferred for the Next.js process if Postgres + storage conditions are met; it does not unlock cutover until staging evidence exists.

---

## Appendix A — Command / API evidence log (abridged)

```text
git branch -vv     → rg01-release-gate-repairs...origin/... [ahead 2]
git rev-parse HEAD → 9429234da8ce981904259b72c423af78fa5e7860
git rev-parse origin/rg01-release-gate-repairs → 6d388feba87ab1eb97f9907db1d32b8e04dc3e56
git ls-files docs  → 0
migrations tracked → 11 files; on-disk dirs → 27
Invoke-WebRequest http://127.0.0.1:3100/api/health → database:up
Invoke-WebRequest https://next.gabbamedicalcentre.com.au/api/health → 200, X-Robots-Tag: noindex, nofollow
Invoke-WebRequest https://gabbamedicalcentre.com.au/ → 200, wp-content / wp-json
hosting_websites_list domain=gabba → website_type: wordpress
vps_virtual-machines_list → id 1828819 running
hosting_get-deployment cornflowerblue-lark-... → Next.js standalone publish completed
```

## Appendix B — Assumptions vs facts

| Statement | Type |
| --- | --- |
| Apex is WordPress on Hostinger | FACT |
| Next.js Web Apps work on this Hostinger account | FACT |
| WMC Prisma requires PostgreSQL | FACT |
| Hostinger Web/Cloud does not offer managed PostgreSQL | FACT (Hostinger docs) |
| External Supabase (or equivalent) is the intended managed pairing | FACT (Hostinger docs) + RECOMMENDATION for WMC |
| Uploads under app cwd survive Hostinger redeploy | FALSE assumption — treat as lost without durable path |
| Local UAT equals production readiness | FALSE |
| Exact Hostinger UI steps to convert WP domain → Node without downtime | NOT VERIFIED — validate on staging hostname first |
| VPS 1828819 currently runs WMC Postgres | NOT VERIFIED (no SSH from this audit) |

## Appendix C — Correction to prior deploy doctrine

`deployment/LAUNCH.md` and `deployment/HOSTINGER.md` currently forbid Hostinger. That doctrine targeted **wrong** Hostinger products (shared PHP/static or incomplete planning) and a **VPS Docker** golden path.  

**Updated architectural position (this document):** Hostinger **managed Node.js Web App + GitHub** is an approved **application hosting** target for WMC **provided** PostgreSQL and durable media are external/persistent. VPS remains optional (Postgres host or alternate full-stack). Cloudflare Pages remains a fail path for this app.

---

*End of report. No production systems were modified by this audit.*
