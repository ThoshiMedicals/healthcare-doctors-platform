import { prepareEvents } from "@/measurement/aggregate";
import { DEBUG_RETENTION_POLICY } from "@/measurement/datasets";
import {
  EXECUTIVE_RANGE_LABEL,
  filterEventsByRange,
  resolveExecutiveRange,
  type ExecutiveRange,
} from "@/measurement/ranges";
import type { MeasurementEvent, RawMeasurementEvent } from "@/measurement/types";

export type ConversionFunnelStepKey = "visitor" | "search" | "service" | "practitioner" | "booking";

export type ConversionFunnelStep = {
  key: ConversionFunnelStepKey;
  label: string;
  sessions: number;
  conversion_from_previous: number | null;
  /** Percentage of previous-step sessions that did not advance. */
  drop_from_previous: number | null;
  share_of_visitors: number | null;
  /** True when this step is the largest relative drop in the funnel. */
  bottleneck: boolean;
};

export type ConverterRow = {
  key: string;
  label: string;
  sessions: number;
  bookings: number;
  conversion_rate: number | null;
};

export type ExitPageRow = {
  path: string;
  label: string;
  exits: number;
  share: number;
};

export type AbandonmentJourneyRow = {
  journey: string;
  last_stage: ConversionFunnelStepKey;
  sessions: number;
  share_of_abandoners: number;
};

export type OpportunityRow = {
  key: string;
  label: string;
  category: "weak_booking_path" | "weak_service_journey" | "weak_practitioner_journey";
  sessions: number;
  bookings: number;
  conversion_rate: number | null;
  reason: string;
};

export type PracticeConversionIntelligenceReport = {
  dashboard: "conversion_intelligence";
  range: ExecutiveRange;
  range_label: string;
  start: string;
  end: string;
  generated_at: string;
  privacy: typeof DEBUG_RETENTION_POLICY;
  funnel: ConversionFunnelStep[];
  highest_converting_practitioners: ConverterRow[];
  highest_converting_services: ConverterRow[];
  highest_converting_entry_pages: ConverterRow[];
  lowest_converting_practitioners: ConverterRow[];
  lowest_converting_services: ConverterRow[];
  lowest_converting_entry_pages: ConverterRow[];
  highest_exit_pages: ExitPageRow[];
  highest_abandonment_journeys: AbandonmentJourneyRow[];
  opportunities: {
    weak_booking_paths: OpportunityRow[];
    weak_service_journeys: OpportunityRow[];
    weak_practitioner_journeys: OpportunityRow[];
  };
};

const FUNNEL_LABEL: Record<ConversionFunnelStepKey, string> = {
  visitor: "Visitor",
  search: "Search",
  service: "Service",
  practitioner: "Practitioner",
  booking: "Booking",
};

const STAGE_ORDER: ConversionFunnelStepKey[] = ["visitor", "search", "service", "practitioner", "booking"];

function rate(numerator: number, denominator: number): number | null {
  if (!denominator) return null;
  return Number(((numerator / denominator) * 100).toFixed(1));
}

function serviceSlug(path: string): string {
  const normalized = String(path || "").replace(/^\/+/, "");
  if (!normalized.startsWith("services/") || normalized === "services.html") return "";
  return normalized.replace(/^services\//, "").replace(/\.html$/, "");
}

function practitionerSlug(path: string, explicit?: string): string {
  if (explicit) return explicit.replace(/^doctors\//, "").replace(/\.html$/, "");
  const normalized = String(path || "").replace(/^\/+/, "");
  if (!normalized.startsWith("doctors/")) return "";
  return normalized.replace(/^doctors\//, "").replace(/\.html$/, "");
}

function formatLabel(key: string): string {
  return key
    .replace(/^doctors\//, "")
    .replace(/^services\//, "")
    .replace(/^knowledge\/articles\//, "")
    .replace(/\.html$/, "")
    .replace(/^dr-/, "Dr ")
    .replace(/^mr-/, "Mr ")
    .replaceAll("-", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function sortByTs(a: MeasurementEvent, b: MeasurementEvent): number {
  return String(a.ts).localeCompare(String(b.ts));
}

type SessionTrace = {
  session_id: string;
  page_views: MeasurementEvent[];
  searched: boolean;
  services: Set<string>;
  practitioners: Set<string>;
  booked: boolean;
  entry_path: string;
  exit_path: string;
};

function buildSessionTraces(events: MeasurementEvent[]): SessionTrace[] {
  const bySession = new Map<string, MeasurementEvent[]>();
  for (const event of events) {
    if (!event.session_id) continue;
    const list = bySession.get(event.session_id) || [];
    list.push(event);
    bySession.set(event.session_id, list);
  }

  const traces: SessionTrace[] = [];
  for (const [session_id, raw] of bySession) {
    const ordered = [...raw].sort(sortByTs);
    const page_views = ordered.filter((event) => event.event === "page_view");
    if (page_views.length === 0 && !ordered.some((e) => e.event.startsWith("digital_reception") || e.event === "book_appointment_click")) {
      continue;
    }

    const services = new Set<string>();
    const practitioners = new Set<string>();
    let searched = false;
    let booked = false;

    for (const event of ordered) {
      if (event.event === "digital_reception_search" || event.event === "digital_reception_open") {
        searched = true;
      }
      if (event.event === "digital_reception_result_click" && event.step === "service") {
        const slug = serviceSlug(event.page_path);
        if (slug) services.add(slug);
      }
      if (event.event === "digital_reception_result_click" && event.step === "practitioner") {
        const slug = practitionerSlug(event.page_path, event.practitioner);
        if (slug) practitioners.add(slug);
      }
      if (event.event === "page_view") {
        const service = serviceSlug(event.page_path);
        if (service) services.add(service);
        const practitioner = practitionerSlug(event.page_path, event.practitioner);
        if (practitioner) practitioners.add(practitioner);
      }
      if (event.event === "book_appointment_click") {
        booked = true;
        const practitioner = practitionerSlug(event.page_path, event.practitioner);
        if (practitioner) practitioners.add(practitioner);
        const service = serviceSlug(event.page_path);
        if (service) services.add(service);
      }
    }

    const entry_path = page_views[0]?.page_path || ordered[0]?.page_path || "unknown";
    const exit_path = page_views.at(-1)?.page_path || ordered.at(-1)?.page_path || "unknown";

    traces.push({
      session_id,
      page_views,
      searched,
      services,
      practitioners,
      booked,
      entry_path,
      exit_path,
    });
  }

  return traces;
}

function furthestStage(trace: SessionTrace): ConversionFunnelStepKey {
  if (trace.booked) return "booking";
  if (trace.practitioners.size > 0) return "practitioner";
  if (trace.services.size > 0) return "service";
  if (trace.searched) return "search";
  return "visitor";
}

function journeyKey(stage: ConversionFunnelStepKey): string {
  const index = STAGE_ORDER.indexOf(stage);
  return STAGE_ORDER.slice(0, index + 1)
    .map((key) => FUNNEL_LABEL[key])
    .join(" → ");
}

function buildConverterMap(
  traces: SessionTrace[],
  pickKeys: (trace: SessionTrace) => Iterable<string>,
): Map<string, { sessions: number; bookings: number }> {
  const map = new Map<string, { sessions: number; bookings: number }>();
  for (const trace of traces) {
    for (const key of pickKeys(trace)) {
      const row = map.get(key) || { sessions: 0, bookings: 0 };
      row.sessions += 1;
      if (trace.booked) row.bookings += 1;
      map.set(key, row);
    }
  }
  return map;
}

function toConverterRows(
  map: Map<string, { sessions: number; bookings: number }>,
  minSessions: number,
  limit: number,
  order: "best" | "worst" = "best",
): ConverterRow[] {
  return [...map.entries()]
    .filter(([, row]) => row.sessions >= minSessions)
    .map(([key, row]) => ({
      key,
      label: formatLabel(key),
      sessions: row.sessions,
      bookings: row.bookings,
      conversion_rate: rate(row.bookings, row.sessions),
    }))
    .sort((a, b) => {
      if (order === "worst") {
        return (
          (a.conversion_rate ?? 0) - (b.conversion_rate ?? 0) ||
          b.sessions - a.sessions ||
          a.label.localeCompare(b.label)
        );
      }
      return (
        (b.conversion_rate ?? -1) - (a.conversion_rate ?? -1) ||
        b.bookings - a.bookings ||
        b.sessions - a.sessions ||
        a.label.localeCompare(b.label)
      );
    })
    .slice(0, limit);
}

function toWeakOpportunities(
  map: Map<string, { sessions: number; bookings: number }>,
  category: OpportunityRow["category"],
  reason: string,
  minSessions: number,
  maxRate: number,
  limit: number,
): OpportunityRow[] {
  return [...map.entries()]
    .map(([key, row]) => ({
      key,
      label: formatLabel(key),
      category,
      sessions: row.sessions,
      bookings: row.bookings,
      conversion_rate: rate(row.bookings, row.sessions),
      reason,
    }))
    .filter(
      (row) =>
        row.sessions >= minSessions &&
        (row.conversion_rate === null || row.conversion_rate <= maxRate),
    )
    .sort(
      (a, b) =>
        b.sessions - a.sessions ||
        (a.conversion_rate ?? 0) - (b.conversion_rate ?? 0) ||
        a.label.localeCompare(b.label),
    )
    .slice(0, limit);
}

/**
 * Conversion intelligence: Visitor → Search → Service → Practitioner → Booking.
 * Identifies converters, exits, abandonment, and weak journey opportunities.
 */
export function buildPracticeConversionIntelligenceReport(
  raw: Array<RawMeasurementEvent | MeasurementEvent>,
  range: ExecutiveRange = "last_7",
  now = new Date(),
): PracticeConversionIntelligenceReport {
  const prepared = prepareEvents(raw);
  const events = filterEventsByRange(prepared, range, now);
  const { start, end, label } = resolveExecutiveRange(range, now);
  const traces = buildSessionTraces(events);

  const visitors = traces.length;
  const searched = traces.filter((t) => t.searched).length;
  const service = traces.filter((t) => t.services.size > 0).length;
  const practitioner = traces.filter((t) => t.practitioners.size > 0).length;
  const booking = traces.filter((t) => t.booked).length;

  const stageCounts: Record<ConversionFunnelStepKey, number> = {
    visitor: visitors,
    search: searched,
    service,
    practitioner,
    booking,
  };

  const funnelDraft = STAGE_ORDER.map((key, index) => {
    const previous = index === 0 ? null : STAGE_ORDER[index - 1];
    const conversion_from_previous = previous ? rate(stageCounts[key], stageCounts[previous]) : null;
    const drop_from_previous =
      conversion_from_previous === null ? null : Number((100 - conversion_from_previous).toFixed(1));
    return {
      key,
      label: FUNNEL_LABEL[key],
      sessions: stageCounts[key],
      conversion_from_previous,
      drop_from_previous,
      share_of_visitors: rate(stageCounts[key], visitors),
      bottleneck: false,
    };
  });
  const maxDrop = Math.max(...funnelDraft.map((step) => step.drop_from_previous ?? -1), -1);
  const funnel: ConversionFunnelStep[] = funnelDraft.map((step) => ({
    ...step,
    bottleneck: step.drop_from_previous !== null && step.drop_from_previous === maxDrop && maxDrop > 0,
  }));

  const practitionerMap = buildConverterMap(traces, (t) => t.practitioners);
  const serviceMap = buildConverterMap(traces, (t) => t.services);
  const entryMap = buildConverterMap(traces, (t) => [t.entry_path]);

  const abandoners = traces.filter((t) => !t.booked);
  const exitCounts = new Map<string, number>();
  for (const trace of abandoners) {
    exitCounts.set(trace.exit_path, (exitCounts.get(trace.exit_path) || 0) + 1);
  }
  const exitTotal = abandoners.length || 1;
  const highest_exit_pages: ExitPageRow[] = [...exitCounts.entries()]
    .map(([path, exits]) => ({
      path,
      label: formatLabel(path),
      exits,
      share: Number(((exits / exitTotal) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.exits - a.exits || a.label.localeCompare(b.label))
    .slice(0, 10);

  const abandonmentCounts = new Map<ConversionFunnelStepKey, number>();
  for (const trace of abandoners) {
    const stage = furthestStage(trace);
    abandonmentCounts.set(stage, (abandonmentCounts.get(stage) || 0) + 1);
  }
  const abandonTotal = abandoners.length || 1;
  const highest_abandonment_journeys: AbandonmentJourneyRow[] = STAGE_ORDER.filter((key) => key !== "booking")
    .map((last_stage) => ({
      journey: journeyKey(last_stage),
      last_stage,
      sessions: abandonmentCounts.get(last_stage) || 0,
      share_of_abandoners: Number((((abandonmentCounts.get(last_stage) || 0) / abandonTotal) * 100).toFixed(1)),
    }))
    .filter((row) => row.sessions > 0)
    .sort((a, b) => b.sessions - a.sessions || a.journey.localeCompare(b.journey));

  return {
    dashboard: "conversion_intelligence",
    range,
    range_label: label,
    start,
    end,
    generated_at: new Date().toISOString(),
    privacy: DEBUG_RETENTION_POLICY,
    funnel,
    highest_converting_practitioners: toConverterRows(practitionerMap, 2, 10, "best"),
    highest_converting_services: toConverterRows(serviceMap, 2, 10, "best"),
    highest_converting_entry_pages: toConverterRows(entryMap, 2, 10, "best"),
    lowest_converting_practitioners: toConverterRows(practitionerMap, 2, 10, "worst"),
    lowest_converting_services: toConverterRows(serviceMap, 2, 10, "worst"),
    lowest_converting_entry_pages: toConverterRows(entryMap, 2, 10, "worst"),
    highest_exit_pages,
    highest_abandonment_journeys,
    opportunities: {
      weak_booking_paths: toWeakOpportunities(
        entryMap,
        "weak_booking_path",
        "High-traffic entry page with low booking conversion",
        3,
        25,
        8,
      ),
      weak_service_journeys: toWeakOpportunities(
        serviceMap,
        "weak_service_journey",
        "Service sessions rarely reach booking",
        3,
        25,
        8,
      ),
      weak_practitioner_journeys: toWeakOpportunities(
        practitionerMap,
        "weak_practitioner_journey",
        "Practitioner sessions rarely reach booking",
        3,
        25,
        8,
      ),
    },
  };
}

export function conversionIntelligenceRangeOptions() {
  return (["last_7", "last_30", "mtd"] as ExecutiveRange[]).map((value) => ({
    value,
    label: EXECUTIVE_RANGE_LABEL[value],
  }));
}
