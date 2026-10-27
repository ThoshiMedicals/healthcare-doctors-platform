import { prepareEvents } from "@/measurement/aggregate";
import {
  classifyAuthorityTier,
  loadPractitionerAuthoritySignals,
  type AuthorityTier,
  type PractitionerAuthoritySignals,
} from "@/measurement/authority-framework";
import { DEBUG_RETENTION_POLICY } from "@/measurement/datasets";
import {
  resolvePreviousExecutiveRange,
  type MetricTrend,
} from "@/measurement/executive-report";
import {
  EXECUTIVE_RANGE_LABEL,
  eventBrisbaneDate,
  filterEventsByRange,
  resolveExecutiveRange,
  type ExecutiveRange,
} from "@/measurement/ranges";
import type { MeasurementEvent, RawMeasurementEvent } from "@/measurement/types";

export type PractitionerAuthorityRow = {
  slug: string;
  title: string;
  url: string;
  tier: AuthorityTier;
  authority_score: number;
  signals: {
    practitioner_links: number;
    inbound_article_links: number;
    related_services: number;
  };
  profile_views: number;
  booking_clicks: number;
  call_clicks: number;
  contact_rate: number | null;
  booking_intent: number | null;
  digital_reception_recommendations: number;
  digital_reception_selections: number;
  /** Performance vs equal-length prior window — available when prior-period data exists. */
  trends: {
    profile_views: MetricTrend;
    booking_intent: MetricTrend;
    contact_rate: MetricTrend;
  };
};

export type PracticePractitionerAuthorityDashboard = {
  dashboard: "practitioner_authority";
  range: ExecutiveRange;
  range_label: string;
  start: string;
  end: string;
  previous_start: string;
  previous_end: string;
  generated_at: string;
  privacy: typeof DEBUG_RETENTION_POLICY;
  tier_counts: Record<AuthorityTier, number>;
  totals: {
    profile_views: number;
    booking_clicks: number;
    call_clicks: number;
    contact_rate: number | null;
    booking_intent: number | null;
  };
  trends: {
    profile_views: MetricTrend;
    booking_intent: MetricTrend;
    contact_rate: MetricTrend;
  };
  ranked_by_profile_views: PractitionerAuthorityRow[];
  ranked_by_contact_rate: PractitionerAuthorityRow[];
  ranked_by_booking_intent: PractitionerAuthorityRow[];
  practitioners: PractitionerAuthorityRow[];
};

function rate(numerator: number, denominator: number): number | null {
  if (!denominator) return null;
  return Number(((numerator / denominator) * 100).toFixed(1));
}

function buildTrend(current: number, previous: number): MetricTrend {
  const delta = Number((current - previous).toFixed(1));
  const delta_pct =
    previous === 0 ? (current === 0 ? 0 : null) : Number((((current - previous) / previous) * 100).toFixed(1));
  const direction = delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  return { current, previous, delta, delta_pct, direction };
}

function practitionerSlug(path: string, explicit?: string): string {
  if (explicit) return explicit.replace(/^doctors\//, "").replace(/\.html$/, "");
  const normalized = String(path || "").replace(/^\/+/, "");
  if (!normalized.startsWith("doctors/")) return "";
  return normalized.replace(/^doctors\//, "").replace(/\.html$/, "");
}

function emptyPerf() {
  return {
    profile_views: 0,
    booking_clicks: 0,
    call_clicks: 0,
    digital_reception_recommendations: 0,
    digital_reception_selections: 0,
  };
}

function filterEventsByDates(events: MeasurementEvent[], start: string, end: string): MeasurementEvent[] {
  return events.filter((event) => {
    const day = eventBrisbaneDate(event.ts);
    return day >= start && day <= end;
  });
}

/**
 * Attribute Digital Reception recommendations/selections without changing event collection.
 * Recommendation: DR practitioner result click, or profile view in a session that used DR.
 * Selection: booking/call with digital_reception placement, or booking/call after DR in-session.
 */
function accumulatePerformance(events: MeasurementEvent[]) {
  const bySlug = new Map<string, ReturnType<typeof emptyPerf>>();
  const ensure = (slug: string) => {
    const row = bySlug.get(slug) || emptyPerf();
    bySlug.set(slug, row);
    return row;
  };

  const sessionsWithDr = new Set<string>();
  for (const event of events) {
    if (
      event.session_id &&
      (event.event === "digital_reception_open" ||
        event.event === "digital_reception_search" ||
        event.event === "digital_reception_result_click")
    ) {
      sessionsWithDr.add(event.session_id);
    }
  }

  for (const event of events) {
    const slug = practitionerSlug(event.page_path, event.practitioner);

    if (event.event === "page_view" && slug) {
      const row = ensure(slug);
      row.profile_views += 1;
      if (event.session_id && sessionsWithDr.has(event.session_id)) {
        row.digital_reception_recommendations += 1;
      }
    }

    if (event.event === "digital_reception_result_click" && event.step === "practitioner") {
      const target = practitionerSlug(event.page_path, event.practitioner);
      if (target) ensure(target).digital_reception_recommendations += 1;
    }

    if (event.event === "book_appointment_click") {
      const target = slug || practitionerSlug("", event.practitioner);
      if (!target) continue;
      const row = ensure(target);
      row.booking_clicks += 1;
      const fromDr =
        event.placement === "digital_reception" ||
        Boolean(event.session_id && sessionsWithDr.has(event.session_id));
      if (fromDr) row.digital_reception_selections += 1;
    }

    if (event.event === "call_clinic_click") {
      const target = slug || practitionerSlug("", event.practitioner);
      if (!target) continue;
      const row = ensure(target);
      row.call_clicks += 1;
      const fromDr =
        event.placement === "digital_reception" ||
        Boolean(event.session_id && sessionsWithDr.has(event.session_id));
      if (fromDr) row.digital_reception_selections += 1;
    }
  }

  return bySlug;
}

function toRows(
  signals: PractitionerAuthoritySignals[],
  performance: Map<string, ReturnType<typeof emptyPerf>>,
  previousPerformance: Map<string, ReturnType<typeof emptyPerf>>,
): PractitionerAuthorityRow[] {
  const slugs = new Set<string>([
    ...signals.map((row) => row.slug),
    ...performance.keys(),
    ...previousPerformance.keys(),
  ]);
  const signalBySlug = new Map(signals.map((row) => [row.slug, row]));

  return [...slugs]
    .map((slug) => {
      const signal = signalBySlug.get(slug);
      const perf = performance.get(slug) || emptyPerf();
      const prior = previousPerformance.get(slug) || emptyPerf();
      const title =
        signal?.title ||
        slug.replace(/^dr-/, "Dr ").replace(/^mr-/, "Mr ").replaceAll("-", " ");
      const url = signal?.url || `doctors/${slug}.html`;
      const practitioner_links = signal?.practitioner_links ?? 0;
      const inbound_article_links = signal?.inbound_article_links ?? 0;
      const related_services = signal?.related_services ?? 0;
      const { authority_score, tier } = signal
        ? { authority_score: signal.authority_score, tier: signal.tier }
        : classifyAuthorityTier({
            practitioner_links,
            inbound_article_links,
            related_services,
          });

      const contact_rate = rate(perf.booking_clicks + perf.call_clicks, perf.profile_views);
      const booking_intent = rate(perf.booking_clicks, perf.profile_views);
      const prior_contact = rate(prior.booking_clicks + prior.call_clicks, prior.profile_views);
      const prior_booking = rate(prior.booking_clicks, prior.profile_views);

      return {
        slug,
        title,
        url,
        tier,
        authority_score,
        signals: {
          practitioner_links,
          inbound_article_links,
          related_services,
        },
        profile_views: perf.profile_views,
        booking_clicks: perf.booking_clicks,
        call_clicks: perf.call_clicks,
        contact_rate,
        booking_intent,
        digital_reception_recommendations: perf.digital_reception_recommendations,
        digital_reception_selections: perf.digital_reception_selections,
        trends: {
          profile_views: buildTrend(perf.profile_views, prior.profile_views),
          booking_intent: buildTrend(booking_intent ?? 0, prior_booking ?? 0),
          contact_rate: buildTrend(contact_rate ?? 0, prior_contact ?? 0),
        },
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function buildPracticePractitionerAuthorityDashboard(
  raw: Array<RawMeasurementEvent | MeasurementEvent>,
  signals: PractitionerAuthoritySignals[],
  range: ExecutiveRange = "last_7",
  now = new Date(),
): PracticePractitionerAuthorityDashboard {
  const prepared = prepareEvents(raw);
  const events = filterEventsByRange(prepared, range, now);
  const { start, end, label } = resolveExecutiveRange(range, now);
  const previous = resolvePreviousExecutiveRange(range, now);
  const previousEvents = filterEventsByDates(prepared, previous.start, previous.end);

  const currentPerf = accumulatePerformance(events);
  const priorPerf = accumulatePerformance(previousEvents);
  const practitioners = toRows(signals, currentPerf, priorPerf);

  const tier_counts: Record<AuthorityTier, number> = { Hub: 0, Developing: 0, Thin: 0 };
  for (const row of practitioners) tier_counts[row.tier] += 1;

  const sumViews = practitioners.reduce((sum, row) => sum + row.profile_views, 0);
  const sumBookings = practitioners.reduce((sum, row) => sum + row.booking_clicks, 0);
  const sumCalls = practitioners.reduce((sum, row) => sum + row.call_clicks, 0);
  const priorViews = [...priorPerf.values()].reduce((sum, row) => sum + row.profile_views, 0);
  const priorBookings = [...priorPerf.values()].reduce((sum, row) => sum + row.booking_clicks, 0);
  const priorCalls = [...priorPerf.values()].reduce((sum, row) => sum + row.call_clicks, 0);

  const contact_rate = rate(sumBookings + sumCalls, sumViews);
  const booking_intent = rate(sumBookings, sumViews);
  const prior_contact = rate(priorBookings + priorCalls, priorViews);
  const prior_booking = rate(priorBookings, priorViews);

  const ranked_by_profile_views = [...practitioners].sort(
    (a, b) => b.profile_views - a.profile_views || a.title.localeCompare(b.title),
  );
  const ranked_by_contact_rate = [...practitioners].sort(
    (a, b) =>
      (b.contact_rate ?? -1) - (a.contact_rate ?? -1) ||
      b.profile_views - a.profile_views ||
      a.title.localeCompare(b.title),
  );
  const ranked_by_booking_intent = [...practitioners].sort(
    (a, b) =>
      (b.booking_intent ?? -1) - (a.booking_intent ?? -1) ||
      b.booking_clicks - a.booking_clicks ||
      a.title.localeCompare(b.title),
  );

  return {
    dashboard: "practitioner_authority",
    range,
    range_label: label,
    start,
    end,
    previous_start: previous.start,
    previous_end: previous.end,
    generated_at: new Date().toISOString(),
    privacy: DEBUG_RETENTION_POLICY,
    tier_counts,
    totals: {
      profile_views: sumViews,
      booking_clicks: sumBookings,
      call_clicks: sumCalls,
      contact_rate,
      booking_intent,
    },
    trends: {
      profile_views: buildTrend(sumViews, priorViews),
      booking_intent: buildTrend(booking_intent ?? 0, prior_booking ?? 0),
      contact_rate: buildTrend(contact_rate ?? 0, prior_contact ?? 0),
    },
    ranked_by_profile_views,
    ranked_by_contact_rate,
    ranked_by_booking_intent,
    practitioners,
  };
}

export async function buildPracticePractitionerAuthorityDashboardFromIndex(
  raw: Array<RawMeasurementEvent | MeasurementEvent>,
  range: ExecutiveRange = "last_7",
  now = new Date(),
): Promise<PracticePractitionerAuthorityDashboard> {
  const signals = await loadPractitionerAuthoritySignals();
  return buildPracticePractitionerAuthorityDashboard(raw, signals, range, now);
}

export function practitionerAuthorityRangeOptions() {
  return (["last_7", "last_30", "mtd"] as ExecutiveRange[]).map((value) => ({
    value,
    label: EXECUTIVE_RANGE_LABEL[value],
  }));
}
