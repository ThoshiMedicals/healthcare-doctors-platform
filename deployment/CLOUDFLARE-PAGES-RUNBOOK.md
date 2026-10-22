# Cloudflare Pages deployment runbook

Audit date: 21 October 2026. Scope: this repository as it is built today.

**Deployment readiness: FAIL.**

Do not create a Cloudflare Pages project for this application. Production stays on the VPS stack in `deployment/LAUNCH.md`. Cloudflare’s job on that path is DNS, the TLS proxy, and the WordPress bulk redirects. SSL/TLS mode is Full (strict).

A Pages project has no build command or output directory in this repo that can serve the public site, the staff CMS, or the image store.

## Scorecard

| Check | Result | Evidence |
| --- | --- | --- |
| 1. Build command | FAIL | The app build is a Node server build. There is no Pages or Workers adapter. |
| 2. Output directory | FAIL | `next build` does not emit a directory Pages can publish. Public HTML is not in `public/`. |
| 3. Environment variables | FAIL | Runtime needs PostgreSQL, Auth.js, and a writable image directory. Pages cannot provide those. |
| 4. Routing | FAIL | Public HTML, staff routes, and several assets are Node routes. Redirects live in Nginx and a zone CSV. |
| 5. Static assets | WARNING | Approved CSS, JavaScript, and images are in `apps/web/public`. Logo, hero, exterior, and team photos are served by a filesystem API. |
| 6. Search index | WARNING | `apps/web/public/search-index/` is a valid static corpus. It is not a Pages publish target, and CMS publish does not rebuild it. |
| 7. Digital Reception | FAIL | The widget script is static. The site that loads it, and the compatibility index overlay, require the Node server and PostgreSQL. |
| 8. Knowledge Search | WARNING | `knowledge-search.js` is self-contained in the browser. It runs only after the Knowledge Centre HTML is served, and that HTML comes from PostgreSQL. |

## 1. Build command — FAIL

There is no `wrangler.toml`, no `@opennextjs/cloudflare`, and no `output: "export"`.

Commands that exist:

| Where | Command | What it produces |
| --- | --- | --- |
| Repository root | `npm run build` | Delegates to `apps/web`. |
| `apps/web` | `prisma generate && next build` | A Next.js production build. |
| `apps/web/next.config.ts` | `output: "standalone"` | A Node server bundle under `.next/standalone`, plus `.next/static`. |
| `apps/web/Dockerfile` | `npx prisma generate && npm run build`, then `next start` | The production container. The image copies the whole app. It does not publish a static site. |

Node.js 22 is the documented runtime. Pages will not infer that from this repo: `apps/web/package.json` has no `engines` field.

The build also depends on `sharp` (`serverExternalPackages`, and `src/cms/portrait-variant.ts` for practitioner portrait thumbs). That native module runs in the VPS container. It does not run on Pages or Workers.

Every public and API route that serves the clinic site sets `export const runtime = "nodejs"`:

- `src/app/(public)/[[...path]]/route.ts`
- `src/app/api/reception-index/route.ts`
- `src/app/api/managed-image/[...path]/route.ts`
- `src/app/api/health/route.ts`
- `src/app/api/auth/[...nextauth]/route.ts`
- `src/app/api/clinics/[clinicSlug]/form-requests/route.ts`
- `src/app/api/image-proposal/[id]/route.ts`

Leave the Pages build command blank. Do not enter `npm run build`, `npx @cloudflare/next-on-pages`, or an OpenNext command. Those would either fail or publish a server artifact Pages cannot host.

The command that does build production is on the VPS:

```sh
docker compose -f deployment/docker-compose.production.yml up -d --build
```

## 2. Output directory — FAIL

Pages needs a directory of files to upload. This build does not create one.

| Path | What is there | Pages result |
| --- | --- | --- |
| `apps/web/.next/` | Server build, webpack cache, standalone server | Not a site. |
| `apps/web/.next/standalone/` | Node server when `output: "standalone"` is honoured | Not a site. The Dockerfile still starts `next start`. |
| `apps/web/public/` | CSS, JavaScript, images, `robots.txt`, `sitemap.xml`, `search-index/` | Assets only. Zero `.html` files. |
| `out/` or `dist/` | Absent | Nothing to set as the Pages output directory. |

The 198 approved pages are imported into PostgreSQL and rendered by `renderStoredPage`. `/` and `/index.html` both resolve to `index.html`. Any other path keeps its `.html` suffix. An unknown path returns the stored `404.html` with HTTP 404.

Setting the Pages output directory to `apps/web/public` or `apps/web/.next` would upload assets or a server build, and every clinic URL would 404.

## 3. Environment variables — FAIL

`apps/web/src/env.ts` requires `DATABASE_URL` and `AUTH_SECRET` whenever `getEnv()` runs. Prisma uses the classic PostgreSQL URL in `prisma/schema.prisma`. There is no driver adapter and no Hyperdrive binding.

Put these on the VPS, in `apps/web/.env` and `deployment/.env`. Do not copy the local `.env` onto the server, and do not enter them in a Pages project.

| Variable | Required | Production value | Why Pages cannot use it |
| --- | --- | --- | --- |
| `DATABASE_URL` | Yes | `postgresql://wmc:CHOOSE_A_PASSWORD@postgres:5432/wmc?schema=public` | Hostname `postgres` exists only on the Compose network. The client expects TCP PostgreSQL. |
| `AUTH_SECRET` | Yes | `openssl rand -base64 32` | Staff sessions are Auth.js JWTs checked in `src/middleware.ts`. |
| `AUTH_URL` | Yes in production | `https://gabbamedicalcentre.com.au` | Public origin for Auth.js. Leave unset only on a local machine. |
| `AUTH_TRUST_HOST` | Yes behind the proxy | `true` | The VPS terminates TLS on Nginx. Compose sets this on the web service. |
| `DEFAULT_CLINIC_SLUG` | Yes | `woolloongabba` | Clinic used for localhost and private LAN hosts. Production resolves the clinic from the forwarded host. |
| `IMAGE_STORE_DIR` | Yes in production | `/app/storage/images` | Compose sets this and mounts the `wmc_images` volume. Pages has no durable disk. |
| `PUBLIC_ASSET_ROOT` | No | Unset. Defaults to `apps/web/public` | Fallback bytes for managed images. |
| `POSTGRES_USER` | Yes for Compose | `wmc` in `deployment/.env` | Not read by Next. Read by `docker-compose.production.yml`. |
| `POSTGRES_PASSWORD` | Yes for Compose | Same password as `DATABASE_URL` | Letters and numbers, so the URL needs no encoding. |
| `POSTGRES_DB` | Yes for Compose | `wmc` | Same database name as `DATABASE_URL`. |
| `SEED_ADMIN_USERNAME` | First seed only | First Super Admin username | `prisma/seed.ts`. Remove the password after first sign-in. |
| `SEED_ADMIN_PASSWORD` | First seed only | Long password | Remove from `apps/web/.env` after first sign-in, then recreate the web container. |
| `SEED_ADMIN_EMAIL` | No | Optional | Seed only. |
| `FORM_REQUEST_NOTIFY_EMAIL` | No | Reserved inbox | The form API stores the request either way. |
| `GOLDEN_HTML_ROOT` | Import only | `/golden` inside the one-off import container | Not a runtime variable. |

The Docker build injects `DATABASE_URL` and `AUTH_SECRET=build-placeholder` so `prisma generate` and `next build` can run inside the image. Those placeholders are build-time only. The running container receives the real values from `apps/web/.env` and Compose.

`/api/health` runs `SELECT 1` through Prisma and returns 503 when the database is down. A Pages deploy has no database to pass that check.

## 4. Routing — FAIL

Request path on the supported deployment:

1. Cloudflare proxies `gabbamedicalcentre.com.au` to the VPS.
2. Nginx sends port 80 and `www` to `https://gabbamedicalcentre.com.au`.
3. Nginx applies `deployment/nginx/redirects.conf` (45 WordPress paths, both slash forms, query string kept, HTTP 301).
4. Nginx proxies everything else to `web:3000` with `Host`, `X-Forwarded-Host`, and `X-Forwarded-Proto: https`.
5. `src/middleware.ts` runs on all paths except `_next/static`, `_next/image`, and `favicon.ico`. It rejects a foreign `Origin`, gates `/admin`, and stamps the clinic host header.
6. The public catch-all loads published HTML from PostgreSQL.

`next.config.ts` also rewrites, before static files:

| Public URL | Destination |
| --- | --- |
| `/digital-reception-index.js` | `/api/reception-index` |
| `/assets/brand/healthcare-doctors-woolloongabba-logo.png` | `/api/managed-image/...` |
| `/assets/hero-final-desktop.webp` | `/api/managed-image/...` |
| `/assets/institutional-exterior-consistent.webp` | `/api/managed-image/...` |
| `/assets/team/:file` | `/api/managed-image/assets/team/:file` |

`skipTrailingSlashRedirect` is on, so `.html` URLs stay as approved. Pages pretty-URL handling would change those addresses.

The same 45 redirects are listed for the Cloudflare zone in `deployment/migration/cloudflare-bulk-redirects.csv`. Import that CSV on the zone that proxies the VPS. There is no `_redirects` or `_routes` file for Pages. A Pages project would miss the Nginx host redirects and the catch-all.

Staff sign-in stays at `/admin/login`. `/api/auth/*`, `/api/health`, patient form requests, and image proposals are Node routes.

## 5. Static assets — WARNING

`apps/web/public` holds the approved runtime files copied by the golden-master import: `styles.css`, `site.js`, `digital-reception.js`, `knowledge-search.js`, `knowledge-navigation.js`, `knowledge-reading.js`, `booking-resilience.js`, `robots.txt`, `sitemap.xml`, and the image library under `assets/`.

Next serves that directory from the Node process. On the VPS, Cloudflare may cache extensions it already caches (CSS, JavaScript, webp, png) when the origin cache headers allow it.

These URLs are not static files in production. The rewrites above send them through `readServedBytes`, which reads `IMAGE_STORE_DIR/live` and falls back to `public/`:

- Clinic logo
- Homepage hero
- Institutional exterior
- Practitioner portraits, including the 640-wide thumbs written with `sharp`

A Pages upload of `public/` would serve the approved originals and drop every published replacement on the `wmc_images` volume.

`robots.txt` and `sitemap.xml` stay the approved copies. Do not generate replacements in Cloudflare.

Cache rule for the zone in front of the VPS:

- Leave HTML uncached. The public route sets `content-type` only.
- Leave `/api/*` and `/digital-reception-index.js` uncached. The reception route sends `no-store` when published repeats exist, and `public, max-age=300` otherwise. A Cache Everything rule would ignore that.
- Managed images send `public, max-age=60, must-revalidate`. Keep that origin header.

## 6. Search index — WARNING

Digital Reception’s live search reads static JSON from the same origin as the page.

| File | Role |
| --- | --- |
| `apps/web/public/search-index/manifest.json` | `schema` 1, `count` 203, 14 shard names, and a route-to-shard map. |
| `symptoms`, `conditions`, `mental-health`, `life-stages`, `prevention`, `services`, `doctors`, `billing`, `appointments`, `referrals`, `pathology`, `imaging`, `prescriptions`, `administration` | One JSON file per shard. |

`digital-reception.js` fetches `search-index/manifest.json?v=83804fa8c180` with `cache: "force-cache"`, checks `schema`, `catalog.length === count`, and `shards`, then loads `search-index/<shard>.json?v=83804fa8c180` on the first matching search.

The corpus is a golden-master copy. Import validation compares it with `old-html/search-index/manifest.json`. CMS publication does not rebuild these files. A page text change goes out in PostgreSQL HTML and stays out of the JSON until a new import replaces `public/search-index/`.

The files are ordinary static JSON. They still fail as a Pages site: the HTML that loads them is rendered by the Node catch-all, and `public/` contains no pages. Publishing only the index would leave `/search-index/*` reachable and every clinic URL empty.

On the VPS, do not add a Cloudflare cache rule that stores `/search-index/*` beyond the `?v=` token baked into `digital-reception.js`. Replacing the index means replacing that token in the approved script as well.

## 7. Digital Reception — FAIL

`apps/web/public/digital-reception.js` is the approved widget. Published HTML references it. The script inserts the launcher, refuses to run on `404.html`, and resolves `search-index/` and `digital-reception-index.js` relative to its own script URL.

Two search paths:

1. HTTPS, manifest loads. Search uses the static shards in section 6. This is the normal path.
2. Manifest request fails. The script injects `digital-reception-index.js?v=5db5db0a5fe6` and reads `window.WMC_DIGITAL_RECEPTION_INDEX`.

That second URL is not the file in `public/`. `next.config.ts` rewrites it to `/api/reception-index`, which reads `public/digital-reception-index.js` with `node:fs` and runs `applyReceptionIndex` over published repeat-prescription rows from PostgreSQL. The route is `force-dynamic` and `runtime = "nodejs"`.

Pages would break all three of these at once:

- The widget never starts, because the HTML pages are not in the publish output.
- The manifest and shards are not served beside those pages.
- The compatibility index loses the PostgreSQL overlay, and `node:fs` does not run.

Keep Digital Reception on the VPS origin. After deploy, open the homepage, open Digital Reception, and search a published guide title. A manifest failure shows “Search is temporarily unavailable” plus the booking and phone fallbacks. That message means `/search-index/manifest.json` and the compatibility index both failed.

## 8. Knowledge Search — WARNING

`apps/web/public/knowledge-search.js` does not call an API and does not read `search-index/`. It matches an embedded guide list (titles, headings, hubs, aliases) against `[data-knowledge-guide-search]` in the page. Certificate and driver-medical phrases are routed to the published Patient Forms and Medical Procedures pages. The script can also open Digital Reception from an empty or unpublished result.

The script file itself can sit on any static host. The Knowledge Centre pages that contain the form are stored HTML served by the public catch-all. Pages would upload the script and would not upload those pages, so the finder would never bind.

On the VPS, confirm a Knowledge Centre page that contains the guide form, type a published guide title, and follow the result link. Digital Reception search and this finder are separate corpora. Updating one does not update the other.

## Operator sequence

Use this when the question is “can we point Cloudflare Pages at this repo?”

1. Stop. Readiness is FAIL.
2. Follow `deployment/LAUNCH.md` for the VPS. Cloudflare remains the proxy.
3. Set the zone SSL/TLS mode to Full (strict) before public traffic uses the proxy.
4. Import `deployment/migration/cloudflare-bulk-redirects.csv` on that zone if the edge should own the 45 WordPress redirects. Nginx still includes `deployment/nginx/redirects.conf` for the same list.
5. Run `deployment/cloudflare-origin-firewall.sh` so ports 80 and 443 accept Cloudflare ranges only.
6. Do not add a Cache Everything rule for HTML, `/api/*`, `/digital-reception-index.js`, or `/search-index/*`.
7. Smoke test on the VPS, or from an address the origin firewall allows:

```sh
curl --resolve gabbamedicalcentre.com.au:443:VPS_IP -I https://gabbamedicalcentre.com.au/
sh deployment/smoke-test.sh https://gabbamedicalcentre.com.au
```

8. Confirm `/api/health` reports the database up, `/admin/login` renders, one managed image returns 200, Digital Reception returns a guide, and the Knowledge Centre finder returns a guide.

## Pages settings if a project is created by mistake

Delete the project. These settings are the ones that look plausible and are wrong:

| Pages field | Value someone might enter | Result |
| --- | --- | --- |
| Root directory | `/` or `apps/web` | Build still produces a Node server. |
| Build command | `npm run build` | Runs `prisma generate && next build`. |
| Build output directory | `out`, `dist`, `apps/web/.next`, or `apps/web/public` | Empty, a server build, or assets without HTML. |
| Environment variables | The VPS list above | They do not add a database, a volume, or a Node filesystem. |
| Compatibility flags | `nodejs_compat` | They do not make `runtime = "nodejs"`, `sharp`, or `node:fs` image storage work. |

## What would have to change before this score can move

This audit does not authorise that work. A later design would have to replace the Node catch-all, Prisma TCP, the image volume, `sharp`, and the reception-index filesystem read with a runtime Cloudflare actually hosts, and it would have to keep the approved HTML, `.html` URLs, and the 45 redirects. Until that exists, the score stays FAIL.
