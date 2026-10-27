import {
  PLATFORM_HEALTH_BAND_EXPLANATIONS,
  PLATFORM_HEALTH_DOMAIN_TARGETS,
  type PlatformHealthBandExplanation,
} from "@/measurement/platform-health-investigation";
import type { PlatformHealthDomainId, PlatformHealthState } from "@/measurement/platform-health-score";
import type { InsightsFilters } from "./insights-filters";
import { withInsightsQuery } from "./insights-filters";
import { withInvestigationSource } from "./investigation-source";

/** Open a platform-health domain dashboard in focus mode (D3 + D6). */
export function platformHealthDomainHref(
  domain: PlatformHealthDomainId,
  filters?: InsightsFilters | null,
  opts?: {
    /** When authority needs watch/attention, land on Thin tier investigation. */
    authorityNeedsWork?: boolean;
  },
): string {
  const target = PLATFORM_HEALTH_DOMAIN_TARGETS[domain];
  const next: InsightsFilters = withInvestigationSource(
    {
      ...(filters ?? {}),
      health: domain,
    },
    "health",
  );
  // Drop unrelated slug focus so the health investigation stays clear.
  delete next.practitioner;
  delete next.service;
  delete next.queue;
  let hash = target.hash;
  if (domain === "authority" && opts?.authorityNeedsWork) {
    next.tier = "Thin";
    hash = "pa-roster";
  } else if (domain !== "authority") {
    delete next.tier;
  }
  return withInsightsQuery(target.path, next, {
    hash,
    navigationIntent: "investigation",
    focusKeys: domain === "authority" && opts?.authorityNeedsWork ? ["health", "tier"] : ["health"],
  });
}

export function platformHealthBandExplanation(
  state: PlatformHealthState,
): PlatformHealthBandExplanation {
  return PLATFORM_HEALTH_BAND_EXPLANATIONS[state];
}

export function platformHealthDomainCta(domain: PlatformHealthDomainId): string {
  return PLATFORM_HEALTH_DOMAIN_TARGETS[domain].cta;
}
