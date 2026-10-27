/**
 * Shared admin-dashboard design system.
 * Use these primitives across Executive, Digital Reception, Authority,
 * Conversion, and Governance dashboards so the CMS feels like one product.
 */

export {
  AUTHORITY_TONE,
  CHART_ACCENTS,
  COLOUR_ACCESSIBILITY_AUDIT,
  DASHBOARD_TONE,
  SEMANTIC_TONE,
  assertPalettesSeparated,
  toneFamily,
  type AuthorityTone,
  type DashboardTone,
  type SemanticTone,
} from "./tokens";

export {
  commandCentreHref,
  conversionIntelligenceHref,
  digitalReceptionHref,
  executiveHref,
  governanceExpiryHref,
  governanceManagementHref,
  governanceReviewHref,
  insightsNavItems,
  practitionerAuthorityHref,
  serviceAuthorityHref,
  type GovernanceQueue,
  type InsightsDestination,
} from "./links";

export {
  INSIGHTS_FILTERS_COOKIE,
  clearInsightsFocus,
  clearInsightsHref,
  insightsFiltersActive,
  insightsFiltersLabel,
  matchFocusKey,
  mergeInsightsFilters,
  parseInsightsFilters,
  parseInsightsFiltersCookie,
  withInsightsQuery,
  type InsightsFilters,
} from "./insights-filters";

export { InsightsFilterSync } from "./insights-filter-sync";

export {
  formatCount,
  formatDashboardLabel,
  formatRate,
} from "./format";

export {
  AuthorityPaletteLegend,
  DashboardCard,
  DashboardHeader,
  DashboardLoading,
  DashboardMeta,
  DataModeBanner,
  DataModeSwitcher,
  EmptyState,
  FocusBanner,
  GaugeMeter,
  HorizontalBarChart,
  InsightsNav,
  LineChart,
  LoadingState,
  MetricTile,
  ProgressBar,
  RangeTabs,
  RankingGrid,
  SectionShell,
  SemanticPaletteLegend,
  StackedBar,
  StatusBadge,
  TrendIndicator,
  type BarChartRow,
  type LinePoint,
  type TrendInput,
} from "./components";

export {
  AuthorityTierExplained,
  HealthStatusLegend,
  HowToReadDashboard,
  MetricLabel,
  MetricMeaning,
  TargetRangeHint,
} from "./how-to-read-panel";

export { AuthorityInvestigationBlock } from "./authority-investigation";

export {
  HealthBandExplanationPanel,
  PlatformHealthFocusBanner,
  PlatformHealthLegend,
} from "./health-band-panel";

export {
  platformHealthBandExplanation,
  platformHealthDomainCta,
  platformHealthDomainHref,
} from "./platform-health-actions";

export {
  InsightsInvestigationBanner,
  InvestigationBanner,
} from "./investigation-banner";

export {
  buildInvestigationBannerModel,
  inferInvestigationSource,
  investigationActive,
  withInvestigationSource,
  type InvestigationBannerModel,
  type InvestigationEntityCounts,
  type InvestigationLink,
  type InvestigationSource,
  type InvestigationView,
} from "./investigation";

export {
  INVESTIGATION_SOURCE_LABEL,
  INVESTIGATION_SOURCES,
  isInvestigationSource,
} from "./investigation-source";

export {
  chartEntitySlug,
  conversionFunnelStageHref,
  digitalReceptionFunnelStageHref,
  gaugeAlertHref,
  governanceQueueInvestigationHref,
  intentInvestigationHref,
  practitionerInvestigationHref,
  searchDestinationHref,
  serviceInvestigationHref,
} from "./chart-navigation";

export {
  AUTHORITY_TIER_FRIENDLY,
  AUTHORITY_TIER_GUIDANCE,
  HOW_TO_READ_GUIDES,
  METRIC_HEALTH_LABEL,
  METRIC_HEALTH_TONE,
  RESOLUTION_BAND_FRIENDLY,
  getHowToReadGuide,
  getMetricGuide,
  healthFromValue,
  type HowToReadGuide,
  type MetricGuide,
  type MetricHealthLevel,
} from "./how-to-read";

export { ExportActions } from "./export-actions";

export {
  KpiInfoReasons,
  KpiTargets,
  filtersWithRange,
  kpiAction,
  kpiInfo,
  type KpiAction,
  type KpiInformational,
  type KpiNavigation,
} from "./kpi-actions";
