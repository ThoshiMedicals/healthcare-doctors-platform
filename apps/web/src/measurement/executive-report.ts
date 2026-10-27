import { prepareEvents } from "@/measurement/aggregate";
import { DEBUG_RETENTION_POLICY } from "@/measurement/datasets";
import {
  EXECUTIVE_RANGES,
  EXECUTIVE_RANGE_LABEL,
  eventBrisbaneDate,
  filterEventsByRange,
  resolveExecutiveRange,
  type ExecutiveRange,
} from "@/measurement/ranges";
import type { CountRow, MeasurementEvent, RawMeasurementEvent } from "@/measurement/types";

export type BookingPlacementKey = "header" | "dock" | "profile" | "digital_reception" | "other";

export type ExecutiveRateCard = {
  key: "contact_rate" | "booking_intent_rate" | "call_intent_rate";
  label: string;
  value: number | null;
  numerator: number;
  denominator: number;
  definition: string;
  trend: MetricTrend;
};

export type TrendDirection = "up" | "down" | "flat";

export type MetricTrend = {
  current: number;
  previous: number;
  delta: number;
  delta_pct: number | null;
  direction: TrendDirection;
};

export type DailySeriesPoint = {
  date: string;
  traffic: number;
  booking_clicks: number;
  call_clicks: number;
  sessions: number;
  contact_rate: number | null;
};

export type PracticeExecutiveDashboard = {
  dashboard: "executive_practice";
  range: ExecutiveRange;
  range_label: string;
  start: string;
  end: string;
  previous_start: string;
  previous_end: string;
  generated_at: string;
  privacy: typeof DEBUG_RETENTION_POLICY;
  kpis: {
    traffic: number;
    sessions: number;
    booking_clicks: number;
    clinic_calls: number;
  };
  trends: {
    traffic: MetricTrend;
    sessions: MetricTrend;
    booking_clicks: MetricTrend;
    clinic_calls: MetricTrend;
    contact_actions: MetricTrend;
    contact_rate: MetricTrend;
  };
  rates: ExecutiveRateCard[];
  series: DailySeriesPoint[];
  top_pages: CountRow[];
  top_services: CountRow[];
  top_practitioners: CountRow[];
  booking_placement_mix: Array<{ placement: BookingPlacementKey; count: number; share: number }>;
  digital_reception: {
    opens: number;
    searches: number;
    result_clicks: number;
    booking_clicks: number;
    clinic_calls: number;
    trends: {
      opens: MetricTrend;
      searches: MetricTrend;
      result_clicks: MetricTrend;
      booking_clicks: MetricTrend;
      clinic_calls: MetricTrend;
    };
  };
};

const BOOKING_PLACEMENTS: BookingPlacementKey[] = ["header", "dock", "profile", "digital_reception", "other"];

function practitionerSlug(path: string, explicit?: string): string {
  if (explicit) return explicit;
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

function normalizeBookingPlacement(raw: string | undefined): BookingPlacementKey {
  const value = String(raw || "").toLowerCase();
  if (value === "header" || value === "mobile_header") return "header";
  if (value === "dock") return "dock";
  if (value === "profile") return "profile";
  if (value === "digital_reception") return "digital_reception";
  return "other";
}

function rate(numerator: number, denominator: number): number | null {
  if (!denominator) return null;
  return Number(((numerator / denominator) * 100).toFixed(1));
}

function topN(map: Map<string, number>, limit = 10): CountRow[] {
  return [...map.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
    .slice(0, limit);
}

function countSessions(events: MeasurementEvent[]): number {
  const ids = new Set<string>();
  for (const event of events) {
    if (event.session_id) ids.add(event.session_id);
  }
  return ids.size;
}

function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d + days, 12, 0, 0));
  return utc.toISOString().slice(0, 10);
}

function inclusiveDayCount(start: string, end: string): number {
  const a = Date.parse(`${start}T12:00:00.000Z`);
  const b = Date.parse(`${end}T12:00:00.000Z`);
  return Math.floor((b - a) / 86_400_000) + 1;
}

function eachDay(start: string, end: string): string[] {
  const days: string[] = [];
  let cursor = start;
  while (cursor <= end) {
    days.push(cursor);
    cursor = addDaysIso(cursor, 1);
  }
  return days;
}

/** Equal-length window immediately before the selected range. */
export function resolvePreviousExecutiveRange(
  range: ExecutiveRange,
  now = new Date(),
): { start: string; end: string } {
  const { start } = resolveExecutiveRange(range, now);
  const { end } = resolveExecutiveRange(range, now);
  const days = inclusiveDayCount(start, end);
  const previous_end = addDaysIso(start, -1);
  const previous_start = addDaysIso(previous_end, -(days - 1));
  return { start: previous_start, end: previous_end };
}

function filterEventsByDates(events: MeasurementEvent[], start: string, end: string): MeasurementEvent[] {
  return events.filter((event) => {
    const day = eventBrisbaneDate(event.ts);
    return day >= start && day <= end;
  });
}

function buildTrend(current: number, previous: number): MetricTrend {
  const delta = Number((current - previous).toFixed(1));
  const delta_pct =
    previous === 0 ? (current === 0 ? 0 : null) : Number((((current - previous) / previous) * 100).toFixed(1));
  const direction: TrendDirection = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  return { current, previous, delta, delta_pct, direction };
}

type WindowMetrics = {
  traffic: number;
  sessions: number;
  booking_clicks: number;
  clinic_calls: number;
  contact_rate: number | null;
  booking_intent_rate: number | null;
  call_intent_rate: number | null;
  digital_reception_opens: number;
  digital_reception_searches: number;
  digital_reception_result_clicks: number;
  digital_reception_booking_clicks: number;
  digital_reception_clinic_calls: number;
  pages: Map<string, number>;
  services: Map<string, number>;
  practitioners: Map<string, number>;
  placements: Map<BookingPlacementKey, number>;
};

function emptyMetrics(): WindowMetrics {
  return {
    traffic: 0,
    sessions: 0,
    booking_clicks: 0,
    clinic_calls: 0,
    contact_rate: null,
    booking_intent_rate: null,
    call_intent_rate: null,
    digital_reception_opens: 0,
    digital_reception_searches: 0,
    digital_reception_result_clicks: 0,
    digital_reception_booking_clicks: 0,
    digital_reception_clinic_calls: 0,
    pages: new Map(),
    services: new Map(),
    practitioners: new Map(),
    placements: new Map(BOOKING_PLACEMENTS.map((key) => [key, 0])),
  };
}

function summarizeWindow(events: MeasurementEvent[]): WindowMetrics {
  const metrics = emptyMetrics();

  for (const event of events) {
    if (event.event === "page_view") {
      metrics.traffic += 1;
      const path = event.page_path || "unknown";
      metrics.pages.set(path, (metrics.pages.get(path) || 0) + 1);

      const service = serviceSlug(path);
      if (service) metrics.services.set(service, (metrics.services.get(service) || 0) + 1);

      const practitioner = practitionerSlug(path, event.practitioner);
      if (practitioner) metrics.practitioners.set(practitioner, (metrics.practitioners.get(practitioner) || 0) + 1);
    }

    if (event.event === "book_appointment_click") {
      metrics.booking_clicks += 1;
      const placement = normalizeBookingPlacement(event.placement);
      metrics.placements.set(placement, (metrics.placements.get(placement) || 0) + 1);
      if (placement === "digital_reception") metrics.digital_reception_booking_clicks += 1;
      const practitioner = practitionerSlug(event.page_path, event.practitioner);
      if (practitioner) metrics.practitioners.set(practitioner, (metrics.practitioners.get(practitioner) || 0) + 1);
    }

    if (event.event === "call_clinic_click") {
      metrics.clinic_calls += 1;
      if (normalizeBookingPlacement(event.placement) === "digital_reception") {
        metrics.digital_reception_clinic_calls += 1;
      }
      const practitioner = practitionerSlug(event.page_path, event.practitioner);
      if (practitioner) metrics.practitioners.set(practitioner, (metrics.practitioners.get(practitioner) || 0) + 1);
    }

    if (event.event === "digital_reception_open") metrics.digital_reception_opens += 1;
    if (event.event === "digital_reception_search") metrics.digital_reception_searches += 1;
    if (event.event === "digital_reception_result_click") metrics.digital_reception_result_clicks += 1;
  }

  metrics.sessions = countSessions(events);
  const denominator = metrics.sessions || metrics.traffic;
  const contactNumerator = metrics.booking_clicks + metrics.clinic_calls;
  metrics.contact_rate = rate(contactNumerator, denominator);
  metrics.booking_intent_rate = rate(metrics.booking_clicks, denominator);
  metrics.call_intent_rate = rate(metrics.clinic_calls, denominator);
  return metrics;
}

function buildDailySeries(events: MeasurementEvent[], start: string, end: string): DailySeriesPoint[] {
  const byDay = new Map<
    string,
    { traffic: number; booking_clicks: number; call_clicks: number; sessions: Set<string> }
  >();

  for (const day of eachDay(start, end)) {
    byDay.set(day, { traffic: 0, booking_clicks: 0, call_clicks: 0, sessions: new Set() });
  }

  for (const event of events) {
    const day = eventBrisbaneDate(event.ts);
    const bucket = byDay.get(day);
    if (!bucket) continue;
    if (event.session_id) bucket.sessions.add(event.session_id);
    if (event.event === "page_view") bucket.traffic += 1;
    if (event.event === "book_appointment_click") bucket.booking_clicks += 1;
    if (event.event === "call_clinic_click") bucket.call_clicks += 1;
  }

  return [...byDay.entries()].map(([date, bucket]) => {
    const sessions = bucket.sessions.size;
    const denominator = sessions || bucket.traffic;
    const contactNumerator = bucket.booking_clicks + bucket.call_clicks;
    return {
      date,
      traffic: bucket.traffic,
      booking_clicks: bucket.booking_clicks,
      call_clicks: bucket.call_clicks,
      sessions,
      contact_rate: rate(contactNumerator, denominator),
    };
  });
}

/**
 * Practice-management Executive Dashboard dataset for an explicit Brisbane date window.
 * Used by monthly executive exports; prior window is the equal-length period immediately before.
 */
export function buildPracticeExecutiveDashboardForDates(
  raw: Array<RawMeasurementEvent | MeasurementEvent>,
  start: string,
  end: string,
  label: string,
  range: ExecutiveRange = "mtd",
): PracticeExecutiveDashboard {
  const prepared = prepareEvents(raw);
  const days = inclusiveDayCount(start, end);
  const previous_end = addDaysIso(start, -1);
  const previous_start = addDaysIso(previous_end, -(days - 1));
  const events = filterEventsByDates(prepared, start, end);
  const previousEvents = filterEventsByDates(prepared, previous_start, previous_end);

  const current = summarizeWindow(events);
  const prior = summarizeWindow(previousEvents);
  return assembleExecutiveDashboard({
    range,
    range_label: label,
    start,
    end,
    previous_start,
    previous_end,
    current,
    prior,
    events,
  });
}

/**
 * Practice-management Executive Dashboard dataset.
 * Traffic = page views; Sessions = distinct session_id; rates use sessions as denominator.
 */
export function buildPracticeExecutiveDashboard(
  raw: Array<RawMeasurementEvent | MeasurementEvent>,
  range: ExecutiveRange = "last_7",
  now = new Date(),
): PracticeExecutiveDashboard {
  const prepared = prepareEvents(raw);
  const { start, end, label } = resolveExecutiveRange(range, now);
  const previous = resolvePreviousExecutiveRange(range, now);
  const events = filterEventsByRange(prepared, range, now);
  const previousEvents = filterEventsByDates(prepared, previous.start, previous.end);

  const current = summarizeWindow(events);
  const prior = summarizeWindow(previousEvents);
  return assembleExecutiveDashboard({
    range,
    range_label: label,
    start,
    end,
    previous_start: previous.start,
    previous_end: previous.end,
    current,
    prior,
    events,
  });
}

function assembleExecutiveDashboard({
  range,
  range_label,
  start,
  end,
  previous_start,
  previous_end,
  current,
  prior,
  events,
}: {
  range: ExecutiveRange;
  range_label: string;
  start: string;
  end: string;
  previous_start: string;
  previous_end: string;
  current: ReturnType<typeof summarizeWindow>;
  prior: ReturnType<typeof summarizeWindow>;
  events: MeasurementEvent[];
}): PracticeExecutiveDashboard {

  const trafficTrend = buildTrend(current.traffic, prior.traffic);
  const sessionsTrend = buildTrend(current.sessions, prior.sessions);
  const bookingTrend = buildTrend(current.booking_clicks, prior.booking_clicks);
  const callsTrend = buildTrend(current.clinic_calls, prior.clinic_calls);
  const contactActionsTrend = buildTrend(
    current.booking_clicks + current.clinic_calls,
    prior.booking_clicks + prior.clinic_calls,
  );
  const contactTrend = buildTrend(current.contact_rate ?? 0, prior.contact_rate ?? 0);
  const bookingRateTrend = buildTrend(current.booking_intent_rate ?? 0, prior.booking_intent_rate ?? 0);
  const callRateTrend = buildTrend(current.call_intent_rate ?? 0, prior.call_intent_rate ?? 0);

  const denominator = current.sessions || current.traffic;
  const contactNumerator = current.booking_clicks + current.clinic_calls;

  const booking_placement_mix = BOOKING_PLACEMENTS.map((placement) => {
    const count = current.placements.get(placement) || 0;
    return {
      placement,
      count,
      share: current.booking_clicks ? Number(((count / current.booking_clicks) * 100).toFixed(1)) : 0,
    };
  });

  return {
    dashboard: "executive_practice",
    range,
    range_label,
    start,
    end,
    previous_start,
    previous_end,
    generated_at: new Date().toISOString(),
    privacy: DEBUG_RETENTION_POLICY,
    kpis: {
      traffic: current.traffic,
      sessions: current.sessions,
      booking_clicks: current.booking_clicks,
      clinic_calls: current.clinic_calls,
    },
    trends: {
      traffic: trafficTrend,
      sessions: sessionsTrend,
      booking_clicks: bookingTrend,
      clinic_calls: callsTrend,
      contact_actions: contactActionsTrend,
      contact_rate: contactTrend,
    },
    rates: [
      {
        key: "contact_rate",
        label: "Contact Rate",
        value: current.contact_rate,
        numerator: contactNumerator,
        denominator,
        definition: "(Booking clicks + Clinic calls) ÷ Sessions",
        trend: contactTrend,
      },
      {
        key: "booking_intent_rate",
        label: "Booking Intent Rate",
        value: current.booking_intent_rate,
        numerator: current.booking_clicks,
        denominator,
        definition: "Booking clicks ÷ Sessions",
        trend: bookingRateTrend,
      },
      {
        key: "call_intent_rate",
        label: "Call Intent Rate",
        value: current.call_intent_rate,
        numerator: current.clinic_calls,
        denominator,
        definition: "Clinic calls ÷ Sessions",
        trend: callRateTrend,
      },
    ],
    series: buildDailySeries(events, start, end),
    top_pages: topN(current.pages, 10),
    top_services: topN(current.services, 10),
    top_practitioners: topN(current.practitioners, 10),
    booking_placement_mix,
    digital_reception: {
      opens: current.digital_reception_opens,
      searches: current.digital_reception_searches,
      result_clicks: current.digital_reception_result_clicks,
      booking_clicks: current.digital_reception_booking_clicks,
      clinic_calls: current.digital_reception_clinic_calls,
      trends: {
        opens: buildTrend(current.digital_reception_opens, prior.digital_reception_opens),
        searches: buildTrend(current.digital_reception_searches, prior.digital_reception_searches),
        result_clicks: buildTrend(current.digital_reception_result_clicks, prior.digital_reception_result_clicks),
        booking_clicks: buildTrend(
          current.digital_reception_booking_clicks,
          prior.digital_reception_booking_clicks,
        ),
        clinic_calls: buildTrend(current.digital_reception_clinic_calls, prior.digital_reception_clinic_calls),
      },
    },
  };
}

export function executiveRangeOptions() {
  return EXECUTIVE_RANGES.map((value) => ({ value, label: EXECUTIVE_RANGE_LABEL[value] }));
}
