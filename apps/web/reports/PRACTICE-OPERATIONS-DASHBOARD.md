# WMC Executive Practice Dashboard — implementation report

**Date:** 2026-11-03  
**Surface:** Practice Briefing (`/admin`) — extended, not redesigned  
**UAT:** `http://127.0.0.1:3100/admin` (also via `next.` tunnel when up)

## New widgets

### Action centre — Needs attention today
| Queue | Source | Href |
| --- | --- | --- |
| Applications awaiting review | Career apps `new` + `reviewing` | `/admin/careers/applications` |
| Patient requests awaiting action | FormRequest `new` + `waiting_for_patient` | `/admin/operations/patient-requests` |
| Reviews due | Search/governance freshness `needs_review` | `/admin/governance/expiry` |
| Overdue content | Freshness `review_overdue` | `/admin/governance/expiry` |
| Missing media metadata | MediaAsset empty `altText` | `/admin/media?alt=missing` |
| Open vacancies | Active vacancies not closed | `/admin/careers/vacancies` |

Tone: critical / attention / watch / ok by count thresholds. Total attention badge excludes open vacancies.

### KPI strips
- **Recruitment:** Active vacancies, Applications today, Awaiting review, Interviews, Hired this month  
- **Patient ops:** New requests, Assigned, Waiting for patient, Overdue, Closed this week  
- **Content:** Reviews due, Reviews overdue, Pages updated this month, Content opportunities  
- **Search intelligence:** Top searches, Rising searches, No-result searches, Highest opportunity score  
- **Media:** Assets, Missing alt text, Unused assets, Recent uploads  

No charts. Cards are queue links only.

## Queries / data path

| Concern | Function | Cost |
| --- | --- | --- |
| Careers | `careerApplicationDashboardStats` | 6× `count` |
| Patient ops | `patientRequestDashboardStats` | 7× `count` |
| Media | `mediaLibraryDashboardStatsForClinic` | 1× `findMany` (select usage/alt/size/dates) |
| Search/content | Existing `searchDemandSignal` (≤3000) + `clinicalReview` + `buildSearchOpportunityDashboard` | Same as prior briefing SCO block |
| Assembler | `buildPracticeOperationsSnapshot` (pure) | CPU only |

Assembler: `apps/web/src/cms/practice-operations-dashboard.ts`  
UI: `apps/web/src/app/admin/(dashboard)/practice-action-centre.tsx`

## Performance impact

- Replaced four separate ops widget sections with one Action Centre + five KPI strips (same underlying queries, slightly more counts).
- Media still uses lightweight DB stats (no disk/`sharp` sync on briefing).
- Search signal fetch unchanged (`take: 3000`).
- No new N+1 loops; no client-side chart libraries.

## Permissions

| Role | Sees Action Centre / KPIs |
| --- | --- |
| `clinic_admin` / network / super (`manage_settings`) | Yes — Practice Briefing |
| `content_editor` / `editor` | No — briefing remains insights-gated; editors keep Content + Operations modules |
| Clinical reviewer / publisher-only | No |

Queue links respect existing module actions (`edit` careers/patient/media; `clinical_signoff` governance; `manage_settings` search opportunities).

## Screenshots

Saved under `apps/web/reports/`:

1. `practice-briefing-action-centre.png` — Action Centre + Recruitment (live UAT, 5 open attention items)  
2. `practice-briefing-ops-kpis.png` — Content, Search intelligence, Media strips  

## QA results

| Check | Result |
| --- | --- |
| Unit: `practice-operations-dashboard.test.ts` | Pass |
| UAT build | Pass |
| Live `/admin` Action Centre visible | Pass (logged-in Super Admin) |
| Live KPI strips + queue links | Pass |
| Tone highlighting (awaiting review amber) | Pass |
| Public site / admin shell redesign | Unchanged |
| Charts | None added |

## Files touched

- `apps/web/src/cms/practice-operations-dashboard.ts` (+ test)
- `apps/web/src/cms/careers-applications.ts` — applicationsToday, hiredThisMonth; awaitingReview = new+reviewing
- `apps/web/src/cms/patient-requests.ts` — waitingForPatient, closedThisWeek
- `apps/web/src/app/admin/(dashboard)/practice-action-centre.tsx`
- `apps/web/src/app/admin/(dashboard)/page.tsx` — Action Centre first, then KPI strips
- Careers / patient module widgets aligned to the same KPI language
