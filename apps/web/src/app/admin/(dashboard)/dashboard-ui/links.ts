import type { ExecutiveRange } from "@/measurement/ranges";
import { insightsFiltersForDestination, type InsightsFocusKey } from "./filter-policy";

/** Explicit drill-through contract. Omitting focusKeys always means overview. */
type LinkFocus = { focusKeys: readonly InsightsFocusKey[] };
function linkIntent(focus?: LinkFocus) {
  return focus?.focusKeys.length
    ? { navigationIntent: "investigation" as const, focusKeys: focus.focusKeys }
    : { navigationIntent: "overview" as const };
}
import {
  type InsightsFilters,
  withInsightsQuery,
} from "./insights-filters";

export type GovernanceQueue =
  | "awaiting_review"
  | "due_soon"
  | "expired"
  | "missing_ownership";

/** Cross-dashboard href builders — dashboards share range + focus/queue params. */

function baseFilters(
  range?: ExecutiveRange,
  filters?: InsightsFilters | null,
): InsightsFilters {
  return { ...filters, ...(range ? { range } : {}) };
}

export function executiveHref(
  rangeOrFilters?: ExecutiveRange | InsightsFilters,
  focus?: LinkFocus,
): string {
  if (!rangeOrFilters) return "/admin/executive";
  if (typeof rangeOrFilters === "string") {
    return withInsightsQuery("/admin/executive", { range: rangeOrFilters });
  }
  return withInsightsQuery("/admin/executive", rangeOrFilters, linkIntent(focus));
}

export function digitalReceptionHref(
  rangeOrFilters?: ExecutiveRange | InsightsFilters,
  filters?: InsightsFilters,
  focus?: LinkFocus,
): string {
  const merged =
    typeof rangeOrFilters === "string" || rangeOrFilters === undefined
      ? baseFilters(rangeOrFilters, filters)
      : rangeOrFilters;
  return withInsightsQuery("/admin/digital-reception", merged, linkIntent(focus));
}

export function practitionerAuthorityHref(opts?: {
  range?: ExecutiveRange;
  focus?: string;
  tier?: InsightsFilters["tier"];
  filters?: InsightsFilters;
}): string {
  const filters: InsightsFilters = {
    ...opts?.filters,
    ...(opts?.range ? { range: opts.range } : {}),
    ...(opts?.focus ? { practitioner: opts.focus } : {}),
    ...(opts?.tier ? { tier: opts.tier } : {}),
  };
  const hash = opts?.focus ? "pa-focus" : opts?.tier ? "pa-roster" : undefined;
  const focusKeys: InsightsFocusKey[] = [];
  if (opts?.focus) focusKeys.push("practitioner");
  if (opts?.tier) focusKeys.push("tier");
  return withInsightsQuery("/admin/practitioner-authority", filters, {
    practitionerAsFocus: true,
    hash,
    ...linkIntent({ focusKeys }),
  });
}

export function serviceAuthorityHref(opts?: {
  range?: ExecutiveRange;
  focus?: string;
  tier?: InsightsFilters["tier"];
  filters?: InsightsFilters;
}): string {
  const filters: InsightsFilters = {
    ...opts?.filters,
    ...(opts?.range ? { range: opts.range } : {}),
    ...(opts?.focus ? { service: opts.focus } : {}),
    ...(opts?.tier ? { tier: opts.tier } : {}),
  };
  const hash = opts?.focus ? "sa-focus" : opts?.tier ? "sa-roster" : undefined;
  const focusKeys: InsightsFocusKey[] = [];
  if (opts?.focus) focusKeys.push("service");
  if (opts?.tier) focusKeys.push("tier");
  return withInsightsQuery("/admin/service-authority", filters, {
    serviceAsFocus: true,
    hash,
    ...linkIntent({ focusKeys }),
  });
}

export function conversionIntelligenceHref(
  rangeOrFilters?: ExecutiveRange | InsightsFilters,
  filters?: InsightsFilters,
  focus?: LinkFocus,
): string {
  const merged =
    typeof rangeOrFilters === "string" || rangeOrFilters === undefined
      ? baseFilters(rangeOrFilters, filters)
      : rangeOrFilters;
  return withInsightsQuery("/admin/conversion-intelligence", merged, linkIntent(focus));
}

export function governanceManagementHref(opts?: {
  queue?: GovernanceQueue;
  filters?: InsightsFilters;
}): string {
  const selectedQueue = opts?.queue ?? opts?.filters?.queue;
  const filters: InsightsFilters = {
    ...opts?.filters,
    ...(selectedQueue
      ? {
          queue: selectedQueue,
          // A selected queue supersedes any earlier health investigation.
          health: undefined,
          from: opts?.filters?.from === "recommendation" ? "recommendation" as const : "queue" as const,
        }
      : {}),
  };
  return withInsightsQuery("/admin/governance/management", filters, {
    includeRange: false,
    hash: selectedQueue ? `queue-${selectedQueue}` : undefined,
    ...linkIntent({ focusKeys: selectedQueue ? ["queue"] : [] }),
  });
}

export function governanceExpiryHref(filters?: InsightsFilters): string {
  return withInsightsQuery("/admin/governance/expiry", filters, { includeRange: false });
}

export function governanceReviewHref(opts?: {
  queue?: GovernanceQueue;
  filters?: InsightsFilters;
}): string {
  const selectedQueue = opts?.queue ?? opts?.filters?.queue;
  const filters: InsightsFilters = {
    ...opts?.filters,
    ...(selectedQueue ? { queue: selectedQueue } : {}),
  };
  return withInsightsQuery("/admin/governance", filters, {
    includeRange: false,
    hash: selectedQueue ? "gov-focus" : undefined,
    ...linkIntent({ focusKeys: selectedQueue ? ["queue"] : [] }),
  });
}

export type InsightsDestination =
  | "command-centre"
  | "executive"
  | "digital-reception"
  | "practitioner-authority"
  | "service-authority"
  | "conversion-intelligence"
  | "governance-review"
  | "governance-management"
  | "governance-expiry";

export function commandCentreHref(
  rangeOrFilters?: ExecutiveRange | InsightsFilters,
  filters?: InsightsFilters,
): string {
  const merged =
    typeof rangeOrFilters === "string" || rangeOrFilters === undefined
      ? baseFilters(rangeOrFilters, filters)
      : rangeOrFilters;
  return withInsightsQuery("/admin", merged);
}

export function insightsNavItems(
  rangeOrFilters?: ExecutiveRange | InsightsFilters,
): Array<{
  id: InsightsDestination;
  label: string;
  href: string;
}> {
  const filters: InsightsFilters =
    typeof rangeOrFilters === "string" || rangeOrFilters === undefined
      ? rangeOrFilters
        ? { range: rangeOrFilters }
        : {}
      : rangeOrFilters;

  // Shared navigation always opens overviews, never transfers investigation focus.
  const overview = insightsFiltersForDestination("/admin", filters, "overview");
  return [
    { id: "command-centre", label: "Briefing", href: commandCentreHref(overview) },
    { id: "executive", label: "Website", href: executiveHref(overview) },
    { id: "digital-reception", label: "Search", href: digitalReceptionHref(overview) },
    {
      id: "practitioner-authority",
      label: "Doctors",
      href: practitionerAuthorityHref({ filters: overview }),
    },
    { id: "service-authority", label: "Services", href: serviceAuthorityHref({ filters: overview }) },
    {
      id: "conversion-intelligence",
      label: "Bookings",
      href: conversionIntelligenceHref(overview),
    },
    { id: "governance-review", label: "Reviews", href: governanceReviewHref({ filters: overview }) },
    {
      id: "governance-management",
      label: "Review board",
      href: governanceManagementHref({ filters: overview }),
    },
    { id: "governance-expiry", label: "Due dates", href: governanceExpiryHref(overview) },
  ];
}
