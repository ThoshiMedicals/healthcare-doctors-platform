import { AUTHORITY_TIER_FRIENDLY, type AuthorityTier } from "@/measurement/authority-framework";
import {
  PLATFORM_HEALTH_BAND_EXPLANATIONS,
  PLATFORM_HEALTH_DOMAIN_TARGETS,
} from "@/measurement/platform-health-investigation";
import {
  PLATFORM_HEALTH_DOMAIN_LABEL,
  type PlatformHealthDomainId,
} from "@/measurement/platform-health-score";
import {
  GOVERNANCE_QUEUE_LABEL,
  GOVERNANCE_QUEUE_NEXT_ACTION,
  type GovernanceRemediationQueue,
} from "@/governance/remediation";
import type { InsightsFilters } from "./insights-filters";
import { clearInsightsFocus, withInsightsQuery } from "./insights-filters";
import {
  conversionIntelligenceHref,
  digitalReceptionHref,
  governanceManagementHref,
  practitionerAuthorityHref,
  serviceAuthorityHref,
} from "./links";

export type {
  InvestigationSource,
} from "./investigation-source";
export {
  INVESTIGATION_SOURCES,
  INVESTIGATION_SOURCE_LABEL,
  isInvestigationSource,
} from "./investigation-source";

import type { InvestigationSource } from "./investigation-source";

export type InvestigationLink = {
  href: string;
  label: string;
};

export type InvestigationView = {
  /** Primary subject, e.g. "Needs More Links". */
  title: string;
  /** Count / scope line, e.g. "7 Services". */
  detail?: string;
};

export type InvestigationBannerModel = {
  source: InvestigationSource;
  viewing: InvestigationView;
  recommendations: string[];
  continueLinks: InvestigationLink[];
  clearHref: string;
};

export type InvestigationEntityCounts = {
  /** e.g. roster size when a tier filter is active. */
  count?: number;
  /** "Services" | "Doctor profiles" | "Intents" | "Records" */
  entityLabel?: string;
  /** Resolved focus title when a slug is pinned. */
  focusTitle?: string;
};

/** Infer entry source from filters when `from` is unset. */
export function inferInvestigationSource(filters: InsightsFilters): InvestigationSource | null {
  if (filters.from) return filters.from;
  if (filters.health) return "health";
  if (filters.queue) return "queue";
  if (filters.tier || filters.intent) return "chart";
  if (filters.practitioner || filters.service) return "filter";
  return null;
}

export function investigationActive(filters: InsightsFilters): boolean {
  return Boolean(
    filters.practitioner ||
      filters.service ||
      filters.queue ||
      filters.tier ||
      filters.health ||
      filters.intent ||
      filters.from,
  );
}

function countDetail(counts?: InvestigationEntityCounts): string | undefined {
  if (counts?.count === undefined || !counts.entityLabel) return undefined;
  const n = counts.count;
  const label = counts.entityLabel;
  const plural =
    n === 1
      ? label.replace(/profiles$/i, "profile").replace(/services$/i, "service").replace(/items$/i, "item").replace(/records$/i, "record").replace(/intents$/i, "intent")
      : label;
  return `${n} ${plural}`;
}

function tierRecommendations(tier: AuthorityTier): string[] {
  if (tier === "Hub") {
    return ["Keep two-way links healthy", "Spot-check booking intent on Hub pages"];
  }
  return [
    "Add links",
    "Add services",
    "Add knowledge articles",
    "Improve connections",
  ];
}

function healthRecommendations(domain: PlatformHealthDomainId): string[] {
  const target = PLATFORM_HEALTH_DOMAIN_TARGETS[domain];
  return [
    target.focusLabel,
    PLATFORM_HEALTH_BAND_EXPLANATIONS.watch.whatToDo,
    "Return to Practice briefing after the top fix",
  ];
}

function queueRecommendations(queue: GovernanceRemediationQueue): string[] {
  return [
    GOVERNANCE_QUEUE_NEXT_ACTION[queue],
    "Open each affected record and complete ownership / due dates",
    "Re-check the queue after remediating the top items",
  ];
}

function defaultContinueLinks(
  pathname: string,
  filters: InsightsFilters,
): InvestigationLink[] {
  const links: InvestigationLink[] = [];
  const base = clearInsightsFocus(filters);

  if (pathname.includes("practitioner-authority") || filters.practitioner) {
    links.push({
      href: conversionIntelligenceHref({
        ...filters,
        ...(filters.practitioner ? { practitioner: filters.practitioner } : {}),
      }, undefined, { focusKeys: filters.practitioner ? ["practitioner"] : [] }),
      label: "Conversion",
    });
  }
  if (pathname.includes("service-authority") || filters.service) {
    links.push({
      href: conversionIntelligenceHref({
        ...filters,
        ...(filters.service ? { service: filters.service } : {}),
      }, undefined, { focusKeys: filters.service ? ["service"] : [] }),
      label: "Conversion",
    });
    links.push({
      href: digitalReceptionHref({
        ...filters,
        ...(filters.service ? { service: filters.service } : {}),
      }, undefined, { focusKeys: filters.service ? ["service"] : [] }),
      label: "Digital Reception",
    });
  }
  if (pathname.includes("digital-reception") || filters.intent) {
    links.push({
      href: conversionIntelligenceHref(filters, undefined, {
        focusKeys: filters.service ? ["service"] : [],
      }),
      label: "Conversion",
    });
  }
  if (pathname.includes("conversion-intelligence")) {
    if (filters.practitioner) {
      links.push({
        href: practitionerAuthorityHref({
          range: filters.range,
          focus: filters.practitioner,
          filters: { ...base, practitioner: filters.practitioner, from: "filter" },
        }),
        label: "Doctor profiles",
      });
    }
    if (filters.service) {
      links.push({
        href: serviceAuthorityHref({
          range: filters.range,
          focus: filters.service,
          filters: { ...base, service: filters.service, from: "filter" },
        }),
        label: "Service pages",
      });
    }
  }
  if (pathname.includes("governance")) {
    links.push({
      href: governanceManagementHref({
        queue: filters.queue,
        filters: { ...filters, from: "queue" },
      }),
      label: "Review board",
    });
  }
  if (filters.tier === "Thin" || filters.tier === "Developing") {
    if (!pathname.includes("practitioner-authority")) {
      links.push({
        href: practitionerAuthorityHref({
          range: filters.range,
          tier: filters.tier,
          filters: { ...base, tier: filters.tier, from: filters.from ?? "chart" },
        }),
        label: "Doctor link strength",
      });
    }
    if (!pathname.includes("service-authority")) {
      links.push({
        href: serviceAuthorityHref({
          range: filters.range,
          tier: filters.tier,
          filters: { ...base, tier: filters.tier, from: filters.from ?? "chart" },
        }),
        label: "Service link strength",
      });
    }
  }

  // Dedupe by href
  const seen = new Set<string>();
  return links.filter((link) => {
    if (seen.has(link.href)) return false;
    seen.add(link.href);
    return true;
  });
}

/**
 * Build the shared investigation banner model from Insights filters + page context (D6).
 */
export function buildInvestigationBannerModel(input: {
  filters: InsightsFilters;
  pathname: string;
  counts?: InvestigationEntityCounts;
  continueLinks?: InvestigationLink[];
  recommendations?: string[];
  viewing?: InvestigationView;
}): InvestigationBannerModel | null {
  const { filters, pathname, counts } = input;
  const source = inferInvestigationSource(filters);
  if (!source && !input.viewing) return null;
  if (!investigationActive(filters) && !input.viewing) return null;

  const clearHref = withInsightsQuery(pathname, clearInsightsFocus(filters));
  let viewing: InvestigationView | null = input.viewing ?? null;
  let recommendations = input.recommendations ?? [];

  if (!viewing && filters.tier) {
    viewing = {
      title: AUTHORITY_TIER_FRIENDLY[filters.tier],
      detail: countDetail(counts) ?? counts?.focusTitle,
    };
    recommendations = recommendations.length ? recommendations : tierRecommendations(filters.tier);
  } else if (!viewing && filters.health) {
    viewing = {
      title: `${PLATFORM_HEALTH_DOMAIN_LABEL[filters.health]} health`,
      detail: countDetail(counts) ?? PLATFORM_HEALTH_DOMAIN_TARGETS[filters.health].cta,
    };
    recommendations = recommendations.length ? recommendations : healthRecommendations(filters.health);
  } else if (!viewing && filters.queue) {
    viewing = {
      title: GOVERNANCE_QUEUE_LABEL[filters.queue as GovernanceRemediationQueue] ?? filters.queue,
      detail: countDetail(counts) ?? countDetail({ count: counts?.count, entityLabel: "Records" }),
    };
    recommendations = recommendations.length
      ? recommendations
      : queueRecommendations(filters.queue as GovernanceRemediationQueue);
  } else if (!viewing && filters.intent) {
    viewing = {
      title: `Intent · ${filters.intent.replaceAll("_", " ")}`,
      detail: countDetail(counts),
    };
    recommendations = recommendations.length
      ? recommendations
      : [
          "Review high-volume low-resolution routing",
          "Improve result destinations for this intent",
          "Continue into Conversion after search fixes",
        ];
  } else if (!viewing && (filters.practitioner || filters.service)) {
    viewing = {
      title: counts?.focusTitle || filters.practitioner || filters.service || "Focused entity",
      detail: countDetail(counts) || (filters.practitioner ? "Doctor profile" : "Service page"),
    };
    recommendations = recommendations.length
      ? recommendations
      : [
          "Check booking and contact performance",
          "Strengthen related links on this page",
          "Continue investigation into Conversion",
        ];
  }

  if (!viewing) return null;

  if (!recommendations.length) {
    recommendations = ["Review the filtered results below", "Take the top remediation action", "Clear the filter when done"];
  }

  const continueLinks =
    input.continueLinks && input.continueLinks.length > 0
      ? input.continueLinks
      : defaultContinueLinks(pathname, filters);

  return {
    source: source ?? "filter",
    viewing,
    recommendations: recommendations.slice(0, 4),
    continueLinks: continueLinks.slice(0, 4),
    clearHref,
  };
}

export { withInvestigationSource } from "./investigation-source";
