"use client";

import { useEffect } from "react";
import type { InsightsFilters } from "./insights-filters";
import {
  insightsPreferenceCookieWrites,
  insightsPreferencesWriteConfirmed,
} from "./insights-preferences";

/** Persist reporting preferences only. URL focus remains authoritative. */
export function InsightsFilterSync({ filters }: { filters: InsightsFilters }) {
  useEffect(() => {
    const [writeV2, expireLegacy] = insightsPreferenceCookieWrites(
      filters,
      window.location.protocol === "https:",
    );
    // Complete the replacement before deleting legacy state.
    document.cookie = writeV2;
    if (insightsPreferencesWriteConfirmed(document.cookie, filters)) {
      document.cookie = expireLegacy;
    }
  }, [filters]);

  return null;
}
