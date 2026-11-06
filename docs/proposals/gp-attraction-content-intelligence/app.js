(() => {
  "use strict";

  function esc(v) {
    return String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function pillarChip(pillar) {
    const map = {
      community_care: "border-green/30 text-green",
      continuity_of_care: "border-navy/30 text-navy",
      gp_employer_brand: "border-amber/40 text-amber",
    };
    const label = { community_care: "Community", continuity_of_care: "Continuity", gp_employer_brand: "Employer brand" }[pillar] || pillar;
    return `<span class="inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${map[pillar] || "border-line text-ink-soft"}">${esc(label)}</span>`;
  }

  function render(data) {
    document.getElementById("notice").textContent = data.notice;
    const h = data.highlights || {};
    document.getElementById("highlights").innerHTML = [
      ["Top converting page", h.topConvertingPage ? `${h.topConvertingPage.path} · ${h.topConvertingPage.conversionRate}%` : "—"],
      ["Top EOI source", h.topEoiSource ? `${h.topEoiSource.label} (${h.topEoiSource.submissions})` : "—"],
      ["Top FAQ", h.topFaq ? `${h.topFaq.faqId} · ${h.topFaq.opens} opens` : "—"],
      ["Top content gap", h.topContentGap ? h.topContentGap.title : "—"],
    ]
      .map(
        ([k, v]) => `<div class="rounded-xl border border-line bg-white p-4"><p class="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">${esc(k)}</p><p class="mt-1 text-sm font-medium leading-snug">${esc(v)}</p></div>`
      )
      .join("");

    document.getElementById("gaps-root").innerHTML = (data.contentGaps || [])
      .map(
        (g) => `<article class="rounded-xl border border-line p-3"><div class="flex flex-wrap items-start justify-between gap-2"><p class="text-sm font-semibold">${esc(g.title)}</p>${pillarChip(g.pillar)}</div><p class="mt-1 text-xs text-ink-soft">${esc(g.evidence)}</p><p class="mt-1 text-xs"><strong>Doctor need:</strong> ${esc(g.doctorNeed)}</p></article>`
      )
      .join("");

    document.getElementById("unanswered-root").innerHTML = (data.unansweredQuestions || [])
      .slice(0, 8)
      .map(
        (q) => `<article class="rounded-xl border border-line p-3 text-sm"><p class="font-medium">${esc(q.question)}</p><p class="mt-1 text-xs text-ink-soft">${esc(q.evidence)} · demand ${q.demand}</p><p class="mt-1">${pillarChip(q.pillar)}</p></article>`
      )
      .join("");

    document.getElementById("convert-root").innerHTML = `<table class="w-full text-left text-sm"><thead><tr class="text-xs uppercase tracking-wide text-ink-soft"><th class="py-2">Page</th><th>Sessions</th><th>EOI</th><th>Conv.</th><th>Top persona</th></tr></thead><tbody>${(
      data.highConvertingPages || []
    )
      .map(
        (p) => `<tr class="border-t border-line"><td class="py-2">${esc(p.path)}</td><td>${p.sessions}</td><td>${p.eoiSessions}</td><td class="font-semibold text-navy">${p.conversionRate}%</td><td class="text-xs">${esc(p.personaTop)}</td></tr>`
      )
      .join("")}</tbody></table>`;

    document.getElementById("monthly-root").innerHTML = (data.monthlyContentRecommendations || [])
      .map(
        (r) => `<article class="rounded-xl border border-line p-4">
          <div class="flex flex-wrap items-start justify-between gap-2">
            <p class="font-semibold">${esc(r.title)}</p>
            <span class="text-[11px] font-semibold uppercase text-ink-soft">${esc(r.priority)} · ${esc(r.type)}</span>
          </div>
          <p class="mt-1">${pillarChip(r.pillar)}</p>
          <p class="mt-2 text-sm text-ink-soft">${esc(r.rationale)}</p>
          <p class="mt-2 text-xs"><strong>Target:</strong> ${esc(r.targetPath)}</p>
          <p class="mt-1 text-xs"><strong>This month:</strong> ${esc(r.monthAction)}</p>
          ${r.suggestedCopy ? `<p class="mt-2 rounded-lg bg-mist px-3 py-2 text-xs leading-relaxed">${esc(r.suggestedCopy)}</p>` : ""}
          <button type="button" class="mt-2 text-xs font-semibold text-navy underline-offset-2 hover:underline" data-rec="${esc(r.id)}">Select ${esc(r.id)}</button>
        </article>`
      )
      .join("");

    document.getElementById("seo-root").innerHTML = `<table class="w-full text-left text-sm"><thead><tr class="text-xs uppercase tracking-wide text-ink-soft"><th class="py-2">Query</th><th>Imp.</th><th>Pos.</th><th>Opportunity</th></tr></thead><tbody>${(
      data.seoOpportunities || []
    )
      .slice(0, 8)
      .map(
        (s) => `<tr class="border-t border-line"><td class="py-2 pr-2">${esc(s.query)}</td><td>${s.impressions}</td><td>${s.position}</td><td class="text-xs">${esc(s.recommendation)}</td></tr>`
      )
      .join("")}</tbody></table>`;

    document.getElementById("info-root").innerHTML = (data.doctorInformationGaps || [])
      .map(
        (g) => `<article class="rounded-xl border border-line p-3 text-sm"><p class="font-semibold">${esc(g.title)}</p><p class="mt-1">${pillarChip(g.pillar)}</p><p class="mt-1 text-xs text-ink-soft">${esc(g.whyItMatters)}</p></article>`
      )
      .join("");

    const eoi = (data.analysis?.eoiSources || [])
      .map((s) => `<li class="flex justify-between border-b border-line py-1 text-sm"><span>${esc(s.label)}</span><strong>${s.submissions}</strong></li>`)
      .join("");
    const personas = (data.analysis?.personaEngagement || [])
      .map(
        (p) => `<li class="mt-2 rounded-lg border border-line p-2 text-xs"><strong>${esc(p.label)}</strong> · sessions ${p.sessions} · EOI rate ${(p.eoiRate * 100).toFixed(0)}%<br/>FAQs: ${esc((p.topFaqs || []).join(", "))}</li>`
      )
      .join("");
    document.getElementById("sources-root").innerHTML = `<p class="text-xs font-semibold uppercase tracking-wide text-ink-soft">EOI sources</p><ul class="mt-1">${eoi}</ul><p class="mt-4 text-xs font-semibold uppercase tracking-wide text-ink-soft">Persona engagement</p><ul>${personas}</ul>`;

    const first = data.monthlyContentRecommendations?.[0]?.id;
    if (first) document.getElementById("rec-id").value = first;
    document.getElementById("main").setAttribute("aria-busy", "false");
  }

  document.getElementById("monthly-root")?.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-rec]");
    if (btn) document.getElementById("rec-id").value = btn.getAttribute("data-rec");
  });

  document.getElementById("decision-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const msg = document.getElementById("decision-msg");
    const res = await fetch("/api/recommendations/decision", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        recommendationId: form.recommendationId.value.trim(),
        decision: form.decision.value,
        editorUserId: "editor_01",
        editorName: "Practice content lead",
        rationale: form.rationale.value.trim(),
      }),
    });
    const data = await res.json();
    msg.textContent = res.ok ? data.notice : data.error || "Failed";
    msg.className = `text-sm ${res.ok ? "text-green" : "text-red-700"}`;
  });

  fetch("/api/insights")
    .then((r) => r.json())
    .then(render)
    .catch((err) => {
      document.getElementById("notice").textContent = `Start node server.mjs — ${err.message}`;
    });
})();
