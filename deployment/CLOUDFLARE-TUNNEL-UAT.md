# Cloudflare Tunnel UAT

For temporary review without DNS changes, use `deployment/CLOUDFLARE-QUICK-TUNNEL-UAT.md`. This file is the named-tunnel design. It creates a DNS record. Do not follow it for the current Quick Tunnel session.

Protected staff QA and clinician review only. The site runs on the operator’s Windows machine. Cloudflare Tunnel publishes one hostname. Cloudflare Access is the gate. This is not production hosting, not a Hostinger cutover, and not a Cloudflare Pages project.

`gabbamedicalcentre.com.au` and `www.gabbamedicalcentre.com.au` stay on their current DNS. Reviewers never receive tunnel credentials, the database password, or `AUTH_SECRET`.

The review site is up only while this machine is awake and both the app and `cloudflared` are running. Closing the tunnel returns Cloudflare error 1033. That is the off switch.

## Layout

| Address | Who uses it | What it is |
| --- | --- | --- |
| `http://localhost:3000` | Operator only | Everyday `npm run dev` against database `wmc`. |
| `http://127.0.0.1:3100` | Operator only | UAT process. Tunnel target. Database `wmc_uat`. |
| `https://uat.gabbamedicalcentre.com.au` | Staff and clinicians | The only name that is shared. |
| `https://gabbamedicalcentre.com.au` | Public, unchanged | Not this tunnel. |

One hostname is enough. Staff and clinicians use the same origin, so search, Digital Reception, images, and Knowledge Search all resolve on the host they are reviewing. A second public name would need a second `ClinicDomain` row and a second Access application, and it would still hit this same process.

## Protection

Two checks, in this order.

1. **Cloudflare Access, one-time PIN.** Every request to the UAT hostname stops at Cloudflare until the person enters a code sent to an allow-listed email. No identity provider is required. Clinicians can use the clinic inbox they already read. There is no shared password and no bypass policy.
2. **CMS username and password.** Only people testing the CMS, governance, or image publication get an account. Clinicians do not. The CMS does not send mail. A Super Admin creates each staff user and sets the password. Access email and the CMS password go in separate messages.

Access session: 12 hours. CMS session: 8 hours from sign-in, and 30 minutes idle. A reviewer can pass Access and still be signed out of the CMS. That is the app, not a tunnel failure.

Failed CMS sign-in locks that username after 5 failures, and locks the forwarded IP after 20, for 15 minutes. A Super Admin clears a username lock by setting a new password.

## What stays local

| Piece | UAT behaviour |
| --- | --- |
| Search | `digital-reception.js` loads `search-index/manifest.json` and the 14 shards from the same host as the page. |
| Digital Reception | The widget script is on the UAT host. `/digital-reception-index.js` is rewritten to the local Node route, which reads the local file and the `wmc_uat` repeat rows. |
| CMS | `/admin` on the UAT host. Drafts stay off the public HTML until publish. |
| Governance | Staff CMS pages on the same session. |
| Images | Logo, hero, exterior, and team photos are rewritten to the local managed-image route and read from this machine’s `storage/images`, then `public/`. |
| Knowledge Search | `knowledge-search.js` runs in the browser on the Knowledge Centre page. It does not call an API. |

Approved HTML still contains canonical links to `https://gabbamedicalcentre.com.au`. A menu link inside the site stays on UAT. An absolute production link leaves UAT and opens the current public site. Tell reviewers to use the on-site menu.

PostgreSQL port 5432 is not in the tunnel. The laptop firewall does not need an inbound rule. `cloudflared` connects out to Cloudflare and calls `127.0.0.1:3100`.

## 1. Prepare the UAT database

From the repository root, with Docker Postgres already running:

```powershell
docker compose -f deployment/docker-compose.yml up -d postgres
docker compose -f deployment/docker-compose.yml exec postgres createdb -U wmc wmc_uat
```

`createdb` reports that the database exists if this step was already done. Continue.

```powershell
$env:DATABASE_URL = "postgresql://wmc:wmc@localhost:5432/wmc_uat?schema=public"
npm run db:migrate
npm run db:seed
npm run import:golden --prefix apps/web
```

The seed marks Woolloongabba `live` and attaches only `gabbamedicalcentre.com.au` and `www.gabbamedicalcentre.com.au`. The tunnel host is unknown until it is added to this database. Leave `is_primary` false. Leave `canonicalBaseUrl` as `https://gabbamedicalcentre.com.au`. Do not add this hostname to `prisma/seed.ts`.

```powershell
docker compose -f deployment/docker-compose.yml exec postgres psql -U wmc -d wmc_uat -c "INSERT INTO clinic_domains (id, clinic_id, hostname, is_primary, created_at) SELECT 'domain_uat_woolloongabba', id, 'uat.gabbamedicalcentre.com.au', false, NOW() FROM clinics WHERE slug = 'woolloongabba' ON CONFLICT (hostname) DO NOTHING;"
```

Set `SEED_ADMIN_USERNAME` and `SEED_ADMIN_PASSWORD` in the environment before `db:seed` if the operator account does not exist yet. Remove `SEED_ADMIN_PASSWORD` from the file after the first sign-in. Further staff are created in the CMS.

## 2. UAT environment file

Create `apps/web/.env.production.local`. Next loads it for `next build` and `next start`. It does not load it for `npm run dev`, so localhost sign-in keeps working with `AUTH_URL` unset. The file matches `.env.*` in `apps/web/.gitignore`. Do not commit it.

```env
DATABASE_URL=postgresql://wmc:wmc@localhost:5432/wmc_uat?schema=public
AUTH_SECRET=replace-with-openssl-rand-base64-32
AUTH_URL=https://uat.gabbamedicalcentre.com.au
AUTH_TRUST_HOST=true
DEFAULT_CLINIC_SLUG=woolloongabba
IMAGE_STORE_DIR=C:\Users\RoshanSamarawickrema\Desktop\WMC-Master-Project\apps\web\storage\images
```

Generate `AUTH_SECRET` with `openssl rand -base64 32`. Use a new value. Do not reuse a production secret.

`IMAGE_STORE_DIR` must be the absolute path of `apps/web/storage/images` on this machine. Create that directory if it is missing. Published replacements are written there. The approved originals remain in `apps/web/public`.

## 3. Start the UAT app

Port 3100 leaves port 3000 free for local development.

```powershell
npm run build --prefix apps/web
npm run start --prefix apps/web -- -p 3100
```

Check from this machine, before the tunnel exists:

```powershell
curl http://127.0.0.1:3100/api/health
```

The body contains `"database":"up"`. Then open `http://127.0.0.1:3100/` and confirm the homepage HTML. `http://127.0.0.1:3100/` is a local host, so the clinic resolves through `DEFAULT_CLINIC_SLUG`. The public hostname check comes after DNS exists.

Keep this process running for the whole review window. `next dev` is the wrong process for reviewers: it shows the development overlay and it does not read `.env.production.local`.

## 4. Create the tunnel

In the Cloudflare dashboard for the zone `gabbamedicalcentre.com.au`, open Zero Trust. The login is a Cloudflare account that already manages that zone.

On this machine:

```powershell
winget install --id Cloudflare.cloudflared
cloudflared tunnel login
cloudflared tunnel create wmc-uat
cloudflared tunnel route dns wmc-uat uat.gabbamedicalcentre.com.au
```

`tunnel login` writes a certificate under `%USERPROFILE%\.cloudflared\`. `tunnel create` writes a credentials JSON next to it. Leave both there. Do not copy them into the repository.

`tunnel route dns` creates a proxied CNAME from `uat` to `<tunnel-id>.cfargotunnel.com`. Do not also create an A record to this computer’s public IP.

Create `%USERPROFILE%\.cloudflared\config.yml`:

```yaml
tunnel: wmc-uat
credentials-file: C:\Users\<operator>\.cloudflared\<tunnel-id>.json

ingress:
  - hostname: uat.gabbamedicalcentre.com.au
    service: http://127.0.0.1:3100
    originRequest:
      httpHostHeader: uat.gabbamedicalcentre.com.au
      connectTimeout: 30s
  - service: http_status:404
```

Replace the credentials path with the JSON from `tunnel create`. `httpHostHeader` makes the app see `uat.gabbamedicalcentre.com.au`, which is the `ClinicDomain` row. Cloudflare sets `X-Forwarded-Proto: https`. `AUTH_URL` is `https://…`, and `trustHost` is already true in `apps/web/src/auth/auth.config.ts`, so staff cookies are the secure Auth.js cookie.

Start it in a second terminal and leave it there:

```powershell
cloudflared tunnel run wmc-uat
```

A quick tunnel (`trycloudflare.com`) is not a substitute. Its hostname changes, it is not in `ClinicDomain`, and it cannot carry a stable Access policy.

## 5. Cloudflare Access

Zero Trust → Access → Applications → Add an application → Self-hosted.

| Setting | Value |
| --- | --- |
| Application name | WMC UAT |
| Domain | `uat.gabbamedicalcentre.com.au` |
| Path | Leave blank so the whole host is covered, including `/admin`, `/api`, `/search-index`, and `/assets`. |
| Identity providers | One-time PIN only. |
| Session duration | 12 hours |

Policy name: `WMC UAT reviewers`. Action: Allow. Include → Emails. Add each person. Create two Access groups and include both, so removal is per person:

| Group | Who | CMS account |
| --- | --- | --- |
| WMC UAT Staff | Operator, Practice Manager, content editors | Yes. One username each. |
| WMC UAT Clinicians | Named clinicians | No. |

Leave the default deny in place. Do not add Everyone, a bypass, a service token, or an IP-only rule. Home and mobile networks change. Email is the stable check.

Optional second rule: country is Australia. Add it only if every reviewer will be in Australia for the whole window. A clinician travelling will be blocked until the rule is removed.

Zero Trust → Settings → Authentication → One-time PIN. Enable it. Turn other identity providers off for this application so a reviewer is not offered a Google login they do not have.

## 6. Zone rules for this hostname only

These rules apply to `uat.gabbamedicalcentre.com.au`. They do not change the apex.

**Cache.** Caching → Cache Rules → Bypass cache when the hostname equals `uat.gabbamedicalcentre.com.au`. Reviewers then see a CMS publish and a replaced photograph on the next load.

**Robots.** Rules → Transform Rules → Modify Response Header. When the hostname equals `uat.gabbamedicalcentre.com.au`, set `X-Robots-Tag` to `noindex, nofollow`. Access already stops crawlers that are not signed in. The header covers a request that passes Access. Do not submit this hostname to a search engine. `robots.txt` on the site is the approved production file. Leave that file as it is.

**SSL/TLS.** The zone mode can stay Full (strict) for the apex. The tunnel terminates TLS at Cloudflare and speaks HTTP to `127.0.0.1`. That does not require an origin certificate on this laptop.

## 7. Share access

Staff who will use the CMS, before the email goes out:

1. Sign in at `https://uat.gabbamedicalcentre.com.au/admin/login` as the operator.
2. Create the person in Staff users. Role is Content Editor, or Clinic Admin for the Practice Manager. Do not share the operator password.
3. Set a unique password. The CMS will not email it.

Then send two messages.

Message 1, to staff and clinicians:

> Woolloongabba website review is open at https://uat.gabbamedicalcentre.com.au
> Enter your email when asked. The sign-in code arrives in that inbox. The code expires quickly. Do not forward the code.
> This address is for review. It is not the public website. It is available only while the clinic has the review session open.
> Use the menu on the site. Links that go to gabbamedicalcentre.com.au leave the review copy.

Message 2, only to staff with a CMS account, and not in the same thread as a forwarded code:

> CMS sign-in is on the same site at /admin/login.
> Username: (their username)
> Password: (set by the operator)
> Sign in and change the password. Drafts do not appear on the review site until they are published.

To remove someone: delete their email from the Access group. Their next request stops at Access. Delete or disable the CMS user as well if they had one.

To close the session for everyone: stop `cloudflared`. The hostname can stay in DNS. Starting `cloudflared tunnel run wmc-uat` opens it again, provided the app on port 3100 is still up.

Tell reviewers the hours the laptop will stay awake. Sleep, hibernate, or a closed lid stops the tunnel even though Access and DNS are unchanged.

## 8. Acceptance checks

Run these in a browser that has completed the Access PIN. A `curl` from another network receives the Access login page, which does not prove the app is up.

| Check | Pass |
| --- | --- |
| Clinic host | `https://uat.gabbamedicalcentre.com.au/` returns the homepage. It does not say “Clinic not found for this host.” |
| Health | `https://uat.gabbamedicalcentre.com.au/api/health` shows the database up. |
| Search and Digital Reception | The launcher is on the homepage and absent on the 404 page. Search for a published guide title. Results are links on the UAT host. |
| Search fallback | If the panel says search is temporarily unavailable, `search-index/manifest.json` failed and the compatibility index failed. Both are same-origin URLs. Fix those before continuing. |
| Knowledge Search | Open a Knowledge Centre page that contains the guide finder. Type a published guide title. The result link opens that guide on the UAT host. |
| Images | The logo, the homepage hero, and one practitioner portrait return HTTP 200. After a staff publish of a replacement, reload and confirm the new file. |
| CMS | A Content Editor can sign in, save a draft, and see that draft absent from the public page. |
| Governance | Clinic Admin can open a governance record and an image-governance record. |
| Isolation | `https://gabbamedicalcentre.com.au` still shows the current public site. |
| Closed tunnel | With `cloudflared` stopped, the UAT hostname shows Cloudflare error 1033. |

CMS sign-in must remain on `https://uat.gabbamedicalcentre.com.au` after the password is accepted. The session cookie is `__Secure-authjs.session-token`. If the browser returns to the login form with no error, the app treated the request as HTTP and looked up the non-secure cookie name. Confirm `AUTH_URL`, `AUTH_TRUST_HOST`, and `httpHostHeader`, then restart `next start`.

## Boundaries

- Do not point the apex or `www` at this tunnel.
- Do not open port 3100 or 5432 on the router.
- Do not put the tunnel JSON, `AUTH_SECRET`, or `.env.production.local` in git.
- Do not publish reviewer experiments during a clinician session. Publish is immediate for everyone else on the tunnel.
- Do not use this process as the production origin. Production cutover is a separate decision. `deployment/HOSTINGER.md` is marked superseded. `deployment/LAUNCH.md` remains the VPS guide. `deployment/CLOUDFLARE-PAGES-RUNBOOK.md` remains a fail for Pages.
