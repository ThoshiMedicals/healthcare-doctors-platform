# WMC — Phase C2 privacy & consent approval pack

**Date:** 2026-11-13  
**Status:** Draft for **owner + qualified privacy/legal review** — not legal advice; not a signed PIA.  
**Scope:** General-practice **announcements** via Patient App / Web Push (device-scoped).  
**Authority:** `WMC-PHASE-C0-PRIVACY-SECURITY-APPROVALS.md`, C0 schema/architecture, Australian Privacy Principles (APPs), Spam Act 2003 (high-level).

**Sign-off status:** ☐ Privacy/legal adviser · ☐ Practice principal · ☐ Owner (accept pack for C2 build)

---

## 1. Purpose of processing

Woolloongabba Medical Centre may offer optional browser/PWA notifications and an in-app inbox for **clinic-scoped, non-clinical general announcements** (hours, access, public practice news, optional education/promo with separate consent).

**HotDoc remains** the system for appointments, clinical reminders and recalls. Engagement must not claim to replace HotDoc.

---

## 2. APP privacy considerations (practice checklist)

| APP theme | WMC engagement position | Reviewer note |
| --- | --- | --- |
| APP 1 — Open & transparent | Publish plain-language notice + link from consent UI and privacy page | Confirm wording |
| APP 2 — Anonymity / pseudonymity | Device `installationId` only; no login as patient | Confirm acceptable |
| APP 3 — Collection | Only opaque install key, push subscription material, consent/prefs, coarse platform, public announcement content, device events | Confirm no health info creep |
| APP 5 — Notification of collection | Show purpose, clinic identity, how to unsubscribe, retention summary at opt-in | Confirm |
| APP 6 — Use / disclosure | Use for sending consented announcement categories; disclose push vendor path (browser push services) | Confirm overseas disclosure text |
| APP 7 — Direct marketing | **Promotional** topics require **separate** opt-in; OS notification permission ≠ marketing consent | **Requires adviser sign-off** |
| APP 8 — Cross-border | Browser push may involve overseas infrastructure | Adviser: adequacy / notice |
| APP 11 — Security | TLS; hash/minimise endpoints in logs; staff Auth.js; rate limits | Align with security pack |
| APP 12–13 — Access / correction | Device-scoped; patient can unsubscribe/clear; limited “access” to subscription record via preference centre | Confirm process |

**Matters needing qualified legal/privacy review (do not treat as closed by this draft):**

1. Whether Web Push of promotional content is a “commercial electronic message” under the Spam Act and what consent standard applies.  
2. APP 7 interaction with browser permission + in-app toggles.  
3. Retention periods for consent history vs subscription keys.  
4. Minors / shared family devices.  
5. Breach classification if push endpoints leak.  
6. Final patient-facing privacy policy amendment text.

---

## 3. Marketing versus operational notifications

| Class | Examples | Consent layer | Staff rule |
| --- | --- | --- | --- |
| **Operational** | Holiday hours, unexpected closure, parking/entry disruption | L2 operational toggle + OS permission for push | Single publisher OK if role permits; still audit |
| **Practice news (public)** | New GP welcome (already public on website) | Prefer operational or practice-news topic; avoid clinical detail | Clinical lead may require review of copy |
| **Educational** | Link to published knowledge article | L3 educational opt-in | No diagnosis, no personal advice |
| **Promotional** | Events, non-essential campaigns | **Separate L3 promotional opt-in** | Approver ≠ author (two-person) |

Urgent individual clinical contact is **out of scope** — phone / in-person / HotDoc only.

---

## 4. Consent capture (proposed product behaviour)

1. Contextual CTA (never on every page load).  
2. Explain categories before OS prompt.  
3. Request `Notification` permission only after affirmative in-app step.  
4. Store `ConsentRecord`: channel, topics, policy version hash, `grantedAt` / `revokedAt`, clinic id, opaque installation id.  
5. Promotional and educational flags stored **independently** of operational.  
6. Versioned policy text; re-consent when material policy changes (adviser-defined).

---

## 5. Opt-out and withdrawal

| Path | Behaviour |
| --- | --- |
| One-tap unsubscribe in notification / inbox | Stops push; marks subscription unsubscribed; appends revoke consent |
| Preference centre | Per-topic off; operational vs promo independent |
| OS permission revoke | Treat as push disabled; keep inbox/website fallback |
| Public privacy page | Instructions + clinic phone for help |

Withdrawal must be as easy as opt-in (Spam Act / fair practice).

---

## 6. Data minimisation and retention (proposed — confirm with adviser)

**Collect:** opaque installation key; push endpoint + keys (protected); consent/prefs; coarse platform; public announcement bodies; device-scoped events (`push_accepted`, `inbox_opened`, etc.).

**Do not collect:** name, phone, email, Medicare, DOB, HotDoc patient id, appointment payloads, clinical notes, free-text symptoms.

| Data | Proposed retention |
| --- | --- |
| Active subscriptions | Until unsubscribe + 30 days |
| Invalid endpoints | 90 days then purge keys |
| Consent history | 7 years (or adviser guidance) |
| Delivery jobs / events | 24 months raw; rollups longer |
| Announcement versions | Life of clinic + legal hold |

---

## 7. Subscription / device identifiers

- `clientInstallationKey`: random UUID in browser storage — **not** an MRN.  
- Push endpoint treated as **credential-like**; hash for indexes where possible; never log full endpoint in support exports.  
- Metrics are **device-level**, not named-patient read receipts.

---

## 8. Australian Spam Act considerations (high-level)

For messages that are commercial/promotional:

- Consent (express or inferred only if adviser agrees — prefer express).  
- Identify the practice as sender.  
- Functional unsubscribe.  
- Honour unsubscribe promptly.

**Adviser must classify** which engagement categories are “commercial electronic messages.”

---

## 9. Audit records

Staff draft / approve / publish / retract / preference hygiene → existing `AuditLog` (+ engagement-specific events). Patient consent append-only. No silent edits of historical consent rows.

---

## 10. Patient-facing explanations (draft copy for review)

**Short consent blurb (operational):**  
“Woolloongabba Medical Centre can send optional practice updates on this device (for example opening-hour changes). This is not for appointment reminders or test results — those stay with HotDoc and the clinic. You can turn updates off anytime.”

**Promotional add-on:**  
“Separately, you can opt in to optional practice news or education links. This is not medical advice and not a substitute for care from your GP.”

**Privacy pointer:**  
“We store a device identifier and notification settings — not your Medicare number or clinical record. See our Privacy Policy / [engagement notice URL].”

Final wording requires principal + privacy adviser approval before UI ship.

---

## 11. Approval request (owner)

Please obtain signatures on:

1. This pack reviewed by privacy/legal adviser (with written comments).  
2. Principal acceptance of operational vs promotional split and draft patient copy.  
3. Authorisation to proceed to C2 **engineering** only after C2 readiness matrix gates clear (backup, Auth.js, security pack).

Until signed, **C2-P06 / C2-P10 privacy portion remain BLOCKED** — existence of this draft alone is not PASS.
