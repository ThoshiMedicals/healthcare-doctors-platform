(() => {
  "use strict";

  function esc(v) {
    return String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function statusClass(status) {
    if (status === "available") return "bg-green/10 text-green border-green/30";
    if (status === "limited") return "bg-amber-50 text-amber border-amber/40";
    return "bg-mist text-ink-soft border-line";
  }

  function chip(status) {
    return `<span class="inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${statusClass(status)}">${esc(status)}</span>`;
  }

  function renderResult(data) {
    const root = document.getElementById("result-root");
    const per = (data.perSession || [])
      .map(
        (row) => `<li class="rounded-xl border border-line p-3">
          <div class="flex items-center justify-between gap-2">
            <span class="font-semibold">${esc(row.label)}</span>
            ${chip(row.status)}
          </div>
          <p class="mt-1 text-xs text-ink-soft">Free slots ${row.freeEffectiveSlots}/${row.offeredSlots} · Nursing ${esc(row.nursing)} · Existing: ${esc((row.existingGps || []).join(", ") || "none")}</p>
        </li>`
      )
      .join("");

    const options = (data.availableOptions || [])
      .map((o) => `<li class="text-sm"><strong>${esc(o.label)}</strong> ${chip(o.status)} — ${esc(o.reason)}</li>`)
      .join("");

    const alts = (data.alternativeRecommendations || [])
      .map(
        (a) => `<li class="rounded-lg border border-line bg-mist/50 p-3 text-sm">
          <p><strong>${esc(a.label)}</strong> ${chip(a.status)} <span class="text-ink-soft">for ${esc(a.forPreferred)}</span></p>
          <p class="mt-1 text-xs text-ink-soft">${esc(a.rationale)}</p>
        </li>`
      )
      .join("");

    root.innerHTML = `
      <div class="rounded-2xl border border-navy/20 bg-mist/60 p-5 text-center">
        <p class="text-xs font-semibold uppercase tracking-wide text-navy">Compatibility score</p>
        <p class="mt-1 font-display text-5xl font-bold text-navy">${data.compatibilityScore}%</p>
        <p class="mt-2 text-sm text-ink-soft">${esc(data.compatibilityLabel)}</p>
        ${data.doctorDisplayName ? `<p class="mt-1 text-xs">Doctor: ${esc(data.doctorDisplayName)}</p>` : ""}
      </div>
      <h3 class="mt-5 text-xs font-semibold uppercase tracking-wide text-ink-soft">Per preferred session</h3>
      <ul class="mt-2 space-y-2">${per}</ul>
      <h3 class="mt-5 text-xs font-semibold uppercase tracking-wide text-green">Available options</h3>
      <ul class="mt-2 space-y-2">${options || '<li class="text-sm text-ink-soft">None in preferred set</li>'}</ul>
      <h3 class="mt-5 text-xs font-semibold uppercase tracking-wide text-amber">Alternative recommendations</h3>
      <ul class="mt-2 space-y-2">${alts || '<li class="text-sm text-ink-soft">No alternatives needed</li>'}</ul>
      <p class="mt-4 text-xs text-ink-soft">${esc(data.notice)}</p>`;
  }

  async function loadCapacity() {
    const res = await fetch("/api/capacity");
    const data = await res.json();
    const grid = document.getElementById("capacity-grid");
    grid.innerHTML = (data.windows || [])
      .map(
        (w) => `<div class="rounded-lg border border-line p-2 text-xs">
          <p class="font-semibold">${esc(w.label)}</p>
          <p class="mt-1">${chip(w.status)}</p>
          <p class="mt-1 text-ink-soft">Free ${w.freeEffectiveSlots}</p>
        </div>`
      )
      .join("");
  }

  async function runMatch(preferred, doctorDisplayName) {
    const res = await fetch("/api/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferredSessions: preferred, doctorDisplayName }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Match failed");
    renderResult(data);
    return data;
  }

  async function loadAdminEmbed() {
    const params = new URLSearchParams(location.search);
    const enquiryId = params.get("enquiryId") || "enq_001";
    const box = document.getElementById("admin-embed");
    try {
      const res = await fetch(`/api/match/enquiry/${enquiryId}`);
      const data = await res.json();
      box.innerHTML = `<p class="font-medium">Enquiry ${esc(enquiryId)} · ${esc(data.doctorDisplayName || "")}</p>
        <p class="mt-1 font-display text-2xl font-bold text-navy">${data.compatibilityScore}% compatibility</p>
        <p class="mt-1 text-xs text-ink-soft">Prefs: ${(data.preferredSessions || []).map(esc).join(" · ")}</p>
        <p class="mt-2 text-xs">Admin fetch: <code>/api/match/enquiry/${esc(enquiryId)}</code></p>`;
    } catch (err) {
      box.textContent = String(err.message || err);
    }
  }

  document.getElementById("match-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const lines = document
      .getElementById("prefs")
      .value.split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    try {
      await runMatch(lines, document.getElementById("doctor").value.trim());
    } catch (err) {
      document.getElementById("result-root").innerHTML = `<p class="text-sm text-red-700" role="alert">${esc(err.message)}</p>`;
    }
  });

  document.getElementById("btn-example")?.addEventListener("click", async () => {
    const res = await fetch("/api/match/example", { method: "POST" });
    const data = await res.json();
    document.getElementById("prefs").value = "Mon PM\nWed AM\nFri PM";
    renderResult(data);
  });

  Promise.all([loadCapacity(), loadAdminEmbed(), runMatch(["Mon PM", "Wed AM", "Fri PM"], "Example GP")]).catch(
    (err) => {
      document.getElementById("result-root").innerHTML = `<p class="text-sm text-red-700">Start <code>node server.mjs</code>. ${esc(err.message)}</p>`;
    }
  );
})();
