"use client";

import { useEffect } from "react";
import { INSIGHTS_FILTERS_COOKIE, type InsightsFilters } from "./insights-filters";
import {
  INSIGHTS_PREFERENCES_COOKIE,
  insightsCookieValue,
  mergeInsightsPreferences,
  resolveInsightsCookiePreferences,
  insightsPreferenceCookieWrites,
  insightsPreferencesWriteConfirmed,
} from "./insights-preferences";

/** Persist reporting preferences only. URL focus remains authoritative. */
export function InsightsFilterSync({ filters }: { filters: InsightsFilters }) {
  useEffect(() => {
    const header = document.cookie;
    const stored = resolveInsightsCookiePreferences(
      insightsCookieValue(header, INSIGHTS_PREFERENCES_COOKIE),
      insightsCookieValue(header, INSIGHTS_FILTERS_COOKIE),
    );
    // Governance and Monthly do not own range in their URLs: retain saved range.
    const preferences = mergeInsightsPreferences(stored, filters);
    const [writeV2, expireLegacy] = insightsPreferenceCookieWrites(
      preferences,
      window.location.protocol === "https:",
    );
    // Complete the replacement before deleting legacy state.
    document.cookie = writeV2;
    if (insightsPreferencesWriteConfirmed(document.cookie, preferences)) {
      document.cookie = expireLegacy;
    }
  }, [filters]);

  return null;
}
