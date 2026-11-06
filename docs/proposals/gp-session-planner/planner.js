/**
 * GP Session Planner — weekly calendar, M/A/E selection, JSON save
 * Woolloongabba Medical Centre — localhost proposal
 */
(() => {
  "use strict";

  const STORAGE_KEY = "wmc_gp_session_planner_v1";
  const DAYS = [
    { id: "mon", label: "Mon", full: "Monday" },
    { id: "tue", label: "Tue", full: "Tuesday" },
    { id: "wed", label: "Wed", full: "Wednesday" },
    { id: "thu", label: "Thu", full: "Thursday" },
    { id: "fri", label: "Fri", full: "Friday" },
    { id: "sat", label: "Sat", full: "Saturday" },
    { id: "sun", label: "Sun", full: "Sunday" },
  ];
  const PERIODS = [
    { id: "morning", label: "Morning", short: "AM", defaultCapacity: 12 },
    { id: "afternoon", label: "Afternoon", short: "PM", defaultCapacity: 12 },
    { id: "evening", label: "Evening", short: "Eve", defaultCapacity: 8 },
  ];

  /** @type {Set<string>} */
  let selected = new Set();

  /** @type {Record<string, number>} */
  let capacityOverrides = {};

  /**
   * @param {string} dayId
   * @param {string} periodId
   */
  function slotKey(dayId, periodId) {
    return `${dayId}:${periodId}`;
  }

  /**
   * @param {string} key
   */
  function parseKey(key) {
    const [dayId, periodId] = key.split(":");
    return { dayId, periodId };
  }

  /**
   * @param {string} periodId
   */
  function capacityFor(periodId) {
    if (capacityOverrides[periodId] != null) return Number(capacityOverrides[periodId]);
    const p = PERIODS.find((x) => x.id === periodId);
    return p ? p.defaultCapacity : 0;
  }

  function compute() {
    const sessions = [...selected].map((key) => {
      const { dayId, periodId } = parseKey(key);
      const day = DAYS.find((d) => d.id === dayId);
      const period = PERIODS.find((p) => p.id === periodId);
      const capacity = capacityFor(periodId);
      return {
        key,
        dayId,
        dayLabel: day?.full || dayId,
        periodId,
        periodLabel: period?.label || periodId,
        estimatedPatientCapacity: capacity,
      };
    });

    sessions.sort((a, b) => {
      const di = DAYS.findIndex((d) => d.id === a.dayId) - DAYS.findIndex((d) => d.id === b.dayId);
      if (di !== 0) return di;
      return PERIODS.findIndex((p) => p.id === a.periodId) - PERIODS.findIndex((p) => p.id === b.periodId);
    });

    const totalSessions = sessions.length;
    const estimatedCapacity = sessions.reduce((sum, s) => sum + s.estimatedPatientCapacity, 0);

    return { sessions, totalSessions, estimatedCapacity };
  }

  function buildExport() {
    const { sessions, totalSessions, estimatedCapacity } = compute();
    return {
      formType: "gp_session_plan",
      version: "1.0.0",
      clinicSlug: "woolloongabba",
      savedAt: new Date().toISOString(),
      weekView: "fixed_weekdays",
      periods: PERIODS.map((p) => ({
        id: p.id,
        label: p.label,
        estimatedPatientCapacityPerSession: capacityFor(p.id),
      })),
      selectedSessions: sessions,
      totals: {
        totalSessions,
        estimatedCapacity,
        unit: "estimated_patient_appointments_per_week",
      },
      notes:
        "Capacity is an estimate for planning only — not a roster or billing commitment.",
    };
  }

  function saveLocal() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          selected: [...selected],
          capacityOverrides,
        }),
      );
    } catch {
      /* ignore */
    }
  }

  function loadLocal() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (Array.isArray(data.selected)) selected = new Set(data.selected);
      if (data.capacityOverrides && typeof data.capacityOverrides === "object") {
        capacityOverrides = data.capacityOverrides;
      }
    } catch {
      /* ignore */
    }
  }

  function renderGrid() {
    const grid = document.querySelector("#session-grid");
    if (!grid) return;
    grid.innerHTML = "";

    // Header row
    const corner = document.createElement("div");
    corner.className = "text-xs font-semibold uppercase tracking-wide text-ink-soft";
    corner.textContent = "Session";
    grid.appendChild(corner);

    DAYS.forEach((day) => {
      const h = document.createElement("div");
      h.className = "text-center text-xs font-semibold text-ink sm:text-sm";
      h.innerHTML = `<span class="sm:hidden">${day.label}</span><span class="hidden sm:inline">${day.full}</span>`;
      grid.appendChild(h);
    });

    PERIODS.forEach((period) => {
      const label = document.createElement("div");
      label.className =
        "flex items-center text-xs font-semibold text-ink sm:text-sm";
      label.innerHTML = `<span class="sm:hidden">${period.short}</span><span class="hidden sm:inline">${period.label}</span>`;
      grid.appendChild(label);

      DAYS.forEach((day) => {
        const key = slotKey(day.id, period.id);
        const on = selected.has(key);
        const btn = document.createElement("button");
        btn.type = "button";
        btn.dataset.slot = key;
        btn.setAttribute("aria-pressed", on ? "true" : "false");
        btn.setAttribute(
          "aria-label",
          `${day.full} ${period.label}${on ? ", selected" : ""}`,
        );
        btn.className = [
          "min-h-12 rounded-xl border text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy sm:min-h-14 sm:text-sm",
          on
            ? "border-navy bg-navy text-white"
            : "border-line bg-white text-ink-soft hover:border-navy/40 hover:bg-mist",
        ].join(" ");
        btn.textContent = on ? "Selected" : "Select";
        btn.addEventListener("click", () => toggleSlot(key));
        grid.appendChild(btn);
      });
    });
  }

  /**
   * @param {string} key
   */
  function toggleSlot(key) {
    if (selected.has(key)) selected.delete(key);
    else selected.add(key);
    saveLocal();
    renderGrid();
    renderSummary();
  }

  function renderSummary() {
    const { sessions, totalSessions, estimatedCapacity } = compute();

    const totalEl = document.querySelector("#total-sessions");
    const capEl = document.querySelector("#estimated-capacity");
    const list = document.querySelector("#selected-list");
    const empty = document.querySelector("#selected-empty");
    const jsonPre = document.querySelector("#json-preview");

    if (totalEl) totalEl.textContent = String(totalSessions);
    if (capEl) capEl.textContent = String(estimatedCapacity);

    if (list) {
      list.innerHTML = "";
      sessions.forEach((s) => {
        const li = document.createElement("li");
        li.className =
          "flex items-center justify-between gap-3 rounded-xl border border-line bg-mist/50 px-3 py-2.5 text-sm";
        li.innerHTML = `
          <span><strong class="text-ink">${s.dayLabel}</strong> · ${s.periodLabel}</span>
          <span class="text-ink-soft">${s.estimatedPatientCapacity} pts</span>
        `;
        list.appendChild(li);
      });
    }

    if (empty) empty.classList.toggle("hidden", sessions.length > 0);
    if (list) list.classList.toggle("hidden", sessions.length === 0);

    const payload = buildExport();
    if (jsonPre) jsonPre.textContent = JSON.stringify(payload, null, 2);
    window.__lastSessionPlan = payload;
  }

  function syncCapacityInputs() {
    PERIODS.forEach((p) => {
      const input = document.querySelector(`#cap-${p.id}`);
      if (input instanceof HTMLInputElement) {
        input.value = String(capacityFor(p.id));
      }
    });
  }

  async function persistToServer(payload) {
    try {
      const res = await fetch("/api/gp-session-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  function setStatus(text, ok) {
    const status = document.querySelector("#save-status");
    if (!status) return;
    status.textContent = text;
    status.classList.toggle("text-green", Boolean(ok));
    status.classList.toggle("text-red-700", ok === false);
    status.classList.toggle("text-ink-soft", ok == null);
  }

  function init() {
    loadLocal();
    syncCapacityInputs();
    renderGrid();
    renderSummary();

    PERIODS.forEach((p) => {
      const input = document.querySelector(`#cap-${p.id}`);
      input?.addEventListener("change", () => {
        if (!(input instanceof HTMLInputElement)) return;
        const n = Math.max(1, Math.min(40, Number(input.value) || p.defaultCapacity));
        capacityOverrides[p.id] = n;
        input.value = String(n);
        saveLocal();
        renderSummary();
      });
    });

    document.querySelector("#btn-clear")?.addEventListener("click", () => {
      selected.clear();
      saveLocal();
      renderGrid();
      renderSummary();
      setStatus("Selection cleared.", null);
    });

    document.querySelector("#btn-save-json")?.addEventListener("click", async () => {
      const payload = buildExport();
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wmc-gp-session-plan-${payload.totals.totalSessions}sessions.json`;
      a.click();
      URL.revokeObjectURL(url);

      const ok = await persistToServer(payload);
      setStatus(
        ok
          ? "Saved JSON download + logged on localhost server."
          : "JSON downloaded (server unreachable — local file only).",
        ok || null,
      );
    });

    document.querySelector("#btn-copy-json")?.addEventListener("click", async () => {
      const payload = buildExport();
      try {
        await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
        setStatus("JSON copied to clipboard.", true);
      } catch {
        setStatus("Copy failed — use Save JSON instead.", false);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.GpSessionPlanner = { compute, buildExport, slotKey };
})();
