# Practitioner Authority Dashboard validation (PROMPT 3D)

Practice view for practitioner authority performance. Built on 2G measurement events, the 3A data layer, and the published search-index authority graph. Collection is unchanged.

## Location

- UI: `/admin/practitioner-authority` (Clinic Admin / Super Admin — `manage_settings`)
- Dataset: `buildPracticePractitionerAuthorityDashboard()` in `apps/web/src/measurement/practitioner-authority-report.ts`
- Authority graph: `loadPractitionerAuthoritySignals()` in `apps/web/src/measurement/authority-framework.ts`
- Ranges: Last 7 days · Last 30 days · Month-to-date (Australia/Brisbane)

## Display

| Block | Definition |
| --- | --- |
| Profile Views | `page_view` on practitioner profiles |
| Booking Clicks | `book_appointment_click` attributed to a practitioner |
| Call Clicks | `call_clinic_click` attributed to a practitioner |
| Contact Rate | (Booking + call clicks) ÷ profile views |
| Booking Intent | Booking clicks ÷ profile views |
| Digital Reception Recommendations | Practitioner result clicks in DR, or profile views in sessions that used DR |
| Digital Reception Selections | Booking/call with `digital_reception` placement, or after DR activity in-session |
| Authority signals | Practitioner links (outbound related), inbound article links, related services |
| Rankings | All practitioners sorted by Contact Rate and by Booking Intent |
| Hub / Developing / Thin | Authority score ≥ 40 / ≥ 14 / &lt; 14 from the published graph |

## Privacy

Dashboard outputs never include raw queries. 14-day local debug retention remains in `measurement.js`.

## Tests

```bash
cd apps/web
npx tsx --test src/measurement/practitioner-authority-report.test.ts
```
