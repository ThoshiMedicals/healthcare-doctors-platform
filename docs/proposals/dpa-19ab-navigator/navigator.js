/**
 * DPA & 19AB Eligibility Navigator
 * Exploration only — does NOT determine eligibility or give legal/migration advice.
 */
(() => {
  "use strict";

  const STORAGE_KEY = "wmc_dpa_19ab_navigator_v1";
  const VERSION = "1.0.0";
  const CLINIC = "woolloongabba";

  const CAPTURE_STEPS = [
    "fellowship",
    "degree",
    "location",
    "provider",
    "medicare",
    "training",
    "visa",
    "dpa",
  ];

  const STEPS = ["orient", ...CAPTURE_STEPS, "result"];

  const SA_RESOURCES = [
    {
      title: "Services Australia — Medicare for health professionals",
      url: "https://www.servicesaustralia.gov.au/medicare-for-health-professionals",
      why: "Official starting point for provider numbers and Medicare practitioner information.",
    },
    {
      title: "Department of Health — Distribution Priority Area (DPA)",
      url: "https://www.health.gov.au/topics/rural-health-workforce/classifications/dpa",
      why: "Official DPA classification information — verify location status via government sources.",
    },
    {
      title: "Services Australia — Overseas trained doctors & Medicare",
      url: "https://www.servicesaustralia.gov.au/medicare-benefits-overseas-trained-doctors",
      why: "Government information related to Medicare arrangements that may involve s19AB considerations.",
    },
    {
      title: "AHPRA — Medical Board registration",
      url: "https://www.ahpra.gov.au/",
      why: "Confirm registration pathway and status independently of the practice.",
    },
  ];

  /** @type {Record<string, string>} */
  let answers = {};
  let acknowledged = false;

  function currentIndex() {
    const active = document.querySelector("[data-step].block");
    if (!active) return 0;
    return STEPS.indexOf(active.getAttribute("data-step") || "orient");
  }

  function save() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ answers, acknowledged, stepIndex: currentIndex() }),
      );
    } catch {
      /* ignore */
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  /**
   * Themes only — never eligibility outcomes.
   * @param {Record<string, string>} a
   */
  function deriveThemes(a) {
    /** @type {Set<string>} */
    const themes = new Set();

    if (a.dpaAwareness !== "reviewed_official") {
      themes.add("verify_dpa_for_location");
    } else {
      themes.add("verify_dpa_for_location");
    }

    if (
      a.primaryDegreeCountry === "other_international" ||
      a.primaryDegreeCountry === "unsure" ||
      a.australianTrainingPathway === "otd_img_pathway" ||
      a.australianTrainingPathway === "unsure"
    ) {
      themes.add("review_19ab_exemptions_officially");
    }

    if (a.providerNumberStatus !== "active") {
      themes.add("provider_number_with_services_australia");
    }

    if (a.fellowshipStatus === "in_progress" || a.fellowshipStatus === "none") {
      themes.add("fellowship_or_training_clarity");
    }

    if (a.visaWorkRightsStatus !== "citizen_pr") {
      themes.add("work_rights_confirmation");
    }

    if (a.medicareBillingExperience === "limited" || a.medicareBillingExperience === "none") {
      themes.add("medicare_orientation_with_practice");
    }

    if (
      a.fellowshipStatus === "fracgp" ||
      a.fellowshipStatus === "facrrm" ||
      a.fellowshipStatus === "both"
    ) {
      if (a.providerNumberStatus === "active" && a.visaWorkRightsStatus === "citizen_pr") {
        themes.add("standard_vr_conversation");
      }
    }

    return [...themes];
  }

  /**
   * @param {Record<string, string>} a
   * @param {string[]} themes
   */
  function buildOutputs(a, themes) {
    /** @type {string[]} */
    const pathwaySummary = [
      "This summary highlights pathway topics to explore — it is not an eligibility decision.",
      "Woolloongabba Medical Centre cannot determine DPA or s19AB outcomes and cannot issue Medicare provider numbers.",
    ];

    if (themes.includes("verify_dpa_for_location")) {
      pathwaySummary.push(
        "Confirm how Distribution Priority Area (DPA) classifications apply to your intended practice location using official Health Department tools — not practice marketing claims.",
      );
    }
    if (themes.includes("review_19ab_exemptions_officially")) {
      pathwaySummary.push(
        "Your answers suggest it is worth reviewing official Services Australia / Health information about Medicare arrangements that can involve Health Insurance Act s19AB for some overseas-trained doctors. Only government sources can explain how rules apply to you.",
      );
    }
    if (themes.includes("provider_number_with_services_australia")) {
      pathwaySummary.push(
        "Provider number status is incomplete or unsure. Provider numbers are issued by Services Australia; the practice can share location details to support your application but cannot approve or guarantee a number.",
      );
    }
    if (themes.includes("fellowship_or_training_clarity")) {
      pathwaySummary.push(
        "Fellowship / Australian training pathway clarity will matter in any onboarding conversation — including whether registrar supervision capacity exists at a point in time.",
      );
    }
    if (themes.includes("work_rights_confirmation")) {
      pathwaySummary.push(
        "Work rights should be confirmed through official channels before planning a start date. The practice does not provide migration advice.",
      );
    }
    if (themes.includes("medicare_orientation_with_practice")) {
      pathwaySummary.push(
        "Medicare billing familiarity can be supported through practice orientation after a mutual fit conversation — separate from any government eligibility rules.",
      );
    }
    if (themes.includes("standard_vr_conversation")) {
      pathwaySummary.push(
        "Your answers are consistent with preparing for a standard vocationally registered GP conversation with the practice, while still verifying any location-specific government requirements yourself.",
      );
    }

    /** @type {string[]} */
    const questionsForWmc = [
      "Can you share the exact practice location details needed for my Services Australia / provider-number paperwork?",
      "What onboarding documents does WMC usually request from GPs before a start date?",
      "How do nursing and reception support work for the sessions I am considering?",
    ];

    if (themes.includes("fellowship_or_training_clarity")) {
      questionsForWmc.push(
        "If I am on a training/registrar pathway, is supervision capacity available in the timeframe I am considering?",
      );
    }
    if (themes.includes("review_19ab_exemptions_officially")) {
      questionsForWmc.push(
        "What practice information (if any) do doctors usually need when speaking with Services Australia about Medicare arrangements — without asking WMC to interpret s19AB for me?",
      );
    }
    if (themes.includes("medicare_orientation_with_practice")) {
      questionsForWmc.push(
        "What Medicare / MBS orientation does the practice provide after a mutual yes?",
      );
    }
    if (a.currentWorkLocation === "overseas" || a.currentWorkLocation === "not_working") {
      questionsForWmc.push(
        "What staged session options are realistic if I am relocating or returning to Australian general practice?",
      );
    }

    const documentationChecklist = [
      {
        id: "ahpra",
        label: "AHPRA registration evidence",
        owner: "doctor",
        note: "Confirm status independently via AHPRA.",
      },
      {
        id: "id_work_rights",
        label: "Evidence of identity and work rights (as applicable)",
        owner: "doctor",
        note: "WMC does not advise on visas.",
      },
      {
        id: "cv",
        label: "Current CV with training and practice history",
        owner: "doctor",
      },
      {
        id: "indemnity",
        label: "Professional indemnity certificate (when approaching start)",
        owner: "doctor",
      },
      {
        id: "sa_provider",
        label: "Services Australia provider number correspondence / application status",
        owner: "services_australia",
        note: "Issued/managed via Services Australia — not the practice.",
      },
      {
        id: "dpa_self_check",
        label: "Notes from your official DPA / location classification check",
        owner: "other_official",
        note: "Keep your own record of government tool results.",
      },
      {
        id: "practice_location_pack",
        label: "Practice location details pack (address / provider location info)",
        owner: "practice",
        note: "Request from WMC when ready — factual location information only.",
      },
    ];

    if (themes.includes("review_19ab_exemptions_officially")) {
      documentationChecklist.push({
        id: "sa_19ab_notes",
        label: "Personal notes from official s19AB / OTD Medicare reading",
        owner: "doctor",
        note: "For your own discussion with Services Australia or your adviser — not for WMC to assess.",
      });
    }

    /** @type {{ id: string, title: string, detail: string, ctaLabel: string, ctaHref: string }} */
    let recommendedNextAction;

    if (a.visaWorkRightsStatus === "applying" || a.visaWorkRightsStatus === "unsure") {
      recommendedNextAction = {
        id: "confirm_work_rights_then_eoi",
        title: "Confirm work rights through official channels, then express interest",
        detail:
          "Resolve work-rights certainty via official sources (or your migration adviser). When ready, share an EOI so WMC can discuss practice fit — not visa outcomes.",
        ctaLabel: "Review EOI form",
        ctaHref: "../gp-eoi/",
      };
    } else if (a.providerNumberStatus === "none" || a.providerNumberStatus === "unsure") {
      recommendedNextAction = {
        id: "provider_number_pathway_then_eoi",
        title: "Map your Services Australia provider-number pathway, then contact WMC",
        detail:
          "Use Services Australia resources first. WMC can later provide location details for paperwork, but cannot issue a provider number.",
        ctaLabel: "Open provider-number readiness tool",
        ctaHref: "../provider-number-readiness/",
      };
    } else if (
      themes.includes("review_19ab_exemptions_officially") ||
      a.dpaAwareness !== "reviewed_official"
    ) {
      recommendedNextAction = {
        id: "review_official_resources_then_eoi",
        title: "Review official DPA / Medicare resources, then express interest",
        detail:
          "Read the government links on this page. Bring your questions to an EOI conversation — ask WMC for location facts, not eligibility rulings.",
        ctaLabel: "Express interest with the practice",
        ctaHref: "../gp-eoi/",
      };
    } else if (a.medicareBillingExperience === "none" || a.medicareBillingExperience === "limited") {
      recommendedNextAction = {
        id: "call_practice_for_orientation_questions",
        title: "Express interest and ask about Medicare orientation",
        detail:
          "A practice conversation can cover orientation and sessions. Government eligibility topics remain with Services Australia.",
        ctaLabel: "Express interest with the practice",
        ctaHref: "../gp-eoi/",
      };
    } else {
      recommendedNextAction = {
        id: "express_interest_now",
        title: "Express interest with Woolloongabba Medical Centre",
        detail:
          "If the practice philosophy feels like a fit, start a direct conversation. Bring your official-pathway questions as discussion items — not as requests for WMC to determine eligibility.",
        ctaLabel: "Express interest with the practice",
        ctaHref: "../gp-eoi/",
      };
    }

    return {
      pathwayThemes: themes,
      pathwaySummary,
      questionsForWmc,
      documentationChecklist,
      servicesAustraliaResources: SA_RESOURCES,
      recommendedNextAction,
    };
  }

  /**
   * @param {Record<string, string>} a
   */
  function buildExport(a) {
    const themes = deriveThemes(a);
    const outputs = buildOutputs(a, themes);
    return {
      formType: "dpa_19ab_eligibility_navigator",
      version: VERSION,
      clinicSlug: CLINIC,
      completedAt: new Date().toISOString(),
      disclaimers: {
        notEligibilityDetermination: true,
        notLegalAdvice: true,
        notMigrationAdvice: true,
        decisionMaker:
          "Services Australia and relevant Australian Government programs — not Woolloongabba Medical Centre",
      },
      answers: {
        fellowshipStatus: a.fellowshipStatus,
        primaryDegreeCountry: a.primaryDegreeCountry,
        currentWorkLocation: a.currentWorkLocation,
        providerNumberStatus: a.providerNumberStatus,
        medicareBillingExperience: a.medicareBillingExperience,
        australianTrainingPathway: a.australianTrainingPathway,
        visaWorkRightsStatus: a.visaWorkRightsStatus,
        dpaAwareness: a.dpaAwareness,
      },
      outputs,
    };
  }

  /**
   * @param {number} index
   */
  function showStep(index) {
    const clamped = Math.max(0, Math.min(STEPS.length - 1, index));
    document.querySelectorAll("[data-step]").forEach((el) => {
      const on = el.getAttribute("data-step") === STEPS[clamped];
      el.classList.toggle("hidden", !on);
      el.classList.toggle("block", on);
      if (on) el.removeAttribute("hidden");
      else el.setAttribute("hidden", "");
    });

    const isOrient = STEPS[clamped] === "orient";
    const isResult = STEPS[clamped] === "result";
    const captureIndex = CAPTURE_STEPS.indexOf(STEPS[clamped]);

    const progressWrap = document.querySelector("#progress-wrap");
    const nav = document.querySelector("#wizard-nav");
    progressWrap?.classList.toggle("hidden", isOrient || isResult);
    nav?.classList.toggle("hidden", isResult);

    if (captureIndex >= 0) {
      const pct = Math.round(((captureIndex + 1) / CAPTURE_STEPS.length) * 100);
      const bar = document.querySelector("#progress-bar");
      const label = document.querySelector("#progress-label");
      if (bar instanceof HTMLElement) {
        bar.style.width = `${pct}%`;
        bar.setAttribute("aria-valuenow", String(pct));
      }
      if (label) label.textContent = `Step ${captureIndex + 1} of ${CAPTURE_STEPS.length}`;
    }

    const back = document.querySelector("#btn-back");
    const next = document.querySelector("#btn-next");
    if (back instanceof HTMLButtonElement) {
      back.disabled = clamped === 0;
      back.classList.toggle("opacity-40", clamped === 0);
    }
    if (next instanceof HTMLButtonElement) {
      if (isOrient) next.textContent = "Continue";
      else if (captureIndex === CAPTURE_STEPS.length - 1) next.textContent = "See pathway summary";
      else next.textContent = "Continue";
    }

    document.querySelector(`#step-${STEPS[clamped]}-title`)?.focus?.({ preventScroll: false });
    save();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /**
   * @param {string} stepId
   */
  function collect(stepId) {
    const root = document.querySelector(`[data-step="${stepId}"]`);
    if (!root) return {};
    /** @type {Record<string, string>} */
    const data = {};
    root.querySelectorAll("input[type='radio']:checked").forEach((el) => {
      if (el instanceof HTMLInputElement) data[el.name] = el.value;
    });
    if (stepId === "orient") {
      const ack = root.querySelector("#ack-non-advisory");
      if (ack instanceof HTMLInputElement) acknowledged = ack.checked;
    }
    return data;
  }

  /**
   * @param {string} stepId
   */
  function validate(stepId) {
    if (stepId === "orient") {
      return acknowledged ? [] : ["ack"];
    }
    const map = {
      fellowship: "fellowshipStatus",
      degree: "primaryDegreeCountry",
      location: "currentWorkLocation",
      provider: "providerNumberStatus",
      medicare: "medicareBillingExperience",
      training: "australianTrainingPathway",
      visa: "visaWorkRightsStatus",
      dpa: "dpaAwareness",
    };
    const key = map[stepId];
    if (!key) return [];
    const data = collect(stepId);
    return data[key] ? [] : [key];
  }

  /**
   * @param {string} stepId
   * @param {string[]} errs
   */
  function paintErrors(stepId, errs) {
    const root = document.querySelector(`[data-step="${stepId}"]`);
    if (!root) return;
    root.querySelectorAll("[data-error-for]").forEach((el) => {
      el.textContent = "";
      el.classList.add("hidden");
    });
    errs.forEach((k) => {
      const el = root.querySelector(`[data-error-for="${CSS.escape(k)}"]`);
      if (el) {
        el.textContent =
          k === "ack"
            ? "Please confirm you understand this navigator does not determine eligibility."
            : "Please select an option to continue.";
        el.classList.remove("hidden");
      }
    });
  }

  function renderResults() {
    const payload = buildExport(answers);
    const { outputs } = payload;

    const summary = document.querySelector("#pathway-summary");
    if (summary) {
      summary.innerHTML = "";
      outputs.pathwaySummary.forEach((line) => {
        const li = document.createElement("li");
        li.className = "text-sm leading-relaxed text-ink-soft";
        li.textContent = line;
        summary.appendChild(li);
      });
    }

    const themes = document.querySelector("#pathway-themes");
    if (themes) {
      themes.innerHTML = "";
      outputs.pathwayThemes.forEach((t) => {
        const span = document.createElement("span");
        span.className =
          "inline-flex rounded-full border border-line bg-mist px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-ink";
        span.textContent = t.replace(/_/g, " ");
        themes.appendChild(span);
      });
    }

    const qs = document.querySelector("#questions-wmc");
    if (qs) {
      qs.innerHTML = "";
      outputs.questionsForWmc.forEach((q) => {
        const li = document.createElement("li");
        li.className = "text-sm leading-relaxed text-ink";
        li.textContent = q;
        qs.appendChild(li);
      });
    }

    const docs = document.querySelector("#docs-checklist");
    if (docs) {
      docs.innerHTML = "";
      outputs.documentationChecklist.forEach((d) => {
        const li = document.createElement("li");
        li.className = "rounded-xl border border-line px-3 py-2.5 text-sm";
        li.innerHTML = `<strong class="text-ink">${escapeHtml(d.label)}</strong>
          <span class="mt-0.5 block text-[10px] font-semibold uppercase tracking-wide text-ink-soft">${escapeHtml(d.owner.replace(/_/g, " "))}</span>
          ${d.note ? `<span class="mt-1 block text-xs text-ink-soft">${escapeHtml(d.note)}</span>` : ""}`;
        docs.appendChild(li);
      });
    }

    const res = document.querySelector("#sa-resources");
    if (res) {
      res.innerHTML = "";
      outputs.servicesAustraliaResources.forEach((r) => {
        const li = document.createElement("li");
        li.className = "text-sm";
        li.innerHTML = `<a class="font-semibold text-navy underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy" href="${escapeHtml(r.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(r.title)}</a>
          <span class="mt-1 block text-xs text-ink-soft">${escapeHtml(r.why)}</span>`;
        res.appendChild(li);
      });
    }

    const actionTitle = document.querySelector("#next-action-title");
    const actionDetail = document.querySelector("#next-action-detail");
    const actionCta = document.querySelector("#next-action-cta");
    if (actionTitle) actionTitle.textContent = outputs.recommendedNextAction.title;
    if (actionDetail) actionDetail.textContent = outputs.recommendedNextAction.detail;
    if (actionCta instanceof HTMLAnchorElement) {
      actionCta.href = outputs.recommendedNextAction.ctaHref;
      actionCta.textContent = outputs.recommendedNextAction.ctaLabel;
    }

    const pre = document.querySelector("#json-preview");
    if (pre) pre.textContent = JSON.stringify(payload, null, 2);
    window.__lastNavigatorResult = payload;

    void fetch("/api/dpa-19ab-navigator", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function restore() {
    Object.entries(answers).forEach(([name, value]) => {
      const radio = document.querySelector(
        `input[type="radio"][name="${CSS.escape(name)}"][value="${CSS.escape(String(value))}"]`,
      );
      if (radio instanceof HTMLInputElement) radio.checked = true;
    });
    const ack = document.querySelector("#ack-non-advisory");
    if (ack instanceof HTMLInputElement) ack.checked = acknowledged;
  }

  function init() {
    const draft = load();
    if (draft?.answers) answers = draft.answers;
    if (draft?.acknowledged) acknowledged = draft.acknowledged;
    restore();

    const start =
      typeof draft?.stepIndex === "number" && draft.stepIndex < STEPS.length ? draft.stepIndex : 0;
    showStep(start);

    document.querySelector("#btn-back")?.addEventListener("click", () => {
      const i = currentIndex();
      if (i > 0) showStep(i - 1);
    });

    document.querySelector("#btn-next")?.addEventListener("click", () => {
      const i = currentIndex();
      const stepId = STEPS[i];
      if (stepId === "result") return;

      if (stepId === "orient") {
        collect("orient");
      } else {
        answers = { ...answers, ...collect(stepId) };
      }

      const errs = validate(stepId);
      paintErrors(stepId, errs);
      if (errs.length) return;

      save();

      if (stepId === CAPTURE_STEPS[CAPTURE_STEPS.length - 1] || stepId === "dpa") {
        // last capture
        if (CAPTURE_STEPS.includes(stepId) && CAPTURE_STEPS.indexOf(stepId) === CAPTURE_STEPS.length - 1) {
          renderResults();
          showStep(STEPS.length - 1);
          return;
        }
      }

      if (i === STEPS.length - 2) {
        renderResults();
        showStep(i + 1);
        return;
      }
      showStep(i + 1);
    });

    document.querySelector("#btn-restart")?.addEventListener("click", () => {
      answers = {};
      acknowledged = false;
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      document.querySelectorAll("input[type='radio'], input[type='checkbox']").forEach((el) => {
        if (el instanceof HTMLInputElement) el.checked = false;
      });
      showStep(0);
    });

    document.querySelector("#btn-download-json")?.addEventListener("click", () => {
      const payload = window.__lastNavigatorResult || buildExport(answers);
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wmc-dpa-19ab-navigator-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    document.querySelector("#btn-copy-json")?.addEventListener("click", async () => {
      const payload = window.__lastNavigatorResult || buildExport(answers);
      try {
        await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
        const s = document.querySelector("#export-status");
        if (s) s.textContent = "JSON copied.";
      } catch {
        const s = document.querySelector("#export-status");
        if (s) s.textContent = "Copy failed.";
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.Dpa19abNavigator = { buildExport, deriveThemes };
})();
