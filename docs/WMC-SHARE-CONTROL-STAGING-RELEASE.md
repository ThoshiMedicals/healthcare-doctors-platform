# WMC — Share Control Staging Release

**Date:** 2026-11-12  
**Authority:** Operator release authorisation in “SHARE CONTROL STAGING RELEASE” task (code-only; no DB/DNS/auth/production changes)  
**Verdict:** **SHARE CONTROL STAGING VERIFIED**

---

## 1. Baseline integration

| Item | Value |
| --- | --- |
| Hostinger baseline | `6d92b4fae614ebfcb13ba21a7e38a0c7d6280bcd` |
| Approved fix content | `a91563fd5dd51816396709cd16a7494cb0841f30` (share CSS + unit test only) |
| Visual QA tip (not deployed) | `e1b3323b49c51ac7e186ea393e7c4c4786f79a33` — docs/evidence/scripts only |
| **Final deployed SHA** | `fdd9bf2c2afb0a5b61579c0b12be93ac022ed1c1` |
| Branch | `release/wmc-share-control-staging` |
| Diff vs baseline | **2 files only** — `apps/web/src/documents/patient-share-core.ts` + `.test.ts` (+18 lines) |
| Code equivalence | `git diff a91563f fdd9bf2 --` those two files → **empty** |

Unrelated visual-QA screenshots/scripts from `a91563f` / `e1b3323` were **excluded** from this release (minimal code-only artifact).

---

## 2. Artifact and Hostinger build

| Item | Value |
| --- | --- |
| ZIP | `backups/WMC-release-archives/wmc-share-control-staging-fdd9bf2.zip` |
| ZIP SHA-256 | `49D2DE8F2C53CAB69159683E37B48DAAFAB3C032206260132F616D6903C71CAA` |
| **Hostinger build UUID** | `01a1ce64-7aab-739a-a700-0f99ac2b0379` |
| Domain | `mediumslateblue-eagle-960503.hostingersite.com` |
| Build state | **completed** (published + restarted) |
| Archive path on host | `wmc-share-control-staging-fdd9bf2.zip` |
| Prior completed build (rollback) | `01a1ce26-6ae6-73a5-8624-453668ad69f6` / `wmc-patient-app-hostinger-integration-6d92b4f.zip` |

---

## 3. Pre-deploy gates

| Gate | Result |
| --- | --- |
| Share unit tests | **29/29 PASS** |
| `npm run build` | **PASS** (`Compiled successfully`) |
| Env keys before deploy (masked; no replace) | `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `AUTH_TRUST_HOST`, `DEFAULT_CLINIC_SLUG`, `STAGING_NOINDEX`, `PRIVATE_OBJECT_STORE` |
| Env keys after deploy | **Identical key set** — unchanged |
| Database | **No writes** — Patient App pages/records preserved |
| Production / DNS / auth config | Untouched |

---

## 4. Post-deploy acceptance

Cache bust: `POST /api/staging/public-cache-bust` → `ok:true` on both hosts.  
Health: `database: up` on both hosts.

| Acceptance | Result |
| --- | --- |
| Share this page visible & working &lt;768 (390, 430) | **PASS** — toolbar `display:block`, height 44 |
| Share this page hidden ≥768 (768, 1024, 1440) | **PASS** — `display:none`, width/height 0 |
| Hidden control not keyboard-focusable | **PASS** — Tab probe never focused toolbar at ≥768 |
| Preferred GP persists | **PASS** |
| Digital Reception works | **PASS** |
| Booking shortcuts / Mary phone CTA | **PASS** (Mary `tel:` present; Tanya insurance notice retained) |
| All 15 practitioner profiles | **PASS** (15/15 HTTP 200) |
| PWA (`manifest.webmanifest`, `sw.js`) | **PASS** (200) |
| Dual-hostname noindex | **PASS** — `X-Robots-Tag: noindex, nofollow, noarchive` |
| Live CSS inject | **PASS** — `@media (min-width:768px){.wmc-patient-share--toolbar{display:none!important}}` in HTML |

Evidence: `docs/phase4a-evidence/share-control-staging-20261112/`  
(`practice-hub-{390,430,768,1024,1440}.png`, preferred-GP + Digital Reception shots, `verify-raw.json`)

---

## 5. Remaining visual defects

| ID | Severity | Issue | Status |
| --- | --- | --- | --- |
| D2 | **P2** | iPhone installation overlay covers Patient Hub hero | **Unresolved** — separate visual correction (not in this release) |
| D3 | P3 | Sticky care bar mid-content | Reported only (intentional sticky UX) |

---

## 6. Rollback readiness

| Step | Action |
| --- | --- |
| 1 | Rebuild from archive `wmc-patient-app-hostinger-integration-6d92b4f.zip` (SHA-256 `4FEE14FE6B13CBD13987FE3C72EBC974C7EE3A4B7C4D77AC11ADE2EE5FB3A6C4`) via `hosting_nodejs_start-build` (Next.js, `apps/web`, `.next`, `build`, node 22) |
| 2 | Do **not** replace environment variables |
| 3 | Do **not** touch Supabase Patient App page/revision rows |
| 4 | Cache-bust both staging hostnames |
| 5 | Expect desktop page-level share to reappear (pre-fix behaviour) |

Rollback archive remains on Hostinger file storage from the prior completed build `01a1ce26-…`.

---

## Final verdict

**SHARE CONTROL STAGING VERIFIED**
