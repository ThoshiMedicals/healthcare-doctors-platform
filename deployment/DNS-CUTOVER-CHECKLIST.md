# WMC DNS cutover checklist — 2026-11-03

**Decision: NO-GO** for production DNS cutover.

Release artifact audit (A–E) previously PASS at tip `3875dc3`. Operational LAUNCH.md evidence remains unavailable from this workstation.

**Full 8-item evidence pack:** [`docs/WMC-PRODUCTION-READINESS-EVIDENCE.md`](../docs/WMC-PRODUCTION-READINESS-EVIDENCE.md) (re-audit 2026-11-03).

## A–E release audit

| Gate | Result | Evidence |
| --- | --- | --- |
| A. Git status (release paths) | PASS | Tip `3875dc3` on `rg01-release-gate-repairs`. No modified/untracked files from `RELEASE-ARTIFACT-MANIFEST.md`. Leftover untracked only: `.cursor/`, `.tmp-pdf-convert/`, scratch txts, optional `old-html/cms/` tools (explicitly excluded). |
| B. Release commit SHA | PASS | Full: `3875dc34edae2bf39cb591835455484876803acc` · Short: `3875dc3` · Pushed to `origin/rg01-release-gate-repairs` (`09b7d78..3875dc3`). |
| C. Files included | PASS | 139 paths in commit; manifest required HTML/runtime/tests/WebPs present (`missingCount=0`). |
| D. Tests passing | PASS | `booking-restriction-notice.test.ts` + `public-ux.test.ts` → 16/16 pass. |
| E. Manifest ↔ repository | PASS | All manifest include paths exist at HEAD; `placeRestriction` absent in HEAD `site.js`; bust `wmc-nav-20261102d`. |

## Operational evidence (LAUNCH.md) — re-audit 2026-11-03

Workstation HEAD at re-audit: `6d388fe` on `rg01-release-gate-repairs` (post-tip local history may exist; cutover still requires filed ops evidence, not git alone).

| # | Requirement | Status | Evidence on this machine |
| --- | --- | --- | --- |
| 1 | Off-box backup package (`database.sql`, `images.tar.gz`, `backup-manifest.txt`) | **CRITICAL — FAIL** | `deployment/backup-database.sh` exists. `deployment/backups/` absent. No package artifacts under `deployment/`. |
| 2 | VPS `AUTH_*` (`AUTH_SECRET`, `AUTH_URL`, `AUTH_TRUST_HOST`) | **CRITICAL — FAIL** | `%USERPROFILE%\.ssh` absent; Cloudflare/SSH tokens unset. Laptop `.env` is not VPS evidence. |
| 3 | VPS database connectivity (Postgres up; 5432 not public) | **CRITICAL — FAIL** | VPS unreachable. Local `:3100`/`:3000` `/api/health` → `database:up` is laptop only. |
| 4 | Cloudflare Full (strict) | **CRITICAL — FAIL** | No CF API/dashboard credentials. Apex HTTPS **200** does not prove Full (strict). |
| 5 | Origin certificate on VPS | **CRITICAL — FAIL** | Origin cert install paths not inspectable without SSH. |
| 6 | VPS smoke test (logged + screenshots) | **CRITICAL — FAIL** | `deployment/smoke-test.sh` present. No VPS smoke log. Local UAT / `next.` ≠ staging smoke. |
| 7 | Rollback package (usable restore) | **CRITICAL — FAIL** | `deployment/restore-database.sh` present; no backup package to restore. |
| 8 | DNS rollback values (prior A/AAAA + owner) | **CRITICAL — FAIL** | Procedure in `LAUNCH.md` §9. Prior proxied apex/`www` values **not recorded**; no rollback-values artifact. |

## Deploy steps after ops evidence is filed

1. On VPS: `git fetch && git checkout 3875dc3` (or pull `rg01-release-gate-repairs` at the agreed ship SHA).
2. Off-box backup: `sh deployment/backup-database.sh` → copy package off VPS.
3. Confirm `AUTH_*` + DB password in VPS env; Postgres not public.
4. Confirm Cloudflare SSL/TLS = Full (strict); origin cert installed.
5. Build/migrate/import per `LAUNCH.md`; run `sh deployment/smoke-test.sh https://gabbamedicalcentre.com.au` via `--resolve`.
6. Record current Cloudflare DNS values; keep rollback owner online.
7. Only then: DNS cutover (§8) → public smoke → 24-hour checks.

## GO / NO-GO

**NO-GO** — eight operational evidence items remain FAIL / uninspectable. Do not change public DNS until each has filed evidence in [`docs/WMC-PRODUCTION-READINESS-EVIDENCE.md`](../docs/WMC-PRODUCTION-READINESS-EVIDENCE.md).
