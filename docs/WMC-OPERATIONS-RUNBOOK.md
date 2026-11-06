# WMC Operations Runbook

**Authority:** Operational procedures aligned with [`WMC-MASTER-BRAIN.md`](./WMC-MASTER-BRAIN.md).  
**Production source of truth for commands:** `deployment/LAUNCH.md` (this runbook indexes and clarifies; it does not replace LAUNCH).  
**Cutover gate:** `deployment/DNS-CUTOVER-CHECKLIST.md`.  
**Dev standards:** [`WMC-DEVELOPMENT-STANDARDS.md`](./WMC-DEVELOPMENT-STANDARDS.md).

---

## 1. Environments at a glance

| Environment | Where it runs | URL / port | Purpose |
| --- | --- | --- | --- |
| Dev | Operator PC | `localhost:3000` | Day-to-day coding (`npm run dev`) |
| UAT | Operator PC | `127.0.0.1:3100` | Production-like Next build (`.next-uat`) |
| `next.` | Operator PC + Cloudflare tunnel | `https://next.gabbamedicalcentre.com.au` | Shareable UAT (not VPS) |
| Staging (pre-cutover) | VPS | Apex via `--resolve` / hosts | Full stack while public DNS still on old site |
| Production | VPS | `https://gabbamedicalcentre.com.au` | Live after DNS GO |

**Critical:** Updating `next.` means rebuild/restart **local UAT**, not SSH to a VPS.

---

## 2. UAT (local + tunnel)

### Prerequisites

- PostgreSQL up: `npm run db:local` or `deployment/docker-compose.yml`.
- From `apps/web`: dependencies installed.

### Build and start

```powershell
cd apps/web
npm run uat:build
# If next-env.d.ts now points at .next-uat/types, restore before commit:
#   git checkout -- apps/web/next-env.d.ts
npm run uat
```

- Listens on **3100** (`UAT_QUICK_TUNNEL=true`, distDir `.next-uat`).
- Health: `http://127.0.0.1:3100/api/health` → expect `"database":"up"`.
- If health shows `database: down` or HTML 500, fix Postgres first.

### Cloudflare quick tunnel (`next.`)

```powershell
cloudflared tunnel --url http://127.0.0.1:3100
```

- Named-tunnel docs also exist under `deployment/CLOUDFLARE-*-UAT.md`.
- Operator machine may have **no** `~/.ssh` and no Cloudflare purge API in-agent — edge purge is dashboard/operator unless credentials are provided.
- Prefer `?v=` cache busts in `public-ux.ts` so public JS/CSS updates without relying on purge.

### After public-ux / site.js / next.config changes

1. `uat:build` → `uat`.
2. Verify `127.0.0.1:3100` **and** `https://next.gabbamedicalcentre.com.au`.
3. Confirm bust query string on `site.js` / `styles.css` if behaviour looked “stuck”.

### Port already in use

Stop the process bound to 3100, then `npm run uat` again. Do not assume an old UAT binary matches the latest tip.

---

## 3. Deployments (VPS production stack)

**Only guide:** `deployment/LAUNCH.md`.

### Do

- Deploy on the **VPS** with `deployment/docker-compose.production.yml`.
- Create `apps/web/.env` and `deployment/.env` **on the server** from examples — never copy laptop `.env`.
- Required production env includes `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `AUTH_TRUST_HOST`, `DEFAULT_CLINIC_SLUG`, Postgres password alignment.

### Typical first bring-up (summary)

```sh
docker compose -f deployment/docker-compose.production.yml up -d --build
docker compose -f deployment/docker-compose.production.yml exec web npx prisma migrate deploy
docker compose -f deployment/docker-compose.production.yml exec web npm run db:seed
docker compose -f deployment/docker-compose.production.yml run --rm \
  -e GOLDEN_HTML_ROOT=/golden \
  -v "$PWD/old-html:/golden:ro" \
  web npm run import:golden
```

- Import stores approved pages; it does **not** edit `old-html/`.
- Remove `SEED_ADMIN_PASSWORD` after first Super Admin sign-in; recreate web container.

### Do not

- Deploy to Hostinger or Cloudflare Pages.
- Publish Postgres to the public internet.
- Change public DNS until cutover checklist is GO.

### Release checkout

Ship a known SHA (see Master Brain §16 / `RELEASE-ARTIFACT-MANIFEST.md`), e.g.:

```sh
git fetch && git checkout <RELEASE_SHA>
```

Then rebuild/migrate per LAUNCH.md.

---

## 4. DNS cutover

**Gate file:** `deployment/DNS-CUTOVER-CHECKLIST.md`.  
**Evidence pack:** `docs/WMC-PRODUCTION-READINESS-EVIDENCE.md`.

As of 2026-11-03: **NO-GO** until eight CRITICAL LAUNCH ops items are evidenced:

1. Off-box backup package  
2. VPS `AUTH_*` configuration  
3. VPS database connectivity (Postgres up; 5432 not public)  
4. Cloudflare Full (strict)  
5. Origin certificate on VPS  
6. VPS smoke test logged  
7. Rollback package (restore-ready off-box backup)  
8. DNS rollback values recorded + owner online  

### When GO is declared (summary from LAUNCH §8)

1. Lower Cloudflare TTL at least a day ahead.
2. Confirm staging smoke still passes via `--resolve`.
3. Fresh backup package copied **off** the VPS.
4. Point proxied apex / `www` A/AAAA to the VPS (nameservers stay at Cloudflare).
5. Smoke **without** `--resolve`.
6. Reception notified; rollback owner online through 24-hour checks.

**Do not** create a Cloudflare Pages project. Do not change nameservers away from Cloudflare for this cutover path.

---

## 5. Backups

### Command (on VPS)

```sh
sh deployment/backup-database.sh
```

### Package layout

```text
deployment/backups/<stamp>/
├── database.sql
├── images.tar.gz
└── backup-manifest.txt
```

- Includes DB + `wmc_images` volume (live/pending/archive replacements).
- Approved originals under `apps/web/public` stay in Git / image — not a substitute for the package.
- **Copy the whole directory off the VPS** before import, migration, image upgrade, or DNS cutover.

### Checklist

- [ ] `database.sql` present  
- [ ] `images.tar.gz` present  
- [ ] `backup-manifest.txt` present  
- [ ] Off-box copy confirmed  

---

## 6. Rollback

### Content revision rollback (CMS)

- Clinic Admin / Super Admin can restore a content revision in admin.
- Restore adds a revision; URL and layout stay in place (`LAUNCH.md` role table).

### Release / data restore (VPS)

```sh
sh deployment/restore-database.sh deployment/backups/<stamp>
```

Follow LAUNCH.md restore checklist (package completeness, compose up, verify).

### DNS rollback

- Re-apply previously recorded Cloudflare DNS values for apex / `www`.
- Keep prior site reachable until new stack is verified.
- Procedure: `LAUNCH.md` §9 (and cutover checklist rollback readiness).

### Image rollback

- Image version history / archive restore via governance + `image-store` archive (pixel-locked paths).
- Prefer CMS revision UI for governed replacements.

---

## 7. Cloudflare

| Concern | Standard |
| --- | --- |
| Role | DNS, SSL proxy, traffic management only |
| SSL/TLS mode | **Full (strict)** — Flexible causes redirect loops |
| Origin cert | Let’s Encrypt DNS-01 or Cloudflare Origin Certificate before public proxy to VPS |
| Pages | **Not used** for this platform |
| UAT tunnel | `cloudflared` → local `:3100` for `next.` |
| Cache | Prefer versioned assets; purge via dashboard/API when operators have credentials |
| Origin firewall | Ports 80/443 Cloudflare ranges only (`deployment/nginx/cloudflare-allow.conf` generation per LAUNCH) |

After cert renewal: reload Nginx in the production compose stack (see LAUNCH.md).

---

## 8. VPS

| Concern | Standard |
| --- | --- |
| App | Docker Compose production file under `deployment/` |
| Published ports | 80 and 443 only |
| Postgres | Docker network only — not public |
| Nginx | TLS 1.2/1.3, HSTS, proxy to Next with `X-Forwarded-Proto: https` |
| SSH | Limit to operator when rules are applied; LAUNCH scripts do not casually rewrite SSH |
| Staging | Full stack on VPS while public DNS still points at the current site |

Laptop `curl --resolve` fails once origin firewall drops non-Cloudflare — run smoke on VPS or temporarily allow the tester IP.

---

## 9. Smoke testing

### Script

```sh
sh deployment/smoke-test.sh https://gabbamedicalcentre.com.au
```

- Staging: run with `--resolve` / hosts override **on an allowed path** (VPS or allowed IP).
- Post-cutover: run **without** override against public DNS.

### What smoke must prove (see LAUNCH §7)

- Health / homepage / key authority openings respond.
- HotDoc lightbox paths still valid (HotDoc validation section in LAUNCH).
- Layout and booking grammar unchanged from approved site.

### Practice / practitioner verification

Complete LAUNCH checklists §5–§6 (Practice Manager + practitioner spot checks) before declaring go-live success.

### Local UAT is not VPS smoke

`127.0.0.1:3100` health is necessary for `next.` work; it does **not** satisfy DNS cutover smoke evidence.

---

## 10. Incident quick reference

| Symptom | First checks |
| --- | --- |
| HTML 500 / health `database: down` | Postgres / `DATABASE_URL` |
| `next.` stale JS | UAT rebuilt? `?v=` bust? CF edge cache? |
| Prisma generate EPERM on Windows | Stop UAT/dev locking DLL; regenerate |
| Booking CTA wrong | HotDoc URL + phone-only rules; insurance slug only |
| Cutover pressure | Re-read DNS checklist — NO-GO until five CRITICAL items pass |

---

## Document history

| Date | Change |
| --- | --- |
| 2026-11-03 | Initial runbook extracted from Master Brain, LAUNCH.md, DNS-CUTOVER-CHECKLIST, working-memory hosting model. |
