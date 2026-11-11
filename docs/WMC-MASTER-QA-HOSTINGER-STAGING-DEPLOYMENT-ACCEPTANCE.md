# WMC — Master QA Hostinger Staging Deployment Acceptance

**Date:** 2026-11-11  
**Authorisation:** Owner-approved staging-only deploy (11 Nov 2026), including temporary acceptance of proceeding without an independently verified off-server staging database backup.  
**Scope:** Hostinger staging only. No GitHub push. No production, DNS, email, or database writes/migrations.  
**PRODUCTION CUTOVER REMAINS NO-GO.**

---

## Verdict

# MASTER QA HOSTINGER STAGING ACCEPTED — WITH DOCUMENTED EXCEPTIONS

---

## Deploy identity

| Item | Value |
|------|-------|
| Branch | `qa/wmc-continuous-website` |
| Git SHA | `02dab0992343546a8020782cafd866ce5b762907` |
| Archive | `wmc-master-qa-rc-02dab09.zip` |
| Archive SHA-256 | `54C66BEAB5934FFFB2C109C750625DE00A535FF855CDD4C323FD39CB3CFA6710` (**MATCH**) |
| Prior accepted staging tip | `699f1de` / build `01a1c934-77d0-7395-ac90-9017db7f6e8b` |
| New Hostinger build UUID | **`01a1ca90-60c0-7083-864e-3775cf41c3fe`** |
| Build state | **completed** |
| Created → updated (UTC) | `2026-11-11T12:23:42Z` → `2026-11-11T12:26:59Z` |
| Runtime restart | **PASS** (published + Node restart in deploy log) |
| Node / app | Node **22**, Next **15.5.29**, `app_type: next` |
| Root directory used | `WMC-qa-continuous/apps/web` (archive prefix layout) |
| Env replace | **None** (Hostinger loaded existing `.env`) |
| Git auto-deploy | **null** |
| GitHub push | **None** |
| DB migrate / seed / writes | **None** (build = `prisma generate` + asset optimise + `next build` only) |
| Rollback archive | `wmc-logo-v4-699f1de39e7e.zip` SHA-256 `1763DF1589C37599EFF2C513FC8AAEA823159DDA794F705A5B6EBD2C192C57A5` (**preserved**) |

### Database backup exception acknowledgement

Independent off-server staging database backup remains **outstanding**. This deploy proceeded under the owner’s written **staging-only** backup-risk exception. It is **not** a permanent waiver and **not** production approval.

---

## Preflight (all PASS before upload)

| Check | Result |
|-------|--------|
| Archive exists + SHA-256 exact match | PASS |
| Git tip = `02dab09…` | PASS |
| Rollback V4 archive intact | PASS |
| Prisma migrations delta `699f1de..02dab09` | **None** |
| `postinstall` / `build` / `start` | `prisma generate` only; no migrate/seed on Hostinger | PASS |
| Env preserved (no replace API used) | PASS |
| Staging-only; no production/DNS/email/GitHub | PASS |
| Node 22 + Next 15.5.29 | PASS (confirmed in build log) |
| Prior build UUID recorded | `01a1c934-77d0-7395-ac90-9017db7f6e8b` |

---

## Live acceptance (Hostinger staging)

Target: https://mediumslateblue-eagle-960503.hostingersite.com

### A. Application health

| Check | Result |
|-------|--------|
| Homepage `/` | **200** |
| `/api/health` | **200** `{"ok":true,"phase":"golden-import","database":"up"}` |
| Static assets (logo, site.js, sw.js, offline, styles.min) | **200** |
| New runtime crash | None observed in smoke |

### B. Branding

| Check | Result |
|-------|--------|
| Homepage HTML V4 logo | **PASS** (`healthcare-doctors-woolloongabba-logo-v4.png`) |
| Schema logo absolute V4 | **PASS** on practitioner pages |
| Logo asset HTTP | **200** `image/png` |
| Favicon / PWA icons / offline shell | **200** |

### C. Practitioner profiles (15/15)

All inventory paths **HTTP 200**:

Anand, Debra, Golnar, James, Kooshyar, Mary, Nirupa, Sambo, Steven, Sumita, Tanya, Usman, Wasantha, Yamesha, Samuel.

Gemunu `doctors/dr-gemunu-suresh-ranawake.html` → **301** `Location: /team-general-practitioners.html` (**intentional**).

### D. Booking policies

| Practitioner | Result |
|--------------|--------|
| Golnar | ONLINE HotDoc `dr-golnar-mortezaei-5?wp=w_lightbox` + CTA **“Book with Dr Golnar”** (**PASS**) |
| Mary | PHONE_ONLY `tel:+61732173344` + Call Reception (**PASS**) |
| Tanya | ONLINE + insurance notice / insurance-slug path (**PASS**) |
| James | ONLINE HotDoc (**PASS**) |
| Yamesha | ONLINE HotDoc (**PASS**) |

### E. Master QA fixes

| Check | Result |
|-------|--------|
| PEERS practitioners | **15** including Golnar, James, Yamesha |
| Search-index doctors | Golnar / James / Yamesha present |
| Touch-target CSS rules present | **PASS** in served stylesheet |
| `styles.min.css` | **200** (434290 bytes) |
| Digital Reception `/api/reception-index` | **200** |
| Recruitment HOLD / join-our-team | **200**; HOLD surface preserved |

### F. Authentication (`next-auth` 5.0.0-beta.32)

| Check | Result |
|-------|--------|
| Deployed Next version | **15.5.29** |
| Hostinger `npm audit` during install | **12** issues (7 moderate, 5 high) — **0 critical** reported |
| `/admin/login` | **200** (password field present) |
| `/admin`, `/admin/pages` | **307** → `/admin/login` |
| `/api/admin/exports/executive` | **307** → `/admin/login` |
| Authorised interactive CMS login | **NOT PERFORMED** (no credentials used) |

Do **not** claim authenticated CMS CRUD passes.

### G. SEO / Hostinger CDN

| Path | Live result | Classification |
|------|-------------|----------------|
| `/` HTML | staging **noindex** present | PASS |
| `/sitemap.xml` | empty staging urlset | PASS |
| `/robots.txt` | **58-byte CDN shadow** (`Googlebot Disallow:/`; `* Allow:/`) | **EXCEPTION — unresolved** |
| `/manifest.webmanifest` | valid JSON; **`Content-Type: text/plain`** | **EXCEPTION — unresolved** |
| `/index.html` | **200** with production-style `index,follow` meta (static/`public/index.html` CDN path) | **EXCEPTION — unresolved** |

**Operator action (separate authorisation):** configure hPanel/CDN so `/robots.txt` reaches the Next route handler; set `*.webmanifest` MIME to `application/manifest+json`; ensure `/index.html` is not served as a static production-indexable file (redirect to `/` or apply staging noindex). Local app mitigations remain correct but are **CDN-shadowed**.

### H. PWA

| Check | Result |
|-------|--------|
| Manifest JSON | **valid** |
| Manifest MIME | **text/plain** (fail vs expected `application/manifest+json`) |
| `sw.js` | **200** JS |
| `offline.html` | **200** |
| Sensitive cache policy | Unchanged fail-closed allowlist (admin/auth excluded) — code-level PASS |

---

## Security assessment (staging deploy)

- Auth.js criticals cleared in this release (`next-auth@5.0.0-beta.32`); Hostinger install audit showed **no criticals**.
- Remaining highs (Next-bundled postcss, zod major, prisma/deepmerge-ts) **not** auto-upgraded — as authorised.
- This staging deploy is **not** production security acceptance.

---

## Remaining clinical / approval items (unchanged)

- Yamesha insurance FAQ vs booking URL
- Usman booking notice wording
- Missing approved practitioner photographs

---

## Rollback readiness

| Item | Status |
|------|--------|
| Rollback zip | `wmc-logo-v4-699f1de39e7e.zip` present |
| Procedure | Re-upload + `hosting_nodejs_start-build` `source_type: archive`, Node 22, root `apps/web` |
| Git branches | Not reset |
| Database | Not rolled back / not mutated |

No rollback executed — acceptance with documented exceptions.

---

## Explicit limits confirmation

- No GitHub push  
- No DB migrations, seeds, or data writes  
- No production deploy  
- No DNS / email changes  
- No Recruitment HOLD release  
- No unapproved clinical content edits  
- Production cutover: **NO-GO**
