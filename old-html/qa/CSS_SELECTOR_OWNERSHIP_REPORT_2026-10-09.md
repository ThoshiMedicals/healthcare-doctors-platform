# CSS selector ownership assessment — 9 October 2026

**Scope:** All selectors parsed from the unchanged `styles.css` against 196 static HTML pages and the site's JavaScript. `@media`/`@supports` context is retained in the companion CSV.

**No CSS deletion approved.** Class/id presence establishes first-party usage evidence, but absence from source alone cannot conclusively prove a selector unused by HotDoc or other injected runtime states. Accordingly no selector is classified as **DEFINITELY UNUSED** without a full rendered-state proof.

| Classification | Selector occurrences |
|---|---:|
| ACTIVE | 2476 |
| QUESTIONABLE_DYNAMIC | 180 |
| QUESTIONABLE_NO_STATIC_MATCH | 215 |
| QUESTIONABLE_STRUCTURAL_OR_STATE | 124 |
| DEFINITELY UNUSED (proven) | 0 |
| **Total** | **2995** |

## Interpretation
- **ACTIVE:** At least one class/id token is present in shipped first-party HTML; this is evidence, not proof of every compound or pseudo-class branch.
- **QUESTIONABLE_DYNAMIC:** Not in static class/id markup, but a token appears in JavaScript; retain pending browser state testing.
- **QUESTIONABLE_NO_STATIC_MATCH:** No class/id is visible in HTML/JS; candidate for a targeted browser/runtime audit, not approved for deletion.
- **QUESTIONABLE_STRUCTURAL_OR_STATE:** Tag, pseudo-class, attribute or other selector requiring state checks before removal.

## Visual QA gate before removal
Capture screenshots at 1440, 1024, 768, 390, and 320px for homepage, all page templates, opened/closed FAQ, Digital Reception, HotDoc Lightbox/failure fallback, focus/hover and reduced-motion modes. Verify third-party injected markup. Only then mark individual selectors safe to remove and compare pixel/output differences.
