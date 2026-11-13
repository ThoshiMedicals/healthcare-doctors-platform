# WMC — Phase C0 Engagement Admin Panel UI specification

**Design only.** Extend existing Auth.js CMS under `/admin` — not a standalone SaaS shell.

---

## 1. Navigation

Add clinic-scoped section:

**Patient Engagement**

- Overview  
- Announcements  
- Subscribers & consent  
- Delivery  
- Adoption & costs  
- HotDoc touchpoints (read-only settings links — no HotDoc API control)  
- Governance / audit  

Reuse existing admin chrome, clinic switcher, and role gates.

---

## 2. Overview dashboard

**Cards (honest labels)**

| Metric | Label must say |
| --- | --- |
| Active push subscriptions | “Devices with active push subscription” |
| Opt-in rate | “Installations with operational consent” |
| Published announcements (30d) | count |
| Push accepted | “Accepted by push service (not proof of read)” |
| Inbox opens | “Inbox opens (device events)” |
| Acknowledgements | “Explicit Got it taps” |
| Est. SMS avoided $ | “Estimate — see methodology” |

Empty/error states when tables missing (pre-migration). No fabricated demo numbers in production mode.

---

## 3. Announcements (campaigns)

### List

Columns: Title · Classification · Status · Publish/schedule · Expire · Author · Updated  

Filters: status, classification, date.

### Editor

- Title, summary, body (markdown), action CTA  
- Classification select with helper text  
- Topic checkboxes  
- Schedule publish / expiry  
- Preview (patient mobile frame)  
- Validation: block save if promotional without `requiresPromotionalConsent` path  

### Workflow actions

| Status | Actions | Who |
| --- | --- | --- |
| draft | Edit, Submit for approval, Delete draft | editors |
| pending_approval | Approve, Request changes | practice_approver / clinic_admin; **approver ≠ author** for promo |
| approved | Schedule, Publish now | publisher |
| scheduled | Cancel schedule, Publish now | publisher |
| published | Expire now, Retract, Correct (new version) | publisher / clinic_admin |
| retracted / expired | View only / clone to draft | |

Show approval note + timestamps. Mirror CMS revision mental model.

---

## 4. Subscribers & consent

- Counts by topic / status — **no patient names**  
- Search by installation key prefix / date — not identity  
- Actions: invalidate subscription, export consent evidence (clinic admin)  
- Retention policy summary link  

Do **not** show HotDoc patient charts here.

---

## 5. Delivery

- Per-announcement funnel: queued → attempted → accepted → rejected → clicked → inbox opened → acknowledged  
- Failure table: endpoint gone, 4xx/5xx, rate limited  
- Retry / cancel controls for queued jobs  
- Duplicate suppression indicator  

---

## 6. Adoption & costs

- Install-guide views (if instrumented)  
- Consent funnel  
- SMS baseline editor (period, avoidable count, $/SMS, notes)  
- Computed estimate panel with formula text (see cost doc)  
- Disclaimer: clinical SMS not included  

---

## 7. Accessibility & staff UX

- Keyboard operable tables  
- Confirm dialogs for Publish / Retract  
- Audit trail panel on each announcement  
- Staging banner when `STAGING_NOINDEX` / non-production host  

---

## 8. Permissions matrix (UI hide vs server enforce)

UI may hide buttons; **server must enforce** `CmsAction` equivalents. Never rely on CSS hiding alone.
