# WMC Phase B1 — Patient App Adoption & Installation Audit

**Date:** 13 November 2026  
**GitHub tip (docs lineage):** `dffcae6a5b7af9f4507dc1e9adeda4b90a73670d`  
**Hostinger staging code:** `2634ca2b50a8d7a3d0caa1af206402f62401eaec`  
**Branch:** `release/wmc-patient-app-visual-excellence`  
**Mode:** Read-only assessment. **No** app/CMS/DB/HotDoc URL/SW/Hostinger/production changes in this task.

> **Queue note:** Owner title = Phase B1 adoption audit. Modular file maps HotDoc → B1 and adoption design → **B2**. This report is the **adoption/install audit**; HotDoc strategy remains `docs/WMC-PHASE-B0-HOTDOC-COMPATIBILITY-REPORT.md` (preserve lightbox).

**Staging hosts checked:** `staging.gabbamedicalcentre.com.au` (homepage, Patient Hub, install landing). HotDoc `wp=w_lightbox`, `hotdoc-widgets.min.js`, `booking-resilience.js` present on all three.

---

## 1. Already complete (do not rebuild)

| Area | Evidence | Status |
| --- | --- | --- |
| Homepage Patient App discovery + CTAs | `#patient-app` / `wmc-home-patient-app`; Explore + Install; quick links to Preferred GP, DR, Practice Info, Install | **Live on staging** |
| Homepage / footer utility links | Patient App + Install in information list + footer patient column | **Live** |
| Frozen hero + 7-item primary nav preserved | Discovery sits after HotDoc / before Patient Information | **Intentional** |
| Patient Hub mobile dashboard (Phase A) | Preferred GP, four actions, install card, practice details, dock | **STAGING VERIFIED** (`2634ca2`) |
| Hub install card + standalone hide | `data-wmc-hub-install-card`; hidden in `display-mode: standalone` | **Live** |
| Android install experience | `patient-install-android.ts` / `.js` on hub + install page; Chrome/Samsung; benefits list | **Implemented** |
| iPhone Safari A2HS guide | In-flow `#wmc-ios-install` (not fixed overlay); D2 fix retained | **Live**; global tip **suppressed** on hub |
| Desktop QR pathway | `patient-install-qr.js` + install landing canvas/panels | **Implemented** |
| 14-day dismiss cooldown | `DEFAULT_INSTALL_PROMPT_COOLDOWN_MS` / shared keys `wmc.patientInstall.v1.*` | **Implemented** |
| Installed-state detection | `display-mode: standalone` + `navigator.standalone` + `installed` flag | **Implemented** |
| Global install tip (non-hub pages) | `pwa-meta` / `patient-install-prompt`; homepage tip present | **Live** |
| Preferred GP + Digital Reception as install reasons | Copy on homepage, hub, Android/iOS benefits | **Present** |
| Standalone PWA quick-nav | Book / Doctors / Services / Reception / Contact | **Implemented** |
| Mobile-only Share control | Preserved from visual excellence line | **Verified earlier** |
| HotDoc Lightbox + resilience + Mary phone-only | Staging HTML markers; B0 strategy | **Preserve — no change** |

Key source modules: `homepage-patient-app-discovery.ts`, `patient-install-prompt.ts` + `.js`, `patient-install-android.ts` + `.js`, `patient-install-ios.ts` + `.js`, `patient-install-qr.js`, `patient-hub-mobile-dashboard.ts`, `pwa-meta.ts`, `public-ux.ts`, `patient-preferred-gp.*`, Digital Reception runtime.

---

## 2. Missing / thin adoption features

| Gap | Severity | Notes |
| --- | --- | --- |
| In-clinic reception counter / waiting-room QR pack | **High for adoption** | Roadmap asks for counter QR, poster, staff briefing — **not in repo as print-ready clinic assets** |
| Primary / mobile menu entry for Patient App | Medium | 7-item nav frozen by design; discovery is mid-page — older patients may never scroll to `#patient-app` |
| Staging-safe QR handoff host | **High on staging** | QR hardcodes **apex** `https://gabbamedicalcentre.com.au/install-wmc-app.html` (still WordPress until cutover) |
| Honest Digital Reception copy on install CMS | Medium | Install landing still says “Message our team…” — overclaims vs published DR (info search, not chat/SMS) |
| Internal “Phase 3A” wording on install page | Low | Patient-facing jargon |
| Post-install success / “you’re set” microcopy | Low | No clear “installed — open Patient Hub” confirmation beyond mode switch |
| Notification opt-in onboarding | Deferred | Correctly **not built**; only design hooks below — **do not implement now** |
| Physical Android/iPhone install acceptance | Open | Still required for launch; not blocked for planning |

---

## 3. Actual mobile UX problems (observed / evidenced)

1. **Desktop QR → production apex while staging is Hostinger** — scanning from a staging desktop session can land on WordPress, not the Patient App install experience. File: `apps/web/public/patient-install-qr.js` (`HANDOFF_URL`).  
2. **Install-page Digital Reception overclaim** — “Message our team without waiting on hold when supported” mis-sells DR. Fixture/CMS: `install-wmc-app.html` / published Class B page.  
3. **Dismiss timestamp format mismatch risk** — global tip stores ISO strings (`patient-install-prompt.js`); iOS guide parses with `Number(raw)` (`patient-install-ios.js`). Shared cooldown may **fail to honour** tip dismiss on iOS → tip/guide reappear unexpectedly.  
4. **A2HS cognitive load for older patients** — multi-step Safari Share menu remains hard; 13–14px tip type is small; no large-print / simplified “ask reception” path on install page.  
5. **Homepage HotDoc App store posters sit immediately above WMC Patient App discovery** — patients may confuse HotDoc app vs WMC Home Screen shortcut (education/copy adjacency, not a booking bug).  
6. **Recovery dialog always in DOM** — “Need help booking?” region present in a11y tree when closed (known; keep HotDoc resilience; do not remove).  
7. **No Patient App in mobile primary nav** — Book/Call chrome strong; install path relies on scroll or footer/utilities.

HotDoc lightbox behaviour itself is **out of scope to change**; preserve resilience fallback.

---

## 4. Recommended improvements (ranked by patient value)

| Rank | Improvement | Why | Code-only vs CMS/DB |
| --- | --- | --- | --- |
| 1 | **Host-aware QR handoff URL** (same-origin or staging/prod config; regenerate QR modules) | Stops wrong-host installs; critical before clinic QR print | **Code-only** (`patient-install-qr.js` + tests); optional CMS text sync |
| 2 | **Fix install + discovery honesty** (DR copy; drop “Phase 3A”; clarify HotDoc app ≠ WMC shortcut) | Trust / older-patient comprehension | Copy: **CMS or code refine** on install page; homepage discovery already mostly honest |
| 3 | **Cooldownown storage parity** (ISO vs epoch in iOS/Android/tip) | Reliable 14-day “Not now” | **Code-only** |
| 4 | **Older-patient install assist** (larger type, 3-step iOS summary, “Ask reception to help install” + clinic phone) | Accessibility / reception-assisted adoption | **Code-only** guides + optional **print card** (CMS/print) |
| 5 | **Clinic QR / poster pack** (counter + waiting room → install URL; staff one-pager) | Highest real-world install volume | **Print/CMS assets** (not SW); URL must be final public host |
| 6 | **Soft discovery on Patient Information hub** (utility link only; no nav redesign) | Catch patients who never hit homepage mid-band | **Code-only** public-ux or small CMS link |
| 7 | **Post-install confirmation strip** on hub when standalone | Reinforces Preferred GP / DR value | **Code-only** |
| 8 | **Future notification opt-in hook** (after install success only; never on first paint) | Prepares Phase C without building push | **Design-only now** |

**Do not:** replace HotDoc; change Mary/Usman/insurance URLs; add five-tab bar; request notification permission on load; rewrite SW.

---

## 5. Source files likely to change (when implementation authorised)

| File | Likely change |
| --- | --- |
| `apps/web/public/patient-install-qr.js` | Host-aware `HANDOFF_URL` + QR bitmap regeneration |
| `apps/web/src/documents/patient-install-ios.ts` + `public/patient-install-ios.js` | Cooldown parse parity; older-patient copy/type |
| `apps/web/src/documents/patient-install-android.ts` + `.js` | Align dismiss parsing; optional larger type |
| `apps/web/src/documents/patient-install-prompt.ts` + `.js` | Shared dismiss helpers; tip copy clarity |
| `apps/web/src/documents/homepage-patient-app-discovery.ts` | Optional HotDoc-vs-WMC clarification line |
| `apps/web/src/documents/patient-hub-mobile-dashboard.ts` | Optional post-install / older-patient assist |
| `apps/web/src/documents/pwa-meta.ts` | Only if tip/suppress contract changes |
| `apps/web/src/documents/public-ux.ts` | Wire any new code-only injects |
| Published `install-wmc-app.html` (CMS Class B) | DR/Phase wording — **CMS republish if not code-refined** |
| New: `docs/` print brief or `public/assets/` QR poster | Reception pack (non-runtime) |

---

## 6. Proposed small Phase B1 implementation tasks

*(Owner “B1 implementation”; maps to modular **B2** then thin code slice — still no HotDoc rewrite, no push.)*

| ID | Task | Scope gate |
| --- | --- | --- |
| **B1-I1** | Host-aware desktop QR + unit test of handoff URL | Code-only; staging verify QR opens staging install |
| **B1-I2** | Unify install dismiss timestamp parse/serialize across tip/iOS/Android | Code-only; unit tests for ISO + epoch |
| **B1-I3** | Honest install/DR copy + HotDoc-app disambiguation (homepage one line optional) | Prefer code-only refine; CMS if page body owned by revision |
| **B1-I4** | Older-patient assist: larger install type, short iOS steps, ask-reception + tel | Code-only |
| **B1-I5** | Reception QR one-pager PDF/PNG (print) pointing at **approved public install URL** | Asset/docs; print after apex or staging URL chosen |
| **B1-I6** | Standalone “You’re using the Patient App” strip on hub (Preferred GP / DR reminder) | Code-only; no notifications |
| **B1-I7** | Physical device matrix (Android Chrome+PWA, iPhone Safari+A2HS) — evidence only | QA; no code |

**Explicit non-goals this wave:** push permission UI, inbox, Patient Engagement Admin, SW cache policy changes, primary-nav seven-item redesign, HotDoc Frame embed.

---

## 7. Regression tests required

- Unit: `homepage-patient-app-discovery`, `patient-install-prompt` (cooldown/standalone), `patient-install-android`, `patient-install-ios`, `patient-hub-mobile-dashboard`, `pwa-meta` tip suppress on hub/install, Preferred GP Mary/Golnar, booking-resilience markers untouched.  
- New/extended: QR handoff URL host cases; dismiss parse ISO↔epoch cross-module.  
- Visual: homepage `#patient-app`, hub install card, iOS in-flow (not overlay), desktop QR panel, dock clearance.  
- Staging smoke: homepage CTAs → hub → install; Mary `tel:`; HotDoc lightbox attrs + widgets script + resilience present; share control mobile-only.  
- Manual: Android `beforeinstallprompt` / Samsung; iPhone Safari A2HS; dismiss 14-day; standalone hides install card + tip.

---

## 8. Staging deploy & rollback (when owner authorises code)

1. Isolated worktree from tip; small commits; no DB.  
2. `apps/web` focused tests + production build.  
3. Archive ZIP named with short SHA; checksum; Hostinger Node build; confirm deployed SHA.  
4. Dual-host smoke: `staging.gabbamedicalcentre.com.au` + `mediumslateblue-eagle-960503.hostingersite.com`.  
5. Rollback: prior archive (`wmc-patient-hub-ui-polish-2634ca2.zip` / last good tip).  
6. **No production / DNS / Auth.js / SW policy** without separate sign-off.

---

## 9. Future notification opt-in (planning only)

Safe future placement (Phase C+): **after** confirmed standalone install or explicit “Get practice notices” control on hub — never on first homepage paint, never bundled into A2HS steps as if required. Keep marketing consent ≠ browser permission. **No implementation in B1.**

---

## 10. HotDoc preservation checklist

- [x] Keep `?wp=w_lightbox`  
- [x] Keep `hotdoc-widgets.min.js`  
- [x] Keep `booking-resilience.js` + external tab/call  
- [x] Keep doctor-specific CMS URLs / insurance / Usman slugs  
- [x] Keep Mary Abadir phone-only  
- [x] Do not replace booking solution  

---

## Verdict

**PHASE B1 AUDIT COMPLETE — IMPLEMENTATION PLAN READY**

Next: owner-authorise **B1-I1 + B1-I2** (highest value, code-only) before clinic QR printing; defer notifications.
