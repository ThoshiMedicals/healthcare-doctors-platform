# WMC — Phase C2 staging database backup & restore readiness

**Date:** 2026-11-13  
**Project:** Supabase `wmc-hostinger-staging` (`thwcxuhrzgkufvdrvzzt`, region `ap-southeast-2`, status **ACTIVE_HEALTHY**)  
**App tip:** Hostinger staging `fdcb9c4` · health `database: up`  
**Scope:** Procedure and evidence requirements only. **No dump, restore, branch create, or migrate executed in this pass.**

---

## 1. Current arrangements (inspected)

| Item | Finding |
| --- | --- |
| Runtime DB | External Supabase Postgres (not Hostinger MySQL) |
| Connection | Hostinger Node env key `DATABASE_URL` present (value masked) |
| Project health | MCP `list_projects` → `ACTIVE_HEALTHY` |
| Dev branches | None listed via MCP `list_branches` (empty) |
| Prior exception | Staging deploys historically accepted under temporary **off-box backup risk exception** — not a permanent waiver |
| Local CLI | `npx supabase` available (3.1.x); global `supabase` not on PATH |
| This agent | Must **not** create branches (cost), restore into live staging, or run destructive SQL |

Platform-managed daily backups / PITR (if enabled on the plan) are **operator-dashboard** concerns — treat them as complementary to an **independent off-box logical dump** before any C2 migrate.

---

## 2. Safe backup procedure (owner-authorised)

**Goal:** One point-in-time logical backup stored **off the staging app host** and **off** the sole Supabase project disk dependency.

### 2.1 Preferred — logical dump (portable)

1. Owner approves in writing: “Take staging logical backup for C2 gate.”  
2. From a trusted operator machine (not the Hostinger web root), using the **staging** connection string from the secret store (prefer **direct** DB URL for dump fidelity; follow Supabase docs for pooler vs direct):

```text
pg_dump "$STAGING_DATABASE_URL_DIRECT" \
  --format=custom --no-owner --no-acl \
  --file "wmc-staging-thwcxuhrzgkufvdrvzzt-YYYYMMDD-HHMMZ.dump"
```

3. Store the file in the practice’s off-box archive (e.g. encrypted drive / approved cloud vault).  
4. Record: UTC timestamp, operator name, project ref, dump filename, byte size, SHA-256.  
5. Do **not** commit dumps to Git.

### 2.2 Complementary — Supabase dashboard

1. In Supabase Dashboard → project `wmc-hostinger-staging` → Database → Backups.  
2. Confirm plan backup/PITR status; screenshot or export confirmation for the gate file.  
3. Dashboard backups alone do **not** replace the off-box dump for the C2 gate.

### 2.3 Integrity verification

| Step | Action | Pass criterion |
| --- | --- | --- |
| I1 | `Get-FileHash` / `sha256sum` on dump | Hash recorded |
| I2 | `pg_restore --list dumpfile` (or equivalent) | Lists expected schemas/tables; exit 0 |
| I3 | Optional: restore to **throwaway** target only (see §3) | App-schema tables present; row smoke counts sane |
| I4 | Confirm dump age | Taken immediately before intended migrate window |

---

## 3. Isolated restore-test procedure (do not use live staging)

**Hard rule:** Never restore into the existing staging database used by Hostinger, and never into any production or WordPress database.

### Option A — New throwaway Supabase project (recommended for first drill)

1. Owner approves cost of a temporary project (or pauses after drill).  
2. Create empty project in `ap-southeast-2`.  
3. `pg_restore` into that project’s empty DB only.  
4. Run Prisma `migrate status` / read-only `SELECT count(*)` smoke against throwaway only.  
5. Tear down throwaway project when done.

### Option B — Supabase preview/development branch

1. Owner agrees to **hourly compute cost** (MCP `create_branch` requires cost confirmation).  
2. Create branch **after** explicit chat approval.  
3. Note: branches typically get **schema from migrations**, not a full data clone of production/staging data — for a **data** restore drill, Option A is clearer. Use Option B primarily for migration dry-runs against empty/fresh schema.

### Option C — Local Docker Postgres

1. `pg_restore` into local empty container.  
2. No cloud cost; good integrity check; does not prove Supabase network path.

**Forbidden:** `pg_restore` targeting `db.thwcxuhrzgkufvdrvzzt.supabase.co` while Hostinger still uses it; `reset_branch` / `DROP DATABASE` on staging; overwriting Hostinger `DATABASE_URL` to point at a half-restored DB.

---

## 4. Database recovery checklist (staging incident / migrate rollback)

1. Confirm Hostinger app can be paused or flag-gated (no engagement workers).  
2. Identify latest known-good dump (hash + time).  
3. Prefer: restore dump into **new** DB → switch `DATABASE_URL` only after health checks — **requires separate Hostinger env approval**.  
4. Alternate: in-place restore only with dual written approval (owner + tech) and scheduled downtime — **not** the default C2 path.  
5. Redeploy known app archive if schema/app mismatch (`wmc-patient-journey-m1-m2-fdcb9c4.zip` or pre-migrate tip).  
6. Verify `/api/health`, public hub, `/admin/login`, no unexpected migration drift.  
7. File incident note + new post-recovery dump.

---

## 5. Owner approvals required

| Approval | Required for |
| --- | --- |
| Take logical dump of staging | Backup gate evidence |
| Create throwaway project / paid branch | Restore drill |
| Change Hostinger `DATABASE_URL` | Any cutover after restore |
| Apply Prisma migrate on staging | Separate C2 implementation approval |

---

## 6. Evidence to mark C2-P01 / C2-P02 **PASS**

| Gate | Evidence pack |
| --- | --- |
| **C2-P01 Backup** | Off-box dump file path (or vault ID), SHA-256, size, UTC time, operator; `pg_restore --list` log; optional dashboard backup screenshot |
| **C2-P02 Restore** | Written confirmation restore ran into **non-staging** target; restore log; sample read-only counts; teardown note |

Until that evidence exists, both gates remain **BLOCKED** even though this runbook is complete.

---

## 7. Relation to C2 migrate

Only after **C2-P01 + C2-P02 PASS** and **C2-P13 implementation approval**: take a **fresh** dump, then apply additive engagement migration. Rollback = restore that pre-migrate dump (to an isolated DB + URL switch, or approved in-place procedure).
