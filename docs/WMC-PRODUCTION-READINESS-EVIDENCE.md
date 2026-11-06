# WMC Production Readiness Evidence

**Audit only — evidence from this operator workstation.**  
**Date:** 2026-11-03  
**Authority:** [`WMC-MASTER-BRAIN.md`](./WMC-MASTER-BRAIN.md) §16 · [`WMC-OPERATIONS-RUNBOOK.md`](./WMC-OPERATIONS-RUNBOOK.md) §4 · [DEC-2026-12](./WMC-DECISION-REGISTER.md#dec-2026-12) · `deployment/LAUNCH.md` · `deployment/DNS-CUTOVER-CHECKLIST.md`

| Field | Value |
| --- | --- |
| Decision | **NO-GO** for production DNS cutover |
| Scope | Ops blockers only — no product/feature/content/admin-module changes |
| Workstation | Windows operator PC (local UAT + optional `next.` tunnel) |
| Git HEAD observed | `6d388fe` on `rg01-release-gate-repairs` |
| Release tip previously filed | `3875dc3` (manifest / prior checklist) |

**Rule:** Laptop UAT / `next.` health is **not** VPS staging smoke and does **not** clear cutover gates.

---

## Verdict

| Item | Result |
| --- | --- |
| 1. Off-box backup package | **FAIL — no evidence** |
| 2. VPS AUTH_* configuration | **FAIL — not inspectable** |
| 3. VPS database connectivity | **FAIL — not inspectable** |
| 4. Cloudflare Full (Strict) | **FAIL — not evidenced** |
| 5. Origin certificate | **FAIL — not evidenced** |
| 6. VPS smoke test | **FAIL — no VPS log** |
| 7. Rollback package | **FAIL — no backup package** |
| 8. DNS rollback values | **FAIL — values not recorded** |

### GO / NO-GO

**NO-GO**

All eight operational evidence items remain open or uninspectable from this workstation. Do **not** change public DNS for `gabbamedicalcentre.com.au` / `www` until each has filed evidence per `LAUNCH.md`.

---

## Evidence table

### 1. Off-box backup package

| Check | Evidence |
| --- | --- |
| Required artifacts | `database.sql`, `images.tar.gz`, `backup-manifest.txt` under a stamp dir, then stored **off** the VPS (`LAUNCH.md`) |
| Script present | **PASS** — `deployment/backup-database.sh` exists |
| Package present on this PC | **FAIL** — `deployment/backups/` does **not** exist |
| Named artifacts under `deployment/` | **FAIL** — no `database.sql` / `backup-manifest.txt` / `images.tar.gz` found |
| Off-box copy location documented | **FAIL** — none filed in checklist / reports |

### 2. VPS AUTH_* configuration

| Check | Evidence |
| --- | --- |
| Required | `AUTH_SECRET`, `AUTH_URL=https://gabbamedicalcentre.com.au`, `AUTH_TRUST_HOST=true` on VPS `apps/web/.env` (`LAUNCH.md`) |
| SSH / VPS access from this PC | **FAIL** — `%USERPROFILE%\.ssh` does **not** exist |
| Cloudflare / deploy tokens in environment | **FAIL** — `CLOUDFLARE_API_TOKEN`, `CF_API_TOKEN`, `CLOUDFLARE_EMAIL`, `SSH_AUTH_SOCK` all unset |
| Laptop `.env` as proof | **Rejected** — Runbook / DEC-2026-12 forbid copying laptop `.env` to production; local `AUTH_*` is not VPS evidence |

### 3. VPS database connectivity

| Check | Evidence |
| --- | --- |
| Required | Production Postgres reachable by the VPS web container; port **5432 not public** (`LAUNCH.md`) |
| VPS Postgres inspected | **FAIL** — no SSH; cannot run compose health or `ss`/`docker` on VPS |
| Local DB (non-qualifying) | Local `/api/health` on `:3100` and `:3000` returned `{"ok":true,"database":"up"}` — **laptop Postgres only**, not VPS |

### 4. Cloudflare Full (Strict)

| Check | Evidence |
| --- | --- |
| Required | Zone SSL/TLS mode = **Full (strict)** before apex points at VPS |
| Dashboard / API access | **FAIL** — no Cloudflare credentials available to agent |
| Public HTTPS observational | Apex `https://gabbamedicalcentre.com.au/` returned HTTP **200** from this PC (proves public site responds over TLS; **does not** prove Full (strict) to the new origin) |

### 5. Origin certificate

| Check | Evidence |
| --- | --- |
| Required | Origin cert (Let’s Encrypt DNS-01 or Cloudflare Origin Certificate) installed on VPS before Cloudflare sends public traffic to that origin (`LAUNCH.md`) |
| Cert files / nginx TLS paths on VPS | **FAIL** — not inspectable (no SSH) |
| Repo examples only | Nginx / origin examples exist under `deployment/` — **procedure, not installed-cert evidence** |

### 6. VPS smoke test

| Check | Evidence |
| --- | --- |
| Required | Logged run of `deployment/smoke-test.sh` against VPS staging (often via `--resolve` **on VPS** or allowed IP) + screenshots/sign-off |
| Script present | **PASS** — `deployment/smoke-test.sh` exists |
| VPS smoke log / screenshots in repo or ops folder | **FAIL** — none found |
| Local UAT / `next.` | **Not accepted** as staging smoke (Master Brain §16; DEC-2026-12; Runbook §4) |

### 7. Rollback package

| Check | Evidence |
| --- | --- |
| Required | Same off-box backup package usable with `deployment/restore-database.sh`; recovery checklist in `LAUNCH.md` |
| Restore script present | **PASS** — `deployment/restore-database.sh` exists |
| Package available to restore | **FAIL** — no backup stamp/package (item 1) |

### 8. DNS rollback values

| Check | Evidence |
| --- | --- |
| Required | Prior proxied A/AAAA (and related) values for apex / `www` recorded **before** cutover; rollback owner named |
| Values filed in checklist / ops note | **FAIL** — `DNS-CUTOVER-CHECKLIST.md` states values **not recorded**; no `dns-rollback-values` artifact found |
| Procedure documented | **PASS (doc only)** — `LAUNCH.md` §9 / Runbook DNS rollback section describe *how*; not a substitute for recorded values |

---

## What exists vs what is missing

| Present (scripts / docs) | Missing (filed evidence) |
| --- | --- |
| `backup-database.sh`, `restore-database.sh`, `smoke-test.sh`, `cloudflare-origin-firewall.sh` | Any `deployment/backups/<stamp>/` package |
| `LAUNCH.md` checklists and recovery steps | VPS `.env` / AUTH_* attestation |
| Cutover checklist + DEC-2026-12 NO-GO | VPS Postgres / firewall attestation |
| Local UAT health `database:up` | Cloudflare Full (strict) screenshot or API read |
| Public apex HTTP 200 | Origin certificate install proof on VPS |
| | VPS smoke log + screenshots |
| | Recorded pre-cutover DNS A/AAAA values + named rollback owner for the window |

---

## Non-evidence (explicitly excluded)

- Local multi-tenant / draft clinic / Authority Growth documentation work
- Local careers / media / admin feature changes
- Laptop `next.` tunnel availability
- Git release artifact quality alone (necessary but not sufficient for DNS GO)

---

## Clearance path (ops only — not performed here)

1. On VPS: run `sh deployment/backup-database.sh`; copy package off-box; file path + stamp here.  
2. Attest VPS `AUTH_*` + DB password alignment; confirm 5432 closed.  
3. Dashboard: SSL/TLS = Full (strict); attest origin cert paths.  
4. On VPS: run smoke test; attach log/screenshots.  
5. Record Cloudflare DNS values for apex/`www`; name rollback owner.  
6. Re-run this evidence audit → only then reconsider GO.

---

## Document history

| Date | Change |
| --- | --- |
| 2026-11-03 | Fresh workstation evidence audit; decision **NO-GO** (8/8 ops items open or uninspectable). |
