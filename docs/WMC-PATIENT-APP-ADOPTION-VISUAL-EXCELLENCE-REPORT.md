# WMC Patient App Adoption, Visual Excellence & Final Staging Quality

**Date:** 2026-11-12  
**Program:** Audit → Fix → Deploy → Verify → Re-audit (code-only Hostinger staging)  
**Verdict:** **VISUAL & PATIENT APP REVIEW COMPLETE — HOSTINGER STAGING VERIFIED**

---

## A. Initial Git and deployment baseline

| Item | Value |
| --- | --- |
| Mandatory integration baseline (pre-program) | `fdd9bf2c2afb0a5b61579c0b12be93ac022ed1c1` |
| Prior Hostinger build | `01a1ce64-7aab-739a-a700-0f99ac2b0379` |
| Share-control status at baseline | **Already deployed** (mobile-only toolbar) |
| Worktree | `WMC-patient-app-hostinger-integration` |
| Integration branch | `release/wmc-patient-app-visual-excellence` |
| Ancestry | `fdd9bf2` ← `5056f59` (discovery + in-flow iOS) ← `3e9521d` (suppress global tip) ← `6f08dde` (dock padding) |
| Rollback archive preserved | `wmc-share-control-staging-fdd9bf2.zip` / build `01a1ce64-…` |

No DB writes. No production/DNS/Auth.js changes. Env keys unchanged.

---

## B. Homepage Patient App discovery

Code-only inject via `homepage-patient-app-discovery.ts` + `public-ux.ts` (after frozen `#home` hero; before `#patient-information`).

- Section `#patient-app`: benefits limited to implemented features
- Primary CTA: **Explore the Patient App** → `/patient-hub.html`
- Secondary: Install WMC App; Quick access to Preferred GP, Digital Reception, Practice Information, Installation guide
- Desktop note pointing to install-page QR pathway
- Utility links added to homepage information list + footer patient column
- Primary seven-item navigation **unchanged**

---

## C. Patient App education improvements

- Patient Hub lede refined (working benefits only; no records/prescriptions/pathology claims)
- Homepage discovery copy lists Preferred GP, Digital Reception, practice info, install shortcut
- iOS guide copy clarifies it sits below the heading

---

## D. Installation funnel findings

| Platform | Finding | Action |
| --- | --- | --- |
| iPhone Safari | Dedicated guide was `position:fixed` and covered hero (D2); global tip also covered content | In-flow guide + suppress global tip on hub/install |
| Android | Dedicated tip retained; global tip suppressed when Android mount present | Preserved |
| Desktop | Install landing QR path preserved | Linked from homepage discovery |
| Cooldown | 14-day dismiss keys preserved | Unchanged |

Physical device validation remains separately required.

---

## E. Preferred GP UX verification

Live staging (390): panel present; select Dr James → Save → reload → **persists**. Booking policies untouched.

---

## F. Mobile-only sharing correction

Preserved from `fdd9bf2`. Re-verified after this program:

| Viewport | Share toolbar |
| --- | ---: |
| 320 / 390 / 430 | Visible |
| 768 / 1024 / 1440 | Hidden (`display:none`), not focusable |

---

## G. iPhone overlay correction (D2)

| Change | Detail |
| --- | --- |
| `#wmc-ios-install` | `position:static`, injected after `.patient-hub-hero` |
| Global `#wmc-pwa-install-tip` | Skipped when dedicated iOS/Android guides present |
| Evidence | `docs/phase4a-evidence/visual-excellence-20261112/patient-hub-ios-guide-390.png` |
| Result | Hero H1 visible; guide below hero; no fixed covering tip |

---

## H. Full visual audit (staging)

Playwright captures at 320–1440 for share + homepage discovery + hub. Representative templates inspected via live HTTP 200s (home, hubs, install, 15 practitioners, PWA assets).

Confirmed defects corrected in-scope (D2 + discovery). Sticky care bar mid-content remains intentional P3.

---

## I. Practitioner authority preservation

All **15** practitioner profiles HTTP 200. Mary phone CTA present; Tanya insurance notice retained. No practitioner DB edits.

---

## J. Accessibility results

| Check | Result |
| --- | --- |
| In-flow iOS guide (not modal trap) | PASS |
| Dismiss control present | PASS |
| Homepage CTAs ≥44px min-height | PASS (CSS) |
| Primary nav unchanged | PASS |
| Automated axe / physical SR | **Not claimed** |

A11Y-001/002/003 not reopened.

---

## K. Performance findings

No new heavy dependencies. Injects are SSR HTML/CSS only. Navigation feedback adequate; no artificial loading animations added.

---

## L. Patient journey test results

| Journey | Result |
| --- | --- |
| Discover Patient App from homepage | PASS |
| Open hub / Preferred GP / persist | PASS |
| Digital Reception from hub | PASS |
| Install pathway links | PASS |
| Mobile vs desktop share | PASS |
| Booking policies sample | PASS |

No real appointments submitted.

---

## M–N. Multi-cycle defect register & corrections

| Cycle | Action |
| --- | --- |
| 1 | Baseline `fdd9bf2`; confirm share already live; reproduce D2; plan code-only discovery |
| 2 | Implement discovery + in-flow iOS; deploy `5056f59` / `01a1ce74-…` |
| 3 | Find residual global tip covering guide; suppress tip; pad guide above sticky dock; deploy `6f08dde` / `01a1ce83-…`; re-verify PASS |

| ID | Severity | Issue | Status |
| --- | --- | --- | --- |
| D2 | P2 | iPhone install overlay covered hub hero | **CORRECTED** |
| D2b | P2 | Global PWA tip covered in-flow iOS guide | **CORRECTED** |
| D3 | P3 | Sticky care bar mid-content | Documented only |
| Share desktop | P1 (prior) | Already fixed on `fdd9bf2` | Preserved |

No open in-scope P0–P2.

---

## O. Before/after screenshots

Evidence root: `docs/phase4a-evidence/visual-excellence-20261112/`

- `home-patient-app-390.png`, `home-patient-app-1440.png`
- `share-practice-hub-{320,390,430,768,1024,1440}.png`
- `patient-hub-ios-guide-390.png` (after D2 + tip suppression)
- Prior share before/after also under `docs/phase4a-evidence/share-control-staging-20261112/`

---

## P. Final test and build results

| Gate | Result |
| --- | --- |
| Unit tests (share + iOS + discovery + pwa-meta) | **PASS** |
| `npm run build` | **PASS** |
| Playwright staging verify | **PASS** (`VERIFY=PASS`) |
| 15 practitioners | **15/15** |
| Dual-host noindex | **PASS** |
| Health `database: up` | **PASS** |
| Env keys | Unchanged (no replace) |

---

## Q. Staging parity

Both `staging.gabbamedicalcentre.com.au` and `mediumslateblue-eagle-960503.hostingersite.com`: home, Patient Hub, Practice Hub, Install, manifest — 200 + noindex headers. Auth.js dual-hostname defect remains a **separate** owner-tracked item (not marked resolved).

---

## R–T. Final deployed artifact

| Item | Value |
| --- | --- |
| **Final deployed Git SHA** | `6f08dde498dbc7e9b2b00daf0159b85dd865be49` |
| **Hostinger build UUID** | `01a1ce83-2522-717d-9567-eacf58419836` |
| Release ZIP | `wmc-patient-app-visual-excellence-6f08dde.zip` |
| ZIP SHA-256 | `EF8A0F052D246C0EC776CB69F8747E794BDE62E2298BB0E25442606C21D047E5` |

---

## U. Rollback readiness

1. Redeploy archive `wmc-share-control-staging-fdd9bf2.zip` (SHA-256 `49D2DE8F…`) → build settings Next.js `apps/web` / `.next` / node 22  
2. Or prior Patient App tip `wmc-patient-app-hostinger-integration-6d92b4f.zip`  
3. Do not replace env vars; cache-bust both hosts after rollback  

---

## V. Outstanding minor observations

- Sticky care bar mid-page (P3, intentional)
- Physical iPhone/Android install acceptance still required for launch claims
- Temporary Hostinger hostname `robots.txt` CDN exception remains environmental

---

## W. Unresolved owner-controlled blockers

- Auth.js custom-hostname callback defect (separate task)
- Production DNS cutover / production deploy (**not authorised**)
- Full PostgreSQL off-box backup for production cutover
- Any further CMS database content publication

---

## X. Audit/fix/deployment cycles completed

**4** (baseline audit → excellence deploy → D2 tip residual fix → dock-padding polish redeploy)

---

## Y. Remaining production-launch prerequisites

Per `docs/WMC-HOSTINGER-PRODUCTION-READINESS.md` / cutover checklist: production Supabase project, formal smoke log, Cloudflare Full (strict), off-box backup, Auth.js hostname resolution, signed DNS cutover. **Do not cut over from this program alone.**

---

## Final success checklist

- [x] Latest Patient App preserved  
- [x] Homepage discovery improved  
- [x] Benefits clear and accurate  
- [x] Installation guidance accessible  
- [x] Preferred GP works  
- [x] Desktop share hidden / mobile share works  
- [x] iPhone overlay no longer obstructs content  
- [x] Digital Reception functional  
- [x] 15 practitioners available  
- [x] Booking policies unchanged  
- [x] V4 branding / Trust Facts preserved (no invented claims)  
- [x] No open in-scope P0–P2  
- [x] Production build + Hostinger staging verified  
- [x] Dual-host smoke + noindex  
- [x] Production untouched  

---

## FINAL VERDICT

**VISUAL & PATIENT APP REVIEW COMPLETE — HOSTINGER STAGING VERIFIED**

| Field | Value |
| --- | --- |
| Final deployed SHA | `6f08dde498dbc7e9b2b00daf0159b85dd865be49` |
| Hostinger build UUID | `01a1ce83-2522-717d-9567-eacf58419836` |
| Cycles | 4 |
| Tests | Unit PASS · Build PASS · Playwright PASS · Smoke PASS |
| Patient App | Preserved + discoverable |
| Visual QA | PASS (D2 corrected) |
| Accessibility | Scoped PASS (no physical SR claim) |
| Staging parity | PASS (known Auth.js exception documented) |
| Remaining blockers | Production cutover / Auth.js hostname / physical device |
| Production launch readiness | **Not ready for DNS cutover** — staging excellence complete only |
