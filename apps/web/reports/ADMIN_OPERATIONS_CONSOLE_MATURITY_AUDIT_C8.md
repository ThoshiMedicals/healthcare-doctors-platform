# Operations Console Maturity Audit — C8

**Assessed:** 2026-10-26  
**Scope:** Final post-implementation review after A1–A8 + B2–B8 + C1–C7  
**Method:** Expert code/UI review (not lab user testing)

## Headline scores

| Headline | Score |
| --- | ---: |
| **Operations Console Maturity** | **94** |
| **Management Usability** | **97** |
| **Operational Intelligence** | **95** |
| **Admin Platform Score** | **93** |

**Recommendation:** `OPERATIONS_CONSOLE_MAINTAIN_AND_POLISH`

The admin surface is a complete operations console: Insights Home as a command centre, role personas, persistent filters, CSV/PDF exports across intelligence dashboards, recommended actions, and a single Overall Health Score. Remaining work is polish (mobile nav chrome, calendar dual-encoding, chart data tables) — not platform redesign.

### Movement since B8 (pre-C series baseline in report)

| Dimension | B8 report | C8 | Δ |
| --- | ---: | ---: | ---: |
| Insights Home / command centre | gap | 96 | closed |
| Exports (intelligence suite) | partial | 95 | +breadth |
| Role views | planned | 94 | closed |
| Recommendations | planned | 95 | closed |
| Operations Console Maturity | ~89 platform | **94** | +5 |
| Management Usability | 91 | **97** | +6 |
| Admin Platform Score | 89 | **93** | +4 |

## Score composition

### Operations Console Maturity — **94**

Mean of the eight C8 assessment dimensions:

| Dimension | Score |
| --- | ---: |
| Insights Home | 96 |
| Navigation | 90 |
| Exports | 95 |
| Accessibility | 91 |
| Role Views | 94 |
| Recommendations | 95 |
| Cross-Dashboard Navigation | 95 |
| Operational Workflows | 94 |

### Management Usability — **97**

Shareable CSV/PDF exports, governance queue drill-through, persistent Insights filters, persona-prioritised home, KPI scan + Overall Health Score.

### Operational Intelligence — **95**

Mean of platform-health KPI (C7), recommended-action guidance (C6), alert→workflow coverage, analytics/authority/conversion depth, and trend indicators.

### Admin Platform Score — **93**

Mean(Operations Console 94, Management Usability 97, Operational Intelligence 95, Admin UX 94, Accessibility 91, Mobile 87).

Supporting:

- **Admin UX** = mean(readability 92, scanability 96, mobile 87, management 97, hierarchy 97) → **94**
- **Admin visual maturity** = mean(visual consistency 91, chart effectiveness 87, accessibility 91, scanability 96) → **91**

## What closed in C1–C7

| Prompt | Outcome |
| --- | --- |
| C1 | `/admin` command centre — health, trends, leaders, alerts |
| C2 | Analytics shell widened to `max-w-7xl` |
| C3 | CSV exports for DR, authority, conversion (+ existing executive/governance) |
| C4 | Role personas reorder Insights Home without changing permissions |
| C5 | Persistent Insights filters (URL + cookie) via `InsightsFilterSync` |
| C6 | Recommended actions panel from DR / governance / authority / conversion |
| C7 | Unified Overall Health Score + seven domain subscores + trends |

## Dimension assessment

### 1. Insights Home — 96

**Strengths**

- Command centre snapshot with Overall Health Score, launch readiness, trends, leaders, alerts.
- Persona-driven section order (`insights-persona.ts`).
- Recommended actions sit in the same home workflow.

**Gaps**

- Persona switcher is query-param based; no saved-view UI yet.

### 2. Navigation — 90

**Strengths**

- CMS groups: Content / Insights / Governance (`cms/modules.ts`).
- `InsightsNav` strip on every intelligence dashboard.
- Command Centre linked as Insights home.

**Gaps**

- Grouped sidebar is long and not collapsible on small screens (high-priority residual).

### 3. Exports — 95

**Strengths**

- Export APIs: executive, monthly-executive, digital-reception, practitioner/service authority, conversion-intelligence, governance.
- Shared `ExportActions` on dashboards.

**Gaps**

- No download audit trail.

### 4. Accessibility — 91

**Strengths**

- Separated semantic vs authority palettes; WCAG AA badge contrast (`COLOUR_ACCESSIBILITY_AUDIT`).
- Status badges + text labels; TrendIndicator dual-encodes direction.

**Gaps**

- Desktop governance calendar still colour-first.
- Charts lack accessible data-table alternatives.

### 5. Role Views — 94

**Strengths**

- Four personas: Practice Owner, Practice Manager, Governance Lead, Marketing/Growth.
- Presentation-only — never grants/revokes CMS actions.
- Section / alert / leader priority differs by persona.

**Gaps**

- Personas do not yet persist as a saved preference (query override only).

### 6. Recommendations — 95

**Strengths**

- `buildRecommendedActions` prioritises governance expiry, DR watchlist, weak authority converters, conversion opportunities.
- Deep-links into the correct dashboard/queue.

**Gaps**

- No dismiss / snooze / ownership assignment on actions yet.

### 7. Cross-Dashboard Navigation — 95

**Strengths**

- Shared href helpers with range + focus/queue.
- Cookie-backed filter persistence across routes.
- Focus banners and ranking drill-through.

**Gaps**

- A few executive KPI tiles still lack dedicated drill-through.

### 8. Operational Workflows — 94

**Strengths**

- Governance queues ↔ management CSV ↔ expiry buckets.
- DR flagged intents / watchlist → Digital Reception.
- Conversion bottlenecks / weak paths → Conversion Intelligence.
- Platform health unifies Search · DR · Governance · Analytics · Conversion · Authority · Accessibility.

**Gaps**

- Empty-state playbooks incomplete on some authority/conversion empties.

## Remaining high-priority gaps

1. **Mobile chrome** — Insights/Governance sidebar not collapsible.
2. **Desktop calendar** — colour-first cells (mobile list already dual-encodes).
3. **Chart a11y** — no data-table fallbacks / rich tooltips.

## Roadmap

### P0 · ~2 weeks

- Collapsible mobile admin nav
- Dual-encode desktop calendar cells (text + tone)

### P1 · 30–60 days

- Empty-state playbooks with next-action CTAs
- Broader executive KPI drill-through
- Export audit log

### P2 · 60–90 days

- Accessible chart data tables / tooltips
- Optional interactive charts only where needed
- Saved Insights views per persona

## Per-surface snapshot

| Surface | Maturity read after C-series |
| --- | --- |
| Insights Home (`/admin`) | Complete ops command centre + health KPI + guidance |
| Executive / Monthly | Strong scan + exports + drill-through |
| Digital Reception | Gauges, watchlist, CSV, filter persistence |
| Practitioner / Service Authority | Focus filter, roster cards, CSV |
| Conversion Intelligence | Funnel + opportunities + CSV |
| Governance Management / Expiry / Review | Queues, CSV, cross-links |
| Platform Health (C7) | Single Overall Health Score + domain trends |

## Evidence paths

- Scorecard: `apps/web/src/readiness/admin-dashboard-maturity.ts`
- Command centre: `apps/web/src/measurement/command-centre-report.ts`, `apps/web/src/app/admin/(dashboard)/page.tsx`
- Platform health: `apps/web/src/measurement/platform-health-score.ts`
- Personas: `apps/web/src/app/admin/(dashboard)/insights-persona.ts`
- Filters: `apps/web/src/app/admin/(dashboard)/dashboard-ui/insights-filters.ts`
- Recommendations: `apps/web/src/measurement/recommended-actions.ts`
- Exports: `apps/web/src/app/api/admin/exports/`
- Design system: `apps/web/src/app/admin/(dashboard)/dashboard-ui/`
