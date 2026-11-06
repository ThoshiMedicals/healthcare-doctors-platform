/**
 * Workflow implementation map — proposal sources only.
 * Doctor Readiness → EOI → Session Matching → Onboarding → First 90 Days
 */

export const PIPELINE_STAGES = [
  {
    id: "doctor_readiness",
    label: "Doctor Readiness",
    proposal: "docs/proposals/doctor-readiness/",
    model: "GpDoctorReadinessResult",
    next: "eoi",
    rule: "Advisory bands only — never a hire decision. nextAction may suggest submit_eoi.",
  },
  {
    id: "eoi",
    label: "Expression of Interest",
    proposal: "docs/proposals/gp-eoi/ + admin-gp-enquiries-dashboard/",
    model: "GpEnquiry + GpEnquiryEoiSnapshot",
    next: "session_matching",
    rule: "Human status changes require actorUserId. Scores prioritise review order only.",
  },
  {
    id: "session_matching",
    label: "Session Matching",
    proposal: "docs/proposals/session-capacity-matching/",
    model: "SessionCapacityMatchRun",
    next: "onboarding",
    rule: "Advisory compatibilityScore — humans confirm allocation at onboarding session_allocation gate.",
  },
  {
    id: "onboarding",
    label: "Onboarding",
    proposal: "docs/proposals/gp-onboarding-workflow/",
    model: "GpOnboardingCase",
    next: "first_90_days",
    rule: "Seven stages with human gates. No automated approvals. PN issued by Services Australia.",
  },
  {
    id: "first_90_days",
    label: "First 90 Days",
    proposal: "docs/proposals/gp-first-90-days/",
    model: "GpFirst90SettlingCase",
    next: null,
    rule: "Opens after go_live gate. Continuity over volume. No earnings/list guarantees.",
  },
] as const;

export const ONBOARDING_STAGE_ORDER = [
  "initial_discussion",
  "eoi_review",
  "credential_checks",
  "provider_number_preparation",
  "session_allocation",
  "orientation",
  "go_live",
] as const;

export const API_INTEGRATIONS = [
  {
    method: "POST",
    path: "/api/admin/gp-pipeline/readiness",
    connects: "Doctor Readiness → optional attach to EOI",
  },
  {
    method: "POST",
    path: "/api/admin/gp-pipeline/eoi",
    connects: "EOI submit → GpEnquiry + notification eoi_submitted",
  },
  {
    method: "POST",
    path: "/api/admin/gp-pipeline/enquiries/[id]/status",
    connects: "Human EOI status / progress → optional open onboarding",
  },
  {
    method: "POST",
    path: "/api/admin/gp-pipeline/session-match",
    connects: "Session prefs → advisory SessionCapacityMatchRun",
  },
  {
    method: "POST",
    path: "/api/admin/gp-pipeline/onboarding",
    connects: "Create onboarding case from enquiry",
  },
  {
    method: "POST",
    path: "/api/admin/gp-pipeline/onboarding/[id]/gates",
    connects: "Human gate → advance stages; go_live opens First 90",
  },
  {
    method: "POST",
    path: "/api/admin/gp-pipeline/first90/[id]/checklist",
    connects: "First 90 checklist / close to BAU",
  },
] as const;
