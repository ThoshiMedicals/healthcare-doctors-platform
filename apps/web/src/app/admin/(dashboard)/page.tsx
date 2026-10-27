import Link from "next/link";
import type { ReactNode } from "react";
import { ROLE_LABEL, roleAllows } from "@/auth/permissions";
import { editorContext } from "@/cms/context";
import { prisma } from "@/db/prisma";
import { buildPracticeGovernanceManagementReport } from "@/governance/management-report";
import {
  buildCommandCentreSnapshot,
  COMMAND_CENTRE_HEALTH_LABEL,
  healthStateTone,
  type CommandCentreAlert,
  type CommandCentreHealthState,
  type CommandCentreSnapshot,
} from "@/measurement/command-centre-report";
import { buildPracticeConversionIntelligenceReport } from "@/measurement/conversion-intelligence-report";
import {
  buildPracticeDigitalReceptionDashboard,
  type ResolutionBand,
} from "@/measurement/digital-reception-report";
import { resolveGovernanceDataset } from "@/measurement/demo/load-governance-dataset";
import {
  buildPracticeExecutiveDashboard,
  executiveRangeOptions,
  resolvePreviousExecutiveRange,
} from "@/measurement/executive-report";
import { parseInsightsDataMode } from "@/measurement/insights-data-mode";
import { buildPracticePractitionerAuthorityDashboardFromIndex } from "@/measurement/practitioner-authority-report";
import { isExecutiveRange, type ExecutiveRange } from "@/measurement/ranges";
import { buildRecommendedActions, type RecommendedAction } from "@/measurement/recommended-actions";
import { buildPracticeServiceAuthorityDashboardFromIndex } from "@/measurement/service-authority-report";
import { PLATFORM_HEALTH_STATE_LABEL } from "@/measurement/platform-health-score";
import { getPlatformReadinessScorecard } from "@/readiness/platform-readiness";
import { RecommendedActionsPanel } from "./recommended-actions-panel";
import {
  COLOUR_ACCESSIBILITY_AUDIT,
  DashboardCard,
  DashboardHeader,
  DashboardMeta,
  DataModeBanner,
  DataModeSwitcher,
  EmptyState,
  GaugeMeter,
  HealthBandExplanationPanel,
  HealthStatusLegend,
  HowToReadDashboard,
  InsightsFilterSync,
  InsightsNav,
  LineChart,
  MetricTile,
  PlatformHealthLegend,
  RangeTabs,
  RankingGrid,
  SectionShell,
  StatusBadge,
  TrendIndicator,
  conversionIntelligenceHref,
  digitalReceptionHref,
  executiveHref,
  formatCount,
  formatDashboardLabel,
  formatRate,
  getMetricGuide,
  governanceExpiryHref,
  governanceManagementHref,
  governanceReviewHref,
  KpiTargets,
  intentInvestigationHref,
  platformHealthDomainCta,
  platformHealthDomainHref,
  practitionerAuthorityHref,
  serviceAuthorityHref,
  withInsightsQuery,
  withInvestigationSource,
  type InsightsFilters,
} from "./dashboard-ui";
import { resolveInsightsDashboardData } from "./dashboard-ui/resolve-insights-data";
import { resolveInsightsFilters } from "./dashboard-ui/resolve-insights-filters";
import {
  insightsHomeLayout,
  resolveInsightsPersona,
  type AlertPanelId,
  type CommandCentreSectionId,
  type HealthCardId,
  type InsightsHomeLayout,
  type LeaderCardId,
  type TrendKpiId,
} from "./insights-persona";

export const dynamic = "force-dynamic";

function bandTone(band: ResolutionBand): "good" | "warn" | "bad" | "neutral" {
  if (band === "green") return "good";
  if (band === "amber") return "warn";
  if (band === "red") return "bad";
  return "neutral";
}

function AlertList({
  title,
  href,
  hrefLabel,
  alerts,
  empty,
}: {
  title: string;
  href: string;
  hrefLabel: string;
  alerts: CommandCentreAlert[];
  empty: string;
}) {
  return (
    <DashboardCard tone={alerts.some((a) => a.state === "needs_attention") ? "bad" : alerts.length ? "warn" : "good"}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            {alerts.length === 0 ? "No open alerts" : `${alerts.length} open signal${alerts.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <StatusBadge
          label={
            alerts.some((a) => a.state === "needs_attention")
              ? COMMAND_CENTRE_HEALTH_LABEL.needs_attention
              : alerts.length
                ? COMMAND_CENTRE_HEALTH_LABEL.watch
                : COMMAND_CENTRE_HEALTH_LABEL.healthy
          }
          tone={
            alerts.some((a) => a.state === "needs_attention")
              ? "bad"
              : alerts.length
                ? "warn"
                : "good"
          }
          count={alerts.reduce((sum, alert) => sum + alert.count, 0) || undefined}
        />
      </div>
      {alerts.length === 0 ? (
        <EmptyState title="All clear" message={empty} className="mt-4 py-5" />
      ) : (
        <ul className="mt-4 space-y-3">
          {alerts.map((alert) => (
            <li key={alert.id} className="rounded border border-slate-200 bg-slate-50 px-3 py-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link href={alert.href} className="text-sm font-medium text-slate-900 underline-offset-2 hover:underline">
                  {alert.title}
                </Link>
                <StatusBadge label={COMMAND_CENTRE_HEALTH_LABEL[alert.state]} tone={healthStateTone(alert.state)} />
              </div>
              <p className="mt-1 text-xs text-slate-600">{alert.detail}</p>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-xs font-medium text-slate-700">
        <Link href={href} className="underline-offset-2 hover:underline">
          {hrefLabel} →
        </Link>
      </p>
    </DashboardCard>
  );
}

function healthHint(state: CommandCentreHealthState, score: number): string {
  if (state === "needs_attention") {
    return `Score ${score} — Needs Attention. Open domain tiles below to investigate.`;
  }
  if (state === "watch") {
    return `Score ${score} — Needs Watch. Click a soft domain to investigate before it escalates.`;
  }
  return `Score ${score} — Healthy. Domain tiles stay available for spot checks.`;
}

function orderItems<T extends string>(order: T[], renderers: Record<T, () => ReactNode>): ReactNode[] {
  return order.map((id) => <div key={id}>{renderers[id]()}</div>);
}

function HealthSection({
  layout,
  snapshot,
  filters,
}: {
  layout: InsightsHomeLayout;
  snapshot: CommandCentreSnapshot;
  filters: InsightsFilters;
}) {
  const health = snapshot.platform_health;
  const healthTone = healthStateTone(snapshot.website_health_state);
  const launchTone = healthStateTone(snapshot.launch_readiness_state);
  const overview = KpiTargets.executiveOverview(filters);
  const cards: Record<HealthCardId, () => ReactNode> = {
    website_health: () => (
      <div className="space-y-3 sm:col-span-2">
        <div className="grid gap-3 sm:grid-cols-2">
          <GaugeMeter
            label="Overall Health Score"
            valueLabel={String(health.overall_score)}
            percent={health.overall_score}
            tone={healthTone}
            hint={healthHint(snapshot.website_health_state, health.overall_score)}
            badge={
              <div className="flex flex-wrap items-center gap-1.5">
                <StatusBadge
                  label={PLATFORM_HEALTH_STATE_LABEL[health.overall_state]}
                  tone={healthTone}
                />
                <TrendIndicator trend={health.overall_trend} />
              </div>
            }
            href={overview.href}
            hrefLabel={overview.label}
          />
          <DashboardCard tone={launchTone}>
            <div className="flex items-start justify-between gap-3">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Launch Readiness Score</p>
              <div className="flex flex-wrap items-center gap-1.5">
                <StatusBadge label="Informational" tone="neutral" />
                <StatusBadge
                  label={COMMAND_CENTRE_HEALTH_LABEL[snapshot.launch_readiness_state]}
                  tone={launchTone}
                />
              </div>
            </div>
            <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums text-slate-900">
              {snapshot.launch_readiness_score}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {snapshot.launch_clear_to_ship ? "Clear to ship" : "Not clear to ship"} · platform audit
            </p>
            <p className="mt-3 line-clamp-3 text-xs leading-5 text-slate-600">{snapshot.launch_summary}</p>
            <p className="mt-2 text-[11px] leading-4 text-slate-400">
              Informational · readiness audit summary — not a patient workflow queue
            </p>
          </DashboardCard>
        </div>
        <HealthBandExplanationPanel />
        <DashboardCard>
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Domain subscores</h3>
              <p className="mt-0.5 text-xs text-slate-500">
                Click a domain to open its dashboard in focus mode
              </p>
            </div>
            <TrendIndicator trend={health.overall_trend} />
          </div>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {health.domains.map((domain) => {
              const tone = healthStateTone(domain.state);
              const href = platformHealthDomainHref(domain.id, filters, {
                authorityNeedsWork: domain.state !== "healthy",
              });
              return (
                <li key={domain.id}>
                  <Link
                    href={href}
                    className="block rounded border border-slate-200 bg-slate-50 px-3 py-2 transition hover:border-slate-400 hover:bg-white hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                    aria-label={`${domain.label}: ${domain.score}, ${PLATFORM_HEALTH_STATE_LABEL[domain.state]}. ${platformHealthDomainCta(domain.id)}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{domain.label}</p>
                      <TrendIndicator trend={domain.trend} />
                    </div>
                    <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{domain.score}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <StatusBadge label={PLATFORM_HEALTH_STATE_LABEL[domain.state]} tone={tone} />
                      <span className="text-[11px] tabular-nums text-slate-400">
                        {(domain.weight * 100).toFixed(0)}% weight
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-4 text-slate-600">{domain.summary}</p>
                    <p className="mt-2 text-xs font-medium text-slate-700">
                      {platformHealthDomainCta(domain.id)} →
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </DashboardCard>
      </div>
    ),
    launch_readiness: () => null,
  };

  const ordered = layout.healthCards.filter((id) => id === "website_health" || id === "launch_readiness");
  // Overall card already embeds launch readiness when website_health is present.
  const showEmbedded = ordered.includes("website_health");

  return (
    <SectionShell
      id="cc-health"
      title="Practice health"
      description={`${getMetricGuide("command-centre", "overall_health")!.target}. Click a domain score to investigate.`}
    >
      {showEmbedded ? (
        <div className="grid gap-3">{cards.website_health()}</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">{orderItems(ordered, cards)}</div>
      )}
    </SectionShell>
  );
}

function TrendsSection({
  layout,
  snapshot,
  filters,
}: {
  layout: InsightsHomeLayout;
  snapshot: CommandCentreSnapshot;
  filters: InsightsFilters;
}) {
  const booking = KpiTargets.bookingJourney(filters);
  const calls = KpiTargets.bookingJourney(filters, "ci-funnel");
  const contact = KpiTargets.executiveOverview(filters, "exec-performance");
  const tiles: Record<TrendKpiId, () => ReactNode> = {
    booking: () => (
      <MetricTile
        label="Booking trend"
        value={formatCount(snapshot.booking_clicks)}
        hint="Booking clicks in range"
        trend={snapshot.booking_trend}
        href={booking.href}
        hrefLabel={booking.label}
      />
    ),
    call: () => (
      <MetricTile
        label="Call trend"
        value={formatCount(snapshot.clinic_calls)}
        hint="Clinic call clicks in range"
        trend={snapshot.call_trend}
        href={calls.href}
        hrefLabel="Investigate call & booking journey"
      />
    ),
    contact: () => (
      <MetricTile
        label="Contact rate"
        value={formatRate(snapshot.contact_rate)}
        hint="Share of visits that booked or called"
        trend={snapshot.contact_rate_trend}
        href={contact.href}
        hrefLabel={contact.label}
      />
    ),
  };

  const showBookingChart = layout.trendKpis.includes("booking");
  const showCallChart = layout.trendKpis.includes("call");

  return (
    <SectionShell
      id="cc-trends"
      title="Demand trends"
      description="Booking, clinic call, and contact rate movement versus the previous period."
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{orderItems(layout.trendKpis, tiles)}</div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {showBookingChart ? (
          <LineChart
            title="Booking Trend"
            hint="Daily booking clicks"
            points={snapshot.series.map((point) => ({ date: point.date, value: point.booking_clicks }))}
            empty="No booking series in this range."
          />
        ) : null}
        {showCallChart ? (
          <LineChart
            title="Call Trend"
            hint="Daily clinic call clicks"
            points={snapshot.series.map((point) => ({ date: point.date, value: point.call_clicks }))}
            empty="No call series in this range."
          />
        ) : null}
        {!showBookingChart && layout.trendKpis[0] === "contact" ? (
          <LineChart
            title="Contact Rate"
            hint="Daily contact rate %"
            points={snapshot.series.map((point) => ({
              date: point.date,
              value: point.contact_rate ?? 0,
            }))}
            formatValue={(value) => `${value.toFixed(1)}%`}
            empty="No contact-rate series in this range."
          />
        ) : null}
      </div>
    </SectionShell>
  );
}

function LeadersSection({
  layout,
  snapshot,
  range,
  filters,
}: {
  layout: InsightsHomeLayout;
  snapshot: CommandCentreSnapshot;
  range: ExecutiveRange;
  filters: InsightsFilters;
}) {
  const searchIssues = KpiTargets.searchQuality(filters);
  const cards: Record<LeaderCardId, () => ReactNode> = {
    search_intents: () => (
      <DashboardCard>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Top search topics</h3>
            <p className="mt-0.5 text-xs text-slate-500">What patients searched for online</p>
          </div>
          <Link
            href={searchIssues.href}
            className="text-xs font-medium text-slate-700 underline-offset-2 hover:underline"
          >
            {searchIssues.label} →
          </Link>
        </div>
        {snapshot.top_search_intents.length === 0 ? (
          <EmptyState title="No searches" message="No Digital Reception intents in this range." className="mt-4 py-5" />
        ) : (
          <ol className="mt-4 space-y-2">
            {snapshot.top_search_intents.map((intent, index) => (
              <li key={intent.key}>
                <Link
                  href={intentInvestigationHref(intent.key, filters)}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                  aria-label={`${formatDashboardLabel(intent.key)}: ${intent.searches} searches. Open intent details`}
                >
                  <span className="min-w-0">
                    <span className="mr-2 text-slate-400">{index + 1}.</span>
                    <span className="font-medium text-slate-800 underline-offset-2 hover:underline">
                      {formatDashboardLabel(intent.key)}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    <StatusBadge
                      label={
                        intent.resolution_band === "green"
                          ? "Healthy"
                          : intent.resolution_band === "amber"
                            ? "Needs Watch"
                            : intent.resolution_band === "red"
                              ? "Needs Attention"
                              : "—"
                      }
                      tone={bandTone(intent.resolution_band)}
                      dot
                    />
                    <span className="tabular-nums text-slate-600">{formatCount(intent.searches)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </DashboardCard>
    ),
    top_practitioner: () => (
      <MetricTile
        label="Top doctor page"
        value={
          snapshot.top_practitioner ? formatDashboardLabel(snapshot.top_practitioner.key) : "—"
        }
        hint={
          snapshot.top_practitioner
            ? `${formatCount(snapshot.top_practitioner.count)} attributed views`
            : "No practitioner traffic in range"
        }
        href={
          snapshot.top_practitioner
            ? practitionerAuthorityHref({
                range,
                focus: snapshot.top_practitioner.key,
                filters,
              })
            : practitionerAuthorityHref({ range, filters })
        }
        hrefLabel="Open doctor profile workflow"
      />
    ),
    top_service: () => (
      <MetricTile
        label="Top service page"
        value={snapshot.top_service ? formatDashboardLabel(snapshot.top_service.key) : "—"}
        hint={
          snapshot.top_service
            ? `${formatCount(snapshot.top_service.count)} attributed views`
            : "No service traffic in range"
        }
        href={
          snapshot.top_service
            ? serviceAuthorityHref({ range, focus: snapshot.top_service.key, filters })
            : serviceAuthorityHref({ range, filters })
        }
        hrefLabel="Open service page workflow"
      />
    ),
  };

  return (
    <SectionShell
      id="cc-leaders"
      title="What patients are finding"
      description="Top Digital Reception intents and the strongest practitioner / service pages."
    >
      <RankingGrid columns={3}>{orderItems(layout.leaderCards, cards)}</RankingGrid>
    </SectionShell>
  );
}

function AlertsSection({
  layout,
  snapshot,
  filters,
  canGovernance,
}: {
  layout: InsightsHomeLayout;
  snapshot: CommandCentreSnapshot;
  filters: InsightsFilters;
  canGovernance: boolean;
}) {
  const govBoard = KpiTargets.governanceBoard(filters);
  const searchAlerts = KpiTargets.searchQuality(filters);
  const bookingAlerts = KpiTargets.bookingOpportunities(filters);
  const panels: Record<AlertPanelId, () => ReactNode> = {
    governance: () => (
      <AlertList
        title="Governance alerts"
        href={govBoard.href}
        hrefLabel={govBoard.label}
        alerts={canGovernance ? snapshot.alerts.governance : []}
        empty={
          canGovernance
            ? "No expired, due-soon, ownership, or review-queue issues."
            : "Governance queues require clinical sign-off access."
        }
      />
    ),
    digital_reception: () => (
      <AlertList
        title="Search alerts"
        href={searchAlerts.href}
        hrefLabel={searchAlerts.label}
        alerts={snapshot.alerts.digital_reception}
        empty="Resolution and watchlist intents are within healthy bands."
      />
    ),
    conversion: () => (
      <AlertList
        title="Booking journey alerts"
        href={bookingAlerts.href}
        hrefLabel={bookingAlerts.label}
        alerts={snapshot.alerts.conversion}
        empty="No funnel bottlenecks or weak conversion paths flagged."
      />
    ),
  };

  return (
    <SectionShell
      id="cc-alerts"
      title="Needs attention"
      description="Governance, Digital Reception, and conversion signals — jump straight into the source queue."
    >
      <RankingGrid columns={3}>{orderItems(layout.alertPanels, panels)}</RankingGrid>
    </SectionShell>
  );
}

export default async function AdminCommandCentrePage({
  searchParams,
}: {
  searchParams?: Promise<{ range?: string; persona?: string; data?: string }>;
}) {
  const { clinic, role } = await editorContext();
  const params = searchParams ? await searchParams : {};
  const baseFilters = await resolveInsightsFilters(params, "/admin");
  const range: ExecutiveRange =
    baseFilters.range && isExecutiveRange(baseFilters.range) ? baseFilters.range : "last_7";
  const { mode, filters: active, loaded } = await resolveInsightsDashboardData({
    ...baseFilters,
    range,
  });
  const persona = resolveInsightsPersona(role, params.persona);
  const layout = insightsHomeLayout(persona);

  const canInsights = role ? roleAllows(role, "manage_settings") : false;
  const canGovernance = role ? roleAllows(role, "clinical_signoff") : false;

  if (!canInsights) {
    return (
      <main>
        <DashboardHeader
          title="Clinic admin"
          description="Content editing stays on the approved Woolloongabba HTML. Insights command centre is available to clinic admins."
          meta={
            <>
              {clinic?.practiceName ?? "No clinic assigned"}
              {role ? ` · ${ROLE_LABEL[role]}` : null}
            </>
          }
        />
        <EmptyState
          className="mt-8"
          title="Insights require clinic admin"
          message="Open Pages to edit content, or ask a clinic admin for the operational command centre."
          action={
            <Link href="/admin/pages" className="text-sm font-medium text-slate-800 underline underline-offset-2">
              Go to Pages →
            </Link>
          }
        />
      </main>
    );
  }

  const now = new Date();
  const previousWindow = resolvePreviousExecutiveRange(range, now);
  const previousNow = new Date(`${previousWindow.end}T12:00:00.000Z`);
  const executive = buildPracticeExecutiveDashboard(loaded.events, range, now);
  const digitalReception = buildPracticeDigitalReceptionDashboard(loaded.events, range, now);
  const previousDigitalReception = buildPracticeDigitalReceptionDashboard(
    loaded.events,
    range,
    previousNow,
  );
  const conversion = buildPracticeConversionIntelligenceReport(loaded.events, range, now);
  const previousConversion = buildPracticeConversionIntelligenceReport(
    loaded.events,
    range,
    previousNow,
  );
  const [practitioners, services] = await Promise.all([
    buildPracticePractitionerAuthorityDashboardFromIndex(loaded.events, range, now),
    buildPracticeServiceAuthorityDashboardFromIndex(loaded.events, range, now),
  ]);

  let governanceReport = null;
  let governanceFeedLabel: string | null = null;
  if (canGovernance && clinic) {
    const liveRows = await prisma.clinicalReview.findMany({
      where: { clinicId: clinic.id },
      include: { page: { select: { path: true, title: true } } },
    });
    const govMode =
      parseInsightsDataMode(active.data) ?? (liveRows.length > 0 ? "live" : "demo");
    const dataset = resolveGovernanceDataset(govMode, liveRows, now);
    governanceReport = buildPracticeGovernanceManagementReport(dataset.rows, 60);
    governanceFeedLabel = dataset.feedLabel;
  }

  const snapshot = buildCommandCentreSnapshot({
    executive,
    digitalReception,
    previousDigitalReception,
    conversion,
    previousConversion,
    practitioners,
    services,
    governance: governanceReport ? { totals: governanceReport.totals } : null,
    readiness: getPlatformReadinessScorecard(),
    accessibilityAuditScore: COLOUR_ACCESSIBILITY_AUDIT.score,
    links: {
      executive: executiveHref(active),
      digitalReception: digitalReceptionHref(active),
      conversion: conversionIntelligenceHref(active),
      governanceAwaiting: governanceManagementHref({ queue: "awaiting_review", filters: active }),
      governanceDueSoon: governanceManagementHref({ queue: "due_soon", filters: active }),
      governanceExpired: governanceManagementHref({ queue: "expired", filters: active }),
      governanceOwnership: governanceManagementHref({ queue: "missing_ownership", filters: active }),
    },
  });

  const recommendedActions: RecommendedAction[] = buildRecommendedActions({
    digitalReception,
    services,
    practitioners,
    governance: governanceReport
      ? {
          totals: governanceReport.totals,
          pages_due_within_60_days: governanceReport.pages_due_within_60_days,
          pages_expired: governanceReport.pages_expired,
        }
      : null,
    links: {
      digitalReceptionIntent: (intent) =>
        withInsightsQuery("/admin/digital-reception", { ...active, intent }, {
          hash: `intent-${intent}`,
          navigationIntent: "investigation",
          focusKeys: ["intent"],
        }),
      digitalReceptionIntentInvestigation: (intent) =>
        withInsightsQuery(
          "/admin/digital-reception",
          withInvestigationSource({ ...active, intent }, "recommendation"),
          {
            hash: `intent-${intent}`,
            navigationIntent: "investigation",
            focusKeys: ["intent"],
          },
        ),
      serviceAuthority: (slug) =>
        serviceAuthorityHref({
          range,
          focus: slug,
          filters: { ...active, service: slug },
        }),
      serviceAuthorityInvestigation: (slug) =>
        serviceAuthorityHref({
          range,
          focus: slug,
          filters: withInvestigationSource({ ...active, service: slug }, "recommendation"),
        }),
      practitionerAuthority: (slug) =>
        practitionerAuthorityHref({
          range,
          focus: slug,
          filters: { ...active, practitioner: slug },
        }),
      practitionerAuthorityInvestigation: (slug) =>
        practitionerAuthorityHref({
          range,
          focus: slug,
          filters: withInvestigationSource({ ...active, practitioner: slug }, "recommendation"),
        }),
      conversionService: (slug) =>
        conversionIntelligenceHref(
          withInvestigationSource({ ...active, service: slug }, "recommendation"),
          undefined,
          { focusKeys: ["service"] },
        ),
      conversionPractitioner: (slug) =>
        conversionIntelligenceHref(
          withInvestigationSource({ ...active, practitioner: slug }, "recommendation"),
          undefined,
          { focusKeys: ["practitioner"] },
        ),
      conversionIntent: (_intent) =>
        // Conversion does not own intent; open its overview without stale focus.
        conversionIntelligenceHref(active),
      governanceReview: (queue) =>
        governanceReviewHref({
          queue,
          filters: withInvestigationSource(active, "recommendation"),
        }),
      governanceManagement: (queue) =>
        governanceManagementHref({
          queue,
          filters: withInvestigationSource(active, "recommendation"),
        }),
      governanceExpiry: governanceExpiryHref(withInvestigationSource(active, "recommendation")),
    },
  });

  const sectionRenderers: Record<CommandCentreSectionId, () => ReactNode> = {
    guidance: () => <RecommendedActionsPanel actions={recommendedActions} />,
    health: () => <HealthSection layout={layout} snapshot={snapshot} filters={active} />,
    trends: () => <TrendsSection layout={layout} snapshot={snapshot} filters={active} />,
    leaders: () => <LeadersSection layout={layout} snapshot={snapshot} range={range} filters={active} />,
    alerts: () => (
      <AlertsSection
        layout={layout}
        snapshot={snapshot}
        filters={active}
        canGovernance={canGovernance}
      />
    ),
  };

  return (
    <main>
      <InsightsFilterSync filters={active} />
      <DashboardHeader
        title="Practice briefing"
        description={`${layout.blurb} Start here each day — health score, recommended actions, then any alerts. No technical background required.`}
        meta={
          <>
            View · {layout.label}
            <span className="block sm:inline sm:before:content-['·_']">
              {snapshot.start} → {snapshot.end}
            </span>
            <span className="block sm:inline sm:before:content-['·_']">{loaded.feedLabel}</span>
            {governanceFeedLabel ? (
              <span className="block sm:inline sm:before:content-['·_']">{governanceFeedLabel}</span>
            ) : null}
            {clinic?.practiceName ? (
              <span className="block sm:inline sm:before:content-['·_']">{clinic.practiceName}</span>
            ) : null}
          </>
        }
      />

      <div className="mt-6 space-y-3">
        <InsightsNav current="command-centre" filters={active} />
        <DataModeBanner mode={mode} feedLabel={loaded.feedLabel} />
        <HowToReadDashboard dashboard="command-centre" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <RangeTabs
            options={executiveRangeOptions()}
            active={range}
            hrefFor={(value) => {
              const base = withInsightsQuery("/admin", {
                ...active,
                range: value as ExecutiveRange,
              });
              const sep = base.includes("?") ? "&" : "?";
              return `${base}${sep}persona=${encodeURIComponent(persona)}`;
            }}
          />
          <div className="flex flex-wrap items-center gap-3">
            <HealthStatusLegend />
            <PlatformHealthLegend />
            <DataModeSwitcher path="/admin" filters={active} active={mode} />
          </div>
        </div>
        <p className="text-xs text-slate-500" role="status">
          Showing <span className="font-medium text-slate-700">{layout.label}</span> priority
          {role ? ` · signed in as ${ROLE_LABEL[role]}` : null}.
        </p>
      </div>

      {layout.sections.map((sectionId) => (
        <div key={sectionId}>{sectionRenderers[sectionId]()}</div>
      ))}

      <DashboardMeta>
        Command centre composes Executive, Digital Reception, Conversion, Governance, and Launch readiness.
        Content editing remains under Pages · Practitioners · Services.
      </DashboardMeta>
    </main>
  );
}
