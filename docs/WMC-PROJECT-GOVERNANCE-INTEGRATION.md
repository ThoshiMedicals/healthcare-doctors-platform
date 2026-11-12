# WMC Project Governance Integration — Cursor Project Pack v1.2

**Date:** 13 November 2026  
**Baseline code SHA (unchanged by this commit):** `2634ca2b50a8d7a3d0caa1af206402f62401eaec`  
**Branch:** `release/wmc-patient-app-visual-excellence`  
**Scope:** Documentation and Cursor rules only. No application code, database, Hostinger deploy or production changes.

## Purpose

Merge the supplied **WMC Cursor Project Pack v1.2** into the repository without creating competing sources of truth, and mark **Phase A** as **STAGING VERIFIED** at `2634ca2`.

## Authority hierarchy (resolved)

| Priority | Concern | Canonical location |
| --- | --- | --- |
| 1 | Practice / clinical public facts | `docs/WMC-TRUST-FACTS-REGISTER.md` (+ `.json`), published CMS |
| 2 | Platform product / architecture | `docs/WMC-MASTER-BRAIN.md`, `docs/WMC-DEVELOPMENT-STANDARDS.md` |
| 3 | Production / ops procedure | `deployment/LAUNCH.md`, `deployment/SOURCE-CONTROL.md` |
| 4 | Live tip / hosting / frozen UX | `.cursor/rules/wmc-working-memory.mdc` |
| 5 | Cursor session constraints | `PROJECT_SPEC.md`, `.cursor/rules/wmc-core.mdc` |
| 6 | Patient App programme plan | `docs/WMC-PATIENT-APP-MASTER-ROADMAP.md` |
| 7 | Phase B task queue | `docs/WMC-PHASE-B-MODULAR-TASKS.md` |
| 8 | Agent workflow | `docs/WMC-CURSOR-WORKFLOW.md` |

`docs/WMC-CANON-GOVERNANCE-SPECIFICATION.md` remains a related governance artefact; it is **not** replaced. Patient App sequencing now points to the Master Roadmap above.

## Conflicts resolved

| Conflict | Resolution |
| --- | --- |
| Pack roadmap said Phase A “polish queued” / await polish | Updated to **STAGING VERIFIED** at `2634ca2` with evidence paths |
| Pack tip vs stale working-memory Hostinger RC tip (`ae202f2`) | Working memory tip refreshed to Patient App Phase A `2634ca2`; historical RC tip retained as historical |
| Generic guide `doctors.json` / sample hours / 10 GPs | Explicitly rejected; CMS + Trust Facts + 15 practitioners |
| Competing Patient App roadmaps | Single canonical file: `docs/WMC-PATIENT-APP-MASTER-ROADMAP.md` (no prior in-repo duplicate found) |
| Pack `wmc-core` vs existing `wmc-working-memory` | Both always-apply; core = constraints; working-memory = live tip/hosting; cross-linked |
| Phase B pack vs “do not start Phase B” | Phase B docs landed as planning only; implementation requires a separate owner prompt |
| Evidence / reports vs secrets / SQL scratch | Evidence + staging reports included; `_gen-*-sql*.mjs` and secrets excluded |

## Changed-file manifest (this integration)

### Added

- `PROJECT_SPEC.md`
- `.cursor/rules/wmc-core.mdc`
- `docs/WMC-CURSOR-WORKFLOW.md`
- `docs/WMC-PHASE-B-MODULAR-TASKS.md`
- `docs/WMC-PATIENT-APP-MASTER-ROADMAP.md`
- `docs/WMC-PROJECT-GOVERNANCE-INTEGRATION.md`
- `docs/WMC-PATIENT-HUB-MOBILE-DASHBOARD-STAGING-REPORT.md`
- `docs/WMC-PATIENT-HUB-UI-POLISH-STAGING-REPORT.md`
- `docs/WMC-PATIENT-APP-STAGING-EXECUTION-RESULT.md`
- `docs/WMC-SHARE-CONTROL-STAGING-RELEASE.md`
- `docs/phase4a-evidence/patient-hub-dashboard-20261112/` (evidence)
- `docs/phase4a-evidence/patient-hub-ui-polish-20261113/` (evidence)
- `docs/phase4a-evidence/share-control-staging-20261112/` (evidence)
- `docs/phase4a-evidence/visual-excellence-20261112/` (evidence)
- `docs/phase4a-evidence/visual-excellence-reaudit-20261112/` (evidence)
- `apps/web/scripts/patient-hub-dashboard-staging-verify.mjs` (staging verify helper)
- `apps/web/scripts/share-control-staging-verify.mjs`
- `apps/web/scripts/visual-excellence-staging-verify.mjs`

### Updated

- `.cursor/rules/wmc-working-memory.mdc` — tip `2634ca2`, governance pointers, Phase A closed
- `docs/WMC-PATIENT-APP-ADOPTION-VISUAL-EXCELLENCE-REPORT.md` (if dirty local status updates only)

### Explicitly excluded

- `apps/web/scripts/_gen-class-b-sql.mjs`
- `apps/web/scripts/_gen-class-b-sql-chunks.mjs`
- `apps/web/scripts/_gen-scratch-chunks.mjs`
- `apps/web/scripts/staging-patient-app-class-b-publish.mjs` (publish/scratch; not governance)
- `.env` / secrets / Hostinger credentials
- Application runtime modules (no `public-ux` / dashboard code changes in this commit)
- Hostinger env, DNS, production config

## Documentation-only validation

- [x] Pack files reviewed and merged (not blind overwrite)
- [x] Existing Master Brain / Trust Facts / Development Standards left as SSOT for their domains
- [x] Phase A marked **STAGING VERIFIED** at `2634ca2`
- [x] Phases B–G preserved as planned programme (no implementation)
- [x] Preserve list satisfied: hub polish, 15 GPs, HotDoc rules, Digital Reception, Preferred GP, PWA/share, Trust Facts, Next/Prisma/Postgres/Auth.js/CMS, engagement admin/push/inbox/SMS roadmap
- [x] No app functionality / DB / deploy changes in this task
- [x] SQL generator / secret scratch excluded from commit

## Verdict

**WMC PROJECT GOVERNANCE INTEGRATED — READY FOR PHASE B**

Phase B implementation must not start until an owner prompt explicitly authorises a B-task (typically B0 read-only first).
