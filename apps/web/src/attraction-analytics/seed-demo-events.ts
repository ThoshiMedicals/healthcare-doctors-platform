import { ingestAttractionEvents, type IngestEventInput } from "./ingest";
import { ingestAttractionKnowledgeGraph } from "./graph-ingest";

/**
 * Seed synthetic attraction analytics events for localhost / Experience Validation dashboards.
 * No PII. Advisory only — does not auto-publish or decide EOIs.
 */
export async function seedAttractionAnalyticsDemo(
  clinicId: string,
  createdByUserId?: string,
) {
  const prefix = `ev-demo-${clinicId.slice(0, 8)}`;
  const sessionA = `${prefix}-a`; // Join → FAQ → readiness → Opportunities → EOI (organic)
  const sessionB = `${prefix}-b`; // Join → Pack → EOI (direct)
  const sessionC = `${prefix}-c`; // Join → PE → FAQ only (drop-off)
  const sessionD = `${prefix}-d`; // Tools: session planner + provider (referral)
  const sessionE = `${prefix}-e`; // Join only (direct abandon)
  const sessionF = `${prefix}-f`; // Opportunities high-view / low-EOI (Google)
  const sessionG = `${prefix}-g`; // Opportunities → Pack → EOI (Bing)
  const sessionH = `${prefix}-h`; // Registrar view only (Google)
  const sessionI = `${prefix}-i`; // Registrar + outreach view (Google)
  const demoRegistrarId = `${prefix}-opp-registrar`;
  const demoProceduralId = `${prefix}-opp-procedural`;
  const demoOutreachId = `${prefix}-opp-outreach`;

  const oppProps = (
    opportunityId: string,
    opportunityType: string,
    source: string,
    channel = "organic_search",
    campaign = "",
  ) => ({
    clinicSlug: "woolloongabba",
    opportunityId,
    opportunityType,
    channel,
    source,
    medium: "organic",
    campaign,
  });

  const events: IngestEventInput[] = [
    // Session A — converting path (Google organic)
    {
      name: "page_view",
      anonymousSessionId: sessionA,
      surface: "join_our_team",
      path: "/join-our-team.html",
      channel: "organic_search",
      referrerPath: "https://www.google.com/",
    },
    {
      name: "page_view",
      anonymousSessionId: sessionA,
      surface: "gp_faq",
      path: "/join-our-team/gp-faq.html",
      channel: "organic_search",
    },
    {
      name: "faq_open",
      anonymousSessionId: sessionA,
      surface: "gp_faq",
      faqId: "billing-model",
      path: "/join-our-team/gp-faq.html",
    },
    {
      name: "faq_open",
      anonymousSessionId: sessionA,
      surface: "gp_faq",
      faqId: "nursing-support",
      path: "/join-our-team/gp-faq.html",
    },
    {
      name: "page_view",
      anonymousSessionId: sessionA,
      surface: "doctor_readiness",
      toolId: "doctor-readiness",
      path: "/join-our-team/doctor-readiness.html",
    },
    {
      name: "tool_start",
      anonymousSessionId: sessionA,
      surface: "doctor_readiness",
      toolId: "doctor-readiness",
      path: "/join-our-team/doctor-readiness.html",
    },
    {
      name: "tool_complete",
      anonymousSessionId: sessionA,
      surface: "doctor_readiness",
      toolId: "doctor-readiness",
      path: "/join-our-team/doctor-readiness.html",
    },
    {
      name: "page_view",
      anonymousSessionId: sessionA,
      surface: "gp_opportunities",
      path: "/join-our-team/gp-opportunities.html",
      channel: "organic_search",
      referrerPath: "https://www.google.com/",
    },
    {
      name: "gp_opportunities_view",
      anonymousSessionId: sessionA,
      surface: "gp_opportunities",
      path: "/join-our-team/gp-opportunities.html",
      channel: "organic_search",
      ctaId: "page",
      props: {
        clinicSlug: "woolloongabba",
        opportunityId: "page",
        opportunityType: "practice_fit",
        channel: "organic_search",
        source: "google",
        medium: "organic",
        campaign: "",
      },
    },
    {
      name: "job_card_open",
      anonymousSessionId: sessionA,
      surface: "gp_opportunities",
      ctaId: demoProceduralId,
      props: {
        clinicSlug: "woolloongabba",
        opportunityId: demoProceduralId,
        opportunityType: "Procedural GP",
        channel: "organic_search",
        source: "google",
        medium: "organic",
        campaign: "",
      },
    },
    {
      name: "job_detail_view",
      anonymousSessionId: sessionA,
      surface: "gp_opportunities",
      ctaId: demoProceduralId,
      props: {
        clinicSlug: "woolloongabba",
        opportunityId: demoProceduralId,
        opportunityType: "Procedural GP",
        channel: "organic_search",
        source: "google",
        medium: "organic",
        campaign: "",
      },
    },
    {
      name: "opportunity_to_eoi",
      anonymousSessionId: sessionA,
      surface: "gp_opportunities",
      ctaId: demoProceduralId,
      props: {
        clinicSlug: "woolloongabba",
        opportunityId: demoProceduralId,
        opportunityType: "Procedural GP",
        channel: "organic_search",
        source: "google",
        medium: "organic",
        campaign: "",
      },
    },
    {
      name: "path_edge",
      anonymousSessionId: sessionA,
      fromSurface: "gp_opportunities",
      toSurface: "gp_eoi",
      path: "gp_opportunities>gp_eoi",
    },
    {
      name: "eoi_start",
      anonymousSessionId: sessionA,
      surface: "gp_eoi",
      path: "/join-our-team/express-interest.html",
    },
    {
      name: "eoi_submit",
      anonymousSessionId: sessionA,
      surface: "gp_eoi",
      eoiSubmissionId: `${prefix}-eoi-a`,
      path: "/join-our-team/express-interest.html",
    },

    // Session B — pack download then EOI (direct)
    {
      name: "page_view",
      anonymousSessionId: sessionB,
      surface: "join_our_team",
      path: "/join-our-team.html",
      channel: "direct",
    },
    {
      name: "page_view",
      anonymousSessionId: sessionB,
      surface: "opportunity_pack",
      path: "/join-our-team/opportunity-pack.html",
      channel: "direct",
    },
    {
      name: "pack_download",
      anonymousSessionId: sessionB,
      surface: "opportunity_pack",
      packId: "gp-opportunity-pack",
      ctaId: "opportunity_pack_download",
      path: "/join-our-team/opportunity-pack.html",
    },
    {
      name: "path_edge",
      anonymousSessionId: sessionB,
      fromSurface: "opportunity_pack",
      toSurface: "gp_eoi",
      path: "opportunity_pack>gp_eoi",
    },
    {
      name: "eoi_start",
      anonymousSessionId: sessionB,
      surface: "gp_eoi",
      path: "/join-our-team/express-interest.html",
    },
    {
      name: "eoi_submit",
      anonymousSessionId: sessionB,
      surface: "gp_eoi",
      eoiSubmissionId: `${prefix}-eoi-b`,
      path: "/join-our-team/express-interest.html",
    },

    // Session C — PE engagement, FAQ, drop before EOI (Bing)
    {
      name: "page_view",
      anonymousSessionId: sessionC,
      surface: "join_our_team",
      path: "/join-our-team.html",
      channel: "organic_search",
      referrerPath: "https://www.bing.com/",
    },
    {
      name: "page_view",
      anonymousSessionId: sessionC,
      surface: "practice_experience",
      path: "/about-us/practice-experience.html",
    },
    {
      name: "module_view",
      anonymousSessionId: sessionC,
      surface: "practice_experience",
      moduleId: "typical_day",
      path: "/about-us/practice-experience.html",
    },
    {
      name: "module_view",
      anonymousSessionId: sessionC,
      surface: "practice_experience",
      moduleId: "nursing",
      path: "/about-us/practice-experience.html",
    },
    {
      name: "faq_open",
      anonymousSessionId: sessionC,
      surface: "gp_faq",
      faqId: "agpal-accreditation",
      path: "/join-our-team/gp-faq.html",
    },
    {
      name: "page_view",
      anonymousSessionId: sessionC,
      surface: "doctor_readiness",
      toolId: "doctor-readiness",
      path: "/join-our-team/doctor-readiness.html",
    },
    {
      name: "tool_start",
      anonymousSessionId: sessionC,
      surface: "doctor_readiness",
      toolId: "doctor-readiness",
      path: "/join-our-team/doctor-readiness.html",
    },

    // Session D — session planner + provider (referral from healthcarelink)
    {
      name: "page_view",
      anonymousSessionId: sessionD,
      surface: "join_our_team",
      path: "/join-our-team.html",
      channel: "referral",
      referrerPath: "https://www.healthcarelink.com.au/",
    },
    {
      name: "page_view",
      anonymousSessionId: sessionD,
      surface: "gp_session_planner",
      toolId: "gp-session-planner",
      path: "/join-our-team/session-planner.html",
    },
    {
      name: "tool_start",
      anonymousSessionId: sessionD,
      surface: "gp_session_planner",
      toolId: "gp-session-planner",
      path: "/join-our-team/session-planner.html",
    },
    {
      name: "tool_complete",
      anonymousSessionId: sessionD,
      surface: "gp_session_planner",
      toolId: "gp-session-planner",
      path: "/join-our-team/session-planner.html",
    },
    {
      name: "page_view",
      anonymousSessionId: sessionD,
      surface: "provider_number_readiness",
      toolId: "provider-number-readiness",
      path: "/join-our-team/provider-number-readiness.html",
    },
    {
      name: "tool_complete",
      anonymousSessionId: sessionD,
      surface: "provider_number_readiness",
      toolId: "provider-number-readiness",
      path: "/join-our-team/provider-number-readiness.html",
    },
    {
      name: "pack_download",
      anonymousSessionId: sessionD,
      surface: "opportunity_pack",
      packId: "gp-opportunity-pack",
      ctaId: "opportunity_pack_download",
      path: "/join-our-team/opportunity-pack.html",
    },

    // Session E — join only abandon
    {
      name: "page_view",
      anonymousSessionId: sessionE,
      surface: "join_our_team",
      path: "/join-our-team.html",
      channel: "direct",
    },

    // Session F — registrar high view / low conversion (Google)
    {
      name: "page_view",
      anonymousSessionId: sessionF,
      surface: "join_our_team",
      path: "/join-our-team.html",
      channel: "organic_search",
      referrerPath: "https://www.google.com/",
    },
    {
      name: "faq_open",
      anonymousSessionId: sessionF,
      surface: "gp_faq",
      faqId: "registrars",
      path: "/join-our-team/gp-faq.html",
    },
    {
      name: "page_view",
      anonymousSessionId: sessionF,
      surface: "gp_opportunities",
      path: "/join-our-team/gp-opportunities.html",
      channel: "organic_search",
      referrerPath: "https://www.google.com/",
    },
    {
      name: "gp_opportunities_view",
      anonymousSessionId: sessionF,
      surface: "gp_opportunities",
      ctaId: "page",
      props: {
        clinicSlug: "woolloongabba",
        opportunityId: "page",
        opportunityType: "practice_fit",
        channel: "organic_search",
        source: "google",
        medium: "organic",
        campaign: "gp-jobs-brisbane",
      },
    },
    {
      name: "job_card_open",
      anonymousSessionId: sessionF,
      surface: "gp_opportunities",
      ctaId: demoRegistrarId,
      channel: "organic_search",
      referrerPath: "https://www.google.com/",
      props: oppProps(demoRegistrarId, "GP Registrar", "google", "organic_search", "gp-jobs-brisbane"),
    },
    {
      name: "job_card_open",
      anonymousSessionId: sessionF,
      surface: "gp_opportunities",
      ctaId: demoRegistrarId,
      props: oppProps(demoRegistrarId, "GP Registrar", "google", "organic_search", "gp-jobs-brisbane"),
    },
    {
      name: "job_card_open",
      anonymousSessionId: sessionF,
      surface: "gp_opportunities",
      ctaId: demoRegistrarId,
      props: oppProps(demoRegistrarId, "GP Registrar", "google", "organic_search", "gp-jobs-brisbane"),
    },
    {
      name: "job_detail_view",
      anonymousSessionId: sessionF,
      surface: "gp_opportunities",
      ctaId: demoRegistrarId,
      props: oppProps(demoRegistrarId, "GP Registrar", "google", "organic_search", "gp-jobs-brisbane"),
    },
    {
      name: "job_card_open",
      anonymousSessionId: sessionF,
      surface: "gp_opportunities",
      ctaId: demoOutreachId,
      props: oppProps(demoOutreachId, "Rural outreach", "google"),
    },
    {
      name: "job_detail_view",
      anonymousSessionId: sessionF,
      surface: "gp_opportunities",
      ctaId: demoOutreachId,
      props: oppProps(demoOutreachId, "Rural outreach", "google"),
    },

    // Session G — Bing → Opportunities → Pack → EOI
    {
      name: "page_view",
      anonymousSessionId: sessionG,
      surface: "join_our_team",
      path: "/join-our-team.html",
      channel: "organic_search",
      referrerPath: "https://www.bing.com/",
    },
    {
      name: "page_view",
      anonymousSessionId: sessionG,
      surface: "gp_opportunities",
      path: "/join-our-team/gp-opportunities.html",
      channel: "organic_search",
      referrerPath: "https://www.bing.com/",
    },
    {
      name: "gp_opportunities_view",
      anonymousSessionId: sessionG,
      surface: "gp_opportunities",
      ctaId: "page",
      props: {
        clinicSlug: "woolloongabba",
        opportunityId: "page",
        opportunityType: "practice_fit",
        channel: "organic_search",
        source: "bing",
        medium: "organic",
        campaign: "",
      },
    },
    {
      name: "job_card_open",
      anonymousSessionId: sessionG,
      surface: "gp_opportunities",
      ctaId: demoProceduralId,
      props: {
        clinicSlug: "woolloongabba",
        opportunityId: demoProceduralId,
        opportunityType: "Procedural GP",
        channel: "organic_search",
        source: "bing",
        medium: "organic",
        campaign: "",
      },
    },
    {
      name: "opportunity_to_pack",
      anonymousSessionId: sessionG,
      surface: "gp_opportunities",
      ctaId: demoProceduralId,
      props: {
        clinicSlug: "woolloongabba",
        opportunityId: demoProceduralId,
        opportunityType: "Procedural GP",
        channel: "organic_search",
        source: "bing",
        medium: "organic",
        campaign: "",
      },
    },
    {
      name: "pack_download",
      anonymousSessionId: sessionG,
      surface: "opportunity_pack",
      packId: "gp-opportunity-pack",
      ctaId: "opportunity_pack_download",
      path: "/join-our-team/opportunity-pack.html",
    },
    {
      name: "opportunity_to_eoi",
      anonymousSessionId: sessionG,
      surface: "gp_opportunities",
      ctaId: demoProceduralId,
      props: {
        clinicSlug: "woolloongabba",
        opportunityId: demoProceduralId,
        opportunityType: "Procedural GP",
        channel: "organic_search",
        source: "bing",
        medium: "organic",
        campaign: "",
      },
    },
    {
      name: "eoi_start",
      anonymousSessionId: sessionG,
      surface: "gp_eoi",
      path: "/join-our-team/express-interest.html",
    },
    {
      name: "eoi_submit",
      anonymousSessionId: sessionG,
      surface: "gp_eoi",
      eoiSubmissionId: `${prefix}-eoi-g`,
      path: "/join-our-team/express-interest.html",
    },

    // Sessions H/I — more registrar / outreach views without EOI (content-gap signal)
    {
      name: "page_view",
      anonymousSessionId: sessionH,
      surface: "gp_opportunities",
      path: "/join-our-team/gp-opportunities.html",
      channel: "organic_search",
      referrerPath: "https://www.google.com/",
    },
    {
      name: "gp_opportunities_view",
      anonymousSessionId: sessionH,
      surface: "gp_opportunities",
      ctaId: "page",
      props: oppProps("page", "practice_fit", "google"),
    },
    {
      name: "job_card_open",
      anonymousSessionId: sessionH,
      surface: "gp_opportunities",
      ctaId: demoRegistrarId,
      props: oppProps(demoRegistrarId, "GP Registrar", "google", "organic_search", "gp-jobs-brisbane"),
    },
    {
      name: "job_detail_view",
      anonymousSessionId: sessionH,
      surface: "gp_opportunities",
      ctaId: demoRegistrarId,
      props: oppProps(demoRegistrarId, "GP Registrar", "google", "organic_search", "gp-jobs-brisbane"),
    },
    {
      name: "page_view",
      anonymousSessionId: sessionI,
      surface: "gp_opportunities",
      path: "/join-our-team/gp-opportunities.html",
      channel: "organic_search",
      referrerPath: "https://www.google.com/",
    },
    {
      name: "gp_opportunities_view",
      anonymousSessionId: sessionI,
      surface: "gp_opportunities",
      ctaId: "page",
      props: oppProps("page", "practice_fit", "google"),
    },
    {
      name: "job_card_open",
      anonymousSessionId: sessionI,
      surface: "gp_opportunities",
      ctaId: demoRegistrarId,
      props: oppProps(demoRegistrarId, "GP Registrar", "google"),
    },
    {
      name: "job_card_open",
      anonymousSessionId: sessionI,
      surface: "gp_opportunities",
      ctaId: demoOutreachId,
      props: oppProps(demoOutreachId, "Rural outreach", "google"),
    },
    {
      name: "job_detail_view",
      anonymousSessionId: sessionI,
      surface: "gp_opportunities",
      ctaId: demoOutreachId,
      props: oppProps(demoOutreachId, "Rural outreach", "google"),
    },
  ];

  const ingest = await ingestAttractionEvents(clinicId, events);
  const graph = await ingestAttractionKnowledgeGraph(clinicId, 28, createdByUserId);

  return {
    accepted: ingest.accepted,
    rejected: ingest.rejected,
    graphSnapshotId: graph.snapshot.id,
    intelligenceRunId: graph.intelRun.id,
    notice: "Demo analytics seeded for localhost Attraction dashboard — advisory only.",
  };
}
