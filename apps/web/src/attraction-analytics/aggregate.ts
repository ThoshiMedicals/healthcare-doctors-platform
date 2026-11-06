/** Advisory Attraction Analytics aggregation — never auto-approves EOI or publish. */

export type AttractionEventRow = {
  name: string;
  anonymousSessionId: string;
  surface?: string | null;
  toolId?: string | null;
  faqId?: string | null;
  moduleId?: string | null;
  packId?: string | null;
  ctaId?: string | null;
  fromSurface?: string | null;
  toSurface?: string | null;
  personaHint?: string | null;
  channel?: string | null;
  referrerPath?: string | null;
  path?: string | null;
  lastStepId?: string | null;
  occurredAt?: Date | string;
  props?: Record<string, unknown> | null;
};

/** Friendly FAQ labels for dashboard (ids from Attraction FAQ content). */
const FAQ_LABELS: Record<string, string> = {
  "billing-model": "Billing model",
  "percentage-arrangements": "Percentage arrangements",
  "nursing-support": "Nursing support",
  "reception-support": "Reception support",
  "session-flexibility": "Session flexibility",
  "clinical-autonomy": "Clinical autonomy",
  "technology-systems": "Technology systems",
  "agpal-accreditation": "AGPAL accreditation",
  registrars: "GP registrars",
  "provider-number-support": "Provider number support",
  "parking-location": "Parking and location",
  "billing-and-sessions": "Billing and sessions (demo)",
  "dpa-19ab": "DPA / 19AB (demo)",
};

const SURFACE_LABELS: Record<string, string> = {
  join_our_team: "Join Our Team",
  gp_faq: "GP FAQ",
  doctor_readiness: "Doctor Readiness",
  provider_number_readiness: "Provider Number Readiness",
  gp_session_planner: "Session Planner",
  opportunity_pack: "Opportunity Pack",
  gp_eoi: "Express Interest",
  gp_opportunities: "GP Opportunities",
  practice_experience: "Practice Experience",
  practice_support_matrix: "Practice Support",
  dpa_19ab_navigator: "DPA Navigator",
};

function pct(n: number, d: number) {
  if (!d) return "0.0%";
  return `${((100 * n) / d).toFixed(1)}%`;
}

/** Opportunity viewers → EOI submissions (advisory conversion only). */
export function calculateOpportunityConversion(
  eoiSubmissions: number,
  opportunityViewers: number,
): string {
  return pct(eoiSubmissions, opportunityViewers);
}

function leakageSeverity(dropOffRatio: number): "ok" | "high" | "critical" {
  if (dropOffRatio > 0.75) return "critical";
  if (dropOffRatio > 0.5) return "high";
  return "ok";
}

function sessionsWith(
  events: AttractionEventRow[],
  pred: (e: AttractionEventRow) => boolean,
) {
  const set = new Set<string>();
  for (const e of events) if (pred(e)) set.add(e.anonymousSessionId);
  return set;
}

function toolIdMatch(toolId: string | null | undefined, ...aliases: string[]) {
  if (!toolId) return false;
  const t = toolId.toLowerCase();
  return aliases.some((a) => t === a || t === a.replace(/_/g, "-"));
}

function channelOf(e: AttractionEventRow): string {
  const c = (e.channel || "unknown").toLowerCase();
  if (c && c !== "unknown") return c;
  const ref = (e.referrerPath || "").toLowerCase();
  if (!ref) return "direct";
  if (/google\.|bing\.|duckduckgo\.|yahoo\./.test(ref)) return "organic_search";
  if (/facebook\.|linkedin\.|twitter\.|x\.com|instagram\./.test(ref)) return "social";
  if (/mailto:|newsletter|utm_medium=email/.test(ref)) return "email";
  if (/^https?:/.test(ref)) return "referral";
  return "unknown";
}

function sourceBucket(e: AttractionEventRow): string {
  const props = e.props && typeof e.props === "object" ? e.props : null;
  const propSource =
    props && typeof props.source === "string" ? props.source.toLowerCase() : "";
  const propMedium =
    props && typeof props.medium === "string" ? props.medium.toLowerCase() : "";
  if (propSource === "google" || /google/.test(propSource)) return "Google";
  if (propSource === "bing" || /bing/.test(propSource)) return "Bing";
  if (propSource === "linkedin" || /linkedin/.test(propSource)) return "LinkedIn";
  if (
    propSource === "email" ||
    propMedium === "email" ||
    /newsletter|mailchimp/.test(propSource)
  ) {
    return "Email";
  }
  if (propSource === "direct") return "Direct";
  if (propSource && propSource !== "unknown") {
    if (/facebook|twitter|instagram|tiktok/.test(propSource)) return "Social";
    return "Referral";
  }

  const channel = channelOf(e);
  const ref = (e.referrerPath || "").trim().toLowerCase();
  if (channel === "organic_search") {
    if (/google/.test(ref)) return "Google";
    if (/bing/.test(ref)) return "Bing";
    return "Organic search";
  }
  if (channel === "social") {
    if (/linkedin/.test(ref)) return "LinkedIn";
    return "Social";
  }
  if (channel === "email") return "Email";
  if (channel === "referral") {
    if (/linkedin/.test(ref)) return "LinkedIn";
    return "Referral";
  }
  if (channel === "direct") return "Direct";
  return "Unknown";
}

function opportunityMeta(e: AttractionEventRow): {
  opportunityId: string;
  opportunityType: string;
} | null {
  const props = e.props && typeof e.props === "object" ? e.props : null;
  const fromProps =
    props && typeof props.opportunityId === "string" ? props.opportunityId : null;
  const id = fromProps || (e.ctaId && e.ctaId !== "opportunity_pack_download" ? e.ctaId : null);
  if (!id || id === "page") return null;
  const type =
    (props && typeof props.opportunityType === "string" && props.opportunityType) ||
    "GP role";
  return { opportunityId: id, opportunityType: type };
}

export function aggregateAttractionEvents(events: AttractionEventRow[]) {
  const join = sessionsWith(
    events,
    (e) => e.name === "page_view" && e.surface === "join_our_team",
  );
  const opp = sessionsWith(
    events,
    (e) =>
      (e.name === "page_view" || e.name === "gp_opportunities_view") &&
      e.surface === "gp_opportunities",
  );
  const faq = sessionsWith(events, (e) => e.name === "faq_open");
  const faqPage = sessionsWith(
    events,
    (e) => e.name === "page_view" && e.surface === "gp_faq",
  );
  const readiness = sessionsWith(
    events,
    (e) =>
      e.name === "tool_complete" &&
      toolIdMatch(e.toolId, "doctor-readiness", "doctor_readiness"),
  );
  const readinessStarts = sessionsWith(
    events,
    (e) =>
      (e.name === "tool_start" || e.name === "page_view") &&
      (e.surface === "doctor_readiness" ||
        toolIdMatch(e.toolId, "doctor-readiness", "doctor_readiness")),
  );
  const provider = sessionsWith(
    events,
    (e) =>
      e.name === "tool_complete" &&
      toolIdMatch(e.toolId, "provider-number-readiness", "provider_number_readiness"),
  );
  const providerStarts = sessionsWith(
    events,
    (e) =>
      e.name === "page_view" && e.surface === "provider_number_readiness",
  );
  const sessionPlanner = sessionsWith(
    events,
    (e) =>
      e.name === "tool_complete" &&
      toolIdMatch(e.toolId, "gp-session-planner", "session-planner", "gp_session_planner"),
  );
  const sessionPlannerStarts = sessionsWith(
    events,
    (e) =>
      (e.name === "tool_start" || e.name === "page_view") &&
      (e.surface === "gp_session_planner" ||
        toolIdMatch(e.toolId, "gp-session-planner", "session-planner")),
  );
  const pe = sessionsWith(
    events,
    (e) =>
      (e.name === "page_view" || e.name === "module_view") &&
      e.surface === "practice_experience",
  );
  const pack = sessionsWith(
    events,
    (e) =>
      e.name === "pack_download" ||
      e.name === "opportunity_to_pack" ||
      (e.name === "cta_click" && e.ctaId === "opportunity_pack_download"),
  );
  const eoiStart = sessionsWith(
    events,
    (e) => e.name === "eoi_start" || e.name === "opportunity_to_eoi",
  );
  const eoi = sessionsWith(events, (e) => e.name === "eoi_submit");

  /** Primary recruitment funnel — Join → FAQ → Readiness → GP Opportunities → Pack → EOI */
  const funnel = [
    { id: "join_visit", label: "Join Our Team visits", sessions: join.size },
    {
      id: "faq_engagement",
      label: "GP FAQ engagement",
      sessions: faq.size || faqPage.size,
    },
    {
      id: "readiness_complete",
      label: "Readiness assessments complete",
      sessions: readiness.size,
    },
    {
      id: "gp_opportunities",
      label: "GP Opportunities views",
      sessions: opp.size,
    },
    {
      id: "opportunity_pack",
      label: "Opportunity Pack downloads",
      sessions: pack.size,
    },
    {
      id: "eoi_submit",
      label: "EOI submissions",
      sessions: eoi.size,
    },
  ];

  const dropOff = [];
  for (let i = 1; i < funnel.length; i++) {
    const prev = funnel[i - 1].sessions;
    const cur = funnel[i].sessions;
    const dropRatio = prev ? Math.max(prev - cur, 0) / prev : 0;
    dropOff.push({
      from: funnel[i - 1].label,
      to: funnel[i].label,
      fromSessions: prev,
      toSessions: cur,
      conversion: pct(cur, prev),
      dropOff: pct(Math.max(prev - cur, 0), prev),
      severity: leakageSeverity(dropRatio),
    });
  }

  const toolFunnel = [
    {
      id: "readiness",
      label: "Doctor Readiness",
      starts: readinessStarts.size,
      completes: readiness.size,
      conversion: pct(readiness.size, readinessStarts.size),
      dropOff: pct(Math.max(readinessStarts.size - readiness.size, 0), readinessStarts.size),
    },
    {
      id: "provider",
      label: "Provider Number Readiness",
      starts: providerStarts.size,
      completes: provider.size,
      conversion: pct(provider.size, providerStarts.size),
      dropOff: pct(Math.max(providerStarts.size - provider.size, 0), providerStarts.size),
    },
    {
      id: "session_planner",
      label: "Session Planner",
      starts: sessionPlannerStarts.size,
      completes: sessionPlanner.size,
      conversion: pct(sessionPlanner.size, sessionPlannerStarts.size),
      dropOff: pct(
        Math.max(sessionPlannerStarts.size - sessionPlanner.size, 0),
        sessionPlannerStarts.size,
      ),
    },
  ];

  const faqCounts: Record<string, number> = {};
  for (const e of events) {
    if (e.name === "faq_open" && e.faqId) {
      faqCounts[e.faqId] = (faqCounts[e.faqId] || 0) + 1;
    }
  }
  const topFaq = Object.entries(faqCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([faqId, count]) => ({
      faqId,
      label: FAQ_LABELS[faqId] || faqId.replace(/[-_]/g, " "),
      count,
    }));

  const moduleCounts: Record<string, number> = {};
  for (const e of events) {
    if (e.name === "module_view" && e.moduleId) {
      moduleCounts[e.moduleId] = (moduleCounts[e.moduleId] || 0) + 1;
    }
  }

  const pathCounts: Record<string, number> = {};
  for (const sid of eoi) {
    const edges = events
      .filter((e) => e.anonymousSessionId === sid && e.name === "path_edge")
      .sort((a, b) => String(a.occurredAt).localeCompare(String(b.occurredAt)));
    let path = "start";
    if (edges.length) {
      path = String(edges[0].fromSurface || "start");
      for (const edge of edges) {
        if (edge.toSurface) path += `>${edge.toSurface}`;
      }
      if (!path.endsWith("gp_eoi")) path += ">gp_eoi";
    } else {
      const parts: string[] = [];
      if (join.has(sid)) parts.push("join_our_team");
      if (pe.has(sid)) parts.push("practice_experience");
      if (faq.has(sid) || faqPage.has(sid)) parts.push("gp_faq");
      if (readiness.has(sid)) parts.push("doctor_readiness");
      if (opp.has(sid)) parts.push("gp_opportunities");
      if (pack.has(sid)) parts.push("opportunity_pack");
      parts.push("gp_eoi");
      path = parts.join(">");
    }
    pathCounts[path] = (pathCounts[path] || 0) + 1;
  }

  const topPaths = Object.entries(pathCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([path, eoiSessions]) => ({
      path,
      label: path
        .split(">")
        .map((s) => SURFACE_LABELS[s] || s)
        .join(" → "),
      eoiSessions,
    }));

  /** First page_view per session drives recruitment source attribution. */
  const firstBySession = new Map<string, AttractionEventRow>();
  for (const e of events) {
    if (e.name !== "page_view" && e.name !== "gp_opportunities_view") continue;
    const prev = firstBySession.get(e.anonymousSessionId);
    if (!prev) {
      firstBySession.set(e.anonymousSessionId, e);
      continue;
    }
    const prevT = new Date(prev.occurredAt || 0).getTime();
    const curT = new Date(e.occurredAt || 0).getTime();
    if (curT < prevT) firstBySession.set(e.anonymousSessionId, e);
  }

  const sourceCounts: Record<string, { sessions: number; eoi: number }> = {};
  for (const [sid, ev] of firstBySession) {
    const bucket = sourceBucket(ev);
    if (!sourceCounts[bucket]) sourceCounts[bucket] = { sessions: 0, eoi: 0 };
    sourceCounts[bucket].sessions += 1;
    if (eoi.has(sid)) sourceCounts[bucket].eoi += 1;
  }
  const sources = Object.entries(sourceCounts)
    .sort((a, b) => b[1].sessions - a[1].sessions)
    .map(([source, v]) => ({
      source,
      sessions: v.sessions,
      eoiSubmissions: v.eoi,
      eoiRate: pct(v.eoi, v.sessions),
    }));

  type OppAgg = {
    opportunityId: string;
    opportunityType: string;
    views: number;
    viewers: Set<string>;
    jobDetailOpens: number;
    packDownloads: number;
    packSessions: Set<string>;
    eoiStarts: number;
    eoiStartSessions: Set<string>;
    eoiSubmissions: number;
    eoiSessions: Set<string>;
    bySource: Record<
      string,
      { views: number; packDownloads: number; eois: number; viewers: Set<string> }
    >;
  };

  const oppMap = new Map<string, OppAgg>();
  function ensureOpp(id: string, type: string): OppAgg {
    let row = oppMap.get(id);
    if (!row) {
      row = {
        opportunityId: id,
        opportunityType: type,
        views: 0,
        viewers: new Set(),
        jobDetailOpens: 0,
        packDownloads: 0,
        packSessions: new Set(),
        eoiStarts: 0,
        eoiStartSessions: new Set(),
        eoiSubmissions: 0,
        eoiSessions: new Set(),
        bySource: {},
      };
      oppMap.set(id, row);
    } else if (type && type !== "GP role") {
      row.opportunityType = type;
    }
    return row;
  }

  function touchSource(row: OppAgg, e: AttractionEventRow, kind: "view" | "pack" | "eoi") {
    const bucket = sourceBucket(e);
    if (!row.bySource[bucket]) {
      row.bySource[bucket] = {
        views: 0,
        packDownloads: 0,
        eois: 0,
        viewers: new Set(),
      };
    }
    const src = row.bySource[bucket];
    if (kind === "view") {
      src.views += 1;
      src.viewers.add(e.anonymousSessionId);
    } else if (kind === "pack") {
      src.packDownloads += 1;
    } else {
      src.eois += 1;
    }
  }

  for (const e of events) {
    const meta = opportunityMeta(e);
    if (!meta) continue;
    const row = ensureOpp(meta.opportunityId, meta.opportunityType);

    if (e.name === "job_card_open" || e.name === "job_detail_view") {
      row.views += 1;
      row.viewers.add(e.anonymousSessionId);
      touchSource(row, e, "view");
      if (e.name === "job_detail_view") row.jobDetailOpens += 1;
    }
    if (e.name === "opportunity_to_pack") {
      row.packDownloads += 1;
      row.packSessions.add(e.anonymousSessionId);
      touchSource(row, e, "pack");
    }
    if (e.name === "opportunity_to_eoi") {
      row.eoiStarts += 1;
      row.eoiStartSessions.add(e.anonymousSessionId);
    }
    if (e.name === "opportunity_to_contact") {
      /* contact intent tracked in starts-adjacent KPIs only */
    }
  }

  /** Attribute EOI submits to opportunities visited in the same session. */
  for (const sid of eoi) {
    const opened = new Set<string>();
    for (const e of events) {
      if (e.anonymousSessionId !== sid) continue;
      const meta = opportunityMeta(e);
      if (!meta) continue;
      if (
        e.name === "job_card_open" ||
        e.name === "job_detail_view" ||
        e.name === "opportunity_to_eoi"
      ) {
        opened.add(meta.opportunityId);
      }
    }
    for (const oid of opened) {
      const row = oppMap.get(oid);
      if (!row) continue;
      row.eoiSubmissions += 1;
      row.eoiSessions.add(sid);
      const first = events.find(
        (e) => e.anonymousSessionId === sid && e.name === "eoi_submit",
      );
      if (first) touchSource(row, first, "eoi");
    }
  }

  const opportunityPerformance = [...oppMap.values()]
    .map((row) => {
      const uniqueViewers = row.viewers.size;
      const eoiSubmissions = row.eoiSessions.size;
      const conversionRate =
        uniqueViewers > 0 ? eoiSubmissions / uniqueViewers : 0;
      return {
        opportunityId: row.opportunityId,
        opportunityType: row.opportunityType,
        views: row.views,
        uniqueViewers,
        jobDetailOpens: row.jobDetailOpens,
        packDownloads: row.packDownloads,
        eoiStarts: row.eoiStarts || row.eoiStartSessions.size,
        eoiSubmissions,
        conversionToEoi: calculateOpportunityConversion(eoiSubmissions, uniqueViewers),
        conversionRate,
        sources: Object.entries(row.bySource)
          .sort((a, b) => b[1].views - a[1].views)
          .map(([source, v]) => ({
            source,
            views: v.views,
            packDownloads: v.packDownloads,
            eois: v.eois,
            conversion: calculateOpportunityConversion(
              v.eois,
              Math.max(v.viewers.size || v.views, 1),
            ),
          })),
      };
    })
    .sort(
      (a, b) =>
        b.conversionRate - a.conversionRate ||
        b.eoiSubmissions - a.eoiSubmissions ||
        b.views - a.views,
    );

  const contentOpportunities: Array<{
    id: string;
    priority: "high" | "medium" | "low";
    title: string;
    rationale: string;
  }> = [];

  const faqSessions = faq.size || faqPage.size;
  const faqToOppDrop = faqSessions
    ? Math.max(faqSessions - opp.size, 0) / faqSessions
    : 0;
  if (faqSessions >= 3 && faqToOppDrop > 0.5) {
    contentOpportunities.push({
      id: "faq-opportunities-leak",
      priority: faqToOppDrop > 0.75 ? "high" : "medium",
      title: "FAQ → Opportunities leakage",
      rationale: `${pct(Math.max(faqSessions - opp.size, 0), faqSessions)} drop before GP Opportunities (${leakageSeverity(faqToOppDrop)}). Surface fit/roles earlier after common questions.`,
    });
  }

  const oppToPackDrop = opp.size ? Math.max(opp.size - pack.size, 0) / opp.size : 0;
  if (opp.size >= 3 && oppToPackDrop > 0.5) {
    contentOpportunities.push({
      id: "opportunities-pack-leak",
      priority: oppToPackDrop > 0.75 ? "high" : "medium",
      title: "Opportunities → Pack leakage",
      rationale: `${pct(Math.max(opp.size - pack.size, 0), opp.size)} leave without Pages to keep (${leakageSeverity(oppToPackDrop)}). Add a same-page pack CTA on high-view roles.`,
    });
  }

  const packToEoi = [...pack].filter((s) => eoi.has(s)).length;
  const packToEoiDrop = pack.size ? Math.max(pack.size - packToEoi, 0) / pack.size : 0;
  if (pack.size >= 2 && packToEoiDrop > 0.5) {
    contentOpportunities.push({
      id: "pack-deferral",
      priority: packToEoiDrop > 0.75 ? "high" : "medium",
      title: "Pack → EOI leakage",
      rationale: `${pct(Math.max(pack.size - packToEoi, 0), pack.size)} pack sessions do not submit EOI (${leakageSeverity(packToEoiDrop)}). Add same-session Express Interest / call CTA after download.`,
    });
  }

  if (opp.size >= 3 && pack.size / Math.max(opp.size, 1) < 0.35 && pack.size >= 1) {
    contentOpportunities.push({
      id: "opp-content-gap-pack",
      priority: "medium",
      title: "Content gap — high opportunity interest, low pack downloads",
      rationale:
        "Opportunity page views outpace pack downloads — review role clarity and practitioner benefits before agency-style vacancy copy.",
    });
  }

  const joinToFaq = pct(faq.size, join.size);
  if (join.size >= 3 && faq.size / Math.max(join.size, 1) < 0.25) {
    contentOpportunities.push({
      id: "join-faq-drop",
      priority: "high",
      title: "Strengthen Join → FAQ path",
      rationale: `Only ${joinToFaq} of Join sessions open FAQ — surface top questions earlier on the hub.`,
    });
  }

  if (readinessStarts.size >= 3 && readiness.size / readinessStarts.size < 0.4) {
    contentOpportunities.push({
      id: "readiness-abandon",
      priority: "medium",
      title: "Readiness assessments abandoned",
      rationale: `${pct(readiness.size, readinessStarts.size)} complete rate — shorten or demote from primary path.`,
    });
  }

  if (topFaq[0] && topFaq[0].count >= 3) {
    contentOpportunities.push({
      id: `faq-expand-${topFaq[0].faqId}`,
      priority: "medium",
      title: `Expand FAQ: ${topFaq[0].label}`,
      rationale: `${topFaq[0].count} opens — ensure answer depth and link to Opportunities / EOI.`,
    });
  }

  for (const row of opportunityPerformance.slice(0, 6)) {
    const eoiRate = row.uniqueViewers ? row.eoiSubmissions / row.uniqueViewers : 0;
    const packRate = row.uniqueViewers ? row.packDownloads / row.uniqueViewers : 0;
    if (row.views >= 5 && row.uniqueViewers >= 2 && eoiRate < 0.25) {
      contentOpportunities.push({
        id: `opp-high-view-low-eoi-${row.opportunityId}`,
        priority: "high",
        title: `High GP interest but low conversion — ${row.opportunityType} viewed ${row.views} times with only ${row.eoiSubmissions} EOI(s)`,
        rationale:
          "Clarify fit language, pack CTA, or next-step wording on this role. Advisory only — no automated hiring action.",
      });
    }
    if (row.uniqueViewers >= 2 && packRate >= 0.5) {
      contentOpportunities.push({
        id: `opp-strong-intent-${row.opportunityId}`,
        priority: "low",
        title: `Strong intent detected — ${Math.round(packRate * 100)}% of ${row.opportunityType} viewers downloaded the pack`,
        rationale: "Reuse this role’s clarity and CTA placement on weaker opportunities.",
      });
    }
    const google = row.sources.find((s) => s.source === "Google");
    if (google && google.views >= 3 && google.packDownloads === 0) {
      contentOpportunities.push({
        id: `opp-google-low-pack-${row.opportunityId}`,
        priority: "medium",
        title: `${row.opportunityType} receives Google traffic but low pack downloads`,
        rationale:
          "Organic search viewers open the role but rarely keep pages — tighten pack CTA near role detail.",
      });
    }
  }

  if (opportunityPerformance.length >= 2) {
    const best = [...opportunityPerformance].sort((a, b) => {
      const ar = a.uniqueViewers ? a.eoiSubmissions / a.uniqueViewers : 0;
      const br = b.uniqueViewers ? b.eoiSubmissions / b.uniqueViewers : 0;
      return br - ar;
    })[0];
    if (best && best.eoiSubmissions > 0) {
      contentOpportunities.push({
        id: `opp-best-conversion-${best.opportunityId}`,
        priority: "low",
        title: `${best.opportunityType} has strongest Opportunities → EOI conversion`,
        rationale: `${best.conversionToEoi} conversion (${best.eoiSubmissions} EOI / ${best.uniqueViewers} viewers) — reuse its framing on weaker roles.`,
      });
    }
  }

  const peModuleEntries = Object.entries(moduleCounts);
  if (peModuleEntries.length >= 2) {
    const sorted = [...peModuleEntries].sort((a, b) => a[1] - b[1]);
    const weakest = sorted[0];
    if (weakest[1] * 3 < (sorted[sorted.length - 1]?.[1] || 0)) {
      contentOpportunities.push({
        id: `pe-weak-${weakest[0]}`,
        priority: "low",
        title: `Low PE engagement: ${weakest[0]}`,
        rationale: "Chapter under-viewed vs peers — review placement, length, or imagery.",
      });
    }
  }

  if (sessionPlannerStarts.size >= 2 && sessionPlanner.size === 0) {
    contentOpportunities.push({
      id: "session-planner-usage",
      priority: "low",
      title: "Session Planner viewed but not saved",
      rationale: "Confirm save CTA clarity; usage may be exploratory only.",
    });
  }

  if (providerStarts.size >= 2 && provider.size === 0) {
    contentOpportunities.push({
      id: "provider-incomplete",
      priority: "medium",
      title: "Provider readiness visits without completion",
      rationale: "Doctors open the page but do not save notes — clarify checklist value.",
    });
  }

  if (contentOpportunities.length === 0 && events.length > 0) {
    contentOpportunities.push({
      id: "baseline",
      priority: "low",
      title: "Collect more sessions before content bets",
      rationale: "Funnel volume is still thin — keep seeding/demo or wait for live traffic.",
    });
  }

  const overallConversion = pct(eoi.size, Math.max(join.size, opp.size, 1));
  const joinToOpportunity = pct(opp.size, join.size);
  const opportunityToEoiRate = calculateOpportunityConversion(eoi.size, opp.size);
  const opportunityViews = events.filter(
    (e) =>
      e.name === "gp_opportunities_view" ||
      e.name === "job_card_open" ||
      e.name === "job_detail_view",
  ).length;
  const uniqueOpportunityVisitors = opp.size;
  const totalOppPackDownloads = events.filter(
    (e) =>
      e.name === "pack_download" ||
      e.name === "opportunity_to_pack" ||
      (e.name === "cta_click" && e.ctaId === "opportunity_pack_download"),
  ).length;

  return {
    window: "28d",
    generatedAt: new Date().toISOString(),
    decisionNotice:
      "Advisory analytics only — no automated EOI, hire, scoring, ranking, or content-publish decisions.",
    kpis: {
      joinOurTeamVisits: events.filter(
        (e) => e.name === "page_view" && e.surface === "join_our_team",
      ).length,
      joinOurTeamSessions: join.size,
      faqOpens: events.filter((e) => e.name === "faq_open").length,
      faqSessions: faq.size,
      readinessCompletions: readiness.size,
      readinessStarts: readinessStarts.size,
      sessionPlannerCompletions: sessionPlanner.size,
      sessionPlannerStarts: sessionPlannerStarts.size,
      providerReadinessCompletions: provider.size,
      providerReadinessStarts: providerStarts.size,
      practiceExperienceSessions: pe.size,
      practiceExperienceModuleViews: events.filter((e) => e.name === "module_view").length,
      opportunityPackDownloads: totalOppPackDownloads,
      eoiStarts: eoiStart.size,
      eoiSubmissions: eoi.size,
      opportunitiesVisits: uniqueOpportunityVisitors,
      opportunityViews,
      uniqueOpportunityVisitors,
      jobCardOpens: events.filter((e) => e.name === "job_card_open").length,
      jobDetailViews: events.filter((e) => e.name === "job_detail_view").length,
      opportunityToEoi: events.filter((e) => e.name === "opportunity_to_eoi").length,
      joinToOpportunity,
      opportunityToEoiRate,
      pathEdges: events.filter((e) => e.name === "path_edge").length,
      overallJoinToEoi: overallConversion,
    },
    funnel,
    dropOff,
    toolFunnel,
    topFaq,
    peModules: Object.entries(moduleCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([moduleId, count]) => ({ moduleId, count })),
    topPaths,
    sources,
    opportunityPerformance,
    contentOpportunities,
  };
}
