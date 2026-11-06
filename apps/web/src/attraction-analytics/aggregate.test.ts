import { describe, expect, it } from "vitest";
import {
  aggregateAttractionEvents,
  calculateOpportunityConversion,
  type AttractionEventRow,
} from "./aggregate";

function oppProps(
  opportunityId: string,
  opportunityType: string,
  source = "google",
): Record<string, unknown> {
  return {
    clinicSlug: "woolloongabba",
    opportunityId,
    opportunityType,
    channel: "organic_search",
    source,
    medium: "organic",
    campaign: "",
    sessionId: "sess-test",
    timestamp: "2026-11-01T10:00:00Z",
  };
}

describe("calculateOpportunityConversion", () => {
  it("returns EOI ÷ viewers as a percent string", () => {
    expect(calculateOpportunityConversion(3, 214)).toBe("1.4%");
    expect(calculateOpportunityConversion(0, 10)).toBe("0.0%");
    expect(calculateOpportunityConversion(5, 0)).toBe("0.0%");
  });
});

describe("aggregateAttractionEvents", () => {
  it("builds join→faq→readiness→opportunities→pack→eoi funnel and opportunity performance", () => {
    const events: AttractionEventRow[] = [
      {
        name: "page_view",
        anonymousSessionId: "s1",
        surface: "join_our_team",
        channel: "organic_search",
        referrerPath: "https://www.google.com/",
        occurredAt: "2026-11-01T10:00:00Z",
      },
      {
        name: "faq_open",
        anonymousSessionId: "s1",
        surface: "gp_faq",
        faqId: "billing-model",
        occurredAt: "2026-11-01T10:01:00Z",
      },
      {
        name: "tool_complete",
        anonymousSessionId: "s1",
        surface: "doctor_readiness",
        toolId: "doctor-readiness",
        occurredAt: "2026-11-01T10:02:00Z",
      },
      {
        name: "gp_opportunities_view",
        anonymousSessionId: "s1",
        surface: "gp_opportunities",
        ctaId: "page",
        props: oppProps("page", "practice_fit"),
        occurredAt: "2026-11-01T10:02:30Z",
      },
      {
        name: "page_view",
        anonymousSessionId: "s1",
        surface: "gp_opportunities",
        occurredAt: "2026-11-01T10:02:31Z",
      },
      {
        name: "job_card_open",
        anonymousSessionId: "s1",
        surface: "gp_opportunities",
        ctaId: "opp-1",
        props: oppProps("opp-1", "gp-procedural"),
        occurredAt: "2026-11-01T10:02:40Z",
      },
      {
        name: "job_detail_view",
        anonymousSessionId: "s1",
        surface: "gp_opportunities",
        ctaId: "opp-1",
        props: oppProps("opp-1", "gp-procedural"),
        occurredAt: "2026-11-01T10:02:45Z",
      },
      {
        name: "opportunity_to_pack",
        anonymousSessionId: "s1",
        surface: "gp_opportunities",
        ctaId: "opp-1",
        props: oppProps("opp-1", "gp-procedural"),
        occurredAt: "2026-11-01T10:02:50Z",
      },
      {
        name: "pack_download",
        anonymousSessionId: "s1",
        surface: "opportunity_pack",
        packId: "gp-opportunity-pack",
        ctaId: "opportunity_pack_download",
        occurredAt: "2026-11-01T10:03:00Z",
      },
      {
        name: "opportunity_to_eoi",
        anonymousSessionId: "s1",
        surface: "gp_opportunities",
        ctaId: "opp-1",
        props: oppProps("opp-1", "gp-procedural"),
        occurredAt: "2026-11-01T10:03:30Z",
      },
      {
        name: "eoi_submit",
        anonymousSessionId: "s1",
        surface: "gp_eoi",
        occurredAt: "2026-11-01T10:04:00Z",
      },
      {
        name: "page_view",
        anonymousSessionId: "s2",
        surface: "join_our_team",
        channel: "direct",
        occurredAt: "2026-11-01T11:00:00Z",
      },
      {
        name: "tool_complete",
        anonymousSessionId: "s2",
        surface: "gp_session_planner",
        toolId: "gp-session-planner",
        occurredAt: "2026-11-01T11:01:00Z",
      },
      {
        name: "tool_complete",
        anonymousSessionId: "s2",
        surface: "provider_number_readiness",
        toolId: "provider-number-readiness",
        occurredAt: "2026-11-01T11:02:00Z",
      },
      // Low-conversion registrar path for leakage / insight coverage
      {
        name: "page_view",
        anonymousSessionId: "s3",
        surface: "join_our_team",
        channel: "organic_search",
        referrerPath: "https://www.google.com/",
        occurredAt: "2026-11-01T12:00:00Z",
      },
      {
        name: "faq_open",
        anonymousSessionId: "s3",
        surface: "gp_faq",
        faqId: "registrars",
        occurredAt: "2026-11-01T12:01:00Z",
      },
      {
        name: "page_view",
        anonymousSessionId: "s3",
        surface: "gp_opportunities",
        occurredAt: "2026-11-01T12:02:00Z",
      },
      {
        name: "job_card_open",
        anonymousSessionId: "s3",
        surface: "gp_opportunities",
        ctaId: "opp-reg",
        props: oppProps("opp-reg", "gp-registrar"),
        occurredAt: "2026-11-01T12:03:00Z",
      },
      {
        name: "job_card_open",
        anonymousSessionId: "s4",
        surface: "gp_opportunities",
        ctaId: "opp-reg",
        props: oppProps("opp-reg", "gp-registrar"),
        occurredAt: "2026-11-01T12:10:00Z",
      },
      {
        name: "job_detail_view",
        anonymousSessionId: "s4",
        surface: "gp_opportunities",
        ctaId: "opp-reg",
        props: oppProps("opp-reg", "gp-registrar"),
        occurredAt: "2026-11-01T12:11:00Z",
      },
      {
        name: "page_view",
        anonymousSessionId: "s4",
        surface: "gp_opportunities",
        occurredAt: "2026-11-01T12:09:00Z",
      },
      {
        name: "job_card_open",
        anonymousSessionId: "s5",
        surface: "gp_opportunities",
        ctaId: "opp-reg",
        props: oppProps("opp-reg", "gp-registrar"),
        occurredAt: "2026-11-01T12:20:00Z",
      },
      {
        name: "job_card_open",
        anonymousSessionId: "s5",
        surface: "gp_opportunities",
        ctaId: "opp-reg",
        props: oppProps("opp-reg", "gp-registrar"),
        occurredAt: "2026-11-01T12:21:00Z",
      },
      {
        name: "job_card_open",
        anonymousSessionId: "s5",
        surface: "gp_opportunities",
        ctaId: "opp-reg",
        props: oppProps("opp-reg", "gp-registrar"),
        occurredAt: "2026-11-01T12:22:00Z",
      },
      {
        name: "page_view",
        anonymousSessionId: "s5",
        surface: "gp_opportunities",
        occurredAt: "2026-11-01T12:19:00Z",
      },
    ];

    const agg = aggregateAttractionEvents(events);

    expect(agg.kpis.joinOurTeamSessions).toBe(3);
    expect(agg.kpis.faqOpens).toBe(2);
    expect(agg.kpis.readinessCompletions).toBe(1);
    expect(agg.kpis.sessionPlannerCompletions).toBe(1);
    expect(agg.kpis.providerReadinessCompletions).toBe(1);
    expect(agg.kpis.opportunityPackDownloads).toBe(2);
    expect(agg.kpis.eoiSubmissions).toBe(1);
    expect(agg.kpis.opportunitiesVisits).toBeGreaterThanOrEqual(1);
    expect(agg.kpis.joinToOpportunity).toMatch(/%$/);
    expect(agg.kpis.opportunityToEoiRate).toMatch(/%$/);
    expect(agg.kpis.jobCardOpens).toBeGreaterThan(0);
    expect(agg.kpis.jobDetailViews).toBeGreaterThan(0);

    expect(agg.funnel.map((s) => s.id)).toEqual([
      "join_visit",
      "faq_engagement",
      "readiness_complete",
      "gp_opportunities",
      "opportunity_pack",
      "eoi_submit",
    ]);
    expect(agg.dropOff.length).toBe(agg.funnel.length - 1);
    expect(agg.dropOff.every((d) => d.severity === "ok" || d.severity === "high" || d.severity === "critical")).toBe(
      true,
    );
    expect(agg.dropOff.some((d) => d.to.includes("GP Opportunities"))).toBe(true);

    expect(agg.opportunityPerformance[0]?.conversionRate).toBeGreaterThanOrEqual(
      agg.opportunityPerformance.at(-1)?.conversionRate ?? 0,
    );
    const procedural = agg.opportunityPerformance.find((o) => o.opportunityId === "opp-1");
    expect(procedural?.eoiSubmissions).toBe(1);
    expect(procedural?.packDownloads).toBe(1);
    expect(procedural?.sources.some((s) => s.source === "Google")).toBe(true);

    expect(agg.topFaq[0]?.faqId).toBe("billing-model");
    expect(agg.sources.some((s) => s.source === "Google")).toBe(true);
    expect(agg.sources.some((s) => s.source === "Direct")).toBe(true);
    expect(agg.contentOpportunities.length).toBeGreaterThan(0);
    expect(agg.toolFunnel).toHaveLength(3);
  });

  it("attributes LinkedIn and Email sources separately", () => {
    const events: AttractionEventRow[] = [
      {
        name: "page_view",
        anonymousSessionId: "li",
        surface: "gp_opportunities",
        channel: "social",
        referrerPath: "https://www.linkedin.com/feed/",
        occurredAt: "2026-11-02T09:00:00Z",
        props: {
          ...oppProps("opp-li", "gp-full-time", "linkedin"),
          channel: "social",
          medium: "social",
        },
      },
      {
        name: "job_card_open",
        anonymousSessionId: "li",
        surface: "gp_opportunities",
        ctaId: "opp-li",
        props: {
          ...oppProps("opp-li", "gp-full-time", "linkedin"),
          channel: "social",
          medium: "social",
        },
        occurredAt: "2026-11-02T09:01:00Z",
      },
      {
        name: "page_view",
        anonymousSessionId: "em",
        surface: "join_our_team",
        channel: "email",
        occurredAt: "2026-11-02T10:00:00Z",
        props: {
          clinicSlug: "woolloongabba",
          opportunityId: "page",
          opportunityType: "practice_fit",
          channel: "email",
          source: "newsletter",
          medium: "email",
          campaign: "gp-invite",
          sessionId: "em",
          timestamp: "2026-11-02T10:00:00Z",
        },
      },
    ];

    const agg = aggregateAttractionEvents(events);
    expect(agg.sources.some((s) => s.source === "LinkedIn" || s.source === "Email")).toBe(true);
    const row = agg.opportunityPerformance.find((o) => o.opportunityId === "opp-li");
    expect(row?.sources.some((s) => s.source === "LinkedIn")).toBe(true);
  });
});
