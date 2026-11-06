/**
 * GP Attraction Content Intelligence Engine
 * Advisory recommendations for human editors — WMC brand pillars.
 */

const PILLAR_LABELS = {
  community_care: "Community care",
  continuity_of_care: "Continuity of care",
  gp_employer_brand: "GP employer brand",
};

function mapTermToPillar(term) {
  const t = term.toLowerCase();
  if (/continuit|list build|return|known gp|ongoing/.test(t)) return "continuity_of_care";
  if (/community|local|woolloongabba|inner south|parking|after hours/.test(t)) return "community_care";
  return "gp_employer_brand";
}

function faqCoverage(existingFaqs, term) {
  const t = term.toLowerCase().replace(/\s+/g, "-");
  const aliases = {
    "provider-number": "provider-numbers",
    "provider numbers": "provider-numbers",
    dpa: null,
    continuity: null,
    "list building": null,
    "list-building": null,
    percentage: "percentage-arrangements",
    parking: null,
    "after hours": null,
    indemnity: null,
    orientation: null,
    "registrar supervision": "registrar-pathway",
    sessions: "session-flexibility",
    "nursing support": "nursing-support",
  };
  for (const [k, v] of Object.entries(aliases)) {
    if (t.includes(k) || term.toLowerCase().includes(k)) {
      if (v === null) return { covered: false, faqId: null };
      return { covered: existingFaqs.includes(v), faqId: v };
    }
  }
  const direct = existingFaqs.find((f) => term.toLowerCase().includes(f.replace(/-/g, " ")) || f.includes(t));
  return { covered: Boolean(direct), faqId: direct || null };
}

export function analyseContentIntelligence(signals) {
  const existingFaqs = signals.existingFaqs || [];

  // High-converting pages
  const highConvertingPages = (signals.pageConversion || [])
    .map((p) => {
      const rate = p.sessions ? p.eoiSessions / p.sessions : 0;
      return {
        path: p.path,
        sessions: p.sessions,
        eoiSessions: p.eoiSessions,
        conversionRate: Number((rate * 100).toFixed(1)),
        personaTop: p.personaTop,
        sampleOk: p.sessions >= 20,
      };
    })
    .filter((p) => p.sampleOk)
    .sort((a, b) => b.conversionRate - a.conversionRate);

  // Unanswered questions from internal search + not_helpful FAQs + keywords without coverage
  const unansweredQuestions = [];
  for (const s of signals.internalSearch || []) {
    const cov = faqCoverage(existingFaqs, s.term);
    if (!cov.covered) {
      unansweredQuestions.push({
        id: `unans_internal_${s.term.replace(/\s+/g, "_")}`,
        question: s.term,
        evidence: `Internal search ×${s.count}`,
        demand: s.count,
        pillar: mapTermToPillar(s.term),
        source: "internal_search",
      });
    }
  }
  for (const f of signals.faqUsage || []) {
    if (f.notHelpful >= 8) {
      unansweredQuestions.push({
        id: `unans_faq_${f.faqId}`,
        question: `Clarify FAQ: ${f.faqId}`,
        evidence: `${f.notHelpful} not-helpful votes vs ${f.helpful} helpful (${f.opens} opens)`,
        demand: f.notHelpful,
        pillar: f.faqId.includes("provider") || f.faqId.includes("billing") || f.faqId.includes("percentage")
          ? "gp_employer_brand"
          : "continuity_of_care",
        source: "faq_not_helpful",
        faqId: f.faqId,
      });
    }
  }
  for (const k of signals.searchKeywords || []) {
    const cov = faqCoverage(existingFaqs, k.query);
    if (!cov.covered && k.impressions >= 70) {
      unansweredQuestions.push({
        id: `unans_seo_${k.query.slice(0, 40).replace(/\s+/g, "_")}`,
        question: k.query,
        evidence: `SEO impressions ${k.impressions}, clicks ${k.clicks}, avg position ${k.position}`,
        demand: Math.round(k.impressions / 10),
        pillar: mapTermToPillar(k.query),
        source: "search_keyword",
      });
    }
  }
  unansweredQuestions.sort((a, b) => b.demand - a.demand);

  // Content gaps = unanswered + high demand keywords weakly covered + persona needs
  const contentGaps = [];
  const seenGap = new Set();
  function addGap(gap) {
    if (seenGap.has(gap.id)) return;
    seenGap.add(gap.id);
    contentGaps.push(gap);
  }

  addGap({
    id: "gap_continuity_story",
    title: "Continuity-of-care employer narrative is thin vs search demand",
    pillar: "continuity_of_care",
    score: 92,
    evidence: "Keyword ‘continuity of care GP practice Brisbane’ converts interest but no dedicated FAQ/section.",
    doctorNeed: "How patient lists and returning patients work for a new GP here.",
  });
  addGap({
    id: "gap_list_building",
    title: "List-building / first-90-days guidance missing",
    pillar: "continuity_of_care",
    score: 88,
    evidence: "Internal search ‘list building’ ×12; early-career persona top need.",
    doctorNeed: "What the first weeks look like for building a sustainable list.",
  });
  addGap({
    id: "gap_dpa_boundary",
    title: "DPA / location facts page gap (boundary-safe)",
    pillar: "gp_employer_brand",
    score: 85,
    evidence: "Internal search DPA ×17; SEO ‘DPA GP Brisbane medical centre’; no FAQ mapping.",
    doctorNeed: "Where to read official DPA information; what WMC can/cannot say.",
  });
  addGap({
    id: "gap_percentage_clarity",
    title: "Percentage FAQ opens high not-helpful — trust risk",
    pillar: "gp_employer_brand",
    score: 84,
    evidence: "percentage-arrangements: 14 not-helpful / 8 helpful.",
    doctorNeed: "Clearer why terms are private — without publishing a rate.",
  });
  addGap({
    id: "gap_community_proof",
    title: "Community care proof points underused on opportunities path",
    pillar: "community_care",
    score: 78,
    evidence: "Community medical centre keyword interest; Join Our Team converts lower than Opportunities/FAQ.",
    doctorNeed: "Local patient context, team-based care, AGPAL/community positioning.",
  });
  addGap({
    id: "gap_part_time_parent",
    title: "Part-time / parent GP session story incomplete",
    pillar: "gp_employer_brand",
    score: 74,
    evidence: "Persona part_time_parent_gp + SEO ‘part time GP parent friendly practice Brisbane’.",
    doctorNeed: "How reliable part-time sessions and nursing cover are discussed.",
  });
  addGap({
    id: "gap_parking_access",
    title: "Practical community access (parking / after hours) unanswered",
    pillar: "community_care",
    score: 70,
    evidence: "Internal search parking ×9, after hours ×8 — no GP-attraction FAQ link.",
    doctorNeed: "Day-to-day practicalities of working at this location.",
  });

  contentGaps.sort((a, b) => b.score - a.score);

  // EOI sources insight
  const eoiSources = [...(signals.eoiSources || [])].sort((a, b) => b.submissions - a.submissions);
  const topEoi = eoiSources[0];

  // Monthly content recommendations
  const monthlyContentRecommendations = [
    {
      id: "rec_continuity_section",
      type: "new_page_section",
      priority: "high",
      pillar: "continuity_of_care",
      title: "Add ‘Continuity at WMC’ section to GP Opportunities",
      rationale: "High SEO interest + employer brand differentiator; Opportunities already high-converting.",
      targetPath: "/gp-opportunities",
      suggestedCopy:
        "Patients here are encouraged to return to a known GP. We support list-building with nursing and reception around the consult — continuity over throughput.",
      monthAction: "Draft section + review for no earnings claims",
    },
    {
      id: "rec_faq_list_building",
      type: "new_faq",
      priority: "high",
      pillar: "continuity_of_care",
      title: "New FAQ: How does list-building work for new GPs?",
      rationale: "Internal search gap; early-career persona engagement.",
      targetPath: "/join-our-team#gp-faq",
      suggestedCopy:
        "Explain staged growth of consulting footprint, patient allocation honesty, and what the team does to support returning patients — no volume guarantees.",
      monthAction: "Write FAQ + FAQPage schema entry",
    },
    {
      id: "rec_faq_dpa_boundary",
      type: "clarify_boundary",
      priority: "high",
      pillar: "gp_employer_brand",
      title: "Boundary-safe FAQ: DPA and location information",
      rationale: "Unanswered DPA demand; link to navigator + Services Australia — never determine eligibility.",
      targetPath: "/join-our-team#gp-faq",
      suggestedCopy:
        "WMC can share accurate practice location details. DPA/s19AB outcomes are not decided by the practice. Point doctors to official resources and the DPA/19AB Navigator.",
      monthAction: "Publish FAQ + deep-link to navigator prototype",
    },
    {
      id: "rec_rewrite_percentage",
      type: "expand_faq",
      priority: "high",
      pillar: "gp_employer_brand",
      title: "Rewrite percentage FAQ for trust (still no public %)",
      rationale: "Highest not-helpful votes among billing FAQs.",
      targetPath: "/join-our-team#gp-faq",
      suggestedCopy:
        "Acknowledge the question, explain why public % claims mislead, invite private conversation, reinforce community practice context.",
      monthAction: "A/B clarity edit; monitor not-helpful votes",
    },
    {
      id: "rec_persona_part_time",
      type: "persona_message",
      priority: "medium",
      pillar: "gp_employer_brand",
      title: "Part-time / parent GP callout on Opportunities",
      rationale: "Persona conversion healthy but SEO position weak.",
      targetPath: "/gp-opportunities",
      suggestedCopy:
        "Reliable part-time sessions, agreed days, nursing cover discussed honestly against capacity — not a casual locum board.",
      monthAction: "Add short persona block + session planner CTA",
    },
    {
      id: "rec_community_proof",
      type: "seo_landing_tweak",
      priority: "medium",
      pillar: "community_care",
      title: "Strengthen community care proof on Join Our Team",
      rationale: "Join Our Team under-converts vs Opportunities; community keywords exist.",
      targetPath: "/join-our-team",
      suggestedCopy:
        "Lead with Woolloongabba / inner-south community care and AGPAL-aligned team practice before any ‘join’ language.",
      monthAction: "Reorder hero supporting line; link to Opportunities decision page",
    },
    {
      id: "rec_practical_access",
      type: "new_faq",
      priority: "low",
      pillar: "community_care",
      title: "FAQ: Working here day-to-day (access / parking pointer)",
      rationale: "Internal search for parking/after hours without GP-attraction answer.",
      targetPath: "/join-our-team#gp-faq",
      suggestedCopy: "Point to public access/parking page; keep GP tone practical and local.",
      monthAction: "Cross-link existing access content; avoid duplicating long parking essays",
    },
  ];

  // SEO opportunities
  const seoOpportunities = (signals.searchKeywords || [])
    .map((k) => {
      const pillar = mapTermToPillar(k.query);
      const ctr = k.impressions ? k.clicks / k.impressions : 0;
      let opportunity = "maintain";
      if (k.position > 10 && k.impressions >= 100) opportunity = "improve_position";
      if (!faqCoverage(existingFaqs, k.query).covered) opportunity = "create_supporting_content";
      if (/percentage|earn|rate card/i.test(k.query)) opportunity = "capture_without_public_rates";
      return {
        query: k.query,
        impressions: k.impressions,
        clicks: k.clicks,
        position: k.position,
        ctr: Number((ctr * 100).toFixed(1)),
        pillar,
        opportunity,
        recommendation:
          opportunity === "create_supporting_content"
            ? "Create FAQ/section aligned to brand pillar"
            : opportunity === "capture_without_public_rates"
              ? "Rank for intent with trust copy — do not publish %"
              : opportunity === "improve_position"
                ? "Strengthen title/H2 and internal links from Opportunities"
                : "Monitor",
      };
    })
    .sort((a, b) => b.impressions - a.impressions);

  // Doctor-information gaps
  const doctorInformationGaps = [
    {
      id: "info_first_90",
      title: "First 90 days / orientation expectations",
      pillar: "gp_employer_brand",
      whyItMatters: "Early-career and returning personas search orientation/list-building.",
      relatedSignals: ["list building", "orientation", "early_career_gp"],
    },
    {
      id: "info_pn_boundary",
      title: "Provider number boundary remains high-anxiety",
      pillar: "gp_employer_brand",
      whyItMatters: "Top FAQ opens + internal search; must stay Services Australia–accurate.",
      relatedSignals: ["provider-numbers", "provider number"],
    },
    {
      id: "info_continuity_ops",
      title: "How continuity actually works operationally",
      pillar: "continuity_of_care",
      whyItMatters: "Brand differentiator vs throughput clinics; SEO demand present.",
      relatedSignals: ["continuity of care GP practice Brisbane", "continuity"],
    },
    {
      id: "info_supervision_capacity",
      title: "Registrar supervision capacity honesty",
      pillar: "gp_employer_brand",
      whyItMatters: "Internal search registrar supervision; FAQ exists but demand continues.",
      relatedSignals: ["registrar supervision", "registrar-pathway"],
    },
    {
      id: "info_community_context",
      title: "Local community / catchment context for GPs",
      pillar: "community_care",
      whyItMatters: "Helps doctors picture the patient community they will serve.",
      relatedSignals: ["community medical centre Woolloongabba GP"],
    },
  ];

  const personaEngagement = (signals.personaEngagement || []).map((p) => ({
    ...p,
    pillarHint:
      p.personaId === "early_career_gp" || p.personaId === "returning_gp"
        ? "continuity_of_care"
        : p.personaId === "part_time_parent_gp"
          ? "gp_employer_brand"
          : "community_care",
  }));

  return {
    generatedAt: new Date().toISOString(),
    periodLabel: signals.periodLabel || "current",
    windowDays: signals.windowDays || 28,
    notice:
      "Advisory content intelligence for human editors. Does not auto-publish. Preserve WMC voice: community care, continuity, honest employer brand — no recruitment-agency or earnings hype.",
    brandPillars: PILLAR_LABELS,
    analysis: {
      faqUsage: signals.faqUsage,
      searchKeywords: signals.searchKeywords,
      internalSearch: signals.internalSearch,
      eoiSources,
      personaEngagement,
    },
    contentGaps,
    unansweredQuestions: unansweredQuestions.slice(0, 12),
    highConvertingPages,
    monthlyContentRecommendations,
    seoOpportunities,
    doctorInformationGaps,
    highlights: {
      topConvertingPage: highConvertingPages[0] || null,
      topEoiSource: topEoi || null,
      topFaq: [...(signals.faqUsage || [])].sort((a, b) => b.opens - a.opens)[0] || null,
      topContentGap: contentGaps[0] || null,
    },
  };
}
