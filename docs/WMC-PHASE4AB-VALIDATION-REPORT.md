# WMC Patient App — Phase 4A-B Validation Report (Agent 4)

**Date:** 2026-11-12  
**RC tip:** `7cb5785` (`feat/wmc-patient-app-phase4ab`)  
**Base:** `269df5a` (Phase 4A-A)  
**Push / deploy:** not performed

---

## A. Validation report

### Regression / unit

| Suite | Result | Notes |
| --- | --- | --- |
| Patient / share / PWA / install / DR / practice hub unit tests | **PASS** (50/50 focused; included in full run) | A11Y-001/002/003 assertions green |
| Golden master regions (`src/regression/golden-master.test.ts`) | **PASS** (3/3) against local `wmc_uat` (211 pages) | Confirms sitewide HTML regions unchanged after hub-scoped A11Y-002 |
| Full `npm test` | **488 / 490** | 2 SEO fails only (below) |
| `src/seo/launch.test.ts` | **FAIL (2)** — pre-existing Class B fixture | `patient-hub-preferred-gp-fragment.html` published orphan in `wmc_uat` (not introduced by 4A-B code) |

### Live UAT (`127.0.0.1:3100` → tip build)

| Check | Result |
| --- | --- |
| `/api/health` | 200 · `database: up` · `golden-import` |
| `/patient-hub.html` | 200 |
| A11Y-001 share mount `hidden` + sync `setMountVisible` | **PASS** |
| A11Y-002 hub/practice DR `aria-label` | **PASS** |
| A11Y-003 `.patient-preferred-gp-actions` `min-height:44px` | **PASS** |
| Preferred GP key `wmc.preferredGp.v1` | Present |
| Share runtime `patient-share.js` | Present |
| Trust Facts hours strip | Present |
| HotDoc booking dock | Present |
| Homepage hero-stat DR aria-label unchanged | **PASS** (hub-scoped only; dock label retained) |

### Phase preservation (functional spot-check)

| Surface | Status |
| --- | --- |
| Strategic Recovery / public UX pipeline | Intact (golden regions PASS) |
| Trust Facts strip on hub / practice hub | Present |
| Phase 3A Preferred GP mount + storage key | Present |
| Phase 3B install injectors (unit) | PASS |
| Phase 3C Practice Information Hub | Present + DR aria |
| Phase 3D share mounts (unit + hub dormant share) | PASS |
| Booking policies (Mary phone-only / HotDoc notices — unit suite) | Covered in full npm test PASS set |

### Build

| Step | Result |
| --- | --- |
| `npm run uat:build` (tip with A11Y scope fix) | **PASS** (Next 15.5.28) |
| `npm run uat` | **PASS** · prisma warm connected |
| `npm run build` (non-UAT) | Not re-run this pass (UAT build is the live artifact; Prisma engine lock risk if both run) |

### Accessibility majors

| ID | Code status | Live UAT |
| --- | --- | --- |
| A11Y-001 | **CLOSED** | Confirmed |
| A11Y-002 | **CLOSED** (hubs only) | Confirmed |
| A11Y-003 | **CLOSED** | Confirmed |

### Residual (not code majors)

| Item | Status |
| --- | --- |
| T3 physical Android / iPhone / standalone | **OPEN** — checklists ready; evidence not filed this phase |
| A11Y-004–006 minors | Open (non-blocking for majors closure) |
| SEO orphan fragment in local UAT DB | Known Class B; exclude from production publish set |

---

## B. Acceptance readiness report

See `docs/WMC-PHASE4AB-ACCEPTANCE-READINESS.md`.
