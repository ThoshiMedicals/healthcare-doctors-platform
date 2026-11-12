# WMC Patient App — Phase 3C Release Candidate

| Field | Value |
| --- | --- |
| Status | **PHASE 3C COMPLETE — READY FOR REVIEW** |
| Integration branch | `feat/wmc-patient-app-phase3c` |
| Integration tip | `966e51f` (docs pin; Agent 4 QA `0175763`; feature tip `f136ad9`) |
| Worktree | `C:\Users\RoshanSamarawickrema\Desktop\WMC-phase3c-integration` |
| Base | `f55e8bd` (Phase 3B COMPLETE on branch) |
| Push / deploy / migrations | **Not performed** |

Authority QA matrix: [`WMC-PHASE3C-QA-RELEASE-VALIDATION.md`](./WMC-PHASE3C-QA-RELEASE-VALIDATION.md).

Phase 3B deliverables remain authoritative in [`WMC-PHASE3B-PATIENT-APP-RELEASE.md`](./WMC-PHASE3B-PATIENT-APP-RELEASE.md). Phase 3A in [`WMC-PHASE3A-PATIENT-APP-RELEASE.md`](./WMC-PHASE3A-PATIENT-APP-RELEASE.md).

---

## A. Phase 3C goal

Patient **Practice Information Hub** on top of Phase 3A hub + Phase 3B install experience. Patients find contact, hours, parking, accessibility, billing, telehealth, appointment, and after-hours paths in one mobile-first surface — without inventing fees or policies.

---

## B. Practice Information Hub

Class B fixture `apps/web/fixtures/practice-information-hub.html` with nine section cards aligned to Trust Facts families. Each card links to **existing** public routes only (no new fee text).

Detail: [`WMC-PHASE3C-IMPLEMENTATION.md`](./WMC-PHASE3C-IMPLEMENTATION.md) · IA: [`WMC-PHASE3C-INFORMATION-ARCHITECTURE.md`](./WMC-PHASE3C-INFORMATION-ARCHITECTURE.md).

| Section | Primary route |
| --- | --- |
| Contact | `contact.html` |
| Opening Hours | `contact.html#hours` |
| Directions | `contact.html` |
| Parking | `access-parking.html` |
| Accessibility | `accessibility.html` |
| Billing & Fees | `fees-billing.html` (+ `bulk-billing.html`) |
| Telehealth | `telehealth.html` |
| Appointment Information | `book-appointment.html` (+ `practice-policies.html`) |
| After Hours Care | `after-hours-care.html` |

---

## C. Trust Facts strip

SSR `injectPatientPracticeInfoHub` (`patient-practice-info-hub.ts`) replaces `#practice-info-strip` with `ClinicBranding`:

- Phone `tel:+61732173344`
- Email `reception@gabbamedicalcentre.com.au` (integration tip `f136ad9`)
- Hours summary from branding
- After hours: Hello Home Doctor **134 100** (links to `after-hours-care.html`)

Discovery audit: [`WMC-PHASE3C-TRUST-DISCOVERY-AUDIT.md`](./WMC-PHASE3C-TRUST-DISCOVERY-AUDIT.md). SSOT: [`WMC-TRUST-FACTS-REGISTER.md`](./WMC-TRUST-FACTS-REGISTER.md).

---

## D. Patient Hub entry

`patient-hub.html` secondary grid **Practice Information** → `practice-information-hub.html` (replaces former `contact.html` destination). Label and copy unchanged; URL disambiguates from GM `practice-information.html`.

---

## E. Digital Reception on practice hub

Fixture retains `[data-open-digital-reception]`; inject ensures Phase 3A open delegate idempotently (`wmc-digital-reception-open-delegate`). `digital-reception.js` unchanged vs Phase 3A base.

Detail: [`WMC-PHASE3A-DIGITAL-RECEPTION.md`](./WMC-PHASE3A-DIGITAL-RECEPTION.md).

---

## F. Public UX wiring

`public-ux.ts` calls `injectPatientPracticeInfoHub` after Phase 3B install injects. Golden homepage and frozen hero untouched.

---

## G. B1 inventory

`practice-information-hub.html` registered as Class B (non-golden). Approved public inventory **229** paths; Class B count **22**. Golden HTML corpus **208** pages (reconciliation aligned in QA).

---

## H. Phase 3A regression (carried forward)

| Capability | Status |
| --- | --- |
| Patient Hub dashboard | Operational — tests pass |
| Preferred GP (`wmc.preferredGp.v1`) | Operational |
| Booking policy (Mary phone-only, Golnar online, insurance slugs) | Operational |
| Digital Reception hub shortcuts | Operational |
| PWA manifest / `sw.js` / quick nav | Operational; `start_url` still Patient Hub |

---

## I. Phase 3B regression (carried forward)

| Capability | Status |
| --- | --- |
| Android install CTA | Operational — hub + `install-wmc-app.html` |
| iPhone Safari install guide | Operational — hub-only inject |
| Desktop QR landing | Operational |
| Shared install prompt (`wmc.patientInstall.v1.*`, 14-day cooldown) | Operational |

---

## J. Trust Facts compliance

| Fact | Value |
| --- | --- |
| Address | 468 Vulture Street, Woolloongabba QLD 4102 |
| Phone | `(07) 3217 3344` / `+61732173344` |
| Email | `reception@gabbamedicalcentre.com.au` |
| After hours | Hello Home Doctor **134 100** (no invented clinic fee amounts on hub) |

`DEFAULT_CLINIC_BRANDING` in `apps/web/src/clinics/branding.ts`.

---

## K. Test results

| Suite | Result |
| --- | --- |
| Phase 3C required bundle (14 files) | **100/100** pass (runnable) |
| `approved-content-manifest.test.ts` | **BLOCKED (env)** — `@prisma/client` |
| Includes Phase 3A hub + Phase 3B install + PWA contracts | All runnable tests green |

---

## L. Build results

**BLOCKED (env):** `npm run build` — `prisma` / full `node_modules` not installed in worktree. Operator: `npm ci`, generate icons, then build before deploy.

---

## M. Screenshots

**BLOCKED** in-agent. See QA report § Screenshots for UAT capture steps (hub card, practice hub strip, section grid, Digital Reception).

---

## N. Worktrees and branches

| Role | Path / branch |
| --- | --- |
| Integration | `C:\Users\RoshanSamarawickrema\Desktop\WMC-phase3c-integration` · `feat/wmc-patient-app-phase3c` |
| Phase 3B reference | `WMC-phase3b-integration` · `feat/wmc-patient-app-phase3b` |
| Phase 3A reference | `WMC-phase3a-integration` · `feat/wmc-patient-app-phase3a` |

---

## O. Commit SHAs (Phase 3C)

| Item | SHA |
| --- | --- |
| Arch lock | `5b62972` |
| Agent 1 IA | `0808d6a` |
| Agent 2 Trust discovery | `fe5a7b9` |
| Agent 3 hub impl | `d66180c` (merge `c68005d`) |
| Trust Facts email strip | `f136ad9` |
| Agent 4 QA | `0175763` |

---

## Final verdict

# PHASE 3C COMPLETE — READY FOR REVIEW
