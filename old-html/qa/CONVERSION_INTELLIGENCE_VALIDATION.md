# Conversion Intelligence validation (PROMPT 3F)

Practice reporting for where patients drop out before booking. Built on 2G measurement events and the 3A data layer. Collection is unchanged.

## Location

- UI: `/admin/conversion-intelligence` (Clinic Admin / Super Admin — `manage_settings`)
- Dataset: `buildPracticeConversionIntelligenceReport()` in `apps/web/src/measurement/conversion-intelligence-report.ts`
- Ranges: Last 7 days · Last 30 days · Month-to-date (Australia/Brisbane)

## Funnel

Visitor → Search → Service → Practitioner → Booking

| Stage | Session signal |
| --- | --- |
| Visitor | Session with page views or measurement activity |
| Search | Digital Reception open or search |
| Service | Service page view or DR service result click |
| Practitioner | Practitioner page view, DR practitioner result, or booking attributed to a practitioner |
| Booking | `book_appointment_click` |

## Display

| Block | Definition |
| --- | --- |
| Highest-converting practitioners | Practitioner-touched sessions ranked by booking conversion |
| Highest-converting services | Service-touched sessions ranked by booking conversion |
| Highest-converting entry pages | First page in session ranked by booking conversion |
| Highest-exit pages | Last page in sessions that did not book |
| Highest-abandonment journeys | Furthest funnel stage before leaving without booking |
| Weak booking paths | High-traffic entry pages with conversion ≤ 25% |
| Weak service journeys | Services with volume and conversion ≤ 25% |
| Weak practitioner journeys | Practitioners with volume and conversion ≤ 25% |

## Privacy

Dashboard outputs never include raw queries. 14-day local debug retention remains in `measurement.js`.

## Tests

```bash
cd apps/web
npx tsx --test src/measurement/conversion-intelligence-report.test.ts
```
