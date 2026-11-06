(() => {
  "use strict";

  /** @type {any} */
  let data = null;
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

  function card(title, body, meta) {
    return `<article class="rounded-2xl border border-line bg-white p-4 sm:p-5">
      ${meta ? `<p class="text-xs font-semibold uppercase tracking-[0.14em] text-green">${esc(meta)}</p>` : ""}
      <h3 class="mt-1 font-display text-lg font-bold text-ink">${esc(title)}</h3>
      <div class="mt-2 text-sm leading-relaxed text-ink-soft">${body}</div>
    </article>`;
  }

  function render() {
    $("tracks-root").innerHTML = data.tracks
      .map(
        (t) =>
          card(
            t.label,
            `<p>${esc(t.who)}</p><p class="mt-2"><strong class="text-ink">Depends on:</strong> ${esc(t.criticalDependency)}</p><p class="mt-2">${esc(t.intakePosture)}</p>`,
            "Track"
          )
      )
      .join("");

    $("journey-root").innerHTML = data.journey
      .map((j) =>
        card(
          j.label,
          `<p><strong class="text-ink">Doctor job:</strong> ${esc(j.doctorJob)}</p>
           <p class="mt-2"><strong class="text-ink">Surfaces:</strong> ${esc(j.surfaces.join(" · "))}</p>
           <p class="mt-2 italic">“${esc(j.question)}”</p>`,
          j.tracks.join(" · ")
        )
      )
      .join("");

    const w = data.website;
    $("website-root").innerHTML = `
      ${card("Page chrome", `<p><strong class="text-ink">Path:</strong> ${esc(w.suggestedPath)}</p><p class="mt-1"><strong class="text-ink">Title:</strong> ${esc(w.title)}</p>`)}
      ${card(w.h1, `<p class="text-base">${esc(w.lede)}</p>`, "H1 + lede")}
      ${card("Registrar", `<p>${esc(w.trackCards.registrar)}</p>`, "Track card")}
      ${card("Early-career", `<p>${esc(w.trackCards.earlyCareer)}</p>`, "Track card")}
      ${card("Provider numbers", `<p>${esc(w.providerLine)}</p>`, "Boundary copy")}
      ${card(
        "Page blocks",
        `<ol class="list-decimal space-y-1 pl-5">${w.blocks
          .map((b) => `<li><strong class="text-ink">${esc(b.heading)}</strong> — ${esc(b.job)}</li>`)
          .join("")}</ol>`
      )}
      ${card(
        "CTAs",
        `<ul class="list-disc space-y-1 pl-5">${w.cta.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>`
      )}
      ${card(
        "Schema notes",
        `<ul class="list-disc space-y-1 pl-5">${w.schemaNotes.map((s) => `<li>${esc(s)}</li>`).join("")}</ul>`
      )}`;

    $("ops-root").innerHTML = data.operationalWorkflow
      .map((s) =>
        card(
          `${s.id} · ${s.label}`,
          `<ul class="list-disc space-y-1 pl-5">${s.actions.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>`
        )
      )
      .join("");

    $("raci-root").innerHTML = card(
      "RACI summary",
      `<ul class="space-y-2">${data.raci
        .map((r) => `<li><strong class="text-ink">${esc(r.role)}.</strong> ${esc(r.duty)}</li>`)
        .join("")}</ul>`
    );

    $("training-root").innerHTML = data.trainingSupport
      .map((t) =>
        card(t.element, `<p>${esc(t.standard)}</p>`, t.track)
      )
      .join("");

    $("supervision-root").innerHTML = data.supervisionConversations
      .map((s) =>
        card(
          s.label,
          `<p><strong class="text-ink">When:</strong> ${esc(s.when)}</p>
           <p class="mt-1"><strong class="text-ink">Focus:</strong> ${esc(s.focus)}</p>
           <p class="mt-1"><strong class="text-ink">Artefact:</strong> ${esc(s.artefact)}</p>`
        )
      )
      .join("");

    $("sessions-root").innerHTML = data.sessionProgression
      .map((s) =>
        card(s.step, `<p>${esc(s.footprint)}</p><p class="mt-2"><strong class="text-ink">Gate:</strong> ${esc(s.gate)}</p>`)
      )
      .join("");

    $("readiness-root").innerHTML = data.readinessSignals
      .map((r) =>
        card(r.signal, `<p><strong class="text-ink">Applies:</strong> ${esc(r.applies)}</p><p class="mt-1"><strong class="text-ink">Tool:</strong> ${esc(r.tool)}</p>`)
      )
      .join("");

    const pn = data.providerNumberGuidance;
    $("pn-root").innerHTML = card(
      "Services Australia is the issuer",
      `<p>${esc(pn.issuer)}</p>
       <p class="mt-3"><strong class="text-ink">Practice can:</strong></p>
       <ul class="mt-1 list-disc space-y-1 pl-5">${pn.practiceRole.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
       <p class="mt-3"><strong class="text-ink">Practice cannot:</strong></p>
       <ul class="mt-1 list-disc space-y-1 pl-5">${pn.cannotDo.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
       <p class="mt-3"><strong class="text-ink">Registrar:</strong> ${esc(pn.registrarNote)}</p>
       <p class="mt-2"><strong class="text-ink">Early-career:</strong> ${esc(pn.earlyCareerNote)}</p>
       <p class="mt-2"><strong class="text-ink">Go-live:</strong> ${esc(pn.goLiveConstraint)}</p>`
    );
  }

  async function init() {
    try {
      const res = await fetch("./pathway.json", { cache: "no-store" });
      if (!res.ok) throw new Error("load failed");
      data = await res.json();
    } catch {
      const err = $("load-error");
      if (err) {
        err.hidden = false;
        err.classList.remove("hidden");
      }
      return;
    }

    document.querySelectorAll("[data-tab]").forEach((btn) => {
      btn.addEventListener("click", () => setTab(btn.getAttribute("data-tab")));
    });
    render();
    setTab("journey");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
