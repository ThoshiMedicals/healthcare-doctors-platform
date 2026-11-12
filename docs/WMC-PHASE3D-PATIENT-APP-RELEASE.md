# WMC Patient App — Phase 3D Release Candidate

| Field | Value |
| --- | --- |
| Status | **PHASE 3D COMPLETE — READY FOR REVIEW** |
| Integration branch | `feat/wmc-patient-app-phase3d` |
| Integration tip | `3f4ca28` (docs pin; Agent 5 QA `1d6cc15`; feature merge `afab97c`) |
| Worktree | `C:\Users\RoshanSamarawickrema\Desktop\WMC-phase3d-integration` |
| Base | Phase 3C complete (`966e51f` / `521e26d` on branch ancestry) |
| Push / deploy / migrations | **Not performed** |

Authority QA matrix: [`WMC-PHASE3D-QA-RELEASE-VALIDATION.md`](./WMC-PHASE3D-QA-RELEASE-VALIDATION.md).

Prior phases: [`WMC-PHASE3C-PATIENT-APP-RELEASE.md`](./WMC-PHASE3C-PATIENT-APP-RELEASE.md) · [`WMC-PHASE3B-PATIENT-APP-RELEASE.md`](./WMC-PHASE3B-PATIENT-APP-RELEASE.md) · [`WMC-PHASE3A-PATIENT-APP-RELEASE.md`](./WMC-PHASE3A-PATIENT-APP-RELEASE.md).

---

## A. Phase 3D goal

Patient-friendly **share experience** on trusted public surfaces: native **Web Share API** when available, **Clipboard API** / `execCommand` copy-link fallback, polite `aria-live` feedback. Canonical URLs from production host only. No third-party widgets, tracking, or invented clinic facts.

Architecture lock: [`WMC-PHASE3D-ARCHITECTURE-LOCK.md`](./WMC-PHASE3D-ARCHITECTURE-LOCK.md).

---

## B. Share core (Lead)

| Artefact | Role |
| --- | --- |
| `patient-share-core.ts` | Canonical URL/title resolve, button markup, runtime inject |
| `patient-share.ts` | Orchestrator — practitioner → services → practice |
| `public/patient-share.js` | Delegated clicks on `[data-wmc-share]` |
| `public-ux.ts` | Wires `injectPatientShareExperience` after Phase 3C hub inject |

Script version: `wmc-patient-share-20261112a` · Cache path: `/wmc-cache/patient-share.js`.

---

## C. Practitioner sharing (Agent 1)

Module: `patient-share-practitioner.ts` · Report: [`WMC-PHASE3D-PRACTITIONER-SHARING.md`](./WMC-PHASE3D-PRACTITIONER-SHARING.md).

| Surface | Mount |
| --- | --- |
| `doctors/*.html` | Share in `.doctor-profile-actions` or toolbar after `h1` |
| `team.html`, `team-*.html` | Hero toolbar — team page URL |
| `patient-hub.html` | Dormant preferred-GP share + `wmc-preferred-gp-share-sync` client script |

Booking policy, HotDoc, and phone-only Mary paths preserved.

---

## D. Services & knowledge sharing (Agent 2)

Module: `patient-share-services.ts` · Report: [`WMC-PHASE3D-SERVICES-KNOWLEDGE-SHARING.md`](./WMC-PHASE3D-SERVICES-KNOWLEDGE-SHARING.md).

| Surface | Mount |
| --- | --- |
| `services.html`, `services/**` | Toolbar after hero `h1` |
| `knowledge/**` | Toolbar under article/hub title; article body unchanged |

---

## E. Practice information sharing (Agent 3)

Module: `patient-share-practice.ts` · Report: [`WMC-PHASE3D-PRACTICE-SHARING.md`](./WMC-PHASE3D-PRACTICE-SHARING.md).

`PATIENT_PRACTICE_SHARE_PATHS`: practice hub, contact, parking, accessibility, telehealth, after-hours, fees/bulk billing, book-appointment.

| Feature | Detail |
| --- | --- |
| Primary | Share this page — canonical URL |
| Secondary (contact + practice hub) | **Share phone** — Trust Facts display phone in `data-share-text`, URL = contact canonical |
| Fees | No dollar amounts in share text attribute |

---

## F. Public UX wiring

Order in `applyPublicUxRefinements`: Phase 3B install → Phase 3C practice hub → **Phase 3D share**. Share head CSS stripped on re-apply for idempotent ordering with other injected styles (Agent 5 QA fix).

Homepage hero authority v6 and golden `old-html/` remain untouched.

---

## G. UX & accessibility (Agent 4)

Doc only: [`WMC-PHASE3D-UX-ACCESSIBILITY.md`](./WMC-PHASE3D-UX-ACCESSIBILITY.md).

**QA note:** Pre-mount “stub blocker” findings are **superseded** by SSR mounts at integration tip. Acceptance criteria (native buttons, 44px min touch, polite live region, share secondary to Book/Call) remain the UAT checklist.

---

## H. Phase 3A regression (carried forward)

| Capability | Status |
| --- | --- |
| Patient Hub dashboard | Green |
| Preferred GP (`wmc.preferredGp.v1`) | Green |
| Booking policy (Mary phone-only, insurance slugs) | Green |
| Digital Reception hub shortcuts | Green |
| PWA `start_url` → Patient Hub | Green |

---

## I. Phase 3B regression (carried forward)

| Capability | Status |
| --- | --- |
| Android install CTA | Green |
| iPhone Safari install guide | Green |
| Desktop install landing + prompt intelligence | Green |

---

## J. Phase 3C regression (carried forward)

| Capability | Status |
| --- | --- |
| `practice-information-hub.html` nine-card grid | Green |
| Trust Facts strip (tel, mailto, hours, 134 100) | Green |
| Patient Hub → practice hub tile | Green |
| Digital Reception on practice hub | Green |

---

## K. Trust Facts compliance

SSOT: [`WMC-TRUST-FACTS-REGISTER.md`](./WMC-TRUST-FACTS-REGISTER.md).

Share payloads use canonical production URLs, branding phone display for **Share phone**, and avoid inventing fees or after-hours copy in `data-share-text`.

---

## L. Test results

| Suite | Result |
| --- | --- |
| Phase 3D required bundle (17 files) | **128/128** pass |
| `approved-content-manifest.test.ts` | **BLOCKED (env)** — skipped per charter |
| Phase 3A + 3B + 3C + PWA embedded in bundle | All runnable tests green |

---

## M. Build results

**BLOCKED (env):** `npm run build` — Prisma / full `node_modules` not installed in worktree. Operator: `npm ci`, generate PWA icons if needed, then build before deploy.

---

## N. Worktrees and branches

| Role | Path / branch |
| --- | --- |
| Integration | `C:\Users\RoshanSamarawickrema\Desktop\WMC-phase3d-integration` · `feat/wmc-patient-app-phase3d` |
| Phase 3C reference | `WMC-phase3c-integration` · `feat/wmc-patient-app-phase3c` |
| Phase 3B reference | `WMC-phase3b-integration` · `feat/wmc-patient-app-phase3b` |
| Phase 3A reference | `WMC-phase3a-integration` · `feat/wmc-patient-app-phase3a` |

---

## O. Commit SHAs (Phase 3D)

| Item | SHA |
| --- | --- |
| Arch lock + core | `31d7e82` |
| Agent 1 practitioner | `62a9fd0` |
| Agent 2 services/knowledge | `637e4d1` |
| Agent 3 practice | `12689fe` |
| Agent 4 UX/a11y docs | `1fc9923` |
| Integration tip (pre-QA) | `afab97c` |
| Agent 5 QA | `1d6cc15` |
| Release tip (docs pin) | `3f4ca28` |

---

## Phase 4A recommendations

1. **CI gate:** Run the 17-file Phase 3D bundle + `approved-content-manifest.test.ts` after `npm ci` on every patient-app branch push.
2. **Device smoke:** On installed PWA and mobile Safari — share doctor profile, service page, knowledge article, practice hub; verify clipboard fallback on desktop Chrome.
3. **Staging parity:** Include share toolbars in next-vs-Hostinger visual audit for representative paths (`doctors/*`, `services.html`, `knowledge/articles/*`, `practice-information-hub.html`, `contact.html`).
4. **Cache bust:** Confirm `/wmc-cache/patient-share.js?v=wmc-patient-share-20261112a` served with site no-cache policy after deploy.
5. **CMS / Class B:** No new public routes required — share is SSR inject on existing approved paths; verify live CMS revisions receive inject on Hostinger staging after merge.
6. **Merge path:** Rebase Phase 3D onto Hostinger RC only after operator build green + optional device smoke log.

---

## Final verdict

# PHASE 3D COMPLETE — READY FOR REVIEW
