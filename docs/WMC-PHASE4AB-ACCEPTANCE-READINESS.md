# WMC Patient App — Phase 4A-B Acceptance Readiness

**Date:** 2026-11-12  
**Release candidate tip:** `b52d398`  
**Branch:** `feat/wmc-patient-app-phase4ab`  
**Prior tip:** `269df5a` (4A-A UAT recovery)

---

## Closure status

| Blocker class | Status |
| --- | --- |
| A11Y-001 Preferred GP empty share focusable | **CLOSED** (code + UAT) |
| A11Y-002 Hub/practice DR accessible name | **CLOSED** (code + UAT; hub-scoped) |
| A11Y-003 Preferred GP Change/Remove &lt;44px | **CLOSED** (code + UAT) |
| Acceptance checklists / test script | **READY** (Agent 3 docs) |
| UX review (low-risk) | **COMPLETE** (docs; no redesign) |
| T3 physical device evidence | **NOT FILED** — operator must run Agent 3 checklists |
| Staging tip deploy matching RC | **NOT DONE** (out of scope — stop before deploy) |
| Push notifications / analytics / new features | Out of scope — not started |

---

## Recommendation

**PATIENT APP REQUIRES FURTHER CORRECTIONS** is **not** required for the A11Y majors — those are remediated.

For **production Patient App acceptance**, remaining gate is **operator T3** (Android + iPhone + desktop standalone) using:

- `docs/WMC-PHASE4AB-DEVICE-VALIDATION-CHECKLIST.md`
- `docs/WMC-PHASE4AB-ACCEPTANCE-TEST-SCRIPT.md`

Until T3 evidence is attached, the formal program verdict remains:

### PATIENT APP REQUIRES FURTHER CORRECTIONS

*(Evidence gap only: T3 physical + optional Hostinger tip alignment. Code majors A11Y-001–003 closed on RC `b52d398`.)*

Do **not** push or deploy from this phase.

---

## RC commit map

| SHA | Summary |
| --- | --- |
| `269df5a` | Phase 4A-A UAT recovery pack (base) |
| `b7008d2` | 4A-B architecture lock |
| `fbbe56b` | A11Y-001/002/003 remediation |
| `1c34eb5` | merge Agent 1 a11y |
| `567a5de` | Agent 2 UX review |
| `34a3180` | merge Agent 2 |
| `80ac981` | Agent 3 device checklists + acceptance script |
| `6105fad` | merge Agent 3 |
| `7cb5785` | Scope DR aria-labels to Patient App hubs (golden-safe) |
| `b52d398` | Validation + acceptance readiness reports |
