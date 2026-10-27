# Measurement event validation (PROMPT 2G)

Phase 1 records conversion and Digital Reception events through `measurement.js`. Events are pushed to `window.dataLayer` and dispatched as `wmc:measurement`. Raw search text is never included on dashboard payloads.

## Core events

| Event | Fires when | Required fields |
| --- | --- | --- |
| `page_view` | Every page load after `measurement.js` initialises | `page_group`, `page_path` |
| `book_appointment_click` | Visible HotDoc control (`a.wmc-book-appointment`, `a.persistent-care-book`, `a[data-hotdoc-button]`) | `placement`, `destination`, `page_group` |
| `call_clinic_click` | `tel:+61732173344` only | `placement`, `page_group` |
| `task_shortcut_click` | `.patient-tasks a` or `.patient-hub-task-grid a` | `task`, `surface` |
| `digital_reception_open` | Digital Reception panel opens | `page_group` |
| `digital_reception_search` | Find / Enter / quick button completes a search | `intent_bucket`, `result_type`, `result_count` |
| `digital_reception_result_click` | Result, journey step, book, call, or Show more | `step`, `intent_bucket` |

## `page_group` values

`home` · `practitioner` · `service` · `advice_hub` · `advice_article` · `patient_information` · `team` · `booking` · `other`

Classification uses the published path (for example `doctors/*` → `practitioner`, `knowledge/articles/*` → `advice_article`).

## Intent buckets (not raw queries)

Search events store a fixed `intent_bucket` after digits are stripped. Allowed values:

`appointment_booking`, `fees_billing`, `referral`, `repeat_script`, `new_patient`, `hotdoc_message`, `test_results`, `parking_access`, `after_hours`, `telehealth`, `diabetes`, `mental_health`, `skin_check`, `womens_health`, `mens_health`, `child_health`, `pregnancy`, `vaccination`, `practitioner`, `emergency`, `clinical_symptom`, `practice_info`, `other`, `unmatched`

`result_type` for Digital Reception searches: `direct_page` · `care_journey` · `no_result` · `emergency` · `unavailable`

`step` for result clicks: `article` · `service` · `practitioner` · `book` · `call` · `more` · `shortcut`

## 14-day debug query retention

- API: `WMCMeasurement.retainDebugQuery(raw, meta)`
- Storage: browser `localStorage` key `wmc_measurement_debug_queries`
- Contents: truncated raw query, timestamp, expiry, intent bucket, result metadata
- Retention: entries older than 14 days are purged on write and on init
- Privacy: debug store is local only; outbound `record()` payloads delete `query` / `raw_query` if present
- Clear: `WMCMeasurement.purgeDebugStore()`

IP addresses are not stored with queries.

## Manual validation checklist

1. Open any page → confirm one `page_view` in `dataLayer` with a correct `page_group`.
2. Click a visible Book Appointment control → `book_appointment_click` with `placement` and `destination`.
3. Click `(07) 3217 3344` → `call_clinic_click`. Confirm `tel:000` does **not** fire this event.
4. Click a task shortcut (New Patient, Repeat Script, Test Results, Referral, Skin Check, HotDoc Messages) → `task_shortcut_click`.
5. Open Digital Reception → `digital_reception_open`.
6. Search `diabetes` → `digital_reception_search` with `intent_bucket: diabetes` and no raw query field.
7. Click a result → `digital_reception_result_click` with a `step`.
8. Search `fees` → confirm debug store gained a row, and `dataLayer` event has `intent_bucket: fees_billing` only.
9. Confirm `measurement.js` loads before `site.js` and `digital-reception.js`.

## Runtime inspection

```js
window.dataLayer.filter((row) => row && row.measurement_version === '2G')
window.WMCMeasurement.readDebugStore()
window.WMCMeasurement.pageGroup()
window.WMCMeasurement.intentBucket('repeat script')
```

## Source files

- `old-html/measurement.js` — canonical page groups, intent buckets, record API, debug retention
- `old-html/site.js` — embeds `measurement.js` between `WMC_MEASUREMENT_EMBED` markers (required for UAT standalone, which does not pick up newly added public files until rebuild); booking visibility remains the source of truth for clickable book controls
- `old-html/digital-reception.js` — open / search / result click hooks
- Golden HTML loads `measurement.js` before `site.js` when present; the embed keeps recording working if the separate file is absent
- Published mirrors under `apps/web/public/` (and `.next-uat/standalone/.../public` for the review server)

## Sync note

After editing `measurement.js`, re-run:

`node .tmp-pdf-convert/embed-measurement-into-site.mjs`

Then copy `site.js`, `measurement.js`, and `digital-reception.js` to `apps/web/public` and the UAT standalone public folder.
