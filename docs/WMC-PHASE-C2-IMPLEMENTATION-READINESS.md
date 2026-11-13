# WMC — Phase C2 implementation readiness

**Updated:** 2026-11-13 (blocker resolution pack)  
**Scope:** Documentation / diagnosis only — **no** migrations, subscriptions, push send, unapproved env/auth changes, DNS or HotDoc changes.  
**Staging code tip:** `fdcb9c4e6f3977fed26b68ac569def825443a23e` · build `01a1d286-…`  
**C0 architecture:** READY — IMPLEMENTATION APPROVAL REQUIRED (design intact)

---

## Final verdict

### **C2 TECHNICAL GATES BLOCKED — EXACT REMAINING ISSUE**

**2026-11-13 execution attempt:** P01/P02/P04 could not be completed.  
**Exact remaining issue:** Staging Direct Postgres credentials and `pg_dump`/Docker tooling are unavailable to the agent; Hostinger env values remain masked. See `docs/WMC-PHASE-C2-TECHNICAL-GATES-P01-P02-P04-ATTEMPT.md`.

Governance packs remain ready for signature; **no gate is PASS without evidence.**

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
| **C2-P01 Staging DB backup** | Identity PASS (`thwcxuhrzgkufvdrvzzt`); inventory 230 pages / 15 practitioners / 29 migrations; **no dump file** — credential + tooling gap | **BLOCKED** | Operator: private-shell Direct URL + `pg_dump`/`supabase db dump` + SHA-256 per runbook / `STAGING-OFFBOX-BACKUP-OPERATOR-STEPS.md` | Provide staging DB URL in private shell only (not chat) | Attach path + sizes + checksums |
| **C2-P02 Isolated restore drill** | Not started (blocked by P01); no disposable DB | **BLOCKED** | After P01: restore to local disposable Postgres or throwaway project; verify counts; dispose | Approve disposable target | Never restore into live staging |
| **C2-P04 Auth.js staging hostname** | Diagnosis PASS; **repair not applied** (gated behind P01+P02); defect still live | **BLOCKED** | After P01+P02: remove `AUTH_URL`, keep `AUTH_TRUST_HOST=true`; smoke both hosts | Approve Hostinger env full-replace with real secrets | Staff login verification |
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
