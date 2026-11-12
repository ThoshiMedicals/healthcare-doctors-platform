# WMC — Patient Hub final mobile UI polish (staging)

**Date:** 2026-11-13  
**Baseline before polish:** `c08e91e0dcb3c3160965f052ed9823b65684f440`  
**Final tip:** `2634ca2b50a8d7a3d0caa1af206402f62401eaec`

## Changes (targeted only)

1. **Preferred GP** — heading “My preferred GP”, supporting copy, stacked label/select/save rows, full-width select, solid WMC card chrome (JS + hub CSS).
2. **Quick actions** — compact teal mask icons (`data-hub-action`) without raising card height.
3. **Sticky dock** — tighter padding/targets on hub only; ≥44px; safe-area retained.
4. **Install card** — solid border + shared card shadow (no dashed border).
5. **Post-footer whitespace** — genuine issue: global `padding-bottom:128px` for dock; hub now uses ~76px (+ safe area) and reduced practice-strip margin.

## Deploy

| Item | Value |
| --- | --- |
| Hostinger build UUID | `01a1d1f7-c5c2-736a-9772-1449b28a20e8` |
| Release ZIP | `wmc-patient-hub-ui-polish-2634ca2.zip` |
| ZIP SHA-256 | `A532B650EAB493A6FA7DDD31ADF4BC9739C4F7FB1BD3991ED5620CF9129EF053` |
| Rollback | `wmc-patient-hub-mobile-dashboard-c08e91e.zip` / prior `01a1cfd1-…` |

## Tests

- `patient-hub-mobile-dashboard.test.ts` — PASS  
- `patient-preferred-gp.test.ts` (incl. JS structure) — PASS  
- Local `npm run build` — PASS  
- Hostinger archive build `01a1d1f7-…` — completed  

## Live verification (staging)

Evidence: `docs/phase4a-evidence/patient-hub-ui-polish-20261113/`  
Viewports: 320 / 390 / 430 / 768 / 1440 (`polish-*-viewport.png`, `polish-*-full.png`)

| Check | 320 | 390 | 430 | 768 | 1440 |
| --- | --- | --- | --- | --- | --- |
| Preferred GP heading + stacked picker | PASS | PASS | PASS | PASS | PASS |
| Full-width select | PASS | PASS | PASS | PASS | PASS |
| 4 action cards + icons | PASS | PASS | PASS | PASS | PASS |
| Install solid border | PASS | PASS | PASS | PASS | PASS |
| Dock targets ≥44px | PASS | PASS | PASS | PASS | PASS |
| Body dock padding (not 128px) | 76px | 76px | 76px | 88px | 88px |

Post-footer space equals intentional body padding for the fixed dock (reduced from global 128px). Not a residual layout hole.

## Functionality preserved

Preferred GP persistence, booking rules, Digital Reception, PWA/iOS install, mobile share, SEO/noindex — unchanged. Code-only deploy; no CMS DB / DNS / production / auth changes.

**Verdict:** Patient Hub UI polish — **STAGING VERIFIED**
