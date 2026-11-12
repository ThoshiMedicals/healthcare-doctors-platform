# WMC — Patient App Integration Release

| Field | Value |
| --- | --- |
| Date | 2026-11-12 |
| Integration branch | `feat/wmc-patient-app-hostinger-integration` |
| Worktree | `WMC-patient-app-hostinger-integration` |
| Hostinger base (accepted) | `59b5278c2098b95a7d54922037320b44811ef2a9` |
| Patient App acceptance | `f55b294` (`feat/wmc-patient-app-phase4ab`) |
| Historical recovery RC | `269df5a` |
| Common ancestor | `ec71759` |
| Integration commit | `aa4188b00f7e3b13d3e4e7d8c0298e2cfc9b87db` |
| Production | **NO-GO** |
| Staging website verified | **NO** — Class B hubs still 404 on Hostinger staging until controlled publish + deploy |

## Verdict

**PATIENT APP INTEGRATED LOCALLY — READY FOR CONTROLLED STAGING PUBLICATION AND DEPLOYMENT**

Code integration, unit/regression suite, and production build are complete on the Hostinger base. Patient App pages are **not** live on Hostinger staging until owner-approved Class B CMS publication and a controlled Hostinger deploy of this tip. Physical Android/iPhone evidence remains open (unchanged from Phase 4A-B).

---

## 1. Exact source and integration SHAs

| Role | Full SHA |
| --- | --- |
| Hostinger / Master QA V4 source | `59b5278c2098b95a7d54922037320b44811ef2a9` |
| Patient App acceptance tip | `f55b294` (branch `feat/wmc-patient-app-phase4ab`) |
| Merge-base | `ec71759` |
| Integration tip | `aa4188b00f7e3b13d3e4e7d8c0298e2cfc9b87db` |

**Method:** selective checkout of Patient App fixtures, public scripts, document modules, Trust Facts, and phase release docs from `f55b294` onto `59b5278`. Shared files (`public-ux.ts`, `practitioner-booking.ts`, `approved-path-inventory.ts`, `branding.ts`, `package.json`) were surgically patched — **no** wholesale merge of the ~71 divergent commits.

**Preserved (not overwritten):** Master QA / V4 branding & PWA, Auth.js hostname investigation docs (copied alongside), Golnar chrome alignment in `practitioner-booking.ts`, Hostinger logo rewrite / SEO / recruitment HOLD inventory posture (doctor profile Class B retirement retained).

---

## 2. Feature inclusion matrix

| Feature | Source | Integrated | Local UAT HTTP | Staging Hostinger |
| --- | --- | --- | --- | --- |
| Patient Dashboard (`patient-hub.html`) | 3A / 4A-B | Yes | **200** + SSR markers | **404** (unpublished) |
| Preferred GP `#preferred-gp-panel` + `wmc.preferredGp.v1` | 3A | Yes (15-GP catalog aligned to live profiles) | Markers present | N/A until publish |
| Booking shortcuts (Mary phone-only, Golnar HotDoc, insurance/Usman pass-through) | 3A | Yes (`patient-hub-booking` + Mary null policy) | Covered by unit tests | N/A |
| Digital Reception hub shortcuts + A11Y-002 aria | 3A / 4A-B | Yes | Markers present | N/A |
| Practice Information Hub (9 Trust Facts cards) | 3C | Yes | **200** | **404** |
| Android / iPhone install guidance | 3B | Yes | **200** on install landing | **404** |
| Desktop QR onboarding | 3B | Yes | QR script marker | **404** |
| Practitioner / service / knowledge / practice sharing | 3D | Yes | Share markers on hub | N/A (SSR on existing published pages after code deploy) |
| A11Y-001 / 002 / 003 | 4A-B | Yes | Unit + SSR style/aria | Physical T3 open |
| Trust Facts Register | 3C+ | Yes (`docs/WMC-TRUST-FACTS-REGISTER.*`) | Branding fallback aligned | N/A |
| Recruitment HOLD | Hostinger | Preserved | Tests pass | Unchanged |
| Auth.js dual-hostname fix | Investigation only | Docs copied; **no env/deploy** | N/A | Outstanding (see `WMC-STAGING-AUTHJS-HOSTNAME-FIX.md`) |

---

## 3. Local browser / UAT verification

Origin: `http://127.0.0.1:3100` (existing UAT process + `wmc_uat` CMS). Markers confirmed for integrated injectors:

| Check | Result |
| --- | --- |
| `/api/health` | 200 |
| `/patient-hub.html` | 200 — `preferred-gp-panel`, `wmc-patient-dashboard`, `patient-preferred-gp.js`, `wmc.preferredGp.v1`, DR open aria, practice strip, share |
| `/practice-information-hub.html` | 200 — practice-info style id, task grid, DR aria |
| `/install-wmc-app.html` | 200 — install QR / Android / iPhone copy |

**Note:** Running UAT binary may still be a prior tip; SSR contracts for this integration are also locked by unit tests (583/583) against the integrated tree. Restart UAT from this worktree before operator visual sign-off.

Local CMS (`localhost:5432` / `wmc_uat`) already has published rows for the three Class B hubs (plus known orphan `patient-hub-preferred-gp-fragment.html` — do **not** publish to staging).

---

## 4. Test results

| Suite | Result |
| --- | --- |
| Patient App unit tests (hub, install, share, preferred GP, practice info, PWA nav, booking) | **PASS** |
| Master QA `npm test` (full script including CMS/SEO/PWA/recruitment/readiness) | **583/583 PASS** |
| Distinguishing known physical gap | T3 Android/iPhone physical evidence **still open** (not a unit-test failure) |

---

## 5. Production build

| Step | Result |
| --- | --- |
| `npx prisma generate` | PASS |
| `npm run build` (production Next build in integration worktree) | **PASS** (exit 0) |

---

## 6. Required Class B CMS publication operations

**Do not execute until owner approval.** Staging Supabase `wmc-hostinger-staging` (`thwcxuhrzgkufvdrvzzt`) currently has **zero** `pages` rows for these paths (confirmed read-only SQL). Hostinger staging HTTP returns **404** for all three.

### 6.1 Pages requiring Class B publication

#### A. Patient Hub

| Field | Value |
| --- | --- |
| Exact route | `/patient-hub.html` (`patient-hub.html`) |
| Approved source | `apps/web/fixtures/patient-hub.html` (+ SSR via `public-ux` / Preferred GP / DR / install / share modules) |
| Published status (staging) | **Unpublished** — no DB row; HTTP 404 |
| Current DB record (staging) | none |
| Local UAT record | `status=published`, id `cmwcw6fdx01a3vylwrbk7ptw3` |
| Proposed action | Idempotent upsert Page + immutable PageRevision from fixture HTML; set `publishedRevisionId`; keep `indexable` consistent with staging noindex policy |
| Expected effect | Staging HTTP 200 Patient Dashboard after **code deploy of this tip** + publish |
| Rollback | Unpublish / delete page row + revision; confirm 404; restore prior Hostinger archive deploy |

#### B. Practice Information Hub

| Field | Value |
| --- | --- |
| Exact route | `/practice-information-hub.html` |
| Approved source | `apps/web/fixtures/practice-information-hub.html` (+ `patient-practice-info-hub.ts`) |
| Staging status | **Unpublished** — no DB row; HTTP 404 |
| Local UAT | published `cmwcw6feu01a7vylwgebn5rez` |
| Proposed action | Same Class B fixture upsert as A |
| Expected effect | Nine Trust Facts-aligned cards + DR |
| Rollback | Same as A |

#### C. Install WMC App

| Field | Value |
| --- | --- |
| Exact route | `/install-wmc-app.html` |
| Approved source | `apps/web/fixtures/install-wmc-app.html` (+ install Android/iOS/QR scripts) |
| Staging status | **Unpublished** — no DB row; HTTP 404 |
| Local UAT | published `cmwcw6ff001abvylwqaq58g2u` |
| Proposed action | Same Class B fixture upsert as A |
| Expected effect | Android/iPhone guidance + desktop QR |
| Rollback | Same as A |

### 6.2 Explicitly excluded from staging publish

| Path | Reason |
| --- | --- |
| `patient-hub-preferred-gp-fragment.html` | SEO orphan fragment present in local UAT only — **must not** be published to staging/production |

### 6.3 Inventory delta (code already updated)

`approved-path-inventory.ts`: approved paths **223 → 226**; Class B **16 → 19** (adds the three Patient App hubs only; does **not** re-add retired unpublished doctor profiles).

### 6.4 Idempotent publication plan (approval-gated)

1. Snapshot staging DB pages count + export any existing rows for the three paths (expect none).
2. Deploy **this integration tip** to Hostinger staging (archive or Git) — code without publish still 404s hubs; publish without code lacks SSR injectors.
3. Run narrowly scoped Class B import for **only** the three fixture paths (pattern: `scripts/_local-uat-recovery-import.ts` Class B subset), targeting staging `DATABASE_URL` under operator supervision.
4. Verify HTTP 200 + SSR markers on staging host(s); purge CF/cache if needed.
5. Do **not** seed, migrate schema, or overwrite golden/Class A pages.

### 6.5 Database change approval requirements

Owner must separately approve:

- Target: Supabase project `thwcxuhrzgkufvdrvzzt` (staging only)
- Exact operations: create/update ≤3 `pages` + ≤3 `page_revisions` from named fixtures
- Recovery: prior Hostinger archive `wmc-static-cdn-repair-59b5278.zip` + DB row delete/unpublish
- Confirmation: no production project writes; no DNS change

---

## 7. Physical-device evidence gaps

| Item | Status |
| --- | --- |
| A11Y-001/002/003 code remediation | Closed in tip `f55b294` / integrated here |
| T3 physical Android Chrome install + Preferred GP | **OPEN** — checklist in `WMC-PHASE4AB-DEVICE-VALIDATION-CHECKLIST.md` |
| T3 physical iPhone Safari Add to Home Screen | **OPEN** |
| Staging hub 404 screenshots | Historical evidence under `docs/phase4a-evidence/` |

These gaps do **not** block local integration verdict; they block “Patient App live / device-accepted”.

---

## 8. Deployment package

| Artifact | Path / note |
| --- | --- |
| Integration git tip | Local branch only — **not pushed** |
| Release archive | `Desktop/backups/WMC-release-archives/wmc-patient-app-hostinger-integration-aa4188b.zip` |
| Release SHA-256 | See companion `.sha256.txt` (generated with archive) |
| Rollback Hostinger accepted archive | `Desktop/backups/WMC-release-archives/wmc-static-cdn-repair-59b5278.zip` |
| Rollback SHA-256 | `7D0478D67D2C393B1C53DD5B5E868853EF0F792C578DDE5AAC45CA934FF5DF00` |

---

## 9. Rollback instructions

1. **Code:** Redeploy Hostinger from `wmc-static-cdn-repair-59b5278.zip` (SHA `59b5278…`) or prior completed Hostinger build UUID.
2. **CMS:** If Class B hubs were published, unpublish/delete the three paths; confirm staging 404.
3. **Git:** Discard or leave `feat/wmc-patient-app-hostinger-integration` unmerged; Master / Hostinger tip remains `59b5278` until intentional promote.
4. **Do not** change production DNS or production databases.

---

## 10. Changed-file manifest (integration)

**Added — fixtures / runtime**

- `apps/web/fixtures/patient-hub.html`
- `apps/web/fixtures/practice-information-hub.html`
- `apps/web/fixtures/install-wmc-app.html`
- `apps/web/public/patient-preferred-gp.js`
- `apps/web/public/patient-install-*.js`
- `apps/web/public/patient-share.js`

**Added — document modules + tests**

- `apps/web/src/documents/patient-hub-*.ts`
- `apps/web/src/documents/patient-install-*.ts`
- `apps/web/src/documents/patient-practice-info-hub.ts`
- `apps/web/src/documents/patient-preferred-gp.ts`
- `apps/web/src/documents/patient-share*.ts`
- Matching `*.test.ts` files

**Modified — shared (surgical)**

- `apps/web/src/documents/public-ux.ts` — Patient App pipeline wiring; Master QA/PWA retained
- `apps/web/src/documents/practitioner-booking.ts` — add `MARY_SLUG` / `practitionerBookingModeForSlug` / Mary null resolve; **keep** Golnar chrome helpers
- `apps/web/src/clinics/branding.ts` — DEFAULT fallback aligned to Trust Facts / seed (`reception@`, Vulture St, E.164 tel)
- `apps/web/src/importer/approved-path-inventory.ts` — +3 Class B Patient App paths (226 / 19)
- `apps/web/package.json` — register Patient App tests in `npm test`
- Related importer/manifest count tests

**Docs**

- Phase 3A–3D / 4A / 4A-B release + evidence
- Trust Facts Register
- `WMC-PATIENT-APP-LAUNCH-RECONCILIATION.md`
- `WMC-STAGING-AUTHJS-HOSTNAME-FIX.md` (investigation only)
- This file

---

## 11. Out of scope / not done

- GitHub push
- Hostinger deploy
- Staging/production DB writes
- DNS / Cloudflare production cutover
- Auth.js `AUTH_URL` env change
- Rebuilding completed Patient App features from scratch
`)