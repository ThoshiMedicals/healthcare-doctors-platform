# WMC Patient App — Phase 3B Release Candidate

| Field | Value |
| --- | --- |
| Status | **PHASE 3B COMPLETE — READY FOR REVIEW** |
| Integration branch | `feat/wmc-patient-app-phase3b` |
| Integration tip | `be712cb` (Agent 5 QA tip; pre-QA wire `1d87741`) |
| Worktree | `C:\Users\RoshanSamarawickrema\Desktop\WMC-phase3b-integration` |
| Base | `2b552f8` (Phase 3A consolidation on branch) |
| Push / deploy | **Not performed** |

Authority QA matrix: [`WMC-PHASE3B-QA-RELEASE-VALIDATION.md`](./WMC-PHASE3B-QA-RELEASE-VALIDATION.md).

Phase 3A deliverables remain authoritative in [`WMC-PHASE3A-PATIENT-APP-RELEASE.md`](./WMC-PHASE3A-PATIENT-APP-RELEASE.md).

---

## A. Phase 3B goal

Frictionless, device-appropriate Patient App install on top of Phase 3A hub (Preferred GP, booking helper, Digital Reception shortcuts, PWA shell). No accounts, push, or deploy in this phase.

---

## B. Android install experience

Chrome/Samsung Android CTA on `patient-hub.html` and `install-wmc-app.html`. Dismiss with **14-day** cooldown via `wmc.patientInstall.v1.dismissedAt`. Respects standalone mode and `beforeinstallprompt` when available.

Detail: [`WMC-PHASE3B-ANDROID-INSTALL.md`](./WMC-PHASE3B-ANDROID-INSTALL.md).

---

## C. iPhone install guide

Honest Safari copy (Share → Add to Home Screen; no fake install button). Hub-only inject; shared dismiss storage; **14-day** cooldown aligned with prompt intelligence.

Detail: [`WMC-PHASE3B-IPHONE-INSTALL.md`](./WMC-PHASE3B-IPHONE-INSTALL.md).

---

## D. Desktop QR handoff

`install-wmc-app.html` fixture/inventory + `patient-install-qr.js` for clinic-desktop → phone scan. Wired in `public-ux` with versioned cache bust.

Detail: [`WMC-PHASE3B-DESKTOP-QR.md`](./WMC-PHASE3B-DESKTOP-QR.md).

---

## E. Install prompt intelligence

Shared `patient-install-prompt.ts` / `patient-install-prompt.js`: standalone detection, install state, **14-day** “Not now” cooldown, Phase 3A benefit bullets only. `pwa-meta.ts` install tip delegates here (replaces ad-hoc session tip).

Detail: [`WMC-PHASE3B-PROMPT-BEHAVIOUR.md`](./WMC-PHASE3B-PROMPT-BEHAVIOUR.md).

---

## F. Public UX wiring

`injectPatientInstallExperience` in `public-ux.ts` composes Android + iOS injects and QR script normalisation on the install landing path. Golden homepage and frozen hero untouched.

---

## G. Phase 3A regression (carried forward)

| Capability | Status |
| --- | --- |
| Patient Hub dashboard | Operational — tests pass |
| Preferred GP (`wmc.preferredGp.v1`) | Operational |
| Booking policy (Mary phone-only, Golnar online, insurance slugs) | Operational |
| Digital Reception hub shortcuts | Operational; **`digital-reception.js` unchanged** |
| PWA manifest / `sw.js` / quick nav | Operational; `start_url` still Patient Hub |

---

## H. Trust Facts compliance

| Fact | Value |
| --- | --- |
| Address | 468 Vulture Street, Woolloongabba QLD 4102 |
| Phone | `(07) 3217 3344` / `+61732173344` |
| Email | `reception@gabbamedicalcentre.com.au` |

SSOT: [`WMC-TRUST-FACTS-REGISTER.md`](./WMC-TRUST-FACTS-REGISTER.md) · `DEFAULT_CLINIC_BRANDING`.

---

## I. Test results

| Suite | Result |
| --- | --- |
| Phase 3B required bundle (14 files) | **111/111** pass |
| Includes Phase 3A hub + PWA contracts | All green |

---

## J. Build results

**BLOCKED (env):** `npm run build` — `prisma` / full `node_modules` not installed in worktree. Operator: `npm ci`, generate icons, then build before deploy.

---

## K. Screenshots

**BLOCKED** in-agent. See QA report § Screenshots for UAT capture steps (Android CTA, iOS panel, desktop QR, install tip).

---

## L. Worktrees and branches

| Role | Path / branch |
| --- | --- |
| Integration | `C:\Users\RoshanSamarawickrema\Desktop\WMC-phase3b-integration` · `feat/wmc-patient-app-phase3b` |
| Phase 3A reference | `WMC-phase3a-integration` · `feat/wmc-patient-app-phase3a` |

Per-agent worktrees follow Phase 3B architecture lock naming (`WMC-phase3b-*` on operator machines).

---

## M. Commit SHAs (Phase 3B)

| Item | SHA |
| --- | --- |
| Arch lock | `303f8ad` |
| Agent 1 Android | `5b3bed7` (merge `4f37411`) |
| Agent 2 iPhone | `c752cd0` (merge `c174656`) |
| Agent 3 Desktop QR | `1449e15` (merge `2330d18`) |
| Agent 4 Prompt | `ede8c03` (merge `f8582b9`) |
| Cooldown alignment | `260a274` |
| Public UX wire | `1d87741` |
| Agent 5 QA | `43e9fc2` … `d9e9b63` (doc inventory) |

---

## Phase 3C pointers

Device E2E install matrix, CI build gate, CMS publish of `install-wmc-app.html`, optional `source=` analytics, merge to Hostinger RC — see QA report § Phase 3C recommendations.

---

## Final verdict

# PHASE 3B COMPLETE — READY FOR REVIEW
