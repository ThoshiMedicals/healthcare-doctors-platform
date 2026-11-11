# WMC Agent B — Dr Golnar HotDoc Online Booking

**Branch:** `feature/wmc-golnar-hotdoc`  
**Baseline:** `a8309dbcd2b1458f5228d50ff4f9bc48b5d8e625`  
**Worktree:** `WMC-golnar-hotdoc`  
**Status:** READY FOR INTEGRATION  
**Date:** 2026-11-11

## Verdict

Dr Golnar Mortezaei is treated as **ONLINE HotDoc** (not phone-only). Presentation prefers CMS practitioner `bookingUrl` when it is a practitioner-specific HotDoc link; otherwise it uses the owner-authorised fallback URL. Mary Abadir phone-only protections are unchanged. Staging DB was not written.

## Source of truth

| Layer | Role |
| --- | --- |
| CMS `practitioner.bookingUrl` / `publishedPayload.bookingUrl` | Preferred when it is a **practitioner-specific** HotDoc URL (`…/doctors/<slug>?wp=w_lightbox`) |
| `GOLNAR_APPROVED_HOTDOC_URL` in `apps/web/src/documents/practitioner-booking.ts` | Owner-authorised fallback when CMS is null, `tel:`, or **clinic-level** HotDoc (`…/doctors?wp=…`) |
| Golden HTML / stored revisions | Not rewritten in DB; presentation upgrades Golnar profile + welcome chrome at render/UX time |

**Authorised URL:**

```text
https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/doctors/dr-golnar-mortezaei-5?wp=w_lightbox
```

## Changes

1. **Stopped Golnar welcome phone-only force** — `alignPhoneOnlyPractitionerChrome` no longer special-cases `updates/welcome-dr-golnar-mortezaei.html`. Phone-only chrome applies only when a doctor profile primary CTA is `tel:` (Mary and any true phone-only profile).
2. **Added Golnar online booking presentation** — `alignGolnarOnlineBookingChrome` upgrades `tel:` / clinic-level HotDoc book controls on Golnar profile + welcome to the resolved practitioner URL with widget attrs.
3. **CMS-aware resolution** — `resolvePractitionerBookingHref` used by welcome booking lookup, directory inject, and render path.
4. **Welcome authority links** — Golnar default `bookingHref` is the authorised HotDoc URL (CMS override still preferred when passed).
5. **Onboard script** — `onboard-practitioners-golnar-james.mjs` now seeds Golnar with the authorised HotDoc URL for future local republish (does not touch staging DB).
6. **Cache-bust tokens** — `site.js` / `updates-data.js` query tokens bumped to `wmc-golnar-hotdoc-online-20261111a`.

## CMS dependency (operator — staging)

Presentation works **without** a staging DB write via the approved fallback. For durable CMS parity, operators should:

1. Open Admin → Practitioners → **Dr Golnar Mortezaei**.
2. Set **HotDoc booking link** (`bookingUrl`) to the authorised URL above (must keep `wp=w_lightbox`).
3. Publish the practitioner (and welcome update if prose still says phone-only).
4. Confirm live profile primary CTA, sticky dock, directory card, and PWA quick-nav Book all deep-link to `dr-golnar-mortezaei-5` (not clinic `/doctors?wp=`).
5. Optional: update welcome article / `updates-data.js` Booking Appointments copy to the James-style online wording once CMS content is republished (golden `old-html/` left untouched).

## Five-practitioner matrix verification

| Practitioner | Mode | Verification |
| --- | --- | --- |
| Golnar | ONLINE HotDoc (authorised URL / CMS) | Unit: resolve + chrome upgrade; welcome inject HotDoc; public-ux a11y |
| Mary Abadir | PHONE_ONLY `tel:` | Unit: phone-only chrome; PWA Call shortcut; insurance notice absent |
| Tanya Goodwill | ONLINE HotDoc (insurance slug preserved) | Untouched; booking-restriction tests still pass |
| James Chanaka | ONLINE HotDoc | Untouched; welcome HotDoc override test still passes |
| Yamesha Ranatunga | ONLINE HotDoc | Untouched; directory/service inject tests still pass |

Focused suite run: **57 pass / 0 fail** (`phone-only-booking`, `practitioner-booking`, `inject-cms-updates`, `package-a-a11y-smoke`, `public-ux`, `patient-pwa-nav`, `inject-cms-practitioners`, `booking-restriction-notice`).

## HotDoc widget notes

Book controls use the existing site pattern (do **not** double-load `hotdoc-widgets.min.js`):

- `href` = authorised / CMS practitioner URL  
- `data-hotdoc-widget="lightbox"`  
- `data-hotdoc-button=""`  
- `target="_blank"` `rel="noopener noreferrer"`  
- Visible label: **Book Appointment**

PWA quick-nav continues to mirror the sticky `.persistent-care-book` dock verbatim after chrome alignment.

## File list

| File | Change |
| --- | --- |
| `apps/web/src/documents/practitioner-booking.ts` | **New** — matrix, resolver, Golnar chrome align |
| `apps/web/src/documents/practitioner-booking.test.ts` | **New** — matrix + Golnar/Mary regressions |
| `apps/web/src/documents/phone-only-booking.ts` | Remove Golnar welcome force; re-export path helper |
| `apps/web/src/documents/phone-only-booking.test.ts` | Updated expectations |
| `apps/web/src/documents/inject-cms-updates.ts` | Golnar welcome default HotDoc + widget attrs |
| `apps/web/src/documents/inject-cms-updates.test.ts` | Expect HotDoc, not tel |
| `apps/web/src/documents/inject-cms-practitioners.ts` | Resolve Golnar booking for directory cards |
| `apps/web/src/documents/render-published-document.ts` | CMS resolve + Golnar chrome at render |
| `apps/web/src/documents/public-ux.ts` | Golnar online align before phone-only; cache bust |
| `apps/web/src/documents/public-ux.test.ts` | Cache-bust token |
| `apps/web/src/documents/package-a-a11y-smoke.test.ts` | Online HotDoc a11y expectations |
| `apps/web/scripts/onboard-practitioners-golnar-james.mjs` | Golnar `bookingUrl` = authorised HotDoc |
| `docs/WMC-GOLNAR-HOTDOC-AGENT-B-REPORT.md` | This report |

## Explicit non-changes

- No staging DB writes / no deploy / no push  
- No edits to other practitioners’ booking URLs  
- No golden `old-html/` edits  
- No SW caching expansion  
- No journey-nav / PWA security file changes beyond booking CTA mirroring via existing public-ux path
