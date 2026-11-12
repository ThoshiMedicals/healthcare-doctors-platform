# WMC Patient App Phase 4A-B — Acceptance Test Script

| Field | Value |
| --- | --- |
| Phase | **4A-B** — Acceptance preparation (docs only) |
| Branch | `feat/wmc-phase4ab-checklist` |
| Base tip | `269df5a` |
| Feature code tip | `673c499` (Phases 3A–3D) |
| Audience | Operator running physical devices + desktop |
| Companion checklist | [`WMC-PHASE4AB-DEVICE-VALIDATION-CHECKLIST.md`](./WMC-PHASE4AB-DEVICE-VALIDATION-CHECKLIST.md) |
| Push / deploy | **Not performed** |

---

## Important acceptance gate

| Gate | Requirement |
| --- | --- |
| T1 automated | Already evidenced in Phase 4A / 4A-A packs (contract suites green on tip) |
| T2 live origin | Hub and Phase 3B–3D assets reachable on UAT/`next.` or tip-matched staging |
| **T3 physical** | **Still required for full production acceptance** — Chrome Android, Samsung Internet, iOS Safari + standalone home-screen launch with dated screenshots/notes |

This script is the **operator runbook**. Completing desktop-only steps does **not** clear T3. Do not claim PATIENT APP ACCEPTED for production until T3 evidence is filed.

Trust Facts SSOT: [`WMC-TRUST-FACTS-REGISTER.md`](./WMC-TRUST-FACTS-REGISTER.md). Booking policy references: [`WMC-PHASE3A-BOOKING-VERIFICATION.md`](./WMC-PHASE3A-BOOKING-VERIFICATION.md).

---

## 0. Session setup

### 0.1 Record header

| Field | Value |
| --- | --- |
| Operator | |
| Date / time (AEST) | |
| Origin URL | |
| Deploy / git SHA | |
| Devices | Android: ____ · iPhone: ____ · Desktop: ____ |
| Evidence destination | `docs/phase4a-evidence/` (dated subfolder recommended) |

### 0.2 Environment smoke (must Pass before device script)

| # | Action | Pass criteria | Result |
| --- | --- | --- | --- |
| 0.2.1 | `GET /api/health` | Healthy / database up | ☐ |
| 0.2.2 | `GET /patient-hub.html` | **200**, hub dashboard HTML | ☐ |
| 0.2.3 | `GET /patient-information.html` (or Practice Info Hub route in use) | **200**, practice hub content | ☐ |
| 0.2.4 | `GET /install-wmc-app.html` | **200**, install + desktop QR section | ☐ |
| 0.2.5 | `GET /manifest.webmanifest` | `start_url` includes `/patient-hub.html` (+ `source=pwa`) | ☐ |
| 0.2.6 | Spot `GET /wmc-cache/patient-share.js` (and install scripts as applicable) | **200** (not 404) | ☐ |

**Stop if any of 0.2.1–0.2.6 Fail** — restore UAT (`uat:build` / `uat` + Postgres) or tip-matched deploy before continuing. See Phase 4A-A recovery docs.

### 0.3 Recommended URL crib

| Surface | Path |
| --- | --- |
| Patient Hub | `/patient-hub.html` |
| Install landing | `/install-wmc-app.html` |
| Practice Information | Practice Information Hub route (hub link or `/patient-information.html`) |
| Sample doctor (share) | Any live team doctor profile with share mount |
| Insurance notice sample | Tanya or Debra HotDoc insurance-slug profile |
| Mary phone-only | Mary Abadir profile / Preferred GP entry `dr-mary-abadir` |
| After-hours | Hub strip link / `after-hours-care.html` |

---

## 1. Desktop acceptance script

Run first for fast regression; then repeat critical paths on phones.

### 1.1 Dashboard

| # | Steps | Pass criteria | Result |
| --- | --- | --- | --- |
| D-01 | Open `/patient-hub.html` | Primary actions: Book, Preferred GP, Digital Reception, Call Reception | ☐ |
| D-02 | Read `#practice-info-strip` (or equivalent) | Clinic name, **468 Vulture St** (or Trust Facts address), phone display / `tel:+61732173344` | ☐ |
| D-03 | Check after-hours line | Hello Home Doctor **134 100** or linked after-hours page | ☐ |
| D-04 | Screenshot hub | Saved to evidence folder | ☐ |

### 1.2 Preferred GP persistence

| # | Steps | Pass criteria | Result |
| --- | --- | --- | --- |
| D-10 | Open Preferred GP panel | Catalog loads | ☐ |
| D-11 | Select a non-Mary GP; note name | UI shows selection | ☐ |
| D-12 | Hard reload page | Same GP still selected | ☐ |
| D-13 | DevTools → Application → Local Storage → key `wmc.preferredGp.v1` | Key present; payload matches selection | ☐ |
| D-14 | Change GP, then Remove | UI and storage update / clear | ☐ |
| D-15 | Screenshot Preferred GP panel | Evidence saved | ☐ |

### 1.3 Booking policy preservation

| # | Steps | Pass criteria | Result |
| --- | --- | --- | --- |
| D-20 | From hub, open Book Appointment | Lands on clinic booking path (not a fabricated HotDoc) | ☐ |
| D-21 | Preferred GP → **Mary Abadir** → book / call CTA | **Phone-only** `tel:+61732173344` (or Trust Facts tel); **no** HotDoc book button | ☐ |
| D-22 | Open Tanya or Debra profile with insurance HotDoc slug | Notice for insurance / non-bulk-bill path present; slug contains `does-not-bulk-bill-for-insurance-patients` | ☐ |
| D-23 | Open Usman profile booking path | Existing male-patients (or documented) restriction path; **not** rewritten as insurance notice | ☐ |
| D-24 | Confirm no invented booking restrictions on other GPs | Only approved policy paths | ☐ |

### 1.4 Practice Information + Trust Facts surfaces

| # | Steps | Pass criteria | Result |
| --- | --- | --- | --- |
| D-30 | Open Practice Information Hub | Section cards present (nine Trust Facts–aligned topics) | ☐ |
| D-31 | Spot-check Contact / Hours / After-hours cards | Match Trust Facts register; after-hours **134 100** | ☐ |
| D-32 | Confirm no invented fees in practice share or hub copy | Fees not fabricated | ☐ |
| D-33 | Screenshot practice hub | Evidence saved | ☐ |

### 1.5 Digital Reception

| # | Steps | Pass criteria | Result |
| --- | --- | --- | --- |
| D-40 | From hub, activate Digital Reception | Search panel opens | ☐ |
| D-41 | Type a short query; close panel | Usable; returns to hub without broken overlay | ☐ |
| D-42 | Screenshot open DR | Evidence saved | ☐ |

### 1.6 Share functionality

| # | Steps | Pass criteria | Result |
| --- | --- | --- | --- |
| D-50 | Open a doctor profile with Share | Share control visible | ☐ |
| D-51 | Activate Share | System share **or** copy-link fallback succeeds | ☐ |
| D-52 | Practice page: Share phone (if present) | Number = Trust Facts clinic phone only | ☐ |
| D-53 | Spot-check one service or knowledge page share | Mount present; abort/dismiss safe | ☐ |
| D-54 | Screenshot share CTA | Evidence saved | ☐ |

### 1.7 Desktop install / QR bridge

| # | Steps | Pass criteria | Result |
| --- | --- | --- | --- |
| D-60 | Open `/install-wmc-app.html` | Install guidance + desktop QR section | ☐ |
| D-61 | Scan QR with phone (or open `install-wmc-app.html?source=desktop-qr`) | Phone lands on install flow | ☐ |
| D-62 | Screenshot install landing | Evidence saved | ☐ |

**Desktop section verdict:** ☐ Pass · ☐ Fail · ☐ Blocked  
**Notes:** _________________________________

---

## 2. Android physical script (T3)

Repeat on **Chrome Android** and **Samsung Internet**. Mark each browser separately in the companion checklist.

### 2.1 Install + icon

| # | Steps | Pass criteria | Result |
| --- | --- | --- | --- |
| A-01 | Open hub in Chrome Android | Hub loads | ☐ |
| A-02 | Complete install / Add to Home Screen when prompted | Icon on home screen | ☐ |
| A-03 | Dismiss once on a second session if testing cooldown | Tip respects ~14-day dismiss | ☐ |
| A-04 | Launch from **app icon** | Opens hub / PWA start URL | ☐ |
| A-05 | Repeat A-01–A-04 in Samsung Internet | Same Pass criteria | ☐ |

### 2.2 Hub tasks in standalone (or browser if install blocked)

| # | Steps | Pass criteria | Result |
| --- | --- | --- | --- |
| A-10 | Dashboard primary actions | Book, Preferred GP, DR, Call all work | ☐ |
| A-11 | Preferred GP select → kill browser/app → relaunch icon | Selection persists (`wmc.preferredGp.v1`) | ☐ |
| A-12 | Mary from Preferred GP | Phone-only CTA | ☐ |
| A-13 | Insurance GP profile | Insurance notice preserved | ☐ |
| A-14 | Practice Information Hub | Cards + Trust Facts strip OK | ☐ |
| A-15 | Digital Reception from hub | Panel opens on touch | ☐ |
| A-16 | Share on doctor profile | Android system share sheet or copy fallback | ☐ |
| A-17 | Capture screenshots for A-10, A-11, A-15, A-16 | Filed under evidence | ☐ |

**Android T3 verdict:** ☐ Pass · ☐ Fail · ☐ Blocked  
**Browsers evidenced:** ☐ Chrome · ☐ Samsung  
**Notes:** _________________________________

---

## 3. iPhone physical script (T3)

**Use Safari.** Chrome iOS is only for negative check (install panel hidden).

### 3.1 Add to Home Screen + icon

| # | Steps | Pass criteria | Result |
| --- | --- | --- | --- |
| I-01 | Open hub in Safari | iOS install guidance visible when eligible | ☐ |
| I-02 | Follow Share → Add to Home Screen | Icon added | ☐ |
| I-03 | Open icon (standalone) | Hub loads; install panel hidden; quicknav if applicable | ☐ |
| I-04 | Confirm safe-area: primary actions not under notch / home indicator | Usable | ☐ |
| I-05 | Optional: open hub in Chrome iOS | Install panel **not** shown | ☐ |

### 3.2 Hub tasks in Safari + standalone

| # | Steps | Pass criteria | Result |
| --- | --- | --- | --- |
| I-10 | Dashboard in Safari tab | Primary actions + Trust Facts strip | ☐ |
| I-11 | Preferred GP select → reload → relaunch from icon | Persistence across both contexts | ☐ |
| I-12 | Mary phone-only; insurance notice on Tanya/Debra | Policies preserved | ☐ |
| I-13 | Practice Information Hub | Cards + after-hours **134 100** | ☐ |
| I-14 | Digital Reception from hub and from standalone quicknav (if shown) | Panel opens | ☐ |
| I-15 | Share doctor profile | Native iOS share sheet; dismiss safe; clipboard fallback if needed | ☐ |
| I-16 | Screenshots: install guide, standalone hub, Preferred GP, share | Evidence filed | ☐ |

**iPhone T3 verdict:** ☐ Pass · ☐ Fail · ☐ Blocked  
**Contexts evidenced:** ☐ Safari tab · ☐ Standalone  
**Notes:** _________________________________

---

## 4. Cross-cutting policy & Trust Facts audit (all platforms)

Run once after platform scripts; failures here are **product blockers**.

| # | Check | Pass criteria | Desktop | Android | iPhone |
| --- | --- | --- | --- | --- | --- |
| P-01 | Preferred GP storage | Key `wmc.preferredGp.v1`; device-only; survives reload | ☐ | ☐ | ☐ |
| P-02 | Mary `PHONE_ONLY` | `tel:` only; no HotDoc book from policy path | ☐ | ☐ | ☐ |
| P-03 | Insurance notices | Only insurance-slug GPs; slug `does-not-bulk-bill-for-insurance-patients`; notice UI present | ☐ | ☐ | ☐ |
| P-04 | Usman path | Not converted to insurance notice | ☐ | ☐ | ☐ |
| P-05 | Trust Facts phone | `(07) 3217 3344` / `tel:+61732173344` on hub / practice / share-phone | ☐ | ☐ | ☐ |
| P-06 | Trust Facts hours / address | Match register on hub strip and practice hub | ☐ | ☐ | ☐ |
| P-07 | After-hours | Hello Home Doctor **134 100** | ☐ | ☐ | ☐ |
| P-08 | Share honesty | No invented fees; AbortError / dismiss does not error the page | ☐ | ☐ | ☐ |

---

## 5. Evidence package checklist

| Item | Required for | Status |
| --- | --- | --- |
| Hub dashboard screenshot | All platforms | ☐ |
| Preferred GP panel + persistence note | All platforms | ☐ |
| Digital Reception open | All platforms | ☐ |
| Install / A2HS (or QR bridge) | Desktop + each mobile browser | ☐ |
| Practice Information Hub | At least one mobile + desktop | ☐ |
| Share CTA / sheet | At least one Android + one iPhone | ☐ |
| Mary phone-only capture or written attestation | Policy | ☐ |
| Insurance notice capture or written attestation | Policy | ☐ |
| Session header (origin, SHA, date, operator) | Gate | ☐ |

---

## 6. Sign-off matrix

| Platform | Install / icon | Hub suite | Policy / Trust Facts | Evidence | Verdict |
| --- | --- | --- | --- | --- | --- |
| Desktop | | | | | ☐ Pass · ☐ Fail · ☐ Blocked |
| Android Chrome (T3) | | | | | ☐ Pass · ☐ Fail · ☐ Blocked |
| Android Samsung (T3) | | | | | ☐ Pass · ☐ Fail · ☐ Blocked |
| iPhone Safari (T3) | | | | | ☐ Pass · ☐ Fail · ☐ Blocked |
| iPhone standalone (T3) | | | | | ☐ Pass · ☐ Fail · ☐ Blocked |

### Overall Phase 4A-B operator result

| Outcome | When to select |
| --- | --- |
| **READY FOR PRODUCTION ACCEPTANCE REVIEW** | Desktop Pass **and** all required T3 rows Pass with evidence |
| **REQUIRES CORRECTIONS** | Any Fail on policy/Trust Facts/hub, or defects filed |
| **BLOCKED — T3 OUTSTANDING** | Environment OK / desktop Pass but physical Android or iPhone not completed |

**Explicit note:** Per Phase 4A-A recovery acceptance, **T3 physical evidence is still required** for full production acceptance even when local UAT/`next.` routes verify and T1 suites are green.

Operator signature: _________________ Date: _________

---

## 7. Related artefacts

| Doc | Role |
| --- | --- |
| [`WMC-PHASE4AB-DEVICE-VALIDATION-CHECKLIST.md`](./WMC-PHASE4AB-DEVICE-VALIDATION-CHECKLIST.md) | Per-platform tick lists |
| [`WMC-PHASE4A-A-RECOVERY-ACCEPTANCE.md`](./WMC-PHASE4A-A-RECOVERY-ACCEPTANCE.md) | Recovery status; residual T3 |
| [`WMC-PHASE4A-A-ACCEPTANCE-EVIDENCE.md`](./WMC-PHASE4A-A-ACCEPTANCE-EVIDENCE.md) | Expected workflows + screenshot index |
| [`WMC-PHASE4A-PATIENT-APP-ACCEPTANCE.md`](./WMC-PHASE4A-PATIENT-APP-ACCEPTANCE.md) | Executive Phase 4A verdict |
| [`WMC-PHASE4A-DEFECTS-REGISTER.md`](./WMC-PHASE4A-DEFECTS-REGISTER.md) | File new defects found during this script |
