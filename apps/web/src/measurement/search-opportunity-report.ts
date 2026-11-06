import type { ClinicalReview, Page, SearchDemandSignal } from "@prisma/client";
import { buildGovernanceExpiryReport } from "@/governance/expiry-report";
import {
  buildPracticeDigitalReceptionDashboard,
  type PracticeDigitalReceptionDashboard,
} from "@/measurement/digital-reception-report";
import { prepareEvents } from "@/measurement/aggregate";
import { resolvePreviousExecutiveRange } from "@/measurement/executive-report";
import {
  EXECUTIVE_RANGE_LABEL,
  eventBrisbaneDate,
  filterEventsByRange,
  resolveExecutiveRange,
  type ExecutiveRange,
} from "@/measurement/ranges";
import type { MeasurementEvent, RawMeasurementEvent } from "@/measurement/types";

export type SearchTermRow = {
  term: string;
  searches: number;
  no_results: number;
  clicks: number;
  intent_bucket: string;
  prior_searches: number;
  trend: "rising" | "declining" | "steady" | "new";
  opportunity_score: number;
  opportunity_label: "High Demand" | "Low Coverage" | "Weak Journey" | "Watch";
};

export type PractitionerOpportunityRow = {
  practitioner: string;
  searches: number;
  top_terms: string[];
  no_results: number;
  gap_score: number;
};

export type FreshnessSummary = {
  needs_review: number;
  review_overdue: number;
  recently_updated: number;
  current: number;
};

export type ContentGapAlert = {
  key: string;
  title: string;
  detail: string;
  score: number;
  href: string;
};

export type SearchOpportunityDashboard = {
  dashboard: "search_content_opportunities";
  range: ExecutiveRange;
  range_label: string;
  start: string;
  end: string;
  generated_at: string;
  privacy: string;
  source: "live_signals" | "demo_signals" | "events_only";
  kpis: {
    searches: number;
    no_result_searches: number;
    unique_terms: number;
    opportunity_queue: number;
    pages_due_for_review: number;
  };
  top_searches: SearchTermRow[];
  rising_searches: SearchTermRow[];
  declining_searches: SearchTermRow[];
  no_result_searches: SearchTermRow[];
  opportunity_queue: SearchTermRow[];
  practitioner_opportunities: PractitionerOpportunityRow[];
  freshness: FreshnessSummary;
  pages_due_for_review: Array<{ path: string; title: string; daysRemaining: number | null; bucket: string }>;
  content_gap_alerts: ContentGapAlert[];
  reception: Pick<
    PracticeDigitalReceptionDashboard,
    "kpis" | "flagged_intents" | "top_intent_buckets"
  >;
};

const PRIVACY =
  "Search terms are stored for practice content planning only (≈90 days). Not clinical records. Dashboards show normalised terms for staff with Insights access.";

const DEMO_TERMS: Array<{
  term: string;
  intent: string;
  current: number;
  prior: number;
  noResultRate: number;
  clickRate: number;
}> = [
  { term: "adhd", intent: "mental_health", current: 42, prior: 18, noResultRate: 0.55, clickRate: 0.2 },
  { term: "autism", intent: "child_health", current: 31, prior: 14, noResultRate: 0.48, clickRate: 0.22 },
  { term: "weight loss", intent: "clinical_symptom", current: 27, prior: 22, noResultRate: 0.41, clickRate: 0.28 },
  { term: "travel vaccinations", intent: "vaccination", current: 24, prior: 9, noResultRate: 0.38, clickRate: 0.35 },
  { term: "iron infusion", intent: "clinical_symptom", current: 19, prior: 21, noResultRate: 0.12, clickRate: 0.55 },
  { term: "skin check", intent: "skin_check", current: 18, prior: 17, noResultRate: 0.08, clickRate: 0.62 },
  { term: "telehealth", intent: "telehealth", current: 16, prior: 25, noResultRate: 0.05, clickRate: 0.58 },
  { term: "menopause", intent: "womens_health", current: 15, prior: 7, noResultRate: 0.44, clickRate: 0.25 },
  { term: "sleep study", intent: "clinical_symptom", current: 12, prior: 4, noResultRate: 0.67, clickRate: 0.15 },
  { term: "dr singh", intent: "practitioner", current: 11, prior: 10, noResultRate: 0.0, clickRate: 0.7 },
];

function scoreOpportunity(input: {
  searches: number;
  noResultRate: number;
  clickRate: number;
  risingBoost: number;
}): { score: number; label: SearchTermRow["opportunity_label"] } {
  const demand = Math.min(40, input.searches * 1.2);
  const gap = input.noResultRate * 35;
  const weakCtr = (1 - input.clickRate) * 20;
  const score = Math.round(Math.min(100, demand + gap + weakCtr + input.risingBoost));
  let label: SearchTermRow["opportunity_label"] = "Watch";
  if (input.noResultRate >= 0.35 && input.searches >= 5) label = "Low Coverage";
  else if (input.searches >= 12 && input.noResultRate < 0.25) label = "High Demand";
  else if (input.clickRate < 0.3 && input.searches >= 8) label = "Weak Journey";
  return { score, label };
}

function trendOf(current: number, prior: number): SearchTermRow["trend"] {
  if (prior <= 0 && current > 0) return "new";
  if (prior <= 0) return "steady";
  const delta = (current - prior) / prior;
  if (delta >= 0.25) return "rising";
  if (delta <= -0.25) return "declining";
  return "steady";
}

function demoTermRows(): SearchTermRow[] {
  return DEMO_TERMS.map((row) => {
    const no_results = Math.round(row.current * row.noResultRate);
    const clicks = Math.round(row.current * row.clickRate);
    const trend = trendOf(row.current, row.prior);
    const risingBoost = trend === "rising" || trend === "new" ? 8 : 0;
    const { score, label } = scoreOpportunity({
      searches: row.current,
      noResultRate: row.noResultRate,
      clickRate: row.clickRate,
      risingBoost,
    });
    return {
      term: row.term,
      searches: row.current,
      no_results,
      clicks,
      intent_bucket: row.intent,
      prior_searches: row.prior,
      trend,
      opportunity_score: score,
      opportunity_label: label,
    };
  }).sort((a, b) => b.opportunity_score - a.opportunity_score || b.searches - a.searches);
}

function aggregateSignals(
  current: SearchDemandSignal[],
  prior: SearchDemandSignal[],
): SearchTermRow[] {
  type Acc = {
    searches: number;
    no_results: number;
    clicks: number;
    intents: Map<string, number>;
  };
  const currentMap = new Map<string, Acc>();
  const priorMap = new Map<string, number>();

  const bump = (map: Map<string, Acc>, signal: SearchDemandSignal) => {
    const key = signal.normalizedTerm;
    const row = map.get(key) || { searches: 0, no_results: 0, clicks: 0, intents: new Map() };
    const isClick = Boolean(signal.clickedResultPath || signal.clickedStep);
    if (isClick) row.clicks += 1;
    else {
      row.searches += 1;
      if (signal.noResult) row.no_results += 1;
    }
    row.intents.set(signal.intentBucket, (row.intents.get(signal.intentBucket) || 0) + 1);
    map.set(key, row);
  };

  for (const signal of current) bump(currentMap, signal);
  for (const signal of prior) {
    if (signal.clickedResultPath || signal.clickedStep) continue;
    priorMap.set(signal.normalizedTerm, (priorMap.get(signal.normalizedTerm) || 0) + 1);
  }

  const rows: SearchTermRow[] = [];
  for (const [term, stats] of currentMap) {
    const prior_searches = priorMap.get(term) || 0;
    const noResultRate = stats.searches ? stats.no_results / stats.searches : 0;
    const clickRate = stats.searches ? stats.clicks / stats.searches : 0;
    const trend = trendOf(stats.searches, prior_searches);
    const risingBoost = trend === "rising" || trend === "new" ? 8 : 0;
    const intent_bucket =
      [...stats.intents.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ||
      "unmatched";
    const { score, label } = scoreOpportunity({
      searches: stats.searches,
      noResultRate,
      clickRate,
      risingBoost,
    });
    rows.push({
      term,
      searches: stats.searches,
      no_results: stats.no_results,
      clicks: stats.clicks,
      intent_bucket,
      prior_searches,
      trend,
      opportunity_score: score,
      opportunity_label: label,
    });
  }
  return rows.sort((a, b) => b.opportunity_score - a.opportunity_score || b.searches - a.searches);
}

function practitionerRows(signals: SearchDemandSignal[]): PractitionerOpportunityRow[] {
  const map = new Map<string, { searches: number; no_results: number; terms: Map<string, number> }>();
  for (const signal of signals) {
    const key = signal.practitionerSlug || (signal.intentBucket === "practitioner" ? signal.normalizedTerm : "");
    if (!key) continue;
    const row = map.get(key) || { searches: 0, no_results: 0, terms: new Map() };
    row.searches += 1;
    if (signal.noResult) row.no_results += 1;
    row.terms.set(signal.normalizedTerm, (row.terms.get(signal.normalizedTerm) || 0) + 1);
    map.set(key, row);
  }
  return [...map.entries()]
    .map(([practitioner, stats]) => {
      const top_terms = [...stats.terms.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 5)
        .map(([term]) => term);
      const gap_score = Math.round(
        Math.min(100, stats.searches * 2 + (stats.searches ? (stats.no_results / stats.searches) * 40 : 0)),
      );
      return { practitioner, searches: stats.searches, top_terms, no_results: stats.no_results, gap_score };
    })
    .sort((a, b) => b.gap_score - a.gap_score || b.searches - a.searches)
    .slice(0, 12);
}

function demoPractitionerRows(): PractitionerOpportunityRow[] {
  return [
    {
      practitioner: "dr-anand-singh",
      searches: 18,
      top_terms: ["adhd", "mental health", "dr singh"],
      no_results: 4,
      gap_score: 52,
    },
    {
      practitioner: "dr-tanya-fernando",
      searches: 14,
      top_terms: ["womens health", "menopause", "iron infusion"],
      no_results: 3,
      gap_score: 44,
    },
    {
      practitioner: "practice-nurse",
      searches: 9,
      top_terms: ["travel vaccinations", "vaccination", "wound care"],
      no_results: 5,
      gap_score: 48,
    },
  ];
}

export function buildSearchOpportunityDashboard(input: {
  signals: SearchDemandSignal[];
  events: Array<RawMeasurementEvent | MeasurementEvent>;
  reviews: Array<ClinicalReview & { page: Pick<Page, "path" | "title" | "updatedAt"> }>;
  range?: ExecutiveRange;
  now?: Date;
  preferDemoWhenEmpty?: boolean;
}): SearchOpportunityDashboard {
  const range = input.range ?? "last_7";
  const now = input.now ?? new Date();
  const { start, end, label } = resolveExecutiveRange(range, now);
  const previous = resolvePreviousExecutiveRange(range, now);

  const inRange = (iso: Date) => {
    const day = eventBrisbaneDate(iso.toISOString());
    return day >= start && day <= end;
  };
  const inPrior = (iso: Date) => {
    const day = eventBrisbaneDate(iso.toISOString());
    return day >= previous.start && day <= previous.end;
  };

  const currentSignals = input.signals.filter((row) => inRange(row.occurredAt));
  const priorSignals = input.signals.filter((row) => inPrior(row.occurredAt));

  let source: SearchOpportunityDashboard["source"] = "live_signals";
  let termRows = aggregateSignals(currentSignals, priorSignals);
  if (termRows.length === 0 && input.preferDemoWhenEmpty !== false) {
    termRows = demoTermRows();
    source = "demo_signals";
  } else if (termRows.length === 0) {
    source = "events_only";
  }

  const reception = buildPracticeDigitalReceptionDashboard(input.events, range, now);
  const expiry = buildGovernanceExpiryReport(input.reviews, 60, now);
  const recentlyCutoff = new Date(now.getTime() - 30 * 86_400_000);
  const recently_updated = input.reviews.filter(
    (row) => (row.lastReviewed && row.lastReviewed >= recentlyCutoff) || row.page.updatedAt >= recentlyCutoff,
  ).length;

  const freshness: FreshnessSummary = {
    needs_review: expiry.counts.due_within_horizon,
    review_overdue: expiry.counts.overdue,
    recently_updated,
    current: expiry.counts.current,
  };

  const pages_due_for_review = expiry.rows
    .filter((row) => row.bucket === "overdue" || row.bucket === "due_within_horizon")
    .slice(0, 12)
    .map((row) => ({
      path: row.path,
      title: row.title,
      daysRemaining: row.daysRemaining,
      bucket: row.bucket,
    }));

  const practitioner_opportunities =
    source === "demo_signals" ? demoPractitionerRows() : practitionerRows(currentSignals);

  const opportunity_queue = termRows
    .filter((row) => row.opportunity_score >= 45 || row.opportunity_label !== "Watch")
    .slice(0, 12);

  const content_gap_alerts: ContentGapAlert[] = [
    ...opportunity_queue.slice(0, 5).map((row) => ({
      key: `term:${row.term}`,
      title: `${row.opportunity_label}: ${row.term}`,
      detail: `${row.searches} searches · ${row.no_results} no-result · score ${row.opportunity_score}`,
      score: row.opportunity_score,
      href: `/admin/search-opportunities?range=${range}`,
    })),
    ...reception.flagged_intents.slice(0, 3).map((row) => ({
      key: `intent:${row.intent_bucket}`,
      title: `Weak resolution: ${row.intent_bucket.replaceAll("_", " ")}`,
      detail: `${row.searches} searches · resolution ${row.resolution_rate ?? 0}%`,
      score: Math.round(100 - (row.resolution_rate ?? 0)),
      href: `/admin/digital-reception?range=${range}&intent=${encodeURIComponent(row.intent_bucket)}`,
    })),
    ...pages_due_for_review.slice(0, 3).map((row) => ({
      key: `fresh:${row.path}`,
      title: row.bucket === "overdue" ? `Review overdue: ${row.title}` : `Review due: ${row.title}`,
      detail: row.daysRemaining === null ? row.path : `${row.daysRemaining} days · ${row.path}`,
      score: row.bucket === "overdue" ? 80 : 55,
      href: `/admin/governance/expiry`,
    })),
  ]
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const unique_terms = new Set(termRows.map((row) => row.term)).size;
  const searches = termRows.reduce((n, r) => n + r.searches, 0);
  const no_result_searches = termRows.reduce((n, r) => n + r.no_results, 0);

  return {
    dashboard: "search_content_opportunities",
    range,
    range_label: label || EXECUTIVE_RANGE_LABEL[range],
    start,
    end,
    generated_at: now.toISOString(),
    privacy: PRIVACY,
    source,
    kpis: {
      searches,
      no_result_searches,
      unique_terms,
      opportunity_queue: opportunity_queue.length,
      pages_due_for_review: freshness.needs_review + freshness.review_overdue,
    },
    top_searches: [...termRows].sort((a, b) => b.searches - a.searches).slice(0, 12),
    rising_searches: termRows.filter((row) => row.trend === "rising" || row.trend === "new").slice(0, 10),
    declining_searches: termRows.filter((row) => row.trend === "declining").slice(0, 10),
    no_result_searches: [...termRows]
      .filter((row) => row.no_results > 0)
      .sort((a, b) => b.no_results - a.no_results || b.searches - a.searches)
      .slice(0, 12),
    opportunity_queue,
    practitioner_opportunities,
    freshness,
    pages_due_for_review,
    content_gap_alerts,
    reception: {
      kpis: reception.kpis,
      flagged_intents: reception.flagged_intents,
      top_intent_buckets: reception.top_intent_buckets,
    },
  };
}

export function searchOpportunityRangeOptions() {
  return (["last_7", "last_30", "mtd"] as ExecutiveRange[]).map((value) => ({
    value,
    label: EXECUTIVE_RANGE_LABEL[value],
  }));
}

/** Keep unused import used for type-only prepareEvents consumers / tree shake clarity. */
export function _eventsInRange(
  events: Array<RawMeasurementEvent | MeasurementEvent>,
  range: ExecutiveRange,
  now = new Date(),
) {
  return filterEventsByRange(prepareEvents(events), range, now);
}
