/**
 * Practice Support Capability Matrix — doctor-facing renderer
 * Woolloongabba Medical Centre — localhost proposal
 */
(() => {
  "use strict";

  const root = document.getElementById("matrix-root");
  const intro = document.getElementById("matrix-intro");
  const live = document.getElementById("matrix-live");
  const matrixSection = document.getElementById("matrix");

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function listItems(items) {
    return items.map((item) => `<li class="leading-snug">${escapeHtml(item)}</li>`).join("");
  }

  function externalItems(deps) {
    return deps
      .map(
        (d) =>
          `<li class="leading-snug"><span class="font-medium text-ink">${escapeHtml(d.agency)}:</span> ${escapeHtml(d.dependency)}</li>`
      )
      .join("");
  }

  function renderCategory(category) {
    return `
      <details class="group rounded-2xl border border-line bg-white open:shadow-[0_8px_24px_rgba(23,48,68,0.05)]" ${category.order === 1 ? "open" : ""}>
        <summary class="flex min-h-14 cursor-pointer items-start gap-3 px-4 py-4 sm:px-5">
          <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mist text-xs font-semibold text-navy" aria-hidden="true">${category.order}</span>
          <span class="min-w-0 flex-1">
            <span class="block font-display text-lg font-bold leading-snug">${escapeHtml(category.label)}</span>
            <span class="mt-1 block text-sm text-ink-soft">${escapeHtml(category.doctorFacingSummary)}</span>
          </span>
          <span class="mt-1 text-ink-soft transition group-open:rotate-180" aria-hidden="true">▾</span>
        </summary>
        <div class="space-y-4 border-t border-line px-4 py-4 sm:px-5">
          <div>
            <h3 class="text-xs font-semibold uppercase tracking-wide text-green">What WMC can assist with</h3>
            <ul class="mt-2 list-disc space-y-1.5 pl-5 text-sm">${listItems(category.canAssist)}</ul>
          </div>
          <div>
            <h3 class="text-xs font-semibold uppercase tracking-wide text-amber">What WMC cannot approve</h3>
            <ul class="mt-2 list-disc space-y-1.5 pl-5 text-sm">${listItems(category.cannotApprove)}</ul>
          </div>
          <div>
            <h3 class="text-xs font-semibold uppercase tracking-wide text-navy">What depends on external agencies</h3>
            <ul class="mt-2 list-disc space-y-1.5 pl-5 text-sm">${externalItems(category.externalDepends)}</ul>
          </div>
          ${
            category.typicalTiming
              ? `<p class="text-xs text-ink-soft"><span class="font-semibold text-ink">Typical timing:</span> ${escapeHtml(category.typicalTiming)}</p>`
              : ""
          }
        </div>
      </details>`;
  }

  async function init() {
    try {
      const res = await fetch("/api/capability-matrix");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const categories = [...data.categories].sort((a, b) => a.order - b.order);

      intro.textContent =
        "Nine support areas. Expand any category to see assistance, limits, and external dependencies.";
      root.innerHTML = categories.map(renderCategory).join("");
      matrixSection.setAttribute("aria-busy", "false");
      if (live) live.textContent = `Loaded ${categories.length} practice support categories.`;
    } catch (err) {
      intro.textContent = "Could not load the matrix. Start the local server with node server.mjs.";
      root.innerHTML = `<p class="rounded-xl border border-red-200 bg-white p-4 text-sm text-red-800" role="alert">${escapeHtml(String(err.message || err))}</p>`;
      matrixSection.setAttribute("aria-busy", "false");
    }
  }

  init();
})();
