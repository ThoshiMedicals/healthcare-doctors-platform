import { cookies } from "next/headers";
import {
  INSIGHTS_FILTERS_COOKIE,
  parseInsightsFiltersCookie,
  type InsightsFilters,
} from "./insights-filters";
import {
  resolveInsightsFilterState,
  type InsightsFilterInput,
} from "./resolve-insights-filter-state";

/**
 * Phase 3 server resolver: cookie data supplies preferences only.
 *
 * Pass an explicit Insights dashboard pathname to enforce route ownership.
 * Legacy dashboard routes call the one-argument form until Phase 6; in that
 * compatibility mode URL focus works, but no cookie investigation is restored.
 *
 * No cookie writing, expiry or schema migration is performed here.
 */
export async function resolveInsightsFilters(
  params: InsightsFilterInput,
  destination?: string,
): Promise<InsightsFilters> {
  const jar = await cookies();
  const legacyCookie = parseInsightsFiltersCookie(jar.get(INSIGHTS_FILTERS_COOKIE)?.value);
  return resolveInsightsFilterState(params, legacyCookie, destination);
}
