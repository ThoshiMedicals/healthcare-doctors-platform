(() => {
  "use strict";

  /** @type {any} */
  let g = null;
  let selectedId = null;
  const $ = (id) => document.getElementById(id);

  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
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

  const TYPE_COLOUR = {
    persona: "bg-navy text-white",
    objection: "bg-amber-900 text-white",
    faq: "bg-green text-white",
    search: "bg-ink text-white",
    readiness: "bg-sky-800 text-white",
    eoi_path: "bg-emerald-800 text-white",
    content_gap: "bg-rose-800 text-white",
    intelligence: "bg-violet-900 text-white",
  };

  function nodeById(id) {
    return g.nodes.find((n) => n.id === id);
  }

  function renderNodes() {
    const filter = /** @type {HTMLSelectElement} */ ($("type-filter")).value;
    const root = $("nodes-root");
    root.innerHTML = g.nodes
      .filter((n) => filter === "all" || n.type === filter)
      .map((n) => {
        const cls = TYPE_COLOUR[n.type] || "bg-line text-ink";
        const sel = n.id === selectedId ? "is-selected" : "";
        return `<button type="button" class="node-chip rounded-full px-3 py-1.5 text-xs font-semibold ${cls} ${sel}" data-node-id="${esc(n.id)}">${esc(n.label)}</button>`;
      })
      .join("");

    root.querySelectorAll("[data-node-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedId = btn.getAttribute("data-node-id");
        renderNodes();
        renderEdges();
      });
    });
  }

  function renderEdges() {
    const box = $("edges-root");
    if (!selectedId) {
      box.textContent = "Select a node.";
      return;
    }
    const node = nodeById(selectedId);
    const out = g.edges.filter((e) => e.from === selectedId);
    const inn = g.edges.filter((e) => e.to === selectedId);
    $("selection-live").textContent = `${node.label} · ${out.length} out · ${inn.length} in`;

    const line = (e, dir) => {
      const otherId = dir === "out" ? e.to : e.from;
      const other = nodeById(otherId);
      return `<li><span class="font-medium text-navy">${esc(e.type)}</span> ${dir === "out" ? "→" : "←"} <button type="button" class="underline" data-jump="${esc(otherId)}">${esc(other?.label || otherId)}</button></li>`;
    };

    box.innerHTML = `
      <p class="font-display text-lg font-bold text-ink">${esc(node.label)}</p>
      <p class="text-xs uppercase tracking-wide text-ink-soft">${esc(node.type)}</p>
      ${node.meta ? `<pre class="mt-2 overflow-x-auto rounded-lg bg-mist p-2 text-xs">${esc(JSON.stringify(node.meta))}</pre>` : ""}
      <div class="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <h3 class="text-sm font-semibold text-ink">Outgoing</h3>
          <ul class="mt-2 list-disc space-y-1 pl-5">${out.map((e) => line(e, "out")).join("") || "<li>None</li>"}</ul>
        </div>
        <div>
          <h3 class="text-sm font-semibold text-ink">Incoming</h3>
          <ul class="mt-2 list-disc space-y-1 pl-5">${inn.map((e) => line(e, "in")).join("") || "<li>None</li>"}</ul>
        </div>
      </div>`;

    box.querySelectorAll("[data-jump]").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedId = btn.getAttribute("data-jump");
        renderNodes();
        renderEdges();
      });
    });
  }

  function renderInsights() {
    $("objections-root").innerHTML = g.derivedInsights.commonObjections
      .map(
        (o) => `
      <article class="rounded-2xl border border-line bg-white p-4">
        <div class="flex flex-wrap items-center gap-2">
          <h3 class="font-display text-lg font-bold">${esc(o.objection)}</h3>
          <span class="rounded-full bg-mist px-2 py-0.5 text-[11px] font-semibold uppercase text-navy">${esc(o.strength)}</span>
        </div>
        <ul class="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-soft">${o.evidence.map((e) => `<li>${esc(e)}</li>`).join("")}</ul>
        <p class="mt-2 text-xs text-ink-soft">Nodes: ${esc(o.linkedNodes.join(" · "))}</p>
      </article>`
      )
      .join("");

    $("gaps-root").innerHTML = g.derivedInsights.missingContent
      .map(
        (m) => `
      <article class="rounded-2xl border border-line bg-white p-4">
        <p class="text-xs font-semibold text-green">Score ${esc(m.score)}</p>
        <h3 class="font-display text-lg font-bold">${esc(m.title)}</h3>
        <p class="mt-1 text-sm text-ink-soft">Fills: ${esc(m.fillsObjections.join(", "))}</p>
        <p class="mt-1 text-sm text-ink-soft">Feeds paths: ${esc(m.feedsPaths.join(", "))}</p>
      </article>`
      )
      .join("");

    $("paths-root").innerHTML = g.derivedInsights.highConvertingPathways
      .map(
        (p) => `
      <article class="rounded-2xl border border-line bg-white p-4">
        <h3 class="font-display text-lg font-bold">${esc(p.pathId)}</h3>
        <p class="mt-1 text-sm text-ink-soft"><strong class="text-ink">Sequence:</strong> ${esc(p.sequence.join(" → "))}</p>
        <p class="mt-1 text-sm text-ink-soft"><strong class="text-ink">Persona:</strong> ${esc(p.primaryPersona)}</p>
        <p class="mt-2 text-sm text-ink-soft">${esc(p.why)}</p>
        <p class="mt-2 text-sm font-medium text-navy">Amplify: ${esc(p.amplify)}</p>
      </article>`
      )
      .join("");

    $("patterns-root").innerHTML = g.derivedInsights.emergingRecruitmentPatterns
      .map(
        (p) => `
      <article class="rounded-2xl border border-line bg-white p-4">
        <h3 class="font-display text-lg font-bold">${esc(p.label)}</h3>
        <p class="mt-2 text-sm text-ink-soft"><strong class="text-ink">Signal:</strong> ${esc(p.signal)}</p>
        <p class="mt-1 text-sm text-ink-soft"><strong class="text-ink">Implication:</strong> ${esc(p.implication)}</p>
      </article>`
      )
      .join("");
  }

  async function init() {
    try {
      const res = await fetch("./knowledge-graph.json", { cache: "no-store" });
      if (!res.ok) throw new Error("fail");
      g = await res.json();
    } catch {
      const err = $("load-error");
      err.hidden = false;
      err.classList.remove("hidden");
      return;
    }

    const types = [...new Set(g.nodes.map((n) => n.type))];
    const sel = $("type-filter");
    types.forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t;
      opt.textContent = t;
      sel.appendChild(opt);
    });
    sel.addEventListener("change", () => {
      renderNodes();
    });

    document.querySelectorAll("[data-tab]").forEach((btn) => {
      btn.addEventListener("click", () => setTab(btn.getAttribute("data-tab")));
    });

    renderNodes();
    renderEdges();
    renderInsights();
    setTab("explore");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
