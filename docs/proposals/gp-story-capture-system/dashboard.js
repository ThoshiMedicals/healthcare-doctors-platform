/* GP Story Collection Dashboard — wireframe client */
const PRIORITY = [
  "gp_review",
  "editorial_review",
  "changes_requested",
  "drafting",
  "interviewed",
  "briefed",
  "invited",
  "approved",
  "published",
  "paused",
  "withdrawn",
  "archived",
];

const CAT_LABEL = {
  early_career: "Early Career",
  established: "Established",
  returning: "Returning",
  part_time: "Part-Time",
  special_interest: "Special Interest",
};

const STATUS_LABEL = {
  invited: "Invited",
  briefed: "Briefed",
  interviewed: "Interviewed",
  drafting: "Drafting",
  gp_review: "GP review",
  editorial_review: "Editorial",
  changes_requested: "Changes",
  approved: "Approved",
  published: "Published",
  paused: "Paused",
  withdrawn: "Withdrawn",
  archived: "Archived",
};

let inventory = { stories: [] };
let workflow = null;
let filterStatus = "all";
let filterCategory = "all";
let selectedId = null;

function priorityRank(status) {
  const i = PRIORITY.indexOf(status);
  return i < 0 ? 99 : i;
}

function consentRisk(story) {
  const c = story.consent || {};
  if (c.status === "withdrawn") return "withdrawn";
  if (c.status === "draft_linked" && story.daysInStatus >= 5) return "aging";
  if (c.status === "signed") return "ok";
  if (c.status === "not_started" || c.status === "summary_shared") return "pending";
  return "pending";
}

function toneForStatus(status) {
  if (status === "published") return "bg-green/10 text-green";
  if (status === "withdrawn" || status === "archived") return "bg-ink-soft/10 text-ink-soft";
  if (status === "editorial_review" || status === "gp_review") return "bg-amber/15 text-amber";
  if (status === "changes_requested" || status === "paused") return "bg-amber/15 text-amber";
  return "bg-navy/10 text-navy";
}

function filteredStories() {
  return inventory.stories
    .filter((s) => (filterStatus === "all" ? true : s.status === filterStatus))
    .filter((s) => {
      if (filterCategory === "all") return true;
      const sec = s.secondaryCategories || [];
      return s.primaryCategory === filterCategory || sec.includes(filterCategory);
    })
    .sort((a, b) => priorityRank(a.status) - priorityRank(b.status) || b.daysInStatus - a.daysInStatus);
}

function renderStats() {
  const stories = inventory.stories;
  const active = stories.filter((s) => !["withdrawn", "archived"].includes(s.status)).length;
  const needsGate = stories.filter((s) =>
    ["gp_review", "editorial_review", "approved"].includes(s.status)
  ).length;
  const live = stories.filter((s) => (s.placements || []).some((p) => p.live)).length;
  const consentAging = stories.filter((s) => consentRisk(s) === "aging").length;

  document.getElementById("stats").innerHTML = [
    ["Active inventory", active, "Excludes withdrawn / archived"],
    ["Awaiting human gate", needsGate, "GP · editorial · publish"],
    ["Live placements", live, "Consented channels only"],
    ["Consent aging", consentAging, "Draft linked ≥5 days"],
  ]
    .map(
      ([label, value, hint]) =>
        `<div class="rounded-2xl border border-line bg-white p-4"><p class="text-xs font-semibold uppercase tracking-wide text-ink-soft">${label}</p><p class="mt-1 font-display text-3xl font-bold text-navy">${value}</p><p class="mt-1 text-xs text-ink-soft">${hint}</p></div>`
    )
    .join("");
}

function renderCategoryBars() {
  const counts = {};
  for (const id of Object.keys(CAT_LABEL)) counts[id] = 0;
  for (const s of inventory.stories) {
    if (["withdrawn", "archived"].includes(s.status)) continue;
    counts[s.primaryCategory] = (counts[s.primaryCategory] || 0) + 1;
  }
  const max = Math.max(1, ...Object.values(counts));
  document.getElementById("category-bars").innerHTML = Object.entries(CAT_LABEL)
    .map(([id, label]) => {
      const n = counts[id] || 0;
      const pct = Math.round((n / max) * 100);
      return `<div class="rounded-xl border border-line bg-white p-3"><p class="text-xs font-medium text-ink">${label}</p><div class="mt-2 h-2 rounded bg-mist"><div class="h-2 rounded bg-navy" style="width:${pct}%"></div></div><p class="mt-1 text-xs text-ink-soft">${n} active</p></div>`;
    })
    .join("");
}

function renderFilters() {
  const statuses = ["all", ...PRIORITY.filter((s) => inventory.stories.some((x) => x.status === s))];
  document.getElementById("status-filters").innerHTML = statuses
    .map((s) => {
      const label = s === "all" ? "All statuses" : STATUS_LABEL[s] || s;
      const on = filterStatus === s;
      return `<button type="button" data-status="${s}" class="min-h-11 w-full rounded-lg border px-3 text-left text-sm ${on ? "border-navy bg-navy text-white" : "border-line bg-white text-ink"}">${label}</button>`;
    })
    .join("");

  document.getElementById("category-filters").innerHTML = ["all", ...Object.keys(CAT_LABEL)]
    .map((c) => {
      const label = c === "all" ? "All categories" : CAT_LABEL[c];
      const on = filterCategory === c;
      return `<button type="button" data-category="${c}" class="min-h-11 w-full rounded-lg border px-3 text-left text-sm ${on ? "border-navy bg-navy text-white" : "border-line bg-white text-ink"}">${label}</button>`;
    })
    .join("");

  document.querySelectorAll("[data-status]").forEach((btn) =>
    btn.addEventListener("click", () => {
      filterStatus = btn.getAttribute("data-status");
      render();
    })
  );
  document.querySelectorAll("[data-category]").forEach((btn) =>
    btn.addEventListener("click", () => {
      filterCategory = btn.getAttribute("data-category");
      render();
    })
  );
}

function renderTable() {
  const rows = filteredStories();
  document.getElementById("inv-count").textContent = `${rows.length} shown`;
  if (!rows.length) {
    document.getElementById("story-table").innerHTML =
      `<p class="p-4 text-sm text-ink-soft">No stories match filters.</p>`;
    return;
  }

  const head =
    `<table class="min-w-full text-left text-sm"><thead class="border-b border-line bg-warm text-xs uppercase tracking-wide text-ink-soft"><tr><th class="px-3 py-3">Story</th><th class="px-3 py-3">Category</th><th class="px-3 py-3">Status</th><th class="px-3 py-3">Consent</th><th class="px-3 py-3">Days</th></tr></thead><tbody>`;
  const body = rows
    .map((s) => {
      const sel = s.id === selectedId ? "bg-mist" : "";
      const risk = consentRisk(s);
      const riskLabel =
        risk === "aging" ? "Aging" : risk === "ok" ? "Signed" : risk === "withdrawn" ? "Withdrawn" : "Pending";
      const riskCls =
        risk === "aging"
          ? "text-amber"
          : risk === "ok"
            ? "text-green"
            : risk === "withdrawn"
              ? "text-ink-soft"
              : "text-navy";
      return `<tr class="cursor-pointer border-b border-line ${sel} hover:bg-mist" data-id="${s.id}"><td class="px-3 py-3"><p class="font-medium text-ink">${s.workingTitle}</p><p class="text-xs text-ink-soft">${s.subjectDisplayName}</p></td><td class="px-3 py-3">${CAT_LABEL[s.primaryCategory] || s.primaryCategory}</td><td class="px-3 py-3"><span class="inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${toneForStatus(s.status)}">${STATUS_LABEL[s.status] || s.status}</span></td><td class="px-3 py-3 ${riskCls}">${riskLabel}</td><td class="px-3 py-3">${s.daysInStatus}</td></tr>`;
    })
    .join("");
  document.getElementById("story-table").innerHTML = head + body + "</tbody></table>";
  document.querySelectorAll("[data-id]").forEach((tr) =>
    tr.addEventListener("click", () => {
      selectedId = tr.getAttribute("data-id");
      renderDetail();
      renderTable();
      document.getElementById("board-live").textContent = `Selected ${selectedId}`;
    })
  );
}

function renderDetail() {
  const el = document.getElementById("story-detail");
  const s = inventory.stories.find((x) => x.id === selectedId);
  if (!s) {
    el.innerHTML = `<p class="text-sm text-ink-soft">Select a story to inspect consent, reuse, and next action.</p>`;
    return;
  }
  const c = s.consent || {};
  const allowed = (c.channelsAllowed || []).join(", ") || "—";
  const denied = (c.channelsDenied || []).join(", ") || "—";
  const placements = (s.placements || [])
    .map(
      (p) =>
        `<li class="text-sm"><span class="${p.live ? "text-green font-medium" : "text-ink-soft"}">${p.live ? "LIVE" : "planned"}</span> · ${p.channel} · <code>${p.surfacePath}</code>${p.takeDownReason ? ` · ${p.takeDownReason}` : ""}</li>`
    )
    .join("") || "<li class='text-sm text-ink-soft'>No placements yet</li>";

  el.innerHTML = `
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-green">${STATUS_LABEL[s.status]}</p>
        <h3 class="mt-1 font-display text-2xl font-bold">${s.workingTitle}</h3>
        <p class="mt-1 text-sm text-ink-soft">${s.subjectDisplayName} · ${CAT_LABEL[s.primaryCategory]}${(s.secondaryCategories || []).map((x) => " · " + CAT_LABEL[x]).join("")}</p>
      </div>
      <a class="min-h-11 inline-flex items-center rounded-lg border border-line px-4 text-sm font-medium text-navy" href="/editorial.html?id=${encodeURIComponent(s.id)}">Open editorial</a>
    </div>
    <dl class="mt-5 grid gap-3 sm:grid-cols-2 text-sm">
      <div class="rounded-xl bg-mist p-3"><dt class="text-xs uppercase tracking-wide text-ink-soft">Consent</dt><dd class="mt-1 font-medium">${c.status} · ${c.consentVersion || ""}</dd></div>
      <div class="rounded-xl bg-mist p-3"><dt class="text-xs uppercase tracking-wide text-ink-soft">Attribution</dt><dd class="mt-1 font-medium">${s.attribution || "TBD"} ${s.publicByline ? "· " + s.publicByline : ""}</dd></div>
      <div class="rounded-xl bg-mist p-3"><dt class="text-xs uppercase tracking-wide text-ink-soft">Channels allowed</dt><dd class="mt-1">${allowed}</dd></div>
      <div class="rounded-xl bg-mist p-3"><dt class="text-xs uppercase tracking-wide text-ink-soft">Channels denied</dt><dd class="mt-1">${denied}</dd></div>
    </dl>
    <div class="mt-4">
      <h4 class="text-xs font-semibold uppercase tracking-wide text-ink-soft">Placements</h4>
      <ul class="mt-2 space-y-1">${placements}</ul>
    </div>
    <p class="mt-4 rounded-xl border border-navy/15 bg-warm px-3 py-2 text-sm"><strong class="text-navy">Next:</strong> ${s.nextAction}</p>
  `;
}

function render() {
  renderStats();
  renderCategoryBars();
  renderFilters();
  renderTable();
  renderDetail();
}

async function boot() {
  const [inv, wf] = await Promise.all([
    fetch("/api/inventory").then((r) => r.json()),
    fetch("/api/workflow").then((r) => r.json()),
  ]);
  inventory = inv;
  workflow = wf;
  if (!selectedId && inv.stories.length) {
    selectedId = filteredStories()[0]?.id || inv.stories[0].id;
  }
  render();
}

boot().catch((err) => {
  document.body.insertAdjacentHTML(
    "afterbegin",
    `<p class="bg-amber/20 p-3 text-sm">Start prototype: <code>node server.mjs</code> — ${err.message}</p>`
  );
});
