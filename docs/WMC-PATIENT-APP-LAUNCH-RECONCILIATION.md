# WMC Patient App — Launch Reconciliation Report

**Date:** 2026-11-12  
**Purpose:** Reconcile Patient App Phases 3A–3D / 4A-B acceptance work against the currently accepted Hostinger staging release. No redesign. No new features. No push/deploy in this pass.

| Reference | Value |
| --- | --- |
| Acceptance branch | `feat/wmc-patient-app-phase4ab` |
| Acceptance tip | `f55b294` |
| Recovery RC | `269df5a` |
| Accepted Hostinger deploy | `59b5278` (`59b5278c2098b95a7d54922037320b44811ef2a9`) |
| Staging | `https://staging.gabbamedicalcentre.com.au` |
| Preview host | `https://mediumslateblue-eagle-960503.hostingersite.com` |
| Local UAT | `http://127.0.0.1:3100` (served from 4A-B integration tip) |
| Trust Facts SSOT | `docs/WMC-TRUST-FACTS-REGISTER.md` (+ `.json`) |

---

## 1. Git ancestry and exact source comparison

### Topology

```
                    ec71759  (merge-base)
                   /        \
          …Master QA…      …Patient App 3A→3D→4A→4A-B…
                   |                 |
               59b5278            f55b294
            (Hostinger RC)     (acceptance tip)
```

| Question | Answer |
| --- | --- |
| Is `269df5a` ancestor of `f55b294`? | **Yes** |
| Is `59b5278` ancestor of `f55b294`? | **No** |
| Is `f55b294` ancestor of `59b5278`? | **No** |
| Merge-base(`59b5278`, `f55b294`) | **`ec71759`** — `fix(wmc): enforce recruitment HOLD before public HTML cache and align phone-only booking UX` |
| Commits only on acceptance tip | **71** (`59b5278..f55b294`) |
| Commits only on Hostinger tip | **71** (`f55b294..59b5278`) — Master QA / V4 / Passenger / CDN / Golnar / peer graph / etc. |

**Lines diverged.** Patient App acceptance and Hostinger Master QA are sibling histories from `ec71759`, not a fast-forward.

### What Hostinger `59b5278` already includes

- Strategic recovery / Master QA / V4 branding / practitioner inventory (15 peers)
- Sitewide PWA shell: `manifest.webmanifest`, `sw.js`, `patient-pwa-nav.js` (standalone quicknav)
- Booking / HotDoc / phone-only / insurance matrix work from the Master QA line
- Staging SEO hardening (`/index.html` redirect, manifest MIME, Passenger static fix)

### What Hostinger `59b5278` does **not** include

Patient App Phase **3A–3D / 4A-B** product files are **absent** at that tip (verified via `git cat-file`):

| Path | On `59b5278` | On `269df5a` / `f55b294` |
| --- | --- | --- |
| `fixtures/patient-hub.html` | No | Yes |
| `fixtures/practice-information-hub.html` | No | Yes |
| `fixtures/install-wmc-app.html` | No | Yes |
| `public/patient-preferred-gp.js` | No | Yes |
| `public/patient-share.js` | No | Yes |
| `public/patient-install-*.js` | No | Yes |
| `src/documents/patient-practice-info-hub.ts` | No | Yes |
| `src/documents/patient-share-*.ts` | No | Yes |
| `src/documents/patient-install-*.ts` | No | Yes |
| A11Y-001/002/003 remediation (`fbbe56b`+) | No | Yes (`f55b294`) |

**34** Patient App source/fixture paths differ on the acceptance side of `59b5278..f55b294` (hub, install, preferred GP, practice hub, share modules + tests).

### Integration risk (do not merge blindly)

Shipping `f55b294` alone would **drop** Hostinger-only Master QA (V4 logo tip, Passenger/`index.html` fix, Next 15.5.29 audit patch, Golnar CTA clarifications, peer-graph restores, CDN SEO locks).  
Shipping `59b5278` alone **omits** the entire Patient App hub/install/share/practice-info stack.

**Required next engineering step (approval-gated):** a deliberate merge/rebase of Patient App commits onto `59b5278` (or equivalent), conflict resolution preserving Master QA + Trust Facts + booking rules, then local build/test — **not** performed in this reconciliation.

---

## 2. Phase 3A–3D / 4A-B feature verification

Verification method: local UAT HTML markers at `127.0.0.1:3100` + focused unit suite on tip `f55b294`. Staging HTTP probes for inclusion.

| Feature | Local UAT (`f55b294` lineage) | Staging `59b5278` |
| --- | --- | --- |
| Patient Hub dashboard `/patient-hub.html` | **200** — present | **404** — not published |
| Preferred GP panel `#preferred-gp-panel` | Present | N/A (hub 404) |
| My Preferred GP + `wmc.preferredGp.v1` | Present | Missing asset + page |
| Booking shortcuts on hub | Present | Missing |
| Digital Reception shortcuts | Present (+ A11Y-002 aria on hubs) | Sitewide DR dock exists; hub DR entry N/A |
| Android install prompt | `/install-wmc-app.html` 200 + install JS | **404** install page; no patient-install JS |
| iPhone Add to Home Screen guidance | Present in UAT install path | Not deployed |
| Desktop QR onboarding | Present in UAT install path | Not deployed |
| Practice Information Hub | **200** | **404** |
| Practitioner / services / knowledge sharing | Share mounts + `patient-share.js` 200 | **404** share JS; no hub mounts |

**Classification**

| Status | Items |
| --- | --- |
| Already live and verified on staging | Sitewide PWA manifest/SW; standalone `patient-pwa-nav`; clinic site + booking policies on public doctor pages |
| Implemented locally but not deployed | Full Patient App 3A–3D + 4A-B a11y (hub, preferred GP, install, practice hub, share) |
| Missing from release archive / tip `59b5278` | Patient App fixtures, injectors, runtimes listed above |
| Genuine regression | **None identified** — absence is divergence, not a break of previously shipped Patient Hub |
| Device testing not completed | T3 physical Android / iPhone (see §8) |

---

## 3. Preferred GP functionality

| Check | Result |
| --- | --- |
| Storage key | `wmc.preferredGp.v1` (device-local only) |
| Stored fields | Catalog `slug`, display `name`, `profilePath` (+ booking mode derived from catalog) |
| Sensitive patient data in localStorage | **None** — no Medicare, phone, email, DOB, or clinical notes |
| Mary booking mode in catalog | `PHONE_ONLY` → `tel:+61732173344` |
| Empty-state share (A11Y-001) | Share mount `hidden` until GP saved (UAT confirmed) |
| Touch targets (A11Y-003) | `min-height:44px` on preferred-GP actions (UAT confirmed) |
| Staging | **Not available** (hub + script 404) |

---

## 4. Current staging inclusion

Probes (2026-11-12):

| Path | staging / hostingersite | local UAT |
| --- | --- | --- |
| `/api/health` | 200 DB up | 200 |
| `/patient-hub.html` | **404** | 200 |
| `/practice-information-hub.html` | **404** | 200 |
| `/install-wmc-app.html` | **404** | 200 |
| `/patient-preferred-gp.js` / `/wmc-cache/…` | **404** | 200 |
| `/patient-share.js` / `/wmc-cache/…` | **404** | 200 |
| `/manifest.webmanifest` | 200 | 200 |
| `/sw.js` | 200 | 200 |

**Conclusion:** Patient App product surfaces are **not** in the current staging deployment. Staging currently carries the Master QA / shell PWA line only.

---

## 5. Patient Hub navigation

Local UAT hub includes:

- Quick actions: Book Appointment, Digital Reception, Call Reception  
- Preferred GP region  
- Explore grid: Doctors, Services, Health Information, Patient Information, **Practice Information** → `practice-information-hub.html`  
- Trust Facts practice strip  
- Care dock + (when standalone) PWA quicknav  

Staging: hub route absent → navigation N/A until integrated release + CMS page publish/import of Class B fixtures.

---

## 6. PWA installation and sharing verification

| Surface | Local UAT | Staging |
| --- | --- | --- |
| Manifest + icons + SW | PASS | PASS (sitewide shell) |
| Install landing + Android/iOS/QR scripts | PASS | **Missing** |
| Practitioner / team / services / knowledge / practice share | PASS (markers + units) | Share runtime **404**; mounts not in deploy tip |
| Preferred GP share gated until save (A11Y-001) | PASS | N/A |

---

## 7. Test results

### Do not sum historical suite counts

| Label (historical Copilot / phase docs) | Meaning | Authority doc |
| --- | --- | --- |
| **77/77** | Phase 3A required bundle (~10 files) | `WMC-PHASE3A-QA-RELEASE-VALIDATION.md` |
| **111/111** | Phase 3B required bundle (~14 files) | `WMC-PHASE3B-QA-RELEASE-VALIDATION.md` |
| **128/128** | Phase 3D / Phase 4A T1 runnable bundle | `WMC-PHASE3D-QA-RELEASE-VALIDATION.md`, `WMC-PHASE4A-RELEASE-ACCEPTANCE.md` |
| **136/136** | Phase 4A-A recovery regression pack on restored UAT | `WMC-PHASE4A-A-RECOVERY-ACCEPTANCE.md` |

These suites **overlap**; totals must not be added.

### Commands (pattern)

Phase docs record focused `npx tsx --test <file list>` bundles under `apps/web`. Full gate: `npm test` from `apps/web` (DB-dependent golden/SEO suites need correct `DATABASE_URL`).

### Re-run this reconciliation (tip `f55b294`)

| Suite | Result |
| --- | --- |
| Focused Patient App + booking policy units (14 files) | **90/90 PASS** |
| Prior 4A-B validation on same lineage | Golden master **PASS** vs `wmc_uat`; full `npm test` **488/490** (2 SEO fails = Class B orphan fragment in local UAT DB — pre-existing) |
| Production `npm run build` this pass | **Not re-executed** — Prisma query engine locked by live UAT on `:3100`; prior 4A-B `uat:build` **PASS** documented |

A11Y-001 / 002 / 003: remediated on `f55b294` (`fbbe56b` + hub-scope `7cb5785`); confirmed on local UAT HTML.

---

## 8. Physical-device evidence gaps

| Gate | Status |
| --- | --- |
| T3 Android (Chrome + Samsung Internet) standalone | **OPEN** — checklist ready |
| T3 iPhone Safari A2HS + standalone | **OPEN** — checklist ready |
| Desktop QR / install bridge | Checklist ready; does **not** clear T3 |

Authority checklists (do not invent new process):

- `docs/WMC-PHASE4AB-DEVICE-VALIDATION-CHECKLIST.md`
- `docs/WMC-PHASE4AB-ACCEPTANCE-TEST-SCRIPT.md`

**Explicit blocker:** physical-device acceptance is **not** claimed from desktop emulation or unit tests.

### Concise real-device checklist (operator)

**Android & iPhone (each):** open staging/UAT origin after Patient App deploy → install / Add to Home Screen → cold-launch standalone → confirm icon + `display-mode` → Patient Hub → set Preferred GP → kill app → relaunch → GP persists → Book / Call per Mary phone-only & Tanya insurance → Practice Information Hub → share one practitioner + one service page → Digital Reception opens. Capture dated screenshots. Fail closed if hub 404.

---

## 9. Missing release files or commits

**Missing from Hostinger tip `59b5278` (high level):** entire Patient App commit series from Phase 3A through 4A-B on the acceptance branch (71 commits vs merge-base), including notably:

- Phase 3A hub / preferred GP / booking / DR wiring  
- Phase 3B install experience  
- Phase 3C Practice Information Hub  
- Phase 3D share core + surfaces  
- Phase 4A / 4A-A / 4A-B docs + **A11Y-001/002/003** code  

**Also required for live hub routes:** CMS/DB publish (or fixture import) of Class B pages (`patient-hub.html`, `practice-information-hub.html`, `install-wmc-app.html`) into the **staging** Supabase project — code alone is insufficient if pages are not in `pages`/`page_revisions`.

**Missing from acceptance tip `f55b294`:** the 71 Hostinger-only Master QA commits (must be preserved in any integration).

---

## 10. Final SHA and deployment recommendation

| Item | Recommendation |
| --- | --- |
| Do **not** redeploy `59b5278` as-is for Patient App | Patient App is not present |
| Do **not** deploy raw `f55b294` over staging | Would omit Master QA / V4 / Passenger fixes |
| Next approved engineering move | Integrate Patient App onto **`59b5278` ancestry** (merge/rebase), resolve conflicts preserving Master QA + Trust Facts + booking rules, import/publish Class B pages to staging DB, local `uat:build` + focused tests, then **owner-approved** Hostinger deploy |
| Physical T3 | Run after staging carries hub; keep evidence blocker until filed |
| Push / deploy this pass | **Not performed** |

**Working SHAs to cite**

- Acceptance verified: **`f55b294`**  
- Staging deployed today: **`59b5278`**  
- Shared ancestor: **`ec71759`**  
- Recovery baseline within accept line: **`269df5a`**

---

## Final verdict

### PATIENT APP VERIFIED — RELEASE INTEGRATION REQUIRED

Local acceptance tip **`f55b294`** verifies Phases 3A–3D + 4A-B (including A11Y majors) on UAT. Current staging **`59b5278`** does **not** include those Patient App routes/assets. Histories have diverged; a careful integration onto the Hostinger tip is required before any deploy. Physical T3 evidence remains an explicit post-deploy gate and must not be claimed from desktop tests.
