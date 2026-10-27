"use client";

import { useEffect } from "react";
import {
  INSIGHTS_FILTERS_COOKIE,
  INSIGHTS_FILTERS_COOKIE_MAX_AGE,
  type InsightsFilters,
  serializeInsightsFiltersCookie,
} from "./insights-filters";

/**
 * Persists active Insights filters in a cookie so Investigations keep context
 * when moving between dashboards (C5). Presentation-only — no permission change.
 */
export function InsightsFilterSync({ filters }: { filters: InsightsFilters }) {
  useEffect(() => {
    const value = serializeInsightsFiltersCookie(filters);
    const hasState = Boolean(
      filters.practitioner || filters.service || filters.queue || filters.range || filters.data,
    );
    if (!hasState) {
      document.cookie = `${INSIGHTS_FILTERS_COOKIE}=; Path=/admin; Max-Age=0; SameSite=Lax`;
      return;
    }
    document.cookie = `${INSIGHTS_FILTERS_COOKIE}=${value}; Path=/admin; Max-Age=${INSIGHTS_FILTERS_COOKIE_MAX_AGE}; SameSite=Lax`;
  }, [filters]);

  return null;
}
