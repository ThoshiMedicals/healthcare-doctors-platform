# Digital Reception Dashboard validation (PROMPT 3C)

Practice view for search failures and journey bottlenecks. Built on 2G measurement events and the 3A data layer. Collection is unchanged.

## Location

- UI: `/admin/digital-reception` (Clinic Admin / Super Admin — `manage_settings`)
- Dataset: `buildPracticeDigitalReceptionDashboard()` in `apps/web/src/measurement/digital-reception-report.ts`
- Ranges: Last 7 days · Last 30 days · Month-to-date (Australia/Brisbane)

## Display

| Block | Definition |
| --- | --- |
| Open rate | Digital Reception opens ÷ sessions |
| Searches | `digital_reception_search` count |
| Resolution rate | Resolved searches ÷ searches (`direct_page` / `care_journey` / `emergency`, or `result_count > 0`) |
| Zero result rate | `result_type = no_result` ÷ searches |
| Top intent buckets | Search volume by `intent_bucket` (with resolution) |
| Top search destinations | Result-click steps (`article`, `service`, `practitioner`, booking, call, …) |
| Watchlist | `new_patient`, `hotdoc_message`, `vaccination` (shown as Vaccine) |
| Journey funnel | Open → Search → Result click → Booking → Call |
| Flags | Intent buckets with high search volume and resolution &lt; 50% |

## Privacy

Dashboard outputs never include raw queries. Only `intent_bucket`, `result_type`, and `result_count` summaries are used. 14-day local debug retention remains in `measurement.js`.

## Tests

```bash
cd apps/web
npx tsx --test src/measurement/digital-reception-report.test.ts
```
