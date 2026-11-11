# WMC P0 — Doctor profile journey incident report

**Date:** 2026-11-11  
**Worktree:** `C:\Users\RoshanSamarawickrema\Desktop\WMC-p0-doctor-profiles-incident`  
**Branch:** `incident/p0-doctor-profiles-restore`  
**Repair tip:** `18f1f86` (includes HotDoc/redirect fix `a8a3cb8`)  
**Live staging tip (still broken):** `a8309db` / build `01a1c862-5c31-71eb-9f64-9a014901a683`  
**Deploy:** not performed (awaiting separate GO)

---

## L. Final verdict

**ALL PRACTITIONER PROFILES RESTORED — READY FOR STAGING**

Staging Hostinger is still on `a8309db` and remains broken for 3 profiles until this tip is deployed. Local production build of the repair tip restores **15/15** published practitioner profile journeys.

---

## A. Affected practitioner profiles

| Scope | Count |
| --- | ---: |
| Published practitioners with individual profiles (CMS) | **15** |
| Broken on live staging (`a8309db`) | **3** |
| Unaffected (HTTP 200 correct profile) | **12** |
| Intentionally unpublished (Gemunu → directory 301) | **1** |

**Staging failures (patient-facing):**

1. Dr Golnar Mortezaei — `/doctors/dr-golnar-mortezaei.html` → **301** → `/team-general-practitioners.html`
2. Dr James Chanaka — `/doctors/dr-james.html` → **301** → `/team-general-practitioners.html`
3. Dr Yamesha Ranatunga — `/doctors/dr-yamesha-ranatunga.html` → **301** → `/team-general-practitioners.html`

Secondary staging booking defect (same undeployed tip): Golnar directory CTA still **Call reception** on `a8309db`; repair tip restores **Book Appointment → approved HotDoc**.

Mary / Tanya / others were **not** hit by the directory-swallow redirect.

---

## B. Practitioner-by-practitioner route matrix

| Display name | CMS status | Canonical URL | Directory link surface | Staging HTTP | Staging redirect | Local repair HTTP | Local H1 | Local booking CTA |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Dr Anand Singh | published | `/doctors/dr-anand-singh.html` | GP dir + team | 200 | — | 200 | Dr Anand Singh | HotDoc |
| Dr Debra Larkins | published | `/doctors/dr-debra-larkins.html` | GP dir | 200 | — | 200 | Dr Debra Larkins | HotDoc |
| Dr Golnar Mortezaei | published | `/doctors/dr-golnar-mortezaei.html` | GP dir (CMS inject) | **301** | → GP directory | **200** | Dr Golnar Mortezaei | HotDoc `…/dr-golnar-mortezaei-5?wp=w_lightbox` |
| Dr James Chanaka | published | `/doctors/dr-james.html` | GP dir (CMS inject) | **301** | → GP directory | **200** | Dr James Chanaka | HotDoc |
| Dr Kooshyar Karimi | published | `/doctors/dr-kooshyar-karimi.html` | GP dir | 200 | — | 200 | Dr Kooshyar Karimi | HotDoc |
| Dr Mary Abadir | published | `/doctors/dr-mary-abadir.html` | team hub / homepage (specialist) | 200 | — | 200 | Dr Mary Abadir | **PHONE_ONLY** `tel:+61732173344` |
| Dr Nirupa Sivathasan | published | `/doctors/dr-nirupa-sivathasan.html` | GP dir | 200 | — | 200 | Dr Nirupa Sivathasan | HotDoc |
| Dr Sambo Luon | published | `/doctors/dr-sambo-luon.html` | GP dir | 200 | — | 200 | Dr Sambo Luon | HotDoc |
| Dr Steven Chang | published | `/doctors/dr-steven-chang.html` | allied + team | 200 | — | 200 | Dr Steven Chang | HotDoc |
| Dr Sumita Singh | published | `/doctors/dr-sumita-singh.html` | GP dir + team | 200 | — | 200 | Dr Sumita Singh | HotDoc |
| Dr Tanya Goodwill | published | `/doctors/dr-tanya-goodwill.html` | GP dir + team | 200 | — | 200 | Dr Tanya Goodwill | HotDoc (insurance slug preserved) |
| Dr Usman Gul | published | `/doctors/dr-usman-gul.html` | GP dir | 200 | — | 200 | Dr Usman Gul | HotDoc (restriction notice intact) |
| Dr Wasantha Hettiarchchi | published | `/doctors/dr-wasantha-hettiarchchi.html` | GP dir + team | 200 | — | 200 | Dr Wasantha Hettiarchchi | HotDoc |
| Dr Yamesha Ranatunga | published | `/doctors/dr-yamesha-ranatunga.html` | GP dir (CMS inject) | **301** | → GP directory | **200** | Dr Yamesha Ranatunga | HotDoc |
| Mr Samuel Stafford | published | `/doctors/mr-samuel-stafford.html` | allied + team | 200 | — | 200 | Mr Samuel Stafford | HotDoc |
| Dr Gemunu Suresh Ranawake | unpublished / on_hold | n/a | — | 301 → GP dir | intentional | 301 → GP dir | — | — |

---

## C. Root cause for every failure category

| Category | Root cause |
| --- | --- |
| **301 directory swallow (Golnar / James / Yamesha)** | `WORDPRESS_LEGACY_REDIRECTS` on `a8309db` maps Next-native `/doctors/dr-golnar-mortezaei.html`, `/doctors/dr-james.html`, `/doctors/dr-yamesha-ranatunga.html` → `/team-general-practitioners.html`. Middleware applies these **before** CMS page render, so published CMS revisions never reach patients. |
| **Wrong Golnar booking CTA on staging** | Same undeployed tip: presentation still treats Golnar as phone-only on `a8309db`; CMS `booking_url` is null. Fixed in `a8a3cb8` via `GOLNAR_APPROVED_HOTDOC_URL` fallback + chrome alignment. |
| **Mary / Tanya / 12 others inaccessible?** | **Not reproduced.** Direct URLs return 200 with correct H1 on staging. |
| **Blank / 500 / JS-only failure** | **Not observed** on staging for published profiles. |
| **Incorrect directory hrefs** | Directory cards already point at correct `/doctors/*.html` paths; the hrefs are valid — middleware redirects them away on staging. |
| **PWA-only failure** | **Not the primary cause.** Direct HTTP 301 reproduces without service worker. |
| **Gemunu** | Intentional unpublished → directory (keep). |

---

## D. Existing `a8a3cb8` fixes reused

Already present on tip `18f1f86` (ancestor `a8a3cb8`):

- Removed Next-native Golnar/James/Yamesha → directory redirects
- Restored WP legacy `/doctor/dr-golnar-mortezaei-gp-fracgp` and `/doctor/dr-james-general-practitioner` → canonical profiles
- Kept Gemunu → directory
- Golnar ONLINE HotDoc fallback + chrome (`practitioner-booking.ts`)
- Booking matrix for Golnar / Mary / Tanya / James / Yamesha
- Existing unit tests in `wordpress-legacy-redirects.test.ts` and `practitioner-booking.test.ts`

**No overwrite of those fixes.**

---

## E. Additional fixes implemented in this incident worktree

1. **Published practitioner route inventory** — `apps/web/src/seo/published-practitioner-routes.ts`
2. **Inventory-based regression tests** — `published-practitioner-routes.test.ts` (fails if published profiles redirect to directory, if directory cards point at unknown destinations, if booking matrix drifts)
3. **Wired redirect + booking + inventory tests into** `npm test`, `test:p0`, and new `test:practitioner-routes`

No further redirect/booking code changes required beyond `a8a3cb8`.

---

## F. Files changed

| File | Change |
| --- | --- |
| `apps/web/src/seo/published-practitioner-routes.ts` | **added** — 15-route inventory |
| `apps/web/src/seo/published-practitioner-routes.test.ts` | **added** — permanent regressions |
| `apps/web/package.json` | include inventory/redirect/booking tests in suites |
| `docs/WMC-P0-DOCTOR-PROFILES-INCIDENT-REPORT.md` | **added** — this report |

Uncommitted in worktree (no push / no deploy).

---

## G. Direct URL and directory-click verification

### Staging (`a8309db`) — broken

- Direct Golnar/James/Yamesha → **301** → GP directory (browser + curl)
- GP directory cards still link to those paths (links exist; destinations swallowed)
- Golnar directory booking label: **Call reception** (stale)

### Local repair tip (`18f1f86` prod build on `:3101`) — restored

- **15/15** canonical URLs → HTTP **200**, correct H1, not redirected to directory
- GP directory contains Golnar/James/Yamesha profile hrefs
- Directory Golnar booking → approved HotDoc URL
- WP legacy Golnar/James → **301** to canonical profiles (not directory)
- Browser: Golnar profile H1 + Book Appointment; James profile H1 + HotDoc booking copy

---

## H. Booking-policy verification

| Practitioner | Policy | Actual CTA evidence (repair tip) |
| --- | --- | --- |
| Dr Golnar Mortezaei | ONLINE | Profile + directory CTAs use `…/doctors/dr-golnar-mortezaei-5?wp=w_lightbox` |
| Dr Mary Abadir | PHONE_ONLY | `tel:+61732173344`; no Mary HotDoc deep-link |
| Dr Tanya Goodwill | ONLINE | HotDoc insurance slug preserved |
| Dr James Chanaka | ONLINE | HotDoc CTA present |
| Dr Yamesha Ranatunga | ONLINE | HotDoc CTA present |

**CMS dependency (non-blocking for journey):** Golnar `practitioners.booking_url` remains `null` in staging DB. Presentation fallback supplies the approved HotDoc URL. Optional later CMS write can store that URL. Some Golnar FAQ/body prose in the published revision still mentions telephone-only booking; **primary CTAs are HotDoc** and govern patient action.

---

## I. Mobile, desktop and PWA results

| Check | Result |
| --- | --- |
| Desktop direct Golnar / James | PASS — correct profile |
| Mobile width 375 emulation on GP directory + profiles | PASS — directory + profile render |
| Tablet/desktop HTTP matrix | Covered by 15/15 curl matrix |
| Homepage / team / allied / manifest | 200 on repair tip |
| PWA manifest | 200 `/manifest.webmanifest` |
| Staging PWA | Not required to reproduce — failure is middleware 301 |

---

## J. Regression and build results

| Gate | Result |
| --- | --- |
| `npm run test:practitioner-routes` | **23/23 PASS** |
| `next build` (production) | **PASS** (Next 15.5.28; pre-existing lint warnings only) |
| `next lint` | Warnings only (pre-existing); no new errors from this change |
| `tsc --noEmit` | Pre-existing vitest/manifest typing noise unrelated to this repair |
| Full `npm test` | Practitioner route suite wired; not re-run in full this session after wire-up (focused suite green) |

---

## K. Exact safe corrective staging deployment procedure

**Do not execute until separate GO.**

1. Preserve current Hostinger app / rollback archive for `a8309db` / build `01a1c862-…`.
2. Commit incident worktree changes on `incident/p0-doctor-profiles-restore` (or cherry-pick onto release branch from `18f1f86` + inventory tests).
3. Push **only after approval** to the Hostinger RC branch used for staging.
4. Reconnect Hostinger Git auto-deploy **or** archive-deploy the approved SHA.
5. Poll `hosting_get-deployment` until build completed.
6. Bust staging public cache if durable HTML still shows old middleware behaviour.
7. Re-run live matrix: Golnar / James / Yamesha must be **200** with correct H1 (not directory).
8. Confirm Golnar directory + profile Book Appointment → approved HotDoc URL.
9. Confirm Mary remains phone-only; Tanya/James/Yamesha remain online.
10. Smoke homepage, GP directory, About/GP journey pages, PWA manifest.

**Rollback:** redeploy prior archive `a8309db` / `01a1c862-…` only if new build fails health — note that rollback **re-breaks** the three profiles.

---

## Protection checks (repair tip)

- Homepage 200
- GP directory 200 with CMS-injected trio linked
- Recruitment HOLD not touched
- Sprint 2 / PWA / CMS P0 code paths untouched beyond test wiring
- Gemunu remains unpublished → directory

---

## Non-negotiable acceptance (repair candidate)

**100% of intended published practitioner profile journeys work on the repair tip (15/15).**  
Staging remains broken until this tip is deployed under separate approval.
