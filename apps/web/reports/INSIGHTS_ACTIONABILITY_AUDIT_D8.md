# Insights Actionability Audit — D8

**Assessed:** 2026-10-26  
**Scope:** Every Insights dashboard after D1–D7  
**Method:** Expert code/UI review (not lab stopwatch timing)

## Headline scores

| Headline | Score |
| --- | ---: |
| **Actionability Score** | **93** |
| **Management Efficiency Score** | **93** |

**Recommendation:** `ACTIONABLE_WITH_POLISH`

Managers can resolve the common operational issues (weak search intents, thin authority, booking drop-offs, governance queues) with a short click path: signal → filtered investigation → fix list / record. Remaining friction is concentrated on **Executive monthly** and a few cross-cutting polish items — not a missing remediation model.

## Score composition

### Measures (suite averages)

| Measure | Score | What it checks |
| --- | ---: | --- |
| Actionability | 94 | KPIs / cards open a filtered workflow or are labelled informational |
| Click-through coverage | 92 | Charts, ranks, queues, and recommendations deep-link |
| Workflow completeness | 94 | Signal → affected items → next action / owner / due |
| Investigation continuity | 93 | `from` stamps + investigation banner + persistent filters |
| Time-to-remediation | 92 | Few hops from insight to record / queue / focused roster |

**Actionability Score** = mean of ten dashboard overalls.  
**Management Efficiency Score** = mean(investigation continuity, time-to-remediation, workflow completeness).

## Per-dashboard results

| Dashboard | Overall | Actionability | Click-through | Workflow | Continuity | Time-to-fix |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Insights Home | 97 | 98 | 97 | 99 | 97 | 96 |
| Executive | 93 | 94 | 92 | 93 | 94 | 90 |
| Executive monthly | 69 | 72 | 68 | 70 | 65 | 68 |
| Digital Reception | 96 | 97 | 96 | 96 | 98 | 94 |
| Practitioner Authority | 97 | 97 | 96 | 97 | 98 | 95 |
| Service Authority | 97 | 97 | 96 | 97 | 98 | 95 |
| Conversion Intelligence | 95 | 96 | 95 | 96 | 97 | 93 |
| Governance review | 98 | 98 | 97 | 99 | 97 | 98 |
| Governance management | 97 | 98 | 97 | 98 | 97 | 97 |
| Governance expiry | 89 | 90 | 88 | 91 | 86 | 92 |

## What D1–D7 unlocked

| Prompt | Contribution to actionability |
| --- | --- |
| D1 | KPI tiles navigate or declare informational |
| D2 | Authority tiers open filtered rosters + why / recommendations |
| D3 | Platform health domains open focused dashboards |
| D4 | Charts / funnels / gauges open investigations |
| D5 | Governance queues open remediation with owner + due |
| D6 | Shared investigation banner (Viewing · Continue · Recommendations · Clear) |
| D7 | Recommended actions: Fix List · Investigation · Related Dashboard |

## Remaining non-actionable elements

| ID | Severity | Surface | Element | Why it still slows managers |
| --- | --- | --- | --- | --- |
| NA-1 | High | Executive monthly | KPI / chart suite | Little drill-through into DR / Conversion / authority |
| NA-2 | Medium | Executive monthly | Investigation continuity | No banner / `from` handoff — must leave monthly to remediate |
| NA-3 | Medium | Cross-cutting | Bare sibling footers | Some Executive links drop filters and reset context |
| NA-4 | Medium | Governance management | Desktop calendar | Colour-first cells without text dual-encoding |
| NA-5 | Low | Executive | Informational volume KPI | Intentional D1 context tile |
| NA-6 | Low | Cross-cutting | Chart data tables | Missing accessible table alternatives |
| NA-7 | Low | Practitioner Authority | CMS edit handoff | Publishing still leaves Insights |
| NA-8 | Low | Governance expiry | Investigation banner | Focused report without shared D6 chrome |

## Success criteria

**Managers can resolve issues with minimal navigation friction** — met for the weekly Insights suite and governance remediation paths. Close NA-1/NA-2 (monthly parity) and NA-3 (footer filter preservation) to move from `ACTIONABLE_WITH_POLISH` to `ACTIONABLE_OPERATIONS_READY`.
