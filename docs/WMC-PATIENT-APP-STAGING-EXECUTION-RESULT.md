# WMC Patient App — Staging Execution Result

**Date:** 2026-11-12  
**Authority:** Owner Option A staging-only exception (no full PostgreSQL backup)  
**Verdict:** **PATIENT APP DEPLOYED — HOSTINGER STAGING VERIFIED**

---

## 1. Final deployed Git SHA

`6d92b4fae614ebfcb13ba21a7e38a0c7d6280bcd`

Archive: `wmc-patient-app-hostinger-integration-6d92b4f.zip`  
Not substituted with ancestor `9c928de`.

## 2. Hostinger build UUID

`01a1ce26-6ae6-73a5-8624-453668ad69f6`

- Domain: `mediumslateblue-eagle-960503.hostingersite.com`
- Source: archive `wmc-patient-app-hostinger-integration-6d92b4f.zip`
- State: **completed** (published + restarted)
- Prior recoverable build retained as rollback archive: `wmc-static-cdn-repair-59b5278.zip` (build `01a1cda4-…`)

## 3. Release ZIP SHA-256 verification

| Item | Value |
| --- | --- |
| Expected | `4FEE14FE6B13CBD13987FE3C72EBC974C7EE3A4B7C4D77AC11ADE2EE5FB3A6C4` |
| Actual | `4FEE14FE6B13CBD13987FE3C72EBC974C7EE3A4B7C4D77AC11ADE2EE5FB3A6C4` |
| Match | **PASS** |

## 4. Owner Option A exception recorded

Explicit one-time staging-only authorisation accepted:

- Staging deploy without full PostgreSQL backup
- Additional staging DB recovery risk accepted
- Hostinger staging deploy of approved release
- Staging publication of exactly three Patient App pages
- Transaction-safe publication + targeted rollback IDs
- **Does not extend to production**

## 5. Database before / after counts

Target project: `thwcxuhrzgkufvdrvzzt` (`wmc-hostinger-staging`)  
Clinic: `clinic_woolloongabba` (slug `woolloongabba`)

| Metric | Before | After |
| --- | ---: | ---: |
| `pages` | 227 | **230** |
| Published patient-app paths | 0 | **3** |
| Published practitioners | 15 | **15** |
| `join-our-team%` pages | 11 | **11** |

Preferred GP fragment page was **not** created.

## 6. Inserted row IDs and fixture hashes

| Path | Page ID | Revision ID | Nav ID | Fixture SHA-256 |
| --- | --- | --- | --- | --- |
| `patient-hub.html` | `page_patient_hub_6d92b4f` | `prev_patient_hub_6d92b4f` | `nav_patient_hub_6d92b4f` | `5dda7896bc62c308d22f981844555a180a6dd2f651a1ec05e0efd085cd1588fa` |
| `practice-information-hub.html` | `page_practice_info_hub_6d92b4f` | `prev_practice_info_hub_6d92b4f` | `nav_practice_info_hub_6d92b4f` | `fbe0c9ba2e6346bcc8e495f4228227da8f48f2db8f478f8e2ff498cfe1a6d7d6` |
| `install-wmc-app.html` | `page_install_wmc_app_6d92b4f` | `prev_install_wmc_app_6d92b4f` | `nav_install_wmc_app_6d92b4f` | `71c35e0bf0e4d07d59b37e55576b5aad376311b2205de2eb5cf1a0128a8eda9c` |

All three revisions: `immutable=true`, pages `published`, `indexable=false`, robots `noindex,nofollow,noarchive`.  
Nav ownership: `section_key=patient-info`; hub flag true only on patient-hub.

Publication used path-scoped staging-only SQL (scratch transfer + single assemble transaction with pre/post guards). Temporary scratch table cleared after assemble.

## 7. Three-page live verification

Cache invalidation: `POST /api/staging/public-cache-bust` with `{"confirm":"invalidate-public-html-only"}` → `ok:true` on both hosts.

| Path | hostingersite | staging.gabbamedicalcentre.com.au |
| --- | --- | --- |
| `/patient-hub.html` | **200** | **200** |
| `/practice-information-hub.html` | **200** | **200** |
| `/install-wmc-app.html` | **200** | **200** |

`/api/health` both hosts: `database: up`.

## 8. Preferred GP persistence verification

Browser evidence on `https://staging.gabbamedicalcentre.com.au/patient-hub.html`:

1. `#preferred-gp-panel` / “My preferred GP” present
2. Selected **Dr James Chanaka** (`dr-james`)
3. Saved via **Save on this device**
4. After full reload, panel still shows **Dr James Chanaka** with Change / Remove / Share controls

Storage hook asset present: `/wmc-cache/patient-preferred-gp.js?v=wmc-preferred-gp-20261112a` (`wmc.preferredGp.v1`).

## 9. Booking and Digital Reception results

| Check | Result |
| --- | --- |
| Digital Reception controls on Patient App pages | Present (`data-open-digital-reception` / Open Digital Reception) |
| Mary (`dr-mary-abadir`) | `booking_url=null` (PHONE_ONLY authority); page 200; phone CTA present; no practitioner HotDoc book button |
| Tanya | HotDoc URL retained with insurance slug; booking notice present |
| Golnar / James / Yamesha | Profiles 200; online booking affordances retained per existing configs |
| All 15 practitioner doctor pages | Still published / sampled 200 |

No practitioner rows, booking policies, or recruitment HOLD content were modified by this publication.

## 10. PWA and sharing results

| Asset / feature | Result |
| --- | --- |
| `manifest.webmanifest` | 200 |
| `sw.js` | 200 |
| Install page QR / Android / iOS mounts | Present |
| `patient-share.js` | Served via cache-busted path |
| Share my preferred GP control | Present after save |
| Physical Android / iPhone install | **Not claimed** (no device evidence this run) |

## 11. Dual-hostname noindex results

Both hosts return `X-Robots-Tag: noindex, nofollow, noarchive` on home and Patient App pages.  
Env keys preserved (masked list): `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `AUTH_TRUST_HOST`, `DEFAULT_CLINIC_SLUG`, `STAGING_NOINDEX`, `PRIVATE_OBJECT_STORE`. No env replace performed.

## 12. Auth.js known issue status

**Still open (documented only; env not changed):**

- `/api/auth/providers` on **both** staging hostnames advertises  
  `signinUrl` / `callbackUrl` under  
  `https://mediumslateblue-eagle-960503.hostingersite.com/...`
- Access via `staging.gabbamedicalcentre.com.au` therefore inherits the dual-hostname Auth.js callback defect until a coordinated `AUTH_URL` / trust-host fix is authorised separately.

## 13. Android / iPhone physical evidence status

**NOT PASSED / NOT EXECUTED** — no physical device evidence captured in this execution.

## 14. Rollback readiness

| Layer | Status |
| --- | --- |
| App archive rollback | `wmc-static-cdn-repair-59b5278.zip` preserved on Hostinger storage / prior completed build |
| Targeted DB rollback IDs | Recorded above (3 pages + 3 revisions + 3 nav ownership rows only) |
| Full DB restore | Not used (Option A); not required |
| Production | Untouched |

## 15. Remaining production launch blockers

Unchanged / still blocking apex production cutover (not this staging release):

- No production Supabase project / production Hostinger cutover GO
- DNS remains on WordPress apex until signed cutover
- Staging Auth.js dual-hostname callback defect
- Physical mobile device certification still incomplete for Patient App
- Formal production backup / smoke / Cloudflare Full (strict) ops per `deployment/LAUNCH.md` and Hostinger production readiness docs

---

## Safety gate summary (pre-execution)

1. Target staging project `thwcxuhrzgkufvdrvzzt` — PASS  
2. ZIP SHA-256 — PASS  
3. Prior Hostinger archive recoverable — PASS  
4. Three paths absent pre-publish — PASS  
5. Counts recorded (227 / 15 / 11) — PASS  
6. Fixture SHA-256 vs manifest — PASS  
7–9. Path-scoped publisher / assemble guards + allowlist — PASS (staging-only SQL path)  
10. No concurrent conflicting agent on same deploy during publish — PASS (this execution owned the Hostinger build + DB writes)

---

## Final verdict

**PATIENT APP DEPLOYED — HOSTINGER STAGING VERIFIED**
