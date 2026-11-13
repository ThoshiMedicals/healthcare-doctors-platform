# WMC PATIENT APP CONCEPTS INTEGRATED — IMPLEMENTATION STATUS VERIFIED

| Field | Value |
| --- | --- |
| Date | 2026-11-13 |
| Branch | `feat/wmc-patient-journey-mockup-integration` |
| Base tip | `1a12bf98b0d940bb3ff41a6c7813e3f7427190e3` (C1 retained) |
| Staging baseline (unchanged) | `f6bba5ca0deea4ef70ebed64c64f35a9ca8d78dd` |
| Hostinger / production | **No deploy** |
| DB / DNS | **No changes** |

## Deliverables

| # | Deliverable | Location | Status |
| --- | --- | --- | --- |
| 1 | 17-image decision register | `docs/WMC-PWA-MOCKUP-CONCEPT-DECISION-REGISTER.md` | Done (audit MD missing on disk — owner brief used) |
| 2 | Existing vs missing matrix | `docs/WMC-PWA-MOCKUP-EXISTING-VS-MISSING-MATRIX.md` | Done |
| 3 | Canonical roadmap update | `docs/WMC-PATIENT-APP-MASTER-ROADMAP.md` §10–§12 | Done — Phases A–G preserved |
| 4 | Modular Journey plan | `docs/WMC-PATIENT-JOURNEY-ENHANCEMENT-PLAN.md` | Done |
| 5 | Safe code-only PJ-01/02 | `patient-journey-enhancements.ts` + `public-ux.ts` wire | Done |
| 6 | Visual + tests | `docs/phase-journey-evidence/2026-11-13/` | Done |
| 7 | Separate approvals | Decision register § Approvals | Listed |

## Code-only implementation

- **Care Hub** shortcuts to approved Trust Facts / CMS pages + Preferred GP, practice strip, Digital Reception anchors.
- **Visit prep** non-clinical checklist; storage key `wmc.visitPrep.v1` (boolean ids only).
- Branding: existing navy / teal / aqua / white; hub four-tile layout retained; no five-tab nav.

## Tests

| Suite | Result |
| --- | --- |
| `patient-journey-enhancements.test.ts` | **5/5 pass** (with hub regression) |
| Hub mobile dashboard tests | **PASS** |
| C1 engagement lab tests | **6/6 PASS** (undisturbed) |

Screenshots: `patient-hub-journey-390.png`, `patient-hub-care-hub-390.png`, `patient-hub-journey-full-390.png` (+ HTML fixture).

## Not executed (by design)

- Live push / Prisma / C2+  
- HotDoc routine-request config  
- Household GP storage  
- Open-now indicator  
- CMS publication of mockup demo content  
- Clinical results  
- Hostinger staging deploy of this branch  

## Verdict

**WMC PATIENT APP CONCEPTS INTEGRATED — IMPLEMENTATION STATUS VERIFIED**
