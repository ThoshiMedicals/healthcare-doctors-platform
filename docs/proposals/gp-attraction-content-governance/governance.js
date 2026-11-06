(() => {
  "use strict";

  /** @type {any} */
  let gov = null;
  const STORAGE = "wmc-gp-attraction-gov-checklist-v1";
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

  function card(title, html, meta) {
    return `<article class="rounded-2xl border border-line bg-white p-4 sm:p-5">
      ${meta ? `<p class="text-xs font-semibold uppercase tracking-[0.14em] text-green">${esc(meta)}</p>` : ""}
      <h2 class="font-display text-xl font-bold text-ink">${esc(title)}</h2>
      <div class="mt-3 text-sm leading-relaxed text-ink-soft">${html}</div>
    </article>`;
  }

  function list(items, label) {
    return `<p class="font-semibold text-ink">${esc(label)}</p><ul class="mt-1 list-disc space-y-1 pl-5">${items
      .map((i) => `<li>${esc(i)}</li>`)
      .join("")}</ul>`;
  }

  function renderRules(panel) {
    const hr = gov.hardRules;
    panel.innerHTML = Object.values(hr)
      .map((r) =>
        card(
          r.rule,
          `${list(r.forbidden, "Forbidden")}
           <div class="mt-3">${list(r.preferred, "Preferred")}</div>
           ${r.requiredStatement ? `<aside class="mt-3 rounded-xl border border-navy/20 bg-mist/50 p-3 text-ink"><strong>Required when topic appears:</strong> ${esc(r.requiredStatement)}</aside>` : ""}`,
          "Hard rule"
        )
      )
      .join("");
  }

  function renderTone(panel) {
    const t = gov.tone;
    const m = gov.messaging;
    panel.innerHTML = [
      card(
        "Tone",
        `<p><strong class="text-ink">Voice:</strong> ${esc(t.voice)}</p>
         <p class="mt-1"><strong class="text-ink">Person:</strong> ${esc(t.person)}</p>
         <p class="mt-1"><strong class="text-ink">Register:</strong> ${esc(t.register)}</p>
         <div class="mt-3">${list(t.do, "Do")}</div>
         <div class="mt-3">${list(t.dont, "Don’t")}</div>`
      ),
      card(
        "Pillars",
        t.pillars
          .map(
            (p) =>
              `<p class="mt-2"><strong class="text-ink">${esc(p.label)}.</strong> ${esc(p.messaging)}</p>`
          )
          .join("")
      ),
      card(
        "Messaging frame",
        `<p><strong class="text-ink">Primary:</strong> ${esc(m.primaryFrame)}</p>
         <p class="mt-1"><strong class="text-ink">Not:</strong> ${esc(m.notFrame)}</p>
         <div class="mt-3">${list(m.approvedCtas, "Approved CTAs")}</div>
         <div class="mt-3">${list(m.disallowedCtas, "Disallowed CTAs")}</div>
         <div class="mt-3">${list(m.mustIncludeWhenRelevant, "Must include when relevant")}</div>`
      ),
      card(
        "Surface roles",
        Object.entries(m.surfaceRoles)
          .map(([k, v]) => `<p class="mt-2"><strong class="text-ink">${esc(k)}:</strong> ${esc(v)}</p>`)
          .join("")
      ),
    ].join("");
  }

  function renderApprovals(panel) {
    const a = gov.approvals;
    panel.innerHTML = [
      card("Principle", `<p>${esc(a.principle)}</p>`),
      card(
        "Roles",
        a.roles
          .map(
            (r) =>
              `<p class="mt-2"><strong class="text-ink">${esc(r.role)}.</strong> ${esc(r.responsibility)}</p>`
          )
          .join("")
      ),
      card(
        "Change classes",
        a.changeClasses
          .map(
            (c) =>
              `<div class="mt-3 border-t border-line pt-3 first:border-0 first:pt-0">
                <p class="font-semibold text-ink">${esc(c.class)}</p>
                <p>${esc(c.examples)}</p>
                <p class="mt-1 text-xs">Approvers: ${esc(c.approvers.join(" · "))}</p>
              </div>`
          )
          .join("")
      ),
      card(
        "Gates",
        a.gates
          .map(
            (g) =>
              `<div class="mt-3 border-t border-line pt-3 first:border-0 first:pt-0">
                <p class="font-semibold text-ink">${esc(g.label)}${g.when ? ` · ${esc(g.when)}` : ""}</p>
                <ul class="mt-1 list-disc pl-5">${g.checks.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>
              </div>`
          )
          .join("")
      ),
      card("Record", `<p>${esc(a.record)}</p>`),
    ].join("");
  }

  function renderSchema(panel) {
    const s = gov.schemaStandards;
    panel.innerHTML = [
      card(
        "Clinic entity",
        `<pre class="overflow-x-auto rounded-lg bg-mist p-3 text-xs text-ink">${esc(
          JSON.stringify(s.clinicEntity, null, 2)
        )}</pre>`
      ),
      card("Allowed on attraction surfaces", list(s.allowedOnAttractionSurfaces, "Types")),
      card("Forbidden on decision pages", list(s.forbiddenOnDecisionPages, "Do not emit")),
      card(
        "Sync & meta",
        `<p><strong class="text-ink">FAQ sync:</strong> ${esc(s.faqSyncRule)}</p>
         <p class="mt-2"><strong class="text-ink">Breadcrumb:</strong> ${esc(s.breadcrumbDefault)}</p>
         <div class="mt-3">${list(s.metaRules, "Meta / OG")}</div>`
      ),
    ].join("");
  }

  function renderA11y(panel) {
    const a = gov.accessibilityStandards;
    panel.innerHTML = [
      card("Baseline", `<p>${esc(a.baseline)}</p>`),
      ...a.requirements.map((r) => card(r.id, `<p>${esc(r.rule)}</p>`, "A11y")),
    ].join("");
  }

  function loadChecks() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE) || "{}");
    } catch {
      return {};
    }
  }

  function saveChecks(map) {
    localStorage.setItem(STORAGE, JSON.stringify(map));
  }

  function renderChecklist(panel) {
    const checks = loadChecks();
    const items = gov.prePublishChecklist;
    const done = items.filter((_, i) => checks[`c${i}`]).length;
    const blocked = done < items.length;

    panel.innerHTML = `
      <div class="rounded-2xl border border-line bg-white p-4 sm:p-5">
        <h2 class="font-display text-xl font-bold">Pre-publish checklist</h2>
        <p class="mt-1 text-sm text-ink-soft">${done} / ${items.length} complete · ${
      blocked ? "Publish blocked until all items checked (prototype)" : "Checklist complete — still needs named human approvers"
    }</p>
        <ul class="mt-4 space-y-2">
          ${items
            .map(
              (item, i) => `
            <li>
              <label class="flex gap-3 rounded-xl border border-line p-3 has-[:checked]:border-navy/40 has-[:checked]:bg-mist/50">
                <input type="checkbox" class="mt-0.5 h-5 w-5" data-check="c${i}" ${checks[`c${i}`] ? "checked" : ""} />
                <span class="text-sm">${esc(item)}</span>
              </label>
            </li>`
            )
            .join("")}
        </ul>
        <div class="mt-4 flex flex-wrap gap-2">
          <button type="button" id="btn-export-gov" class="min-h-10 rounded-full border border-line px-4 text-sm font-semibold text-navy">Export checklist JSON</button>
          <button type="button" id="btn-reset-gov" class="min-h-10 rounded-full border border-line px-4 text-sm font-semibold text-navy">Reset</button>
        </div>
        <p class="mt-3 text-xs text-ink-soft" role="status">${
          blocked
            ? "Hard rules and checklist must pass before live attraction content ships."
            : "Record approver names for the change class in the CMS / release note."
        }</p>
      </div>`;

    panel.querySelectorAll("[data-check]").forEach((el) => {
      el.addEventListener("change", () => {
        const map = loadChecks();
        const key = el.getAttribute("data-check");
        if (el instanceof HTMLInputElement && el.checked) map[key] = true;
        else delete map[key];
        saveChecks(map);
        renderChecklist(panel);
      });
    });

    panel.querySelector("#btn-reset-gov")?.addEventListener("click", () => {
      localStorage.removeItem(STORAGE);
      renderChecklist(panel);
    });

    panel.querySelector("#btn-export-gov")?.addEventListener("click", () => {
      const map = loadChecks();
      const payload = {
        formType: "gp_attraction_governance_checklist",
        version: gov.version,
        exportedAt: new Date().toISOString(),
        items: items.map((label, i) => ({ label, done: !!map[`c${i}`] })),
        allComplete: items.every((_, i) => map[`c${i}`]),
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wmc-gp-attraction-gov-checklist-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  async function init() {
    try {
      const res = await fetch("./governance.json", { cache: "no-store" });
      if (!res.ok) throw new Error("fail");
      gov = await res.json();
    } catch {
      const err = $("load-error");
      err.hidden = false;
      err.classList.remove("hidden");
      return;
    }

    document.querySelectorAll("[data-tab]").forEach((btn) => {
      btn.addEventListener("click", () => setTab(btn.getAttribute("data-tab")));
    });

    renderRules(document.querySelector('[data-panel="rules"]'));
    renderTone(document.querySelector('[data-panel="tone"]'));
    renderApprovals(document.querySelector('[data-panel="approvals"]'));
    renderSchema(document.querySelector('[data-panel="schema"]'));
    renderA11y(document.querySelector('[data-panel="a11y"]'));
    renderChecklist(document.querySelector('[data-panel="checklist"]'));
    setTab("rules");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
