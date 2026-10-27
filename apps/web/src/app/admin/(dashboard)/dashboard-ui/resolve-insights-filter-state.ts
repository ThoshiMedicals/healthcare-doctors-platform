import {
  INSIGHTS_FOCUS_KEYS,
  INSIGHTS_SOURCE_COMPATIBILITY,
  insightsDashboardPolicy,
  insightsFiltersForDestination,
} from "./filter-policy";
import { parseInsightsFilters, type InsightsFilters } from "./insights-filters";

/** The existing Next.js search-param contract, including legacy PA/SA focus aliases. */
export type InsightsFilterInput = Parameters<typeof parseInsightsFilters>[0];

/**
 * Pure Phase 3 resolver.
 *
 * Cookie data is a source of range/data preferences ONLY. Investigation state
 * is always derived from explicit, validated URL parameters.
 *
 * Once a destination is supplied (Phase 6 dashboard integration), the route's
 * ownership and health-domain rules are also enforced. Until then, the
 * compatibility path preserves explicit URL focus to avoid breaking existing
 * routes that have not yet been integrated; it never restores cookie focus.
 */
export function resolveInsightsFilterState(
  params: InsightsFilterInput,
  legacyCookie: InsightsFilters,
  destination?: string,
): InsightsFilters {
  const policy = destination === undefined ? null : insightsDashboardPolicy(destination);
  if (destination !== undefined && !policy) {
    // An explicitly unknown route must not inherit Insights filter state.
    return {};
  }

  const fromUrl = parseInsightsFilters({
    ...params,
    focusAs: policy?.legacyFocusAs ?? params.focusAs,
  });

  // Only validated preferences can fall back to the legacy cookie.
  const range = fromUrl.range ?? legacyCookie.range;
  const data = fromUrl.data ?? legacyCookie.data;
  const preferences: InsightsFilters = {
    ...(range ? { range } : {}),
    ...(data ? { data } : {}),
  };

  if (destination !== undefined) {
    // Explicit URL investigations only; never project cookie focus.
    const ownedPreferences = insightsFiltersForDestination(destination, preferences, "overview");
    const ownedUrlInvestigation = insightsFiltersForDestination(
      destination,
      fromUrl,
      "investigation",
      INSIGHTS_FOCUS_KEYS,
    );
    return { ...ownedPreferences, ...ownedUrlInvestigation };
  }

  // Pre-Phase-6 compatibility: existing pages do not supply a destination.
  // Preserve validated explicit URL focus, but strip orphan source markers.
  const resolved: InsightsFilters = { ...preferences };
  for (const key of INSIGHTS_FOCUS_KEYS) {
    const value = fromUrl[key];
    if (value !== undefined) {
      (resolved as Record<string, unknown>)[key] = value;
    }
  }
  if (
    fromUrl.from &&
    INSIGHTS_SOURCE_COMPATIBILITY[fromUrl.from].some((key) => Boolean(fromUrl[key]))
  ) {
    resolved.from = fromUrl.from;
  }
  return resolved;
}
