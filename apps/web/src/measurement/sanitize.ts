import type { MeasurementEvent, RawMeasurementEvent } from "@/measurement/types";
import { CORE_EVENTS } from "@/measurement/types";

const QUERY_KEYS = new Set(["query", "raw_query", "search_query", "q", "searchText", "search_text"]);

/**
 * Strip raw query fields before any dashboard aggregation.
 * Collection (measurement.js) already omits them on outbound payloads; this is defence in depth.
 */
export function sanitizeMeasurementEvent(raw: RawMeasurementEvent | null | undefined): MeasurementEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const eventName = String(raw.event || "").trim();
  if (!eventName) return null;

  const cleaned: MeasurementEvent = {
    event: eventName,
    measurement_version: String(raw.measurement_version || "2G"),
    ts: String(raw.ts || new Date(0).toISOString()),
    page_path: String(raw.page_path || ""),
    page_group: String(raw.page_group || "other"),
  };

  if (raw.session_id) cleaned.session_id = String(raw.session_id);
  if (raw.placement) cleaned.placement = String(raw.placement);
  if (raw.destination) cleaned.destination = String(raw.destination);
  if (raw.practitioner) cleaned.practitioner = String(raw.practitioner);
  if (raw.task) cleaned.task = String(raw.task);
  if (raw.surface) cleaned.surface = String(raw.surface);
  if (raw.intent_bucket) cleaned.intent_bucket = String(raw.intent_bucket);
  if (raw.result_type) cleaned.result_type = String(raw.result_type);
  if (typeof raw.result_count === "number") cleaned.result_count = raw.result_count;
  else if (raw.result_count === null) cleaned.result_count = null;
  if (raw.step) cleaned.step = String(raw.step);

  return cleaned;
}

export function sanitizeMeasurementEvents(raw: Array<RawMeasurementEvent | null | undefined>): MeasurementEvent[] {
  const out: MeasurementEvent[] = [];
  for (const row of raw) {
    const cleaned = sanitizeMeasurementEvent(row);
    if (cleaned) out.push(cleaned);
  }
  return out;
}

/** True when an object still carries a raw-query key (must never appear on dashboard output). */
export function containsRawQueryField(value: unknown, depth = 0): boolean {
  if (value == null || depth > 8) return false;
  if (Array.isArray(value)) return value.some((item) => containsRawQueryField(item, depth + 1));
  if (typeof value !== "object") return false;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    if (QUERY_KEYS.has(key)) return true;
    if (containsRawQueryField(child, depth + 1)) return true;
  }
  return false;
}

export function isCoreEvent(name: string): boolean {
  return (CORE_EVENTS as readonly string[]).includes(name);
}
