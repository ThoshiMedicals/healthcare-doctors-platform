import { cookies } from "next/headers";
import { INSIGHTS_FILTERS_COOKIE, type InsightsFilters } from "./insights-filters";
import {
  INSIGHTS_PREFERENCES_COOKIE,
  resolveInsightsCookiePreferences,
} from "./insights-preferences";
import {
  resolveInsightsFilterState,
  type InsightsFilterInput,
} from "./resolve-insights-filter-state";

/**
 * Phase 4 server resolver: v2 preferences win; legacy contributes only range/data
 * when the v2 cookie is absent. Investigation state comes exclusively from URL.
 *
 * Destination-specific enforcement remains opt-in until Phase 6 integration.
 * Cookie writing/retirement is handled by InsightsFilterSync on the client.
 */
export async function resolveInsightsFilters(
  params: InsightsFilterInput,
  destination?: string,
): Promise<InsightsFilters> {
  const jar = await cookies();
  const preferences = resolveInsightsCookiePreferences(
    jar.get(INSIGHTS_PREFERENCES_COOKIE)?.value,
    jar.get(INSIGHTS_FILTERS_COOKIE)?.value,
  );
  return resolveInsightsFilterState(params, preferences, destination);
}
