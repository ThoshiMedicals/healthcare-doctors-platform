# WMC DNS cutover checklist — 2026-11-03

**Decision: NO-GO** for production DNS cutover.

Release artifact is shipped; operational LAUNCH.md evidence is not available from this workstation.

## A–E release audit

| Gate | Result | Evidence |
| --- | --- | --- |
| A. Git status (release paths) | PASS | Tip `3875dc3` on `rg01-release-gate-repairs`. No modified/untracked files from `RELEASE-ARTIFACT-MANIFEST.md`. Leftover untracked only: `.cursor/`, `.tmp-pdf-convert/`, scratch txts, optional `old-html/cms/` tools (explicitly excluded). |
| B. Release commit SHA | PASS | Full: `3875dc34edae2bf39cb591835455484876803acc` · Short: `3875dc3` · Pushed to `origin/rg01-release-gate-repairs` (`09b7d78..3875dc3`). |
| C. Files included | PASS | 139 paths in commit; manifest required HTML/runtime/tests/WebPs present (`missingCount=0`). |
| D. Tests passing | PASS | `booking-restriction-notice.test.ts` + `public-ux.test.ts` → 16/16 pass. |
| E. Manifest ↔ repository | PASS | All manifest include paths exist at HEAD; `placeRestriction` absent in HEAD `site.js`; bust `wmc-nav-20261102d`. |

## Operational evidence (LAUNCH.md)

| Requirement | Status | Evidence on this machine |
| --- | --- | --- |
| 1. Off-box backup (`database.sql`, images archive, `backup-manifest.txt`) | **CRITICAL — FAIL** | `deployment/backup-database.sh` exists. No `deployment/backups/` package; no `database.sql` / `backup-manifest.txt` found in repo. |
| 2. VPS env (`AUTH_SECRET`, `AUTH_URL`, `AUTH_TRUST_HOST`, DB connectivity) | **CRITICAL — FAIL** | No `~/.ssh`; cannot inspect VPS `.env` or Postgres. Do not copy laptop `.env`. |
| 3. Cloudflare Full (strict) + origin certificate | **CRITICAL — FAIL** | No Cloudflare API/dashboard credentials in agent. Mode and origin cert not evidenced. |
| 4. VPS smoke testing (logged + screenshots) | **CRITICAL — FAIL** | `deployment/smoke-test.sh` present. No VPS staging smoke log. Local UAT health only (`127.0.0.1:3100` / tunnel) is not staging smoke. |
| 5. Rollback readiness (prior DNS values + procedure) | **CRITICAL — FAIL** | Procedure documented in `LAUNCH.md` §9. Prior proxied A/AAAA values for apex/`www` not recorded here; off-box backup for release restore not evidenced. |

## Deploy steps after ops evidence is filed

1. On VPS: `git fetch && git checkout 3875dc3` (or pull `rg01-release-gate-repairs`).
2. Off-box backup: `sh deployment/backup-database.sh` → copy package off VPS.
3. Confirm `AUTH_*` + DB password in VPS env; Postgres not public.
4. Confirm Cloudflare SSL/TLS = Full (strict); origin cert installed.
5. Build/migrate/import per `LAUNCH.md`; run `sh deployment/smoke-test.sh https://gabbamedicalcentre.com.au` via `--resolve`.
6. Record current Cloudflare DNS values; keep rollback owner online.
7. Only then: DNS cutover (§8) → public smoke → 24-hour checks.

## GO / NO-GO

**NO-GO** — five CRITICAL operational blockers remain. Do not change public DNS until each has filed evidence.
