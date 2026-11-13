# WMC — Phase B1 install improvements (staging)

**Date:** 2026-11-13  
**Verdict:** **PHASE B1 — STAGING VERIFIED**

## Scope

| ID | Change | Result |
| --- | --- | --- |
| B1-I1 | Host-aware installation QR (both staging hosts + production apex preserved) | **PASS** |
| B1-I2 | Install dismiss timestamp parity (ISO + epoch), 14-day cooldown preserved | **PASS** |
| B1-I3 | Honest Digital Reception copy + older-patient install help (code-only landing refine) | **PASS** |

Code-only release. No database, CMS publish, DNS, auth, or production changes.

## Deployed artifact

| Item | Value |
| --- | --- |
| Branch | `release/wmc-patient-app-visual-excellence` |
| Final Git SHA | `f6bba5ca0deea4ef70ebed64c64f35a9ca8d78dd` (`f6bba5c`) |
| Prior staging baseline | `2634ca2` / build `01a1d1f7-c5c2-736a-9772-1449b28a20e8` |
| Audit tip | `ab6da04` |
| Release ZIP | `wmc-patient-app-b1-install-f6bba5c.zip` |
| ZIP SHA-256 | `75209098782788BD08BAC4355C330426E9F6AF5C11B3C1446EE107B79F74C604` |
| Hostinger domain | `mediumslateblue-eagle-960503.hostingersite.com` (= `staging.gabbamedicalcentre.com.au`) |
| Hostinger build UUID | `01a1d23c-9930-73e9-ab56-2db7e486dfcf` |
| Build state | **completed** (2026-11-13T00:11:43Z) |
| Rollback ZIP | `wmc-patient-hub-ui-polish-2634ca2.zip` → rebuild `01a1d1f7-…` |

## Tests

| Suite | Result |
| --- | --- |
| B1 unit (`tsx --test` dismiss / prompt / handoff / landing / ios / android) | **32/32 PASS** |
| Local production `npm run build` (pre-archive) | **PASS** (prior gate) |
| Hostinger archive build `01a1d23c-…` | **completed** |
| `/api/health` both staging hosts | `{"ok":true,"database":"up"}` |

## QR destination verification (jsQR)

Decoded embedded matrices from live `patient-install-qr.js` (`v=wmc-patient-install-qr-20261113b`):

| Host | Decoded URL | Match | HTTP |
| --- | --- | --- | --- |
| `staging.gabbamedicalcentre.com.au` | `https://staging.gabbamedicalcentre.com.au/install-wmc-app.html?source=desktop-qr` | **PASS** | 200 |
| `mediumslateblue-eagle-960503.hostingersite.com` | `https://mediumslateblue-eagle-960503.hostingersite.com/install-wmc-app.html?source=desktop-qr` | **PASS** | 200 |
| `gabbamedicalcentre.com.au` (+ www → apex) | `https://gabbamedicalcentre.com.au/install-wmc-app.html?source=desktop-qr` | **PASS** (preserved) | apex still WordPress — not exercised for cutover |

Live handoff link text on each staging hostname resolves to that hostname (not WordPress apex).

## Cooldown verification

- Shared helpers accept ISO and digit-only epoch; 14-day window unchanged.
- Public runtimes (`patient-install-prompt.js`, `patient-install-android.js`, `patient-install-ios.js`) mirror parsers.
- Live prompt JS confirms epoch `/^\d+$/` + `Date.parse` path and 14-day constant.
- Browser check: recent ISO/epoch → cooldown active; aged past 14d → inactive.

Note: global floating tip SSR (`applyPatientInstallTip`) remains unwired in `public-ux` (pre-B1). Hub uses Android/iOS install panels + install card; dismiss cooldown for those paths is live.

## Installation guidance / accessibility

Both staging hosts on `/install-wmc-app.html`:

- Honest DR copy: “Find answers to common practice questions and the next step for your visit.”
- Unsupported “Message our team without waiting…” claim **absent**
- “Need help installing?” aside (`data-wmc-install-landing-b1="1"`, `aria-labelledby="wmc-install-help-title"`)
- Reception tel `(07) 3217 3344` / `tel:+61732173344`
- Clarifies Home Screen shortcut ≠ HotDoc store app
- Phase 3A jargon removed from benefits lead

Patient Hub: Preferred GP, HotDoc book path (`wp=w_lightbox` + widgets), Digital Reception launcher, iOS three-step guide + reception help — preserved.

## Visual / functional QA

| Surface | Hosts | Result |
| --- | --- | --- |
| Install landing (copy, help, host handoff URL) | both | **PASS** |
| Patient Hub (Preferred GP, actions, install card, dock) | staging.gabba | **PASS** |
| HotDoc lightbox wiring | both | **PASS** (assets + book CTA present) |
| Digital Reception opener | both | **PASS** |

## Rollback readiness

1. Re-upload `wmc-patient-hub-ui-polish-2634ca2.zip`
2. `hosting_nodejs_start-build` with same Node 22 / `apps/web` / archive options
3. Confirm health + install page reverts to pre-B1 copy/QR behaviour

## Remaining issues

None in-scope for Phase B1. Pre-existing: apex WordPress until cutover; floating install tip SSR not re-enabled (out of B1 scope).

**Final verdict: PHASE B1 — STAGING VERIFIED**
