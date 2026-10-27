import { prepareEvents } from "@/measurement/aggregate";
import {
  classifyServiceAuthorityTier,
  loadServiceAuthoritySignals,
  type AuthorityTier,
  type ServiceAuthoritySignals,
} from "@/measurement/authority-framework";
import { DEBUG_RETENTION_POLICY } from "@/measurement/datasets";
import {
  EXECUTIVE_RANGE_LABEL,
  filterEventsByRange,
  resolveExecutiveRange,
  type ExecutiveRange,
} from "@/measurement/ranges";
import type { MeasurementEvent, RawMeasurementEvent } from "@/measurement/types";

export type ServiceAuthorityRow = {
  slug: string;
  title: string;
  url: string;
  tier: AuthorityTier;
  authority_score: number;
  signals: {
    related_practitioners: number;
    related_knowledge: number;
    related_services: number;
    inbound_article_links: number;
    inbound_practitioner_links: number;
  };
  service_views: number;
  booking_clicks: number;
  call_clicks: number;
  contact_rate: number | null;
  booking_intent: number | null;
  related_knowledge_hub_clicks: number;
  practitioner_clicks: number;
  digital_reception_entrances: number;
  digital_reception_outcomes: number;
};

export type TierConversionSlice = {
  tier: AuthorityTier;
  services: number;
  service_views: number;
  booking_clicks: number;
  call_clicks: number;
  contact_actions: number;
  digital_reception_entrances: number;
  digital_reception_outcomes: number;
  views_share: number;
  contact_share: number;
  booking_share: number;
  dr_entrance_share: number;
};

export type PracticeServiceAuthorityDashboard = {
  dashboard: "service_authority";
  range: ExecutiveRange;
  range_label: string;
  start: string;
  end: string;
  generated_at: string;
  privacy: typeof DEBUG_RETENTION_POLICY;
  tier_counts: Record<AuthorityTier, number>;
  totals: {
    service_views: number;
    booking_clicks: number;
    call_clicks: number;
    contact_rate: number | null;
    booking_intent: number | null;
    digital_reception_entrances: number;
    digital_reception_outcomes: number;
  };
  /** Views / bookings / contact / DR volume split across Hub · Developing · Thin. */
  conversion_by_tier: TierConversionSlice[];
  ranked_by_views: ServiceAuthorityRow[];
  ranked_by_contact_rate: ServiceAuthorityRow[];
  ranked_by_booking_intent: ServiceAuthorityRow[];
  ranked_by_digital_reception: ServiceAuthorityRow[];
  services: ServiceAuthorityRow[];
};

function rate(numerator: number, denominator: number): number | null {
  if (!denominator) return null;
  return Number(((numerator / denominator) * 100).toFixed(1));
}

function serviceSlug(path: string): string {
  const normalized = String(path || "").replace(/^\/+/, "");
  if (normalized === "services.html") return "";
  if (!normalized.startsWith("services/")) return "";
  return normalized.replace(/^services\//, "").replace(/\.html$/, "");
}

function isKnowledgePath(path: string, group?: string): boolean {
  if (group === "advice_article" || group === "advice_hub") return true;
  const value = String(path || "");
  return value.startsWith("knowledge/") || value.includes("/articles/") || value.includes("knowledge-centre");
}

function isPractitionerPath(path: string, group?: string): boolean {
  if (group === "practitioner") return true;
  return String(path || "").startsWith("doctors/");
}

function emptyPerf() {
  return {
    service_views: 0,
    booking_clicks: 0,
    call_clicks: 0,
    related_knowledge_hub_clicks: 0,
    practitioner_clicks: 0,
    digital_reception_entrances: 0,
    digital_reception_outcomes: 0,
  };
}

/**
 * Attribute service performance without changing event collection.
 * Knowledge / practitioner clicks: same-session views after a service page view.
 * DR entrances: service result clicks or service views in DR sessions.
 * DR outcomes: booking/call on the service after DR activity.
 */
function accumulatePerformance(events: MeasurementEvent[]) {
  const bySlug = new Map<string, ReturnType<typeof emptyPerf>>();
  const ensure = (slug: string) => {
    const row = bySlug.get(slug) || emptyPerf();
    bySlug.set(slug, row);
    return row;
  };

  const sessionsWithDr = new Set<string>();
  const sessionServices = new Map<string, Set<string>>();

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
    const slug = serviceSlug(event.page_path);

    if (event.event === "page_view" && slug) {
      const row = ensure(slug);
      row.service_views += 1;
      if (event.session_id) {
        const set = sessionServices.get(event.session_id) || new Set<string>();
        set.add(slug);
        sessionServices.set(event.session_id, set);
        if (sessionsWithDr.has(event.session_id)) {
          row.digital_reception_entrances += 1;
        }
      }
    }

    if (event.event === "digital_reception_result_click" && event.step === "service") {
      const target = serviceSlug(event.page_path);
      if (target) ensure(target).digital_reception_entrances += 1;
    }

    if (event.event === "book_appointment_click" && slug) {
      const row = ensure(slug);
      row.booking_clicks += 1;
      if (
        event.placement === "digital_reception" ||
        Boolean(event.session_id && sessionsWithDr.has(event.session_id))
      ) {
        row.digital_reception_outcomes += 1;
      }
    }

    if (event.event === "call_clinic_click" && slug) {
      const row = ensure(slug);
      row.call_clicks += 1;
      if (
        event.placement === "digital_reception" ||
        Boolean(event.session_id && sessionsWithDr.has(event.session_id))
      ) {
        row.digital_reception_outcomes += 1;
      }
    }
  }

  // Same-session knowledge / practitioner clicks after a service view.
  for (const event of events) {
    if (event.event !== "page_view" || !event.session_id) continue;
    const touched = sessionServices.get(event.session_id);
    if (!touched || touched.size === 0) continue;

    if (isKnowledgePath(event.page_path, event.page_group)) {
      for (const slug of touched) ensure(slug).related_knowledge_hub_clicks += 1;
    }
    if (isPractitionerPath(event.page_path, event.page_group)) {
      for (const slug of touched) ensure(slug).practitioner_clicks += 1;
    }
  }

  return bySlug;
}

function toRows(
  signals: ServiceAuthoritySignals[],
  performance: Map<string, ReturnType<typeof emptyPerf>>,
): ServiceAuthorityRow[] {
  const slugs = new Set<string>([...signals.map((row) => row.slug), ...performance.keys()]);
  const signalBySlug = new Map(signals.map((row) => [row.slug, row]));

  return [...slugs]
    .map((slug) => {
      const signal = signalBySlug.get(slug);
      const perf = performance.get(slug) || emptyPerf();
      const title = signal?.title || slug.replaceAll("-", " ");
      const url = signal?.url || `services/${slug}.html`;
      const related_practitioners = signal?.related_practitioners ?? 0;
      const related_knowledge = signal?.related_knowledge ?? 0;
      const related_services = signal?.related_services ?? 0;
      const inbound_article_links = signal?.inbound_article_links ?? 0;
      const inbound_practitioner_links = signal?.inbound_practitioner_links ?? 0;
      const { authority_score, tier } = signal
        ? { authority_score: signal.authority_score, tier: signal.tier }
        : classifyServiceAuthorityTier({
            related_practitioners,
            related_knowledge,
            related_services,
            inbound_article_links,
            inbound_practitioner_links,
          });

      return {
        slug,
        title,
        url,
        tier,
        authority_score,
        signals: {
          related_practitioners,
          related_knowledge,
          related_services,
          inbound_article_links,
          inbound_practitioner_links,
        },
        service_views: perf.service_views,
        booking_clicks: perf.booking_clicks,
        call_clicks: perf.call_clicks,
        contact_rate: rate(perf.booking_clicks + perf.call_clicks, perf.service_views),
        booking_intent: rate(perf.booking_clicks, perf.service_views),
        related_knowledge_hub_clicks: perf.related_knowledge_hub_clicks,
        practitioner_clicks: perf.practitioner_clicks,
        digital_reception_entrances: perf.digital_reception_entrances,
        digital_reception_outcomes: perf.digital_reception_outcomes,
      };
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

export function buildPracticeServiceAuthorityDashboard(
  raw: Array<RawMeasurementEvent | MeasurementEvent>,
  signals: ServiceAuthoritySignals[],
  range: ExecutiveRange = "last_7",
  now = new Date(),
): PracticeServiceAuthorityDashboard {
  const prepared = prepareEvents(raw);
  const events = filterEventsByRange(prepared, range, now);
  const { start, end, label } = resolveExecutiveRange(range, now);
  const services = toRows(signals, accumulatePerformance(events));

  const tier_counts: Record<AuthorityTier, number> = { Hub: 0, Developing: 0, Thin: 0 };
  for (const row of services) tier_counts[row.tier] += 1;

  const service_views = services.reduce((sum, row) => sum + row.service_views, 0);
  const booking_clicks = services.reduce((sum, row) => sum + row.booking_clicks, 0);
  const call_clicks = services.reduce((sum, row) => sum + row.call_clicks, 0);
  const digital_reception_entrances = services.reduce((sum, row) => sum + row.digital_reception_entrances, 0);
  const digital_reception_outcomes = services.reduce((sum, row) => sum + row.digital_reception_outcomes, 0);
  const contact_actions = booking_clicks + call_clicks;

  const conversion_by_tier: TierConversionSlice[] = (["Hub", "Developing", "Thin"] as const).map((tier) => {
    const rows = services.filter((row) => row.tier === tier);
    const tierViews = rows.reduce((sum, row) => sum + row.service_views, 0);
    const tierBookings = rows.reduce((sum, row) => sum + row.booking_clicks, 0);
    const tierCalls = rows.reduce((sum, row) => sum + row.call_clicks, 0);
    const tierContact = tierBookings + tierCalls;
    const tierDrIn = rows.reduce((sum, row) => sum + row.digital_reception_entrances, 0);
    const tierDrOut = rows.reduce((sum, row) => sum + row.digital_reception_outcomes, 0);
    return {
      tier,
      services: rows.length,
      service_views: tierViews,
      booking_clicks: tierBookings,
      call_clicks: tierCalls,
      contact_actions: tierContact,
      digital_reception_entrances: tierDrIn,
      digital_reception_outcomes: tierDrOut,
      views_share: rate(tierViews, service_views) ?? 0,
      contact_share: rate(tierContact, contact_actions) ?? 0,
      booking_share: rate(tierBookings, booking_clicks) ?? 0,
      dr_entrance_share: rate(tierDrIn, digital_reception_entrances) ?? 0,
    };
  });

  const ranked_by_views = [...services].sort(
    (a, b) => b.service_views - a.service_views || a.title.localeCompare(b.title),
  );
  const ranked_by_contact_rate = [...services].sort(
    (a, b) =>
      (b.contact_rate ?? -1) - (a.contact_rate ?? -1) ||
      b.service_views - a.service_views ||
      a.title.localeCompare(b.title),
  );
  const ranked_by_booking_intent = [...services].sort(
    (a, b) =>
      (b.booking_intent ?? -1) - (a.booking_intent ?? -1) ||
      b.booking_clicks - a.booking_clicks ||
      a.title.localeCompare(b.title),
  );
  const ranked_by_digital_reception = [...services].sort(
    (a, b) =>
      b.digital_reception_entrances - a.digital_reception_entrances ||
      b.digital_reception_outcomes - a.digital_reception_outcomes ||
      a.title.localeCompare(b.title),
  );

  return {
    dashboard: "service_authority",
    range,
    range_label: label,
    start,
    end,
    generated_at: new Date().toISOString(),
    privacy: DEBUG_RETENTION_POLICY,
    tier_counts,
    totals: {
      service_views,
      booking_clicks,
      call_clicks,
      contact_rate: rate(contact_actions, service_views),
      booking_intent: rate(booking_clicks, service_views),
      digital_reception_entrances,
      digital_reception_outcomes,
    },
    conversion_by_tier,
    ranked_by_views,
    ranked_by_contact_rate,
    ranked_by_booking_intent,
    ranked_by_digital_reception,
    services,
  };
}

export async function buildPracticeServiceAuthorityDashboardFromIndex(
  raw: Array<RawMeasurementEvent | MeasurementEvent>,
  range: ExecutiveRange = "last_7",
  now = new Date(),
): Promise<PracticeServiceAuthorityDashboard> {
  const signals = await loadServiceAuthoritySignals();
  return buildPracticeServiceAuthorityDashboard(raw, signals, range, now);
}

export function serviceAuthorityRangeOptions() {
  return (["last_7", "last_30", "mtd"] as ExecutiveRange[]).map((value) => ({
    value,
    label: EXECUTIVE_RANGE_LABEL[value],
  }));
}
