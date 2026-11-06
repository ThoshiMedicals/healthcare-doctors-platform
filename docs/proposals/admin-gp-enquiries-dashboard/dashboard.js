/**
 * Admin GP Enquiries Dashboard — human-reviewed queue
 * Scores prioritise review; never automate hiring decisions.
 */
(() => {
  "use strict";

  let items = [];
  let selectedId = null;
  let meta = null;

  const STAGE_LABELS = {
    initial_discussion: "Initial discussion",
    eoi_review: "EOI review",
    credential_checks: "Credential checks",
    provider_number_preparation: "Provider-number prep",
    session_allocation: "Session allocation",
    orientation: "Orientation",
    go_live: "Go-live",
  };

  function esc(v) {
    return String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function bandClass(band) {
    const map = {
      priority_review: "bg-green/10 text-green border-green/30",
      strong_fit: "bg-navy/10 text-navy border-navy/30",
      possible_fit: "bg-warm text-ink border-line",
      nurture: "bg-amber-50 text-amber border-amber/40",
      incomplete: "bg-mist text-ink-soft border-line",
    };
    return map[band] || map.incomplete;
  }

  function badge(text, cls) {
    return `<span class="inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${cls}">${esc(text)}</span>`;
  }

  function queryParams() {
    const q = document.getElementById("filter-q")?.value?.trim() || "";
    const status = document.getElementById("filter-status")?.value || "";
    const scoreBand = document.getElementById("filter-band")?.value || "";
    const capacityFit = document.getElementById("filter-capacity")?.value || "";
    const assigned = document.getElementById("filter-assigned")?.value || "";
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (scoreBand) params.set("scoreBand", scoreBand);
    if (capacityFit) params.set("capacityFit", capacityFit);
    if (assigned) params.set("assignedToUserId", assigned);
    params.set("sort", document.getElementById("filter-sort")?.value || "priorityScore_desc");
    return params;
  }

  async function loadList() {
    const res = await fetch(`/api/enquiries?${queryParams()}`);
    const data = await res.json();
    items = data.items || [];
    document.getElementById("result-count").textContent = `${data.total} enquir${data.total === 1 ? "y" : "ies"}`;
    renderList();
    if (!selectedId || !items.find((i) => i.id === selectedId)) {
      selectedId = items[0]?.id || null;
    }
    if (selectedId) await loadDetail(selectedId);
    else renderEmptyDetail();
  }

  function renderList() {
    const root = document.getElementById("enquiry-list");
    root.innerHTML = items
      .map((item) => {
        const selected = item.id === selectedId;
        const flags = (item.hardFlags || []).length
          ? badge(`${item.hardFlags.length} flag`, "bg-amber-50 text-amber border-amber/40")
          : "";
        return `<button type="button" data-id="${esc(item.id)}" class="w-full rounded-xl border px-3 py-3 text-left transition ${selected ? "border-navy bg-white shadow-sm" : "border-line bg-white/80 hover:border-navy/40"}">
          <div class="flex items-start justify-between gap-2">
            <span class="font-semibold text-sm">${esc(item.doctorDisplayName)}</span>
            <span class="font-display text-lg font-bold text-navy">${item.priorityScore}</span>
          </div>
          <div class="mt-1 flex flex-wrap gap-1">${badge(item.scoreBand, bandClass(item.scoreBand))} ${badge(item.status, "bg-mist text-ink border-line")} ${flags}</div>
          <p class="mt-2 text-xs text-ink-soft">Capacity: ${esc(item.capacityFit)} · Stage: ${esc(STAGE_LABELS[item.onboardingStage] || item.onboardingStage || "—")}</p>
        </button>`;
      })
      .join("") || `<p class="text-sm text-ink-soft p-3">No enquiries match filters.</p>`;
  }

  function renderEmptyDetail() {
    document.getElementById("detail-panel").innerHTML = `<p class="text-sm text-ink-soft">Select an enquiry.</p>`;
  }

  async function loadDetail(id) {
    selectedId = id;
    renderList();
    const res = await fetch(`/api/enquiries/${id}`);
    const e = await res.json();
    if (res.status === 404) {
      renderEmptyDetail();
      return;
    }
    renderDetail(e);
  }

  function yesNo(v) {
    return v ? "Yes" : "No";
  }

  function renderDetail(e) {
    const panel = document.getElementById("detail-panel");
    const scoreFactors = e.score?.factors
      ? Object.entries(e.score.factors)
          .map(([k, v]) => `<li class="flex justify-between text-sm"><span>${esc(k)}</span><span class="font-medium">${v}</span></li>`)
          .join("")
      : "";

    panel.innerHTML = `
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 class="font-display text-2xl font-bold">${esc(e.doctorDisplayName)}</h2>
          <p class="mt-1 text-sm text-ink-soft">${esc(e.email)}${e.phone ? " · " + esc(e.phone) : ""}</p>
        </div>
        <div class="text-right">
          <p class="text-[11px] font-semibold uppercase tracking-wide text-ink-soft">Priority score</p>
          <p class="font-display text-4xl font-bold text-navy">${e.priorityScore}</p>
          <p class="mt-1">${badge(e.scoreBand, bandClass(e.scoreBand))}</p>
        </div>
      </div>
      <p class="mt-3 rounded-lg border border-navy/20 bg-mist/80 px-3 py-2 text-xs text-ink-soft">
        Score and capacity fit help humans prioritise conversations. They do <strong class="text-ink">not</strong> automate hiring decisions.
      </p>

      <div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-xl border border-line p-3"><p class="text-[11px] uppercase tracking-wide text-ink-soft">Capacity fit</p><p class="mt-1 font-semibold">${esc(e.capacityFit)}</p></div>
        <div class="rounded-xl border border-line p-3"><p class="text-[11px] uppercase tracking-wide text-ink-soft">Eligibility discussion</p><p class="mt-1 font-semibold text-sm">${esc(e.eligibilityDiscussionStatus)}</p></div>
        <div class="rounded-xl border border-line p-3"><p class="text-[11px] uppercase tracking-wide text-ink-soft">Onboarding stage</p><p class="mt-1 font-semibold text-sm">${esc(STAGE_LABELS[e.onboardingStage] || e.onboardingStage || "Not started")}</p></div>
        <div class="rounded-xl border border-line p-3"><p class="text-[11px] uppercase tracking-wide text-ink-soft">Assignee</p><p class="mt-1 font-semibold text-sm">${esc(e.assignedToName || "Unassigned")}</p></div>
      </div>
      ${e.capacityFitNote ? `<p class="mt-2 text-sm text-ink-soft">${esc(e.capacityFitNote)}</p>` : ""}
      ${e.eligibilityDiscussionSummary ? `<p class="mt-2 rounded-xl border border-amber/30 bg-white p-3 text-sm"><strong class="text-amber">Eligibility discussion (not a determination):</strong> ${esc(e.eligibilityDiscussionSummary)}</p>` : ""}

      <div class="mt-6 grid gap-4 lg:grid-cols-2">
        <section class="rounded-xl border border-line p-4">
          <h3 class="font-display text-lg font-bold">EOI submission</h3>
          <ul class="mt-2 space-y-1 text-sm">
            <li>AHPRA: <strong>${esc(e.eoi?.ahpraStatus || "—")}</strong></li>
            <li>Fellowship: <strong>${esc(e.eoi?.fellowship || "—")}</strong></li>
            <li>Interests: ${(e.eoi?.clinicalInterests || []).map((x) => badge(x, "bg-mist text-ink border-line")).join(" ") || "—"}</li>
            <li>Start: <strong>${esc(e.preferredStartDate || "—")}</strong> · Sessions/wk: <strong>${esc(e.sessionsPerWeek ?? "—")}</strong></li>
          </ul>
        </section>
        <section class="rounded-xl border border-line p-4">
          <h3 class="font-display text-lg font-bold">EOI score breakdown</h3>
          <ul class="mt-2 space-y-1">${scoreFactors}</ul>
          ${e.score?.manualAdjustment ? `<p class="mt-2 text-xs text-ink-soft">Manual adjustment ${e.score.manualAdjustment}: ${esc(e.score.manualAdjustmentReason || "")}</p>` : ""}
          ${(e.hardFlags || []).length ? `<p class="mt-2 text-sm text-amber">Hard flags: ${e.hardFlags.map(esc).join(", ")}</p>` : ""}
        </section>
        <section class="rounded-xl border border-line p-4">
          <h3 class="font-display text-lg font-bold">Readiness result</h3>
          ${e.readiness ? `<p class="mt-2 text-sm">Band: <strong>${esc(e.readiness.overallBand)}</strong></p>
            <p class="text-xs text-ink-soft">Completed ${esc(e.readiness.completedAt || "")}</p>
            <p class="mt-1 text-xs">Themes: ${(e.readiness.themeIds || []).join(", ") || "—"}</p>` : `<p class="mt-2 text-sm text-ink-soft">Not completed</p>`}
        </section>
        <section class="rounded-xl border border-line p-4">
          <h3 class="font-display text-lg font-bold">Provider readiness</h3>
          ${e.providerReadiness ? `<ul class="mt-2 space-y-1 text-sm">
            <li>Has PN: <strong>${esc(e.providerReadiness.hasProviderNumber)}</strong></li>
            <li>Application: <strong>${esc(e.providerReadiness.applicationStatus)}</strong></li>
            <li>Docs: <strong>${e.providerReadiness.documentsReadyCount}/${e.providerReadiness.documentsTotal}</strong></li>
            <li>SA notice acknowledged: <strong>${yesNo(e.providerReadiness.noticeAcknowledged)}</strong></li>
          </ul>` : `<p class="mt-2 text-sm text-ink-soft">Not completed</p>`}
        </section>
        <section class="rounded-xl border border-line p-4 lg:col-span-2">
          <h3 class="font-display text-lg font-bold">Session preferences</h3>
          ${e.sessionPreferences ? `<p class="mt-2 text-sm">Days: <strong>${(e.sessionPreferences.preferredDays || []).join(", ")}</strong></p>
            <p class="text-sm">Sessions/week: <strong>${esc(e.sessionPreferences.sessionsPerWeek)}</strong> · Flexibility: <strong>${esc(e.sessionPreferences.startFlexibility)}</strong></p>` : `<p class="mt-2 text-sm text-ink-soft">Not completed</p>`}
          <div id="capacity-match-embed" class="mt-4 rounded-xl border border-dashed border-navy/30 bg-mist/40 p-3 text-sm" data-enquiry-id="${esc(e.id)}">
            <p class="text-xs font-semibold uppercase tracking-wide text-navy">Session–capacity match</p>
            <p class="mt-1 text-ink-soft">Loading advisory match from matching engine…</p>
          </div>
        </section>
      </div>

      <section class="mt-6 grid gap-4 lg:grid-cols-3">
        <form id="status-form" class="rounded-xl border border-line p-4 space-y-3" data-id="${esc(e.id)}">
          <h3 class="font-display text-lg font-bold">Status update</h3>
          <label class="block text-sm">Status
            <select name="status" class="mt-1 w-full min-h-11 rounded-lg border border-line px-3">${(meta?.statuses || []).map((s) => `<option value="${s}" ${s === e.status ? "selected" : ""}>${s}</option>`).join("")}</select>
          </label>
          <label class="block text-sm">Capacity fit
            <select name="capacityFit" class="mt-1 w-full min-h-11 rounded-lg border border-line px-3">${(meta?.capacityFits || []).map((s) => `<option value="${s}" ${s === e.capacityFit ? "selected" : ""}>${s}</option>`).join("")}</select>
          </label>
          <label class="block text-sm">Eligibility discussion
            <select name="eligibilityDiscussionStatus" class="mt-1 w-full min-h-11 rounded-lg border border-line px-3">${(meta?.eligibilityStatuses || []).map((s) => `<option value="${s}" ${s === e.eligibilityDiscussionStatus ? "selected" : ""}>${s}</option>`).join("")}</select>
          </label>
          <label class="block text-sm">Note
            <textarea name="note" rows="2" class="mt-1 w-full rounded-lg border border-line px-3 py-2" placeholder="Optional audit note"></textarea>
          </label>
          <button type="submit" class="min-h-11 w-full rounded-lg bg-navy px-4 text-sm font-semibold text-white">Save human update</button>
          <p class="status-msg text-xs" role="status"></p>
        </form>

        <form id="assign-form" class="rounded-xl border border-line p-4 space-y-3" data-id="${esc(e.id)}">
          <h3 class="font-display text-lg font-bold">Assignment</h3>
          <label class="block text-sm">Assignee
            <select name="assigneeUserId" class="mt-1 w-full min-h-11 rounded-lg border border-line px-3">
              <option value="">Unassigned</option>
              ${(meta?.assignees || []).map((a) => `<option value="${esc(a.id)}" ${a.id === e.assignedToUserId ? "selected" : ""}>${esc(a.name)}</option>`).join("")}
            </select>
          </label>
          <button type="submit" class="min-h-11 w-full rounded-lg border border-navy px-4 text-sm font-semibold text-navy">Assign</button>
          <p class="assign-msg text-xs" role="status"></p>
        </form>

        <form id="note-form" class="rounded-xl border border-line p-4 space-y-3" data-id="${esc(e.id)}">
          <h3 class="font-display text-lg font-bold">Add note</h3>
          <label class="block text-sm">Internal note
            <textarea name="body" required rows="4" class="mt-1 w-full rounded-lg border border-line px-3 py-2"></textarea>
          </label>
          <button type="submit" class="min-h-11 w-full rounded-lg border border-line px-4 text-sm font-semibold">Add note</button>
          <p class="note-msg text-xs" role="status"></p>
        </form>
      </section>

      <section class="mt-6">
        <h3 class="font-display text-lg font-bold">Notes</h3>
        <ul class="mt-2 space-y-2">${(e.notes || [])
          .map(
            (n) => `<li class="rounded-xl border border-line bg-mist/40 p-3 text-sm"><p>${esc(n.body)}</p><p class="mt-1 text-xs text-ink-soft">${esc(n.authorName || n.authorUserId)} · ${esc(n.createdAt)}</p></li>`
          )
          .join("") || '<li class="text-sm text-ink-soft">No notes yet.</li>'}</ul>
      </section>
    `;

    document.getElementById("status-form")?.addEventListener("submit", onStatus);
    document.getElementById("assign-form")?.addEventListener("submit", onAssign);
    document.getElementById("note-form")?.addEventListener("submit", onNote);
    loadCapacityMatchEmbed(e.id);
  }

  async function loadCapacityMatchEmbed(enquiryId) {
    const box = document.getElementById("capacity-match-embed");
    if (!box) return;
    try {
      const res = await fetch(`http://127.0.0.1:4183/api/match/enquiry/${enquiryId}`);
      if (!res.ok) throw new Error("Matching engine unavailable");
      const data = await res.json();
      box.innerHTML = `<p class="text-xs font-semibold uppercase tracking-wide text-navy">Session–capacity match</p>
        <p class="mt-1 font-display text-2xl font-bold text-navy">${data.compatibilityScore}% <span class="text-sm font-sans font-normal text-ink-soft">compatibility (advisory)</span></p>
        <p class="mt-1 text-xs text-ink-soft">Prefs: ${(data.preferredSessions || []).map(esc).join(" · ") || "—"}</p>
        <p class="mt-2 text-xs"><a class="text-navy underline-offset-2 hover:underline" href="http://127.0.0.1:4183/?enquiryId=${esc(enquiryId)}" target="_blank" rel="noopener">Open matching engine</a> · does not auto-allocate sessions</p>`;
    } catch {
      box.innerHTML = `<p class="text-xs font-semibold uppercase tracking-wide text-navy">Session–capacity match</p>
        <p class="mt-1 text-ink-soft">Start matching engine on <code>:4183</code> to embed compatibility here.</p>
        <p class="mt-1 text-xs"><a class="text-navy underline-offset-2 hover:underline" href="http://127.0.0.1:4183/" target="_blank" rel="noopener">http://127.0.0.1:4183/</a></p>`;
    }
  }

  async function onStatus(ev) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const msg = form.querySelector(".status-msg");
    const body = {
      status: form.status.value,
      capacityFit: form.capacityFit.value,
      eligibilityDiscussionStatus: form.eligibilityDiscussionStatus.value,
      actorUserId: "pm_01",
      note: form.note.value.trim() || undefined,
    };
    if (body.status === "hired") body.humanConfirmation = true;
    const res = await fetch(`/api/enquiries/${form.dataset.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    msg.textContent = res.ok ? "Updated." : data.error || "Failed";
    msg.className = `status-msg text-xs ${res.ok ? "text-green" : "text-red-700"}`;
    if (res.ok) {
      await loadList();
      await loadDetail(form.dataset.id);
    }
  }

  async function onAssign(ev) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const msg = form.querySelector(".assign-msg");
    const res = await fetch(`/api/enquiries/${form.dataset.id}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assigneeUserId: form.assigneeUserId.value || null,
        actorUserId: "pm_01",
      }),
    });
    const data = await res.json();
    msg.textContent = res.ok ? "Assigned." : data.error || "Failed";
    msg.className = `assign-msg text-xs ${res.ok ? "text-green" : "text-red-700"}`;
    if (res.ok) {
      await loadList();
      await loadDetail(form.dataset.id);
    }
  }

  async function onNote(ev) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const msg = form.querySelector(".note-msg");
    const res = await fetch(`/api/enquiries/${form.dataset.id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body: form.body.value.trim(),
        authorUserId: "pm_01",
        authorName: "Practice Manager",
      }),
    });
    const data = await res.json();
    msg.textContent = res.ok ? "Note added." : data.error || "Failed";
    msg.className = `note-msg text-xs ${res.ok ? "text-green" : "text-red-700"}`;
    if (res.ok) await loadDetail(form.dataset.id);
  }

  async function init() {
    meta = await (await fetch("/api/meta")).json();
    document.getElementById("filters")?.addEventListener("change", () => loadList());
    document.getElementById("filter-q")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        loadList();
      }
    });
    document.getElementById("btn-search")?.addEventListener("click", () => loadList());
    document.getElementById("enquiry-list")?.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-id]");
      if (btn) loadDetail(btn.getAttribute("data-id"));
    });
    await loadList();
  }

  init().catch((err) => {
    document.getElementById("enquiry-list").innerHTML = `<p class="text-sm text-red-700 p-3" role="alert">Start <code>node server.mjs</code>. ${esc(err.message)}</p>`;
  });
})();
