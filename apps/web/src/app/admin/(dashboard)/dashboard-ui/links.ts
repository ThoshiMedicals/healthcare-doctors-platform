import type { ExecutiveRange } from "@/measurement/ranges";
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

export function executiveHref(rangeOrFilters?: ExecutiveRange | InsightsFilters): string {
  if (!rangeOrFilters) return "/admin/executive";
  if (typeof rangeOrFilters === "string") {
    return withInsightsQuery("/admin/executive", { range: rangeOrFilters });
  }
  return withInsightsQuery("/admin/executive", rangeOrFilters);
}

export function digitalReceptionHref(
  rangeOrFilters?: ExecutiveRange | InsightsFilters,
  filters?: InsightsFilters,
): string {
  const merged =
    typeof rangeOrFilters === "string" || rangeOrFilters === undefined
      ? baseFilters(rangeOrFilters, filters)
      : rangeOrFilters;
  return withInsightsQuery("/admin/digital-reception", merged);
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
  const hash = filters.practitioner ? "pa-focus" : filters.tier ? "pa-roster" : undefined;
  return withInsightsQuery("/admin/practitioner-authority", filters, {
    practitionerAsFocus: true,
    hash,
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
  const hash = filters.service ? "sa-focus" : filters.tier ? "sa-roster" : undefined;
  return withInsightsQuery("/admin/service-authority", filters, {
    serviceAsFocus: true,
    hash,
  });
}

export function conversionIntelligenceHref(
  rangeOrFilters?: ExecutiveRange | InsightsFilters,
  filters?: InsightsFilters,
): string {
  const merged =
    typeof rangeOrFilters === "string" || rangeOrFilters === undefined
      ? baseFilters(rangeOrFilters, filters)
      : rangeOrFilters;
  return withInsightsQuery("/admin/conversion-intelligence", merged);
}

export function governanceManagementHref(opts?: {
  queue?: GovernanceQueue;
  filters?: InsightsFilters;
}): string {
  const filters: InsightsFilters = {
    ...opts?.filters,
    ...(opts?.queue ? { queue: opts.queue } : {}),
    ...(opts?.queue && !opts?.filters?.from ? { from: "queue" as const } : {}),
  };
  return withInsightsQuery("/admin/governance/management", filters, {
    includeRange: false,
    hash: filters.queue ? `queue-${filters.queue}` : undefined,
  });
}

export function governanceExpiryHref(filters?: InsightsFilters): string {
  return withInsightsQuery("/admin/governance/expiry", filters, { includeRange: false });
}

export function governanceReviewHref(opts?: {
  queue?: GovernanceQueue;
  filters?: InsightsFilters;
}): string {
  const filters: InsightsFilters = {
    ...opts?.filters,
    ...(opts?.queue ? { queue: opts.queue } : {}),
  };
  return withInsightsQuery("/admin/governance", filters, {
    includeRange: false,
    hash: filters.queue ? "gov-focus" : undefined,
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

  return [
    { id: "command-centre", label: "Briefing", href: commandCentreHref(filters) },
    { id: "executive", label: "Website", href: executiveHref(filters) },
    { id: "digital-reception", label: "Search", href: digitalReceptionHref(filters) },
    {
      id: "practitioner-authority",
      label: "Doctors",
      href: practitionerAuthorityHref({ filters }),
    },
    { id: "service-authority", label: "Services", href: serviceAuthorityHref({ filters }) },
    {
      id: "conversion-intelligence",
      label: "Bookings",
      href: conversionIntelligenceHref(filters),
    },
    { id: "governance-review", label: "Reviews", href: governanceReviewHref({ filters }) },
    {
      id: "governance-management",
      label: "Review board",
      href: governanceManagementHref({ filters }),
    },
    { id: "governance-expiry", label: "Due dates", href: governanceExpiryHref(filters) },
  ];
}
