import { prepareEvents } from "@/measurement/aggregate";
import { DEBUG_RETENTION_POLICY } from "@/measurement/datasets";
import {
  EXECUTIVE_RANGE_LABEL,
  filterEventsByRange,
  resolveExecutiveRange,
  type ExecutiveRange,
} from "@/measurement/ranges";
import type { CountRow, MeasurementEvent, RawMeasurementEvent } from "@/measurement/types";

export const DR_WATCHLIST_INTENTS = ["new_patient", "hotdoc_message", "vaccination"] as const;
export type DrWatchlistIntent = (typeof DR_WATCHLIST_INTENTS)[number];

export type FunnelStepKey = "open" | "search" | "result_click" | "booking" | "call";

export type DigitalReceptionFunnelStep = {
  key: FunnelStepKey;
  label: string;
  count: number;
  /** Conversion from previous step; null for the first step. */
  conversion_from_previous: number | null;
  /** Share of opens that reached this step. */
  share_of_opens: number | null;
};

/** Search-quality band for resolution performance. */
export type ResolutionBand = "green" | "amber" | "red" | "unknown";

export type IntentPerformanceRow = {
  intent_bucket: string;
  searches: number;
  resolved: number;
  zero_results: number;
  result_clicks: number;
  resolution_rate: number | null;
  zero_result_rate: number | null;
  resolution_band: ResolutionBand;
  flagged: boolean;
};

export type WatchlistRow = {
  intent_bucket: DrWatchlistIntent;
  label: string;
  searches: number;
  resolved: number;
  zero_results: number;
  result_clicks: number;
  resolution_rate: number | null;
  zero_result_rate: number | null;
  resolution_band: ResolutionBand;
};

export type PracticeDigitalReceptionDashboard = {
  dashboard: "digital_reception_practice";
  range: ExecutiveRange;
  range_label: string;
  start: string;
  end: string;
  generated_at: string;
  privacy: typeof DEBUG_RETENTION_POLICY;
  kpis: {
    open_rate: number | null;
    opens: number;
    sessions: number;
    searches: number;
    resolution_rate: number | null;
    resolution_band: ResolutionBand;
    zero_result_rate: number | null;
    resolved_searches: number;
    zero_result_searches: number;
  };
  funnel: DigitalReceptionFunnelStep[];
  top_intent_buckets: IntentPerformanceRow[];
  top_search_destinations: CountRow[];
  watchlist: WatchlistRow[];
  flagged_intents: IntentPerformanceRow[];
};

const WATCHLIST_LABEL: Record<DrWatchlistIntent, string> = {
  new_patient: "New patient",
  hotdoc_message: "HotDoc message",
  vaccination: "Vaccine",
};

const FUNNEL_LABEL: Record<FunnelStepKey, string> = {
  open: "Open",
  search: "Search",
  result_click: "Result click",
  booking: "Booking",
  call: "Call",
};

function rate(numerator: number, denominator: number): number | null {
  if (!denominator) return null;
  return Number(((numerator / denominator) * 100).toFixed(1));
}

/** Green >= 70%, amber 50-69%, red < 50%. */
export function resolutionBand(value: number | null): ResolutionBand {
  if (value === null) return "unknown";
  if (value >= 70) return "green";
  if (value >= 50) return "amber";
  return "red";
}

function isResolvedSearch(event: MeasurementEvent): boolean {
  if (event.event !== "digital_reception_search") return false;
  const type = String(event.result_type || "");
  if (type === "no_result" || type === "unavailable") return false;
  if (typeof event.result_count === "number" && event.result_count <= 0 && type !== "emergency") return false;
  return type === "direct_page" || type === "care_journey" || type === "emergency" || (event.result_count ?? 0) > 0;
}

function isZeroResultSearch(event: MeasurementEvent): boolean {
  return event.event === "digital_reception_search" && String(event.result_type || "") === "no_result";
}

function countSessions(events: MeasurementEvent[]): number {
  const ids = new Set<string>();
  for (const event of events) {
    if (event.session_id) ids.add(event.session_id);
  }
  return ids.size;
}

function destinationKey(event: MeasurementEvent): string {
  const step = String(event.step || "unknown");
  if (step === "book") return "booking";
  if (step === "call") return "call";
  if (step === "article") return "advice article";
  if (step === "service") return "service page";
  if (step === "practitioner") return "practitioner profile";
  if (step === "shortcut") return "task shortcut";
  if (step === "more") return "show more";
  return step;
}

/**
 * Practice Digital Reception dashboard.
 * Search dimensions only: intent_bucket, result_type, result_count — never raw queries.
 */
export function buildPracticeDigitalReceptionDashboard(
  raw: Array<RawMeasurementEvent | MeasurementEvent>,
  range: ExecutiveRange = "last_7",
  now = new Date(),
): PracticeDigitalReceptionDashboard {
  const prepared = prepareEvents(raw);
  const events = filterEventsByRange(prepared, range, now);
  const { start, end, label } = resolveExecutiveRange(range, now);

  const sessions = countSessions(events);
  let opens = 0;
  let searches = 0;
  let resolved_searches = 0;
  let zero_result_searches = 0;
  let result_clicks = 0;
  let booking = 0;
  let call = 0;

  const intentMap = new Map<
    string,
    { searches: number; resolved: number; zero_results: number; result_clicks: number }
  >();
  const destinations = new Map<string, number>();

  const bumpIntent = (bucket: string) => {
    const key = bucket || "unmatched";
    const row = intentMap.get(key) || { searches: 0, resolved: 0, zero_results: 0, result_clicks: 0 };
    intentMap.set(key, row);
    return row;
  };

  for (const event of events) {
    if (event.event === "digital_reception_open") {
      opens += 1;
      continue;
    }

    if (event.event === "digital_reception_search") {
      searches += 1;
      const row = bumpIntent(String(event.intent_bucket || "unmatched"));
      row.searches += 1;
      if (isZeroResultSearch(event)) {
        zero_result_searches += 1;
        row.zero_results += 1;
      } else if (isResolvedSearch(event)) {
        resolved_searches += 1;
        row.resolved += 1;
      }
      continue;
    }

    if (event.event === "digital_reception_result_click") {
      result_clicks += 1;
      const row = bumpIntent(String(event.intent_bucket || "unmatched"));
      row.result_clicks += 1;
      const dest = destinationKey(event);
      destinations.set(dest, (destinations.get(dest) || 0) + 1);
      const step = String(event.step || "");
      if (step === "book") booking += 1;
      if (step === "call") call += 1;
      continue;
    }

    // Count DR-attributed conversion clicks that were recorded as site-wide events.
    if (event.event === "book_appointment_click" && event.placement === "digital_reception") {
      booking += 1;
      destinations.set("booking", (destinations.get("booking") || 0) + 1);
    }
    if (event.event === "call_clinic_click" && event.placement === "digital_reception") {
      call += 1;
      destinations.set("call", (destinations.get("call") || 0) + 1);
    }
  }

  const funnelCounts: Record<FunnelStepKey, number> = {
    open: opens,
    search: searches,
    result_click: result_clicks,
    booking,
    call,
  };
  const funnelOrder: FunnelStepKey[] = ["open", "search", "result_click", "booking", "call"];
  const funnel: DigitalReceptionFunnelStep[] = funnelOrder.map((key, index) => {
    const count = funnelCounts[key];
    const previous = index === 0 ? null : funnelCounts[funnelOrder[index - 1]];
    return {
      key,
      label: FUNNEL_LABEL[key],
      count,
      conversion_from_previous: previous === null ? null : rate(count, previous),
      share_of_opens: rate(count, opens),
    };
  });

  const intentRows: IntentPerformanceRow[] = [...intentMap.entries()]
    .map(([intent_bucket, stats]) => {
      const resolution_rate = rate(stats.resolved, stats.searches);
      const zero_result_rate = rate(stats.zero_results, stats.searches);
      return {
        intent_bucket,
        searches: stats.searches,
        resolved: stats.resolved,
        zero_results: stats.zero_results,
        result_clicks: stats.result_clicks,
        resolution_rate,
        zero_result_rate,
        resolution_band: resolutionBand(resolution_rate),
        flagged: false,
      };
    })
    .sort((a, b) => b.searches - a.searches || a.intent_bucket.localeCompare(b.intent_bucket));

  // Flag: high search volume with weak resolution (bottleneck / failure signal).
  const searchable = intentRows.filter((row) => row.searches >= 3);
  const volumeFloor = searchable.length
    ? Math.max(3, searchable[Math.min(2, searchable.length - 1)]?.searches ?? 3)
    : 3;
  for (const row of intentRows) {
    const lowResolution = row.resolution_rate !== null && row.resolution_rate < 50;
    const highVolume = row.searches >= volumeFloor;
    row.flagged = highVolume && lowResolution;
  }

  const watchlist: WatchlistRow[] = DR_WATCHLIST_INTENTS.map((intent_bucket) => {
    const match = intentRows.find((row) => row.intent_bucket === intent_bucket);
    const resolution_rate = match?.resolution_rate ?? null;
    return {
      intent_bucket,
      label: WATCHLIST_LABEL[intent_bucket],
      searches: match?.searches ?? 0,
      resolved: match?.resolved ?? 0,
      zero_results: match?.zero_results ?? 0,
      result_clicks: match?.result_clicks ?? 0,
      resolution_rate,
      zero_result_rate: match?.zero_result_rate ?? null,
      resolution_band: resolutionBand(resolution_rate),
    };
  });

  const resolution_rate = rate(resolved_searches, searches);

  return {
    dashboard: "digital_reception_practice",
    range,
    range_label: label,
    start,
    end,
    generated_at: new Date().toISOString(),
    privacy: DEBUG_RETENTION_POLICY,
    kpis: {
      open_rate: rate(opens, sessions || opens),
      opens,
      sessions,
      searches,
      resolution_rate,
      resolution_band: resolutionBand(resolution_rate),
      zero_result_rate: rate(zero_result_searches, searches),
      resolved_searches,
      zero_result_searches,
    },
    funnel,
    top_intent_buckets: intentRows.slice(0, 10),
    top_search_destinations: [...destinations.entries()]
      .map(([key, count]) => ({ key, count }))
      .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key))
      .slice(0, 10),
    watchlist,
    flagged_intents: intentRows.filter((row) => row.flagged),
  };
}

export function digitalReceptionRangeOptions() {
  return (["last_7", "last_30", "mtd"] as ExecutiveRange[]).map((value) => ({
    value,
    label: EXECUTIVE_RANGE_LABEL[value],
  }));
}
