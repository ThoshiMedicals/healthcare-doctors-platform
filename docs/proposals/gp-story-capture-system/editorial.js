/* GP Story Editorial Review — blocking gate wireframe */
const FORBIDDEN_REVIEWERS = ["system", "auto", "automation", "bot", "scheduler", "cron"];

const CAT_LABEL = {
  early_career: "Early Career",
  established: "Established",
  returning: "Returning",
  part_time: "Part-Time",
  special_interest: "Special Interest",
};

let workflow = null;
let inventory = { stories: [] };
let selectedId = null;
let checks = {};

function queueStories() {
  return inventory.stories.filter((s) =>
    ["editorial_review", "approved", "gp_review", "changes_requested"].includes(s.status)
  );
}

function storyById(id) {
  return inventory.stories.find((s) => s.id === id) || null;
}

function blockingChecks() {
  return (workflow?.editorialReviewFlow?.checklist || []).filter((c) => c.blocking);
}

function allBlockingPassed() {
  return blockingChecks().every((c) => checks[c.id] === true);
}

function renderQueue() {
  const q = queueStories();
  const el = document.getElementById("queue-list");
  if (!q.length) {
    el.innerHTML = `<p class="text-sm text-ink-soft">Queue empty.</p>`;
    return;
  }
  el.innerHTML = q
    .map((s) => {
      const on = s.id === selectedId;
      return `<button type="button" data-qid="${s.id}" class="min-h-11 w-full rounded-lg border px-3 py-2 text-left text-sm ${on ? "border-navy bg-navy text-white" : "border-line bg-white text-ink"}"><span class="block font-medium">${s.workingTitle}</span><span class="block text-xs opacity-80">${s.status} · ${CAT_LABEL[s.primaryCategory]}</span></button>`;
    })
    .join("");
  el.querySelectorAll("[data-qid]").forEach((btn) =>
    btn.addEventListener("click", () => {
      selectedId = btn.getAttribute("data-qid");
      checks = {};
      render();
    })
  );
}

function autoHints(story) {
  const c = story.consent || {};
  return {
    chk_consent_signed: c.status === "signed",
    chk_channels: (c.channelsAllowed || []).length > 0,
    chk_third_party: !(c.channelsAllowed || []).some((ch) =>
      ["job_boards", "recruitment_agencies", "paid_testimonial_networks"].includes(ch)
    ),
    chk_attribution: Boolean(story.attribution),
    chk_category: Boolean(story.primaryCategory),
  };
}

function renderPanel() {
  const panel = document.getElementById("review-panel");
  const story = storyById(selectedId);
  if (!story) {
    panel.innerHTML = `<p class="text-sm text-ink-soft">Select a story from the editorial queue.</p>`;
    return;
  }

  const hints = autoHints(story);
  const checklist = workflow.editorialReviewFlow.checklist || [];
  const canApprove =
    story.status === "editorial_review" && allBlockingPassed();

  const checkRows = checklist
    .map((c) => {
      const checked = checks[c.id] === true;
      const hint = hints[c.id];
      const hintText =
        hint === true ? "System hint: looks OK" : hint === false ? "System hint: review carefully" : "";
      return `<label class="flex gap-3 rounded-xl border border-line p-3 ${c.blocking ? "" : "opacity-90"}"><input type="checkbox" data-check="${c.id}" class="mt-1 h-4 w-4" ${checked ? "checked" : ""} /><span><span class="block text-sm font-medium text-ink">${c.label}</span><span class="block text-xs text-ink-soft">${c.blocking ? "Blocking" : "Advisory"}${hintText ? " · " + hintText : ""}</span></span></label>`;
    })
    .join("");

  panel.innerHTML = `
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-amber">${story.status.replaceAll("_", " ")}</p>
        <h2 class="mt-1 font-display text-2xl font-bold">${story.workingTitle}</h2>
        <p class="mt-1 text-sm text-ink-soft">${story.subjectDisplayName} · ${CAT_LABEL[story.primaryCategory]}${story.specialInterestLabel ? " · " + story.specialInterestLabel : ""}</p>
      </div>
      <p class="rounded-lg bg-mist px-3 py-2 text-xs text-ink-soft">Change class hint: ${workflow.editorialReviewFlow.changeClassHint}</p>
    </div>

    <div class="mt-5 grid gap-3 sm:grid-cols-3 text-sm">
      <div class="rounded-xl bg-mist p-3"><p class="text-xs uppercase text-ink-soft">Consent</p><p class="mt-1 font-medium">${story.consent?.status}</p></div>
      <div class="rounded-xl bg-mist p-3"><p class="text-xs uppercase text-ink-soft">Allowed channels</p><p class="mt-1">${(story.consent?.channelsAllowed || []).join(", ") || "—"}</p></div>
      <div class="rounded-xl bg-mist p-3"><p class="text-xs uppercase text-ink-soft">Formats</p><p class="mt-1">${(story.formats || []).join(", ") || "—"}</p></div>
    </div>

    <h3 class="mt-6 text-xs font-semibold uppercase tracking-wide text-ink-soft">Blocking checklist</h3>
    <div class="mt-3 space-y-2" id="check-list">${checkRows}</div>

    <form id="gate-form" class="mt-6 space-y-3 rounded-2xl border border-navy/20 bg-warm p-4">
      <h3 class="font-display text-lg font-bold">Human gate</h3>
      <div class="grid gap-3 sm:grid-cols-2">
        <label class="text-sm">Reviewer name
          <input required name="reviewerName" class="mt-1 min-h-11 w-full rounded-lg border border-line bg-white px-3" placeholder="Named human" />
        </label>
        <label class="text-sm">Reviewer id
          <input required name="reviewerId" class="mt-1 min-h-11 w-full rounded-lg border border-line bg-white px-3" placeholder="user id (not system)" />
        </label>
      </div>
      <label class="block text-sm">Rationale
        <textarea required name="rationale" rows="3" class="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2" placeholder="Why this decision"></textarea>
      </label>
      <label class="block text-sm">Decision
        <select name="decision" class="mt-1 min-h-11 w-full rounded-lg border border-line bg-white px-3">
          <option value="approve_advance">Approve → approved inventory</option>
          <option value="request_changes">Request changes → drafting</option>
          <option value="pause">Pause</option>
        </select>
      </label>
      <p id="gate-error" class="hidden text-sm text-danger"></p>
      <button type="submit" class="min-h-11 rounded-lg bg-navy px-4 font-semibold text-white disabled:opacity-40" ${story.status !== "editorial_review" ? "disabled" : ""}>
        Record gate event
      </button>
      <p class="text-xs text-ink-soft">Approve is disabled in UI until all blocking checks are ticked. Server also rejects forbidden reviewer ids.</p>
      <p class="text-xs ${canApprove ? "text-green" : "text-amber"}">${canApprove ? "Blocking checks complete — approve allowed." : "Complete all blocking checks before approve."}</p>
    </form>
    <pre id="last-event" class="mt-4 overflow-x-auto rounded-xl bg-ink p-3 text-xs text-warm"></pre>
  `;

  panel.querySelectorAll("[data-check]").forEach((input) => {
    input.addEventListener("change", () => {
      checks[input.getAttribute("data-check")] = input.checked;
      renderPanel();
      bindForm();
    });
  });
  bindForm();
}

function bindForm() {
  const form = document.getElementById("gate-form");
  if (!form) return;
  form.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const decision = fd.get("decision");
    const reviewerId = String(fd.get("reviewerId") || "").trim().toLowerCase();
    const err = document.getElementById("gate-error");

    if (FORBIDDEN_REVIEWERS.includes(reviewerId)) {
      err.textContent = "Reviewer id cannot be system/auto/bot.";
      err.classList.remove("hidden");
      return;
    }
    if (decision === "approve_advance" && !allBlockingPassed()) {
      err.textContent = "All blocking checks must pass before approve.";
      err.classList.remove("hidden");
      return;
    }

    const payload = {
      storyId: selectedId,
      decision,
      reviewerId: String(fd.get("reviewerId")).trim(),
      reviewerName: String(fd.get("reviewerName")).trim(),
      rationale: String(fd.get("rationale")).trim(),
      checklistSnapshot: { ...checks },
    };

    const res = await fetch("/api/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      err.textContent = data.error || "Gate rejected";
      err.classList.remove("hidden");
      return;
    }
    document.getElementById("last-event").textContent = JSON.stringify(data.event, null, 2);
    document.getElementById("review-live").textContent = `Gate recorded: ${decision}`;
    inventory = data.inventory;
    checks = {};
    render();
  };
}

function render() {
  renderQueue();
  renderPanel();
}

async function boot() {
  const params = new URLSearchParams(location.search);
  const [inv, wf] = await Promise.all([
    fetch("/api/inventory").then((r) => r.json()),
    fetch("/api/workflow").then((r) => r.json()),
  ]);
  inventory = inv;
  workflow = wf;
  const pref = params.get("id");
  const q = queueStories();
  selectedId = (pref && storyById(pref)?.id) || q[0]?.id || inv.stories[0]?.id || null;
  render();
}

boot().catch((err) => {
  document.body.insertAdjacentHTML(
    "afterbegin",
    `<p class="bg-amber/20 p-3 text-sm">Start prototype: <code>node server.mjs</code> — ${err.message}</p>`
  );
});
