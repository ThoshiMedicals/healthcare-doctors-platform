import { promises as fs } from "node:fs";
import path from "node:path";
import {
  buildHealthcareDemoEvents,
  HEALTHCARE_DEMO_DATASET_META,
} from "@/measurement/demo/healthcare-demo-events";
import {
  defaultInsightsDataMode,
  parseInsightsDataMode,
  type InsightsDataMode,
} from "@/measurement/insights-data-mode";
import { filterEventsForClinic } from "@/measurement/clinic-filter";
import type { RawMeasurementEvent } from "@/measurement/types";

export type MeasurementEventSourceKind =
  | "warehouse_file"
  | "demo_dataset"
  | "empty"
  | "live_empty";

export type MeasurementEventSource = {
  events: RawMeasurementEvent[];
  source: MeasurementEventSourceKind;
  mode: InsightsDataMode;
  /** Human-readable feed label for dashboard chrome. */
  feedLabel: string;
  /** True when demo/sample data is driving the view (must be labelled in UI). */
  isDemo: boolean;
  path?: string;
  datasetId?: string;
  clinicSlug?: string;
};

export type LoadMeasurementEventsOptions = {
  mode?: InsightsDataMode | string | null;
  /** When set, warehouse/demo events are filtered to this clinic slug. */
  clinicSlug?: string | null;
  clinicId?: string | null;
};

const WAREHOUSE_RELATIVE = path.join("data", "measurement-events.json");

async function readWarehouseEvents(): Promise<{
  events: RawMeasurementEvent[];
  path: string;
} | null> {
  const filePath = path.join(process.cwd(), WAREHOUSE_RELATIVE);
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    const events = Array.isArray(parsed)
      ? (parsed as RawMeasurementEvent[])
      : Array.isArray((parsed as { events?: unknown })?.events)
        ? (parsed as { events: RawMeasurementEvent[] }).events
        : null;
    if (events && events.length) {
      return { events, path: filePath };
    }
  } catch {
    /* Missing or unreadable — treat as no warehouse. */
  }
  return null;
}

export async function warehouseFeedAvailable(): Promise<boolean> {
  return (await readWarehouseEvents()) !== null;
}

/**
 * Load Insights dashboard events for Live / Demo / Empty (C9).
 * Demo datasets are never written into the warehouse path.
 * Optional clinicSlug/clinicId prepare multi-tenant Insights without changing public sites.
 */
export async function loadMeasurementEvents(
  modeOrOptions?: InsightsDataMode | string | null | LoadMeasurementEventsOptions,
): Promise<MeasurementEventSource> {
  const options: LoadMeasurementEventsOptions =
    typeof modeOrOptions === "string" || modeOrOptions == null
      ? { mode: modeOrOptions }
      : modeOrOptions;
  const requested = options.mode;
  const clinicRef = { clinicSlug: options.clinicSlug, clinicId: options.clinicId };
  const scope = (events: RawMeasurementEvent[]) =>
    options.clinicSlug || options.clinicId
      ? filterEventsForClinic(events, clinicRef)
      : events;

  const warehouse = await readWarehouseEvents();
  const warehouseAvailable = warehouse !== null;
  const mode =
    parseInsightsDataMode(typeof requested === "string" ? requested : undefined) ??
    defaultInsightsDataMode(warehouseAvailable);

  if (mode === "empty") {
    return {
      events: [],
      source: "empty",
      mode,
      feedLabel: "Empty mode · zero activity",
      isDemo: false,
      clinicSlug: options.clinicSlug || undefined,
    };
  }

  if (mode === "demo") {
    return {
      events: scope(buildHealthcareDemoEvents()),
      source: "demo_dataset",
      mode,
      feedLabel: `Demo data · ${HEALTHCARE_DEMO_DATASET_META.label}`,
      isDemo: true,
      datasetId: HEALTHCARE_DEMO_DATASET_META.id,
      path: HEALTHCARE_DEMO_DATASET_META.storage,
      clinicSlug: options.clinicSlug || undefined,
    };
  }

  // Live
  if (warehouse) {
    return {
      events: scope(warehouse.events),
      source: "warehouse_file",
      mode: "live",
      feedLabel: "Live · warehouse feed",
      isDemo: false,
      path: warehouse.path,
      clinicSlug: options.clinicSlug || undefined,
    };
  }

  return {
    events: [],
    source: "live_empty",
    mode: "live",
    feedLabel: "Live · no warehouse traffic yet",
    isDemo: false,
    clinicSlug: options.clinicSlug || undefined,
  };
}
