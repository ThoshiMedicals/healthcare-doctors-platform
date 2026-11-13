# WMC — Phase C0 modular implementation tasks (future)

**Not authorised to build yet.** Each module lists acceptance tests. Execute only after **PHASE C0 IMPLEMENTATION APPROVAL** and privacy/security sign-off.

Suggested engineering sequence maps to roadmap Phases C → E.

---

## Module C1 — Foundations & keys

**Work:** VAPID key generation/storage docs; env wiring plan; SW push event stubs behind feature flag; clinic feature flag `engagementPushEnabled`.

**Acceptance**

- [ ] Feature flag off → zero push registration calls in production builds  
- [ ] VAPID private key never in Git / client bundle  
- [ ] Existing PWA offline shell + caching regression PASS  

---

## Module C2 — Schema migration (staging only first)

**Work:** Prisma models from `WMC-PHASE-C0-DATABASE-SCHEMA.md`; migration; seed topics; indexes.

**Acceptance**

- [ ] `prisma migrate` on staging only after backup verified  
- [ ] FK clinic cascade behaviour documented  
- [ ] No PHI columns present (schema review checklist signed)  

---

## Module C3 — Consent & preferences API + UI

**Work:** Preference sheet; ConsentRecord writes; unsubscribe; policy versioning.

**Acceptance**

- [ ] Permission prompt never on page load  
- [ ] Operational vs promotional consents independently stored  
- [ ] Unit tests for consent append-only transitions  
- [ ] A11y: keyboard + screen reader smoke on preference sheet  

---

## Module C4 — Subscription lifecycle

**Work:** subscribe/unsubscribe endpoints; endpoint hashing; 410 Gone handling; dedupe.

**Acceptance**

- [ ] Duplicate endpoint → single active row  
- [ ] Unsubscribe sets status + consent revoke rows  
- [ ] Rate limit verified  
- [ ] Android Chrome subscribe E2E on staging flag-on  

---

## Module C5 — Inbox + public announcements

**Work:** Patient inbox page; public list; open/ack events; deep link from notification click.

**Acceptance**

- [ ] Published operational items visible without push  
- [ ] Retracted items hidden from inbox  
- [ ] `inbox_opened` / `acknowledged` events recorded device-scoped  
- [ ] Visual QA 320–1440; reduced motion  

---

## Module C6 — Admin Announcements workflow

**Work:** CMS Engagement section; draft/approve/schedule/publish/retract; role gates.

**Acceptance**

- [ ] Promo cannot publish without approver ≠ author  
- [ ] Wrong-clinic publish blocked  
- [ ] AuditLog entries for each transition  
- [ ] Auth.js session required; anonymous 401  

---

## Module C7 — Delivery queue & worker

**Work:** Job enqueue; worker with `SKIP LOCKED`; Web Push send; retries; metrics.

**Acceptance**

- [ ] One job per subscription per announcement  
- [ ] Accepted vs rejected recorded honestly  
- [ ] Worker crash-safe lease expiry  
- [ ] Staging load test with dummy subscribers only  

---

## Module C8 — iPhone push path

**Work:** Detect standalone; educate install-before-push; graceful fallback.

**Acceptance**

- [ ] Non-standalone iOS never silently “succeeds” subscribe  
- [ ] Copy explains Home Screen requirement  
- [ ] Physical device test log attached  

---

## Module C9 — Reporting & SMS economics

**Work:** Dashboard cards; baseline CRUD; estimate formula; CSV export without endpoints.

**Acceptance**

- [ ] Labels distinguish push accepted ≠ read  
- [ ] SMS estimate excludes clinical recalls by configuration  
- [ ] Export redacts endpoint/p256dh/auth  

---

## Module C10 — Governance pilot

**Work:** Staff pilot → limited consenting patients; frequency caps; support runbook.

**Acceptance**

- [ ] Pilot approval recorded  
- [ ] Unsubscribe < agreed threshold or remediation plan  
- [ ] Incident / rollback drill completed  

---

## Regression gate (every module)

Preserve: HotDoc lightbox, Preferred GP, Digital Reception, install QR host-aware behaviour, share, booking phone-only exceptions, SEO/noindex staging.
