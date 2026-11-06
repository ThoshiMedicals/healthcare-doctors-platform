(() => {
  "use strict";

  const SECTION_ORDER = [
    "opportunities",
    "facilities",
    "support",
    "eligibility",
    "faq",
    "nextSteps",
  ];

  const SECTION_LABELS = {
    opportunities: "GP Opportunities",
    facilities: "Practice facilities",
    support: "Practice support",
    eligibility: "Eligibility guidance",
    faq: "FAQ",
    nextSteps: "Next steps & contact",
  };

  /** @type {any} */
  let content = null;
  /** @type {"web" | "print" | "pdf"} */
  let viewMode = "web";

  const $ = (id) => document.getElementById(id);

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function selectedSections() {
    return SECTION_ORDER.filter((id) => {
      const el = document.querySelector(`[data-section-toggle="${id}"]`);
      return el instanceof HTMLInputElement ? el.checked : true;
    });
  }

  function faqItems() {
    const mode = /** @type {HTMLSelectElement} */ ($("faq-subset")).value;
    const all = content.sections.faq.items;
    if (mode === "decision") {
      const ids = new Set(content.sections.faq.decisionCriticalIds);
      return all.filter((f) => ids.has(f.id));
    }
    return all;
  }

  function metaBits() {
    const recipient = /** @type {HTMLInputElement} */ ($("recipient-name")).value.trim();
    const dateVal = /** @type {HTMLInputElement} */ ($("prepared-date")).value;
    const notes = /** @type {HTMLTextAreaElement} */ ($("doctor-notes")).value.trim();
    const includeContact = /** @type {HTMLInputElement} */ ($("include-contact")).checked;
    const prepared = dateVal
      ? new Date(dateVal + "T12:00:00").toLocaleDateString("en-AU", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : new Date().toLocaleDateString("en-AU", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
    return { recipient, prepared, notes, includeContact };
  }

  function renderCover(meta) {
    const m = content.meta;
    return `
      <header class="pack-cover" data-pack-block="cover">
        <p class="pack-eyebrow">${escapeHtml(m.clinic)}</p>
        <h1 class="pack-h1">${escapeHtml(m.title)}</h1>
        <p class="pack-lede">${escapeHtml(m.subtitle)}</p>
        ${
          meta.recipient
            ? `<p class="pack-meta">Prepared for <strong>${escapeHtml(meta.recipient)}</strong></p>`
            : ""
        }
        <p class="pack-meta">Prepared ${escapeHtml(meta.prepared)} · Pack v${escapeHtml(m.version)}</p>
        <aside class="pack-note" role="note">${escapeHtml(m.disclaimer)}</aside>
      </header>`;
  }

  function renderOpportunities() {
    const s = content.sections.opportunities;
    const themes = s.themes
      .map(
        (t) => `
        <article class="pack-card">
          <h3>${escapeHtml(t.title)}</h3>
          <p>${escapeHtml(t.body)}</p>
        </article>`
      )
      .join("");
    const philosophy = s.philosophy.map((p) => `<li>${escapeHtml(p)}</li>`).join("");
    return `
      <section class="pack-section" id="pack-opportunities" data-pack-block="opportunities">
        <p class="pack-eyebrow">${escapeHtml(s.eyebrow)}</p>
        <h2>${escapeHtml(s.title)}</h2>
        <p class="pack-lede">${escapeHtml(s.lede)}</p>
        <h3 class="pack-h3">Philosophy</h3>
        <ul class="pack-list">${philosophy}</ul>
        <div class="pack-grid">${themes}</div>
      </section>`;
  }

  function renderFacilities() {
    const s = content.sections.facilities;
    const items = s.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("");
    return `
      <section class="pack-section" id="pack-facilities" data-pack-block="facilities">
        <p class="pack-eyebrow">${escapeHtml(s.eyebrow)}</p>
        <h2>${escapeHtml(s.title)}</h2>
        <p class="pack-lede">${escapeHtml(s.lede)}</p>
        <ul class="pack-list">${items}</ul>
      </section>`;
  }

  function renderSupport() {
    const s = content.sections.support;
    const bounds = s.boundaries
      .map(
        (b) => `
        <article class="pack-card">
          <h3>${escapeHtml(b.label)}</h3>
          <ul class="pack-list">${b.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>
        </article>`
      )
      .join("");
    return `
      <section class="pack-section" id="pack-support" data-pack-block="support">
        <p class="pack-eyebrow">${escapeHtml(s.eyebrow)}</p>
        <h2>${escapeHtml(s.title)}</h2>
        <p class="pack-lede">${escapeHtml(s.lede)}</p>
        <div class="pack-grid pack-grid-3">${bounds}</div>
        <div class="pack-two">
          <article class="pack-card">
            <h3>Nursing</h3>
            <p>${escapeHtml(s.nursing)}</p>
          </article>
          <article class="pack-card">
            <h3>Reception</h3>
            <p>${escapeHtml(s.reception)}</p>
          </article>
        </div>
      </section>`;
  }

  function renderEligibility() {
    const s = content.sections.eligibility;
    const points = s.points
      .map(
        (p) => `
        <article class="pack-card">
          <h3>${escapeHtml(p.title)}</h3>
          <p>${escapeHtml(p.body)}</p>
        </article>`
      )
      .join("");
    return `
      <section class="pack-section" id="pack-eligibility" data-pack-block="eligibility">
        <p class="pack-eyebrow">${escapeHtml(s.eyebrow)}</p>
        <h2>${escapeHtml(s.title)}</h2>
        <p class="pack-lede">${escapeHtml(s.lede)}</p>
        <div class="pack-grid">${points}</div>
      </section>`;
  }

  function renderFaq(webInteractive) {
    const s = content.sections.faq;
    const items = faqItems();
    const body = items
      .map((f) => {
        if (webInteractive && viewMode === "web") {
          return `
            <details class="pack-faq">
              <summary>${escapeHtml(f.question)}</summary>
              <p>${escapeHtml(f.answer)}</p>
            </details>`;
        }
        return `
          <article class="pack-faq-static">
            <h3>${escapeHtml(f.question)}</h3>
            <p>${escapeHtml(f.answer)}</p>
          </article>`;
      })
      .join("");
    return `
      <section class="pack-section" id="pack-faq" data-pack-block="faq">
        <p class="pack-eyebrow">${escapeHtml(s.eyebrow)}</p>
        <h2>${escapeHtml(s.title)}</h2>
        <div class="pack-faq-list">${body}</div>
      </section>`;
  }

  function renderNext(meta) {
    const s = content.sections.nextSteps;
    const m = content.meta;
    const actions = s.actions.map((a) => `<li>${escapeHtml(a)}</li>`).join("");
    const contact = meta.includeContact
      ? `
        <address class="pack-contact">
          <strong>${escapeHtml(m.clinic)}</strong><br />
          ${escapeHtml(m.address)}<br />
          <a href="tel:${escapeHtml(m.phoneTel)}">${escapeHtml(m.phone)}</a><br />
          <a href="mailto:${escapeHtml(m.email)}">${escapeHtml(m.email)}</a><br />
          <a href="${escapeHtml(m.web)}">${escapeHtml(m.web)}</a>
        </address>`
      : "";
    const notes = meta.notes
      ? `<aside class="pack-notes"><h3>Private notes (pack only)</h3><p>${escapeHtml(meta.notes)}</p></aside>`
      : "";
    return `
      <section class="pack-section" id="pack-next" data-pack-block="nextSteps">
        <p class="pack-eyebrow">${escapeHtml(s.eyebrow)}</p>
        <h2>${escapeHtml(s.title)}</h2>
        <p class="pack-lede">${escapeHtml(s.body)}</p>
        <ul class="pack-list">${actions}</ul>
        ${contact}
        ${notes}
      </section>`;
  }

  function renderPdfStructureMap(sections) {
    const pages = [
      { page: 1, blocks: ["cover", "trust"], always: true },
      { page: 2, blocks: ["opportunities", "facilities"] },
      { page: 3, blocks: ["support"] },
      { page: 4, blocks: ["eligibility"] },
      { page: 5, blocks: ["faq"] },
      { page: 6, blocks: ["nextSteps"] },
    ];
    const rows = pages
      .map((p) => {
        const included = p.blocks.filter(
          (b) => b === "cover" || b === "trust" || sections.includes(b)
        );
        if (!included.length && !p.always) return "";
        return `
          <tr>
            <td>Page ${p.page}</td>
            <td>${included.map((b) => SECTION_LABELS[b] || b).join(" · ") || "—"}</td>
            <td>${p.page === 1 ? "Cover + disclaimer" : p.page === 5 ? "FAQ length varies with subset" : "A4 section break"}</td>
          </tr>`;
      })
      .join("");
    return `
      <section class="pack-section pdf-map" data-pack-block="pdf-map">
        <p class="pack-eyebrow">PDF structure</p>
        <h2>Print-to-PDF page map (A4)</h2>
        <p class="pack-lede">Use <strong>Print / Save as PDF</strong> with the Print layout view for the finished file. This map is the production outline.</p>
        <table class="pack-table">
          <thead><tr><th>Page</th><th>Blocks included</th><th>Notes</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <ul class="pack-list mt">
          <li>Target: 4–6 pages depending on FAQ subset</li>
          <li>No job-board headers, salary tables, or vacancy badges</li>
          <li>Footer on every printed page: clinic · pack date · page number (browser print)</li>
        </ul>
      </section>`;
  }

  function buildPackHtml(options = { interactive: true, includePdfMap: false }) {
    const meta = metaBits();
    const sections = selectedSections();
    const parts = [renderCover(meta)];

    parts.push(`
      <aside class="pack-boundaries" data-pack-block="trust" role="note">
        <strong>Trust boundaries.</strong>
        Medicare provider numbers are issued by Services Australia.
        Woolloongabba Medical Centre does not issue, approve or guarantee provider numbers,
        DPA/s19AB outcomes, visas, or earnings.
      </aside>`);

    if (options.includePdfMap || viewMode === "pdf") {
      parts.push(renderPdfStructureMap(sections));
    }

    for (const id of sections) {
      if (id === "opportunities") parts.push(renderOpportunities());
      if (id === "facilities") parts.push(renderFacilities());
      if (id === "support") parts.push(renderSupport());
      if (id === "eligibility") parts.push(renderEligibility());
      if (id === "faq") parts.push(renderFaq(options.interactive));
      if (id === "nextSteps") parts.push(renderNext(meta));
    }

    return parts.join("\n");
  }

  function updatePreview() {
    const root = $("pack-preview");
    if (!root || !content) return;

    root.dataset.view = viewMode;
    root.classList.toggle("view-print", viewMode === "print");
    root.classList.toggle("view-pdf", viewMode === "pdf");
    root.classList.toggle("view-web", viewMode === "web");

    const html = buildPackHtml({
      interactive: viewMode === "web",
      includePdfMap: viewMode === "pdf",
    });
    root.innerHTML = html;

    const count = selectedSections().length;
    const live = $("generator-live");
    if (live) {
      live.textContent = `Pack updated · ${count} sections · ${viewMode} view · ${faqItems().length} FAQs`;
    }
  }

  function downloadBlob(filename, blob) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function standaloneDocument() {
    const body = buildPackHtml({ interactive: false, includePdfMap: false });
    const meta = metaBits();
    const title = content.meta.title;
    return `<!DOCTYPE html>
<html lang="en-AU">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex,nofollow" />
<title>${escapeHtml(title)}${meta.recipient ? " — " + escapeHtml(meta.recipient) : ""}</title>
<style>
  :root { --ink:#173044; --ink-soft:#596b78; --navy:#163f62; --green:#0f6b45; --warm:#f5f3ee; --mist:#f4f7f7; --line:#dbe4e9; }
  body { margin:0; font-family: Georgia, "Times New Roman", serif; color:var(--ink); background:#fff; line-height:1.55; }
  .pack-shell { max-width:720px; margin:0 auto; padding:32px 24px 64px; }
  .pack-eyebrow { font-family: system-ui,sans-serif; font-size:11px; letter-spacing:.14em; text-transform:uppercase; color:var(--green); font-weight:600; margin:0 0 8px; }
  .pack-h1 { font-size:2rem; line-height:1.15; margin:0 0 12px; }
  h2 { font-size:1.45rem; margin:0 0 10px; }
  h3 { font-size:1.05rem; margin:0 0 8px; }
  .pack-lede, .pack-meta, p, li { color:var(--ink-soft); }
  .pack-lede { font-size:1.05rem; margin:0 0 16px; }
  .pack-meta { font-family:system-ui,sans-serif; font-size:.9rem; }
  .pack-note, .pack-boundaries { border:1px solid var(--line); background:var(--warm); padding:14px 16px; border-radius:12px; margin:20px 0; font-family:system-ui,sans-serif; font-size:.9rem; color:var(--ink); }
  .pack-section { padding:28px 0; border-top:1px solid var(--line); break-inside:avoid; page-break-inside:avoid; }
  .pack-list { margin:0; padding-left:1.2rem; }
  .pack-list li { margin:.35rem 0; }
  .pack-grid, .pack-grid-3, .pack-two { display:grid; gap:12px; margin-top:14px; }
  .pack-card { border:1px solid var(--line); border-radius:12px; padding:14px 16px; background:var(--mist); }
  .pack-card p, .pack-faq-static p { margin:0; font-family:system-ui,sans-serif; font-size:.92rem; }
  .pack-faq-static { border-top:1px solid var(--line); padding:12px 0; }
  .pack-faq-static h3 { font-family:system-ui,sans-serif; font-size:.98rem; color:var(--ink); }
  .pack-contact { font-style:normal; font-family:system-ui,sans-serif; font-size:.92rem; margin-top:16px; line-height:1.6; }
  .pack-notes { margin-top:16px; border:1px dashed var(--line); padding:12px 14px; border-radius:10px; }
  a { color:var(--navy); }
  @media print {
    body { background:#fff; }
    .pack-shell { max-width:none; padding:0; }
    .pack-section { page-break-inside:avoid; }
    #pack-opportunities, #pack-support, #pack-eligibility, #pack-faq, #pack-next { page-break-before:always; }
  }
</style>
</head>
<body>
<main class="pack-shell">
${body}
</main>
</body>
</html>`;
  }

  function exportJson() {
    const meta = metaBits();
    const payload = {
      formType: "gp_opportunity_pack",
      version: content.meta.version,
      generatedAt: new Date().toISOString(),
      recipient: meta.recipient || null,
      preparedLabel: meta.prepared,
      sectionsIncluded: selectedSections(),
      faqSubset: /** @type {HTMLSelectElement} */ ($("faq-subset")).value,
      faqCount: faqItems().length,
      doctorNotes: meta.notes || null,
      contentVersion: content.meta.version,
    };
    downloadBlob(
      `wmc-gp-opportunity-pack-${Date.now()}.json`,
      new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" })
    );
  }

  function exportHtml() {
    downloadBlob(
      `wmc-gp-opportunity-pack-${Date.now()}.html`,
      new Blob([standaloneDocument()], { type: "text/html" })
    );
  }

  function setView(mode) {
    viewMode = mode;
    document.querySelectorAll("[data-view-mode]").forEach((btn) => {
      const on = btn.getAttribute("data-view-mode") === mode;
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.classList.toggle("is-active", on);
    });
    updatePreview();
  }

  function bind() {
    document.querySelectorAll("[data-section-toggle]").forEach((el) => {
      el.addEventListener("change", updatePreview);
    });
    ["recipient-name", "prepared-date", "doctor-notes", "include-contact", "faq-subset"].forEach(
      (id) => {
        const el = $(id);
        if (el) el.addEventListener("input", updatePreview);
        if (el) el.addEventListener("change", updatePreview);
      }
    );
    document.querySelectorAll("[data-view-mode]").forEach((btn) => {
      btn.addEventListener("click", () => setView(btn.getAttribute("data-view-mode")));
    });
    $("btn-print")?.addEventListener("click", () => {
      setView("print");
      setTimeout(() => window.print(), 50);
    });
    $("btn-export-html")?.addEventListener("click", exportHtml);
    $("btn-export-json")?.addEventListener("click", exportJson);
    $("btn-select-all")?.addEventListener("click", () => {
      document.querySelectorAll("[data-section-toggle]").forEach((el) => {
        if (el instanceof HTMLInputElement) el.checked = true;
      });
      updatePreview();
    });
    $("btn-decision-pack")?.addEventListener("click", () => {
      const keep = new Set(["opportunities", "support", "eligibility", "faq", "nextSteps"]);
      document.querySelectorAll("[data-section-toggle]").forEach((el) => {
        if (el instanceof HTMLInputElement) {
          el.checked = keep.has(el.getAttribute("data-section-toggle") || "");
        }
      });
      const faq = /** @type {HTMLSelectElement} */ ($("faq-subset"));
      if (faq) faq.value = "decision";
      updatePreview();
    });
  }

  async function init() {
    const dateInput = /** @type {HTMLInputElement} */ ($("prepared-date"));
    if (dateInput && !dateInput.value) {
      dateInput.value = new Date().toISOString().slice(0, 10);
    }

    try {
      const res = await fetch("./pack-content.json", { cache: "no-store" });
      if (!res.ok) throw new Error("Could not load pack-content.json");
      content = await res.json();
      bind();
      setView("web");
    } catch (err) {
      const root = $("pack-preview");
      if (root) {
        root.innerHTML = `<p class="pack-error" role="alert">Unable to load pack content. Serve this folder over HTTP (not file://) so pack-content.json can load.</p>`;
      }
      console.error(err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
