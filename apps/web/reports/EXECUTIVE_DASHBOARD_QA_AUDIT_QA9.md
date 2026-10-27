# Executive Dashboard QA Audit — QA9

**Assessed:** 2026-10-26  
**Environment:** Admin `http://127.0.0.1:3000/admin/executive`  
**Surfaces:** Website overview · KPI tiles · trends · line charts · placement mix · CSV/PDF/Monthly · How-to · Live/Demo/Empty  
**Live samples:** Demo last_30 · Empty last_7

## Headline scores

| Score | Value |
| --- | ---: |
| **Visual score** | **90** |
| **Functional score** | **92** |
| **Executive-readiness score** | **92** |

**Recommendation:** `EXECUTIVE_DASHBOARD_OPERATIONAL_POLISH`

Website overview is manager-ready: KPI tiles carry trends, targets, health badges, and drill-through; explanations and Demo/Empty modes are clear; CSV · PDF · Monthly exports are present. The main readiness gap is investigation-filter bleed that can show a governance “Expired” banner on the executive surface and pollute the Monthly report link.

## Dimension scores

| Check | Score | Notes |
| --- | ---: | --- |
| KPI cards | 94 | 14 actionable + sessions informational; drill links strong |
| Color usage | 92 | Semantic Healthy/Watch/Attention + restrained chart accents |
| Trend indicators | 95 | ↑↓→ with % vs prev + prior-period tooltip |
| Charts | 86 | 4 SVG series + placement bars; no data-table alternative |
| Exports | 88 | CSV/PDF/Monthly present; filter bleed + no audit trail |
| Explanations | 96 | How-to + metric guides + targets on contact rate |
| Demo mode | 95 | SAMPLE banner; populated KPIs and rankings |
| Responsiveness | 85 | sm/xl grids + scaling SVG; sidebar not collapsible |

## Coverage

| Signal | Coverage |
| --- | --- |
| KPI tiles | **14 actionable + 1 informational** |
| Charts | **4 line + placement bars** |
| Export actions | CSV · PDF · Monthly report |
| Data modes | Live · Demo · Empty |
| Sections | Performance · Patients · Bookings · Calls · Digital Reception |

## Score composition

- **Visual** = mean(KPI, color, charts, responsiveness, trends) → **90**  
- **Functional** = mean(KPI, trends, charts, exports, explanations, demo) → **92**  
- **Executive-readiness** = mean(visual, functional, explanations, exports) → **92**

## Priority fixes

1. **EX-F1 (P1)** — Stop persisting governance `queue` / `from` onto Executive and Monthly unless intentionally investigating from that page.

## Recommendations

| ID | When | Action |
| --- | --- | --- |
| **EX-R1** | **Now** | Scope investigation filters; clear queue/from when leaving governance |
| **EX-R2** | **Now** | Deduplicate Booking click rate across Performance / Bookings |
| EX-R3 | Next | Chart data tables / expandable series |
| EX-R4 | Next | Collapsible admin sidebar on small screens |
| EX-R5 | Later | Export audit trail + monthly KPI drill-through |

## Additional findings

| ID | Sev | Issue |
| --- | --- | --- |
| EX-C1 | P2 | Charts lack accessible data-table alternatives |
| EX-K1 | P2 | Booking click rate duplicated |
| EX-E1 | P2 | No export audit trail |
| EX-M1 | P2 | Sidebar competes with KPI grid on narrow widths |
| EX-Y1 | P3 | Monthly report lacks KPI/chart drill-through |

## Live evidence notes

- **Demo last_30:** Page views 422 ↑+137%; Contact rate 62.9% Healthy ↑+1.6%; Booking clicks 148; 4 charts with aria-labels; rankings for pages/services/doctors; placement mix Header/Dock/Profile/DR/Other.  
- **Empty last_7:** Zeros / em dashes; No rankings empties; Empty mode banner.  
- **Exports:** Header Download CSV · PDF summary · Monthly report (Monthly href can inherit stale `queue`/`from`).  
- **Explanations:** How-to scan order + Key metrics for page views, visits, contact rate, booking click rate, booking clicks, clinic calls.

## Success criteria

- Practice managers can scan visits → contact rate → bookings/calls → top entities without analyst jargon.  
- Demo/Empty modes safe for UAT.  
- Remaining polish: filter scoping, chart a11y tables, mobile chrome, export governance.
