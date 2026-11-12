# WMC — Patient Hub mobile dashboard (staging)

**Date:** 2026-11-12  
**Verdict:** **PATIENT HUB DASHBOARD — STAGING VERIFIED**

## Architecture

Patient Hub is **CMS-published Class B HTML** (`patient-hub.html` revision) refined at request time by `applyPublicUxRefinements` → `refinePatientHubMobileDashboard` (`apps/web/src/documents/patient-hub-mobile-dashboard.ts`).

**Code-only.** No staging DB / CMS revision writes were required or performed.

## Deployed artifact

| Item | Value |
| --- | --- |
| Branch | `release/wmc-patient-app-visual-excellence` |
| Final Git SHA | `c08e91e0dcb3c3160965f052ed9823b65684f440` |
| Prior baseline tip | `6f08dde` / build `01a1ce83-…` |
| Release ZIP | `wmc-patient-hub-mobile-dashboard-c08e91e.zip` |
| ZIP SHA-256 | `FD1F5BDC11595C401E371750646567AC9260DC39C36C5B18122EF5895D362AA2` |
| Hostinger domain | `mediumslateblue-eagle-960503.hostingersite.com` (= `staging.gabbamedicalcentre.com.au`) |
| Hostinger build UUID | `01a1cfd1-c0ee-737d-b906-fe950f089bf9` |
| Rollback ZIP | `wmc-patient-app-visual-excellence-6f08dde.zip` → build `01a1ce83-…` |

## Requirement matrix

| # | Requirement | Result |
| --- | --- | --- |
| 1 | Compact branded header (logo + menu) | **PASS** |
| 2 | Compact welcome — “Your care, made easier.” | **PASS** (live H1) |
| 3 | Prominent My Preferred GP card | **PASS** (`#preferred-gp-panel`, persistence verified live) |
| 4 | Four quick actions: Book, Digital Reception, Find a Doctor, Health Information | **PASS** (Book card uses `book-appointment.html` so HotDoc does not `display:none` it; dock/header keep HotDoc lightbox) |
| 5 | Compact Install WMC App card (device / install aware) | **PASS** (`data-wmc-hub-install-card`; hidden in standalone) |
| 6 | Expandable Practice Information (address, hours, phone, email, after-hours) | **PASS** (`details.patient-hub-practice-details`) |
| 7 | Compact bottom dock — Book, Call, Digital Reception | **PASS** |
| 8 | Compacted hub footer (less repetition on small screens) | **PASS** (hub-scoped CSS) |

## Functionality preserved

| Concern | Result |
| --- | --- |
| Preferred GP persistence | **PASS** (live mount + saved GP observed) |
| Booking rules / HotDoc dock | **PASS** |
| Digital Reception | **PASS** (primary card + dock launcher) |
| PWA install + iOS in-flow guide | **PASS** (guide after install card; 14-day cooldown untouched) |
| Mobile-only share (preferred GP) | **PASS** (`data-wmc-share-preferred-gp`) |
| Trust Facts / practice strip facts | **PASS** (via existing `refinePatientHubDashboard`) |
| Staging noindex / SEO / HOLD / URLs | **PASS** (unchanged) |

## Tests and build

- Unit: `patient-hub-mobile-dashboard.test.ts`, iOS install, DR, share — **PASS**
- Related a11y / PWA / staging-noindex smokes — **PASS**
- Local `npm run build` — **PASS** (Next 15.5.29)
- Hostinger archive build — **completed** (`01a1cfd1-…`)

## Evidence

`docs/phase4a-evidence/patient-hub-dashboard-20261112/`

- Before: `before-390-viewport.png` (pre-dashboard tip)
- After viewports: `after-{320,390,430,768,1024,1440}-viewport.png` (+ full-page)
- `verify-report.json`, `after-patient-hub.html`

## Rollback

1. Redeploy archive `wmc-patient-app-visual-excellence-6f08dde.zip` with the same Node 22 / `apps/web` / `.next` settings.  
2. Or prior share-control archive `wmc-share-control-staging-fdd9bf2.zip`.  
3. No DB rollback required (code-only).

## Remaining notes

- Production / DNS / Auth.js hostname / physical-device install remain out of scope.  
- Dashboard Book card intentionally avoids HotDoc widget attrs so the card stays visible; booking lightbox remains on dock and header.
