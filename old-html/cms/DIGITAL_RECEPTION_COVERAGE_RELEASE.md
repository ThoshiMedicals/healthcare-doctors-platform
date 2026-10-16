# Digital Reception Search Coverage

The Digital Reception tool now serves as an **information-first website search assistant**. Its index contains 194 public website pages and loads only when opened. It returns direct links to all closely matching patient education articles, ranked by relevance, with five shown initially and **Show more** for additional matches. It does not automatically insert a GP, service or booking recommendation into patient-information results.

The approved HotDoc booking control and Call Reception link remain separately accessible. Practice-information queries (parking, fees, results, booking, after hours) continue to resolve to their pages. When there is no suitable published article, the search acknowledges the gap and offers the Knowledge Centre directory. Searches concerning a life-threatening emergency display 000 guidance; the tool does not diagnose or evaluate severity.

Run `python cms/tools/check_digital_reception_coverage.py` for the 49-case patient-intent acceptance matrix on desktop and mobile. This is technical QA, not clinical approval or live HotDoc confirmation.
