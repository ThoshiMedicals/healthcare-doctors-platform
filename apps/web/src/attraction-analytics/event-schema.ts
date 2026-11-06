/**
 * Event schema — from docs/proposals/gp-attraction-analytics/event-model.json
 * plus practice_experience / opportunity_pack surfaces for live attraction pages.
 * Analytics never auto-approves EOI or onboarding.
 */

export const ATTRACTION_EVENT_NAMES = [
  "page_view",
  "faq_open",
  "faq_helpful_vote",
  "tool_start",
  "tool_step_view",
  "tool_complete",
  "tool_abandon",
  "cta_click",
  "eoi_start",
  "eoi_field_error",
  "eoi_submit",
  "path_edge",
  "module_view",
  "pack_download",
  /** GP Opportunities product events — advisory only; no hiring automation. */
  "gp_opportunities_view",
  "job_card_open",
  "job_detail_view",
  "opportunity_to_pack",
  "opportunity_to_eoi",
  "opportunity_to_contact",
] as const;

/** Props expected on GP Opportunities engagement events (stored in GpAttractionEvent.props). */
export const OPPORTUNITY_EVENT_PROP_KEYS = [
  "clinicSlug",
  "opportunityId",
  "opportunityType",
  "channel",
  "source",
  "medium",
  "campaign",
  "sessionId",
  "timestamp",
] as const;

/** Canonical opportunityType tokens for employer-brand roles (not job-board categories). */
export const OPPORTUNITY_TYPE_TOKENS = [
  "gp-full-time",
  "gp-part-time",
  "gp-registrar",
  "gp-special-interest",
  "gp-procedural",
  "practice_fit",
] as const;

export type OpportunityTypeToken = (typeof OPPORTUNITY_TYPE_TOKENS)[number];

export type OpportunityAnalyticsMeta = {
  opportunityId: string;
  opportunityType: string;
};

export type AttractionEventName = (typeof ATTRACTION_EVENT_NAMES)[number];

export const ATTRACTION_SURFACES = [
  "gp_opportunities",
  "gp_faq",
  "doctor_readiness",
  "provider_number_readiness",
  "gp_session_planner",
  "gp_eoi",
  "dpa_19ab_navigator",
  "practice_support_matrix",
  "join_our_team",
  "practice_experience",
  "opportunity_pack",
] as const;

export const TRACKED_PRODUCT_SIGNALS = [
  { id: "join_our_team_visits", events: ["page_view"], surface: "join_our_team" },
  { id: "faq_usage", events: ["faq_open", "faq_helpful_vote"], surface: "gp_faq" },
  {
    id: "readiness_completion",
    events: ["tool_complete"],
    toolId: "doctor-readiness",
  },
  {
    id: "session_planner_usage",
    events: ["tool_start", "tool_complete"],
    toolId: "gp-session-planner",
  },
  {
    id: "provider_readiness_completion",
    events: ["tool_complete"],
    toolId: "provider-number-readiness",
  },
  { id: "eoi_paths", events: ["path_edge", "eoi_submit", "eoi_start"] },
  {
    id: "practice_experience_engagement",
    events: ["page_view", "module_view"],
    surface: "practice_experience",
  },
  {
    id: "opportunity_pack_downloads",
    events: ["pack_download", "cta_click"],
    surface: "opportunity_pack",
  },
  {
    id: "gp_opportunities_engagement",
    events: [
      "gp_opportunities_view",
      "job_card_open",
      "job_detail_view",
      "opportunity_to_pack",
      "opportunity_to_eoi",
      "opportunity_to_contact",
      "page_view",
    ],
    surface: "gp_opportunities",
  },
] as const;

/** Forbidden payload keys — proposal identity.forbidden */
export const FORBIDDEN_EVENT_KEYS = [
  "ahpra",
  "ahpranumber",
  "providernumber",
  "provider_number",
  "passport",
  "cv",
  "resume",
  "document",
  "password",
  "medicare",
];

export function looksLikePiiPayload(obj: Record<string, unknown>): string | null {
  const blob = JSON.stringify(obj).toLowerCase();
  for (const key of FORBIDDEN_EVENT_KEYS) {
    if (blob.includes(key) && /med\d{10}/i.test(blob)) {
      return "PII-like fields are not accepted in analytics events";
    }
  }
  if (/med\d{10}/i.test(blob)) return "PII-like fields are not accepted in analytics events";
  if (Object.keys(obj).some((k) => FORBIDDEN_EVENT_KEYS.includes(k.toLowerCase().replace(/_/g, "")))) {
    return "PII-like fields are not accepted in analytics events";
  }
  return null;
}
