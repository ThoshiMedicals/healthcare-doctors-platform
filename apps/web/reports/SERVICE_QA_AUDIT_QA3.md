# Service Template QA Audit — QA3

**Assessed:** 2026-10-26  
**Environment:** UAT `http://127.0.0.1:3100/`  
**Corpus:** All 29 service templates in `old-html/services/*.html`  
**Live samples:** Family Health (SERVICE HUB), ECG (FOCUSED SERVICE) — desktop + mobile dock signals

## Service scorecard

| Headline | Score |
| --- | ---: |
| **Service Score** | **87** |

**Recommendation:** `ALIGNED_WITH_POLISH`

Service pages share one shell (hero → on-this-page → body → pathways rail → FAQ/planning → footer trust → persistent dock) with two intentional families (Service hub vs Focused service) plus independent-provider pages. Conversion bands, trust strips, and the Guides · practitioners · booking rail are strong live via `site.js`. The main gap is authored practitioner deep-links on procedure / independent pages (14 / 29 with zero doctor links).

Service Score = mean of eight check dimensions.

## Dimension scores

| Check | Score | Notes |
| --- | ---: | --- |
| Hero | 91 | H1 + page-hero on 29/29; hub vs focused badge clear live |
| Conversion bands | 90 | Live Book this service / dock Book; static band chrome 13/29 (hubs runtime) |
| Trust strips | 88 | Footer AGPAL / bulk billing 29/29; mid-page trust runtime |
| Related practitioners | 78 | Authored section 16/29; 14 pages 0 doctor deep-links |
| Knowledge pathways | 92 | Knowledge links 29/29; hubs richer than procedures |
| Authority structure | 86 | On-this-page + provenance; empty practitioner cards on focused |
| Internal linking | 84 | Service↔service 29/29; doctor graph uneven |
| Mobile responsiveness | 87 | Dock owns Book / Call / Ask; template readable ≤1024 |

## Template families

| Family | Count | Examples |
| --- | ---: | --- |
| Service hub | 13 | family-health, womens-health, mental-health, telehealth, … |
| Focused service | 13 | ecg, iron-infusions, iud/implanon, wound-dressings, … |
| Independent provider | 3 | pathology, radiology, pharmacy |

## Template checklist (static + runtime)

| Requirement | Static | Live |
| --- | ---: | --- |
| Page hero + H1 | **29 / 29** | Confirmed |
| HotDoc book CTAs | **29 / 29** | Confirmed |
| Call + persistent dock + Digital Reception | **29 / 29** | Confirmed |
| On this page / journey nav | **29 / 29** | Confirmed |
| Knowledge pathways | **29 / 29** | Confirmed |
| Internal service links | **29 / 29** | Confirmed |
| Conversion band markup | **13 / 29** | Runtime fills hubs |
| Related Practitioners chrome | **16 / 29** | Runtime rail on samples |
| Related Services heading | **13 / 29** | Links present without uniform heading |
| Doctor deep-links | **15 / 29** | ECG: Ask reception fallback |

## Template deviations

| ID | Sev | Issue |
| --- | --- | --- |
| S-T1 | P2 | Two hero badges (Service hub vs Focused service) — intentional but not declared in static HTML alone |
| S-T2 | P2 | Conversion bands largely runtime-injected on hubs (`site.js`) |
| S-T3 | P3 | “Related Services” heading coverage uneven in authored HTML (13/29) |

## Visual inconsistencies

| ID | Sev | Issue |
| --- | --- | --- |
| S-V1 | P2 | Empty practitioner card (Ask reception) vs populated hub lists — same rail, uneven density |
| S-V2 | P2 | Call accessible name duplicates “Call Call …” (sitewide) |
| S-V3 | P3 | Independent-provider heroes still surface clinic Book Appointment dock |

## Missing connections

| ID | Sev | Issue |
| --- | --- | --- |
| **S-M1** | **P1** | **14 services lack doctor deep-links** (procedures + independent + telehealth) |
| S-M2 | P2 | Implanon / IUD only one practitioner link each |
| S-M3 | P3 | Knowledge volume varies (focused often 4–6 guides) while always present |

### Pages with zero doctor deep-links

breast-check · ear-care-ear-syringing · ecg · iron-infusions · nebulising · pap-smear-cervical-screening · pathology · pharmacy · pre-pregnancy-care · prostate-care · radiology · spirometry · telehealth · wound-dressings

## Priority fixes

1. **S-M1 (P1)** — Publish named practitioner links (or designed empty-state with Meet Our Team) on the 14 zero-doctor pages; keep independent-provider honesty where clinic doctors are not the authority.  
2. **S-V2 (P1 shared)** — Fix duplicated “Call Call …” accessible names (same as QA1/QA2).

## Success criteria

**Service templates share one conversion + pathway grammar across hubs and focused pages** — **met with polish**.

- **Aligned:** Hero, booking dock, knowledge pathways, trust footer, on-this-page, site.js rails.  
- **Polish:** Practitioner authority graph on focused/procedure pages; Call a11y; independent-provider booking chrome clarity.
