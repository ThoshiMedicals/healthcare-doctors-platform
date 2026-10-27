import type { PracticeConversionIntelligenceReport } from "@/measurement/conversion-intelligence-report";
import type { PracticeDigitalReceptionDashboard } from "@/measurement/digital-reception-report";
import type { MetricTrend, PracticeExecutiveDashboard } from "@/measurement/executive-report";
import type { PracticePractitionerAuthorityDashboard } from "@/measurement/practitioner-authority-report";
import type { PracticeServiceAuthorityDashboard } from "@/measurement/service-authority-report";
import type { PracticeGovernanceManagementReport } from "@/governance/management-report";
import type { PlatformReadinessScorecard } from "@/readiness/platform-readiness";

/** Aligned with command-centre Healthy / Needs Watch / Needs Attention bands. */
export type PlatformHealthState = "healthy" | "watch" | "needs_attention";

export type PlatformHealthDomainId =
  | "search"
  | "digital_reception"
  | "governance"
  | "analytics"
  | "conversion"
  | "authority"
  | "accessibility";

export type PlatformHealthSubscore = {
  id: PlatformHealthDomainId;
  label: string;
  score: number;
  state: PlatformHealthState;
  weight: number;
  summary: string;
  trend: MetricTrend;
};

export type PlatformHealthScorecard = {
  overall_score: number;
  overall_state: PlatformHealthState;
  overall_trend: MetricTrend;
  domains: PlatformHealthSubscore[];
  generated_at: string;
};

export const PLATFORM_HEALTH_STATE_LABEL: Record<PlatformHealthState, string> = {
  healthy: "Healthy",
  watch: "Needs Watch",
  needs_attention: "Needs Attention",
};

export const PLATFORM_HEALTH_DOMAIN_LABEL: Record<PlatformHealthDomainId, string> = {
  search: "Search",
  digital_reception: "Digital Reception",
  governance: "Governance",
  analytics: "Analytics",
  conversion: "Conversion",
  authority: "Authority",
  accessibility: "Accessibility",
};

/** Weights sum to 1.0 — single KPI composition for Overall Health Score. */
export const PLATFORM_HEALTH_WEIGHTS: Record<PlatformHealthDomainId, number> = {
  search: 0.15,
  digital_reception: 0.15,
  governance: 0.15,
  analytics: 0.15,
  conversion: 0.15,
  authority: 0.15,
  accessibility: 0.1,
};

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function stateFromScore(score: number): PlatformHealthState {
  if (score < 70) return "needs_attention";
  if (score < 85) return "watch";
  return "healthy";
}

function buildTrend(current: number, previous: number): MetricTrend {
  const delta = Number((current - previous).toFixed(1));
  const delta_pct =
    previous === 0 ? (current === 0 ? 0 : null) : Number((((current - previous) / previous) * 100).toFixed(1));
  const direction = delta > 0.5 ? "up" : delta < -0.5 ? "down" : "flat";
  return { current, previous, delta, delta_pct, direction };
}

function scoreSearch(dr: PracticeDigitalReceptionDashboard | null | undefined): { score: number; summary: string } {
  if (!dr) return { score: 70, summary: "Search signals unavailable this range." };
  let score = 100;
  if (dr.kpis.resolution_band === "red") score -= 35;
  else if (dr.kpis.resolution_band === "amber") score -= 15;
  else if (dr.kpis.resolution_band === "unknown") score -= 10;
  const zero = dr.kpis.zero_result_rate;
  if (zero !== null && zero > 30) score -= 15;
  else if (zero !== null && zero > 15) score -= 8;
  score -= Math.min(15, dr.flagged_intents.length * 3);
  const rate = dr.kpis.resolution_rate === null ? "—" : `${dr.kpis.resolution_rate}%`;
  return {
    score: clampScore(score),
    summary: `Resolution ${rate} · ${dr.flagged_intents.length} flagged intent${dr.flagged_intents.length === 1 ? "" : "s"}.`,
  };
}

function scoreDigitalReception(
  dr: PracticeDigitalReceptionDashboard | null | undefined,
): { score: number; summary: string } {
  if (!dr) return { score: 70, summary: "Digital Reception signals unavailable this range." };
  let score = 100;
  if (dr.kpis.resolution_band === "red") score -= 25;
  else if (dr.kpis.resolution_band === "amber") score -= 12;
  const open = dr.kpis.open_rate;
  if (open !== null && open < 20) score -= 15;
  else if (open !== null && open < 40) score -= 8;
  const watchRed = dr.watchlist.filter((row) => row.resolution_band === "red").length;
  score -= Math.min(12, watchRed * 4);
  const bookingStep = dr.funnel.find((step) => step.key === "booking");
  if (bookingStep?.share_of_opens !== null && bookingStep && bookingStep.share_of_opens < 10) score -= 8;
  return {
    score: clampScore(score),
    summary: `Open rate ${open === null ? "—" : `${open}%`} · ${dr.kpis.searches} searches · ${watchRed} watchlist at risk.`,
  };
}

function scoreGovernance(
  gov: Pick<PracticeGovernanceManagementReport, "totals"> | null | undefined,
): { score: number; summary: string } {
  if (!gov) return { score: 75, summary: "Governance queues not loaded for this role." };
  const totals = gov.totals;
  let score = 100;
  if (totals.expired > 0) score -= Math.min(30, 10 + totals.expired * 5);
  if (totals.missing_ownership > 0) score -= Math.min(15, 6 + totals.missing_ownership * 3);
  score -= Math.min(12, totals.awaiting_review * 2);
  score -= Math.min(10, totals.due_within_60_days);
  return {
    score: clampScore(score),
    summary: `${totals.expired} expired · ${totals.due_within_60_days} due soon · ${totals.missing_ownership} missing ownership.`,
  };
}

function scoreAnalytics(executive: PracticeExecutiveDashboard): { score: number; summary: string } {
  let score = 100;
  const contact = executive.rates.find((rate) => rate.key === "contact_rate")?.value ?? null;
  if (executive.kpis.sessions === 0) score -= 25;
  else if (executive.kpis.traffic === 0) score -= 15;
  if (contact === null) score -= 12;
  else if (contact < 2) score -= 18;
  else if (contact < 5) score -= 8;
  const delta = executive.trends.contact_rate.delta_pct;
  if (delta !== null && delta < -15) score -= 12;
  else if (delta !== null && delta < -5) score -= 6;
  if (executive.trends.sessions.direction === "down" && (executive.trends.sessions.delta_pct ?? 0) < -20) {
    score -= 8;
  }
  return {
    score: clampScore(score),
    summary: `Contact rate ${contact === null ? "—" : `${contact}%`} · ${executive.kpis.sessions} sessions · ${executive.kpis.traffic} views.`,
  };
}

function scoreConversion(
  conversion: PracticeConversionIntelligenceReport | null | undefined,
): { score: number; summary: string } {
  if (!conversion) return { score: 70, summary: "Conversion signals unavailable this range." };
  let score = 100;
  const opportunityCount =
    conversion.opportunities.weak_booking_paths.length +
    conversion.opportunities.weak_service_journeys.length +
    conversion.opportunities.weak_practitioner_journeys.length;
  score -= Math.min(24, opportunityCount * 3);
  const bottleneck = conversion.funnel.find((step) => step.bottleneck);
  if (bottleneck?.drop_from_previous !== null && bottleneck && bottleneck.drop_from_previous >= 50) {
    score -= 15;
  } else if (bottleneck?.drop_from_previous !== null && bottleneck && bottleneck.drop_from_previous >= 30) {
    score -= 8;
  }
  const booking = conversion.funnel.find((step) => step.key === "booking");
  if (booking?.share_of_visitors !== null && booking && booking.share_of_visitors < 5) score -= 10;
  return {
    score: clampScore(score),
    summary: `${opportunityCount} weak path${opportunityCount === 1 ? "" : "s"} · bottleneck ${bottleneck?.label ?? "none"}.`,
  };
}

function scoreAuthority(
  practitioners: PracticePractitionerAuthorityDashboard | null | undefined,
  services: PracticeServiceAuthorityDashboard | null | undefined,
): { score: number; summary: string } {
  if (!practitioners && !services) {
    return { score: 70, summary: "Authority dashboards unavailable this range." };
  }
  let score = 100;
  const hub =
    (practitioners?.tier_counts.Hub ?? 0) + (services?.tier_counts.Hub ?? 0);
  const thin =
    (practitioners?.tier_counts.Thin ?? 0) + (services?.tier_counts.Thin ?? 0);
  const total =
    hub +
    (practitioners?.tier_counts.Developing ?? 0) +
    (services?.tier_counts.Developing ?? 0) +
    thin;
  if (total > 0) {
    const thinShare = thin / total;
    if (thinShare > 0.45) score -= 18;
    else if (thinShare > 0.3) score -= 10;
    const hubShare = hub / total;
    if (hubShare < 0.15) score -= 8;
  }
  const weakPractitioners = (practitioners?.practitioners ?? []).filter(
    (row) =>
      (row.tier === "Hub" || row.authority_score >= 7) &&
      row.profile_views >= 3 &&
      (row.booking_intent === null || row.booking_intent <= 25),
  ).length;
  const weakServices = (services?.services ?? []).filter(
    (row) =>
      row.service_views >= 5 && (row.contact_rate === null || row.contact_rate <= 25),
  ).length;
  score -= Math.min(16, weakPractitioners * 4);
  score -= Math.min(16, weakServices * 3);
  return {
    score: clampScore(score),
    summary: `${hub} Hub · ${thin} Thin · ${weakPractitioners + weakServices} weak converters under authority.`,
  };
}

function scoreAccessibility(
  readiness: PlatformReadinessScorecard | null | undefined,
  colourAuditScore: number,
): { score: number; summary: string } {
  const domain = readiness?.domains.find(
    (item) => item.id === "accessibility" || item.label.toLowerCase().includes("accessibility"),
  );
  const readinessScore = domain ? Math.round(domain.score * 10) : colourAuditScore;
  const blended = clampScore(Math.round(colourAuditScore * 0.55 + readinessScore * 0.45));
  return {
    score: blended,
    summary: `Admin colour AA audit ${colourAuditScore} · readiness accessibility ${readinessScore}.`,
  };
}

/**
 * Unified platform-health model (C7).
 * Overall Health Score = weighted mean of Search · DR · Governance · Analytics · Conversion · Authority · Accessibility.
 */
export function buildPlatformHealthScorecard(input: {
  executive: PracticeExecutiveDashboard;
  digitalReception?: PracticeDigitalReceptionDashboard | null;
  previousDigitalReception?: PracticeDigitalReceptionDashboard | null;
  conversion?: PracticeConversionIntelligenceReport | null;
  previousConversion?: PracticeConversionIntelligenceReport | null;
  practitioners?: PracticePractitionerAuthorityDashboard | null;
  services?: PracticeServiceAuthorityDashboard | null;
  governance?: Pick<PracticeGovernanceManagementReport, "totals"> | null;
  readiness?: PlatformReadinessScorecard | null;
  /** WCAG / admin colour accessibility score (0–100). */
  accessibilityAuditScore?: number;
}): PlatformHealthScorecard {
  const colourAudit = input.accessibilityAuditScore ?? 91;
  const search = scoreSearch(input.digitalReception);
  const previousSearch = scoreSearch(input.previousDigitalReception);
  const dr = scoreDigitalReception(input.digitalReception);
  const previousDr = scoreDigitalReception(input.previousDigitalReception);
  const governance = scoreGovernance(input.governance);
  const analytics = scoreAnalytics(input.executive);
  // Approximate prior analytics from contact-rate trend magnitude.
  const analyticsPrevious = clampScore(
    analytics.score -
      (input.executive.trends.contact_rate.delta_pct === null
        ? 0
        : Math.max(-15, Math.min(15, input.executive.trends.contact_rate.delta_pct / 2))),
  );
  const conversion = scoreConversion(input.conversion);
  const previousConversion = scoreConversion(input.previousConversion);
  const authority = scoreAuthority(input.practitioners, input.services);
  const accessibility = scoreAccessibility(input.readiness, colourAudit);

  const domains: PlatformHealthSubscore[] = [
    {
      id: "search",
      label: PLATFORM_HEALTH_DOMAIN_LABEL.search,
      score: search.score,
      state: stateFromScore(search.score),
      weight: PLATFORM_HEALTH_WEIGHTS.search,
      summary: search.summary,
      trend: buildTrend(search.score, previousSearch.score),
    },
    {
      id: "digital_reception",
      label: PLATFORM_HEALTH_DOMAIN_LABEL.digital_reception,
      score: dr.score,
      state: stateFromScore(dr.score),
      weight: PLATFORM_HEALTH_WEIGHTS.digital_reception,
      summary: dr.summary,
      trend: buildTrend(dr.score, previousDr.score),
    },
    {
      id: "governance",
      label: PLATFORM_HEALTH_DOMAIN_LABEL.governance,
      score: governance.score,
      state: stateFromScore(governance.score),
      weight: PLATFORM_HEALTH_WEIGHTS.governance,
      summary: governance.summary,
      // Governance is point-in-time; flat unless totals imply risk (use score vs 90 as prior baseline).
      trend: buildTrend(governance.score, Math.min(100, governance.score + (input.governance?.totals.expired ? 8 : 0))),
    },
    {
      id: "analytics",
      label: PLATFORM_HEALTH_DOMAIN_LABEL.analytics,
      score: analytics.score,
      state: stateFromScore(analytics.score),
      weight: PLATFORM_HEALTH_WEIGHTS.analytics,
      summary: analytics.summary,
      trend: buildTrend(analytics.score, analyticsPrevious),
    },
    {
      id: "conversion",
      label: PLATFORM_HEALTH_DOMAIN_LABEL.conversion,
      score: conversion.score,
      state: stateFromScore(conversion.score),
      weight: PLATFORM_HEALTH_WEIGHTS.conversion,
      summary: conversion.summary,
      trend: buildTrend(conversion.score, previousConversion.score),
    },
    {
      id: "authority",
      label: PLATFORM_HEALTH_DOMAIN_LABEL.authority,
      score: authority.score,
      state: stateFromScore(authority.score),
      weight: PLATFORM_HEALTH_WEIGHTS.authority,
      summary: authority.summary,
      trend: buildTrend(authority.score, authority.score),
    },
    {
      id: "accessibility",
      label: PLATFORM_HEALTH_DOMAIN_LABEL.accessibility,
      score: accessibility.score,
      state: stateFromScore(accessibility.score),
      weight: PLATFORM_HEALTH_WEIGHTS.accessibility,
      summary: accessibility.summary,
      trend: buildTrend(accessibility.score, accessibility.score),
    },
  ];

  const overall = clampScore(
    domains.reduce((sum, domain) => sum + domain.score * domain.weight, 0),
  );
  const previousOverall = clampScore(
    domains.reduce((sum, domain) => sum + domain.trend.previous * domain.weight, 0),
  );

  return {
    overall_score: overall,
    overall_state: stateFromScore(overall),
    overall_trend: buildTrend(overall, previousOverall),
    domains,
    generated_at: new Date().toISOString(),
  };
}
