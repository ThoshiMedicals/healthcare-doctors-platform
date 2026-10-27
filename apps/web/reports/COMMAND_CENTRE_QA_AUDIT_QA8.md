# Command Centre QA Audit — QA8

**Assessed:** 2026-10-26  
**Environment:** Admin `http://127.0.0.1:3000/admin`  
**Surfaces:** Practice briefing · health score · recommended actions · alerts · personas · Live/Demo/Empty · deep links · mobile chrome  
**Live samples:** Demo mode recommendations → expired governance queue (`from=recommendation`); Empty mode; `persona=governance_lead`

## Headline scores

| Score | Value |
| --- | ---: |
| **Command Centre Score** | **93** |
| **Management Usability Score** | **94** |

**Recommendation:** `COMMAND_CENTRE_OPERATIONAL_POLISH`

The briefing is operationally strong: managers get a health gauge, prioritised actions with Fix List / Investigation / Related Dashboard, role-ordered layouts, and working Live · Demo · Empty modes. The main polish gap is a health **label vs numeric band** contradiction when open alerts force Needs Attention above a Watch/Healthy score.

## Dimension scores

| Check | Score | Notes |
| --- | ---: | --- |
| Health score | 88 | 7 domains + launch readiness; alert-forced band can contradict legend |
| Recommendations | 97 | P0/P1 with action, reason, impact, triple deep links |
| Alerts | 95 | Governance / Booking / Search panels; clear All clear empties |
| Role views | 96 | 4 personas reorder sections; query-only switcher |
| Deep links | 98 | Demo Fix List → review board Expired + InvestigationBanner |
| Demo mode | 96 | SAMPLE banner; populated queues and recommendations |
| Empty mode | 90 | Zero activity + All clear; Analytics domain still NA |
| Mobile UX | 84 | How-to collapses; sidebar not drawer-collapsed |
| Visual hierarchy | 91 | Clear scan order; expanded How-to can bury health |

## Coverage

| Signal | Coverage |
| --- | --- |
| Personas | **4 / 4** |
| Data modes | Live · Demo · Empty |
| Alert panels | Governance · Booking journey · Search |
| Recommendation deep links | Fix List · Investigation · Related Dashboard |
| Live deep-link verify | Expired queue · `from=recommendation` |

## Score composition

- **Command Centre Score** = mean(nine CHECK dimensions) → **93**  
- **Management Usability Score** = mean(recommendations, deep links, role views, alerts, hierarchy, mobile, C8 management baseline) → **94**

## Priority fixes

1. **CC-H1 (P1)** — Stop labelling Watch/Healthy numeric scores as Needs Attention; separate alert urgency from score band.

## Recommendations

| ID | When | Action |
| --- | --- | --- |
| **CC-R1** | **Now** | Align health score label with published 85+ / 70–84 / &lt;70 bands |
| **CC-R2** | **Now** | Collapse How-to by default after first visit |
| CC-R3 | Next | Collapsible admin sidebar on small screens |
| CC-R4 | Next | In-UI persona switcher chips |
| CC-R5 | Later | Soften Empty-mode Analytics “Needs Attention” narrative |

## Additional findings

| ID | Sev | Issue |
| --- | --- | --- |
| CC-M1 | P2 | Sidebar stays on-canvas at narrow widths |
| CC-V1 | P2 | How-to briefing can dominate first viewport |
| CC-E1 | P3 | Empty mode Analytics NA vs overall Healthy |
| CC-P1 | P3 | Persona views are query-only |

## Live evidence notes

- **Live:** Overall Health 92 with domain tiles; Missing Owner / Awaiting review alerts; recommendations idle when queues look healthy.  
- **Demo:** Health 84; P0 governance cluster + Tanya conversion + Vaccination search actions; each with Fix List / Investigation / Related Dashboard.  
- **Empty:** Banner “zero activity”; All clear alerts; No guided actions; leaders show em dashes.  
- **Governance Lead persona:** Sections reorder to guidance → alerts → health; status “Showing Governance Lead priority”.  
- **Deep link:** `/admin/governance/management?data=demo&queue=expired&from=recommendation` opens Remediation · Expired with InvestigationBanner “From recommendation”.

## Success criteria

- Managers can start each day on `/admin`, read health, act on recommendations, and land in the exact remediation queue.  
- Demo and Empty modes are safe for UAT / training.  
- Remaining polish: band/label honesty, mobile chrome, first-viewport hierarchy.
