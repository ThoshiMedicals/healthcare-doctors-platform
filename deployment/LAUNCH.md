# Woolloongabba production deployment

**Authoritative production deploy guide (Phase 3 reconciled — 2026-11-07).**

This is the only production deployment guide for Woolloongabba Medical Centre on the
**Hostinger managed Node.js Web App + external Supabase PostgreSQL** architecture that
the release candidate already uses for staging.

- **Do not** treat historical VPS/Docker/`docker-compose.production.yml` instructions as
  the current cutover path. Those remain in **Appendix H** for emergency reference only.
- **Do not** deploy to Cloudflare Pages. Cloudflare is used for **DNS / SSL proxy / Full (strict)**
  in front of the production origin once cutover is approved.
- Public HTML, navigation, and approved layout stay as approved. This guide does not add pages
  or invent clinical content.

| Environment | Host | Database | Purpose |
| --- | --- | --- | --- |
| Local dev | `127.0.0.1:3000` | Local Postgres (`npm run db:local`) | Engineering |
| Local UAT / `next.` | `127.0.0.1:3100` + Cloudflare tunnel | Same local DB as configured in laptop `.env` | **Authority preview** (noindex) |
| Hostinger staging RC | `*.hostingersite.com` | **Supabase Postgres** (staging project) | Release candidate |
| Production (future) | `gabbamedicalcentre.com.au` on Hostinger Web App (or documented successor) | **Dedicated production Supabase project** | Live site — **DNS NO-GO until evidence PASS** |

Roles already in the CMS:

| Person | CMS role | What they can do |
| --- | --- | --- |
| Platform operator | Super Admin | Create staff users, deploy, restore a release |
| Practice Manager | Clinic Admin | Approve, publish, change clinic settings, restore a content revision |
| Content Editor | Content Editor | Edit and submit. Cannot publish |

Clinic Admin and Super Admin are the only roles that can publish or roll content back.

---

## Current verified tip

| Item | Value |
| --- | --- |
| Branch | `release/wmc-hostinger-rc1` |
| Rollback / code tip before Phase 3 docs | **`ae202f2`** |
| Evidence commit (Phase 3 Stage A) | **`af2f53e`** (docs only) |
| Staging | `https://mediumslateblue-eagle-960503.hostingersite.com` |
| Authority | `https://next.gabbamedicalcentre.com.au` (laptop UAT + tunnel — **not** production) |

---

## Production architecture (Hostinger Web App + Supabase)

### Application

- Hostinger **Node.js Web App** (Next.js 15 standalone / Passenger).
- Build root: `apps/web`; script `npm run build`; Node 22.
- Deploy sources:
  1. **Preferred:** Git auto-deploy from GitHub `ThoshiMedicals/healthcare-doctors-platform` / `release/wmc-hostinger-rc1` (reconnect in hPanel if `gitAutoDeployment` is null).
  2. **Fallback:** Upload git archive → `hosting_nodejs_start-build` with `source_type: archive` (used when Git install is inactive).
- Runtime data (durable public HTML cache) lives under the app working directory `.data/`.

### Database

- **PostgreSQL on Supabase** (not Hostinger MySQL, not Docker Postgres on the web host).
- Staging and production **must** use **separate** Supabase projects / databases.
- App connects with `DATABASE_URL` (pooler URL recommended for Hostinger egress).
- Prisma migrations: `npx prisma migrate deploy` during/after build as required by the release checklist.

### Auth.js

| Variable | Production requirement |
| --- | --- |
| `AUTH_SECRET` | Unique production secret (`openssl rand -base64 32`) — **not** staging/laptop value |
| `AUTH_URL` | `https://gabbamedicalcentre.com.au` |
| `AUTH_TRUST_HOST` | `true` |
| `DEFAULT_CLINIC_SLUG` | `woolloongabba` |

**Never** copy laptop `.env` to production. Hostinger **replace-environment-variables** is a **full replace** — always send the complete key set with real values; never paste masked `********` back.

### Staging / index locks (must not ship to apex)

| Variable / rule | Staging | Production apex |
| --- | --- | --- |
| Hostname `*.hostingersite.com` | Forces noindex in code | N/A |
| `STAGING_NOINDEX=true` | Optional explicit lock | **Must be unset / false** |
| `UAT_QUICK_TUNNEL=true` | Local UAT only | **Must be unset** |

Code: `apps/web/src/seo/staging-noindex.ts`.

### Persistent private files

- Prefer `PRIVATE_OBJECT_STORE=postgres` so career CVs / readiness docs survive Hostinger version switches.
- Confirm keys exist and a synthetic upload survives restart/redeploy before cutover.

### SEO assets

- Production robots/sitemap bodies: `apps/web/public/seo-approved/robots.txt` and `sitemap.xml`.
- Served by `apps/web/src/app/robots.txt/route.ts` and `sitemap.xml/route.ts` (and middleware short-circuit on staging hosts).
- Hostinger preview CDN may still **shadow** `/robots.txt` with a platform body — verify with response headers (`X-Robots-Tag` present ⇒ app; absent + `Allow: /` ⇒ CDN). HTML pages must keep `X-Robots-Tag: noindex…` on staging regardless.
- WordPress legacy paths: `apps/web/src/seo/wordpress-legacy-redirects.ts` (middleware 301). Keep Cloudflare/nginx maps aligned at cutover for any extra inventory rows.

### Cloudflare

- Zone stays on Cloudflare.
- Before apex points at Hostinger: SSL/TLS **Full (strict)** + valid origin/custom-domain certificate for Hostinger.
- Do **not** create a Cloudflare Pages project for this app.

---

## Environment isolation checklist (evidence required)

Mark **PASS** only with filed evidence. Otherwise **BLOCKED**.

| # | Requirement | How to evidence | Status template |
| --- | --- | --- | --- |
| E1 | Staging DB ≠ production DB | Two Supabase project IDs + distinct `DATABASE_URL` hosts | BLOCKED until production project exists |
| E2 | Dedicated production database | New Supabase project + migrate + import/restore drill | BLOCKED |
| E3 | Backup + tested recovery | Supabase backup / `pg_dump` off-box + restore drill log | BLOCKED |
| E4 | Auth.js production config | Hostinger prod env keys listed (values not pasted into git) | BLOCKED |
| E5 | Persistent private files | `PRIVATE_OBJECT_STORE=postgres` + restart survival test | PARTIAL on staging (key present; drill may be open) |
| E6 | Build reproducibility | Git auto-deploy **or** documented archive build UUID → SHA | PARTIAL (archive path proven; Git reconnect open) |
| E7 | Git auto-deploy recovery | hPanel Git install + `gitAutoDeployment` non-null | BLOCKED |
| E8 | Cloudflare Full (strict) + custom domain | Dashboard screenshot / API read | BLOCKED |
| E9 | WordPress protection until cutover | Apex still serves current WP; no DNS change | PASS while NO-GO holds |
| E10 | DNS rollback values recorded | Current proxied A/AAAA for apex + www written off-box | BLOCKED |
| E11 | Production email + booking | Reception mailbox + HotDoc clinic URL validation log | BLOCKED / partial HotDoc on staging |

---

## Hostinger deploy commands (operator)

### Preferred — Git auto-deploy

1. Connect GitHub in hPanel for the Hostinger site.
2. Deploy branch `release/wmc-hostinger-rc1`, root `apps/web`, Node 22, Next.js, `npm run build`.
3. Confirm `hosting_get-deployment` commit hash matches intended SHA.
4. Smoke: `/api/health`, homepage, `/robots.txt`, `/sitemap.xml`, one doctor, `/admin/login`.

### Fallback — archive build

1. `git archive --format=zip -o wmc-<sha>.zip <sha>`
2. Upload via Hostinger file upload URL into site storage.
3. `hosting_nodejs_start-build` with `source_type: archive`, `root_directory: apps/web`.
4. Poll until `completed`; record build UUID.

### Restart only

`hosting_nodejs_restart-application` — clears in-memory cache; durable HTML snapshots may survive within TTL.

---

## UAT / `next.` authority (laptop)

```sh
cd apps/web
npm run uat:build   # distDir .next-uat; sets UAT_QUICK_TUNNEL for the build env
npm run uat         # listens on :3100
```

Keep Postgres up. After `uat:build`, confirm:

- `http://127.0.0.1:3100/robots.txt` → **200**
- `http://127.0.0.1:3100/sitemap.xml` → **200**

`next.` is a Cloudflare tunnel to `:3100`. Rebuilding UAT does **not** change production DNS or WordPress.

If `next-env.d.ts` points at `.next-uat/types`, restore to `.next/types` before commit.

---

## Go-live checklists (still required)

Practice Manager verification, practitioner profile sign-off, HotDoc lightbox validation, WordPress redirect inventory acceptance, and smoke tests remain mandatory. Use Hostinger staging + `--resolve`/hosts against the production hostname **before** DNS moves; after cutover, smoke from the public network.

WordPress inventory: middleware already implements the **P0** map in `wordpress-legacy-redirects.ts`. Export remaining live WP URLs; unmapped paths must be accepted 404s or added as approved redirects before Go.

### HotDoc validation (unchanged intent)

Clinic lightbox:

`https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/doctors?wp=w_lightbox`

Confirm homepage, sticky bar, `book-appointment.html`, and one practitioner profile. Mary remains phone-only. Usman HotDoc slug must stay `…/dr-usman-gul-strictly-seeing-male-patients-only` until clinical notice wording is separately approved.

### DNS cutover (only after Go)

1. Lower TTL a day ahead.
2. **Record** current proxied A/AAAA for apex + `www` (rollback values).
3. Confirm Full (strict) and Hostinger custom domain TLS.
4. Fresh off-box DB backup.
5. Point apex + `www` at Hostinger production origin (proxied).
6. Public smoke test; keep rollback owner online 24h.

### Rollback

- **DNS:** restore recorded A/AAAA → WordPress returns.
- **App:** redeploy previous known SHA via Git or archive; restore DB backup if needed.
- **Content:** CMS revision restore (no DNS).

---

## Go / No-Go

**Go** only when E1–E11 are PASS (or explicitly waived in writing), staging smoke PASS, Practice Manager signed, HotDoc PASS, SEO robots/sitemap on the **production host** serve approved assets, and `STAGING_NOINDEX` / `UAT_QUICK_TUNNEL` are absent from production.

**No-Go** if any ops evidence row is BLOCKED, booking opens the wrong clinic, drafts are public, or DNS rollback values are missing.

**Current decision (Phase 3):** **NO-GO** for production DNS. Hostinger RC remains for cutover **planning** only.

---

## Appendix H — Historical VPS / Docker path (superseded)

The previous guide assumed Ubuntu VPS + `deployment/docker-compose.production.yml` + local Postgres container + Nginx origin cert. That path is **not** the active WMC Hostinger RC architecture. Retain scripts (`backup-database.sh`, `restore-database.sh`, nginx examples) only if a future VPS origin is deliberately chosen; do not follow Appendix H for the current Hostinger + Supabase cutover.
