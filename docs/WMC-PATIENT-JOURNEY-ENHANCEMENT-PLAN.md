# WMC — Modular Patient Journey enhancement plan

| Field | Value |
| --- | --- |
| Branch (shipped) | `feat/wmc-patient-journey-m1-m2` |
| Staging tip | **`fdcb9c4`** — M1+M2 **STAGING VERIFIED** (build `01a1d286-…`) |
| Earlier design branch | `feat/wmc-patient-journey-mockup-integration` (superseded for M1/M2 ship) |
| Design | Existing navy / teal / aqua / white; hub layout retained |

## Modules

| ID | Module | Type | Status |
| --- | --- | --- | --- |
| PJ-01 | Care Hub (M1) | Code-only inject on Patient Hub | **STAGING VERIFIED** |
| PJ-02 | Visit preparation checklist (non-clinical) (M1) | Code-only + localStorage booleans + Clear | **STAGING VERIFIED** |
| PJ-03 | Preferred GP / directory save (M2) | Code-only + `wmc.preferredGp.v1` | **STAGING VERIFIED** |
| PJ-04 | Clinic opening-status indicator (M3+) | Plan | **Deferred** — needs verified hours engine |
| PJ-05 | HotDoc routine request shortcuts (M3+) | Plan | **Deferred** — HotDoc verification |
| PJ-06 | Household GP preferences (M3+) | Plan | **Deferred** — privacy / UX approval |
| PJ-07 | Notification prefs / Updates feed / Inbox | C0–E | **Do not implement here** — C2 readiness blocked |
| PJ-08 | CMS article / announcement publishing | Ops | **Plan only** — no demo as live clinical content |

## PJ-01 destinations (approved pages only)

| Label | Href | Trust / role |
| --- | --- | --- |
| New patients | `/new-patients.html` | Onboarding |
| Fees & billing | `/fees-billing.html` | TF-BILL |
| Bulk billing | `/bulk-billing.html` | TF-BILL |
| Telehealth | `/telehealth.html` | Visit prep |
| After-hours care | `/after-hours-care.html` | Safety info |
| Book / visit info | `/book-appointment.html` | Visit info |
| Find a doctor | `/team.html` | Directory |
| Preferred GP | `#preferred-gp-panel` | Existing picker |
| Practice information | `#practice-info-strip` | Existing strip |
| Digital Reception | `#digital-reception` | Existing DR |
| Health articles | `/knowledge/index.html` | Education index only |

## PJ-02 checklist items (non-clinical)

Stored as `wmc.visitPrep.v1` JSON of boolean keys only — **no free text, no names, no diagnoses**.

1. Bring Medicare / concession card  
2. Arrive a few minutes early for check-in  
3. Know the reason for your visit  
4. For telehealth: quiet place + working camera/mic (link to telehealth page)  
5. After hours: use approved after-hours guidance if the clinic is closed  

## Explicit non-goals

- No five-tab bottom nav  
- No clinical results  
- No HotDoc credential changes  
- No Prisma / push / Hostinger deploy in this module  
- Do not rewrite C1 engagement lab routes  

## Test plan

1. Unit: HTML markers + no clinical-results strings + storage key shape  
2. Build: `npm run build` in `apps/web`  
3. Visual: Patient Hub mobile screenshot with Care strip + checklist open  
4. Regression: Preferred GP, DR, install card, C1 `/dev/patient-engagement` still present  

## Approvals for later modules

See `docs/WMC-PWA-MOCKUP-CONCEPT-DECISION-REGISTER.md` § Approvals still required.
