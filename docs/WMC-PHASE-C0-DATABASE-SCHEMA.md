# WMC — Phase C0 database schema (design only)

**No migrations in this phase.** Proposed Prisma / PostgreSQL models for clinic-scoped engagement. Aligns with existing `Clinic`, `User`, `ClinicMembership`, `AuditLog`.

---

## 1. Design principles

- Clinic-scoped foreign keys everywhere actionable data lives.
- Opaque `installationId` (UUID in `localStorage` / IndexedDB) — **not** a patient MRN.
- No columns for name, Medicare, DOB, phone, email of patients in MVP tables.
- Prefer append-only consent and delivery event history.
- Soft-deactivate subscriptions (`status`) rather than hard-delete immediately (retention policy then purge).

---

## 2. Enums (proposed)

```prisma
enum EngagementConsentChannel {
  web_push
  inbox_only
}

enum EngagementTopic {
  operational_hours      // hours, closures, holiday hours
  operational_access     // parking, entry, disruptions
  practice_news          // new GP welcome, public practice news
  promotional            // optional campaigns
  educational            // optional health education
}

enum AnnouncementClassification {
  operational
  promotional
  educational
}

enum AnnouncementStatus {
  draft
  pending_approval
  approved
  scheduled
  published
  expired
  retracted
}

enum SubscriptionStatus {
  active
  paused
  expired
  unsubscribed
  invalid
}

enum DeliveryJobStatus {
  queued
  leasing
  attempted
  accepted
  rejected
  skipped
  cancelled
}

enum EngagementEventType {
  permission_prompt_shown
  permission_granted
  permission_denied
  subscribed
  unsubscribed
  preference_changed
  push_accepted
  push_rejected
  endpoint_gone
  notification_clicked
  inbox_opened
  acknowledged
  install_guide_view
  // analytics-only, privacy-preserving
}
```

---

## 3. Models (proposed)

### DeviceInstallation

Anonymous install / browser profile for a clinic.

| Field | Type | Notes |
| --- | --- | --- |
| id | cuid | PK |
| clinicId | FK Clinic | required |
| clientInstallationKey | string | UUID from client; unique per clinic |
| platformHint | string? | `ios` / `android` / `desktop` — coarse only |
| standalone | boolean? | last known display-mode |
| createdAt / updatedAt / lastSeenAt | datetime | |
| revokedAt | datetime? | device cleared |

Unique: `(clinicId, clientInstallationKey)`.

### PushSubscriptionRecord

| Field | Type | Notes |
| --- | --- | --- |
| id | cuid | |
| clinicId | FK | |
| installationId | FK DeviceInstallation | |
| endpoint | text | sensitive |
| endpointHash | string | indexed lookup without logging raw |
| p256dh | text | |
| auth | text | |
| expirationTime | datetime? | |
| userAgentHash | string? | optional, not full UA string in analytics |
| status | SubscriptionStatus | |
| createdAt / updatedAt / lastSuccessAt / lastFailureAt | | |
| failureCode | string? | |

Unique: `(clinicId, endpointHash)`.

### ConsentRecord

| Field | Type | Notes |
| --- | --- | --- |
| id | cuid | |
| clinicId | FK | |
| installationId | FK | |
| channel | EngagementConsentChannel | |
| topic | EngagementTopic | |
| granted | boolean | |
| policyVersion | string | e.g. `wmc-engagement-notice-2026-11` |
| policyHash | string | hash of shown text |
| sourceSurface | string? | hub / inbox / install |
| createdAt | datetime | append-only; new row on change |

Index: `(clinicId, installationId, topic, createdAt desc)`.

### Announcement

| Field | Type | Notes |
| --- | --- | --- |
| id | cuid | |
| clinicId | FK | |
| slug | string | public path segment |
| classification | AnnouncementClassification | |
| status | AnnouncementStatus | |
| title | string | patient-facing |
| summary | string | lock-screen / list |
| bodyMarkdown | text | inbox detail — public info only |
| actionLabel / actionUrl | string? | e.g. Contact page |
| topics | EngagementTopic[] | or join table |
| requiresPromotionalConsent | boolean | derived/enforced |
| publishAt / expireAt | datetime? | |
| publishedAt / retractedAt | datetime? | |
| createdById / updatedById | FK User? | staff |
| approvedById | FK User? | |
| approvalNote | text? | |
| version | int | increments on edit after publish via AnnouncementVersion |

### AnnouncementVersion

Immutable snapshot for audit / retract/correct history.

### DeliveryJob

| Field | Type | Notes |
| --- | --- | --- |
| id | cuid | |
| clinicId | FK | |
| announcementId | FK | |
| subscriptionId | FK | |
| status | DeliveryJobStatus | |
| attemptCount | int | |
| nextAttemptAt | datetime? | |
| leasedUntil / leasedBy | | worker lock |
| providerResponseCode | string? | |
| createdAt / updatedAt | | |

Unique: `(announcementId, subscriptionId)` for duplicate suppression.

### EngagementEvent

Append-only metrics / audit-ish stream (device-scoped).

| Field | Type | Notes |
| --- | --- | --- |
| id | cuid | |
| clinicId | FK | |
| announcementId | FK? | |
| installationId | FK? | |
| subscriptionId | FK? | |
| type | EngagementEventType | |
| metadata | json? | no PHI |
| createdAt | datetime | |

Indexes for dashboard rollups: `(clinicId, type, createdAt)`, `(clinicId, announcementId, type)`.

### SmsSavingsBaseline (config)

Staff-maintained baseline for economics — not automated carrier integration in MVP.

| Field | Notes |
| --- | --- |
| clinicId | |
| periodStart / periodEnd | |
| avoidableGeneralSmsCount | documented inventory |
| costPerSmsAud | |
| notes / evidenceUri | |
| createdById | |

### Optional: EngagementDailyRollup

Materialised daily counters for admin dashboard performance (device-level).

---

## 4. Auth / permissions extension (design)

Add `CmsAction` values (names indicative):

- `engagement_draft`
- `engagement_approve`
- `engagement_publish`
- `engagement_retract`
- `engagement_view_metrics`
- `engagement_manage_subscribers` (hygiene only — no PHI)

Map to existing roles:

| Action | Roles |
| --- | --- |
| draft | content_editor, editor, clinic_admin+ |
| approve | practice_approver, clinic_admin+ (promo requires approver ≠ author) |
| publish / retract | publisher, clinic_admin+ |
| metrics | clinic_admin, practice_approver, publisher |
| manage subscribers | clinic_admin+ |

Continue writing staff actions to `AuditLog`.

---

## 5. Retention (proposed defaults — confirm with privacy adviser)

| Data | Retention |
| --- | --- |
| Active subscriptions | Until unsubscribe + 30 days |
| Invalid endpoints | 90 days then purge keys |
| Consent history | 7 years (or adviser guidance) |
| Delivery jobs | 24 months |
| Engagement events | 24 months raw; rollups longer |
| Announcement versions | Life of clinic record + legal hold |

---

## 6. Migration posture

- Additive Prisma migration only after **implementation approval**.
- Staging first on `wmc-hostinger-staging`; never against production WordPress DB.
- No Class B CMS HTML republish required for schema itself.

**Design only — not applied.**
