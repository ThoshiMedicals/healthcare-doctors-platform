import { emptyPeriodBucket, periodKeyFor } from "@/measurement/periods";
import { isCoreEvent, sanitizeMeasurementEvents } from "@/measurement/sanitize";
import type {
  CountRow,
  MeasurementEvent,
  PeriodBucket,
  PeriodGrain,
  RawMeasurementEvent,
  SearchAggregateRow,
} from "@/measurement/types";

function bump(map: Map<string, number>, key: string, by = 1) {
  map.set(key, (map.get(key) || 0) + by);
}

function toSortedCounts(map: Map<string, number>): CountRow[] {
  return [...map.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

export function prepareEvents(raw: Array<RawMeasurementEvent | MeasurementEvent>): MeasurementEvent[] {
  return sanitizeMeasurementEvents(raw as RawMeasurementEvent[]).filter((event) => isCoreEvent(String(event.event)));
}

/** Count of page_view events. */
export function aggregatePageViews(events: MeasurementEvent[]): number {
  return events.filter((e) => e.event === "page_view").length;
}

/** Count of book_appointment_click events. */
export function aggregateBookingClicks(events: MeasurementEvent[]): number {
  return events.filter((e) => e.event === "book_appointment_click").length;
}

/** Count of call_clinic_click events. */
export function aggregateCallClicks(events: MeasurementEvent[]): number {
  return events.filter((e) => e.event === "call_clinic_click").length;
}

/** Count of digital_reception_open events. */
export function aggregateDigitalReceptionOpens(events: MeasurementEvent[]): number {
  return events.filter((e) => e.event === "digital_reception_open").length;
}

/** Count of digital_reception_search events. */
export function aggregateDigitalReceptionSearches(events: MeasurementEvent[]): number {
  return events.filter((e) => e.event === "digital_reception_search").length;
}

/** Count of digital_reception_result_click events. */
export function aggregateDigitalReceptionResultClicks(events: MeasurementEvent[]): number {
  return events.filter((e) => e.event === "digital_reception_result_click").length;
}

/** Count of task_shortcut_click events. */
export function aggregateTaskShortcuts(events: MeasurementEvent[]): number {
  return events.filter((e) => e.event === "task_shortcut_click").length;
}

/**
 * Search aggregates for dashboards.
 * Exposes only intent_bucket, result_type, and result_count summaries — never raw queries.
 */
export function aggregateSearchIntents(events: MeasurementEvent[]): SearchAggregateRow[] {
  type Acc = { searches: number; resultCountSum: number; resultCountN: number };
  const map = new Map<string, Acc>();

  for (const event of events) {
    if (event.event !== "digital_reception_search") continue;
    const intent = String(event.intent_bucket || "unmatched");
    const resultType = String(event.result_type || "unavailable");
    const key = `${intent}\u0000${resultType}`;
    const row = map.get(key) || { searches: 0, resultCountSum: 0, resultCountN: 0 };
    row.searches += 1;
    if (typeof event.result_count === "number") {
      row.resultCountSum += event.result_count;
      row.resultCountN += 1;
    }
    map.set(key, row);
  }

  return [...map.entries()]
    .map(([key, acc]) => {
      const [intent_bucket, result_type] = key.split("\u0000");
      return {
        intent_bucket,
        result_type,
        searches: acc.searches,
        avg_result_count: acc.resultCountN ? Number((acc.resultCountSum / acc.resultCountN).toFixed(2)) : null,
      };
    })
    .sort((a, b) => b.searches - a.searches || a.intent_bucket.localeCompare(b.intent_bucket));
}

export function aggregateByPageGroup(events: MeasurementEvent[], eventName = "page_view"): CountRow[] {
  const map = new Map<string, number>();
  for (const event of events) {
    if (event.event !== eventName) continue;
    bump(map, String(event.page_group || "other"));
  }
  return toSortedCounts(map);
}

export function aggregateByPath(events: MeasurementEvent[], eventName = "page_view"): CountRow[] {
  const map = new Map<string, number>();
  for (const event of events) {
    if (event.event !== eventName) continue;
    bump(map, String(event.page_path || "unknown"));
  }
  return toSortedCounts(map);
}

export function aggregateTaskShortcutBreakdown(events: MeasurementEvent[]): CountRow[] {
  const map = new Map<string, number>();
  for (const event of events) {
    if (event.event !== "task_shortcut_click") continue;
    bump(map, String(event.task || "unknown"));
  }
  return toSortedCounts(map);
}

export function aggregateResultClickSteps(events: MeasurementEvent[]): CountRow[] {
  const map = new Map<string, number>();
  for (const event of events) {
    if (event.event !== "digital_reception_result_click") continue;
    bump(map, String(event.step || "unknown"));
  }
  return toSortedCounts(map);
}

export function aggregateBookingDestinations(events: MeasurementEvent[]): CountRow[] {
  const map = new Map<string, number>();
  for (const event of events) {
    if (event.event !== "book_appointment_click") continue;
    bump(map, String(event.destination || "unknown"));
  }
  return toSortedCounts(map);
}

/**
 * Roll core conversion metrics into daily, weekly, or monthly period buckets (Brisbane calendar).
 */
export function aggregateByPeriod(events: MeasurementEvent[], grain: PeriodGrain): PeriodBucket[] {
  const map = new Map<string, PeriodBucket>();

  for (const event of events) {
    const period = periodKeyFor(event.ts, grain);
    const bucket = map.get(period) || emptyPeriodBucket(period, grain);
    switch (event.event) {
      case "page_view":
        bucket.page_views += 1;
        break;
      case "book_appointment_click":
        bucket.booking_clicks += 1;
        break;
      case "call_clinic_click":
        bucket.call_clicks += 1;
        break;
      case "digital_reception_open":
        bucket.digital_reception_opens += 1;
        break;
      case "digital_reception_search":
        bucket.digital_reception_searches += 1;
        break;
      case "digital_reception_result_click":
        bucket.digital_reception_result_clicks += 1;
        break;
      case "task_shortcut_click":
        bucket.task_shortcuts += 1;
        break;
      default:
        break;
    }
    map.set(period, bucket);
  }

  return [...map.values()].sort((a, b) => a.period.localeCompare(b.period));
}

export function coreMetricTotals(events: MeasurementEvent[]) {
  return {
    page_views: aggregatePageViews(events),
    booking_clicks: aggregateBookingClicks(events),
    call_clicks: aggregateCallClicks(events),
    digital_reception_opens: aggregateDigitalReceptionOpens(events),
    digital_reception_searches: aggregateDigitalReceptionSearches(events),
    digital_reception_result_clicks: aggregateDigitalReceptionResultClicks(events),
    task_shortcuts: aggregateTaskShortcuts(events),
  };
}
