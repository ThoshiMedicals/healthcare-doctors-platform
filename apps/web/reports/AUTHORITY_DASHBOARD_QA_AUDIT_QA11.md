# Authority Dashboard QA Audit — QA11

**Assessed:** 2026-10-26  
**Environment:** Admin Practitioner + Service Authority  
**Surfaces:** Doctor profile strength · Service page strength · tiers · charts · badges · tier filters · How-to  
**Live samples:** Demo last_30 · `tier=Developing` (PA) · `tier=Thin` (SA)

## Headline scores

| Score | Value |
| --- | ---: |
| **Authority dashboard score** | **90** |
| **Management usability score** | **91** |

**Recommendation:** `AUTHORITY_DASHBOARD_OPERATIONAL_POLISH`

Friendly tier labels, indigo/teal/stone badges, and ranking charts are strong on both surfaces. A **P0 tier-filter crash** (`AUTHORITY_TIER_FRIENDLY is not defined`) blocked Investigate roster on both pages; imports were patched during this pass and tier filters now open investigation rosters. Remaining polish: governance filter bleed and PA/SA chrome consistency.

## Dimension scores

| Check | Score | Notes |
| --- | ---: | --- |
| Tier labels | 93 | Well connected / Building / Needs more links + non-clinical disclaimer |
| Charts | 90 | Comparison/ranking bars; SA adds DR entry + conversion stacks |
| Colors | 93 | Authority palette separated from semantic health hues |
| Badges | 94 | Consistent StatusBadge tones on charts + roster |
| Recommendations | 80 | Tier investigation strong; governance bleed; no native action strip |
| Filter behaviour | 88 | Tier filter works after patch; queue bleed remains |
| Explanations | 95 | How-to + AuthorityTierExplained |
| Visual consistency | 86 | PA cards vs SA distribution; Hub prose remnant; diabetes casing |
| Actionability | 88 | Tier investigate + focus + Conversion/DR links restored |

## Coverage

| Signal | Coverage |
| --- | --- |
| Practitioner tiers (Demo) | Well connected **8** · Building **5** · Needs more links **0** |
| Service tiers (Demo) | Well connected **4** · Building **10** · Needs more links **16** |
| Charts | PA comparison + rankings · SA rankings + DR + conversion |
| Tier filter | Developing / Thin verified after import patch |
| Data modes | Live · Demo · Empty |

## Score composition

- **Authority dashboard** = mean(nine CHECK dimensions) → **90**  
- **Management usability** = mean(explanations, badges, tiers, filters, actionability, consistency) → **91**

## Priority fixes

1. **AU-C1 (P0 · patched)** — Import `AUTHORITY_TIER_FRIENDLY` on both Authority pages (done in QA11).  
2. **AU-G1 (P1)** — Stop governance Expired remediation from owning Authority investigation banners.

## Recommendations

| ID | When | Action |
| --- | --- | --- |
| **AU-REC1** | **Now** | Regression smoke for `tier=Developing` / `tier=Thin` roster titles |
| **AU-REC2** | **Now** | Isolate governance investigation filters from Authority |
| AU-REC3 | Next | Align PA/SA tier investigation chrome |
| AU-REC4 | Next | Native Recommended Actions for high-view low-booking hubs |
| AU-REC5 | Later | Friendly-only tier copy + service title casing |

## Additional findings

| ID | Sev | Issue |
| --- | --- | --- |
| AU-V1 | P2 | PA TierSummaryCards vs SA TierDistribution |
| AU-R1 | P2 | No native Recommended Actions strip |
| AU-S1 | P3 | SA section still says Hub / Developing / Thin |
| AU-D1 | P3 | Demo “diabetes” title casing |

## Live evidence notes

- **PA Demo:** Profile views 116; Booking interest 30.2%; Contact 50.9%; Tanya Hub score 120 / 22.5% booking; tier cards 8/5/0.  
- **PA `tier=Developing`:** Banner Viewing · Building links · 5 Doctor profiles; roster filtered (after patch).  
- **SA Demo:** Views 143; Contact 62.9%; tiers 4/10/16; Mental Health Building links tops views; conversion stacks by tier.  
- **SA `tier=Thin`:** Loads after patch with Needs more links roster investigate path.

## Patch applied in QA11

- `practitioner-authority/page.tsx` — import `AUTHORITY_TIER_FRIENDLY`  
- `service-authority/page.tsx` — import `AUTHORITY_TIER_FRIENDLY`

## Success criteria

- Managers can tell website link strength apart from clinical skill and drill into thin/building rosters.  
- Tier filter must not crash (regression covered).  
- Remaining: filter scoping + shared chrome + optional action strip.
