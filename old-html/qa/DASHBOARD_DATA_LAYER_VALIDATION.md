# Dashboard data layer validation (PROMPT 3A)

Builds dashboard-ready aggregations on top of the Phase 1 measurement framework (PROMPT 2G). Event collection in `measurement.js` is unchanged.

## Source

| Module | Role |
| --- | --- |
| `apps/web/src/measurement/types.ts` | 2G event / intent / result contracts |
| `apps/web/src/measurement/sanitize.ts` | Strip raw queries before aggregation |
| `apps/web/src/measurement/periods.ts` | Daily / weekly / monthly keys (Australia/Brisbane) |
| `apps/web/src/measurement/aggregate.ts` | Metric helpers |
| `apps/web/src/measurement/datasets.ts` | Five dashboard datasets |
| `apps/web/src/measurement/index.ts` | Public API |

## Aggregation helpers

| Helper | Metric |
| --- | --- |
| `aggregatePageViews` | `page_view` |
| `aggregateBookingClicks` | `book_appointment_click` |
| `aggregateCallClicks` | `call_clinic_click` |
| `aggregateDigitalReceptionOpens` | `digital_reception_open` |
| `aggregateDigitalReceptionSearches` | `digital_reception_search` |
| `aggregateDigitalReceptionResultClicks` | `digital_reception_result_click` |
| `aggregateTaskShortcuts` | `task_shortcut_click` |
| `aggregateByPeriod(events, grain)` | All of the above by `daily` · `weekly` · `monthly` |

## Dashboard datasets

| Dataset | Builder | Focus |
| --- | --- | --- |
| Executive | `buildExecutiveDashboard` | Site-wide totals + period series + page_group mix |
| Digital Reception | `buildDigitalReceptionDashboard` | Opens / searches / result clicks; search rows by intent only |
| Practitioner | `buildPractitionerDashboard` | Practitioner page views, booking and call clicks |
| Service | `buildServiceDashboard` | Service page views and conversions |
| Governance | `buildGovernanceDashboard` | Review-status snapshot + traffic by page_group |

Suite helper: `buildDashboardSuite(events, grain, reviewStatus?)`.

## Privacy

Dashboard outputs expose search dimensions only:

- `intent_bucket`
- `result_type`
- `result_count` (aggregated mean / event field — never raw query text)

Raw query keys (`query`, `raw_query`, …) are stripped in `sanitizeMeasurementEvent`.

## 14-day query-debug retention (unchanged)

Still owned by `measurement.js`:

- Store key: `wmc_measurement_debug_queries`
- TTL: 14 days
- Local browser only; not part of dashboard datasets
- Policy constant: `DEBUG_RETENTION_POLICY` in `datasets.ts`

## Tests

```bash
cd apps/web
npx tsx --test src/measurement/dashboard.test.ts
```

## Usage sketch

```ts
import { buildDashboardSuite } from "@/measurement";

const suite = buildDashboardSuite(dataLayerEvents, "weekly");
// suite.executive | suite.digital_reception | suite.practitioner | suite.service | suite.governance
```

Events may be taken from `window.dataLayer` (browser), exported warehouse rows, or fixtures. Collection code paths are not modified.
