# GP Operational Pipeline — Implementation Map

Connects **existing proposals only**:

```
Doctor Readiness → EOI → Session Matching → Onboarding → First 90 Days
```

| Stage | Proposal | Status / models |
| --- | --- | --- |
| Doctor Readiness | `docs/proposals/doctor-readiness/` | `GpDoctorReadinessResult` (advisory bands) |
| EOI | `docs/proposals/gp-eoi/` + `admin-gp-enquiries-dashboard/` | `GpEnquiry`, audits, notes |
| Session Matching | `docs/proposals/session-capacity-matching/` | `SessionCapacityMatchRun` (advisory) |
| Onboarding | `docs/proposals/gp-onboarding-workflow/` | `GpOnboardingCase` + gates/tasks |
| First 90 Days | `docs/proposals/gp-first-90-days/` | `GpFirst90SettlingCase` after `go_live` |

## Rules (from proposals)

- No automated hire / go-live / credential approval
- Scores and match % prioritise human review only
- Notifications never count as approvals (`countsAsApproval=false`)
- Medicare provider numbers: Services Australia — not WMC

## Admin

- Board: `/admin/gp-pipeline`
- Map: `/admin/gp-pipeline/architecture`
- Enquiry detail + actions: `/admin/gp-pipeline/enquiries/[id]`

## APIs

Under `/api/admin/gp-pipeline/*` — see architecture page / `workflow-map.ts`.

## Code

`apps/web/src/gp-pipeline/`
