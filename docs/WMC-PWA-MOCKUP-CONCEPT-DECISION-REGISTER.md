# WMC — 17-image Patient App mockup concept decision register

| Field | Value |
| --- | --- |
| Date | 2026-11-13 |
| Staging baseline | `f6bba5ca0deea4ef70ebed64c64f35a9ca8d78dd` |
| C1 tip retained | `1a12bf98b0d940bb3ff41a6c7813e3f7427190e3` |
| Named source | `WMC_PWA_Mockup_Concept_Audit_2026-11-13.md` |
| Owner-approved brief used | Preflight 2026-11-13 owner Task list: notification prefs/categories; Updates feed; Care Hub; visit prep; new-patient guidance; bulk-billing (Trust Facts); visit/after-hours; telehealth prep; GP directory + Preferred GP; health education discovery; Digital Reception nav; HotDoc routine shortcuts (conditional); household GP (optional); open-status (optional); **no** clinical-results; notifications stay in future phases; no five-tab nav without UX approval |
| Source availability | Named audit markdown **still not found on disk** (Desktop/Downloads/repos). Register rows map 1:1 to that owner brief + prior Task 2 list. **Uncertainty:** exact 17-image filenames/order and any per-image clinical caveats in the missing audit file are unknown — do not invent; re-reconcile when the file is supplied. |

**Rules applied:** Do not copy unverified clinical statements, generated portraits, or inaccurate fees. No competing five-tab global nav. No clinical results. No named family health / clinical notes in anonymous storage. HotDoc remains booking / reminder / recall SoT. Notifications stay in approved C0→E phases.

---

## Decision register (17)

| # | Concept (mockup theme) | Decision | Status vs platform | Workstream | Notes / dependencies |
| --- | --- | --- | --- | --- | --- |
| 1 | Patient Hub / home dashboard | **Keep existing** | **Implemented** | Phase A (preserve) | Owner-approved hub layout; do not redesign |
| 2 | Notification preferences & categories | **Approve (future + C1 demo)** | **Partial** — C1 lab demo; live persist = C2–C3 | C0→C | No live push in C1 |
| 3 | Patient Updates / public announcement feed | **Approve (future + C1 demo)** | **Partial** — C1 inbox demo; live feed = C5/D | C0→D | Not CMS-published demo content |
| 4 | Notification Inbox | **Approve (future + C1 demo)** | **Partial** | C1 / C5 | Isolated `/dev/patient-engagement` |
| 5 | Self-Service Care Hub shortcuts | **Approve enhance** | **Partial** → **code enhance** | Journey PJ-01 | Link existing approved pages only |
| 6 | Visit preparation checklist | **Approve (non-clinical)** | **Missing** → **code enhance** | Journey PJ-02 | Checkboxes only; no free-text clinical notes |
| 7 | New-patient onboarding guidance | **Approve enhance** | **Partial** (`new-patients.html`) | Journey PJ-01 | Deep-link + Trust Facts; no invented copy |
| 8 | Bulk-billing information | **Approve enhance** | **Partial** (TF-BILL pages) | Journey PJ-01 | Link `bulk-billing.html` / `fees-billing.html` only |
| 9 | Visit information & after-hours | **Approve enhance** | **Partial** | Journey PJ-01 | `book-appointment.html`, `after-hours-care.html` |
| 10 | Telehealth preparation | **Approve enhance** | **Partial** | Journey PJ-01/02 | Link `telehealth.html`; prep tips non-clinical |
| 11 | GP directory + Preferred GP shortcuts | **Approve enhance** | **Mostly implemented** | Journey PJ-03 | Prefer existing Preferred GP + `team.html` |
| 12 | Health education discovery | **Approve enhance** | **Partial** | Journey PJ-01 | Keep `knowledge/index.html` card; no fabricated articles |
| 13 | Digital Reception navigation | **Keep existing** | **Implemented** | Phase A / DR | Do not duplicate |
| 14 | HotDoc routine request shortcuts | **Conditional future** | **Missing** | HotDoc gate | Needs verified HotDoc account capability — **plan only** |
| 15 | Optional household GP preferences | **Conditional / privacy gate** | **Missing (deferred)** | Phase F-ish | Already deferred in roadmap (`wmc_family_gps`); no anonymous named family health |
| 16 | Optional clinic opening-status indicator | **Conditional future** | **Missing** | Journey PJ-04 | Needs verified hours engine — **no hard-coded open/closed** |
| 17 | Personal clinical results / medical notes | **Reject** | N/A | — | Clinical systems / HotDoc only; never anonymous PWA storage |

---

## Rejected or unsafe (summary)

- Clinical results, recalls, prescriptions, personal medical notes in PWA storage  
- Mockup fees, portraits, or clinical claims not in Trust Facts / GM  
- Global five-tab navigation without separate UX approval  
- Treating browser notification permission as marketing consent  

---

## Approvals still required

| Item | Approval |
| --- | --- |
| Live Web Push / schema (C2+) | Privacy, security, clinical, implementation |
| HotDoc routine-request shortcuts | HotDoc account verification + clinical |
| Household GP profiles | Privacy / UX approval |
| Open-now indicator | Verified hours source + clinical/ops wording |
| CMS republish of new Class B pages | CMS publication approval (if not code-only inject) |
| Supply of missing audit markdown | Operator — attach `WMC_PWA_Mockup_Concept_Audit_2026-11-13.md` for reconciliation |
