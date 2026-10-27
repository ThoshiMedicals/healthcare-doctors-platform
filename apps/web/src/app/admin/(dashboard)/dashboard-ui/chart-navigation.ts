import type { InsightsFilters } from "./insights-filters";
import { withInsightsQuery } from "./insights-filters";
import { withInvestigationSource } from "./investigation-source";
import {
  conversionIntelligenceHref,
  digitalReceptionHref,
  governanceManagementHref,
  practitionerAuthorityHref,
  serviceAuthorityHref,
  type GovernanceQueue,
} from "./links";

/** Slug from a destination path like `services/telehealth.html` or `doctors/dr-x`. */
export function chartEntitySlug(key: string, kind: "service" | "practitioner" | "page"): string {
  const raw = key.trim().replace(/^\/+/, "").replace(/\.html$/i, "");
  if (kind === "service") {
    return raw.replace(/^services\//i, "").split("/").filter(Boolean).pop() || raw;
  }
  if (kind === "practitioner") {
    return raw.replace(/^doctors\//i, "").split("/").filter(Boolean).pop() || raw;
  }
  return raw;
}

/** High-search low-resolution intent → Digital Reception intent details. */
export function intentInvestigationHref(intent: string, filters?: InsightsFilters | null): string {
  return withInsightsQuery(
    "/admin/digital-reception",
    withInvestigationSource({ ...(filters ?? {}), intent }, "chart"),
    { hash: `intent-${intent}` },
  );
}

/** Service bar → Service Authority focus. */
export function serviceInvestigationHref(key: string, filters?: InsightsFilters | null): string {
  const slug = chartEntitySlug(key, "service");
  return serviceAuthorityHref({
    range: filters?.range,
    focus: slug,
    filters: withInvestigationSource({ ...(filters ?? {}), service: slug }, "chart"),
  });
}

/** Practitioner bar → Practitioner Authority focus. */
export function practitionerInvestigationHref(key: string, filters?: InsightsFilters | null): string {
  const slug = chartEntitySlug(key, "practitioner");
  return practitionerAuthorityHref({
    range: filters?.range,
    focus: slug,
    filters: withInvestigationSource({ ...(filters ?? {}), practitioner: slug }, "chart"),
  });
}

/** Governance segment → queue focus. */
export function governanceQueueInvestigationHref(
  queue: GovernanceQueue,
  filters?: InsightsFilters | null,
): string {
  return governanceManagementHref({
    queue,
    filters: withInvestigationSource(filters, "queue"),
  });
}

/** Destination click from search charts — prefer service, else page on executive. */
export function searchDestinationHref(key: string, filters?: InsightsFilters | null): string {
  const value = key.toLowerCase();
  if (value.includes("services/") || value.startsWith("services")) {
    return serviceInvestigationHref(key, filters);
  }
  if (value.includes("doctors/") || value.startsWith("doctors")) {
    return practitionerInvestigationHref(key, filters);
  }
  return digitalReceptionHref({ ...(filters ?? {}) });
}

function withPathHash(path: string, filters?: InsightsFilters | null, hash?: string): string {
  return withInsightsQuery(path, filters, { hash });
}

/** Conversion funnel stage → related investigation surface. */
export function conversionFunnelStageHref(
  stageKey: string,
  filters?: InsightsFilters | null,
): string {
  switch (stageKey) {
    case "visitor":
    case "visitors":
      return withPathHash("/admin/executive", filters, "exec-performance");
    case "search":
      return withPathHash("/admin/digital-reception", filters, "dr-charts");
    case "service":
    case "services":
      return withPathHash("/admin/service-authority", filters, "sa-rankings");
    case "practitioner":
    case "practitioners":
      return withPathHash("/admin/practitioner-authority", filters, "pa-rankings");
    case "booking":
    case "bookings":
      return withPathHash("/admin/conversion-intelligence", filters, "ci-opportunities");
    default:
      return conversionIntelligenceHref(filters ?? undefined);
  }
}

/** Digital Reception funnel stage → related investigation surface. */
export function digitalReceptionFunnelStageHref(
  stageKey: string,
  filters?: InsightsFilters | null,
): string {
  switch (stageKey) {
    case "open":
    case "opens":
      return withPathHash("/admin/digital-reception", filters, "dr-funnel");
    case "search":
    case "searches":
      return withPathHash("/admin/digital-reception", filters, "dr-charts");
    case "result":
    case "result_click":
    case "results":
      return withPathHash("/admin/digital-reception", filters, "dr-charts");
    case "booking":
    case "bookings":
      return withPathHash("/admin/conversion-intelligence", filters, "ci-funnel");
    case "call":
    case "calls":
      return withPathHash("/admin/conversion-intelligence", filters, "ci-funnel");
    default:
      return withPathHash("/admin/digital-reception", filters, "dr-funnel");
  }
}

/** Gauge alert → same-page investigation section (or DR flags for resolution risk). */
export function gaugeAlertHref(
  alert: "resolution" | "open_rate" | "zero_result" | "watchlist",
  filters?: InsightsFilters | null,
): string {
  const hash =
    alert === "open_rate" ? "dr-funnel" : alert === "watchlist" ? "dr-watchlist" : "dr-flags";
  return withInsightsQuery("/admin/digital-reception", filters, { hash });
}
