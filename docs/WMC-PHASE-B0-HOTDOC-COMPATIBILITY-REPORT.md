# WMC Phase B0 — HotDoc Compatibility & Booking Strategy

**Date:** 13 November 2026  
**Branch:** `release/wmc-patient-app-visual-excellence`  
**Staging baseline (code):** `2634ca2b50a8d7a3d0caa1af206402f62401eaec`  
**Governance commit (pushed):** `9829f265bdb23846efaba6077a39495212be1379`  
**Scope:** Read-only assessment. **No** app code, CMS, database, Hostinger, DNS or production changes. **No** replacement booking system. Existing HotDoc URLs untouched.

> Maps to modular queue **B1 (HotDoc compatibility audit)** plus governance context from Task 1 / modular **B0**. Does not authorise B3 implementation.

---

## 1. Executive recommendation

**Retain the current official HotDoc Lightbox pathway** (practitioner / clinic URLs with `?wp=w_lightbox`, `data-hotdoc-button` + `data-hotdoc-widget="lightbox"`, `cdn.hotdoc.com.au/.../hotdoc-widgets.min.js`, plus `booking-resilience.js` external-tab + call fallback).

| Option | Verdict |
| --- | --- |
| Replace with WMC-owned booking / clinical API | **Rejected** — HotDoc remains SoT for availability, booking, confirm/cancel/reschedule and clinical-software sync |
| Force HotDoc **Frame** embed as primary in Patient Hub / PWA | **Not recommended** as default — higher CSP/cookie/focus risk in installed PWA; optional later only after account snippet + device proof |
| Force every book CTA to `target=_blank` only | **Not recommended** as sole path — discards working in-page lightbox where available |
| **Keep lightbox + resilience fallback + Mary phone-only** | **Recommended** — safest and best-performing with current evidence |

---

## 2. Current implementation inventory

### 2.1 Runtime stack (already live)

| Layer | Role | Key paths |
| --- | --- | --- |
| CMS `practitioner.bookingUrl` / published payload | Authoritative per-doctor HotDoc (or `tel:`) | Prisma / CMS publish |
| `practitioner-booking.ts` | Policy resolver; Mary never HotDoc; Golnar approved fallback | `apps/web/src/documents/practitioner-booking.ts` |
| `phone-only-booking.ts` + `site.js` alignPhoneOnlyChrome | Phone-only chrome (Mary) | Header / dock / TOC |
| `booking-restriction-notice.ts` | Insurance bulk-bill notices from HotDoc slug | `does-not-bulk-bill-for-insurance-patients` |
| Markup convention | `data-hotdoc-button` + `data-hotdoc-widget="lightbox"` + HotDoc href | Profiles, dock, Digital Reception, homepage |
| Official HotDoc script | `https://cdn.hotdoc.com.au/static/assets/js/hotdoc-widgets.min.js` | Injected on published pages (see homepage seed) |
| `booking-resilience.js` | If widget script fails / lightbox blocked → dialog: open HotDoc tab (strip `wp`) or `tel:+61732173344` | Focus trap + return focus |
| Clinic list URL | `…/t-medicals-woolloongabba-medical-centre/doctors?wp=w_lightbox` | Hub dock / clinic chrome |
| Patient Hub Book card | Plain `book-appointment.html` (no `wmc-book-appointment`) so HotDoc script does not `display:none` the card | `patient-hub-mobile-dashboard.ts` |
| Preferred GP | Device-local `wmc.preferredGp.v1`; Mary → tel; Golnar → approved HotDoc; others → profile | `patient-preferred-gp.ts` / `.js` |

Official HotDoc product options (Dashboard → Bookings → Widgets): **Lightbox** (button → popup) or **Frame** (embedded list). Account-generated snippets may personalise all vs one practitioner. Source: [HotDoc Support — install widget](https://support.hotdoc.com.au/hc/en-gb/articles/115003740263-How-can-I-install-the-HotDoc-Widget-on-my-website).

WMC already uses the **Lightbox pattern** via `wp=w_lightbox` URLs and HotDoc’s published `hotdoc-widgets.min.js` — consistent with official Lightbox, not a DIY booker.

### 2.2 Clinical software connection

HotDoc Online Bookings syncs into the practice appointment book / clinical workflow (HotDoc Sidebar for exceptions and patient matching). **WMC must not** scrape HotDoc, invent a parallel diary, or claim access to HotDoc patient IDs / message status without a separate contractual API. Preserving current HotDoc links preserves that clinical connection.

---

## 3. Practitioner booking matrix (preserve)

**Clinic reception (Mary / fallbacks):** `tel:+61732173344` (Trust Facts / TF-PHONE-02).

**Clinic HotDoc list:**  
`https://www.hotdoc.com.au/medical-centres/woolloongabba-QLD-4102/t-medicals-woolloongabba-medical-centre/doctors?wp=w_lightbox`

Evidence basis: `apps/web/reports/HOTDOC_LIVE_VERIFY_L1.json` / `old-html/qa/PRACTITIONER-HOTDOC-ROUTES.json` (HTTP verify 2026-10-26, 13/13 then including Gemunu). Preferred GP catalog = **15** published practitioners (Mary + Golnar + directory). **Do not invent or alter URLs in implementation.**

| Practitioner | Mode | Restriction / note | Booking destination (canonical pattern) |
| --- | --- | --- | --- |
| Dr Mary Abadir | **PHONE_ONLY** | No HotDoc deep-link; never fabricate | `tel:+61732173344` |
| Dr Golnar Mortezaei | ONLINE | Owner-authorised slug | `…/doctors/dr-golnar-mortezaei-5?wp=w_lightbox` |
| Dr Anand Singh | ONLINE | Insurance slug | `…/dr-anand-singh-does-not-bulk-bill-for-insurance-patients?wp=w_lightbox` |
| Dr Debra Larkins | ONLINE | Insurance slug | `…/dr-debra-larkins-does-not-bulk-bill-for-insurance-patients?wp=w_lightbox` |
| Dr Kooshyar Karimi | ONLINE | — | `…/dr-kooshyar-karimi-2?wp=w_lightbox` |
| Dr Nirupa Sivathasan | ONLINE | — | `…/dr-nirupa-sivathasan?wp=w_lightbox` |
| Dr Sambo Luon | ONLINE | Insurance slug | `…/dr-sambo-luon-does-not-bulk-bill-for-insurance-patients?wp=w_lightbox` |
| Dr Steven Chang | ONLINE | — | `…/dr-steven-chang-1?wp=w_lightbox` |
| Dr Sumita Singh | ONLINE | Insurance slug | `…/dr-sumita-singh-does-not-bulk-bill-for-insurance-patients?wp=w_lightbox` |
| Dr Tanya Goodwill | ONLINE | Insurance slug | `…/dr-tanya-goodwill-does-not-bulk-bill-for-insurance-patients?wp=w_lightbox` |
| Dr Usman Gul | ONLINE | Male-patients-only slug | `…/dr-usman-gul-strictly-seeing-male-patients-only?wp=w_lightbox` |
| Dr Wasantha Hettiarchchi | ONLINE | — | `…/dr-wasantha-hettiarachchi-1?wp=w_lightbox` |
| Dr James Chanaka | ONLINE | CMS path `doctors/dr-james.html` | Practitioner HotDoc from CMS (e.g. `dr-james-chanaka-1`) |
| Dr Yamesha Ranatunga | ONLINE | — | CMS practitioner HotDoc |
| Mr Samuel Stafford | ONLINE | Physiotherapist | `…/samuel-stafford-physiotherapist?wp=w_lightbox` |
| Dr Gemunu Ranawake | **Removed / 404 expected** | Historical L1 only — do not restore without owner ask | n/a on current public set |

Insurance notices: presentation derives from slug containing `does-not-bulk-bill-for-insurance-patients` — do not invent notices for other paths.

---

## 4. Supported / not supported / needs confirmation

| Capability | Status | Notes |
| --- | --- | --- |
| HotDoc as appointment SoT (book / confirm / cancel / reschedule) | **Supported** | Product + practice policy; do not replace |
| Clinical software sync via HotDoc | **Supported** (HotDoc-side) | Preserve; no WMC shadow diary |
| Official Lightbox widget (button → popup) | **Supported** (product) | Documented in HotDoc Dashboard Widgets |
| WMC current lightbox URLs + `hotdoc-widgets.min.js` | **Supported** (in repo / staging) | Matches Lightbox pattern |
| Official Frame widget (inline embed) | **Supported** (product) | Optional; not primary for PWA without proof |
| Practitioner-scoped widgets (one doctor) | **Supported** (product) | Aligns with per-profile deep-links |
| All-practitioners clinic list widget | **Supported** | Clinic `…/doctors?wp=w_lightbox` |
| Mary phone-only policy | **Supported** (enforced in code) | `PHONE_ONLY` / tel chrome |
| Insurance / gender restriction **slugs** on HotDoc | **Supported** | Leave slug text as HotDoc-authored |
| External HotDoc tab fallback | **Supported** | `booking-resilience.js` strips `wp`, opens secure tab |
| Call reception fallback | **Supported** | `tel:+61732173344` |
| DIY Best Practice / clinical API booking | **Not supported** | Out of scope; clinical risk |
| Scraping HotDoc / reverse-engineering private APIs | **Not supported** | Forbidden |
| Claiming WMC can read HotDoc patient IDs / reminders / inbox | **Not supported** | Needs separate contract if ever |
| Replacing Preferred GP with authenticated identity | **Not supported** (this phase) | Device-local only |
| Account-specific Dashboard widget HTML vs current markup parity | **Needs confirmation** | Requires HotDoc Dashboard login / support |
| Lightbox reliability inside **installed** iOS/Android PWA | **Needs confirmation** | Physical device matrix; cookies / popup / WebView |
| Return-to-app after HotDoc auth / payment / deep flows | **Needs confirmation** | Device + OS browser handoff |
| Frame widget on `book-appointment.html` in PWA | **Needs confirmation** | CSP, iframe, focus, safe-area vs dock |
| Re-verify all 15 live HotDoc HTTP URLs post-Golnar / Gemunu removal | **Needs confirmation** | Refresh L1 against staging tip `2634ca2` |
| HotDoc support permission for custom domains / staging hosts | **Needs confirmation** | Ask HotDoc if lightbox blocked on Hostinger staging hostnames |

---

## 5. PWA, mobile, desktop, a11y, return-to-app

| Context | Assessment |
| --- | --- |
| Mobile browser | Lightbox intended; resilience opens HotDoc tab if script/lightbox fails |
| Desktop browser | Same; clinic + practitioner CTAs |
| Installed PWA | **Risk:** third-party script / iframe / storage may behave differently than Safari/Chrome tabs; hub deliberately avoids HotDoc-hidden classes on Book card |
| Accessibility | Recovery dialog is modal with focus trap, Escape, labelled title; known watch: recovery markup can appear in a11y trees when hidden; Mary chrome must stay phone-first |
| Return-to-app | In-page lightbox best for staying on origin; external tab may leave PWA shell — acceptable fallback, not ideal primary |
| Digital Reception | Closes before recovery dialog; journey book links use same HotDoc attrs |
| Dock vs lightbox | Dock steps aside while booking journey / Digital Reception open (`booking-journey-held`) |

**Do not create appointments** during verification — browse to availability UI only.

---

## 6. Embed vs external links (comparison)

| Approach | Pros | Cons | Role |
| --- | --- | --- | --- |
| **Lightbox (current)** | Official; stays on site; practitioner deep-links; already wired + resilience | Depends on HotDoc script/CDN; PWA quirks unknown until device test | **Primary** |
| **Frame embed** | Availability visible inline on a booking page | CSP/iframe; focus; may fight Patient Hub dock/safe-area; account snippet required | Optional secondary after confirmation |
| **External HotDoc link** (no `wp` / new tab) | Most reliable when widget blocked; works if CDN filtered | Leaves site/PWA; weaker “in-app” feel | **Required fallback** (already present) |
| **Phone** | Required for Mary; universal fallback | Not online self-serve | Policy + recovery |

---

## 7. Recommended architecture (strategy)

```
Patient surfaces (site / Patient Hub / PWA / Digital Reception)
        │
        ├─ Mary (and phone-only chrome) ──► tel:+61732173344
        │
        ├─ Online practitioners / clinic Book
        │       │
        │       ├─ PRIMARY: HotDoc Lightbox
        │       │     href = CMS/approved HotDoc URL + ?wp=w_lightbox
        │       │     attrs = data-hotdoc-button + data-hotdoc-widget="lightbox"
        │       │     script = cdn.hotdoc.com.au/.../hotdoc-widgets.min.js
        │       │
        │       └─ FALLBACK (booking-resilience): HotDoc https tab (no wp) OR Call
        │
        └─ HotDoc owns diary ↔ clinical software (unchanged)
```

**Hard rules for all future Phase B work**

1. Do not alter existing approved HotDoc booking URLs without owner + CMS authority.  
2. Do not invent Mary HotDoc links.  
3. Do not build a WMC appointment store.  
4. Prefer progressive enhancement over Frame-first redesign.  
5. Re-test insurance / Usman / Golnar / Mary policies after any booking presentation change.

---

## 8. Modular Phase B1 implementation plan

> Naming: this document is **Phase B0 HotDoc assessment** per owner prompt. Code/prototype work remains **modular B3** only after owner approval. The steps below are the **next HotDoc work package** (modular B1 close-out + B3 prep).

### B1-A — Account truth (owner / HotDoc support) — READ-ONLY

1. Log into HotDoc Dashboard → Bookings → Widgets.  
2. Export Lightbox snippets for **all practitioners** and for **each online doctor** (exclude Mary).  
3. Compare generated URLs/slugs to CMS `bookingUrl` and L1 matrix; record diffs only (no silent rewrite).  
4. Ask HotDoc Support: Lightbox support on installed PWAs / iOS Home Screen; staging hostname allowlisting; recommended Frame vs Lightbox for PWAs.

### B1-B — Staging URL re-verify — READ-ONLY

1. HTTP GET each online practitioner HotDoc URL + clinic list (expect 200, slug retained).  
2. Confirm Mary profile CTAs remain `tel:` on both staging hosts.  
3. Confirm Gemunu remains unpublished/404 as intended.  
4. Produce updated evidence JSON under `docs/phase4a-evidence/` or `apps/web/reports/` (docs only unless code authorised).

### B1-C — Device matrix (no live booking) — READ-ONLY QA

Surfaces: homepage Book, practitioner profile, Patient Hub dock, Preferred GP (Golnar + Mary), Digital Reception journey book, recovery dialog (simulate CDN block).

Devices: Android Chrome browser + installed PWA; iPhone Safari + Add to Home Screen; desktop Chrome/Edge.

Record: lightbox opens Y/N; focus; scroll lock vs dock; return path; external fallback; VoiceOver/TalkBack smoke.

### B1-D — Decision gate (owner)

| Outcome | Action |
| --- | --- |
| Lightbox OK on PWA + Dashboard URLs match | **Adopt strategy §7**; skip Frame; optional copy/UX only under B2/B3 |
| Lightbox fails on installed PWA only | Keep links; prefer resilience external tab in PWA; document; do not invent new booker |
| Dashboard URLs diverge from CMS | Scoped CMS correction request (separate approval) — still no DIY system |
| Frame desired for `book-appointment.html` | Separate design + CSP + a11y spike before B3 |

### B3 (later, conditional code-only) — only if owner approves

- Presentation polish only (labels, hub discovery, install funnel) without changing HotDoc hrefs.  
- Optionally inject account-issued widget snippet **if** proven equivalent and safer.  
- Never remove resilience fallback.  
- Full regression: 15 profiles, Mary, insurance notices, Digital Reception, hub Book card visibility, build/tests, staging SHA + rollback.

### Explicitly out of B1/B3

- Notifications / push / inbox / Patient Engagement Admin (B4+)  
- Verified patient identity messaging  
- Production DNS cutover  

---

## 9. Task 1 — GitHub sync (completed this session)

| Check | Result |
| --- | --- |
| Governance commit contents | Docs, Cursor rules, staging evidence, verify scripts only — **no** app runtime / SQL scratch / secrets |
| Push | `git push` `2634ca2..9829f26` → `origin/release/wmc-patient-app-visual-excellence` (no force, no merge, no deploy) |
| Staging code tip | Remains `2634ca2` |

---

## 10. Files inspected (non-exhaustive)

- `docs/WMC-PATIENT-APP-MASTER-ROADMAP.md`, `docs/WMC-PHASE-B-MODULAR-TASKS.md`, `PROJECT_SPEC.md`  
- `apps/web/src/documents/practitioner-booking.ts`, `phone-only-booking.ts`, `patient-preferred-gp.ts`, `patient-hub-mobile-dashboard.ts`, `booking-restriction-notice.ts`, `public-ux.ts`  
- `apps/web/public/site.js`, `booking-resilience.js`, `patient-preferred-gp.js`, `digital-reception.js`  
- `apps/web/reports/HOTDOC_LIVE_VERIFY_L1.json`, `old-html/qa/PRACTITIONER-HOTDOC-ROUTES.json`  
- `docs/WMC-POST-PWA-HOTDOC-INTEGRATION-REPORT.md`  
- HotDoc Support: widget install + Getting Started with Online Bookings  

---

## 11. Limitations (honest)

- No HotDoc Dashboard login in this agent session → account widget HTML parity **unconfirmed**.  
- No physical installed-PWA booking walkthrough in this session.  
- L1 HTTP matrix is dated 2026-10-26 and includes historical Gemunu; Golnar online path needs fresh confirm on current staging tip.  
- No appointments were created (correct).  

These gaps refine B1-A/B/C evidence; they do **not** overturn the architecture recommendation in §7.

---

## Verdict

**PHASE B0 COMPLETE — HOTDOC INTEGRATION STRATEGY READY**

Next owner action: run **B1-A** (HotDoc Dashboard / support) and **B1-C** (physical PWA matrix), then approve or defer modular **B3**. Do not start notification / DB work from this report.
