import type { ExecutiveRange } from "@/measurement/ranges";
import type { InsightsFilters } from "./insights-filters";
import { withInsightsQuery } from "./insights-filters";
import { withInvestigationSource } from "./investigation-source";
import {
  conversionIntelligenceHref,
  digitalReceptionHref,
  executiveHref,
  governanceManagementHref,
  practitionerAuthorityHref,
  serviceAuthorityHref,
  type GovernanceQueue,
} from "./links";

function fromKpi(filters?: InsightsFilters | null): InsightsFilters {
  return withInvestigationSource(filters, "kpi");
}

/**
 * D1 — every KPI is either a filtered workflow navigation or explicitly informational.
 */
export type KpiNavigation = {
  kind: "action";
  href: string;
  /** Shown under the value (“Investigate search quality →”). */
  label: string;
};

export type KpiInformational = {
  kind: "informational";
  /** Why this tile is not clickable. */
  reason: string;
};

export type KpiAction = KpiNavigation | KpiInformational;

export function kpiAction(href: string, label: string): KpiNavigation {
  return { kind: "action", href, label };
}

export function kpiInfo(reason: string): KpiInformational {
  return { kind: "informational", reason };
}

function withHash(href: string, hash?: string): string {
  if (!hash) return href;
  const clean = hash.replace(/^#/, "");
  const base = href.split("#")[0];
  return `${base}#${clean}`;
}

/** Builders keep current Insights filters (range / data / focus) on drill-through. */
export const KpiTargets = {
  executiveOverview(filters: InsightsFilters, hash = "exec-performance") {
    return kpiAction(withHash(executiveHref(fromKpi(filters)), hash), "Open website overview");
  },
  executivePatients(filters: InsightsFilters) {
    return kpiAction(withHash(executiveHref(fromKpi(filters)), "exec-patients"), "See top pages & people");
  },
  bookingJourney(filters: InsightsFilters, hash = "ci-funnel") {
    return kpiAction(
      withHash(conversionIntelligenceHref(fromKpi(filters)), hash),
      "Investigate booking journey",
    );
  },
  bookingOpportunities(filters: InsightsFilters) {
    return kpiAction(
      withHash(conversionIntelligenceHref(fromKpi(filters)), "ci-opportunities"),
      "Open weak booking paths",
    );
  },
  bookingDropoffs(filters: InsightsFilters) {
    return kpiAction(
      withHash(conversionIntelligenceHref(fromKpi(filters)), "ci-dropoffs"),
      "See exits & drop-offs",
    );
  },
  searchQuality(filters: InsightsFilters, hash = "dr-flags") {
    return kpiAction(
      withHash(digitalReceptionHref(fromKpi(filters)), hash),
      "Investigate search quality",
    );
  },
  searchFunnel(filters: InsightsFilters) {
    return kpiAction(withHash(digitalReceptionHref(fromKpi(filters)), "dr-funnel"), "Open search funnel");
  },
  searchWatchlist(filters: InsightsFilters) {
    return kpiAction(
      withHash(digitalReceptionHref(fromKpi(filters)), "dr-watchlist"),
      "Open search watchlist",
    );
  },
  doctorProfiles(filters: InsightsFilters, hash = "pa-rankings") {
    return kpiAction(
      withHash(
        practitionerAuthorityHref({ filters: fromKpi(filters), range: filters.range }),
        hash,
      ),
      "Open doctor profiles",
    );
  },
  servicePages(filters: InsightsFilters, hash = "sa-rankings") {
    return kpiAction(
      withHash(serviceAuthorityHref({ filters: fromKpi(filters), range: filters.range }), hash),
      "Open service pages",
    );
  },
  governanceQueue(queue: GovernanceQueue, filters?: InsightsFilters) {
    const labels: Record<GovernanceQueue, string> = {
      awaiting_review: "Open awaiting review queue",
      due_soon: "Open due soon queue",
      expired: "Open expired queue",
      missing_ownership: "Open missing owner queue",
    };
    return kpiAction(
      governanceManagementHref({ queue, filters: withInvestigationSource(filters, "queue") }),
      labels[queue],
    );
  },
  governanceBoard(filters?: InsightsFilters) {
    return kpiAction(governanceManagementHref({ filters: fromKpi(filters) }), "Open review board");
  },
  samePageSection(path: string, filters: InsightsFilters | undefined, hash: string, label: string) {
    return kpiAction(withInsightsQuery(path, fromKpi(filters), { hash }), label);
  },
};

/** Informational defaults used when a KPI only provides context. */
export const KpiInfoReasons = {
  volumeContext: "Informational · volume context for rates on this page",
  periodContext: "Informational · period total — use the related rate to take action",
  chartContext: "Informational · read with the chart beside this tile",
} as const;

export function filtersWithRange(
  filters: InsightsFilters,
  range: ExecutiveRange,
): InsightsFilters {
  return { ...filters, range };
}
