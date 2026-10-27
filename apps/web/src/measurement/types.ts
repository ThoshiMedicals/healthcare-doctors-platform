/** Measurement event contract from PROMPT 2G — dashboard layer consumes these as-is. */

export const MEASUREMENT_VERSION = "2G" as const;

export const PAGE_GROUPS = [
  "home",
  "practitioner",
  "service",
  "advice_hub",
  "advice_article",
  "patient_information",
  "team",
  "booking",
  "other",
] as const;

export type PageGroup = (typeof PAGE_GROUPS)[number];

export const INTENT_BUCKETS = [
  "appointment_booking",
  "fees_billing",
  "referral",
  "repeat_script",
  "new_patient",
  "hotdoc_message",
  "test_results",
  "parking_access",
  "after_hours",
  "telehealth",
  "diabetes",
  "mental_health",
  "skin_check",
  "womens_health",
  "mens_health",
  "child_health",
  "pregnancy",
  "vaccination",
  "practitioner",
  "emergency",
  "clinical_symptom",
  "practice_info",
  "other",
  "unmatched",
] as const;

export type IntentBucket = (typeof INTENT_BUCKETS)[number];

export const RESULT_TYPES = [
  "direct_page",
  "care_journey",
  "no_result",
  "emergency",
  "unavailable",
] as const;

export type ResultType = (typeof RESULT_TYPES)[number];

export const RESULT_STEPS = [
  "article",
  "service",
  "practitioner",
  "book",
  "call",
  "more",
  "shortcut",
] as const;

export type ResultStep = (typeof RESULT_STEPS)[number];

export const CORE_EVENTS = [
  "page_view",
  "book_appointment_click",
  "call_clinic_click",
  "digital_reception_open",
  "digital_reception_search",
  "digital_reception_result_click",
  "task_shortcut_click",
] as const;

export type CoreEventName = (typeof CORE_EVENTS)[number];

export type PeriodGrain = "daily" | "weekly" | "monthly";

/** Inbound event shape from dataLayer / wmc:measurement (may still contain query keys to strip). */
export type RawMeasurementEvent = {
  event?: string;
  measurement_version?: string;
  ts?: string;
  session_id?: string;
  page_path?: string;
  page_group?: string;
  placement?: string;
  destination?: string;
  practitioner?: string;
  task?: string;
  surface?: string;
  intent_bucket?: string;
  result_type?: string;
  result_count?: number | null;
  step?: string;
  query?: string;
  raw_query?: string;
  [key: string]: unknown;
};

/** Dashboard-safe event — never carries raw query text. */
export type MeasurementEvent = {
  event: CoreEventName | string;
  measurement_version: string;
  ts: string;
  session_id?: string;
  page_path: string;
  page_group: PageGroup | string;
  placement?: string;
  destination?: string;
  practitioner?: string;
  task?: string;
  surface?: string;
  intent_bucket?: IntentBucket | string;
  result_type?: ResultType | string;
  result_count?: number | null;
  step?: ResultStep | string;
};

export type CountRow = { key: string; count: number };

export type PeriodBucket = {
  period: string;
  grain: PeriodGrain;
  page_views: number;
  booking_clicks: number;
  call_clicks: number;
  digital_reception_opens: number;
  digital_reception_searches: number;
  digital_reception_result_clicks: number;
  task_shortcuts: number;
};

export type SearchAggregateRow = {
  intent_bucket: string;
  result_type: string;
  searches: number;
  /** Mean of event result_count for this bucket (not raw query text). */
  avg_result_count: number | null;
};

export type DebugRetentionPolicy = {
  ttl_days: 14;
  store_key: "wmc_measurement_debug_queries";
  dashboard_exposes_raw_query: false;
  exposed_search_fields: readonly ["intent_bucket", "result_type", "result_count"];
};
