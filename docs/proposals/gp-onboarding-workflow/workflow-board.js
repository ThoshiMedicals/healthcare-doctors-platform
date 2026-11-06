/**
 * GP Onboarding Workflow — dashboard board renderer
 * Human-reviewed prototype · no automated approvals
 */
(() => {
  "use strict";

  const stageRoot = document.getElementById("stage-rail");
  const caseRoot = document.getElementById("case-panel");
  const live = document.getElementById("board-live");
  const diagramRoot = document.getElementById("mermaid-diagram");

  let workflow = null;
  let cases = [];
  let selectedId = null;

  function esc(v) {
    return String(v)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function statusBadge(status) {
    const map = {
      gate_approved: "bg-green/10 text-green border-green/30",
      in_progress: "bg-navy/10 text-navy border-navy/30",
      awaiting_external: "bg-amber-50 text-amber border-amber/40",
      ready_for_gate: "bg-warm text-ink border-line",
      not_started: "bg-mist text-ink-soft border-line",
      live: "bg-green text-white border-green",
    };
    const cls = map[status] || "bg-mist text-ink-soft border-line";
    return `<span class="inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cls}">${esc(status)}</span>`;
  }

  function renderRail(activeStageId) {
    if (!stageRoot || !workflow) return;
    stageRoot.innerHTML = workflow.stages
      .map((s) => {
        const active = s.id === activeStageId;
        return `<button type="button" data-stage="${esc(s.id)}" class="flex w-full min-h-12 items-start gap-3 rounded-xl border px-3 py-3 text-left ${active ? "border-navy bg-white shadow-sm" : "border-line bg-white/70"}">
          <span class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-mist text-xs font-bold text-navy">${s.order}</span>
          <span class="min-w-0">
            <span class="block text-sm font-semibold">${esc(s.label)}</span>
            <span class="mt-0.5 block text-xs text-ink-soft line-clamp-2">${esc(s.goal)}</span>
          </span>
        </button>`;
      })
      .join("");
  }

  function renderCase(c) {
    if (!caseRoot || !workflow) return;
    const stage = workflow.stages.find((s) => s.id === c.currentStageId);
    const stageState = (c.stages || []).find((x) => x.stageId === c.currentStageId);
    const adminTasks = (stage?.adminTasks || []).map((t) => {
      const runtime = (c.tasks || []).find((x) => x.taskKey === t.id);
      const st = runtime?.status || "pending";
      return `<li class="flex gap-2 text-sm"><span class="text-ink-soft">☐</span><span><span class="font-medium">${esc(t.task)}</span> ${statusBadge(st)}</span></li>`;
    });
    const doctorTasks = (stage?.doctorTasks || []).map((t) => {
      const runtime = (c.tasks || []).find((x) => x.taskKey === t.id);
      const st = runtime?.status || "pending";
      return `<li class="flex gap-2 text-sm"><span class="text-ink-soft">☐</span><span><span class="font-medium">${esc(t.task)}</span> ${statusBadge(st)}</span></li>`;
    });
    const deps = (stage?.dependencies || [])
      .map((d) => `<li class="text-sm text-ink-soft">${esc(d.label)}${d.agency ? ` · <span class="text-ink">${esc(d.agency)}</span>` : ""}</li>`)
      .join("");

    caseRoot.innerHTML = `
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 class="font-display text-2xl font-bold">${esc(c.doctorDisplayName)}</h2>
          <p class="mt-1 text-sm text-ink-soft">Case ${esc(c.id)} · ${statusBadge(c.status)}</p>
        </div>
        <p class="text-xs text-ink-soft">Human review required — no auto-approve</p>
      </div>

      <div class="mt-5 rounded-xl border border-line bg-mist/60 p-4">
        <p class="text-xs font-semibold uppercase tracking-wide text-navy">Current stage</p>
        <p class="mt-1 font-display text-lg font-bold">${esc(stage?.label || c.currentStageId)}</p>
        <p class="mt-1 text-sm text-ink-soft">${esc(stage?.goal || "")}</p>
        <p class="mt-2">${statusBadge(stageState?.status || "in_progress")}</p>
        <p class="mt-3 text-xs"><strong>Human gate:</strong> ${esc(stage?.humanGate?.action || "")}</p>
      </div>

      <div class="mt-5 grid gap-4 sm:grid-cols-2">
        <section>
          <h3 class="text-xs font-semibold uppercase tracking-wide text-green">Admin tasks</h3>
          <ul class="mt-2 space-y-2">${adminTasks.join("") || "<li class='text-sm text-ink-soft'>None</li>"}</ul>
        </section>
        <section>
          <h3 class="text-xs font-semibold uppercase tracking-wide text-navy">Doctor tasks</h3>
          <ul class="mt-2 space-y-2">${doctorTasks.join("") || "<li class='text-sm text-ink-soft'>None</li>"}</ul>
        </section>
      </div>

      <section class="mt-5">
        <h3 class="text-xs font-semibold uppercase tracking-wide text-amber">Dependencies</h3>
        <ul class="mt-2 list-disc space-y-1 pl-5">${deps}</ul>
      </section>

      <section class="mt-5 rounded-xl border border-navy/20 bg-white p-4">
        <h3 class="font-display text-lg font-bold">Human gate action</h3>
        <p class="mt-1 text-sm text-ink-soft">Prototype form — server rejects missing reviewer fields and forbids system auto-approvers.</p>
        <form id="gate-form" class="mt-3 space-y-3" data-case="${esc(c.id)}" data-stage="${esc(c.currentStageId)}">
          <label class="block text-sm font-medium">Reviewer name
            <input name="reviewerName" required class="mt-1 w-full min-h-11 rounded-lg border border-line px-3" value="Practice Manager" />
          </label>
          <label class="block text-sm font-medium">Reviewer ID
            <input name="reviewerId" required class="mt-1 w-full min-h-11 rounded-lg border border-line px-3" value="pm_01" />
          </label>
          <label class="block text-sm font-medium">Decision
            <select name="decision" class="mt-1 w-full min-h-11 rounded-lg border border-line px-3">
              <option value="approve_advance">Approve advance</option>
              <option value="acknowledge_awaiting_external">Acknowledge awaiting external</option>
              <option value="request_changes">Request changes</option>
              <option value="pause">Pause</option>
              <option value="decline">Decline</option>
            </select>
          </label>
          <label class="block text-sm font-medium">Rationale
            <textarea name="rationale" required rows="3" class="mt-1 w-full rounded-lg border border-line px-3 py-2" placeholder="Why this decision?"></textarea>
          </label>
          <button type="submit" class="min-h-11 rounded-lg bg-navy px-4 text-sm font-semibold text-white">Record human gate</button>
          <p id="gate-result" class="text-sm" role="status" aria-live="polite"></p>
        </form>
      </section>
    `;

    document.getElementById("gate-form")?.addEventListener("submit", onGateSubmit);
  }

  async function onGateSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const result = document.getElementById("gate-result");
    const body = {
      stageId: form.dataset.stage,
      reviewerId: form.reviewerId.value.trim(),
      reviewerName: form.reviewerName.value.trim(),
      decision: form.decision.value,
      rationale: form.rationale.value.trim(),
    };
    try {
      const res = await fetch(`/api/cases/${form.dataset.case}/gates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        result.textContent = data.error || "Gate rejected";
        result.className = "text-sm text-red-700";
        return;
      }
      result.textContent = `Gate recorded: ${data.decision} by ${data.reviewerName}`;
      result.className = "text-sm text-green";
      await loadCases(selectedId);
    } catch (err) {
      result.textContent = String(err.message || err);
      result.className = "text-sm text-red-700";
    }
  }

  function renderCaseList() {
    const list = document.getElementById("case-list");
    if (!list) return;
    list.innerHTML = cases
      .map((c) => {
        const selected = c.id === selectedId;
        return `<button type="button" data-case-id="${esc(c.id)}" class="w-full rounded-xl border px-3 py-3 text-left ${selected ? "border-navy bg-white" : "border-line bg-white/80"}">
          <span class="block text-sm font-semibold">${esc(c.doctorDisplayName)}</span>
          <span class="mt-1 block text-xs text-ink-soft">${esc(c.currentStageId)} · ${esc(c.status)}</span>
        </button>`;
      })
      .join("");
  }

  async function loadCases(preferId) {
    const res = await fetch("/api/cases");
    cases = await res.json();
    selectedId = preferId || cases[0]?.id || null;
    renderCaseList();
    const c = cases.find((x) => x.id === selectedId);
    if (c) {
      renderRail(c.currentStageId);
      renderCase(c);
    }
    if (live) live.textContent = `${cases.length} onboarding case(s) loaded.`;
  }

  async function init() {
    const [wfRes] = await Promise.all([fetch("/api/workflow")]);
    workflow = await wfRes.json();
    if (diagramRoot && workflow.diagram?.source) {
      diagramRoot.textContent = workflow.diagram.source;
    }
    await loadCases();

    document.getElementById("case-list")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-case-id]");
      if (!btn) return;
      selectedId = btn.getAttribute("data-case-id");
      const c = cases.find((x) => x.id === selectedId);
      if (c) {
        renderCaseList();
        renderRail(c.currentStageId);
        renderCase(c);
      }
    });
  }

  init().catch((err) => {
    if (caseRoot) {
      caseRoot.innerHTML = `<p class="text-sm text-red-700" role="alert">Could not load workflow. Start <code>node server.mjs</code>. ${esc(err.message || err)}</p>`;
    }
  });
})();
