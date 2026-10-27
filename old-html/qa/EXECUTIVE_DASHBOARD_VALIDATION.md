# Executive Dashboard validation (PROMPT 3B)

Practice-management view of overall website performance. Built on the 3A measurement data layer and 2G event collection (unchanged).

## Location

- UI: `/admin/executive` (Clinic Admin / Super Admin — `manage_settings`)
- Dataset: `buildPracticeExecutiveDashboard()` in `apps/web/src/measurement/executive-report.ts`
- Ranges: `apps/web/src/measurement/ranges.ts`
- Event feed: `loadMeasurementEvents()` — optional `apps/web/data/measurement-events.json`, otherwise deterministic fixture sample

## Display

| Block | Content |
| --- | --- |
| KPIs | Traffic (page views), Sessions, Booking clicks, Clinic calls |
| Top 10 | Pages, Services, Practitioners |
| Booking placement mix | header (includes mobile header), dock, profile, Digital Reception, other |
| Rates | Contact Rate, Booking Intent Rate, Call Intent Rate |
| Ranges | Last 7 days, Last 30 days, Month-to-date (Australia/Brisbane) |

## Rate definitions

Denominator = Sessions (falls back to Traffic if no session IDs).

- **Contact Rate** = (Booking clicks + Clinic calls) ÷ Sessions
- **Booking Intent Rate** = Booking clicks ÷ Sessions
- **Call Intent Rate** = Clinic calls ÷ Sessions

## Privacy

No raw search queries on the dashboard. Search-related warehouse fields remain limited to intent bucket / result type / result count. 14-day local debug retention stays in `measurement.js`.

## Tests

```bash
cd apps/web
npx tsx --test src/measurement/executive-report.test.ts
```
