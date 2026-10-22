# Cloudflare Quick Tunnel UAT

Temporary staff review on this Windows machine. This is not production hosting, not Cloudflare Pages, and not a VPS. It does not change DNS or WordPress.

Development stays on `http://localhost:3000`. UAT is a second process on `http://127.0.0.1:3100`. The Quick Tunnel publishes whatever URL Cloudflare assigns for that run. The URL changes every time the tunnel starts. Anyone who has the URL can open the public pages. The CMS still requires a staff username and password. Stop the tunnel when the review ends.

## Installation

| Item | Status |
| --- | --- |
| cloudflared | Installed |
| Version | 2026.10.2 (built 2026-10-20) |
| Program | `C:\Program Files (x86)\cloudflared\cloudflared.exe` |
| PATH | `C:\Program Files (x86)\cloudflared\` is on the machine PATH |

A terminal opened before installation will not see `cloudflared`. Open a new terminal and run `cloudflared --version`.

## What was configured

`npm run dev` is unchanged and keeps using `.next`.

`npm run uat` sets `UAT_QUICK_TUNNEL=true`, removes `AUTH_URL` from that process, builds into `.next-uat`, and listens on port 3100. With the flag on, a hostname of the form `<one label>.trycloudflare.com` resolves to `DEFAULT_CLINIC_SLUG` (`woolloongabba`). Other hostnames still require a `ClinicDomain` row. The flag is not in `apps/web/.env`, so the development server does not accept tunnel hosts.

Leave `# AUTH_URL` commented in `apps/web/.env`. A fixed origin would send staff sign-in away from the temporary URL.

UAT responses send `X-Robots-Tag: noindex, nofollow`. Do not submit the tunnel URL to a search engine.

## Start UAT

From the repository root, with PostgreSQL already running and the golden-master import already loaded:

```powershell
npm run uat:build
npm run uat
```

`uat:build` is required again after application code changes. It is not required for every review if `.next-uat` is still present.

Local checks, before the tunnel:

| Check | URL |
| --- | --- |
| Homepage | `http://127.0.0.1:3100/` |
| Digital Reception script | `http://127.0.0.1:3100/digital-reception.js` |
| Knowledge Search | `http://127.0.0.1:3100/knowledge/index.html` |
| Booking page | `http://127.0.0.1:3100/book-appointment.html` |
| CMS login | `http://127.0.0.1:3100/admin/login` |
| Logo | `http://127.0.0.1:3100/assets/brand/healthcare-doctors-woolloongabba-logo.png` |
| Search index | `http://127.0.0.1:3100/search-index/manifest.json` |

Development can stay on port 3000 while this is running.

## Expose the tunnel

In a second terminal:

```powershell
cloudflared tunnel --url http://127.0.0.1:3100
```

Cloudflare prints the public URL. The format is:

```text
https://<random-words>.trycloudflare.com
```

There is no stable name. Send the printed URL to the Practice Manager, reception, and clinicians. When `cloudflared` stops, that URL stops working. Starting it again prints a new URL.

Share `/admin/login` only with staff who have their own CMS username. The CMS does not email passwords.

## Review checks on the printed URL

- Homepage shows the clinic site, not “Clinic not found for this host.”
- Digital Reception opens and a guide search returns a result on the same tunnel host.
- Knowledge Centre → Find a guide returns a published guide.
- Book Appointment opens the HotDoc widget. The booking itself is completed on HotDoc.
- `/admin/login` shows the staff form. A wrong password returns to the form. A valid staff password opens the CMS.
- The logo, homepage hero, and one practitioner portrait load.
- `search-index/manifest.json` is JSON with `"schema":1`.

Approved HTML still links to `https://gabbamedicalcentre.com.au`. Use the menu on the tunnel host. An absolute production link leaves the review copy.

## Stop

1. Press Ctrl+C in the `cloudflared` window.
2. Press Ctrl+C in the `npm run uat` window when review is finished.
3. Leave `npm run dev` running if local work is continuing.

## Blockers

- The tunnel is public to anyone with the current URL. There is no Cloudflare Access prompt. Treat the URL as a secret and stop the tunnel at the end of the session.
- The public URL does not exist until `cloudflared` prints it, and it is different on the next start.
- The computer must stay awake. Sleep stops the tunnel.
- Port 3100 must be free. The tunnel targets this machine only. Do not open 3100 or PostgreSQL on the router.
- `UAT_QUICK_TUNNEL` must not be set on the future VPS. It would accept any `*.trycloudflare.com` host as this clinic.
- Booking cannot be finished inside this app. HotDoc hosts the appointment flow.
- This runbook does not deploy production, change DNS, or change WordPress.
