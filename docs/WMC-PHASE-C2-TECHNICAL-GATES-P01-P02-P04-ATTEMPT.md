# WMC — C2 technical gates P01 / P02 / P04 attempt

**Date:** 2026-11-13  
**Staging app tip:** `fdcb9c4e6f3977fed26b68ac569def825443a23e`  
**Verdict:** **C2 TECHNICAL GATES BLOCKED — EXACT REMAINING ISSUE**

---

## Final verdict

### **C2 TECHNICAL GATES BLOCKED — EXACT REMAINING ISSUE**

**Blocking issue:** No usable **staging Direct Postgres connection credential** is available to this agent session, and the workstation lacks `pg_dump` / Docker. Therefore a controlled off-box logical backup **cannot** be taken, restore verification **cannot** start, and Auth.js env repair (**P04**) is **not** authorised to proceed under the staged gate order.

Privacy/legal and clinical/security approvals remain separate and outstanding.

---

## Project identity confirmation (P01 pre-check) — PASS

| Field | Value |
| --- | --- |
| Supabase name | `wmc-hostinger-staging` |
| Project ref | `thwcxuhrzgkufvdrvzzt` |
| Region | `ap-southeast-2` |
| Status | `ACTIVE_HEALTHY` |
| DB host | `db.thwcxuhrzgkufvdrvzzt.supabase.co` |
| Live app health | `{"ok":true,"database":"up"}` on both staging hosts |
| MCP identity query | `current_database()=postgres`, user `postgres`, PG 17.11 |

Read-only inventory (MCP `execute_sql`, no writes):

| Metric | Count |
| --- | --- |
| `pages` | **230** |
| `pages` with `status = published` | **229** |
| `practitioners` | **15** |
| `clinics` | **1** |
| `_prisma_migrations` | **29** |

**Source DB was not modified.**

---

## Stage 1 — C2-P01 Backup — BLOCKED

### Attempted

1. Confirmed project identity via Supabase MCP.  
2. Searched for Direct/Session staging `DATABASE_URL` in worktree, Master Project, backup clones, process env, Hostinger list (values **masked**).  
3. Local `.env` files resolve only to `localhost` (`wmc` / `wmc_uat`) — **not** staging.  
4. Confirmed prior empty stamp folders under `Desktop\WMC-Backups\staging-thwcxuhrzgkufvdrvzzt-*` still have **0 dump files** (same as 2026-11-11 gate).  
5. `npx supabase projects list` → **AccessTokenRequiredError** (no `supabase login` / `SUPABASE_ACCESS_TOKEN`).  
6. `pg_dump` / `pg_restore` / `docker` **not installed** on PATH.

### Credential availability (booleans)

| Source | Staging dump credential? |
| --- | --- |
| Agent / shell `DATABASE_URL` / `DIRECT_URL` / `SUPABASE_DB_URL` | **No** |
| Local apps/web `.env*` | Localhost only |
| Hostinger `DATABASE_URL` via API | Key present; value **masked** — unusable for dump |
| Supabase CLI access token | **No** |
| Operator-completed dump artifacts | **Missing** |

### P01 outputs

| Item | Status |
| --- | --- |
| Dump file | **Not created** |
| Checksum | **N/A** |
| Archive readability | **N/A** |

---

## Stage 2 — C2-P02 Restore — NOT STARTED

Per runbook: restore only after P01 passes. **Skipped.**  
No disposable database created. No restore into staging/production attempted.

---

## Stage 3 — C2-P04 Auth.js — NOT STARTED

Per owner instruction: only after recovery gates pass. **Skipped** (no Hostinger env replace).

Pre-existing diagnosis remains valid (not re-applied):

- Custom host `/api/auth/signin` → `callbackUrl` hostingersite (pinned `AUTH_URL`).  
- Approved repair: remove `AUTH_URL`, keep `AUTH_TRUST_HOST=true`.  
- Requires full env replace with **real** secrets from operator store — not available to agent without operator paste into private shell.

---

## Hostinger build / restart

| Item | Value |
| --- | --- |
| Deploy / restart this task | **None** |
| Current build UUID (unchanged) | `01a1d286-af8b-72a9-9be4-0743867296d6` |

---

## Security / regression

| Check | Result |
| --- | --- |
| No credential logged or committed | **PASS** (this attempt) |
| No DB write / migrate | **PASS** |
| No push / subscription | **PASS** |
| Public staging tip unchanged | **PASS** (`fdcb9c4`) |
| Patient Hub / HotDoc / directory / C1 / noindex | **Not re-exercised for Auth** (P04 not run); health still up |

---

## Rollback

No configuration or data change was applied → **rollback N/A** (nothing to undo).

---

## Exact operator actions to unblock

1. On a private local shell only (do **not** paste into chat): set Direct Postgres URL for `thwcxuhrzgkufvdrvzzt` (port **5432**, password from Supabase Dashboard → Database settings).  
2. Install Postgres client tools **or** use Docker Postgres for restore target.  
3. Follow `Desktop\WMC-Backups\STAGING-OFFBOX-BACKUP-OPERATOR-STEPS.md` / `docs/WMC-PHASE-C2-STAGING-DB-BACKUP-RESTORE.md`:  
   - `pg_dump --format=custom` (or `npx supabase db dump` after `supabase login`) into a new stamp folder under `Desktop\WMC-Backups\`.  
   - Write SHA-256 sidecar.  
   - `pg_restore --list` integrity.  
4. Restore into **local disposable** Postgres (Option C) or throwaway cloud DB — **never** live staging.  
5. Reply with **path + sizes + SHA-256 only** for gate re-check.  
6. After P01+P02 PASS: authorise Hostinger env full-replace **excluding** `AUTH_URL` (real values from secret store) for P04.

---

## Updated gate statuses

| Gate | Status |
| --- | --- |
| C2-P01 | **BLOCKED** — no staging DB credential / no dump tool |
| C2-P02 | **BLOCKED** — blocked by P01 |
| C2-P04 | **BLOCKED** — deferred until P01+P02; diagnosis ready |
| C2-P06 / P10 / P13 | **BLOCKED** — governance (unchanged) |
