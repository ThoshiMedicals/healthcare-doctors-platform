# WMC production platform

The approved HTML package in `old-html/` is the golden master. Public pages are served from immutable copies of those files. The package itself is not modified.

## Prerequisites

- Node.js 22
- npm 10
- Docker, for PostgreSQL and the optional full stack

## Environment variables

Copy the example file and edit the secret before starting the app:

```sh
copy apps\web\.env.example apps\web\.env
```

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string used by Prisma |
| `AUTH_SECRET` | Auth.js signing secret. Generate with `openssl rand -base64 32` |
| `AUTH_URL` | Public origin in production. Leave unset locally so staff sign-in works on localhost and the LAN address |
| `AUTH_TRUST_HOST` | Set to `true` when Nginx terminates TLS on the VPS |
| `DEFAULT_CLINIC_SLUG` | Clinic used for `localhost`. Default `woolloongabba` |
| `SEED_ADMIN_EMAIL` | Optional staff email created by the seed |
| `SEED_ADMIN_PASSWORD` | Optional staff password created by the seed |
| `FORM_REQUEST_NOTIFY_EMAIL` | Reserved inbox for patient form requests |

Do not commit `apps/web/.env`.

## Local development

From the repository root:

```sh
docker compose -f deployment/docker-compose.yml up -d
npm install --prefix apps/web
npm run db:migrate
npm run db:seed
npm run import:golden --prefix apps/web
npm run dev
```

- App: http://localhost:3000
- Staff sign-in: http://localhost:3000/admin/login
- Health: http://localhost:3000/api/health
- Postgres: `localhost:5432`, database `wmc`, user `wmc`, password `wmc`

`npm run db:seed` creates the Woolloongabba tenant. `npm run import:golden` then stores all 198 approved HTML pages as immutable revisions and copies runtime CSS, JavaScript, images, and the Digital Reception index into `apps/web/public`. Reports are written to `apps/web/reports/`. A Super Admin is created only when `SEED_ADMIN_USERNAME` and `SEED_ADMIN_PASSWORD` are set. Further users are created inside the CMS. There is no public registration.

If Docker is not available, `npm run db:local --prefix apps/web` starts a local UTF-8 PostgreSQL on port 5432. The database must use UTF-8 so characters in the approved HTML are stored unchanged.

## Full Docker stack

This builds the Next.js image and places Nginx in front of it on port 8080. Postgres from the command above can stay running.

```sh
docker compose -f deployment/docker-compose.yml --profile app up -d --build
```

The web container runs `prisma migrate deploy` before `next start`.

On the VPS, follow `deployment/LAUNCH.md`. That path uses `deployment/docker-compose.production.yml`, keeps PostgreSQL off the public network, and uses `deployment/nginx/gabbamedicalcentre.tls.conf.example` once the origin certificate exists. Cloudflare provides DNS and the proxy. SSL/TLS mode is Full (strict). Additional clinic hostnames are extra Nginx `server_name` entries plus `ClinicDomain` rows.

## Folder structure

```text
apps/web/
  src/app/                  Next.js routes: public documents, staff CMS, auth, health
  src/auth/                 Auth.js config, passwords, clinic roles
  src/clinics/              Host resolution and tenant lookup
  src/cms/                  Collections, workflow, publish gates, compiler boundary
  src/db/                   Prisma client
  src/digital-reception/    Search index builder
  src/documents/            Published HTML lookup
  src/forms/                Patient form request contract
  src/governance/           Content fingerprint and public review fields
  src/importer/             Golden-master import and validation
  prisma/schema.prisma
  prisma/migrations/        Initial PostgreSQL migration
  prisma/seed.ts            Woolloongabba tenant
  public/                   Approved CSS, JavaScript, images, search index
  reports/                  Import and rendering validation reports
deployment/
  docker-compose.yml
  docker-compose.production.yml
  LAUNCH.md
  HOSTINGER.md             Superseded. Do not use.
  backup-database.sh
  smoke-test.sh
  nginx/
old-html/                   Frozen approved HTML. Read by the importer, never written.
```

## CMS

Staff sign in at `/admin/login` with a username and password. Roles are Super Admin, Clinic Admin, and Content Editor. The CMS edits structured content and appends a revision for every change. A saved draft stays off the public site. After review and approval, publication overlays the new text onto the approved HTML. Classes, IDs, navigation, scripts, and schema structure stay in place. Clinic Admin and Super Admin can restore any earlier revision, including the publication status and governance record. Restoration adds another revision and leaves the history in place.

## What this phase includes

- Next.js 15 app in `apps/web`
- Prisma schema and the initial PostgreSQL migration
- Staff Auth.js credentials sign-in and clinic roles
- Host-based clinic resolution
- CMS collections, workflow transitions, and publish gates
- Golden-master import of all 198 pages, served without rewriting HTML
- Patient form request API for the existing non-clinical fields

## Regression tests

`npm test` compares the published Woolloongabba pages with `old-html/`. It fails if navigation, header, footer, schema, the skip link, the main landmark, the appointment-actions landmark, Digital Reception, `styles.css`, or `site.js` differ from the golden master.

## What stays unchanged

The importer does not edit `old-html/`. Public responses return the approved HTML, CSS, scripts, schema, navigation, HotDoc markup, and Digital Reception files without rewriting them.
