# WMC Patient App Phase 4A-B — Device Validation Checklist

| Field | Value |
| --- | --- |
| Phase | **4A-B** — Acceptance preparation (docs only) |
| Branch | `feat/wmc-phase4ab-checklist` |
| Base tip | `269df5a` (Phase 4A-A recovery acceptance pack) |
| Feature code tip | `673c499` (Phase 3D COMPLETE) |
| Scope | Operator checklists for **Android**, **iPhone**, and **Desktop** |
| Push / deploy | **Not performed** |

**Authority:** [`WMC-PHASE4A-ARCHITECTURE-LOCK.md`](./WMC-PHASE4A-ARCHITECTURE-LOCK.md) · [`WMC-PHASE4A-A-RECOVERY-ACCEPTANCE.md`](./WMC-PHASE4A-A-RECOVERY-ACCEPTANCE.md) · Trust Facts SSOT [`WMC-TRUST-FACTS-REGISTER.md`](./WMC-TRUST-FACTS-REGISTER.md).

**Companion script:** [`WMC-PHASE4AB-ACCEPTANCE-TEST-SCRIPT.md`](./WMC-PHASE4AB-ACCEPTANCE-TEST-SCRIPT.md).

---

## Purpose

Prepare physical-device and desktop validation before Patient App closure. This document is a **pass/fail checklist** only — no feature work.

**Full production acceptance still requires T3 physical evidence** (Chrome Android, Samsung Internet, iOS Safari + standalone). Emulated or desktop Chromium captures alone do **not** clear T3.

---

## Preconditions (all platforms)

Record before starting:

| Item | Value / notes |
| --- | --- |
| Date | |
| Operator | |
| Origin under test | e.g. `https://next.gabbamedicalcentre.com.au` or Hostinger tip deploy |
| Git / deploy SHA | Must include Patient Hub + Phase 3B–3D scripts |
| Health | `/api/health` OK; `patient-hub.html` **200** (not 404) |
| Evidence folder | `docs/phase4a-evidence/` (or dated subfolder) |

**Blocked if:** hub 404, install/share scripts 404, origin 502, or tip predates Patient App inventory.

**Legend:** ☐ Pass · ☐ Fail · ☐ N/A · ☐ Blocked

---

## Shared surfaces (verify on every platform)

| # | Surface | Pass criteria |
| --- | --- | --- |
| S1 | **Install flow** | Platform-appropriate install guidance works; dismiss cooldown honest; no false “installed” claims |
| S2 | **App icon** | Home-screen / installed icon launches Patient Hub (or documented start URL); branding recognizable |
| S3 | **Dashboard** | `patient-hub.html` primary grid: Book, Preferred GP, Digital Reception, Call; practice strip visible |
| S4 | **Preferred GP** | Select / change / remove; persists via `localStorage` `wmc.preferredGp.v1` across reload |
| S5 | **Booking actions** | General Book → clinic booking path; Mary → phone-only (`tel:`); insurance GPs keep HotDoc insurance slug notices; Usman path unchanged |
| S6 | **Practice Information** | Practice Information Hub cards + Trust Facts strip (phone, address, hours, after-hours **134 100**) |
| S7 | **Digital Reception** | Hub tile / shortcut opens Digital Reception search panel |
| S8 | **Share** | Share CTAs on doctor / service / knowledge / practice; Web Share or copy-link fallback; phone share uses Trust Facts number only |

---

## A. Android validation checklist

**Browsers:** Chrome Android · Samsung Internet (both required for T3 Android PASS).

**Devices:** _________________ (model / OS)

### A1 — Install flow

| Step | Check | Result |
| --- | --- | --- |
| A1.1 | Open `patient-hub.html` or `install-wmc-app.html` in **Chrome Android** | ☐ |
| A1.2 | Install tip / soft card visible when eligible (not Firefox/Edge/Opera/WebView) | ☐ |
| A1.3 | Browser install / Add to Home Screen completes without error | ☐ |
| A1.4 | **Not now** / dismiss hides tip; does not reappear within **14-day** cooldown | ☐ |
| A1.5 | Repeat install eligibility smoke in **Samsung Internet** | ☐ |

### A2 — App icon

| Step | Check | Result |
| --- | --- | --- |
| A2.1 | Home-screen icon present with WMC branding | ☐ |
| A2.2 | Launch opens hub / `start_url` with PWA context (`?source=pwa` or standalone) | ☐ |
| A2.3 | Standalone chrome: no unexpected browser UI; quicknav usable if present | ☐ |

### A3 — Dashboard

| Step | Check | Result |
| --- | --- | --- |
| A3.1 | Hub loads; primary actions reachable without horizontal overflow issues | ☐ |
| A3.2 | Practice strip: clinic name, address, phone `tel:+61732173344` / display match Trust Facts | ☐ |
| A3.3 | After-hours reference to Hello Home Doctor **134 100** (or linked after-hours page) | ☐ |

### A4 — Preferred GP

| Step | Check | Result |
| --- | --- | --- |
| A4.1 | Open Preferred GP panel; catalog lists approved GPs | ☐ |
| A4.2 | Select a GP; selection survives **reload** and **re-open from icon** | ☐ |
| A4.3 | Change / Remove updates UI and storage | ☐ |
| A4.4 | Mary: booking CTA is **phone-only** (no HotDoc book) | ☐ |

### A5 — Booking actions

| Step | Check | Result |
| --- | --- | --- |
| A5.1 | Book Appointment hub shortcut opens expected booking destination | ☐ |
| A5.2 | Insurance-slug GP profile (e.g. Tanya / Debra path): insurance notice present; slug not invented | ☐ |
| A5.3 | Usman restriction path unchanged (not insurance injector) | ☐ |

### A6 — Practice Information

| Step | Check | Result |
| --- | --- | --- |
| A6.1 | Open Practice Information Hub from hub / nav | ☐ |
| A6.2 | Nine Trust Facts–aligned section cards navigate to existing routes | ☐ |
| A6.3 | Contact / hours / after-hours facts match register (no invented fees) | ☐ |

### A7 — Digital Reception

| Step | Check | Result |
| --- | --- | --- |
| A7.1 | Hub Digital Reception tile opens search panel | ☐ |
| A7.2 | Search / select behaviour usable on touch; close returns to hub | ☐ |

### A8 — Share functionality

| Step | Check | Result |
| --- | --- | --- |
| A8.1 | Doctor profile: Share opens system sheet or copy fallback | ☐ |
| A8.2 | Service / knowledge / practice share mounts where expected | ☐ |
| A8.3 | Share phone uses Trust Facts clinic number only | ☐ |
| A8.4 | Abort / dismiss share does not break page | ☐ |

### Android sign-off

| Field | Value |
| --- | --- |
| Chrome Android | ☐ Pass · ☐ Fail · ☐ Blocked |
| Samsung Internet | ☐ Pass · ☐ Fail · ☐ Blocked |
| Evidence paths | |
| Notes | |
| Operator / date | |

---

## B. iPhone validation checklist

**Browser:** **Safari** only for install / A2HS. Do not certify install via Chrome iOS / in-app browsers.

**Device:** _________________ (model / iOS)

### B1 — Install flow

| Step | Check | Result |
| --- | --- | --- |
| B1.1 | Open hub in **Safari**; iOS install panel (`#wmc-ios-install` or equivalent) visible when eligible | ☐ |
| B1.2 | Copy states Safari has **no automatic install button**; steps for Share → Add to Home Screen are readable | ☐ |
| B1.3 | Complete Add to Home Screen | ☐ |
| B1.4 | **Not now** hides guidance for **14-day** cooldown | ☐ |
| B1.5 | Install panel **hidden** when already standalone | ☐ |
| B1.6 | Chrome iOS: install panel intentionally **not** shown (users directed to Safari) | ☐ |

### B2 — App icon

| Step | Check | Result |
| --- | --- | --- |
| B2.1 | Home-screen icon present | ☐ |
| B2.2 | Launch opens standalone web app → Patient Hub | ☐ |
| B2.3 | Safe-area / notch: install remnants and sticky docks do not obscure primary actions | ☐ |
| B2.4 | Standalone quicknav (Book / DR / Call) visible and functional | ☐ |

### B3 — Dashboard

| Step | Check | Result |
| --- | --- | --- |
| B3.1 | Hub primary grid usable in Safari tab and standalone | ☐ |
| B3.2 | Trust Facts practice strip correct (phone, address, hours) | ☐ |

### B4 — Preferred GP

| Step | Check | Result |
| --- | --- | --- |
| B4.1 | Select GP; persists after Safari reload | ☐ |
| B4.2 | Persists after kill + relaunch from home-screen icon | ☐ |
| B4.3 | Mary phone-only CTA; Golnar / ONLINE GPs keep approved HotDoc behaviour | ☐ |

### B5 — Booking actions

| Step | Check | Result |
| --- | --- | --- |
| B5.1 | Hub Book shortcut works in Safari and standalone | ☐ |
| B5.2 | Insurance notices on restricted GP profiles preserved | ☐ |
| B5.3 | Mary never offers HotDoc book from Preferred GP / hub policy path | ☐ |

### B6 — Practice Information

| Step | Check | Result |
| --- | --- | --- |
| B6.1 | Practice Information Hub loads; section cards work | ☐ |
| B6.2 | Trust Facts strip / after-hours **134 100** present and accurate | ☐ |

### B7 — Digital Reception

| Step | Check | Result |
| --- | --- | --- |
| B7.1 | Hub tile opens Digital Reception | ☐ |
| B7.2 | Standalone quicknav DR proxy opens same panel | ☐ |

### B8 — Share functionality

| Step | Check | Result |
| --- | --- | --- |
| B8.1 | Native Web Share sheet on doctor profile in Safari | ☐ |
| B8.2 | Clipboard / copy-link fallback if share dismissed or unavailable | ☐ |
| B8.3 | Practice “Share phone” = Trust Facts number only | ☐ |

### iPhone sign-off

| Field | Value |
| --- | --- |
| Safari tab | ☐ Pass · ☐ Fail · ☐ Blocked |
| Standalone PWA | ☐ Pass · ☐ Fail · ☐ Blocked |
| Evidence paths | |
| Notes | |
| Operator / date | |

---

## C. Desktop validation checklist

**Browsers:** Current Chromium and/or Firefox/Edge as available. Desktop does **not** replace T3 mobile PASS.

**Machine:** _________________

### C1 — Install flow (desktop QR / landing)

| Step | Check | Result |
| --- | --- | --- |
| C1.1 | Open `/install-wmc-app.html` | ☐ |
| C1.2 | Desktop QR / “continue on phone” section visible and scannable | ☐ |
| C1.3 | QR (or `?source=desktop-qr`) opens install landing on phone | ☐ |
| C1.4 | Desktop does not claim native install where unsupported | ☐ |

### C2 — App icon

| Step | Check | Result |
| --- | --- | --- |
| C2.1 | If browser supports install (e.g. Chrome desktop PWA): optional install still lands on hub | ☐ |
| C2.2 | If not supported: no broken install CTA; phone path remains clear | ☐ N/A allowed |

### C3 — Dashboard

| Step | Check | Result |
| --- | --- | --- |
| C3.1 | `patient-hub.html` loads; primary actions work with mouse/keyboard | ☐ |
| C3.2 | Practice strip Trust Facts match register | ☐ |
| C3.3 | Layout readable at ~1280px and ~1440px widths | ☐ |

### C4 — Preferred GP

| Step | Check | Result |
| --- | --- | --- |
| C4.1 | Select / change / remove GP | ☐ |
| C4.2 | Persistence across reload (`wmc.preferredGp.v1`) | ☐ |
| C4.3 | Mary phone-only; insurance / Usman policies unchanged when opening GP paths | ☐ |

### C5 — Booking actions

| Step | Check | Result |
| --- | --- | --- |
| C5.1 | Book Appointment from hub | ☐ |
| C5.2 | Spot-check Tanya or Debra insurance-slug profile → notice present | ☐ |
| C5.3 | Spot-check Mary profile / Preferred GP → `tel:` only | ☐ |

### C6 — Practice Information

| Step | Check | Result |
| --- | --- | --- |
| C6.1 | Practice Information Hub + nine cards | ☐ |
| C6.2 | Hours / phone / after-hours **134 100** accurate | ☐ |

### C7 — Digital Reception

| Step | Check | Result |
| --- | --- | --- |
| C7.1 | Open from hub; panel usable; close cleanly | ☐ |

### C8 — Share functionality

| Step | Check | Result |
| --- | --- | --- |
| C8.1 | Doctor / practice share: copy-link or share path works on desktop | ☐ |
| C8.2 | No invented fee text in share payloads | ☐ |

### Desktop sign-off

| Field | Value |
| --- | --- |
| Overall desktop | ☐ Pass · ☐ Fail · ☐ Blocked |
| Evidence paths | |
| Notes | |
| Operator / date | |

---

## Roll-up (Phase 4A-B device checklist)

| Platform | Install | Icon | Dashboard | Preferred GP | Booking | Practice Info | Digital Reception | Share | Overall |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Android Chrome | | | | | | | | | |
| Android Samsung | | | | | | | | | |
| iPhone Safari | | | | | | | | | |
| iPhone standalone | | | | | | | | | |
| Desktop | | | | | | | | | |

**Reminder:** Mark Phase 4A **device acceptance** only when **T3 physical** Android + iPhone rows are Pass with dated evidence. Desktop Pass alone is insufficient for full production acceptance.

**Related:** Android report [`WMC-PHASE4A-ANDROID-VALIDATION.md`](./WMC-PHASE4A-ANDROID-VALIDATION.md) · iPhone [`WMC-PHASE4A-IPHONE-VALIDATION.md`](./WMC-PHASE4A-IPHONE-VALIDATION.md) · Recovery [`WMC-PHASE4A-A-RECOVERY-ACCEPTANCE.md`](./WMC-PHASE4A-A-RECOVERY-ACCEPTANCE.md).
