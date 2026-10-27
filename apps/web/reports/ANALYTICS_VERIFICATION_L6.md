# L6 — Analytics verification (active reporting)

**Date:** 2026-10-26  
**Objective:** Move analytics from implementation to active reporting.  
**Success:** Dashboards operate on live website data rather than sample fixtures.

---

## 1. Event collection

| Check | Result |
|---|---|
| `WMCMeasurement` on public site (`:3100`) | Present · version `2G` |
| Outbound channel | `window.dataLayer` + `wmc:measurement` |
| Privacy | `query` / `raw_query` stripped on `record()` |
| Browser warehouse buffer | `localStorage` key `wmc_measurement_event_log` (14-day TTL, max 2500) |
| Export API | `WMCMeasurement.exportEventLog()` |

Live harvest origin: `http://127.0.0.1:3100` (session `s_z9i7cwlqvwdmvnos13s`).

---

## 2. Core 2G event types

All seven core events verified from live collection:

| Event | Count in warehouse | Evidence |
|---|---:|---|
| `page_view` | 6 | home, skin-checks, Dr Tanya, new-patients, fees-billing |
| `book_appointment_click` | 3 | hero + dock placements |
| `call_clinic_click` | 2 | `tel:+61732173344` only |
| `digital_reception_open` | 1 | dock launcher |
| `digital_reception_search` | 2 | `diabetes` · `fees_billing` (intent only) |
| `digital_reception_result_click` | 1 | `step: article` |
| `task_shortcut_click` | 1 | `task: new_patient` (API record — patient-tasks chrome removed) |

No raw query fields present on warehouse payloads.

---

## 3. Dashboard data flow

```
measurement.js (site)
  → dataLayer / event log
  → export / merge
  → apps/web/data/measurement-events.json
  → loadMeasurementEvents()  [source: warehouse_file]
  → sanitize → aggregate → dashboard pages
```

| Dashboard | Feed label | Live signals observed |
|---|---|---|
| Executive | **warehouse feed** | Top pages: New Patients, Dr Tanya, Fees Billing, Skin Checks |
| Digital Reception | **warehouse feed** | Intents: Diabetes, Fees Billing · funnel Open→Search→Result |
| Practitioner / Service / Conversion | same loader | Uses warehouse when file present |

Fixture path remains as fallback only when the warehouse file is absent.

---

## 4. Warehouse feed

| Item | Path / command |
|---|---|
| Warehouse file | `apps/web/data/measurement-events.json` |
| Live capture input | `apps/web/data/l6-live-capture.json` |
| Builder | `node scripts/build-measurement-warehouse.mjs [input.json…]` |
| npm script | `npm run measurement:warehouse -w @wmc/web` |

Builder sanitises events, dedupes, reports core-event coverage, and refuses raw-query keys.

---

## 5. Collection improvements (L6)

- Durable browser event log for warehouse export (`readEventLog` / `exportEventLog` / `purgeEventLog`).
- `fees-billing.html` classified as `patient_information` (was falling through to `other`).
- Synced: `measurement.js` → embed → `site.js` (`apps/web/public` + `old-html`).

---

## 6. Success criteria

**Met.** Admin dashboards read `warehouse_file` and render live UAT session metrics (not the deterministic fixture sample). Ongoing ingest: export browser event logs (or any 2G JSON dump) through `measurement:warehouse`.
