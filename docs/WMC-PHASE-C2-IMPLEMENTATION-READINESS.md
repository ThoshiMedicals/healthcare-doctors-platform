# WMC — Phase C2 implementation readiness

**Date:** 2026-11-13  
**Scope:** Documentation / verification only — **no** migrations, subscriptions, push sending, Hostinger env changes, DNS or HotDoc changes.  
**Authority:** `PROJECT_SPEC.md`, `docs/WMC-PATIENT-APP-MASTER-ROADMAP.md`, `docs/WMC-PHASE-C0-*.md`, Cursor rules.  
**Staging code tip (live):** `fdcb9c4e6f3977fed26b68ac569def825443a23e` (M1+M2 verified)  
**C0 architecture status:** READY — IMPLEMENTATION APPROVAL REQUIRED (unchanged; still not authorising build)

---

## Final verdict

### **PHASE C2 BLOCKED — SPECIFIC PREREQUISITES**

The C0 design pack is sufficient to **request** implementation approval, but Phase C2 (live schema + wiring toward general-practice announcements) must **not** start until the BLOCKED items below are cleared by the owner. Code-only prep tasks may proceed only where listed as PASS under “code-only without separate approval.”

---

## 1. M1/M2 closeout (context for C2)

| Check | Status | Evidence |
| --- | --- | --- |
| Hostinger archive matches intended SHA | **PASS** | Build `01a1d286-…` from `wmc-patient-journey-m1-m2-fdcb9c4.zip` |
| Live Patient Hub shows M1 Care Hub | **PASS** | `Prepare for Your Visit` + `#wmc-care-hub` on staging |
| Branch + evidence on GitHub | **PASS** | `origin/feat/wmc-patient-journey-m1-m2` @ `cfafefc` (contains `fdcb9c4`) |
| Release ZIP preserved | **PASS** | `backups/WMC-release-archives/wmc-patient-journey-m1-m2-fdcb9c4.zip` (+ `.sha256`) |
| Rollback ZIP preserved | **PASS** | `backups/WMC-release-archives/wmc-c1-patient-journey-fc73b11.zip` |
| M3–M5 / 17-concept register | **PASS** | Deferred/conditional rows unchanged; decisions intact |

---

## 2. Prerequisites checklist (live announcements)

| # | Prerequisite | Status | Notes |
| --- | --- | --- | --- |
| C2-P01 | Verified staging DB **backup** procedure documented and exercised | **BLOCKED** | Staging historically proceeded under a temporary backup-risk exception (`WMC-MASTER-QA-HOSTINGER-STAGING-DEPLOYMENT-ACCEPTANCE.md`). Independent off-box Supabase dump + restore drill still **outstanding**. |
| C2-P02 | Staging DB **restore** drill proven (restore to throwaway DB / branch) | **BLOCKED** | Required before any Prisma migrate on `wmc-hostinger-staging` (`thwcxuhrzgkufvdrvzzt`). |
| C2-P03 | Proposed schema migrations + rollback plan signed | **PASS (design)** / **BLOCKED (execute)** | Design in `WMC-PHASE-C0-DATABASE-SCHEMA.md`. Additive migrate only; rollback = restore dump + `prisma migrate resolve` procedure (must be written into runbook before apply). |
| C2-P04 | Staff authentication / Auth.js on staging hostnames | **BLOCKED** | Known custom-hostname callback defect; must be fixed before Engagement Admin staff UAT (`WMC-PHASE-C0-PRIVACY-SECURITY-APPROVALS.md` §3). |
| C2-P05 | Staff permissions + approval workflow (draft → approve → publish → retract) | **PASS (spec)** / **BLOCKED (implement)** | Roles/`CmsAction` map in C0 schema §4; two-person rule for promo. Needs implementation approval. |
| C2-P06 | Notification consent + unsubscribe records (APP7 / Spam Act) | **BLOCKED** | Privacy/legal PIA + public notice text not signed (`WMC-PHASE-C0-PRIVACY-SECURITY-APPROVALS.md` §2, §5). |
| C2-P07 | Secure subscription storage + retention | **PASS (design)** / **BLOCKED (implement)** | Endpoint hashing, status lifecycle, retention table in C0 schema §5 — confirm with privacy adviser before migrate. |
| C2-P08 | Web Push infrastructure + SW compatibility plan | **PASS (design)** / **BLOCKED (implement)** | Extend existing `/sw.js`; VAPID in env only; feature flag default **off**. No keys generated in this task. |
| C2-P09 | Staff sending limits + duplicate prevention | **PASS (design)** / **BLOCKED (implement)** | One `DeliveryJob` per subscription per announcement; rate limits on public subscribe APIs (C0 modular C4/C7). |
| C2-P10 | Privacy, marketing and clinical governance approvals | **BLOCKED** | Clinical lead / privacy / security / principal / implementation gates all ☐ in C0 pack. |
| C2-P11 | Physical iPhone + Android test plan for push + inbox | **PASS (plan)** / **BLOCKED (execute)** | Roadmap §7 + C0 C8; execute only after staging flag-on pilot approval. |
| C2-P12 | Operational costs + monitoring baseline | **PASS (estimate)** / **BLOCKED (accept)** | `WMC-PHASE-C0-INFRASTRUCTURE-COST-ESTIMATES.md` — owner must accept incremental Hostinger/Supabase/ops cost before go-live. |
| C2-P13 | Written **implementation approval** for C2 start | **BLOCKED** | Owner signature required; this document does not authorise build. |
| C2-P14 | Production / DNS / apex cutover | **BLOCKED (out of scope)** | Remains NO-GO; C2 staging only even after approval. |

---

## 3. Proposed schema migration & rollback (design — do not execute)

**Forward (after C2-P01/P02/P13 PASS):**

1. Take verified Supabase logical backup (e.g. `pg_dump` / dashboard backup) of `wmc-hostinger-staging`; store **off-box**; record SHA-256 + timestamp.  
2. Optional: create Supabase preview branch or restore dump to a scratch DB and dry-run migrate.  
3. Apply **additive** Prisma migration from `WMC-PHASE-C0-DATABASE-SCHEMA.md` (DeviceInstallation, PushSubscription, ConsentRecord, Announcement*, DeliveryJob, EngagementEvent, PreferenceTopic, StaffApproval fields / CmsAction extensions).  
4. Seed preference topics only; **no** patient PHI; feature flag `engagementPushEnabled=false`.  
5. Smoke: `/api/health`, Patient Hub, C1 lab routes, admin login.

**Rollback:**

1. Stop workers / keep flag off.  
2. Restore database from the pre-migrate dump (preferred) **or** reverse migration only if explicitly reviewed and data-safe.  
3. Redeploy prior app archive if schema/app mismatch (`wmc-patient-journey-m1-m2-fdcb9c4.zip` or earlier).  
4. Confirm health + hub + no orphan push registration calls.

---

## 4. Code-only vs approval-gated

| Work | Allowed now (docs / inert code after separate “code-only C2 prep” approval)? | Requires separate approval |
| --- | --- | --- |
| Update roadmap / readiness docs | **Yes** (this task) | — |
| C1 lab UI polish (still dummy, no DB) | Code-only if owner asks | Not live push |
| Prisma schema **files** in repo without migrate | Only with explicit owner “schema draft” approval | Applying migrate = C2-P13 |
| Feature-flag stubs that never call `pushManager.subscribe` | Possible behind flag after approval | Enabling flag / VAPID in Hostinger |
| Live subscribe API, ConsentRecord writes | **No** | C2-P06 + C2-P13 |
| Delivery worker / Web Push send | **No** | C2-P08–P11 + pilot approval |
| CMS publish of real announcements | **No** | Clinical + C2-P05 |
| Hostinger env VAPID keys | **No** | Security + C2-P13 |
| Production enablement | **No** | Full C0 §5 production gate |

---

## 5. Exact owner-controlled approvals required

| Gate | Owner | Required before |
| --- | --- | --- |
| Staging backup + restore drill complete | Ops / owner | Any migrate |
| Privacy / legal (APP7, Spam Act, notice text, retention) | Adviser + principal | Consent schema + patient UI |
| Clinical lead — content classes & HotDoc boundary | Clinical lead | Any announcement copy / publish path |
| Security — VAPID, Auth.js hostname, API abuse | Tech + adviser | Subscribe / admin UAT |
| Implementation approval — start C2 engineering | Owner | First C2 code/migrate |
| Staging pilot (flag-on, limited devices) | Practice manager | Physical device push tests |
| Production enablement | Owner + clinical | Apex / prod project (later) |

---

## 6. Small implementation tasks (next authorised stage only)

Execute **only after** C2-P01, C2-P02, C2-P04 (or accepted workaround), C2-P06/P10 gates, and **C2-P13** are signed.

1. **C2-A** — Write staging backup/restore runbook + complete one restore drill; attach evidence.  
2. **C2-B** — Add Prisma models (additive) + empty migrate on staging; seed topics; flag off.  
3. **C2-C** — Wire empty/honest Engagement Admin + patient preference shells to empty tables (replace C1 dummy metrics gradually).  
4. **C2-D** — Consent append-only API + unsubscribe (no push yet).  
5. **C2-E** — Subscription lifecycle behind flag; rate limits; endpoint hashing.  
6. **C2-F** — Delivery queue (still dry-run / no send until pilot).  
7. **C2-G** — Physical Android + iPhone matrix when flag-on pilot approved.

Sequence aligns with `docs/WMC-PHASE-C0-MODULAR-TASKS.md` modules C2→C8.

---

## 7. References

- `docs/WMC-PHASE-C0-NOTIFICATION-ARCHITECTURE.md`  
- `docs/WMC-PHASE-C0-DATABASE-SCHEMA.md`  
- `docs/WMC-PHASE-C0-PRIVACY-SECURITY-APPROVALS.md`  
- `docs/WMC-PHASE-C0-ENGAGEMENT-ADMIN-UI.md`  
- `docs/WMC-PHASE-C0-PATIENT-NOTIFICATION-UI.md`  
- `docs/WMC-PHASE-C0-INFRASTRUCTURE-COST-ESTIMATES.md`  
- `docs/WMC-PHASE-C0-MODULAR-TASKS.md`  
- `docs/WMC-PHASE-C1-UI-FOUNDATION-REPORT.md`  
- `docs/WMC-PATIENT-JOURNEY-M1-M2-STAGING-REPORT.md`  

**Verdict recorded: PHASE C2 BLOCKED — SPECIFIC PREREQUISITES**
