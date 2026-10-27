# Admin Dashboard UX Audit — A8

**Assessed:** 2026-10-26  
**Scope:** Executive, Digital Reception, Practitioner Authority, Service Authority, Conversion Intelligence, Governance Management, Governance Expiry, shared `dashboard-ui`  
**Method:** Expert code/UI review after A1–A7 visualisation work (not lab user testing)

## Headline scores

| Score | Value |
| --- | ---: |
| **Admin UX** | **81** |
| **Admin visual maturity** | **82** |
| **Overall admin platform** | **82** |

**Recommendation:** `STRONG_BASELINE_PLATFORMISE_NEXT_NOT_REBUILD`

The shared design system and visual dashboards are a strong baseline. Next investment should platformise navigation, mobile, accessibility, and hierarchy — not rebuild charts.

## Dimension scores

| Dimension | Score | Notes |
| --- | ---: | --- |
| Visual consistency | 88 | Shared `dashboard-ui` tokens/primitives applied across A1–A6 |
| Readability | 84 | Clear H1/section copy; dense roster tables remain |
| Scanability | 86 | KPI-first layout, chips, bottleneck/flag highlights |
| Mobile usability | 72 | Responsive grids exist; calendar/tables/nav weak on small screens |
| Management usability | 85 | 30-second triage works; no Insights home or export |
| Chart effectiveness | 80 | SSR SVG bars/lines/gauges adequate; limited interaction |
| Colour accessibility | 74 | Labels accompany colour; Hub vs success green collision; no WCAG pack |
| Dashboard hierarchy | 78 | Strong in-page sections; flat CMS nav mixes editing + analytics |

### Score composition

- **Admin UX** = mean(readability, scanability, mobile, management, hierarchy) → 81  
- **Admin visual maturity** = mean(visual consistency, chart effectiveness, colour accessibility, scanability) → 82  
- **Overall** = mean(Admin UX, Admin visual maturity) → 82  

## Strengths

1. One product language via `dashboard-ui` (cards, tiles, badges, trends, empty/loading primitives).
2. Management scan paths are intentional: Executive KPIs, DR resolution bands, Conversion bottleneck, Governance colour queues.
3. Colour is dual-encoded with text chips in most critical surfaces.
4. Range tabs and section shells are consistent across measurement dashboards.

## Gaps (high priority)

1. **Nav hierarchy** — analytics modules sit flat beside content editing; eyebrow still says “Content editing”.
2. **Mobile** — 7-column review calendar, wide tables, long sidebar, chart `min-w` overflow.
3. **LoadingState unused** — warehouse feeds can flash empty/partial without skeletons.
4. **Colour semantics** — Hub/success and Developing/info share palettes; Missing Ownership violet needs contrast check.
5. **No Insights hub** — managers must know which of seven dashboards to open.

## Roadmap

### P0 · ~2 weeks (quick wins)

- Wire `LoadingState` on warehouse-backed pages  
- Group nav: Content / Insights / Governance  
- Calendar cell labels + stacked ranking on small breakpoints  
- Clamp chart min-widths; standardise `DashboardMeta` footers  

### P1 · 30–60 days

- Executive Insights home with deep-links  
- Wider analytics shell; collapsible mobile nav; sticky ranges  
- WCAG AA token audit; distinct Hub palette  
- KPI → filtered queue drill-through  

### P2 · 60–90 days

- Accessible chart data tables / tooltips  
- CSV export for ranks and governance queues  
- Saved range preference  
- Empty-state playbooks with CTAs  

## Per-dashboard snapshot

| Dashboard | Role | Maturity read |
| --- | --- | --- |
| Executive | 30s website health | Strong KPI/chart scan |
| Digital Reception | Search quality | Strong gauges + flags |
| Practitioner Authority | Compare GPs | Strong ranks; table density |
| Service Authority | Compare services | Strong tier mix; DR entries |
| Conversion Intelligence | Bottlenecks | Strong funnel; long scroll |
| Governance Management | Review workload | Strong chips/calendar |
| Governance Expiry | Due/expired mix | Aligned chips/progress |

## Evidence paths

- Shared system: `apps/web/src/app/admin/(dashboard)/dashboard-ui/`  
- Scorecard: `apps/web/src/readiness/admin-dashboard-maturity.ts`  
