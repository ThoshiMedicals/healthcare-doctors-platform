# WMC — Phase C0 Patient Engagement notification architecture

**Date:** 2026-11-13  
**Status:** Design only — **no implementation, migrations, deploy, DNS or production changes**  
**Baseline staging tip:** `f6bba5ca0deea4ef70ebed64c64f35a9ca8d78dd`  
**Authority:** `docs/WMC-PATIENT-APP-MASTER-ROADMAP.md`, `PROJECT_SPEC.md`  
**Verdict target:** **PHASE C0 ARCHITECTURE READY — IMPLEMENTATION APPROVAL REQUIRED**

---

## 1. Purpose and non-goals

### Purpose

Design a **clinic-scoped, general-announcement** engagement system for Woolloongabba Medical Centre that:

- Uses browser Web Push for installed / eligible Android and iPhone PWAs
- Requires explicit consent and topic preferences
- Provides a Patient Notification Inbox
- Publishes public practice announcements via a CMS-integrated Engagement Admin Panel
- Tracks honest delivery stages and privacy-preserving adoption metrics
- Estimates SMS campaign cost savings only for **avoidable general announcements**

### Non-goals (initial system)

- Personal clinical messaging, results, prescriptions, recalls or appointment-specific reminders
- Named-patient identity binding or “read receipt per patient”
- Replacing HotDoc for booking, clinical reminders or recalls
- Requesting notification permission on every page load
- Guaranteeing push delivery, display or comprehension

**HotDoc remains** the clinical booking, appointment-reminder and recall system of record.

---

## 2. High-level architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│ Patients (browser / installed PWA)                                   │
│  Install / Hub → Consent + Preferences → Web Push subscription       │
│  Service Worker → OS notification → deep-link Inbox item             │
│  Inbox (anonymous device scope) + public /announcements pages        │
└───────────────────────────────┬──────────────────────────────────────┘
                                │ HTTPS (same origin)
┌───────────────────────────────▼──────────────────────────────────────┐
│ apps/web (Next.js on Hostinger)                                      │
│  Public API: subscribe / unsubscribe / preferences / inbox read      │
│  Existing SW (/sw.js) extended carefully for push handlers           │
│  Auth.js CMS: Engagement Admin Panel under /admin                    │
└───────────────────────────────┬──────────────────────────────────────┘
                                │ Prisma / Postgres (Supabase staging;
                                │ future production project TBD)
┌───────────────────────────────▼──────────────────────────────────────┐
│ PostgreSQL                                                           │
│  DeviceInstallation · PushSubscription · ConsentRecord               │
│  Announcement · AnnouncementVersion · DeliveryJob · EngagementEvent  │
│  PreferenceTopic · StaffApproval · Audit (clinic-scoped)             │
└───────────────────────────────┬──────────────────────────────────────┘
                                │ Web Push (VAPID)
┌───────────────────────────────▼──────────────────────────────────────┐
│ Push services (browser vendors / FCM bridge as applicable)           │
│  Acceptance ≠ patient opened ≠ understood                            │
└──────────────────────────────────────────────────────────────────────┘
```

### Integration with existing stack

| Layer | Approach |
| --- | --- |
| Hostinger Node Web App | Same Next.js app; no separate messaging microservice for MVP |
| Supabase Postgres | New Prisma models (design only now); clinic FK to existing `Clinic` |
| Auth.js | Staff-only admin; reuse `ClinicMembership` + extend `CmsAction` |
| Service worker | Extend existing PWA SW; never break offline shell / cache policy |
| Public UX | Class B refinements + dedicated inbox route; no CMS HTML for private clinical content |
| HotDoc | Unchanged lightbox/booking URLs; engagement copy must not claim HotDoc replacement |

---

## 3. Capability map

| Capability | Initial release | Notes |
| --- | --- | --- |
| Browser push (Android Chrome/Edge) | Yes | Installed or eligible browser contexts |
| Browser push (iPhone) | Yes, constrained | Requires Home Screen web app + iOS version support; fallback inbox |
| Explicit consent UI | Yes | Separate operational vs promotional consents |
| Topic preferences | Yes | Hours/closures, access, practice news, optional promo/education |
| Patient Notification Inbox | Yes | Device-local open state + server announcement feed |
| Public announcements page | Yes | Website fallback without install |
| Optional promotional notifications | Yes | Only with promotional consent + preference |
| Engagement Admin Panel | Yes | Inside existing `/admin` CMS |
| Draft → approve → schedule → publish → retract | Yes | Two-person rule for promo / sensitive operational |
| Delivery queue | Yes | Postgres-backed jobs + worker/cron |
| Push acceptance / inbox open / ack tracking | Yes | Honest metric labels |
| Adoption + engagement reporting | Yes | Device-level, not named patients |
| SMS savings analytics | Yes | Baseline-driven estimate only |
| Subscription expiry / cancel / device mgmt | Yes | Patient self-serve + staff hygiene jobs |
| Privacy / audit / retention | Yes | APP-aligned policies before go-live |
| Accessibility + fallbacks | Yes | Inbox + public pages + phone |
| Clinical 1:1 messaging | **No** | Phase F conditional |
| HotDoc reminder replacement | **No** | Forever out of initial scope |

---

## 4. Consent model (critical)

Browser **Notification permission** ≠ marketing consent.

| Layer | Mechanism | Required for |
| --- | --- | --- |
| L0 — Install / use PWA | Existing install UX | Using Patient Hub tools |
| L1 — Notification permission | OS/browser prompt after contextual CTA | Any Web Push attempt |
| L2 — Operational announcements | Explicit in-app toggle + timestamped consent record | Hours, closures, access disruptions |
| L3 — Promotional / educational | Separate opt-in + topic prefs | New services, screening campaigns, events |
| L4 — Unsubscribe | One-tap stop push + preference centre + public page notes | All categories |

Store: consent version text hash, channel (`web_push`), topics, `grantedAt` / `revokedAt`, installation id (opaque), clinic id. **No Medicare, DOB, name or HotDoc patient id.**

---

## 5. Runtime flows

### 5.1 Opt-in

1. Patient opens contextual card on Hub / Inbox (“Get practice updates”).
2. Explain categories + how to stop; link to privacy notice.
3. Capture L2 (and optional L3) before calling `Notification.requestPermission()`.
4. On `granted`, `pushManager.subscribe(VAPID)` → POST `/api/engagement/subscriptions`.
5. Persist subscription + consent; show confirmation + preference link.

### 5.2 Publish

1. Staff draft announcement in Admin (clinic-scoped).
2. Classification: `operational` | `promotional` | `educational` (educational treated as promo consent unless policy says otherwise).
3. Preview → optional clinical/practice approval → schedule or publish.
4. Enqueue `DeliveryJob` rows for eligible subscriptions (topic ∩ consent ∩ active endpoint).
5. Worker sends Web Push; record `push_accepted` / `push_rejected` / `endpoint_gone`.
6. Payload: title, short body, announcement id, deep link — **no clinical PHI**.

### 5.3 Receive / open / acknowledge

1. SW `push` → show notification.
2. Click → open `/patient-notifications.html?id=…` (or Hub inbox route).
3. Client posts `inbox_opened` event (device-scoped).
4. Optional explicit “Got it” → `acknowledged` (still anonymous unless Phase F).

### 5.4 Fallbacks

| Condition | Fallback |
| --- | --- |
| iOS without install / no push support | Inbox + public announcements + reception |
| Permission denied | Prefer inbox / website; do not re-prompt aggressively |
| Push service rejection / 410 Gone | Mark subscription inactive; inbox still available |
| Urgent individual clinical matter | Phone / HotDoc / clinical workflow — never push-only |

---

## 6. Security architecture (summary)

- VAPID private key in Hostinger env only; rotate with dual-key window.
- Admin APIs Auth.js session + `assertRole` clinic scope; CSRF same-site patterns as CMS.
- Public subscribe APIs rate-limited; require same-origin + optional proof-of-work/token for abuse.
- Subscription endpoints encrypted at rest if policy requires; never log full endpoint URLs in analytics exports.
- Staff audit via existing `AuditLog` + engagement-specific events.
- Separate staging vs production VAPID keys and Supabase projects.
- Fix known Auth.js custom-hostname callback defect before staff acceptance on staging custom host (existing workstream).

Detail: `docs/WMC-PHASE-C0-PRIVACY-SECURITY-APPROVALS.md`.

---

## 7. Hostinger / infrastructure compatibility

| Concern | Assessment |
| --- | --- |
| Long-lived WebSocket push server | Not required — Web Push is vendor-delivered |
| Background worker | Use Hostinger-compatible scheduled job hitting secured `/api/engagement/worker` **or** external cron; document SLA |
| Payload size | Keep under browser limits (~2–4 KB practical) |
| SW updates | Versioned SW; careful cache bust; regression on install/offline |
| Multi-instance | Job leasing via `FOR UPDATE SKIP LOCKED` in Postgres |
| Cost | Mostly Postgres storage + staff time; Web Push itself is low variable cost; SMS savings are opportunity cost |

Detail: `docs/WMC-PHASE-C0-INFRASTRUCTURE-COST-ESTIMATES.md`.

---

## 8. Companion deliverables

| # | Document |
| --- | --- |
| Schema (design only) | `docs/WMC-PHASE-C0-DATABASE-SCHEMA.md` |
| Patient UI | `docs/WMC-PHASE-C0-PATIENT-NOTIFICATION-UI.md` |
| Admin UI | `docs/WMC-PHASE-C0-ENGAGEMENT-ADMIN-UI.md` |
| Modular tasks + acceptance tests | `docs/WMC-PHASE-C0-MODULAR-TASKS.md` |
| Privacy / security / clinical approvals | `docs/WMC-PHASE-C0-PRIVACY-SECURITY-APPROVALS.md` |
| Infra / cost estimates | `docs/WMC-PHASE-C0-INFRASTRUCTURE-COST-ESTIMATES.md` |

---

## 9. Implementation gate

Do **not** start coding push, schema migrations or third-party messaging until:

1. Written implementation approval  
2. Privacy / legal / clinical governance sign-off on C0 packs  
3. Verified backup/recovery for the target database  
4. Auth.js staging hostname defect plan accepted for staff UAT  

**PHASE C0 ARCHITECTURE READY — IMPLEMENTATION APPROVAL REQUIRED**
