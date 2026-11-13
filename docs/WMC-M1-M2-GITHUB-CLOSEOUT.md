# WMC — M1/M2 GitHub / release closeout

**Date:** 2026-11-13  
**Verdict:** **CLOSEOUT COMPLETE** (docs + GitHub; no Hostinger re-deploy required)

## SHA alignment

| Layer | SHA / artifact |
| --- | --- |
| Intended integrated code | `fdcb9c4e6f3977fed26b68ac569def825443a23e` |
| Hostinger archive | `wmc-patient-journey-m1-m2-fdcb9c4.zip` |
| Hostinger build | `01a1d286-af8b-72a9-9be4-0743867296d6` (**completed**) |
| Live markers | Patient Hub Care Hub + Prepare for Your Visit present |
| Docs tip on branch (after report) | `cfafefc` (+ subsequent closeout/C2 docs commit) |
| Ancestry | `fc73b11` ⊂ `fdcb9c4` ⊂ branch tip |

Deployed code SHA matches the approved M1+M2 integration tip. Later commits on the branch are documentation-only relative to that deploy.

## GitHub

| Item | Result |
| --- | --- |
| Remote | `https://github.com/ThoshiMedicals/healthcare-doctors-platform.git` |
| Branch | `feat/wmc-patient-journey-m1-m2` |
| Push | **Done** (safe `-u`; no force; **no merge** to main/release) |
| PR | Optional — create via GitHub UI when owner wants review merge |

## Archives (preserved)

| Role | Path |
| --- | --- |
| Release | `Desktop/backups/WMC-release-archives/wmc-patient-journey-m1-m2-fdcb9c4.zip` (+ `.sha256`) |
| Rollback | `Desktop/backups/WMC-release-archives/wmc-c1-patient-journey-fc73b11.zip` |
| Worktree copy | `WMC-patient-app-hostinger-integration/wmc-patient-journey-m1-m2-fdcb9c4.zip` (local; do not commit) |

## Roadmap / register

- Canonical roadmap: M1 + M2 = **STAGING VERIFIED**; M3–M5 remain deferred.  
- 17-concept decision register: decisions intact; status notes for concepts 5/6/11 only.  
- Phase C2: readiness checklist recorded — **BLOCKED** pending prerequisites.

No Hostinger, DNS, HotDoc, migration or push changes in this closeout.
