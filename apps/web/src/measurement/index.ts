export {
  aggregateBookingClicks,
  aggregateBookingDestinations,
  aggregateByPageGroup,
  aggregateByPath,
  aggregateByPeriod,
  aggregateCallClicks,
  aggregateDigitalReceptionOpens,
  aggregateDigitalReceptionResultClicks,
  aggregateDigitalReceptionSearches,
  aggregatePageViews,
  aggregateResultClickSteps,
  aggregateSearchIntents,
  aggregateTaskShortcutBreakdown,
  aggregateTaskShortcuts,
  coreMetricTotals,
  prepareEvents,
} from "@/measurement/aggregate";

export {
  DEBUG_RETENTION_POLICY,
  buildDashboardSuite,
  buildDigitalReceptionDashboard,
  buildExecutiveDashboard,
  buildGovernanceDashboard,
  buildPractitionerDashboard,
  buildServiceDashboard,
  dashboardHelpers,
} from "@/measurement/datasets";

export {
  buildCommandCentreSnapshot,
  COMMAND_CENTRE_HEALTH_LABEL,
  healthStateTone,
} from "@/measurement/command-centre-report";
export type {
  CommandCentreAlert,
  CommandCentreHealthState,
  CommandCentreSnapshot,
} from "@/measurement/command-centre-report";

export {
  ACTION_IMPACT_LABEL,
  ACTION_PRIORITY_LABEL,
  buildRecommendedActions,
  isActionableRecommendationHref,
} from "@/measurement/recommended-actions";
export type {
  ActionImpact,
  ActionPriority,
  RecommendedAction,
  RecommendedActionLink,
  RecommendedActionLinkBuilders,
  RecommendedActionSource,
} from "@/measurement/recommended-actions";

export {
  PLATFORM_HEALTH_DOMAIN_LABEL,
  PLATFORM_HEALTH_STATE_LABEL,
  PLATFORM_HEALTH_WEIGHTS,
  buildPlatformHealthScorecard,
} from "@/measurement/platform-health-score";
export type {
  PlatformHealthDomainId,
  PlatformHealthScorecard,
  PlatformHealthState,
  PlatformHealthSubscore,
} from "@/measurement/platform-health-score";

export {
  PLATFORM_HEALTH_BAND_EXPLANATIONS,
  PLATFORM_HEALTH_BAND_LABEL,
  PLATFORM_HEALTH_DOMAIN_TARGETS,
  healthDomainsForPath,
  investigatePlatformHealthDomain,
  isPlatformHealthDomainId,
} from "@/measurement/platform-health-investigation";

export {
  buildPracticeExecutiveDashboard,
  buildPracticeExecutiveDashboardForDates,
  executiveRangeOptions,
} from "@/measurement/executive-report";
export type {
  BookingPlacementKey,
  DailySeriesPoint,
  ExecutiveRateCard,
  MetricTrend,
  PracticeExecutiveDashboard,
  TrendDirection,
} from "@/measurement/executive-report";
export { resolvePreviousExecutiveRange } from "@/measurement/executive-report";

export {
  DR_WATCHLIST_INTENTS,
  buildPracticeDigitalReceptionDashboard,
  digitalReceptionRangeOptions,
  resolutionBand,
} from "@/measurement/digital-reception-report";
export type {
  DigitalReceptionFunnelStep,
  IntentPerformanceRow,
  PracticeDigitalReceptionDashboard,
  ResolutionBand,
  WatchlistRow,
} from "@/measurement/digital-reception-report";

export {
  classifyAuthorityTier,
  classifyServiceAuthorityTier,
  loadPractitionerAuthoritySignals,
  loadServiceAuthoritySignals,
  AUTHORITY_TIERS,
} from "@/measurement/authority-framework";
export type {
  AuthorityTier,
  PractitionerAuthoritySignals,
  ServiceAuthoritySignals,
} from "@/measurement/authority-framework";

export {
  buildPracticePractitionerAuthorityDashboard,
  buildPracticePractitionerAuthorityDashboardFromIndex,
  practitionerAuthorityRangeOptions,
} from "@/measurement/practitioner-authority-report";
export type {
  PracticePractitionerAuthorityDashboard,
  PractitionerAuthorityRow,
} from "@/measurement/practitioner-authority-report";

export {
  buildPracticeServiceAuthorityDashboard,
  buildPracticeServiceAuthorityDashboardFromIndex,
  serviceAuthorityRangeOptions,
} from "@/measurement/service-authority-report";
export type {
  PracticeServiceAuthorityDashboard,
  ServiceAuthorityRow,
  TierConversionSlice,
} from "@/measurement/service-authority-report";

export {
  buildPracticeConversionIntelligenceReport,
  conversionIntelligenceRangeOptions,
} from "@/measurement/conversion-intelligence-report";
export type {
  AbandonmentJourneyRow,
  ConversionFunnelStep,
  ConverterRow,
  ExitPageRow,
  OpportunityRow,
  PracticeConversionIntelligenceReport,
} from "@/measurement/conversion-intelligence-report";

export {
  EXECUTIVE_RANGES,
  EXECUTIVE_RANGE_LABEL,
  filterEventsByRange,
  isExecutiveRange,
  resolveExecutiveRange,
} from "@/measurement/ranges";
export type { ExecutiveRange } from "@/measurement/ranges";

export {
  loadMeasurementEvents,
  warehouseFeedAvailable,
} from "@/measurement/event-source";
export type { MeasurementEventSource, MeasurementEventSourceKind } from "@/measurement/event-source";
export { buildExecutiveFixtureEvents } from "@/measurement/fixtures";
export { buildHealthcareDemoEvents, HEALTHCARE_DEMO_DATASET_META } from "@/measurement/demo/healthcare-demo-events";
export {
  buildHealthcareDemoGovernanceRows,
  HEALTHCARE_DEMO_GOVERNANCE_META,
} from "@/measurement/demo/healthcare-demo-governance";
export { resolveGovernanceDataset } from "@/measurement/demo/load-governance-dataset";
export {
  INSIGHTS_DATA_MODES,
  INSIGHTS_DATA_MODE_LABEL,
  defaultInsightsDataMode,
  insightsDataModeOptions,
  isInsightsDataMode,
  parseInsightsDataMode,
  resolveInsightsDataMode,
  type InsightsDataMode,
} from "@/measurement/insights-data-mode";

export type {
  DigitalReceptionDashboardDataset,
  ExecutiveDashboardDataset,
  GovernanceDashboardDataset,
  GovernanceSnapshotInput,
  PractitionerDashboardDataset,
  ServiceDashboardDataset,
  DashboardSuite,
} from "@/measurement/datasets";

export { brisbaneDateIso, brisbaneMonthKey, brisbaneWeekKey, periodKeyFor } from "@/measurement/periods";

export { containsRawQueryField, sanitizeMeasurementEvent, sanitizeMeasurementEvents } from "@/measurement/sanitize";

export type {
  CoreEventName,
  CountRow,
  DebugRetentionPolicy,
  IntentBucket,
  MeasurementEvent,
  PageGroup,
  PeriodBucket,
  PeriodGrain,
  RawMeasurementEvent,
  ResultType,
  SearchAggregateRow,
} from "@/measurement/types";

export {
  CORE_EVENTS,
  INTENT_BUCKETS,
  MEASUREMENT_VERSION,
  PAGE_GROUPS,
  RESULT_STEPS,
  RESULT_TYPES,
} from "@/measurement/types";
