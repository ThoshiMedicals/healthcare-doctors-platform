import {
  loadMeasurementEvents,
  type MeasurementEventSource,
  warehouseFeedAvailable,
} from "@/measurement/event-source";
import {
  defaultInsightsDataMode,
  type InsightsDataMode,
} from "@/measurement/insights-data-mode";
import type { InsightsFilters } from "./insights-filters";

export type ResolvedInsightsData = {
  mode: InsightsDataMode;
  filters: InsightsFilters;
  loaded: MeasurementEventSource;
};

/**
 * Resolve Live / Demo / Empty for an Insights page and load the matching event source.
 * Mutates filters.data so nav/export hrefs keep the active mode.
 */
export async function resolveInsightsDashboardData(
  filters: InsightsFilters,
): Promise<ResolvedInsightsData> {
  const warehouseAvailable = await warehouseFeedAvailable();
  const mode = filters.data ?? defaultInsightsDataMode(warehouseAvailable);
  const loaded = await loadMeasurementEvents(mode);
  return {
    mode: loaded.mode,
    filters: { ...filters, data: loaded.mode },
    loaded,
  };
}
