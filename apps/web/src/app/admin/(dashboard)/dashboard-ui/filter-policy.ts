/** FP-03 Phases 1-2: route ownership and outbound URL policy only. */
import type { InsightsFilters } from "./insights-filters";
import type { PlatformHealthDomainId } from "@/measurement/platform-health-score";
import type { InvestigationSource } from "./investigation-source";

export const INSIGHTS_DASHBOARD_FAMILIES = [
  "briefing",
  "executive",
  "search",
  "authority",
  "conversion",
  "governance",
] as const;

export type InsightsDashboardFamily = (typeof INSIGHTS_DASHBOARD_FAMILIES)[number];
export type InsightsFilterKey = keyof InsightsFilters;
export type InsightsReportingPeriod = "range" | "month" | "preference-only";
export type InsightsLegacyFocus = "practitioner" | "service" | null;
/** Overview links carry preferences only; investigation links may carry owned focus. */
export type InsightsNavigationIntent = "overview" | "investigation";

/** Permitted focus dimensions for each investigation entry source.
 * "queue" and "health" require their corresponding dimensions, not arbitrary focus.
 */
export const INSIGHTS_SOURCE_COMPATIBILITY = {
  queue: ["queue"],
  health: ["health"],
  chart: ["practitioner", "service", "queue", "tier", "intent"],
  kpi: ["practitioner", "service", "queue", "tier", "health", "intent"],
  recommendation: ["practitioner", "service", "queue", "tier", "health", "intent"],
  filter: ["practitioner", "service", "queue", "tier", "health", "intent"],
} as const satisfies Record<InvestigationSource, readonly (keyof InsightsFilters)[]>;

/** The only dimensions eligible for cookie persistence in later phases. */
export const INSIGHTS_PREFERENCE_KEYS = ["range", "data"] as const satisfies readonly InsightsFilterKey[];

/** A `from` marker is not itself focus; it requires an owned active dimension. */
export const INSIGHTS_FOCUS_KEYS = [
  "practitioner",
  "service",
  "queue",
  "tier",
  "health",
  "intent",
] as const satisfies readonly InsightsFilterKey[];

export type InsightsFocusKey = (typeof INSIGHTS_FOCUS_KEYS)[number];

export type InsightsDashboardPolicy = Readonly<{
  family: InsightsDashboardFamily;
  ownedFilters: readonly InsightsFilterKey[];
  reportingPeriod: InsightsReportingPeriod;
  legacyFocusAs: InsightsLegacyFocus;
}>;

/** Exactly the ten Insights destinations. Unknown admin/CMS routes fail closed. */
export const INSIGHTS_DASHBOARD_POLICIES = {
  "/admin": {
    family: "briefing", ownedFilters: ["range", "data"], reportingPeriod: "range", legacyFocusAs: null,
  },
  "/admin/executive": {
    family: "executive", ownedFilters: ["range", "data", "health", "from"], reportingPeriod: "range", legacyFocusAs: null,
  },
  "/admin/executive/monthly": {
    family: "executive", ownedFilters: ["data"], reportingPeriod: "month", legacyFocusAs: null,
  },
  "/admin/digital-reception": {
    family: "search", ownedFilters: ["range", "data", "service", "intent", "health", "from"], reportingPeriod: "range", legacyFocusAs: null,
  },
  "/admin/practitioner-authority": {
    family: "authority", ownedFilters: ["range", "data", "practitioner", "tier", "health", "from"], reportingPeriod: "range", legacyFocusAs: "practitioner",
  },
  "/admin/service-authority": {
    family: "authority", ownedFilters: ["range", "data", "service", "tier", "from"], reportingPeriod: "range", legacyFocusAs: "service",
  },
  "/admin/conversion-intelligence": {
    family: "conversion", ownedFilters: ["range", "data", "practitioner", "service", "health", "from"], reportingPeriod: "range", legacyFocusAs: null,
  },
  "/admin/governance": {
    family: "governance", ownedFilters: ["data", "queue", "from"], reportingPeriod: "preference-only", legacyFocusAs: null,
  },
  "/admin/governance/management": {
    family: "governance", ownedFilters: ["data", "queue", "health", "from"], reportingPeriod: "preference-only", legacyFocusAs: null,
  },
  "/admin/governance/expiry": {
    family: "governance", ownedFilters: ["data"], reportingPeriod: "preference-only", legacyFocusAs: null,
  },
} as const satisfies Record<string, InsightsDashboardPolicy>;

export type InsightsDashboardRoute = keyof typeof INSIGHTS_DASHBOARD_POLICIES;
export const INSIGHTS_DASHBOARD_ROUTES = Object.keys(INSIGHTS_DASHBOARD_POLICIES) as InsightsDashboardRoute[];

/** Must remain aligned with PLATFORM_HEALTH_DOMAIN_TARGETS in measurement. */
export const INSIGHTS_HEALTH_DOMAIN_ROUTES = {
  search: "/admin/digital-reception",
  digital_reception: "/admin/digital-reception",
  governance: "/admin/governance/management",
  analytics: "/admin/executive",
  conversion: "/admin/conversion-intelligence",
  authority: "/admin/practitioner-authority",
  accessibility: "/admin/executive",
} as const satisfies Record<PlatformHealthDomainId, InsightsDashboardRoute>;

export function insightsDashboardRoute(pathname: string): InsightsDashboardRoute | null {
  if (!pathname.startsWith("/") || pathname.startsWith("//")) return null;
  const raw = pathname.split(/[?#]/, 1)[0] ?? "";
  const canonical = raw.length > 1 ? raw.replace(/\/+$/, "") : raw;
  return Object.prototype.hasOwnProperty.call(INSIGHTS_DASHBOARD_POLICIES, canonical)
    ? (canonical as InsightsDashboardRoute)
    : null;
}

export function insightsDashboardPolicy(pathname: string): InsightsDashboardPolicy | null {
  const route = insightsDashboardRoute(pathname);
  return route ? INSIGHTS_DASHBOARD_POLICIES[route] : null;
}

export function insightsRouteOwnsFilter(pathname: string, key: InsightsFilterKey): boolean {
  return insightsDashboardPolicy(pathname)?.ownedFilters.includes(key) ?? false;
}

export function insightsRouteOwnsHealth(pathname: string, domain: PlatformHealthDomainId): boolean {
  const route = insightsDashboardRoute(pathname);
  return route !== null && INSIGHTS_HEALTH_DOMAIN_ROUTES[domain] === route;
}

/** A source is meaningful only when at least one compatible focus belongs to the route. */
export function insightsRouteAllowsSource(pathname: string, filters: InsightsFilters): boolean {
  if (!insightsRouteOwnsFilter(pathname, "from") || !filters.from) return false;
  const compatible = INSIGHTS_SOURCE_COMPATIBILITY[filters.from];
  if (!compatible) return false;
  return compatible.some((key) => {
    const value = filters[key];
    if (!value || !insightsRouteOwnsFilter(pathname, key)) return false;
    return key !== "health" || insightsRouteOwnsHealth(pathname, value as PlatformHealthDomainId);
  });
}

/** Outbound URL projection: focus must be explicitly selected by the caller.
 * Overview navigation and unselected investigation dimensions never inherit focus.
 * Incoming URLs and cookie/resolver state remain untouched until later phases.
 */
export function insightsFiltersForDestination(
  pathname: string,
  filters: InsightsFilters,
  intent: InsightsNavigationIntent,
  selectedFocus: readonly InsightsFocusKey[] = [],
): InsightsFilters {
  const policy = insightsDashboardPolicy(pathname);
  if (!policy) return {};

  const output: InsightsFilters = {};
  const assign = (key: InsightsFilterKey) => {
    const value = filters[key];
    if (value !== undefined && policy.ownedFilters.includes(key)) {
      (output as Record<string, unknown>)[key] = value;
    }
  };

  for (const key of INSIGHTS_PREFERENCE_KEYS) assign(key);
  if (intent === "overview") return output;

  for (const key of selectedFocus) {
    if (!INSIGHTS_FOCUS_KEYS.includes(key)) continue;
    if (key === "health" && filters.health && !insightsRouteOwnsHealth(pathname, filters.health)) {
      continue;
    }
    assign(key);
  }
  if (filters.from && insightsRouteAllowsSource(pathname, { ...output, from: filters.from })) {
    output.from = filters.from;
  }
  return output;
}
