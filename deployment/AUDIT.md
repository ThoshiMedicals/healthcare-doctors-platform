# Production security and deployment readiness

Audit date: 12 October 2026. Scope: the deployment package and the local site at `http://localhost:3000`. No production VPS is live. No application behaviour was changed.

## Result

The package can go to VPS staging. It is not cleared for public DNS cutover until the conditions at the end are done. Public DNS stays on Cloudflare until `deployment/LAUNCH.md` says to move it. SSL/TLS mode is Full (strict).

| Check | Result |
| --- | --- |
| Development files are not publicly served | Pass |
| CMS routes require sign-in | Pass |
| Private governance records are not public | Pass |
| Database credentials are not in the production stack | Pass, with a local-file condition |
| No test accounts are defined for production | Pass, with a seed-file condition |
| No directory listing | Pass |
| Image paths resolve | Pass |
| HotDoc links resolve | Pass |
| No mixed content | Pass |
| Homepage console has no page error | Pass |

## 1. Development files

`apps/web/public` contains only the approved site files: assets, search index, CSS, JavaScript, `robots.txt`, and `sitemap.xml`. There are no source maps, environment files, or reports in that directory.

These addresses all returned HTTP 404: `/.env`, `/apps/web/.env`, `/.git/HEAD`, `/reports/publish-regression.json`, `/src/env.ts`, `/prisma/schema.prisma`, `/cms/governance-records.json`, and `/old-html/cms/governance-records.json`.

`.env` is excluded from the Docker build. Nginx proxies to the app and does not serve the repository directory.

## 2. CMS routes

`/admin` and `/admin/governance` returned HTTP 307 to `/admin/login`. The dashboard layout also requires a signed-in user. `/admin/login` is the public sign-in page and returned HTTP 200. There is no public registration.

## 3. Governance records

Clinical review pages live under `/admin/governance` and redirect to sign-in. `governance-published.js` is the public file and contains an empty frozen object, with no reviewer evidence. `old-html/cms/governance-records.json` is an eligibility inventory and is not copied into `public`. The patient form endpoint accepts POST only. GET returned HTTP 405, so stored requests are not readable from that route.

`/api/health` is public and returns `{"ok":true,"phase":"golden-import","database":"up"}`. It does not return credentials or review records. It does show that the database is reachable.

## 4. Database credentials

`deployment/docker-compose.production.yml` does not contain a database password and does not publish port 5432. The password has to be supplied in `deployment/.env`, which is gitignored.

`apps/web/.env` holds the local database URL and seed password. It is listed in `.gitignore` and `.dockerignore`. This workspace has no git repository, so that file is not in a commit history.

`deployment/docker-compose.yml` and `apps/web/.env.example` contain the local development password `wmc`. That compose file also publishes port 5432. It must not be the file started on the VPS.

## 5. Accounts

The seed creates one Super Admin, and only when `SEED_ADMIN_USERNAME` and `SEED_ADMIN_PASSWORD` are set. Source defines no other account. The local environment file still has those seed values. Production seed must use a new password, and `SEED_ADMIN_PASSWORD` must be removed after the first sign-in. No production database has been seeded.

## 6. Directory listing

`/assets/` and `/assets/team/` returned HTTP 404. The Nginx configs do not enable `autoindex`.

## 7. Images

Every local image, stylesheet, and script referenced by the 198 approved pages resolves to a file in `apps/web/public`. Spot checks returned HTTP 200 for the logo, homepage hero, Dr Anand Singh portrait, `styles.css`, and `site.js`.

## 8. HotDoc

Thirteen booking URLs were found. Each is `https://www.hotdoc.com.au/...` and includes `wp=w_lightbox`. Each returned HTTP 200, as did `https://cdn.hotdoc.com.au/static/assets/js/hotdoc-widgets.min.js`.

Dr Mary Abadir’s approved profile uses “Call Reception to Book” and `tel:+61732173344`. That page has no HotDoc booking URL. This is the approved page, not a broken link.

## 9. Mixed content

No stylesheet, script, image, or frame uses `http://`. Fonts, HotDoc, and the homepage map frame use `https://`. The only `http://` text is the SVG namespace inside a CSS data URI, which does not make a network request.

## 10. Homepage console

Headless Chrome loaded `http://localhost:3000/`. The page did not log an error, a failed load, or a mixed-content warning. The Google Maps frame, which the homepage embeds over HTTPS, logged one informational line: “Search endpoint requested!”. A separate Chrome component logged `DEPRECATED_ENDPOINT` for its own Google registration service. That line is not from the site.

## Conditions before DNS cutover

- Start `deployment/docker-compose.production.yml`, not `deployment/docker-compose.yml`.
- Set a new database password and `AUTH_SECRET`. Do not copy the local `.env` unchanged.
- Remove `SEED_ADMIN_PASSWORD` after the first staff sign-in.
- Keep port 5432 closed.
- Re-run `deployment/smoke-test.sh` on the VPS before changing public DNS.
