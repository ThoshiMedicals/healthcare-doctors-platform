# WMC — Phase C2 clinical & security approval pack

**Date:** 2026-11-13  
**Status:** Draft for clinical lead + security reviewer + owner sign-off.  
**Companion:** Privacy pack `WMC-PHASE-C2-PRIVACY-CONSENT-APPROVAL-PACK.md`; architecture `WMC-PHASE-C0-*.md`.

**Sign-off status:** ☐ Clinical lead · ☐ Security reviewer · ☐ Practice principal · ☐ Owner

---

## 1. HotDoc’s existing role (unchanged)

| Function | System of record |
| --- | --- |
| Appointment booking | HotDoc (lightbox / approved links; phone-only exceptions preserved) |
| Appointment reminders | HotDoc |
| Clinical recalls / results workflows | HotDoc / clinical systems |
| Practitioner booking restrictions (insurance, etc.) | Existing HotDoc slug + WMC notice inject |

**Rule:** Engagement copy must never instruct patients to ignore HotDoc reminders or imply the Patient App replaces clinical messaging.

---

## 2. Permitted initial announcements (general practice)

Allowed when consented and staff-approved:

- Clinic holiday / changed hours  
- Unexpected closure or delayed opening  
- Access / parking / entry disruptions  
- Public practice news already suitable for the website (e.g. welcoming a new GP — no private clinical claims)  
- Optional education: link to **published** Trust Facts / knowledge pages only  
- Optional promotional practice news (separate promo consent + two-person approval)

All content must remain accurate against Trust Facts / CMS — no invented clinical claims.

---

## 3. Prohibited content (initial system)

| Prohibited | Why |
| --- | --- |
| Appointment reminders / “your booking is…” | HotDoc SoT; identity risk |
| Results, recalls, prescriptions, care plans | Clinical / health information |
| Symptom triage, “if you have X do Y” personal advice | Clinical risk |
| Named-patient or identifiable follow-up | Identity + privacy |
| Urgent safety-critical **push-only** alerts | Require phone / in-person / established clinical channels |
| Fees that contradict Trust Facts | Governance |
| Anything requiring patient identity verification | Future Phase F only |

---

## 4. VAPID key handling and security

| Control | Requirement |
| --- | --- |
| Generation | On secure operator machine; never commit private key |
| Storage | Hostinger env only (e.g. `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`); staging ≠ production keys |
| Client | Public key only in browser |
| Rotation | Documented runbook; re-subscribe path |
| Access | Limit who can read Hostinger env |
| Logging | Never log private key or full subscription auth secrets |

No VAPID keys are generated in this documentation pass.

---

## 5. Staff access and approval separation

Reuse Auth.js CMS roles; extend `CmsAction` per C0 schema:

| Action | Who |
| --- | --- |
| Draft | content editors |
| Approve | practice approver / clinic admin (**promo: approver ≠ author**) |
| Publish / schedule / retract | publisher / clinic admin |
| View metrics | clinic admin / approver / publisher |
| Subscriber hygiene | clinic admin only (no PHI export of endpoints) |

All transitions → `AuditLog`. Clinic scope on every query. Staff UAT blocked until Auth.js hostname gate cleared (`WMC-PHASE-C2-AUTHJS-STAGING-HOSTNAME-REPAIR.md`).

---

## 6. Delivery failures and fallback

| Failure | Patient experience | Staff |
| --- | --- | --- |
| Permission denied | Inbox + website announcements still available | Honest metrics |
| Push rejected / 410 Gone | Mark subscription invalid; no retry storm | Hygiene job |
| Worker down | Queue retains jobs; flag keeps send off until healthy | Monitor |
| Urgent clinical need | **Do not use push** — call clinic pathways | Reception script |

Labels must distinguish **push accepted** ≠ **patient understood**.

---

## 7. Abuse prevention and rate limiting

- Public subscribe/unsubscribe rate limits (IP + installation key).  
- One `DeliveryJob` per subscription per announcement.  
- Feature flag `engagementPushEnabled` default **off**.  
- No permission prompt on page load.  
- Payload size limits; no attachment of clinical documents.  
- Staging isolated DB + VAPID from future production.

---

## 8. Required sign-offs

| Gate | Owner | Signs that… |
| --- | --- | --- |
| Clinical lead | Practice clinical lead | Permitted/prohibited classes; HotDoc boundary accepted |
| Security | Tech + adviser | VAPID, Auth.js, API abuse, logging, staging isolation acceptable |
| Principal | Practice principal | Promo approval workflow and patient-facing claims |
| Owner | Programme owner | Implementation may start only after C2 matrix backups + Auth + privacy packs cleared |

---

## 9. Residual clinical/security risks

| Risk | Mitigation |
| --- | --- |
| Patient confuses app push with HotDoc recall | Explicit copy; staff training |
| Shared device shows practice news | Device-scoped; no identity language |
| Staff mis-publish | Two-person promo; retract; audit |
| Endpoint leakage | Credential-like handling; hashed logs |

---

## 10. Approval request

Sign this pack **and** the privacy pack before any subscribe API, VAPID env injection, or delivery worker enablement. Draft documents alone do **not** mark C2-P10 PASS.
