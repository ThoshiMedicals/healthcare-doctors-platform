# L7 — Final launch-candidate audit

**Assessment date:** 2026-10-26 (Australia/Brisbane)  
**Baselines:** 3H = 72 (conditional) · L1 = 86 (clear to ship) · L2–L6 closed incremental gates  
**Scope:** Final Go / No-Go across Search, Digital Reception, Booking, Authority Graph, Governance, Analytics, Trust Signals, Mobile UX, Accessibility, Performance

---

## Go / No-Go recommendation

### **GO — CLEAR TO SHIP**

No Critical or High blockers remain. Medium and Low items are dated post-launch follow-ups and do not prevent cutover.

| Metric | Value |
| --- | ---: |
| **Launch readiness score** | **86** |
| Critical | **0** |
| High | **0** |
| Medium | 2 |
| Low | 3 |

### Score method (unchanged from 3H / L1)

1. Domain average × 10 → base (**9.1 → 91**).  
2. Subtract: Critical −15 · High −5 · Medium −2 · Low −0.5.  
3. Result: \(91 - 0 - 0 - 4 - 1.5 = 85.5\) → **86** (rounded).

---

## Domain scorecard

| Domain | Status | Score | Evidence snapshot |
| --- | --- | ---: | --- |
| Search | Ready | 9 | Manifest **206** routes; import-validation **passed**; 14 shards |
| Digital Reception | Ready | 9 | Live open/search/result; 8 unmatched phrases remain (M5) |
| Booking | Ready | 10 | HotDoc live verify **13/13**; dock + profile CTAs |
| Authority Graph | Ready | 9 | Service/practitioner authority wired; reciprocity incomplete (L1) |
| Governance | Ready | 9 | Fail-closed empty public stamps; publish pipeline ready (L2) |
| Analytics | Ready | 10 | Warehouse feed live; dashboards show **warehouse feed** (L6) |
| Trust Signals | Ready | 9 | `.trust-strip` ×2 near booking on service pages (L3) |
| Mobile UX | Ready | 9 | Dock owns Book/Call/Ask; header Menu-only ≤1024 (L5) |
| Accessibility | Ready | 9 | Skip link; dock/DR aria; 118 `focus-visible` rules |
| Performance | Partial | 8 | DR index ~0.95 MB; large PNG posters beside WebP (M4) |

---

## Closed launch gates (carry-forward)

| Gate | Status | Evidence |
| --- | --- | --- |
| C1 HotDoc practitioner deep-links | Closed | `HOTDOC_LIVE_VERIFY_L1.json` — 13/13 |
| H1 Search-index manifest sync | Closed | 206 routes; golden ↔ public |
| H2 Navigation ownership | Closed | 208/208; import-validation passed |
| L2 Governance publication pipeline | Closed | Fail-closed + publish script |
| L3 Trust strips | Closed | Runtime strips near conversion |
| L5 Mobile action hierarchy | Closed | Dock primary · header demoted |
| L6 Analytics warehouse | Closed | `data/measurement-events.json` · source `warehouse_file` |

---

## Live spot checks (L7)

| Check | Result |
| --- | --- |
| `/services/skin-checks.html` trust strips | **2** near booking (AGPAL · bulk billing · open 7 days) |
| Care dock | Present · `aria-label="Book, call, and reception"` · DR launcher |
| Skip link | Present |
| Admin `/admin/executive` | Label **warehouse feed** (verified L6; still current) |
| Admin `/admin/digital-reception` | Live intents Diabetes / Fees Billing from warehouse |

---

## Issues by severity

### Critical

*None.*

### High

*None.*

### Medium

| ID | Domain | Summary | Evidence |
| --- | --- | --- | --- |
| **M4** | Performance | Large PNG poster sources remain beside WebP (HTML prefers WebP) | `apps/web/public/assets/patient-information/` — e.g. day-night PNG ~1.28 MB |
| **M5** | Digital Reception | Some intent phrases still unmatched (`mode=none`) | `.tmp-pdf-convert/intent-audit.txt` — 8 phrases (e.g. vaccine, immunisation, register, video call, hba1c, how much) |

### Low

| ID | Domain | Summary | Evidence |
| --- | --- | --- | --- |
| **L1** | Authority Graph | Doctor ↔ knowledge related edges not fully reciprocal | `apps/web/public/search-index/` |
| **L2** | Governance | Public governance stamps empty until approval (by design / fail-closed) | `GOVERNANCE_PUBLICATION_CHECKLIST_L2.md` — 0/188 public-ready |
| **L3** | Performance | Large `digital-reception-index.js` compatibility corpus | ~0.95 MB (`apps/web/public/digital-reception-index.js`) |

---

## Domain notes

### Search
Catalog intact (206 routes, strong-term map, 14 shards). Import and rendering validation both pass. No Critical/High search blockers.

### Digital Reception
Collection and journey instrumentation verified. Unmatched intents (M5) are content/routing follow-ups, not launch blockers.

### Booking
Full HotDoc roster verified 13/13 (Abadir reception-only by design). Fallback “Need help booking?” path remains for lightbox failure.

### Authority Graph
Practitioner/service authority dashboards and published graph are live. Reciprocity gaps tracked as Low.

### Governance
Pipeline ready; public registry correctly empty until approvals exist. Do not treat empty stamps as a deploy failure.

### Analytics
Active reporting: browser event log → warehouse builder → admin dashboards. All seven 2G core event types covered in warehouse. Continuous ingest should continue post-launch to grow sample size beyond the seed session.

### Trust Signals
Reusable mid-journey strips confirmed on inner service pages (not homepage-only).

### Mobile UX
Action hierarchy clear: dock is the sole persistent Book/Call/Ask chrome; header is brand + Menu on compact viewports.

### Accessibility
Skip link, labelled dock, DR dialog semantics, and extensive focus-visible coverage. Full WCAG audit not re-run in L7 — no regressions observed in spot checks.

### Performance
Largest remaining costs: Digital Reception index payload and legacy PNG poster assets. Prefer WebP already in markup; PNG cleanup is Medium post-launch.

---

## Cutover stance

**Ship.** Operate with fail-closed governance, warehouse-backed analytics, and HotDoc-verified booking. Schedule M4/M5 within the first post-launch sprint; treat Low items as backlog hygiene.
