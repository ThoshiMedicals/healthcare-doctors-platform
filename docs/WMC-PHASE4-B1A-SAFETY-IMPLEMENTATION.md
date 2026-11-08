# WMC — Phase 4 B1A: Production database safety implementation

**Date:** 2026-11-08  
**Baseline tip:** `131c4997ad40f6c4b802933419f2df2f6ba16a3a`  
**Scope:** Local safety tooling + serve/API recruitment HOLD enforcement. No Supabase project creation, no real DB writes, no Hostinger/DNS changes in B1A.

### Clean build note (Prisma EPERM)

Windows `EPERM` renaming `query_engine-windows.dll.node` during `prisma generate` on the dirty primary checkout was an **environment file lock** (running Node/Next holding the DLL), not a schema defect. Reproduced **PASS** in isolated worktree `WMC-B1A-build-verify` at `131c499` + B1A files: `prisma validate`, `prisma generate`, full `npm run build`.

## 1. Importer safety (DB-only by default)

- [`apps/web/src/importer/runtime-copy.ts`](../apps/web/src/importer/runtime-copy.ts) — runtime copy requires **both** `--allow-runtime-copy` and `IMPORT_ALLOW_RUNTIME_COPY=true`.
- [`apps/web/src/importer/import-golden-html.ts`](../apps/web/src/importer/import-golden-html.ts) — ordinary imports call `maybeCopyRuntimeFiles` (no-op by default).
- [`apps/web/scripts/import-golden-html.ts`](../apps/web/scripts/import-golden-html.ts) — public integrity before/after gate; protected env load; `assertDbTarget` on non–dry-run.

## 2. Database target protection

- [`apps/web/src/db/assert-db-target.ts`](../apps/web/src/db/assert-db-target.ts)
- Wrappers: `npm run db:migrate:protected`, `npm run db:seed:protected`, `import:golden` (write path)
- Requires: `WMC_PRODUCTION_DB_APPROVED=yes`, `WMC_PRODUCTION_PROJECT_REF=<prod ref>`, `DIRECT_URL` (or `ADMIN_DATABASE_URL`) on **5432**
- Blocks: staging ref `thwcxuhrzgkufvdrvzzt`, localhost, port `6543` for admin ops, silent `.env` injection of protected keys

### Connection matrix (intentional — no `directUrl` in schema.prisma)

| Operation | URL | Port | Why |
| --- | --- | --- | --- |
| `db:migrate:protected` | `DIRECT_URL` → temporarily as `DATABASE_URL` for Prisma CLI | 5432 session/direct | Migrations need session features; avoids Hostinger staging break |
| `db:seed:protected` / import | Same | 5432 | Admin writes |
| Hostinger runtime | `DATABASE_URL` transaction pooler | 6543 + `pgbouncer=true` | Existing staging/prod runtime pattern |
| `pg_dump` | `DIRECT_URL` | 5432 | Logical backup |

**Why `DIRECT_URL` was not added to `schema.prisma`:** Prisma requires the env var at `prisma generate` / build time. Hostinger staging currently has only `DATABASE_URL`. Adding `directUrl = env("DIRECT_URL")` would break staging builds until Hostinger env is updated. Protected wrappers achieve the same admin/runtime split without that risk.

## 3. Content reconciliation

- Inventory: [`approved-path-inventory.ts`](../apps/web/src/importer/approved-path-inventory.ts) — 226 approved paths, 19 Class B
- Builder: [`content-reconciliation.ts`](../apps/web/src/importer/content-reconciliation.ts)
- CLI: `npm run reconcile:content` → `apps/web/reports/b1a-content-reconciliation.json`
- Optional later: `--published-sha-fixture=path.json` (operator-approved SHAs — **not** produced by live export in B1A)

Without a published-SHA fixture, every approved path reports `approved_sha_unknown` and `operatorApprovalRequired=true`. Matching paths must not be assumed content-identical.

### Local reconcile snapshot (2026-11-08, no live export)

| Metric | Value |
| --- | ---: |
| Golden pages | 207 |
| Approved inventory | 226 |
| Class A (shared non-recruitment) | 206 |
| Class B (non-golden PE about-us) | 4 |
| Class D (recruitment HOLD paths) | 11 |
| Class E (doctor/clinical approval) | 5 |
| SHA unknown on shared paths | 207 |
| Paths requiring operator approval | 226 |

Class B constant list remains **19** paths; parityClass splits them into B/D/E per HOLD and clinical rules.

## 4. Clinical governance retention

See [`clinical-governance-inventory.ts`](../apps/web/src/db/clinical-governance-inventory.ts):

| Table | Production policy |
| --- | --- |
| page_revisions | Current published SHA only (not all 253 staging rows) |
| clinical_reviews | Operator decide — approved rows only |
| editorial_items | Exclude staging test |
| content_revisions | Operator decide |
| audit_logs | Staging only — do not import |
| navigation_* | Rebuild from seed + golden/Class B |
| media_assets | Operator decide |
| private_objects / career_applications / form_requests / vacancies | Exclude |

## 5. Recruitment HOLD

[`recruitment-hold.ts`](../apps/web/src/importer/recruitment-hold.ts) — **enforced** on serve/API paths (not manifest-only):

| Path | DB | Public serve | Index | Forms |
| --- | --- | --- | --- | --- |
| `join-our-team.html` | yes | yes | no (meta forced) | no |
| `join-our-team/*` children | yes (HOLD) | **404 via render** | no | no |

Enforcement points:
- `getPublishedDocument` → `canServeRecruitmentPathPublicly` / `mustNoIndexRecruitmentPath`
- Public EOI, career-applications, readiness, readiness-package APIs → 403 while HOLD
- Vacancy inject on join hub skipped while HOLD
- Dynamic sitemap excludes noindex recruitment paths

Lift only with `RECRUITMENT_HOLD_LIFTED=true` after Attraction Index Gate + operator GO.

### Bypass prohibition (runbook)

Protected wrappers (`db:migrate:protected`, `db:seed:protected`, `import:golden` write path) enforce target guards. **Direct** `prisma migrate deploy`, `psql`, or ad-hoc SQL against production **bypasses** these controls and is **prohibited** by the production runbook. All B1 writes must use the protected entrypoints.

## 6. Security preparation (offline)

[`security-hardening-checklist.ts`](../apps/web/src/db/security-hardening-checklist.ts) — Data API disable, prisma role, revoke anon/authenticated, RLS enable, private table checks. **Not executed** against Supabase in B1A.

## 7. Backup coverage

| Asset | Location | Backup method | Restore drill |
| --- | --- | --- | --- |
| `private_objects.bytes` | Postgres bytea (if used) | `pg_dump` via DIRECT_URL | Restore to throwaway project |
| Supabase Storage objects | Storage buckets (if used) | Storage dump / mirrored off-box | Separate from SQL restore |
| Public deploy assets | git tip `apps/web/public` + build | Git SHA + deploy artifact | Redeploy tip |
| Media registry rows | `media_assets` table | Included in `pg_dump` | With DB restore |
| Page HTML | `page_revisions.html` | Included in `pg_dump` | With DB restore |

## 8. Preview hostname seed hook

`PRODUCTION_PREVIEW_HOSTNAME=*.hostingersite.com` may be set during a future protected seed to upsert a non-primary `ClinicDomain`. Apex/www remain in seed; DNS unchanged in B1A.

## 9. Remaining B1 execution blockers

1. Operator spend approval (Supabase Pro ± PITR)
2. Create empty production project (separate approval)
3. Operator Class A–E + published SHA fixture approval
4. Clinical/governance decisions for `operator_decide` tables
5. Recruitment HOLD lift (or accept HOLD defaults)
6. Security checklist execution on new project
7. GitHub sync of B1A tooling (separate approval — not done here)
8. Off-box dump + restore drill after first content load
