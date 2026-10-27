import {
  aggregateBookingDestinations,
  aggregateByPageGroup,
  aggregateByPath,
  aggregateByPeriod,
  aggregateResultClickSteps,
  aggregateSearchIntents,
  aggregateTaskShortcutBreakdown,
  coreMetricTotals,
  prepareEvents,
} from "@/measurement/aggregate";
import type {
  CountRow,
  DebugRetentionPolicy,
  MeasurementEvent,
  PeriodBucket,
  PeriodGrain,
  RawMeasurementEvent,
  SearchAggregateRow,
} from "@/measurement/types";

export const DEBUG_RETENTION_POLICY: DebugRetentionPolicy = {
  ttl_days: 14,
  store_key: "wmc_measurement_debug_queries",
  dashboard_exposes_raw_query: false,
  exposed_search_fields: ["intent_bucket", "result_type", "result_count"] as const,
};

export type GovernanceSnapshotInput = {
  overdue: number;
  due_within_horizon: number;
  current: number;
  hidden_until_approved: number;
  total: number;
};

export type DashboardMeta = {
  grain: PeriodGrain;
  generated_at: string;
  event_count: number;
  measurement_version: "2G";
  privacy: DebugRetentionPolicy;
};

function meta(events: MeasurementEvent[], grain: PeriodGrain): DashboardMeta {
  return {
    grain,
    generated_at: new Date().toISOString(),
    event_count: events.length,
    measurement_version: "2G",
    privacy: DEBUG_RETENTION_POLICY,
  };
}

function practitionerSlug(path: string): string {
  const normalized = String(path || "").replace(/^\/+/, "");
  if (!normalized.startsWith("doctors/")) return "";
  return normalized.replace(/^doctors\//, "").replace(/\.html$/, "");
}

function serviceSlug(path: string): string {
  const normalized = String(path || "").replace(/^\/+/, "");
  if (normalized === "services.html") return "services";
  if (!normalized.startsWith("services/")) return "";
  return normalized.replace(/^services\//, "").replace(/\.html$/, "");
}

export type ExecutiveDashboardDataset = {
  dashboard: "executive";
  meta: DashboardMeta;
  totals: ReturnType<typeof coreMetricTotals>;
  series: PeriodBucket[];
  page_views_by_group: CountRow[];
};

export type DigitalReceptionDashboardDataset = {
  dashboard: "digital_reception";
  meta: DashboardMeta;
  totals: {
    opens: number;
    searches: number;
    result_clicks: number;
  };
  series: PeriodBucket[];
  /** Search dimensions only — intent_bucket, result_type, result_count summary. */
  searches_by_intent: SearchAggregateRow[];
  result_clicks_by_step: CountRow[];
};

export type PractitionerDashboardDataset = {
  dashboard: "practitioner";
  meta: DashboardMeta;
  series: PeriodBucket[];
  practitioners: Array<{
    practitioner: string;
    page_views: number;
    booking_clicks: number;
    call_clicks: number;
  }>;
};

export type ServiceDashboardDataset = {
  dashboard: "service";
  meta: DashboardMeta;
  series: PeriodBucket[];
  services: Array<{
    service: string;
    page_views: number;
    booking_clicks: number;
    call_clicks: number;
  }>;
  page_views_by_path: CountRow[];
};

export type GovernanceDashboardDataset = {
  dashboard: "governance";
  meta: DashboardMeta;
  review_status: GovernanceSnapshotInput | null;
  traffic_on_patient_information: number;
  traffic_by_page_group: CountRow[];
  series: PeriodBucket[];
};

function practitionerEvents(events: MeasurementEvent[]) {
  return events.filter((e) => e.page_group === "practitioner" || Boolean(e.practitioner) || practitionerSlug(e.page_path));
}

function serviceEvents(events: MeasurementEvent[]) {
  return events.filter((e) => e.page_group === "service" || Boolean(serviceSlug(e.page_path)));
}

export function buildExecutiveDashboard(
  raw: Array<RawMeasurementEvent | MeasurementEvent>,
  grain: PeriodGrain = "daily",
): ExecutiveDashboardDataset {
  const events = prepareEvents(raw);
  return {
    dashboard: "executive",
    meta: meta(events, grain),
    totals: coreMetricTotals(events),
    series: aggregateByPeriod(events, grain),
    page_views_by_group: aggregateByPageGroup(events, "page_view"),
  };
}

export function buildDigitalReceptionDashboard(
  raw: Array<RawMeasurementEvent | MeasurementEvent>,
  grain: PeriodGrain = "daily",
): DigitalReceptionDashboardDataset {
  const events = prepareEvents(raw);
  const totals = coreMetricTotals(events);
  return {
    dashboard: "digital_reception",
    meta: meta(events, grain),
    totals: {
      opens: totals.digital_reception_opens,
      searches: totals.digital_reception_searches,
      result_clicks: totals.digital_reception_result_clicks,
    },
    series: aggregateByPeriod(events, grain),
    searches_by_intent: aggregateSearchIntents(events),
    result_clicks_by_step: aggregateResultClickSteps(events),
  };
}

export function buildPractitionerDashboard(
  raw: Array<RawMeasurementEvent | MeasurementEvent>,
  grain: PeriodGrain = "daily",
): PractitionerDashboardDataset {
  const all = prepareEvents(raw);
  const events = practitionerEvents(all);
  const bySlug = new Map<string, { page_views: number; booking_clicks: number; call_clicks: number }>();

  for (const event of events) {
    const slug = String(event.practitioner || practitionerSlug(event.page_path) || "unknown");
    const row = bySlug.get(slug) || { page_views: 0, booking_clicks: 0, call_clicks: 0 };
    if (event.event === "page_view") row.page_views += 1;
    if (event.event === "book_appointment_click") row.booking_clicks += 1;
    if (event.event === "call_clinic_click") row.call_clicks += 1;
    bySlug.set(slug, row);
  }

  return {
    dashboard: "practitioner",
    meta: meta(events, grain),
    series: aggregateByPeriod(events, grain),
    practitioners: [...bySlug.entries()]
      .map(([practitioner, counts]) => ({ practitioner, ...counts }))
      .sort((a, b) => b.page_views - a.page_views || a.practitioner.localeCompare(b.practitioner)),
  };
}

export function buildServiceDashboard(
  raw: Array<RawMeasurementEvent | MeasurementEvent>,
  grain: PeriodGrain = "daily",
): ServiceDashboardDataset {
  const all = prepareEvents(raw);
  const events = serviceEvents(all);
  const bySlug = new Map<string, { page_views: number; booking_clicks: number; call_clicks: number }>();

  for (const event of events) {
    const slug = serviceSlug(event.page_path) || "unknown";
    const row = bySlug.get(slug) || { page_views: 0, booking_clicks: 0, call_clicks: 0 };
    if (event.event === "page_view") row.page_views += 1;
    if (event.event === "book_appointment_click") row.booking_clicks += 1;
    if (event.event === "call_clinic_click") row.call_clicks += 1;
    bySlug.set(slug, row);
  }

  return {
    dashboard: "service",
    meta: meta(events, grain),
    series: aggregateByPeriod(events, grain),
    services: [...bySlug.entries()]
      .map(([service, counts]) => ({ service, ...counts }))
      .sort((a, b) => b.page_views - a.page_views || a.service.localeCompare(b.service)),
    page_views_by_path: aggregateByPath(events, "page_view"),
  };
}

export function buildGovernanceDashboard(
  raw: Array<RawMeasurementEvent | MeasurementEvent>,
  grain: PeriodGrain = "daily",
  reviewStatus: GovernanceSnapshotInput | null = null,
): GovernanceDashboardDataset {
  const events = prepareEvents(raw);
  const patientInfoViews = events.filter(
    (e) => e.event === "page_view" && e.page_group === "patient_information",
  ).length;

  return {
    dashboard: "governance",
    meta: meta(events, grain),
    review_status: reviewStatus,
    traffic_on_patient_information: patientInfoViews,
    traffic_by_page_group: aggregateByPageGroup(events, "page_view"),
    series: aggregateByPeriod(events, grain),
  };
}

export type DashboardSuite = {
  executive: ExecutiveDashboardDataset;
  digital_reception: DigitalReceptionDashboardDataset;
  practitioner: PractitionerDashboardDataset;
  service: ServiceDashboardDataset;
  governance: GovernanceDashboardDataset;
};

/** Build all five dashboard datasets from the same event stream without changing collection. */
export function buildDashboardSuite(
  raw: Array<RawMeasurementEvent | MeasurementEvent>,
  grain: PeriodGrain = "daily",
  reviewStatus: GovernanceSnapshotInput | null = null,
): DashboardSuite {
  return {
    executive: buildExecutiveDashboard(raw, grain),
    digital_reception: buildDigitalReceptionDashboard(raw, grain),
    practitioner: buildPractitionerDashboard(raw, grain),
    service: buildServiceDashboard(raw, grain),
    governance: buildGovernanceDashboard(raw, grain, reviewStatus),
  };
}

/** Helper re-exports used by admin tooling / tests. */
export const dashboardHelpers = {
  aggregateByPeriod,
  aggregateSearchIntents,
  aggregateTaskShortcutBreakdown,
  aggregateBookingDestinations,
  coreMetricTotals,
  prepareEvents,
};
