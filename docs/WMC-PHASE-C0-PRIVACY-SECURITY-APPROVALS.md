# WMC — Phase C0 privacy, security and clinical approval requirements

**Required before any push implementation or production enablement.**

---

## 1. Clinical boundary (non-negotiable)

| Allowed in WMC engagement MVP | Must remain HotDoc / clinical systems |
| --- | --- |
| Public holiday hours, closures | Appointment reminders |
| Parking / access disruptions | Recalls, results, prescriptions |
| Welcoming a new GP (public) | Individual follow-up |
| Optional educational articles (consented) | Symptom triage messaging |
| Optional promotional practice news (consented) | Anything identifying a patient |

**Never push-only** for urgent or safety-critical individual care. Escalation = phone / in-person / HotDoc clinical workflows.

---

## 2. Australian privacy & marketing consent

Seek formal advice from the practice’s privacy/legal adviser covering at least:

| Topic | Why |
| --- | --- |
| APP 1–11 applicability | Collection notice, use, disclosure, security, access, retention |
| APP 7 Direct marketing | Browser permission alone may be insufficient for promo |
| Spam Act 2003 | Commercial electronic messages; unsubscribe; sender identity |
| Health information | Avoid collecting health info in engagement tables |
| Cross-border disclosure | If any push vendor / analytics processor overseas |
| Children / capacity | Clinic may see minors’ devices — conservative defaults |
| Breach response | Subscription endpoint leakage treated as credential-like |

**Deliverable before build:** signed Privacy Impact Assessment (lightweight OK) + updated public privacy wording for engagement.

---

## 3. Security requirements

| Control | Requirement |
| --- | --- |
| Secrets | VAPID private key in Hostinger env; rotation runbook |
| AuthN/Z | Auth.js staff only for admin; clinic scope on every query |
| Public APIs | Rate limits, same-origin, abuse monitoring |
| Encryption | TLS everywhere; consider encrypting endpoint at rest |
| Logging | No full push endpoints in application logs or support exports |
| Audit | Staff publish/retract/approve → `AuditLog` |
| Staging isolation | Separate VAPID + DB from future production |
| Dependency review | `web-push` (or chosen lib) version pin + npm audit policy |
| SW integrity | Subresource integrity / strict update path; no remote SW hosting |

Known defect: Auth.js callback on custom staging hostname — **must be remediated before staff UAT of Engagement Admin**.

---

## 4. Data minimisation

Collect only:

- Opaque installation key  
- Push subscription material  
- Consent + preference flags  
- Coarse platform hint  
- Announcement content (public)  
- Device-scoped engagement events  

Do **not** collect: patient name, phone, email, Medicare, HotDoc IDs, GP notes, appointment payloads.

---

## 5. Approval checklist (sign-off table)

| Gate | Owner | Status |
| --- | --- | --- |
| Clinical lead — content classes & HotDoc boundary | Practice clinical lead | ☐ |
| Privacy / legal — APP7 / Spam / notice text | Adviser | ☐ |
| Security review — architecture & keys | Tech + adviser | ☐ |
| Practice principal — promo consent wording | Principal | ☐ |
| Implementation approval — engineering start | Owner | ☐ |
| Staging pilot approval | Practice manager | ☐ |
| Production enablement approval | Owner + clinical | ☐ |

---

## 6. Accessibility & fairness

- Notices available without push (inbox + website)  
- Plain-language consent  
- No dark patterns / forced opt-in before booking  
- Support path for patients who cannot install (reception script)

---

## 7. Residual risks (accept or mitigate)

| Risk | Mitigation |
| --- | --- |
| Patient assumes push = clinical recall | Explicit copy; HotDoc remains SoT |
| Shared household phone | Device-scoped only; no identity claims |
| Stale hours in offline cache | Prefer online fetch for announcement body; short TTL |
| Staff mis-publish promo | Two-person approval; retract |
