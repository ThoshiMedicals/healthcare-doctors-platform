# WMC Patient App — Phase 3A Release Candidate

| Field | Value |
| --- | --- |
| Status | **PHASE 3A COMPLETE — READY FOR REVIEW** |
| Integration branch | `feat/wmc-patient-app-phase3a` |
| Integration tip | `b26154c` |
| Worktree | `C:\Users\RoshanSamarawickrema\Desktop\WMC-phase3a-integration` |
| Base | `745d45b` (`release/wmc-hostinger-rc1`) |
| Branding RC cited | `9c928de` (icons lineage); full PWA shell from `a8309db` |
| Push / deploy | **Not performed** |

Authority QA matrix: [`WMC-PHASE3A-QA-RELEASE-VALIDATION.md`](./WMC-PHASE3A-QA-RELEASE-VALIDATION.md).

---

## A. Dashboard implementation summary

Patient Hub at `patient-hub.html` (Class B fixture `apps/web/fixtures/patient-hub.html`).

**Primary:** Book Appointment → `book-appointment.html`; My Preferred GP → `#preferred-gp-panel`; Digital Reception → `data-open-digital-reception`; Call Reception → Trust Facts `tel:+61732173344`.

**Secondary:** Doctors → `team.html`; Services → `services.html`; Health Information → `knowledge/index.html`; Practice Information → `patient-information.html` / `contact.html`.

SSR: `refinePatientHubDashboard` injects Trust Facts practice strip from `ClinicBranding`, Preferred GP script, dashboard CSS. PWA shell ported (manifest `start_url` `/patient-hub.html?source=pwa`, `sw.js`, `patient-pwa-nav.js`, `pwa-meta.ts`).

Detail: [`WMC-PHASE3A-DASHBOARD.md`](./WMC-PHASE3A-DASHBOARD.md).

---

## B. My Preferred GP implementation

| Item | Value |
| --- | --- |
| Storage | Device-only `localStorage` key `wmc.preferredGp.v1` |
| API | `window.WmcPreferredGp` (`get` / `set` / `clear` / `mount`) |
| Catalog | 11 GPs; Mary `PHONE_ONLY`; Golnar `ONLINE` approved HotDoc; others profile CTAs |
| Not used | Accounts, auth, DB, cookies, server persistence |

Detail: [`WMC-PHASE3A-PREFERRED-GP.md`](./WMC-PHASE3A-PREFERRED-GP.md).

---

## C. Booking verification report

Policy paths **PASS**: Mary phone-only; Golnar ONLINE helper; insurance / Usman slugs unchanged; clinic HotDoc for general book.

Helper: `patient-hub-booking.ts` + `practitioner-booking.ts`.

Detail: [`WMC-PHASE3A-BOOKING-VERIFICATION.md`](./WMC-PHASE3A-BOOKING-VERIFICATION.md).

---

## D. Digital Reception integration summary

Hub DR tile + hash bootstrap + shared `[data-open-digital-reception]` → `.digital-reception-launcher` proxy. **`digital-reception.js` unchanged.** Manifest DR shortcut → `/patient-hub.html?source=pwa-shortcut#digital-reception`.

Detail: [`WMC-PHASE3A-DIGITAL-RECEPTION.md`](./WMC-PHASE3A-DIGITAL-RECEPTION.md).

---

## E. Trust Facts compliance verification

| Fact | Value | Source |
| --- | --- | --- |
| Practice name | Woolloongabba Medical Centre | Register + `DEFAULT_CLINIC_BRANDING` |
| Address | 468 Vulture Street, Woolloongabba QLD 4102 | Register + branding fallback |
| Phone | `(07) 3217 3344` / `+61732173344` | Register + branding |
| Email | `reception@gabbamedicalcentre.com.au` | Register + branding |
| Hours / after-hours | Seed hours; Hello Home Doctor **134 100** | Hub practice strip |

SSOT: [`WMC-TRUST-FACTS-REGISTER.md`](./WMC-TRUST-FACTS-REGISTER.md).

---

## F. Screenshots

**BLOCKED** in-agent. Capture via local UAT (`uat:build` / `uat`) on `/patient-hub.html` — steps in QA report § Screenshots.

---

## G. Test results

| Suite | Result |
| --- | --- |
| Required Phase 3A (10 files) | **77/77** pass |
| `public-ux.test.ts` | **15/15** pass |
| Practitioner authority spot check | **4/4** pass |

---

## H. Build results

**BLOCKED (env):** `npm run build` failed — `prisma` / full `node_modules` not installed in worktree. Operator: `npm ci` then `npm run build` before any deploy.

---

## I. Worktree names

| Role | Path |
| --- | --- |
| Integration | `C:\Users\RoshanSamarawickrema\Desktop\WMC-phase3a-integration` |
| Agent 1 | `...\WMC-phase3a-dashboard` |
| Agent 2 | `...\WMC-phase3a-preferred-gp` |
| Agent 3 | `...\WMC-phase3a-booking` |
| Agent 4 | `...\WMC-phase3a-digital-reception` |
| PWA reference | `...\WMC-pwa-layout-release` |

---

## J. Branch names

| Role | Branch |
| --- | --- |
| Integration RC | `feat/wmc-patient-app-phase3a` |
| Agent 1 | `feat/wmc-phase3a-dashboard` |
| Agent 2 | `feat/wmc-phase3a-preferred-gp` |
| Agent 3 | `feat/wmc-phase3a-booking` |
| Agent 4 | `feat/wmc-phase3a-digital-reception` |

---

## K. Commit SHAs

| Item | SHA |
| --- | --- |
| **Local RC tip** | **`b26154c`** |
| Arch + Trust Facts | `056fe15` |
| Agent 1 | `d8b0c33` (merge `24c8c64`) |
| Agent 2 | `b8933ab` (merge `378cf0e`) |
| Hub GP wire | `de4d923` |
| Agent 3 | `97edb52` (merge `981954d`) |
| Agent 4 | `765f3c9` (merge `07d69c2`) |
| Agent 5 QA | `e997faf` → tip `b26154c` |

---

## L. Local release candidate details

- **Branch tip:** `feat/wmc-patient-app-phase3a` @ `b26154c`
- **Serves as:** Patient App Phase 3A candidate on existing Next + CMS HTML pipeline (no separate app/DB)
- **Requires before review smoke:** Import/publish `patient-hub.html` into local CMS if not already; `npm ci`; generate PWA icons (`node scripts/generate-pwa-icons.mjs`); UAT rebuild
- **Safety:** No GitHub push, Hostinger deploy, DNS, schema, or auth changes in this phase

---

## M. Phase 3B recommendations

1. Operator UAT screenshots + installable PWA smoke on `next.`
2. Publish `patient-hub.html` into CMS revisions; confirm Class B inventory path live
3. Complete `npm ci` + production build gate in clean worktree
4. Align Golnar **public chrome** with ONLINE helper when CMS `bookingUrl` ready (`alignGolnarOnlineBookingChrome`)
5. Optional: surface Preferred GP booking CTA through `resolvePatientHubPreferredGpBooking` only (single resolver)
6. Later phases only: push notifications, analytics, accounts, records — still out of scope

---

## Final verdict

# PHASE 3A COMPLETE — READY FOR REVIEW
