# WMC — Phase C1 Patient Engagement UI foundation

**Date:** 2026-11-13  
**Baseline:** `f6bba5ca0deea4ef70ebed64c64f35a9ca8d78dd`  
**Branch:** `feat/wmc-patient-engagement-c1-ui` (local only — not pushed)  
**Verdict:** **PHASE C1 UI FOUNDATION READY FOR REVIEW**

## Scope delivered

### Patient-facing (`/dev/patient-engagement/*`)

| Surface | Route |
| --- | --- |
| Notification Inbox + filters + unread/read | `/dev/patient-engagement/inbox` |
| Message detail + Got it | `/dev/patient-engagement/inbox/[id]` |
| Preferences + opt-in explanation | `/dev/patient-engagement/preferences` |
| Install / notification eligibility | `/dev/patient-engagement/eligibility` |
| Staff metrics visual mirror (no auth) | `/dev/patient-engagement/staff-preview` |

- Labelled `[DEMO]` dummy data only  
- Device-local read/ack/prefs in `localStorage`  
- **No** `Notification.requestPermission`, **no** `pushManager.subscribe`, **no** Web Push  
- Persistent demo banner: not live messaging  

### Engagement Admin (`/admin/engagement-lab/*`)

| Surface | Route |
| --- | --- |
| Dashboard | `/admin/engagement-lab` |
| Announcements list | `…/announcements` |
| Create / draft / preview | `…/announcements/new` |
| Workflow presentation | `…/announcements/[id]` |
| Subscribers & consent | `…/subscribers` |
| Delivery reporting | `…/delivery` |
| SMS savings | `…/costs` |

- `requireAction("edit")` — Auth.js preserved; unauthenticated → **307** login  
- Publish/send/invalidate controls **disabled** or presentation-only  
- Nav entry: **Engagement lab (demo)** under Operations (build gate)  
- Request gate blocks production apex unless `WMC_ENGAGEMENT_C1_PROTOTYPE=true`  

## Safety

| Constraint | Status |
| --- | --- |
| Isolated from Class B public CMS HTML / Patient Hub refinements | Pass — no `public-ux` hub changes |
| No DB / migrations | Pass |
| No deploy / GitHub push | Pass (local branch + commit only) |
| HotDoc preserved | Pass — copy + hub link only |
| Demo cannot be mistaken for live | Pass — banners + `[DEMO]` labels |

## Tests and build

| Check | Result |
| --- | --- |
| `tsx --test src/engagement-c1/engagement-c1.test.ts` | **6/6 PASS** |
| Hub / Preferred GP / install handoff regression tests | **15/15 PASS** |
| `npm run build` | **PASS** (routes include `/dev/patient-engagement/*` and admin lab) |
| Local smoke `:3011` inbox/preferences/eligibility | **200** |
| `/admin/engagement-lab` without session | **307** (auth gate) |
| Local `/patient-hub.html` on `next start` without Postgres | **500** (pre-existing DB dependency — not a C1 regression; hub unit tests PASS) |

## Visual QA

Evidence: `docs/phase-c1-evidence/`

| Viewport | Surfaces reviewed |
| --- | --- |
| 390 | Inbox list, preferences |
| 1440 | Eligibility |
| Interactive | Detail view, Got it ack, filter chips, switches (a11y roles) |

Additional widths (320/430/768/1024) use the same fluid shell (`max-width: 720px` patient; admin tables scroll). No layout blockers observed at 390/1440.

## Exact changed files (C1 implementation)

- `apps/web/src/engagement-c1/*` (types, dummy data, gate, CSS, clients, tests)
- `apps/web/src/app/dev/patient-engagement/**`
- `apps/web/src/app/admin/(dashboard)/engagement-lab/**`
- `apps/web/src/cms/modules.ts` (demo nav)
- `apps/web/src/middleware.ts` (`/dev/` noindex)
- `docs/WMC-PHASE-C1-UI-FOUNDATION-REPORT.md`
- `docs/phase-c1-evidence/*`

## Remaining C2 database / security prerequisites

1. Written implementation + privacy/security/clinical sign-off (C0 packs)  
2. Prisma schema migration on staging only after backup  
3. VAPID key env handling; feature flag default **off** for live push  
4. Auth.js custom-hostname callback defect before staff UAT on staging host  
5. Rate-limited subscribe APIs; endpoint hashing; retention jobs  
6. Replace dummy metrics with empty/honest states when tables empty  

## Recommended implementation sequence

1. **C2** schema + empty admin/patient wiring (still no push)  
2. **C3** consent persistence APIs  
3. **C4** subscription lifecycle behind flag  
4. **C5** replace dummy inbox feed with published announcements  
5. **C6–C7** real workflow + delivery worker  
6. **C8** iOS physical path  
7. **C9–C10** reporting + pilot  

**PHASE C1 UI FOUNDATION READY FOR REVIEW**
