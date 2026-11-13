# WMC — Phase B1 completion / closeout

**Date:** 2026-11-13  
**Verdict:** **PHASE B1 CLOSED — STAGING VERIFIED & PRESERVED**

## 1. GitHub release branch verification

| Item | Value |
| --- | --- |
| Branch | `release/wmc-patient-app-visual-excellence` |
| Local HEAD | `f6bba5ca0deea4ef70ebed64c64f35a9ca8d78dd` |
| `origin/release/wmc-patient-app-visual-excellence` | `f6bba5ca0deea4ef70ebed64c64f35a9ca8d78dd` |
| Push status | **Pushed** — local tip is ancestor of / equal to remote tip |
| Commit | `fix(wmc): Phase B1 host-aware install QR, cooldown parity, honest guidance` |

Untracked local-only items (not part of the verified B1 ship tip): scratch Class B SQL generator scripts; this closeout pack / C0 docs until committed under a separate docs commit if desired.

## 2. Staging deploy preservation

| Item | Value |
| --- | --- |
| Hostinger build UUID | `01a1d23c-9930-73e9-ab56-2db7e486dfcf` |
| Archive | `wmc-patient-app-b1-install-f6bba5c.zip` |
| Archive SHA-256 | `75209098782788BD08BAC4355C330426E9F6AF5C11B3C1446EE107B79F74C604` |
| Hosts | `mediumslateblue-eagle-960503.hostingersite.com`, `staging.gabbamedicalcentre.com.au` |
| Evidence report | `docs/WMC-PHASE-B1-INSTALL-STAGING-REPORT.md` |
| Prior baseline | `2634ca2` / `01a1d1f7-…` |

## 3. Rollback record

| Step | Action |
| --- | --- |
| 1 | Re-upload `wmc-patient-hub-ui-polish-2634ca2.zip` |
| 2 | `hosting_nodejs_start-build` (Node 22, `apps/web`, archive) |
| 3 | Confirm `/api/health` and install landing behaviour |
| Alternate | Earlier dashboard/visual ZIPs (`c08e91e`, `6f08dde`) if needed |

No database rollback required (code-only B1).

## 4. Scope closed

| ID | Outcome |
| --- | --- |
| B1-I1 | Host-aware QR for both staging hosts; production apex destination preserved; jsQR decode PASS |
| B1-I2 | ISO + epoch dismiss parse parity; 14-day cooldown preserved |
| B1-I3 | Honest Digital Reception copy; older-patient install help; iOS/Android/desktop paths preserved |

HotDoc lightbox, Patient Hub, Preferred GP, Digital Reception, PWA, sharing and booking behaviour preserved on staging verification.

## 5. In-practice QR promotional pack (pre-cutover)

Prepared under `docs/phase-b1-qr-promo/`:

- Reception counter card + waiting-room poster (HTML printables)
- Production-destination QR PNG/SVG (`source=reception-qr` / `waiting-room-qr`)
- Android + iPhone install steps on materials + staff briefing script
- Banner **NOT FOR DISTRIBUTION** until production cutover **and** live apex QR verification

## 6. Explicit non-goals / remaining (out of B1)

- Production DNS cutover / apex Hostinger go-live
- Displaying reception QR materials while WordPress remains apex
- Phase C push notifications (architecture only — separate pack)

**Phase B1 engineering closeout complete.** Next authorised planning work: Phase C0 notification architecture (no implementation without approval).
