(() => {
  "use strict";

  function esc(v) {
    return String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function statusChip(status) {
    const cls =
      status === "available"
        ? "bg-green/10 text-green border-green/30"
        : status === "limited"
          ? "bg-amber-50 text-amber border-amber/40"
          : "bg-mist text-ink-soft border-line";
    return `<span class="inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cls}">${esc(status)}</span>`;
  }

  function render(plan) {
    document.getElementById("notice").textContent = plan.notice;
    const c = plan.currentGpCapacity;
    document.getElementById("kpi-row").innerHTML = [
      ["Active GPs", c.activeGpCount],
      ["Offered sessions", c.offeredSessions],
      ["Used sessions", c.usedSessions],
      ["Available", c.availableSessions],
      ["Utilisation", `${c.utilisationPercent}%`],
      ["Reserve held", c.reserveSessions],
    ]
      .map(
        ([label, value]) => `<div class="rounded-xl border border-line bg-white p-4">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">${label}</p>
          <p class="mt-1 font-display text-2xl font-bold">${value}</p>
        </div>`
      )
      .join("");

    const avail = plan.availableSessions;
    document.getElementById("available-root").innerHTML = `
      <p class="text-sm">Total available after reserve: <strong class="font-display text-2xl text-navy">${avail.total}</strong></p>
      <ul class="mt-3 max-h-64 space-y-2 overflow-y-auto">${(avail.windows || [])
        .map(
          (w) => `<li class="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2 text-sm">
            <span>${esc(w.label)}</span>
            <span>${statusChip(w.status)} <span class="text-ink-soft">free ${w.free}</span></span>
          </li>`
        )
        .join("")}</ul>`;

    const t = plan.recruitmentTargets;
    document.getElementById("recruit-root").innerHTML = `
      <p class="font-display text-4xl font-bold text-navy">${t.recommendedGpCount}</p>
      <p class="mt-1 text-sm text-ink-soft">Recommended GP targets (advisory)</p>
      <p class="mt-3 text-sm">${esc(t.basis)}</p>
      <p class="mt-2 text-sm">Aligned priority/strong EOIs: <strong>${t.alignedPriorityEois}</strong></p>
      <p class="mt-2 text-xs text-ink-soft">${esc(t.note)}</p>`;

    const eoi = plan.eoiPipeline;
    document.getElementById("eoi-root").innerHTML = `
      <p class="text-sm"><strong>${eoi.total}</strong> enquiries · <strong>${eoi.priorityOrStrong}</strong> priority/strong · <strong>${eoi.hardFlagged}</strong> hard-flagged</p>
      <ul class="mt-3 space-y-2">${(eoi.items || [])
        .slice(0, 6)
        .map(
          (i) => `<li class="rounded-lg border border-line px-3 py-2 text-sm">
            <div class="flex justify-between gap-2"><span class="font-medium">${esc(i.name)}</span><span class="font-display font-bold text-navy">${i.priorityScore}</span></div>
            <p class="mt-1 text-xs text-ink-soft">${esc(i.status)} · ${esc(i.scoreBand)}${(i.hardFlags || []).length ? " · flags" : ""}</p>
          </li>`
        )
        .join("")}</ul>
      <p class="mt-2 text-xs"><a class="text-navy underline-offset-2 hover:underline" href="${esc(plan.links.gpEnquiries)}">Open enquiries dashboard</a></p>`;

    const onb = plan.onboardingPipeline;
    document.getElementById("onb-root").innerHTML = `
      <p class="text-sm"><strong>${onb.total}</strong> cases · <strong>${onb.awaitingExternal}</strong> awaiting external</p>
      <ul class="mt-3 space-y-2">${(onb.items || [])
        .map(
          (i) => `<li class="rounded-lg border border-line px-3 py-2 text-sm">
            <span class="font-medium">${esc(i.name)}</span>
            <p class="mt-1 text-xs text-ink-soft">${esc(i.status)} · ${esc(i.stage)}</p>
          </li>`
        )
        .join("")}</ul>
      <p class="mt-2 text-xs"><a class="text-navy underline-offset-2 hover:underline" href="${esc(plan.links.onboarding)}">Open onboarding</a></p>`;

    document.getElementById("forecast-root").innerHTML = `<table class="w-full text-left text-sm">
      <thead><tr class="text-xs uppercase tracking-wide text-ink-soft"><th class="py-2">Horizon</th><th>Demand</th><th>Offered</th><th>Shortage</th><th>Implied GPs</th></tr></thead>
      <tbody>${(plan.capacityForecasts || [])
        .map(
          (f) => `<tr class="border-t border-line"><td class="py-2">${f.horizonWeeks}w (${esc(f.scenario)})</td><td>${f.demandSessions}</td><td>${f.offeredSessions}</td><td class="${f.shortageSessions > 0 ? "text-amber font-semibold" : ""}">${f.shortageSessions}</td><td>${f.impliedAdditionalGps}</td></tr>`
        )
        .join("")}</tbody></table>
      <p class="mt-2 text-xs text-ink-soft">Forecast shortages: ${(plan.forecastShortages || []).length ? (plan.forecastShortages || []).map((f) => esc(f.label)).join(" · ") : "None under this scenario"}</p>`;

    document.getElementById("gaps-root").innerHTML =
      (plan.priorityGaps || [])
        .map(
          (g) => `<article class="mb-2 rounded-xl border border-line p-3">
            <p class="text-sm font-semibold">${esc(g.label)} <span class="text-xs font-normal text-ink-soft">(${esc(g.severity)})</span></p>
            <p class="mt-1 text-xs text-ink-soft">${esc(g.detail)}</p>
          </article>`
        )
        .join("") || `<p class="text-sm text-ink-soft">No priority gaps flagged.</p>`;

    document.getElementById("rec-root").innerHTML = (plan.recruitmentRecommendations || [])
      .map(
        (r) => `<article class="mb-3 rounded-xl border border-line p-3">
          <p class="text-sm font-semibold">${esc(r.title)}</p>
          <p class="mt-1 text-xs text-ink-soft">${esc(r.rationale)}</p>
          <p class="mt-2 text-xs"><strong>Human action:</strong> ${esc(r.suggestedHumanAction)}</p>
          <button type="button" class="mt-2 text-xs font-semibold text-navy underline-offset-2 hover:underline" data-rec="${esc(r.id)}">Use ${esc(r.id)}</button>
        </article>`
      )
      .join("");

    document.getElementById("util-root").innerHTML = (plan.roomUtilisation || [])
      .map(
        (w) => `<div class="rounded-lg border border-line p-2 text-xs">
          <p class="font-semibold">${esc(w.label)}</p>
          <p class="mt-1">${statusChip(w.status)}</p>
          <p class="mt-1 text-ink-soft">${w.used}/${w.offered} · ${w.utilisationPercent}%</p>
        </div>`
      )
      .join("");

    const firstRec = plan.recruitmentRecommendations?.[0]?.id;
    if (firstRec) document.getElementById("rec-id").value = firstRec;
    document.getElementById("dashboard").setAttribute("aria-busy", "false");
    document.getElementById("live").textContent = `Plan refreshed. Available sessions ${avail.total}. Recruitment target ${t.recommendedGpCount}.`;
  }

  async function loadPlan() {
    const scenario = document.getElementById("scenario").value;
    const res = await fetch(`/api/plan?scenario=${encodeURIComponent(scenario)}`);
    const plan = await res.json();
    render(plan);
  }

  async function loadDecisions() {
    const res = await fetch("/api/decisions");
    const data = await res.json();
    const root = document.getElementById("decisions-list");
    root.innerHTML =
      (data.items || [])
        .slice(0, 5)
        .map(
          (d) => `<p class="border-t border-line py-2 text-xs text-ink-soft"><strong class="text-ink">${esc(d.decisionType)}</strong> · ${esc(d.recommendationId || "—")} — ${esc(d.rationale)} <span>(${esc(d.actorName)})</span></p>`
        )
        .join("") || `<p class="text-xs text-ink-soft">No decisions recorded yet.</p>`;
  }

  document.getElementById("scenario")?.addEventListener("change", () => loadPlan());
  document.getElementById("rec-root")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-rec]");
    if (btn) document.getElementById("rec-id").value = btn.getAttribute("data-rec");
  });
  document.getElementById("decision-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const msg = document.getElementById("decision-msg");
    const res = await fetch("/api/decisions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        actorUserId: "pm_01",
        actorName: "Practice Manager",
        decisionType: form.decisionType.value,
        recommendationId: form.recommendationId.value || null,
        rationale: form.rationale.value.trim(),
      }),
    });
    const data = await res.json();
    msg.textContent = res.ok ? data.notice || "Saved." : data.error || "Failed";
    msg.className = `text-sm sm:col-span-2 ${res.ok ? "text-green" : "text-red-700"}`;
    if (res.ok) {
      form.rationale.value = "";
      loadDecisions();
    }
  });

  Promise.all([loadPlan(), loadDecisions()]).catch((err) => {
    document.getElementById("notice").textContent = `Start node server.mjs — ${err.message}`;
  });
})();
