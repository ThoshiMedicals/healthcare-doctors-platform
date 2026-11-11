# WMC — Post-PWA Release Hardening + Dr Golnar HotDoc

## Combined Lead Integration Report (A–O)

| Field | Value |
| --- | --- |
| Lead worktree | `C:\Users\RoshanSamarawickrema\Desktop\WMC-post-pwa-booking-integration` |
| Integration branch | `integration/wmc-post-pwa-booking` |
| Accepted baseline | `a8309dbcd2b1458f5228d50ff4f9bc48b5d8e625` |
| Current HEAD (uncommitted candidate) | still `a8309db` + dirty A+B integration |
| Staging (unchanged) | `https://mediumslateblue-eagle-960503.hostingersite.com` |
| Staging build (still live) | `01a1c862-5c31-71eb-9f64-9a014901a683` / archive `wmc-pwa-layout-a8309db.zip` |
| Archive SHA-256 | `6808FECD1266A92B17A37098995D4392FD8327D4DD20FE9C6CA6B0C2F56B0488` |
| Date | 2026-11-11 |
| Push / Hostinger deploy / staging DB write | **Not performed** |

### O — FINAL VERDICT

**WMC POST-PWA + HOTDOC INTEGRATION — READY FOR STAGING**

Local integration candidate is verified for archive staging release **after** an authorised local commit. Production remains **NO-GO**. Staging live site still serves `a8309db` (pre-Golnar-online); this candidate is not deployed.

---

## A. Parallel-agent worktrees and execution results

| Agent | Worktree | Branch | Result |
| --- | --- | --- | --- |
| A — Hardening | `WMC-hardening-post-pwa` | `hardening/wmc-post-pwa` | **READY** — SEO sitemap telehealth sync; PWA/HOLD/CMS-logic verified; ops gaps documented |
| B — Golnar HotDoc | `WMC-golnar-hotdoc` | `feature/wmc-golnar-hotdoc` | **READY** — ONLINE HotDoc policy + CMS-first resolver + chrome align |
| Lead — Integration | `WMC-post-pwa-booking-integration` | `integration/wmc-post-pwa-booking` | **READY FOR STAGING** (conditions below) |

**Overlap check:** Agent A owned `seo-approved/sitemap.xml` + hardening report. Agent B owned booking presentation files. **No conflicting same-file edits.** Lead copied both into the integration worktree without discarding either.

All prior worktrees/branches preserved (including `release/wmc-pwa-layout-candidate` @ `a8309db`). No destructive Git operations. No push. No Hostinger deploy.

---

## B. Exact source baseline and preservation checks

| Check | Status |
| --- | --- |
| Baseline SHA | `a8309db` — `feat(wmc): integrate patient PWA and 12-page layout recovery` |
| Patient PWA fail-closed SW | Preserved (Agent A regression; Lead re-ran SW/PWA tests) |
| 12-page journey-nav layout | Preserved (`ensure-journey-nav` tests in focused suite) |
| CMS P0 logic | Preserved (logic suites pass; DB suites env-blocked) |
| Sprint 2 performance path | No performance-code regressions introduced |
| Recruitment HOLD | Unchanged (unit + staging HTTP spot-check) |
| Hero authority v6 / logo | Untouched |
| Golden `old-html/` | Untouched |
| Mary phone-only | Preserved (unit + staging profile still `tel:`) |

---

## C. Dr Golnar booking implementation and HotDoc verification

### Authorised URL

```text
https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/doctors/dr-golnar-mortezaei-5?wp=w_lightbox
```

### Source-of-truth model (Agent B)

1. Prefer CMS `practitioner.bookingUrl` / published payload when it is a **practitioner-specific** HotDoc URL.
2. Else fall back to `GOLNAR_APPROVED_HOTDOC_URL` (rejects `tel:` and clinic-level `…/doctors?wp=`).
3. `alignGolnarOnlineBookingChrome` upgrades Golnar profile + welcome chrome at render/`public-ux` time.
4. Directory inject + onboard script seed the authorised URL for future CMS republish.
5. Widget attrs follow existing site convention (`data-hotdoc-widget="lightbox"`, `data-hotdoc-button=""`); **no duplicate HotDoc script inject**.
6. PWA quick-nav continues to mirror sticky `.persistent-care-book` after alignment.

### Unit / presentation verification

Focused Lead suite: **116/116 pass** (booking + PWA + SW + HOLD + journey-nav + SEO launch).

### Live staging (still `a8309db` — pre-candidate)

| Surface | Staging observation |
| --- | --- |
| `/doctors/dr-golnar-mortezaei.html` | **301 → `/team-general-practitioners.html`** (profile HTML not currently served) |
| GP directory card for Golnar | Still **`tel:+61732173344` / “Call Reception to Book”** |
| Welcome page | **200** |
| Mary profile | **200**, phone-only CTA intact |

**Implication:** Code fallback will fix CTAs once this candidate is archive-deployed **and** Golnar’s practitioner profile page is publicly served (remove/fix the 301). Optional durable CMS: set Golnar `bookingUrl` to the authorised HotDoc URL and publish. Appointment submission itself was **not** claimed (no authorised end-to-end booking).

HotDoc lightbox on a real device after deploy: **pending staging deploy**.

---

## D. Updated five-practitioner booking matrix

| Practitioner | Required | Integration verification |
| --- | --- | --- |
| Dr Golnar Mortezaei | ONLINE — HotDoc (`dr-golnar-mortezaei-5`) | Unit resolve + chrome + inject + a11y; staging still phone/clinic until deploy + profile restore |
| Dr Mary Abadir | PHONE_ONLY | Unit + staging profile `tel:` |
| Dr Tanya Goodwill | ONLINE — HotDoc (insurance slug preserved) | Untouched; restriction tests pass |
| Dr James Chanaka | ONLINE — HotDoc | Untouched; path `doctors/dr-james.html` |
| Dr Yamesha Ranatunga | ONLINE — HotDoc | Untouched |

---

## E. Patient PWA security and installation regression

| Gate | Result |
| --- | --- |
| Manifest / icons / offline / SW allow-list | **PASS** (unit + staging HTTP 200 for `/sw.js`, `/manifest.webmanifest`, icons historically) |
| Sensitive path non-intercept | **PASS** (`sw-contract`, `cache-policy`) |
| Ordinary CMS HTML not SW-cached | **PASS** |
| `publicCacheEpoch` / durable HTML | Preserved (no SW expansion) |
| Physical Android / iPhone install | **UNVERIFIED** |
| Staging manifest MIME | `text/plain` (suboptimal; browsers still consume) |

---

## F. Recruitment HOLD and CMS P0 verification

### HOLD (staging re-spot-check 2026-11-11)

| Route | Result |
| --- | --- |
| `/join-our-team.html` | **200** + `X-Robots-Tag: noindex, nofollow, noarchive` |
| `/join-our-team/express-interest.html` | **404** |
| EOI / readiness APIs | Prior Agent A: **403** (policy unchanged; not re-mutated) |

HOLD code/settings: **not changed**.

### CMS P0

| Suite class | Result |
| --- | --- |
| Logic (lifecycle, SEO, preview, admin hardening, staff) | **PASS** (Agent A + preserved) |
| Disposable DB lifecycle / super-admin / golden-master | **UNVERIFIED** — local Postgres / `.env` unavailable in integration worktree |

---

## G. Four outstanding full-suite test classifications

### Integration full `npm test` (post A+B)

| Metric | Value |
| --- | --- |
| tests | **467** |
| pass | **464** |
| fail | **3 leaf DB/env failures** (runner may summarise suite nesting as fail 2) |

| # | Exact name | Error | Classification | Repair |
| --- | --- | --- | --- | --- |
| 1 | `unpublishes to stop public serve then restores through publish gate` / `page lifecycle DB integration` | `Can't reach database server at localhost:5432` | **Environment** — needs disposable Postgres / `WMC_P0_TEST_DATABASE_URL` | Not a product defect; not marked pass |
| 2 | `creates a deputy, grants Super Admin, and removes the trial accounts` | Prisma can't reach `localhost:5432` | **Environment** | Same |
| 3 | `navigation, header, footer, schema, accessibility, and Digital Reception match the golden master` | Prisma can't reach `localhost:5432` | **Environment** | Same |
| 4 *(baseline)* | `approved sitemap and robots are served unchanged` | Missing `telehealth.html` in seo-approved | **Product drift — FIXED by Agent A** | Synced `public/seo-approved/sitemap.xml` ← golden |

Pre-existing on `a8309db` laptop runs: sitemap drift + DB gaps. After integration: sitemap **PASS**; only DB-env gaps remain.

---

## H. Sitemap and SEO defect findings or fixes

| Item | Status |
| --- | --- |
| Golden vs seo-approved `telehealth.html` | **Fixed** in candidate (Agent A) |
| Staging `/sitemap.xml` | Empty urlset + noindex (**correct** for staging) |
| Staging `/robots.txt` | **Ops FAIL** — Hostinger static short-circuit (`Allow: /` for `*`) bypasses Next staging robots. Operator must delete root static `robots.txt` so Node middleware serves `Disallow: /` |
| Recruitment noindex | HTML HOLD pages carry staging noindex headers |

---

## I. Off-server database backup status

**Missing.** Staging Supabase `thwcxuhrzgkufvdrvzzt` has in-DB `_wmc_backup_*` snapshots only (same server — not disaster recovery).

Operator must:

1. Confirm Supabase Dashboard backups/PITR for the project.
2. Take off-box `pg_dump -Fc` via **direct** URL; store encrypted off-server.
3. Do not treat `_wmc_backup_*` as sole backup.

No staging DB export or mutation performed by agents.

---

## J. GitHub release preservation plan

Confirmed: Hostinger `gitAutoDeployment` is **null** (archive deploy). Pushing GitHub does **not** auto-deploy while disconnected.

Recommended SSoT flow (operator — **do not execute without GO**):

1. Keep Git auto-deploy **OFF**.
2. Commit this integration candidate on `integration/wmc-post-pwa-booking` (message suggestion below).
3. Optionally push branch + annotated tag naming the SHA; open PR per `deployment/SOURCE-CONTROL.md`.
4. Stage via **archive zip** of the commit (same method as `wmc-pwa-layout-a8309db.zip`), not accidental Git reconnect.
5. Only later: reconnect auto-deploy to an immutable release branch/tag after explicit GO.

Remote: `https://github.com/ThoshiMedicals/healthcare-doctors-platform.git`.

---

## K. Responsive and performance test results

| Gate | Result |
| --- | --- |
| Next.js production `npm run build` | **PASS** (`✓ Compiled successfully`); local Windows may log `EPERM` symlink on traced `_app.js` (known laptop noise; Hostinger Linux historically OK) |
| ESLint on booking touchpoints | **PASS** (`--max-warnings 0`) |
| Focused booking/PWA/HOLD/layout/SEO | **116/116 PASS** |
| Full suite non-DB | **464 PASS** |
| Multi-viewport 320–1440 browser matrix | **Not fully re-executed** in this Lead turn (prior PWA+layout staging acceptance stands for `a8309db` chrome; Golnar CTA visual re-check requires post-deploy profile page) |
| Performance cold/warm | No new third-party scripts; HotDoc remains existing pattern. No Sprint 2 perf code reverted. Quantitative re-measure deferred to post-staging-deploy smoke |

---

## L. Integrated changed-file manifest

### Modified

- `apps/web/public/seo-approved/sitemap.xml` *(Agent A)*
- `apps/web/scripts/onboard-practitioners-golnar-james.mjs`
- `apps/web/src/documents/inject-cms-practitioners.ts`
- `apps/web/src/documents/inject-cms-updates.ts`
- `apps/web/src/documents/inject-cms-updates.test.ts`
- `apps/web/src/documents/package-a-a11y-smoke.test.ts`
- `apps/web/src/documents/phone-only-booking.ts`
- `apps/web/src/documents/phone-only-booking.test.ts`
- `apps/web/src/documents/public-ux.ts`
- `apps/web/src/documents/public-ux.test.ts`
- `apps/web/src/documents/render-published-document.ts`

### Added

- `apps/web/src/documents/practitioner-booking.ts`
- `apps/web/src/documents/practitioner-booking.test.ts`
- `docs/WMC-HARDENING-AGENT-A-REPORT.md`
- `docs/WMC-GOLNAR-HOTDOC-AGENT-B-REPORT.md`
- `docs/WMC-POST-PWA-HOTDOC-INTEGRATION-REPORT.md` *(this file)*

Diffstat (tracked changes vs `a8309db`): **11 files, +93 / −49** plus 2 new booking modules and docs.

---

## M. Recommended staging release and rollback procedure

### Recommended local commit (not created — awaiting operator)

```text
feat(wmc): Golnar HotDoc online booking + post-PWA sitemap hardening

Authorise Dr Golnar practitioner HotDoc booking with CMS-first URL
resolution and approved lightbox fallback; sync seo-approved sitemap
telehealth hub; keep Mary phone-only and Recruitment HOLD unchanged.
```

### Staging deploy steps (after commit; archive only)

1. From clean commit SHA: build release zip of repo (same Hostinger Node22 / `apps/web` layout as prior).
2. Record SHA-256 of zip.
3. Confirm `gitAutoDeployment` still null.
4. Upload archive to Hostinger; wait for build completed.
5. Smoke: Golnar profile **200** (not 301), CTA → `dr-golnar-mortezaei-5?wp=w_lightbox`; Mary still phone-only; HOLD 200/404/403; `/sw.js` + `/manifest.webmanifest`; 12-page journey-nav; homepage hero v6.
6. Optional CMS: set Golnar `bookingUrl` to authorised URL + publish; bust public cache if needed.

### Rollback

1. Re-upload prior accepted archive `wmc-pwa-layout-a8309db.zip` (SHA-256 above) **or** redeploy commit `a8309db`.
2. If CMS Golnar `bookingUrl` was published, revert practitioner booking field to prior value and republish.
3. Confirm directory card / profile CTAs return to pre-change behaviour.

---

## N. Outstanding conditions and production blockers

### Staging-release conditions (before calling staging “accepted”)

1. Authorised **local commit** of this dirty candidate.
2. Archive deploy of that SHA (no GitHub auto-deploy reconnect).
3. **Restore Golnar profile route** — currently **301 → team directory** on staging; profile must serve 200 for profile CTA verification.
4. Confirm directory + profile + welcome + PWA Book deep-link to `dr-golnar-mortezaei-5`.
5. Optional but recommended: CMS `bookingUrl` publish for durable parity.
6. Delete Hostinger static root `robots.txt` short-circuit.
7. Create verified **off-box** Supabase dump evidence.

### Production blockers (unchanged posture: NO-GO)

- Off-box DB backup + restore drill
- Formal production smoke log
- Env/auth hardening + Postgres not public
- Cloudflare Full (strict) / clean cache policy
- Physical device PWA install evidence
- DNS apex cutover checklist incomplete
- Staging robots ops gap must not ship to apex

---

## O. FINAL VERDICT (repeat)

**WMC POST-PWA + HOTDOC INTEGRATION — READY FOR STAGING**

Local integration candidate combines Agent A sitemap hardening and Agent B Golnar ONLINE HotDoc with preserved PWA, HOLD, CMS P0 logic, and layout recovery. **Do not push, deploy, or write staging DB** until the operator authorises the recommended commit and archive staging procedure. **Production: NO-GO.**
