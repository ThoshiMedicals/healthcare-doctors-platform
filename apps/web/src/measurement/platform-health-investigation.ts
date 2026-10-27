import {
  PLATFORM_HEALTH_DOMAIN_LABEL,
  type PlatformHealthDomainId,
  type PlatformHealthState,
  type PlatformHealthSubscore,
} from "@/measurement/platform-health-score";

/** Management labels for the three health bands (D3). */
export const PLATFORM_HEALTH_BAND_LABEL: Record<PlatformHealthState, string> = {
  healthy: "Healthy",
  watch: "Needs Watch",
  needs_attention: "Needs Attention",
};

export type PlatformHealthBandExplanation = {
  state: PlatformHealthState;
  label: string;
  meaning: string;
  whatToDo: string;
  scoreBand: string;
};

export const PLATFORM_HEALTH_BAND_EXPLANATIONS: Record<
  PlatformHealthState,
  PlatformHealthBandExplanation
> = {
  healthy: {
    state: "healthy",
    label: "Healthy",
    meaning: "This area is operating in a stable range — keep the usual weekly scan.",
    whatToDo: "No urgent action. Recheck after the next content or campaign change.",
    scoreBand: "Score 85–100",
  },
  watch: {
    state: "watch",
    label: "Needs Watch",
    meaning: "Signals are softening. Nothing is blocking patients yet, but this needs a closer look this week.",
    whatToDo: "Open the linked dashboard, review the top alerts or weak paths, and assign a follow-up.",
    scoreBand: "Score 70–84",
  },
  needs_attention: {
    state: "needs_attention",
    label: "Needs Attention",
    meaning: "This area is below the safe band and can affect bookings, search, or content trust.",
    whatToDo: "Investigate now — clear the linked queue or fix the weakest paths before moving on.",
    scoreBand: "Score under 70",
  },
};

export type PlatformHealthDomainTarget = {
  domain: PlatformHealthDomainId;
  /** Insights destination path (admin). */
  path: string;
  /** In-page anchor for the investigation surface. */
  hash?: string;
  /** Short CTA on the domain tile. */
  cta: string;
  /** What focus mode means on the destination. */
  focusLabel: string;
};

export const PLATFORM_HEALTH_DOMAIN_TARGETS: Record<
  PlatformHealthDomainId,
  PlatformHealthDomainTarget
> = {
  search: {
    domain: "search",
    path: "/admin/digital-reception",
    hash: "dr-flags",
    cta: "Investigate search",
    focusLabel: "Search health focus — review flagged intents and resolution",
  },
  digital_reception: {
    domain: "digital_reception",
    path: "/admin/digital-reception",
    hash: "dr-funnel",
    cta: "Investigate Digital Reception",
    focusLabel: "Digital Reception health focus — review open rate and funnel",
  },
  governance: {
    domain: "governance",
    path: "/admin/governance/management",
    hash: undefined,
    cta: "Investigate governance",
    focusLabel: "Governance health focus — review expired, due soon, and ownership queues",
  },
  analytics: {
    domain: "analytics",
    path: "/admin/executive",
    hash: "exec-performance",
    cta: "Investigate analytics",
    focusLabel: "Analytics health focus — review traffic, sessions, and contact rate",
  },
  conversion: {
    domain: "conversion",
    path: "/admin/conversion-intelligence",
    hash: "ci-funnel",
    cta: "Investigate conversion",
    focusLabel: "Conversion health focus — review booking funnel and weak paths",
  },
  authority: {
    domain: "authority",
    path: "/admin/practitioner-authority",
    hash: "pa-tiers",
    cta: "Investigate authority",
    focusLabel: "Authority health focus — review Well connected / Building links / Needs more links",
  },
  accessibility: {
    domain: "accessibility",
    path: "/admin/executive",
    hash: "exec-performance",
    cta: "Investigate accessibility",
    focusLabel: "Accessibility health focus — admin colour contrast and readiness signals",
  },
};

export const PLATFORM_HEALTH_DOMAIN_IDS = Object.keys(
  PLATFORM_HEALTH_DOMAIN_TARGETS,
) as PlatformHealthDomainId[];

export function isPlatformHealthDomainId(
  value: string | null | undefined,
): value is PlatformHealthDomainId {
  return !!value && (PLATFORM_HEALTH_DOMAIN_IDS as string[]).includes(value);
}

export function isPlatformHealthState(
  value: string | null | undefined,
): value is PlatformHealthState {
  return value === "healthy" || value === "watch" || value === "needs_attention";
}

/** Domains that should show health-focus mode on a given admin path. */
export function healthDomainsForPath(pathname: string): PlatformHealthDomainId[] {
  const path = pathname.replace(/\/$/, "");
  return PLATFORM_HEALTH_DOMAIN_IDS.filter(
    (id) => PLATFORM_HEALTH_DOMAIN_TARGETS[id].path.replace(/\/$/, "") === path,
  );
}

export function investigatePlatformHealthDomain(domain: PlatformHealthSubscore): {
  band: PlatformHealthBandExplanation;
  domainLabel: string;
  summary: string;
  cta: string;
  focusLabel: string;
} {
  const target = PLATFORM_HEALTH_DOMAIN_TARGETS[domain.id];
  const band = PLATFORM_HEALTH_BAND_EXPLANATIONS[domain.state];
  return {
    band,
    domainLabel: PLATFORM_HEALTH_DOMAIN_LABEL[domain.id],
    summary: domain.summary,
    cta: target.cta,
    focusLabel: target.focusLabel,
  };
}
