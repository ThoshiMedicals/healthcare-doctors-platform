import type { PracticeConversionIntelligenceReport } from "@/measurement/conversion-intelligence-report";
import type {
  DailySeriesPoint,
  MetricTrend,
  PracticeExecutiveDashboard,
} from "@/measurement/executive-report";
import type {
  PracticeDigitalReceptionDashboard,
  ResolutionBand,
} from "@/measurement/digital-reception-report";
import type { PracticeGovernanceManagementReport } from "@/governance/management-report";
import type { PracticePractitionerAuthorityDashboard } from "@/measurement/practitioner-authority-report";
import {
  buildPlatformHealthScorecard,
  type PlatformHealthScorecard,
} from "@/measurement/platform-health-score";
import type { PracticeServiceAuthorityDashboard } from "@/measurement/service-authority-report";
import type { ExecutiveRange } from "@/measurement/ranges";
import {
  getPlatformReadinessScorecard,
  isClearToShip,
  type PlatformReadinessScorecard,
} from "@/readiness/platform-readiness";

/** Practice-manager facing health band for the /admin command centre. */
export type CommandCentreHealthState = "healthy" | "watch" | "needs_attention";

export type CommandCentreAlertSource = "governance" | "digital_reception" | "conversion";

export type CommandCentreAlert = {
  id: string;
  source: CommandCentreAlertSource;
  state: CommandCentreHealthState;
  title: string;
  detail: string;
  href: string;
  count: number;
};

export type CommandCentreTopEntity = {
  key: string;
  count: number;
};

export type CommandCentreSearchIntent = {
  key: string;
  searches: number;
  resolution_rate: number | null;
  resolution_band: ResolutionBand;
};

export type CommandCentreSnapshot = {
  range: ExecutiveRange;
  range_label: string;
  start: string;
  end: string;
  website_health_score: number;
  website_health_state: CommandCentreHealthState;
  /** Unified C7 platform-health scorecard (overall + domain subscores + trends). */
  platform_health: PlatformHealthScorecard;
  launch_readiness_score: number;
  launch_readiness_state: CommandCentreHealthState;
  launch_clear_to_ship: boolean;
  launch_summary: string;
  contact_rate: number | null;
  contact_rate_trend: MetricTrend;
  booking_clicks: number;
  booking_trend: MetricTrend;
  clinic_calls: number;
  call_trend: MetricTrend;
  series: DailySeriesPoint[];
  top_search_intents: CommandCentreSearchIntent[];
  top_practitioner: CommandCentreTopEntity | null;
  top_service: CommandCentreTopEntity | null;
  alerts: {
    governance: CommandCentreAlert[];
    digital_reception: CommandCentreAlert[];
    conversion: CommandCentreAlert[];
  };
  alert_counts: {
    governance: number;
    digital_reception: number;
    conversion: number;
    total: number;
  };
};

export const COMMAND_CENTRE_HEALTH_LABEL: Record<CommandCentreHealthState, string> = {
  healthy: "Healthy",
  watch: "Needs Watch",
  needs_attention: "Needs Attention",
};

/** Map health state → semantic dashboard tone (good / warn / bad). */
export function healthStateTone(state: CommandCentreHealthState): "good" | "warn" | "bad" {
  if (state === "healthy") return "good";
  if (state === "watch") return "warn";
  return "bad";
}

function stateFromScore(
  score: number,
  forceNeedsAttention: boolean,
  forceWatch: boolean,
): CommandCentreHealthState {
  if (forceNeedsAttention || score < 70) return "needs_attention";
  if (forceWatch || score < 85) return "watch";
  return "healthy";
}

function launchState(card: PlatformReadinessScorecard): CommandCentreHealthState {
  if (card.issueCounts.critical > 0 || card.issueCounts.high > 0 || card.productionReadinessScore < 70) {
    return "needs_attention";
  }
  if (!isClearToShip(card) || card.issueCounts.medium > 0 || card.productionReadinessScore < 85) {
    return "watch";
  }
  return "healthy";
}

function emptyTrend(): MetricTrend {
  return { current: 0, previous: 0, delta: 0, delta_pct: null, direction: "flat" };
}

/**
 * Compose /admin operational command centre snapshot from existing dashboards.
 * Fail-soft: missing governance/conversion/DR still yields a usable strip.
 */
export function buildCommandCentreSnapshot(input: {
  executive: PracticeExecutiveDashboard;
  digitalReception?: PracticeDigitalReceptionDashboard | null;
  previousDigitalReception?: PracticeDigitalReceptionDashboard | null;
  conversion?: PracticeConversionIntelligenceReport | null;
  previousConversion?: PracticeConversionIntelligenceReport | null;
  practitioners?: PracticePractitionerAuthorityDashboard | null;
  services?: PracticeServiceAuthorityDashboard | null;
  governance?: Pick<PracticeGovernanceManagementReport, "totals"> | null;
  readiness?: PlatformReadinessScorecard;
  accessibilityAuditScore?: number;
  links: {
    executive: string;
    digitalReception: string;
    conversion: string;
    governanceAwaiting: string;
    governanceDueSoon: string;
    governanceExpired: string;
    governanceOwnership: string;
  };
}): CommandCentreSnapshot {
  const executive = input.executive;
  const dr = input.digitalReception ?? null;
  const conversion = input.conversion ?? null;
  const gov = input.governance?.totals ?? null;
  const readiness = input.readiness ?? getPlatformReadinessScorecard();
  const links = input.links;

  const contact = executive.rates.find((rate) => rate.key === "contact_rate") ?? null;

  const governanceAlerts: CommandCentreAlert[] = [];
  if (gov) {
    if (gov.expired > 0) {
      governanceAlerts.push({
        id: "gov-expired",
        source: "governance",
        state: "needs_attention",
        title: "Expired reviews",
        detail: `${gov.expired} page${gov.expired === 1 ? "" : "s"} past next-review date`,
        href: links.governanceExpired,
        count: gov.expired,
      });
    }
    if (gov.missing_ownership > 0) {
      governanceAlerts.push({
        id: "gov-ownership",
        source: "governance",
        state: "needs_attention",
        title: "Missing Owner",
        detail: `${gov.missing_ownership} page${gov.missing_ownership === 1 ? "" : "s"} without a content owner`,
        href: links.governanceOwnership,
        count: gov.missing_ownership,
      });
    }
    if (gov.awaiting_review > 0) {
      governanceAlerts.push({
        id: "gov-awaiting",
        source: "governance",
        state: "watch",
        title: "Awaiting review",
        detail: `${gov.awaiting_review} item${gov.awaiting_review === 1 ? "" : "s"} in the review queue`,
        href: links.governanceAwaiting,
        count: gov.awaiting_review,
      });
    }
    if (gov.due_within_60_days > 0) {
      governanceAlerts.push({
        id: "gov-due-soon",
        source: "governance",
        state: "watch",
        title: "Due within 60 days",
        detail: `${gov.due_within_60_days} review${gov.due_within_60_days === 1 ? "" : "s"} approaching`,
        href: links.governanceDueSoon,
        count: gov.due_within_60_days,
      });
    }
  }

  const digitalReceptionAlerts: CommandCentreAlert[] = [];
  if (dr) {
    if (dr.kpis.resolution_band === "red") {
      digitalReceptionAlerts.push({
        id: "dr-resolution-red",
        source: "digital_reception",
        state: "needs_attention",
        title: "Search resolution at risk",
        detail: `Resolution rate ${dr.kpis.resolution_rate ?? "—"}% (below 50%)`,
        href: links.digitalReception,
        count: 1,
      });
    } else if (dr.kpis.resolution_band === "amber") {
      digitalReceptionAlerts.push({
        id: "dr-resolution-amber",
        source: "digital_reception",
        state: "watch",
        title: "Search resolution needs watch",
        detail: `Resolution rate ${dr.kpis.resolution_rate ?? "—"}% (50–69%)`,
        href: links.digitalReception,
        count: 1,
      });
    }
    if (dr.flagged_intents.length > 0) {
      digitalReceptionAlerts.push({
        id: "dr-flagged",
        source: "digital_reception",
        state: "watch",
        title: "Flagged search intents",
        detail: `${dr.flagged_intents.length} high-volume intent${dr.flagged_intents.length === 1 ? "" : "s"} resolving poorly`,
        href: links.digitalReception,
        count: dr.flagged_intents.length,
      });
    }
    const watchAtRisk = dr.watchlist.filter((row) => row.resolution_band === "red").length;
    if (watchAtRisk > 0) {
      digitalReceptionAlerts.push({
        id: "dr-watchlist-red",
        source: "digital_reception",
        state: "needs_attention",
        title: "Watchlist intents at risk",
        detail: `${watchAtRisk} priority intent${watchAtRisk === 1 ? "" : "s"} below 50% resolution`,
        href: links.digitalReception,
        count: watchAtRisk,
      });
    }
  }

  const conversionAlerts: CommandCentreAlert[] = [];
  if (conversion) {
    const bottleneck = conversion.funnel.find((step) => step.bottleneck);
    if (bottleneck) {
      conversionAlerts.push({
        id: "ci-bottleneck",
        source: "conversion",
        state: "watch",
        title: `Funnel bottleneck · ${bottleneck.label}`,
        detail:
          bottleneck.drop_from_previous === null
            ? "Largest relative drop in the patient journey"
            : `${bottleneck.drop_from_previous}% drop from the previous step`,
        href: links.conversion,
        count: 1,
      });
    }
    const opportunityCount =
      conversion.opportunities.weak_booking_paths.length +
      conversion.opportunities.weak_service_journeys.length +
      conversion.opportunities.weak_practitioner_journeys.length;
    if (opportunityCount > 0) {
      conversionAlerts.push({
        id: "ci-opportunities",
        source: "conversion",
        state: opportunityCount >= 5 ? "needs_attention" : "watch",
        title: "Weak conversion paths",
        detail: `${opportunityCount} booking / service / practitioner path${opportunityCount === 1 ? "" : "s"} converting at ≤25%`,
        href: links.conversion,
        count: opportunityCount,
      });
    }
  }

  const platform_health = buildPlatformHealthScorecard({
    executive,
    digitalReception: dr,
    previousDigitalReception: input.previousDigitalReception,
    conversion,
    previousConversion: input.previousConversion,
    practitioners: input.practitioners,
    services: input.services,
    governance: gov ? { totals: gov } : null,
    readiness,
    accessibilityAuditScore: input.accessibilityAuditScore,
  });

  const forceNeedsAttention =
    governanceAlerts.some((alert) => alert.state === "needs_attention") ||
    digitalReceptionAlerts.some((alert) => alert.state === "needs_attention") ||
    conversionAlerts.some((alert) => alert.state === "needs_attention") ||
    readiness.issueCounts.critical > 0 ||
    readiness.issueCounts.high > 0 ||
    platform_health.overall_state === "needs_attention";

  const forceWatch =
    governanceAlerts.length > 0 ||
    digitalReceptionAlerts.length > 0 ||
    conversionAlerts.length > 0 ||
    !isClearToShip(readiness) ||
    platform_health.overall_state === "watch";

  const website_health_score = platform_health.overall_score;
  const website_health_state = stateFromScore(website_health_score, forceNeedsAttention, forceWatch);
  const launch_readiness_state = launchState(readiness);

  const top_search_intents: CommandCentreSearchIntent[] = (dr?.top_intent_buckets ?? [])
    .slice(0, 5)
    .map((row) => ({
      key: row.intent_bucket,
      searches: row.searches,
      resolution_rate: row.resolution_rate,
      resolution_band: row.resolution_band,
    }));

  const alert_counts = {
    governance: governanceAlerts.reduce((sum, alert) => sum + alert.count, 0),
    digital_reception: digitalReceptionAlerts.reduce((sum, alert) => sum + alert.count, 0),
    conversion: conversionAlerts.reduce((sum, alert) => sum + alert.count, 0),
    total: 0,
  };
  alert_counts.total =
    alert_counts.governance + alert_counts.digital_reception + alert_counts.conversion;

  return {
    range: executive.range,
    range_label: executive.range_label,
    start: executive.start,
    end: executive.end,
    website_health_score,
    website_health_state,
    platform_health,
    launch_readiness_score: readiness.productionReadinessScore,
    launch_readiness_state,
    launch_clear_to_ship: isClearToShip(readiness),
    launch_summary: readiness.goLiveSummary,
    contact_rate: contact?.value ?? null,
    contact_rate_trend: contact?.trend ?? executive.trends.contact_rate ?? emptyTrend(),
    booking_clicks: executive.kpis.booking_clicks,
    booking_trend: executive.trends.booking_clicks,
    clinic_calls: executive.kpis.clinic_calls,
    call_trend: executive.trends.clinic_calls,
    series: executive.series,
    top_search_intents,
    top_practitioner: executive.top_practitioners[0]
      ? { key: executive.top_practitioners[0].key, count: executive.top_practitioners[0].count }
      : null,
    top_service: executive.top_services[0]
      ? { key: executive.top_services[0].key, count: executive.top_services[0].count }
      : null,
    alerts: {
      governance: governanceAlerts,
      digital_reception: digitalReceptionAlerts,
      conversion: conversionAlerts,
    },
    alert_counts,
  };
}
