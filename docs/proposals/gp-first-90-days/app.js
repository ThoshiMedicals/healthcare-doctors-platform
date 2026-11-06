(() => {
  "use strict";

  const PHASE_LABELS = {
    day1: "Day 1",
    week1: "Week 1",
    month1: "Month 1",
    month2: "Month 2",
    month3: "Month 3",
  };

  const THEME_LABELS = {
    patient_list_building: "Patient list building",
    nursing_integration: "Nursing integration",
    systems_adoption: "Systems adoption",
    community_introductions: "Community introductions",
    session_expansion: "Session expansion",
  };

  const STORAGE_KEY = "wmc-gp-first-90-checklist-v1";

  /** @type {any} */
  let fw = null;

  const $ = (id) => document.getElementById(id);

  function loadChecks() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function saveChecks(map) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  }

  function setTab(tab) {
    document.querySelectorAll("[data-tab]").forEach((btn) => {
      const on = btn.getAttribute("data-tab") === tab;
      btn.setAttribute("aria-selected", on ? "true" : "false");
      btn.classList.toggle("is-active", on);
    });
    document.querySelectorAll("[data-panel]").forEach((panel) => {
      const on = panel.getAttribute("data-panel") === tab;
      panel.classList.toggle("hidden", !on);
      panel.hidden = !on;
    });
  }

  function renderGuide(guideKey, rootId) {
    const root = $(rootId);
    if (!root || !fw) return;
    const guide = fw[guideKey];
    root.innerHTML = fw.phases
      .map((p) => {
        const items = (guide[p.id] || [])
          .map((t) => `<li class="leading-relaxed">${escape(t)}</li>`)
          .join("");
        return `
          <article class="rounded-2xl border border-line bg-white p-5">
            <p class="text-xs font-semibold uppercase tracking-[0.14em] text-green">${escape(p.label)}</p>
            <h3 class="mt-1 font-display text-xl font-bold">${escape(p.theme)}</h3>
            <p class="mt-1 text-sm text-ink-soft">${escape(p.outcome)}</p>
            <ul class="mt-4 list-disc space-y-2 pl-5 text-sm text-ink-soft">${items}</ul>
          </article>`;
      })
      .join("");
  }

  function escape(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderChecklist() {
    const root = $("checklist-root");
    if (!root || !fw) return;
    const checks = loadChecks();
    const filterOwner = /** @type {HTMLSelectElement} */ ($("checklist-owner")).value;
    const filterPhase = /** @type {HTMLSelectElement} */ ($("checklist-phase")).value;

    const items = fw.checklist.filter((c) => {
      if (filterOwner !== "all" && c.owner !== filterOwner) return false;
      if (filterPhase !== "all" && c.phase !== filterPhase) return false;
      return true;
    });

    const done = items.filter((c) => checks[c.id]).length;
    $("checklist-progress").textContent = `${done} / ${items.length} complete`;

    root.innerHTML = items
      .map((c) => {
        const on = !!checks[c.id];
        return `
          <label class="flex gap-3 rounded-xl border border-line bg-white p-3 has-[:checked]:border-navy/40 has-[:checked]:bg-mist/60">
            <input type="checkbox" class="mt-1 h-5 w-5 shrink-0" data-check-id="${escape(c.id)}" ${on ? "checked" : ""} />
            <span class="min-w-0">
              <span class="flex flex-wrap items-center gap-2">
                <span class="text-xs font-semibold uppercase tracking-wide text-green">${escape(PHASE_LABELS[c.phase])}</span>
                <span class="rounded-full bg-mist px-2 py-0.5 text-[11px] font-medium text-navy">${escape(c.owner)}</span>
                <span class="rounded-full border border-line px-2 py-0.5 text-[11px] text-ink-soft">${escape(THEME_LABELS[c.theme] || c.theme)}</span>
              </span>
              <span class="mt-1 block text-sm font-medium text-ink">${escape(c.item)}</span>
            </span>
          </label>`;
      })
      .join("");

    root.querySelectorAll("[data-check-id]").forEach((el) => {
      el.addEventListener("change", () => {
        const id = el.getAttribute("data-check-id");
        const map = loadChecks();
        if (el instanceof HTMLInputElement && el.checked) map[id] = true;
        else delete map[id];
        saveChecks(map);
        renderChecklist();
        renderMetricsDemo();
      });
    });
  }

  function renderMetrics() {
    const root = $("metrics-root");
    if (!root || !fw) return;
    root.innerHTML = `
      <div class="overflow-x-auto rounded-2xl border border-line bg-white">
        <table class="min-w-full text-left text-sm">
          <thead class="bg-mist/80 text-xs uppercase tracking-wide text-ink-soft">
            <tr>
              <th class="px-4 py-3 font-semibold">Metric</th>
              <th class="px-4 py-3 font-semibold">Unit</th>
              <th class="px-4 py-3 font-semibold">Cadence</th>
              <th class="px-4 py-3 font-semibold">Theme</th>
              <th class="px-4 py-3 font-semibold">Guidance</th>
            </tr>
          </thead>
          <tbody>
            ${fw.metrics
              .map(
                (m) => `
              <tr class="border-t border-line align-top">
                <td class="px-4 py-3 font-medium text-ink">${escape(m.label)}</td>
                <td class="px-4 py-3 text-ink-soft">${escape(m.unit)}</td>
                <td class="px-4 py-3 text-ink-soft">${escape(m.cadence)}</td>
                <td class="px-4 py-3 text-ink-soft">${escape(THEME_LABELS[m.theme] || m.theme)}</td>
                <td class="px-4 py-3 text-ink-soft">${escape(m.guidance)}</td>
              </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>`;
    renderMetricsDemo();
  }

  function renderMetricsDemo() {
    const root = $("metrics-demo");
    if (!root || !fw) return;
    const checks = loadChecks();
    const total = fw.checklist.length;
    const done = fw.checklist.filter((c) => checks[c.id]).length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    const phaseDone = fw.phases.map((p) => {
      const items = fw.checklist.filter((c) => c.phase === p.id);
      const d = items.filter((c) => checks[c.id]).length;
      return { label: p.label, d, t: items.length };
    });

    root.innerHTML = `
      <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-2xl border border-line bg-white p-4">
          <p class="text-xs font-semibold uppercase tracking-wide text-ink-soft">Checklist completion</p>
          <p class="mt-2 font-display text-3xl font-bold text-navy">${pct}%</p>
          <p class="mt-1 text-xs text-ink-soft">${done} of ${total} items</p>
        </div>
        <div class="rounded-2xl border border-line bg-white p-4">
          <p class="text-xs font-semibold uppercase tracking-wide text-ink-soft">Settling stage (proxy)</p>
          <p class="mt-2 font-display text-xl font-bold text-ink">${escape(inferStage(phaseDone))}</p>
          <p class="mt-1 text-xs text-ink-soft">Based on checklist progress locally</p>
        </div>
        <div class="rounded-2xl border border-line bg-white p-4 sm:col-span-2">
          <p class="text-xs font-semibold uppercase tracking-wide text-ink-soft">Phase checklist progress</p>
          <ul class="mt-3 space-y-2">
            ${phaseDone
              .map((p) => {
                const w = p.t ? Math.round((p.d / p.t) * 100) : 0;
                return `<li>
                  <div class="mb-1 flex justify-between text-xs"><span>${escape(p.label)}</span><span>${p.d}/${p.t}</span></div>
                  <div class="h-2 overflow-hidden rounded-full bg-line"><div class="h-full rounded-full bg-navy" style="width:${w}%"></div></div>
                </li>`;
              })
              .join("")}
          </ul>
        </div>
      </div>
      <p class="mt-3 text-xs text-ink-soft">Demo widgets only — wire to live sessions, return rates, nursing assists, and inbox lag in production.</p>`;
  }

  function inferStage(phaseDone) {
    for (let i = 0; i < phaseDone.length; i++) {
      const p = phaseDone[i];
      if (p.d < p.t) return p.label;
    }
    return "BAU / review complete";
  }

  function exportChecklist() {
    const checks = loadChecks();
    const payload = {
      formType: "gp_first_90_days_checklist",
      version: fw.version,
      exportedAt: new Date().toISOString(),
      completedIds: Object.keys(checks).filter((k) => checks[k]),
      items: fw.checklist.map((c) => ({
        ...c,
        done: !!checks[c.id],
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `wmc-gp-first-90-checklist-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function init() {
    try {
      const res = await fetch("./framework.json", { cache: "no-store" });
      if (!res.ok) throw new Error("load failed");
      fw = await res.json();
    } catch {
      $("app-error").hidden = false;
      return;
    }

    document.querySelectorAll("[data-tab]").forEach((btn) => {
      btn.addEventListener("click", () => setTab(btn.getAttribute("data-tab")));
    });
    $("checklist-owner")?.addEventListener("change", renderChecklist);
    $("checklist-phase")?.addEventListener("change", renderChecklist);
    $("btn-reset-checklist")?.addEventListener("click", () => {
      localStorage.removeItem(STORAGE_KEY);
      renderChecklist();
      renderMetricsDemo();
    });
    $("btn-export-checklist")?.addEventListener("click", exportChecklist);

    renderGuide("doctorGuide", "doctor-guide-root");
    renderGuide("practiceGuide", "practice-guide-root");
    renderChecklist();
    renderMetrics();
    setTab("doctor");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
