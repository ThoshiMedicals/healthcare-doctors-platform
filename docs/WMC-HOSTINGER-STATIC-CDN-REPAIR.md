# WMC — Hostinger static delivery and CDN repair

**Date:** 2026-11-11  
**Against accepted staging build:** `01a1ca90-60c0-7083-864e-3775cf41c3fe` (`02dab09`)  
**Staging:** https://mediumslateblue-eagle-960503.hostingersite.com  
**Scope:** Diagnose three delivery defects; implement safe local source corrections; prepare owner-approved Hostinger instructions. **No redeploy / no GitHub push / no production.**

---

## Serving-layer model (verified)

| Signal | Meaning |
|--------|---------|
| `.htaccess` | Passenger Node app (`PassengerStartupFile server.js`, Node 22) — Hostinger-managed; **do not hand-edit** without confirming regeneration behaviour |
| `/` and `/sitemap.xml` | Full Next headers (`platform: hostinger`, CSP, `x-robots-tag`, `x-wmc-cache`) → **Node / Next** |
| `/index.html`, `/manifest.webmanifest` | `last-modified`, **no** Next security/`x-robots` headers → **Passenger static file** from app `public/` **before** Node |
| `/robots.txt` | 58 bytes, **no** `last-modified`, **no** `platform: hostinger`, **no** upstream Next headers → **hCDN edge synthetic** (never reaches app) |

This is **not** explained by stale cache alone (`x-hcdn-cache-status: DYNAMIC` on index/manifest; robots never hits origin).

---

## Three-row issue matrix

| Issue | Previous live response | Diagnosed root cause | Proposed / implemented correction | Verification evidence | Current status |
|-------|------------------------|----------------------|-----------------------------------|----------------------|----------------|
| **`/index.html` indexable** | `200` `text/html`; production `meta robots=index,follow`; **no** `X-Robots-Tag`; body ≈ golden static homepage (~44KB); `last-modified` present | Static `public/index.html` copied into Hostinger standalone `public/`; Passenger serves it **before** middleware rewrite/redirect | **Implemented locally:** moved file → `public/seo-approved/static-homepage-seed.html`; middleware redirects `/index.html`→`/` (302 staging / 301 production). After authorised redeploy, path should hit Node | Live before: indexable static HTML. Local tests: agent-c + public-ux seed path **PASS**. Live after redeploy: expect `3xx` to `/` or Next homepage with staging noindex | **Locally fixed — pending authorised redeploy** (not live yet) |
| **`/robots.txt` 58-byte** | `200` `text/plain` `Content-Length: 58`; body Googlebot `Disallow:/` + `*` `Allow:/`; no Next headers | **hCDN edge override** of `/robots.txt` (app middleware + `robots.txt/route.ts` never run). Contrast: `/sitemap.xml` correctly empty staging urlset via Next | **Cannot fix in app alone.** App already returns staging `Disallow: /` when requests reach Node. **Owner hPanel action required** (below). Do not rely on robots.txt alone; `/` already sends `X-Robots-Tag: noindex…` | Live: still 58-byte shadow. Local: `stagingRobotsTxt()` tests **PASS**. Sitemap via Next **PASS** live | **Hosting-operator blocked** |
| **`/manifest.webmanifest` MIME** | `200` valid JSON; **`Content-Type: text/plain`**; `last-modified`; Next `headers()` ignored | Static `public/manifest.webmanifest` short-circuited by Passenger; MIME from static map (`text/plain`), bypassing `next.config` Content-Type | **Implemented locally:** moved → `public/seo-approved/manifest.webmanifest`; added `src/app/manifest.webmanifest/route.ts` serving `application/manifest+json`. Remove public-root static copy so Passenger cannot intercept | Local route + JSON tests **PASS**. Live still `text/plain` until redeploy | **Locally fixed — pending authorised redeploy** |

---

## Local source changes (this tip)

| Change | Purpose |
|--------|---------|
| Remove `public/index.html` (seed retained under `seo-approved/`) | Stop Passenger serving indexable duplicate homepage |
| Middleware `/index.html` → `/` for all hosts | Durable redirect once request reaches Node |
| Remove `public/manifest.webmanifest`; route handler + `seo-approved` source | Force correct MIME through Next |
| Updated agent-c / public-ux / cache-policy tests | Lock the new layout |

**Not changed:** practitioner/booking journeys, Recruitment HOLD, CMS content, Hostinger `.htaccess`, env, database.

---

## Owner instructions — Hostinger `/robots.txt` (approval required before apply)

Do **not** manually overwrite Hostinger-generated `.htaccess` Passenger block unless Hostinger support confirms it is safe (it is regenerated on publish).

1. In **hPanel → Website → Advanced / CDN / SEO** (wording varies), find any **robots.txt override**, “SEO robots”, or edge rule for `/robots.txt`.
2. **Disable** the platform default that injects:
   ```
   User-agent: Googlebot
   Disallow: /

   User-agent: *
   Allow: /
   ```
3. Ensure `/robots.txt` is **proxied to the Node application** (same path as `/sitemap.xml`, which already works).
4. After change (no code redeploy strictly required if edge-only), verify:
   ```bash
   curl -sSI https://mediumslateblue-eagle-960503.hostingersite.com/robots.txt
   curl -sS  https://mediumslateblue-eagle-960503.hostingersite.com/robots.txt
   ```
   **Expected staging body** (from app):
   ```
   # Staging / preview — not for indexing
   User-agent: *
   Disallow: /
   ```
   **Expected headers:** `platform: hostinger` (or equivalent Next stack), `X-Robots-Tag: noindex, nofollow, noarchive`, `Cache-Control: no-store`.
5. **Production cutover later:** same edge must not block the app; production body comes from `public/seo-approved/robots.txt` via the route handler (`Allow: /` + Sitemap). Staging `Disallow: /` must not ship to apex.

Optional CDN purge: useful after MIME/index fixes post-redeploy; **will not** fix robots while the edge synthesises the 58-byte body.

---

## Post-redeploy smoke (when owner authorises)

| Check | Expect |
|-------|--------|
| `GET /index.html` | `301`/`302` → `/` **or** Next HTML with staging noindex / `X-Robots-Tag` |
| `GET /` | unchanged: `200` + `X-Robots-Tag: noindex…` |
| `GET /manifest.webmanifest` | `Content-Type: application/manifest+json` (+ valid JSON, icons 200) |
| `GET /robots.txt` | App staging body (after hPanel) — else still blocked |
| Practitioners 15/15 + booking matrix | Unchanged **PASS** |

---

## Classification summary

| Item | State |
|------|--------|
| Locally fixed | `/index.html` static removal + redirect; manifest route MIME |
| Live verified on current build | Defects still present (pre-redeploy); `/` + `/sitemap.xml` still correct via Next |
| Hosting-operator blocked | `/robots.txt` hCDN synthetic response |
| Accepted app build | Unchanged until separate redeploy authorisation |
