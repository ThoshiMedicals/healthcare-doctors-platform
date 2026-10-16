# Woolloongabba production deployment

This is the only production deployment guide. Local development stays on localhost. Production runs on a VPS. Cloudflare is used only for DNS, SSL proxying, and traffic management. The Cloudflare SSL/TLS mode is Full (strict).

Do not deploy this platform to Hostinger. Do not deploy it to Cloudflare Pages. `deployment/HOSTINGER.md` is superseded.

This guide does not add pages, redirects, or CMS behaviour. Public HTML, navigation, and layout stay as approved.

Roles already in the CMS:

| Person | CMS role | What they can do |
| --- | --- | --- |
| Platform operator | Super Admin | Create staff users, deploy, restore a release |
| Practice Manager | Clinic Admin | Approve, publish, change clinic settings, restore a content revision |
| Content Editor | Content Editor | Edit and submit. Cannot publish |

Clinic Admin and Super Admin are the only roles that can publish or roll content back. A content restore adds a revision and leaves the URL and layout in place.

## Production commands on the VPS

Run these from the repository root on the VPS. Do not run `deployment/docker-compose.production.yml` on the local PC. Local PostgreSQL uses `deployment/docker-compose.yml` or `npm run db:local`, and it stays on localhost.

### Environment

```sh
cp apps/web/.env.example apps/web/.env
cp deployment/.env.example deployment/.env
```

Create both files on the server. Do not copy the local `apps/web/.env`.

| Variable | Production value |
| --- | --- |
| `DATABASE_URL` | `postgresql://wmc:CHOOSE_A_PASSWORD@postgres:5432/wmc?schema=public` |
| `AUTH_SECRET` | Output of `openssl rand -base64 32` |
| `AUTH_URL` | `https://gabbamedicalcentre.com.au` |
| `AUTH_TRUST_HOST` | `true` |
| `DEFAULT_CLINIC_SLUG` | `woolloongabba` |
| `SEED_ADMIN_USERNAME` | The first Super Admin username |
| `SEED_ADMIN_PASSWORD` | A long password. Remove it from the file after the seed |
| `POSTGRES_PASSWORD` | The same password used in `DATABASE_URL` |

`POSTGRES_PASSWORD` is read by `deployment/docker-compose.production.yml` from `deployment/.env`. Keep it the same as the password inside `DATABASE_URL`. Use a password made of letters and numbers so it does not need encoding in the database URL.

### Certificate

Set Cloudflare SSL/TLS to Full (strict) before public traffic uses the proxy. Flexible mode loops, because Nginx redirects HTTP to HTTPS.

Issue the origin certificate before Cloudflare sends public traffic to the VPS. Use either a Let’s Encrypt DNS-01 challenge through the Cloudflare API, or a Cloudflare origin certificate. The current public site keeps answering HTTP while the certificate is issued. Do not run Certbot standalone, and do not stop the current site to free port 80.

`deployment/nginx/gabbamedicalcentre.tls.conf.example` expects:

- `/etc/letsencrypt/live/gabbamedicalcentre.com.au/fullchain.pem`
- `/etc/letsencrypt/live/gabbamedicalcentre.com.au/privkey.pem`

An origin certificate can use those same paths. The file redirects port 80 to `https://gabbamedicalcentre.com.au`, redirects `www` on port 443 to the apex, and proxies to the Next.js app with `X-Forwarded-Proto: https`. TLS is limited to 1.2 and 1.3. The response adds HSTS, including subdomains, and `X-Content-Type-Options`.

After a renewal, reload Nginx:

```sh
docker compose -f deployment/docker-compose.production.yml exec nginx nginx -s reload
```

### Start, migrate, seed, and import

```sh
docker compose -f deployment/docker-compose.production.yml up -d --build
docker compose -f deployment/docker-compose.production.yml exec web npx prisma migrate deploy
docker compose -f deployment/docker-compose.production.yml exec web npm run db:seed
docker compose -f deployment/docker-compose.production.yml run --rm \
  -e GOLDEN_HTML_ROOT=/golden \
  -v "$PWD/old-html:/golden:ro" \
  web npm run import:golden
```

PostgreSQL stays on the Docker network. Only ports 80 and 443 are published. The seed creates the Woolloongabba clinic, marks it live, and attaches `gabbamedicalcentre.com.au` and `www.gabbamedicalcentre.com.au`. The import stores the 198 approved pages. It does not edit `old-html/`.

Remove `SEED_ADMIN_PASSWORD` from `apps/web/.env` after the first sign-in, then recreate the web container so the password is no longer in the environment.

### Backup package

One command writes the database and the whole `wmc_images` volume. That volume holds uploaded logo files, hero images, exterior images, practitioner photo replacements, governance replacement images, pending files, and archives.

```sh
sh deployment/backup-database.sh
```

The package is a directory:

```text
deployment/backups/<stamp>/
├── database.sql
├── images.tar.gz
└── backup-manifest.txt
```

Copy that directory off the VPS before every import, migration, or image upgrade. The approved originals in `apps/web/public` are not inside the package. They stay in Git and in the web image.

### Restore

Restore only when the current database and published photographs should be replaced. The script stops web and nginx, drops the database, loads `database.sql` into a new empty database, replaces the image volume, starts the application, and checks `/api/health`.

```sh
sh deployment/restore-database.sh deployment/backups/<stamp>
```

Do not load `database.sql` into the database that is already running. The restore script creates an empty database first.

### Recovery Verification Checklist

Complete this after `restore-database.sh` reports that the health check passed.

- [ ] The package used contains `database.sql`, `images.tar.gz`, and `backup-manifest.txt`.
- [ ] Web and nginx were stopped before the database was replaced.
- [ ] The restore created an empty database and then loaded `database.sql`. It did not import into the old database.
- [ ] `images.tar.gz` was extracted into the `wmc_images` volume after the old volume files were removed.
- [ ] Web and nginx are running again.
- [ ] `/api/health` reports the database up.
- [ ] The logo, the homepage hero, and one practitioner portrait return HTTP 200.
- [ ] A published clinic phone number and one practitioner biography match the restored records.
- [ ] Staff can sign in at `/admin/login`.
- [ ] The restored package remains stored off the VPS.

### SEO checks before cutover

- `https://gabbamedicalcentre.com.au/robots.txt` and `https://gabbamedicalcentre.com.au/sitemap.xml` are the approved files copied into `apps/web/public`. Do not replace them.
- The sitemap lists the production host and omits `404.html`. It does not list `updates/article.html`. Leave the sitemap as approved. That address still serves the page.
- Approved pages already carry `rel="canonical"` on that host. `404.html` has no canonical and is `noindex`.
- `/` and `/index.html` both serve the homepage. Other addresses keep their `.html` paths.
- An unknown address returns the approved 404 page with HTTP 404.
- HTTP and `www` redirect to `https://gabbamedicalcentre.com.au`.

## Origin protection

Cloudflare is the only public entry point. The VPS accepts website traffic from Cloudflare addresses and drops every other source on ports 80 and 443. Direct use of the VPS IP is blocked. PostgreSQL stays unpublished.

The host firewall is the control that works with Docker. Nginx inside the container often sees Docker’s bridge address, not the visitor, while Docker’s userland proxy is on. Do not turn on the Nginx `deny all` rule until an access log shows a real public address. Set Docker `userland-proxy` to false before relying on the Nginx list.

On the VPS, from the repository root:

```sh
sh deployment/cloudflare-origin-firewall.sh
```

That downloads Cloudflare’s current IPv4 and IPv6 ranges and writes `deployment/nginx/cloudflare-allow.conf`. It does not change the firewall. After a normal Cloudflare request still succeeds, apply the host rules:

```sh
ADMIN_CIDR=203.0.113.10/32 APPLY_ORIGIN_FIREWALL=yes sh deployment/cloudflare-origin-firewall.sh
```

Replace `203.0.113.10/32` with the operator’s address if SSH is later limited. The script does not change SSH. It adds `CF-ORIGIN` and `CF-ORIGIN6` and makes `DOCKER-USER` jump to them. Ports 80 and 443 return for Cloudflare ranges and drop everyone else. Regenerate the list when Cloudflare publishes new ranges.

`curl --resolve` from a laptop fails once the firewall is on. Run the staging smoke test on the VPS, or allow that laptop’s address for the test and remove it afterwards. A normal browser must still show the current public site until cutover.

HSTS in the TLS example is `max-age=31536000; includeSubDomains` and does not include `preload`. After the first public HTTPS response, browsers force HTTPS for every name under `gabbamedicalcentre.com.au` for one year. Confirm no subdomain still needs plain HTTP before cutover.

Full (strict) accepts a Let’s Encrypt certificate for the apex and `www`, and it accepts a Cloudflare Origin Certificate. The origin certificate is not trusted by a browser that reaches the VPS directly. The firewall still has to drop that path. Authenticated Origin Pulls are documented in `deployment/nginx/cloudflare-allow.conf.example`. Turn the Cloudflare zone setting on before Nginx requires the client certificate.

## 1. VPS staging checklist

Staging is the production stack on the VPS while Cloudflare still sends public visitors to the current site. Visitors must not reach the VPS until the go-live decision.

- [ ] VPS is Ubuntu with Docker Engine and the Compose plugin.
- [ ] Ports 80 and 443 accept Cloudflare only. Direct access to the VPS IP is blocked. Port 5432 is closed. SSH is limited to the operator when that rule is added.
- [ ] The checkout on the VPS includes `apps/web/public` from a completed golden-master import.
- [ ] `apps/web/.env` has `AUTH_URL=https://gabbamedicalcentre.com.au`, `AUTH_TRUST_HOST=true`, a new `AUTH_SECRET`, and a letter-and-number database password.
- [ ] `deployment/.env` has the same database password.
- [ ] `SEED_ADMIN_PASSWORD` is set only for the first seed, then removed.
- [ ] The origin certificate exists before Cloudflare sends public traffic to the VPS. SSL/TLS mode is Full (strict).
- [ ] Stack is up, migrated, seeded, and imported with the commands in “Production commands on the VPS”.
- [ ] Checks use the VPS address with the production host name, so the clinic resolver still matches the seeded domain:

```sh
curl --resolve gabbamedicalcentre.com.au:443:VPS_IP -I https://gabbamedicalcentre.com.au/
sh deployment/smoke-test.sh https://gabbamedicalcentre.com.au
```

Run the smoke test on the VPS, or from an address the origin firewall allows. A laptop using `--resolve` is blocked once direct IP access is denied. A normal browser request must still show the current public site.

- [ ] `https://gabbamedicalcentre.com.au/admin/login` on that resolved host shows staff sign-in.
- [ ] A Super Admin can sign in. A Clinic Admin account exists for the Practice Manager.
- [ ] PostgreSQL is not reachable from the public internet.
- [ ] A backup package from `deployment/backup-database.sh` is stored off the VPS. It contains `database.sql`, `images.tar.gz`, and `backup-manifest.txt`.

## 2. Woolloongabba go-live checklist

Complete every item on staging before DNS cutover.

- [ ] Staging smoke test passed against the VPS.
- [ ] Practice Manager verification is signed.
- [ ] Every practitioner profile in section 6 is signed, or the exception is written down.
- [ ] HotDoc validation in section 4 passed.
- [ ] WordPress redirect inventory in section 3 is filed. Unmapped addresses are an accepted 404 or a No-Go.
- [ ] Phone `(07) 3217 3344`, email `reception@gabbamedicalcentre.com.au`, and 468 Vulture Street, Woolloongabba QLD 4102 match the contact page.
- [ ] Opening hours match the approved page: Mon–Thu 07:00–19:00, Friday 08:00–17:00, Saturday 09:00–17:00, Sunday 09:00–15:00.
- [ ] `robots.txt` and `sitemap.xml` are the approved files.
- [ ] HTTP and `www` redirect to `https://gabbamedicalcentre.com.au` once TLS is in front of the app.
- [ ] The current site can be restored by putting the saved Cloudflare DNS records back.
- [ ] Rollback owner and Practice Manager are available for the cutover window.

## 3. WordPress redirect inventory

The app does not rewrite old WordPress permalinks. Nginx only redirects HTTP and `www` to `https://gabbamedicalcentre.com.au`, and it keeps the path. An unknown path returns the approved 404 page with HTTP 404.

Inventory the current site before cutover. Do not add redirect rules in this release.

1. Export the live WordPress URL list from its sitemap, the redirect plugin, and Search Console pages with impressions.
2. Record each row: current URL, path, whether it has inbound links, and the approved destination if one exists.
3. Match a path to an approved page only when that `.html` file is already in the golden master. Examples: `/contact/` is not automatically `/contact.html`. Write the exact approved path, such as `contact.html`.
4. Mark each row as one of: same path already approved, approved `.html` equivalent, or no approved page.
5. After staging is up, request each current path through the VPS with `curl --resolve` and record the status. Equivalent pages are confirmed on their `.html` URL. Unmapped paths must be HTTP 404 with the heading “We couldn’t find that page.”
6. The Practice Manager accepts the 404 list in writing, or the launch waits. This release does not create new redirects.

## 4. HotDoc validation

The booking URL stays on `https://www.hotdoc.com.au` and includes `wp=w_lightbox`. The approved clinic URL is:

`https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/doctors?wp=w_lightbox`

1. On the homepage, confirm “Book Appointment” uses `data-hotdoc-widget="lightbox"` and that URL.
2. Confirm the page loads `https://cdn.hotdoc.com.au/static/assets/js/hotdoc-widgets.min.js`.
3. Open the lightbox. The clinic shown is Woolloongabba Medical Centre. Close it without completing a patient booking.
4. Repeat from the persistent booking bar and from `book-appointment.html`.
5. Open one practitioner profile and confirm that profile’s lightbox URL is still on `https://www.hotdoc.com.au` and contains `wp=w_lightbox`.
6. Call `(07) 3217 3344` from the “Call Clinic” link and confirm the practice answers, or confirm the displayed number with reception.
7. A failed lightbox, a changed clinic, or a URL that leaves HotDoc is a No-Go.

## 5. Practice Manager verification

Sign in as Clinic Admin at `/admin/login`. Check the public pages on the staging host. Do not publish draft text during this check.

- [ ] Practice name: Woolloongabba Medical Centre.
- [ ] Address: 468 Vulture Street, Woolloongabba QLD 4102.
- [ ] Phone: `(07) 3217 3344`. Email: `reception@gabbamedicalcentre.com.au`.
- [ ] Hours match section 2, including Sunday 09:00–15:00.
- [ ] After-hours guidance still names Hello Home Doctor, `134 100`, and `after-hours-care.html`.
- [ ] Navigation is Services, Our Team, About Us, Patient Information, Knowledge Centre, Updates, Contact.
- [ ] Homepage, About Us, Patient Information, Fees & Billing, Contact, and the Knowledge Centre hub match the approved wording.
- [ ] A draft saved in the CMS does not appear on the public page.
- [ ] Clinic settings in `/admin/settings` match the public phone, hours, and HotDoc URL.
- [ ] The Practice Manager signs the go-live checklist.

## 6. Practitioner verification

Confirm each public profile on staging. Photo, name, and booking link must match the approved page. Do not upload a new photo during launch.

- [ ] `doctors/dr-anand-singh.html`
- [ ] `doctors/dr-debra-larkins.html`
- [ ] `doctors/dr-gemunu-suresh-ranawake.html`
- [ ] `doctors/dr-kooshyar-karimi.html`
- [ ] `doctors/dr-mary-abadir.html`
- [ ] `doctors/dr-nirupa-sivathasan.html`
- [ ] `doctors/dr-sambo-luon.html`
- [ ] `doctors/dr-steven-chang.html`
- [ ] `doctors/dr-sumita-singh.html`
- [ ] `doctors/dr-tanya-goodwill.html`
- [ ] `doctors/dr-usman-gul.html`
- [ ] `doctors/dr-wasantha-hettiarchchi.html`
- [ ] `doctors/mr-samuel-stafford.html`
- [ ] `team.html` lists the same people and each card opens the profile above.

For each profile: the portrait is the approved image, the HotDoc link uses the lightbox URL, and the biography is the approved text. Any mismatch is corrected through the existing approve-and-publish workflow before cutover, or the launch waits.

## 7. Final smoke-test sequence

Run `sh deployment/smoke-test.sh https://gabbamedicalcentre.com.au` against staging with `--resolve` or a hosts-file override, then again after DNS cutover without that override.

The script already requires HTTP 200 for the homepage, Dr Anand Singh, Knowledge Centre, About Us, Patient Information, Contact, privacy, robots, sitemap, and staff sign-in. It requires the HotDoc script, the footer contact group, and HTTP 404 with `aria-level="2"` for an unknown path.

Then, by hand:

1. Homepage booking lightbox opens and closes.
2. Footer shows the phone, address, and privacy link.
3. Contact page shows 468 Vulture Street.
4. `/index.html` and `/` show the same homepage.
5. `http://` and `www` redirect to `https://gabbamedicalcentre.com.au` after cutover.

## 8. Cloudflare DNS cutover

Do this only after the Go decision. Nameservers stay at Cloudflare. Do not create a Cloudflare Pages project.

1. Lower the Cloudflare TTL at least a day ahead.
2. Record the current proxied A and AAAA records for `gabbamedicalcentre.com.au` and `www`.
3. Confirm the VPS smoke test still passes through `--resolve`.
4. Take a fresh backup package and copy the whole directory off the VPS.
5. Confirm SSL/TLS mode is Full (strict).
6. Change the A and AAAA records for the apex and `www` to the VPS. Leave both records proxied.
7. Wait for the new records, then from a normal network run:

```sh
sh deployment/smoke-test.sh https://gabbamedicalcentre.com.au
```

8. Confirm a browser that is not using a hosts override shows the new homepage, and that HTTP and `www` land on the apex.
9. Tell reception the site is live and leave the rollback owner online until the 24-hour check.

## 9. Rollback

Use the smallest rollback that fixes the fault.

**Cloudflare DNS rollback.** If the public site is wrong after cutover, restore the proxied A and AAAA records recorded in section 8. Visitors return to the current site. Leave the VPS stack running so it can be corrected.

**Release rollback.** If the VPS build is the fault and Cloudflare should keep sending traffic to the VPS:

1. Check out the previous annotated tag: `git fetch --tags && git checkout vX.Y.Z`.
2. Rebuild: `docker compose -f deployment/docker-compose.production.yml up -d --build`.
3. Restore the backup package taken before that release: `sh deployment/restore-database.sh deployment/backups/<stamp>`.
4. Complete the Recovery Verification Checklist.
5. Run `sh deployment/smoke-test.sh https://gabbamedicalcentre.com.au` through `--resolve`.

**Content rollback.** If one page’s text is wrong, a Clinic Admin or Super Admin restores the earlier revision in the CMS. That does not change the URL, layout, or navigation, and it does not require a DNS change.

## A. Staging deployment sequence

1. Complete section 1.
2. Issue the origin certificate and set Cloudflare SSL/TLS to Full (strict).
3. Start, migrate, seed, and import with “Production commands on the VPS”.
4. Run sections 3 to 7 through the VPS without changing Cloudflare DNS.
5. Store the backup package and the signed checklists off the VPS.

## B. Production deployment sequence

1. Go decision from section E.
2. DNS cutover from section 8.
3. Smoke test from the public network.
4. Practice Manager confirms the homepage, booking lightbox, phone, and one practitioner profile on the public URL.
5. Keep the previous Cloudflare records and the pre-cutover backup package until the 24-hour check passes.

## C. Day-of-launch checklist

- [ ] Staging smoke test passed the same day.
- [ ] Practice Manager and practitioner sign-offs are filed.
- [ ] HotDoc lightbox opens for the Woolloongabba clinic.
- [ ] WordPress inventory is accepted.
- [ ] Pre-cutover backup package is off the VPS.
- [ ] Previous DNS values are written down.
- [ ] Rollback owner is available.
- [ ] Public smoke test passed after the DNS change.
- [ ] Reception can open the homepage and the booking button.

## D. 24-hour post-launch checklist

- [ ] Homepage, booking lightbox, contact page, and one practitioner profile still return HTTP 200.
- [ ] Unknown path still returns HTTP 404.
- [ ] HTTP and `www` still redirect to the apex.
- [ ] Staff can sign in at `/admin/login`.
- [ ] No draft is visible on a public page.
- [ ] Certificate expiry is more than 30 days away.
- [ ] Backup package from the first live hour is stored off the VPS.
- [ ] Search Console still lists `https://gabbamedicalcentre.com.au` as the property. Submit the existing sitemap only. Do not replace `sitemap.xml`.
- [ ] Reception reports no failed booking or wrong-phone calls caused by the site.

## E. Go / No-Go

**Go** only when all of these are true:

- Staging smoke test passed.
- Practice Manager signed section 5.
- Practitioner profiles in section 6 are confirmed.
- HotDoc lightbox opens for this clinic and the URL is unchanged.
- WordPress rows with no approved page are accepted as 404s.
- TLS is valid for the apex and `www`.
- PostgreSQL is not published on the host.
- A current backup package and the old Cloudflare DNS values are stored.
- Rollback owner is available during cutover.

**No-Go** if any of these are true:

- Smoke test fails.
- Booking opens a different clinic, or the HotDoc URL is not a lightbox URL.
- Phone, address, or hours on the public page are wrong.
- A draft or unpublished edit is visible publicly.
- The Practice Manager has not signed.
- The certificate cannot be issued before DNS moves, and the practice has not accepted a cutover window for certificate issuance.
- The only recovery path is a content or DNS change that nobody present can perform.
