# Digital Reception QA Audit — QA10

**Assessed:** 2026-10-26  
**Environment:** Admin `http://127.0.0.1:3000/admin/digital-reception`  
**Surfaces:** Online reception & search · gauges · funnel · intent/destination charts · flagged intents · watchlist · How-to · Live/Demo/Empty  
**Live samples:** Demo last_30 · intent=vaccination focus · Empty last_7

## Headline scores

| Score | Value |
| --- | ---: |
| **Search intelligence score** | **94** |
| **Usability score** | **91** |
| **Actionability score** | **87** |

**Recommendation:** `DIGITAL_RECEPTION_OPERATIONAL_POLISH`

Search intelligence is strong: resolution gauges, colour-coded intent charts, clickable funnel, and a live Vaccine flag. Usability is high via How-to and clear scan order. Actionability drops because governance investigation filters bleed onto Search and inject the wrong “Recommendations” (clinical review due dates) while managers investigate intents.

## Dimension scores

| Check | Score | Notes |
| --- | ---: | --- |
| Gauges | 94 | Success 84.8% Healthy · open rate · searches · zero-result |
| Funnels | 93 | 5 stages with drop badges; click-to-investigate |
| Intent charts | 95 | Top 10 + destinations; HV/LR flags; Focused state |
| Recommendations | 78 | Flagged/watchlist act as recs; banner polluted by governance |
| Filters | 82 | Range + data mode + intent focus; queue bleed; weak chips |
| Drill-through | 94 | Intent hash focus · funnel stages · destination bars |
| Help content | 96 | How-to + metric guides + resolution legend |
| Demo mode | 95 | SAMPLE banner; populated funnel/intents/watchlist |

## Coverage

| Signal | Coverage |
| --- | --- |
| Gauges | Resolution · Open rate · Searches · Zero-result |
| Funnel stages | Open → Search → Result click → Booking → Call |
| Intent bars | Top 10 + destination bars |
| Watchlist | New patient · HotDoc message · Vaccine |
| Data modes | Live · Demo · Empty |

## Score composition

- **Search intelligence** = mean(gauges, funnels, intent charts, demo) → **94**  
- **Usability** = mean(help, filters, gauges, funnels) → **91**  
- **Actionability** = mean(recommendations, drill-through, intent charts, filters) → **87**

## Priority fixes

1. **DR-F1 (P1)** — Stop governance `queue`/`from` from driving Search investigation banners and remediation copy.

## Recommendations

| ID | When | Action |
| --- | --- | --- |
| **DR-REC1** | **Now** | Isolate investigation filters by dashboard family |
| **DR-REC2** | **Now** | Active intent/service filter chips with clean clear |
| DR-REC3 | Next | Native search Recommended Actions strip |
| DR-REC4 | Next | Fix flagged empty-state “watchlist” copy |
| DR-REC5 | Later | Optional PDF export for Search briefings |

## Additional findings

| ID | Sev | Issue |
| --- | --- | --- |
| DR-R1 | P2 | No native Recommended Actions panel |
| DR-X1 | P2 | Intent focus lacks filter chrome |
| DR-E1 | P3 | Export is CSV-only |
| DR-H1 | P3 | Flagged empty copy says “watchlist” |

## Live evidence notes

- **Demo last_30:** Search success 84.8% (89/105); open rate 27.6%; zero-result 15.2%; Vaccine flagged 38.5%; funnel Call −100% drop; destinations Booking 58 / Profile 54 / Service 14.  
- **intent=vaccination:** Focused badges on flagged row + intent chart; investigation banner still shows Viewing · Expired + governance recommendations.  
- **Empty:** Not enough data gauges; Nothing on the watchlist (flagged); No journey activity; No searches / No result clicks; watchlist cards show —.

## Success criteria

- Managers can see whether site search helps patients and which topics to fix first.  
- Demo/Empty safe for UAT.  
- Remaining polish: filter scoping so Search recommendations stay search-specific; filter chips; optional native action strip.
