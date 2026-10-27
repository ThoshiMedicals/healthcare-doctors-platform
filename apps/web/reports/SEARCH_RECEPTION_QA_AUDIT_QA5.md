# Search & Digital Reception QA Audit — QA5

**Assessed:** 2026-10-26  
**Environment:** UAT `http://127.0.0.1:3100/`  
**Surfaces:** Sitewide Digital Reception (`digital-reception.js`), Knowledge hub guide search (`knowledge-search.js`), `measurement.js` analytics, `search-index/*` shards  
**Live probes:** Parking · headache · rash · chest pain emergency · nonsense zero-result · see a doctor

## Headline scores

| Score | Value |
| --- | ---: |
| **Search score** | **86** |
| **Resolution score** | **90** |
| **Compliance score** | **88** |

**Recommendation:** `STRONG_RESOLUTION_VISIBILITY_POLISH`

Digital Reception resolves admin and clinical intents into published destinations, care journeys, emergency handoffs, or honest zero-results — with privacy-safe analytics. The main UX gap is **search visibility**: there is no global header search; discovery depends on the dock “Ask us” launcher and Knowledge hub finders.

## Dimension scores

| Check | Score | Notes |
| --- | ---: | --- |
| Search quality | 89 | Shard loading, scoring, aliases, clinical vs task separation |
| Intent routing | 90 | TOPIC_SIGNALS · DIRECT_PAGES · practitioner · emergency |
| Destination routing | 88 | Task chains + journeys; GP-directory fallback when no lead |
| Zero-result behaviour | 91 | no_result + Health Advice; unmatched clinical → Family Health |
| Search visibility | 74 | No header search; dock-only discovery |
| Mobile UX | 87 | Compact Ask us in persistent dock; panel usable |
| Accessibility | 90 | Dialog, labels, focus, aria-live status |
| Analytics tracking | 92 | open / search / result_click + intent buckets; raw query not in warehouse |

## Score composition

- **Search score** = mean(quality, intent, destination, zero-result, visibility) → **86**  
- **Resolution score** = mean(intent, destination, zero-result) → **90**

## Live check matrix

| Query | Result type | Outcome |
| --- | --- | --- |
| Parking | `direct_page` | Access & Parking · intent `parking_access` |
| headache | `care_journey` | Guide + Family Health + GP directory + Book |
| rash | `care_journey` | Honest unmatched clinical fallback path |
| chest pain emergency | `emergency` | 000 · Lifeline · ED · urgent GP |
| xyzzyzfoobar999 | `no_result` | Browse Health Advice · count 0 |
| see a doctor | `direct_page` | Live resolved (offline audit previously empty) |

## UX findings

| ID | Area | Verdict | Summary |
| --- | --- | --- | --- |
| UX-1 | Digital Reception panel | strong | Disclosure, labelled search, quick topics, Book/Call |
| UX-2 | Care journeys | strong | Information → Service → Practitioner → Booking |
| UX-3 | Zero-result / unmatched | strong | Honest empty + Health Advice / Family Health |
| UX-4 | Search visibility | **gap** | No global header search |
| UX-5 | Mobile dock | good | Ask us compact label in care dock |
| UX-6 | Accessibility | strong | Dialog + focus + aria-live |
| UX-7 | Analytics privacy | strong | Buckets/types tracked; raw query debug-only |
| UX-8 | Intent coverage polish | good | Lock conversational phrases with regression cases |

## Priority fixes

1. **R-V1 (P1)** — Add a visible search entry point (header or primary nav affordance) that opens Digital Reception / prefilled search, without inventing a second ranking engine.

## Additional polish

| ID | Sev | Issue |
| --- | --- | --- |
| R-I1 | P2 | Conversational intents need locked regression coverage |
| R-D1 | P2 | Clinical journeys often Step-3 GP directory (no published lead) |
| R-U1 | P3 | DR index vs Knowledge guide-finder behave differently |
| R-A1 | P3 | Call Call accessible-name duplication |

## Analytics evidence (live)

Events observed: `digital_reception_open`, `digital_reception_search` with `intent_bucket` + `result_type` (`direct_page` · `care_journey` · `emergency` · `no_result`) pushed to `dataLayer` and local event log; raw queries retained only in `wmc_measurement_debug_queries`.

## Success criteria

**Patients can find information and next steps via Digital Reception with measurable resolution** — **met with visibility polish**.

- **Resolution:** Strong (journeys, admin routes, emergency, zero-result honesty).  
- **Search UX:** Strong in-panel; discoverability limited without a global search cue.
