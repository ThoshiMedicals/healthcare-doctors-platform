# Service Authority Dashboard validation (PROMPT 3E)

Practice view for service authority performance. Built on 2G measurement events, the 3A data layer, and the published search-index authority graph. Collection is unchanged.

## Location

- UI: `/admin/service-authority` (Clinic Admin / Super Admin — `manage_settings`)
- Dataset: `buildPracticeServiceAuthorityDashboard()` in `apps/web/src/measurement/service-authority-report.ts`
- Authority graph: `loadServiceAuthoritySignals()` in `apps/web/src/measurement/authority-framework.ts`
- Ranges: Last 7 days · Last 30 days · Month-to-date (Australia/Brisbane)

## Display

| Block | Definition |
| --- | --- |
| Service Views | `page_view` on service pages |
| Booking Clicks | `book_appointment_click` on service pages |
| Call Clicks | `call_clinic_click` on service pages |
| Contact Rate | (Booking + call clicks) ÷ service views |
| Booking Intent | Booking clicks ÷ service views |
| Related Knowledge Hub Clicks | Knowledge / article page views in sessions that also viewed the service |
| Practitioner Clicks | Practitioner profile views in sessions that also viewed the service |
| Digital Reception Entrances | DR result clicks to the service, or service views in sessions that used DR |
| Digital Reception Outcomes | Booking/call on the service with `digital_reception` placement, or after DR activity in-session |
| Authority signals | Related practitioners, related knowledge, sibling services, inbound articles, inbound practitioners |
| Rankings | All services sorted by views, contact rate, and booking intent |
| Hub / Developing / Thin | Authority score ≥ 40 / ≥ 14 / &lt; 14 from the published graph |

## Privacy

Dashboard outputs never include raw queries. 14-day local debug retention remains in `measurement.js`.

## Tests

```bash
cd apps/web
npx tsx --test src/measurement/service-authority-report.test.ts
```
