/** Shared aggregation for GP Attraction Analytics */

const PERSONA_LABELS = {
  early_career_gp: "Early career",
  established_gp_seeking_change: "Established · change",
  returning_gp: "Returning",
  part_time_parent_gp: "Part-time / parent",
  special_interest_gp: "Special interest",
  unknown: "Unknown",
};

function pct(n, d) {
  if (!d) return "0.0%";
  return `${((100 * n) / d).toFixed(1)}%`;
}

function sessionsWith(events, pred) {
  const set = new Set();
  for (const e of events) if (pred(e)) set.add(e.anonymousSessionId);
  return set;
}

export function aggregate(events, personaHints) {
  const opp = sessionsWith(events, (e) => e.name === "page_view" && e.surface === "gp_opportunities");
  const faq = sessionsWith(events, (e) => e.name === "faq_open");
  const readiness = sessionsWith(events, (e) => e.name === "tool_complete" && e.toolId === "doctor-readiness");
  const provider = sessionsWith(events, (e) => e.name === "tool_complete" && e.toolId === "provider-number-readiness");
  const planner = sessionsWith(events, (e) => e.name === "tool_complete" && e.toolId === "gp-session-planner");
  const eoi = sessionsWith(events, (e) => e.name === "eoi_submit");

  const funnel = [
    { id: "opportunities_visit", label: "Opportunities visits", sessions: opp.size },
    { id: "faq_engagement", label: "FAQ engagement", sessions: [...faq].filter((s) => opp.has(s)).length },
    { id: "readiness_complete", label: "Readiness complete", sessions: [...readiness].filter((s) => opp.has(s)).length },
    { id: "provider_readiness_complete", label: "Provider-readiness complete", sessions: [...provider].filter((s) => opp.has(s)).length },
    { id: "session_planner_complete", label: "Session-planner complete", sessions: [...planner].filter((s) => opp.has(s)).length },
    { id: "eoi_submit", label: "EOI submissions", sessions: [...eoi].filter((s) => opp.has(s)).length },
  ];

  const dropOff = [];
  for (let i = 1; i < funnel.length; i++) {
    const prev = funnel[i - 1].sessions;
    const cur = funnel[i].sessions;
    dropOff.push({
      from: funnel[i - 1].label,
      to: funnel[i].label,
      fromSessions: prev,
      toSessions: cur,
      conversion: pct(cur, prev),
      dropOff: pct(Math.max(prev - cur, 0), prev),
    });
  }

  const faqCounts = {};
  for (const e of events) {
    if (e.name === "faq_open" && e.faqId) faqCounts[e.faqId] = (faqCounts[e.faqId] || 0) + 1;
  }
  const topFaq = Object.entries(faqCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([faqId, count]) => ({ faqId, count }));

  const tools = ["doctor-readiness", "provider-number-readiness", "gp-session-planner"];
  const toolStats = tools.map((toolId) => {
    const started = sessionsWith(events, (e) => e.name === "tool_start" && e.toolId === toolId);
    const completed = sessionsWith(events, (e) => e.name === "tool_complete" && e.toolId === toolId);
    const abandonLast = {};
    for (const e of events) {
      if (e.name === "tool_abandon" && e.toolId === toolId) {
        const key = e.lastStepId || "unknown";
        abandonLast[key] = (abandonLast[key] || 0) + 1;
      }
    }
    return {
      toolId,
      started: started.size,
      completed: completed.size,
      abandonRate: pct(started.size - completed.size, started.size),
      lastSteps: Object.entries(abandonLast)
        .sort((a, b) => b[1] - a[1])
        .map(([step, count]) => ({ step, count })),
    };
  });

  const pathCounts = {};
  const eoiList = [...eoi];
  for (const sid of eoiList) {
    const edges = events
      .filter((e) => e.anonymousSessionId === sid && e.name === "path_edge")
      .sort((a, b) => String(a.occurredAt).localeCompare(String(b.occurredAt)));
    let path = "gp_opportunities";
    if (edges.length) {
      for (const edge of edges) {
        if (edge.toSurface) path += ` → ${edge.toSurface}`;
      }
      if (!path.endsWith("gp_eoi")) path += " → gp_eoi";
    } else {
      const completes = events.filter((e) => e.anonymousSessionId === sid && e.name === "tool_complete");
      if (completes.some((c) => c.toolId === "doctor-readiness")) path += " → doctor_readiness";
      if (completes.some((c) => c.toolId === "provider-number-readiness")) path += " → provider_readiness";
      path += " → gp_eoi";
    }
    pathCounts[path] = (pathCounts[path] || 0) + 1;
  }
  const overallEoiRate = funnel[5].sessions / Math.max(opp.size, 1);
  const topPaths = Object.entries(pathCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([path, eoiSessions]) => ({
      path,
      eoiSessions,
      lift: (eoiSessions / Math.max(eoiList.length, 1) / Math.max(overallEoiRate, 0.0001)).toFixed(2),
    }));

  const hints = personaHints || Object.keys(PERSONA_LABELS);
  const personaStats = {};
  for (const hint of hints) {
    const sess = sessionsWith(
      events.filter((e) => (e.personaHint || "unknown") === hint),
      (e) => e.name === "page_view" && e.surface === "gp_opportunities"
    );
    const eoiP = sessionsWith(
      events.filter((e) => (e.personaHint || "unknown") === hint),
      (e) => e.name === "eoi_submit"
    );
    const readyP = sessionsWith(
      events.filter((e) => (e.personaHint || "unknown") === hint),
      (e) => e.name === "tool_complete" && e.toolId === "doctor-readiness"
    );
    personaStats[hint] = {
      label: PERSONA_LABELS[hint] || hint,
      opportunitySessions: sess.size,
      readinessCompletions: readyP.size,
      eoiSubmissions: [...eoiP].filter((s) => sess.has(s)).length,
      conversion: pct([...eoiP].filter((s) => sess.has(s)).length, sess.size),
    };
  }

  return {
    window: "28d",
    generatedAt: new Date().toISOString(),
    kpis: {
      opportunitiesVisits: events.filter((e) => e.name === "page_view" && e.surface === "gp_opportunities").length,
      opportunitiesSessions: opp.size,
      faqEngagement: events.filter((e) => e.name === "faq_open").length,
      readinessCompletions: readiness.size,
      providerReadinessCompletions: provider.size,
      sessionPlannerCompletions: planner.size,
      eoiSubmissions: eoi.size,
      overallConversion: pct(funnel[5].sessions, opp.size),
    },
    funnel,
    dropOff,
    topFaq,
    toolStats,
    topPaths,
    personaStats,
  };
}
