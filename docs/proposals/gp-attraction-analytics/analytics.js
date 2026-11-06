/**
 * GP Attraction Analytics — dashboard aggregations (client)
 */
(() => {
  "use strict";

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

  function aggregate(events, catalogue) {
    const opp = sessionsWith(events, (e) => e.name === "page_view" && e.surface === "gp_opportunities");
    const faq = sessionsWith(events, (e) => e.name === "faq_open");
    const readiness = sessionsWith(events, (e) => e.name === "tool_complete" && e.toolId === "doctor-readiness");
    const provider = sessionsWith(events, (e) => e.name === "tool_complete" && e.toolId === "provider-number-readiness");
    const planner = sessionsWith(events, (e) => e.name === "tool_complete" && e.toolId === "gp-session-planner");
    const eoi = sessionsWith(events, (e) => e.name === "eoi_submit");

    const funnel = [
      { id: "opportunities_visit", label: "Opportunities visits", sessions: opp.size },
      { id: "faq_engagement", label: "FAQ engagement", sessions: [...faq].filter((s) => opp.has(s)).length || faq.size },
      { id: "readiness_complete", label: "Readiness complete", sessions: readiness.size },
      { id: "provider_readiness_complete", label: "Provider-readiness complete", sessions: provider.size },
      { id: "session_planner_complete", label: "Session-planner complete", sessions: planner.size },
      { id: "eoi_submit", label: "EOI submissions", sessions: eoi.size },
    ];

    // Prefer funnel as nested within opportunity sessions where sensible
    funnel[1].sessions = [...faq].filter((s) => opp.has(s)).length;
    funnel[2].sessions = [...readiness].filter((s) => opp.has(s)).length;
    funnel[3].sessions = [...provider].filter((s) => opp.has(s)).length;
    funnel[4].sessions = [...planner].filter((s) => opp.has(s)).length;
    funnel[5].sessions = [...eoi].filter((s) => opp.has(s)).length;

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
        dropOff: pct(prev - cur, prev),
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
          abandonLast[e.lastStepId || "unknown"] = (abandonLast[e.lastStepId || "unknown"] || 0) + 1;
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

    // High-value paths: among EOI sessions, reconstruct simple surface sequences from path_edge + completes
    const pathCounts = {};
    const eoiList = [...eoi];
    for (const sid of eoiList) {
      const edges = events
        .filter((e) => e.anonymousSessionId === sid && e.name === "path_edge")
        .sort((a, b) => String(a.occurredAt).localeCompare(String(b.occurredAt)));
      let path = "gp_opportunities";
      for (const edge of edges) {
        if (edge.toSurface) path += ` → ${edge.toSurface}`;
      }
      if (!edges.length) {
        const completes = events.filter((e) => e.anonymousSessionId === sid && e.name === "tool_complete");
        path = "gp_opportunities";
        if (completes.some((c) => c.toolId === "doctor-readiness")) path += " → doctor_readiness";
        if (completes.some((c) => c.toolId === "provider-number-readiness")) path += " → provider_readiness";
        path += " → gp_eoi";
      } else {
        path += " → gp_eoi";
      }
      pathCounts[path] = (pathCounts[path] || 0) + 1;
    }
    const topPaths = Object.entries(pathCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([path, eoiSessions]) => ({
        path,
        eoiSessions,
        lift: (eoiSessions / Math.max(eoiList.length, 1) / Math.max(funnel[5].sessions / Math.max(opp.size, 1), 0.0001)).toFixed(2),
      }));

    const personaStats = {};
    for (const hint of catalogue.personaHints || Object.keys(PERSONA_LABELS)) {
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

    const kpis = {
      opportunitiesVisits: events.filter((e) => e.name === "page_view" && e.surface === "gp_opportunities").length,
      opportunitiesSessions: opp.size,
      faqEngagement: events.filter((e) => e.name === "faq_open").length,
      readinessCompletions: readiness.size,
      providerReadinessCompletions: provider.size,
      sessionPlannerCompletions: planner.size,
      eoiSubmissions: eoi.size,
      overallConversion: pct(funnel[5].sessions, opp.size),
    };

    return { kpis, funnel, dropOff, topFaq, toolStats, topPaths, personaStats };
  }

  function barWidth(value, max) {
    if (!max) return "0%";
    return `${Math.max(4, Math.round((100 * value) / max))}%`;
  }

  function render(data) {
    const kpiRoot = document.getElementById("kpi-row");
    const funnelRoot = document.getElementById("funnel-root");
    const dropRoot = document.getElementById("dropoff-root");
    const faqRoot = document.getElementById("faq-root");
    const pathRoot = document.getElementById("path-root");
    const personaRoot = document.getElementById("persona-root");
    const toolRoot = document.getElementById("tool-root");
    const live = document.getElementById("dash-live");

    const { kpis, funnel, dropOff, topFaq, toolStats, topPaths, personaStats } = data;
    const maxFunnel = funnel[0]?.sessions || 1;

    kpiRoot.innerHTML = [
      ["Opportunities visits", kpis.opportunitiesVisits],
      ["FAQ opens", kpis.faqEngagement],
      ["Readiness done", kpis.readinessCompletions],
      ["Provider-readiness", kpis.providerReadinessCompletions],
      ["Session planner", kpis.sessionPlannerCompletions],
      ["EOI submissions", kpis.eoiSubmissions],
    ]
      .map(
        ([label, value]) => `<div class="rounded-xl border border-line bg-white p-4">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">${label}</p>
          <p class="mt-1 font-display text-2xl font-bold">${value}</p>
        </div>`
      )
      .join("");

    funnelRoot.innerHTML = funnel
      .map(
        (step, i) => `<div class="flex items-center gap-3">
          <div class="w-40 shrink-0 text-sm font-medium">${step.label}</div>
          <div class="h-8 flex-1 rounded-full bg-mist">
            <div class="flex h-8 items-center rounded-full bg-navy px-3 text-xs font-semibold text-white" style="width:${barWidth(step.sessions, maxFunnel)}">${step.sessions}</div>
          </div>
          ${i ? `<div class="w-16 text-right text-xs text-ink-soft">${pct(step.sessions, funnel[i - 1].sessions)}</div>` : `<div class="w-16 text-right text-xs text-ink-soft">base</div>`}
        </div>`
      )
      .join("");

    dropRoot.innerHTML = `<table class="w-full text-left text-sm">
      <thead><tr class="text-xs uppercase tracking-wide text-ink-soft"><th class="py-2">Stage</th><th>Conv.</th><th>Drop-off</th></tr></thead>
      <tbody>${dropOff
        .map(
          (d) => `<tr class="border-t border-line"><td class="py-2 pr-2">${d.from} → ${d.to}</td><td>${d.conversion}</td><td class="text-amber">${d.dropOff}</td></tr>`
        )
        .join("")}</tbody></table>
      <p class="mt-3 text-sm text-ink-soft">Overall opportunities → EOI: <strong class="text-ink">${kpis.overallConversion}</strong></p>`;

    faqRoot.innerHTML = topFaq
      .map(
        (f) => `<li class="flex justify-between gap-3 border-b border-line py-2 text-sm"><span>${f.faqId}</span><span class="font-semibold">${f.count}</span></li>`
      )
      .join("");

    pathRoot.innerHTML = topPaths
      .map(
        (p) => `<li class="rounded-xl border border-line bg-mist/50 p-3 text-sm">
          <p class="font-medium leading-snug">${p.path}</p>
          <p class="mt-1 text-xs text-ink-soft">${p.eoiSessions} EOI sessions · relative share index ${p.lift}</p>
        </li>`
      )
      .join("");

    const personaRows = Object.entries(personaStats)
      .filter(([, v]) => v.opportunitySessions >= 5 || v.opportunitySessions > 0)
      .sort((a, b) => b[1].opportunitySessions - a[1].opportunitySessions);
    personaRoot.innerHTML = `<table class="w-full text-left text-sm">
      <thead><tr class="text-xs uppercase tracking-wide text-ink-soft"><th class="py-2">Persona hint</th><th>Sessions</th><th>Readiness</th><th>EOI</th><th>Conv.</th></tr></thead>
      <tbody>${personaRows
        .map(
          ([, v]) => `<tr class="border-t border-line"><td class="py-2">${v.label}</td><td>${v.opportunitySessions}</td><td>${v.readinessCompletions}</td><td>${v.eoiSubmissions}</td><td>${v.conversion}</td></tr>`
        )
        .join("")}</tbody></table>
      <p class="mt-2 text-xs text-ink-soft">Persona is a hint / self-select label — not a verified identity. Suppress tiny cells in production (&lt;5).</p>`;

    toolRoot.innerHTML = toolStats
      .map(
        (t) => `<div class="rounded-xl border border-line p-3 text-sm">
          <p class="font-semibold">${t.toolId}</p>
          <p class="mt-1 text-ink-soft">Started ${t.started} · Completed ${t.completed} · Abandon ${t.abandonRate}</p>
          ${t.lastSteps.length ? `<p class="mt-1 text-xs">Abandon steps: ${t.lastSteps.map((s) => `${s.step} (${s.count})`).join(", ")}</p>` : ""}
        </div>`
      )
      .join("");

    if (live) live.textContent = `Dashboard updated. ${kpis.opportunitiesSessions} opportunity sessions in window.`;
  }

  async function init() {
    const root = document.getElementById("dashboard-main");
    try {
      const [sumRes, catRes] = await Promise.all([
        fetch("/api/summary?window=28d"),
        fetch("/api/metrics-catalogue"),
      ]);
      const summary = await sumRes.json();
      const catalogue = await catRes.json();
      // Prefer server summary if present; else aggregate raw
      if (summary.kpis) {
        render(summary);
      } else {
        const evRes = await fetch("/api/events");
        const events = await evRes.json();
        render(aggregate(events, catalogue));
      }
      root?.setAttribute("aria-busy", "false");
    } catch (err) {
      const kpi = document.getElementById("kpi-row");
      if (kpi) {
        kpi.innerHTML = `<p class="text-sm text-red-700" role="alert">Start server: node server.mjs — ${String(err.message || err)}</p>`;
      }
    }
  }

  // Expose aggregate for server-side reuse via duplication; client init only
  window.__gpAttractionAggregate = aggregate;
  init();
})();
