/** FP-03 Phase 1: declarative ownership only. No URL, cookie, or resolver changes. */
import type { InsightsFilters } from "./insights-filters";
import type { PlatformHealthDomainId } from "@/measurement/platform-health-score";

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
export type InsightsNavigationIntent = "overview" | "investigation";

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

/** The source marker must accompany an owned, non-empty investigation dimension. */
export function insightsRouteAllowsSource(pathname: string, filters: InsightsFilters): boolean {
  if (!insightsRouteOwnsFilter(pathname, "from")) return false;
  return INSIGHTS_FOCUS_KEYS.some((key) => {
    const value = filters[key];
    if (!value || !insightsRouteOwnsFilter(pathname, key)) return false;
    return key !== "health" || insightsRouteOwnsHealth(pathname, value as PlatformHealthDomainId);
  });
}
