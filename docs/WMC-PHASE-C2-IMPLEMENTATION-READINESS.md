# WMC — Phase C2 implementation readiness

**Updated:** 2026-11-13 (blocker resolution pack)  
**Scope:** Documentation / diagnosis only — **no** migrations, subscriptions, push send, unapproved env/auth changes, DNS or HotDoc changes.  
**Staging code tip:** `fdcb9c4e6f3977fed26b68ac569def825443a23e` · build `01a1d286-…`  
**C0 architecture:** READY — IMPLEMENTATION APPROVAL REQUIRED (design intact)

---

## Final verdict

### **C2 GATE RESOLUTION — READY FOR OWNER APPROVAL**

Technical unknowns for the five primary blockers are resolved into **actionable owner requests** and evidence criteria.  
**No gate is marked PASS solely because a draft exists.** Execution gates (backup taken, Auth env fixed, signatures collected, implementation authorised) remain **BLOCKED** until the owner completes the listed actions.

---

## 1. M1/M2 baseline (unchanged)

| Check | Status | Evidence |
| --- | --- | --- |
| Hostinger = `fdcb9c4` | **PASS** | Archive + build `01a1d286-…` |
| GitHub branch pushed | **PASS** | `feat/wmc-patient-journey-m1-m2` |
| Release / rollback archives | **PASS** | `Desktop/backups/WMC-release-archives/` |

---

## 2. Final readiness matrix

| Blocker | Evidence now | Status | Exact corrective action | Owner-controlled approval | Remaining technical work (after approval) |
| --- | --- | --- | --- | --- | --- |
| **C2-P01 Staging DB backup** | Project `thwcxuhrzgkufvdrvzzt` ACTIVE_HEALTHY; prior backup **exception** still on record; runbook written | **BLOCKED** | Execute off-box `pg_dump` + hash + `pg_restore --list` per `WMC-PHASE-C2-STAGING-DB-BACKUP-RESTORE.md` | Approve taking staging logical dump | Attach evidence pack to flip PASS |
| **C2-P02 Isolated restore drill** | Procedure Option A/B/C documented; **not executed** (no throwaway DB created — cost/safety) | **BLOCKED** | Restore dump into **non-staging** target only; record logs; tear down | Approve throwaway project / paid branch / local Docker drill | Prove restore; never restore into live staging |
| **C2-P04 Auth.js staging hostname** | Live re-verify: custom `/api/auth/signin` → `callbackUrl` **hostingersite**; root cause = pinned `AUTH_URL` + production origin helper null | **BLOCKED** (diagnosis **PASS**) | Prefer **remove `AUTH_URL`**, keep `AUTH_TRUST_HOST=true`; smoke T1–T7 | Approve Hostinger env full-replace **excluding** `AUTH_URL` (no masked copy) | Owner login smoke on both hosts; optional later code allowlist |
| **C2-P06 Privacy / consent / Spam** | Approval pack drafted | **BLOCKED** | Adviser + principal review/sign `WMC-PHASE-C2-PRIVACY-CONSENT-APPROVAL-PACK.md` | Privacy/legal + principal signatures | Then implement consent APIs (C3) under C2-P13 |
| **C2-P10 Clinical + security governance** | Clinical/security pack drafted | **BLOCKED** | Clinical lead + security + principal sign `WMC-PHASE-C2-CLINICAL-SECURITY-APPROVAL-PACK.md` | Clinical / security / principal signatures | Then roles, VAPID env, worker (still flag-off until pilot) |
| C2-P03 Schema migrate plan | C0 schema + backup/rollback runbook | **PASS (design)** / **BLOCKED (execute)** | Additive migrate only after P01/P02/P13 | Implementation approval | Prisma migrate staging |
| C2-P05 Staff workflow | C0 admin UI + CmsAction map | **PASS (spec)** / **BLOCKED (implement)** | Build after Auth + P13 | Implementation approval | Engagement Admin |
| C2-P07 Subscription storage | C0 retention design | **PASS (design)** / **BLOCKED (implement)** | Confirm retention with privacy pack | Privacy sign-off | Subscribe APIs |
| C2-P08 Web Push / SW | C0 architecture | **PASS (design)** / **BLOCKED (implement)** | Extend SW; VAPID in env; flag off | Security + P13 | C4/C7 modules |
| C2-P09 Send limits / dedupe | C0 modular C4/C7 | **PASS (design)** / **BLOCKED (implement)** | One job per sub; rate limits | Implementation approval | Worker |
| C2-P11 Device tests | Roadmap + C0 C8 | **PASS (plan)** / **BLOCKED (execute)** | Physical iPhone/Android matrix | Pilot approval | After flag-on |
| C2-P12 Costs | C0 cost estimates | **PASS (estimate)** / **BLOCKED (accept)** | Owner accept incremental cost | Owner | Monitoring |
| **C2-P13 Implementation approval** | Readiness + packs | **BLOCKED** | Written “start C2 engineering” | **Owner** | Unlock code/migrate |
| C2-P14 Production / DNS | Cutover NO-GO | **BLOCKED (N/A for C2 staging)** | Separate cutover programme | Owner + clinical | Not in C2 |

---

## 3. Specific approval requests (owner action list)

1. **Backup:** Authorise and perform staging logical dump + integrity checks; file evidence → C2-P01.  
2. **Restore drill:** Authorise isolated restore (throwaway project / local Docker); file evidence → C2-P02.  
3. **Auth.js:** Authorise Hostinger env change — remove `AUTH_URL`, keep `AUTH_TRUST_HOST=true`; complete smoke including staff login → C2-P04.  
4. **Privacy:** Send privacy pack to qualified adviser; principal accepts patient-facing copy → C2-P06.  
5. **Clinical/security:** Clinical lead + security reviewer sign clinical/security pack → C2-P10.  
6. **Implementation:** Only then sign C2-P13 to start additive schema / inert wiring (still **no** live push until pilot approval).

---

## 4. Artefacts produced this pass

| Doc | Purpose |
| --- | --- |
| `docs/WMC-PHASE-C2-STAGING-DB-BACKUP-RESTORE.md` | Backup, integrity, isolated restore, recovery checklist |
| `docs/WMC-PHASE-C2-AUTHJS-STAGING-HOSTNAME-REPAIR.md` | Cause, Approach A/B, tests, env discipline |
| `docs/WMC-PHASE-C2-PRIVACY-CONSENT-APPROVAL-PACK.md` | APP / Spam / consent / retention / draft patient copy |
| `docs/WMC-PHASE-C2-CLINICAL-SECURITY-APPROVAL-PACK.md` | HotDoc boundary, permitted/prohibited, VAPID, roles, abuse |
| This file | Matrix + verdict |

---

## 5. Explicit non-actions (honoured)

No database writes/migrations · no Web Push · no subscriptions · no notification send · no Hostinger env replace · no DNS/production · no HotDoc changes · no Supabase branch create (cost).

---

## 6. What “done” looks like for engineering start

All of: **C2-P01 PASS · C2-P02 PASS · C2-P04 PASS · C2-P06 signed · C2-P10 signed · C2-P13 signed**, with feature flag default **off**. Then follow `WMC-PHASE-C0-MODULAR-TASKS.md` C2→C8.

**Verdict: C2 GATE RESOLUTION — READY FOR OWNER APPROVAL**
