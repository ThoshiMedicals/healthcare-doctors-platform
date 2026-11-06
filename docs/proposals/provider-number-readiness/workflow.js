/**
 * Provider Number Readiness Workflow
 * Assesses GP onboarding preparedness — does NOT imply the practice issues provider numbers.
 * Woolloongabba Medical Centre — localhost proposal
 */
(() => {
  "use strict";

  const STORAGE_KEY = "wmc_provider_number_readiness_v1";
  const STEPS = ["provider", "practices", "medicare", "dpa", "documents", "results"];
  const ASSESSMENT_STEPS = 5;

  const REQUIRED_DOCS = [
    {
      id: "ahpra",
      label: "AHPRA registration evidence",
      hint: "Current registration certificate or lookup confirmation",
    },
    {
      id: "indemnity",
      label: "Professional indemnity certificate",
      hint: "Cover note for the intended start period",
    },
    {
      id: "cv",
      label: "Curriculum vitae",
      hint: "Current CV with practice history",
    },
    {
      id: "id",
      label: "Photo identification",
      hint: "Passport or Australian driver licence",
    },
    {
      id: "medicare_provider_letter",
      label: "Medicare / Services Australia provider correspondence",
      hint: "Evidence of existing provider number(s) or application status — issued by Services Australia, not the practice",
    },
    {
      id: "bank_super",
      label: "Bank and superannuation details",
      hint: "For practice payment setup after offer",
    },
    {
      id: "working_rights",
      label: "Evidence of working rights",
      hint: "Citizenship, permanent residency, or visa documentation",
    },
  ];

  /** @type {Record<string, any>} */
  let answers = {};

  function currentStepIndex() {
    const active = document.querySelector("[data-step].block");
    if (!active) return 0;
    return STEPS.indexOf(active.getAttribute("data-step") || "provider");
  }

  function saveDraft() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ answers, stepIndex: currentStepIndex() }),
      );
    } catch {
      /* ignore */
    }
  }

  function loadDraft() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
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

    const isResults = STEPS[clamped] === "results";
    document.querySelector("#progress-wrap")?.classList.toggle("hidden", isResults);
    document.querySelector("#wizard-nav")?.classList.toggle("hidden", isResults);

    const pct = isResults ? 100 : Math.round(((clamped + 1) / ASSESSMENT_STEPS) * 100);
    const bar = document.querySelector("#progress-bar");
    const label = document.querySelector("#progress-label");
    if (bar instanceof HTMLElement) {
      bar.style.width = `${pct}%`;
      bar.setAttribute("aria-valuenow", String(pct));
    }
    if (label) {
      label.textContent = isResults ? "Complete" : `Step ${clamped + 1} of ${ASSESSMENT_STEPS}`;
    }

    const back = document.querySelector("#btn-back");
    const next = document.querySelector("#btn-next");
    if (back instanceof HTMLButtonElement) {
      back.disabled = clamped === 0;
      back.classList.toggle("opacity-40", clamped === 0);
    }
    if (next instanceof HTMLButtonElement) {
      next.textContent = clamped === ASSESSMENT_STEPS - 1 ? "See readiness results" : "Continue";
    }

    document.querySelector(`#step-${STEPS[clamped]}-title`)?.focus?.({ preventScroll: false });
    saveDraft();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /**
   * @param {string} stepId
   */
  function collectStep(stepId) {
    const root = document.querySelector(`[data-step="${stepId}"]`);
    if (!root) return {};
    /** @type {Record<string, any>} */
    const data = {};

    root.querySelectorAll("input[type='radio']:checked").forEach((el) => {
      if (el instanceof HTMLInputElement) data[el.name] = el.value;
    });
    root.querySelectorAll("input[type='checkbox']").forEach((el) => {
      if (!(el instanceof HTMLInputElement)) return;
      if (!data[el.name]) data[el.name] = [];
      if (el.checked) data[el.name].push(el.value);
    });
    root.querySelectorAll("input[type='text'], input[type='number'], textarea, select").forEach((el) => {
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
        if (el.name) data[el.name] = el.value.trim();
      }
    });
    return data;
  }

  /**
   * @param {string} stepId
   */
  function validateStep(stepId) {
    /** @type {string[]} */
    const errors = [];
    const data = collectStep(stepId);

    if (stepId === "provider") {
      if (!data.hasProviderNumber) errors.push("hasProviderNumber");
      if (data.hasProviderNumber === "yes" && !data.providerNumberCount) {
        errors.push("providerNumberCount");
      }
      if (data.hasProviderNumber === "applied" && !data.applicationStatus) {
        errors.push("applicationStatus");
      }
      if (!data.understandsIssuer) errors.push("understandsIssuer");
    }

    if (stepId === "practices") {
      if (!data.previousPracticeCount && data.previousPracticeCount !== "0") {
        errors.push("previousPracticeCount");
      }
      if (!data.mostRecentPracticeType) errors.push("mostRecentPracticeType");
    }

    if (stepId === "medicare") {
      if (!data.medicareBillingExperience) errors.push("medicareBillingExperience");
      if (!data.bulkBillingFamiliarity) errors.push("bulkBillingFamiliarity");
      if (!data.mbsItemConfidence) errors.push("mbsItemConfidence");
    }

    if (stepId === "dpa") {
      if (!data.dpaStatus) errors.push("dpaStatus");
      if (!data.dpaAwareness) errors.push("dpaAwareness");
    }

    if (stepId === "documents") {
      if (!Array.isArray(data.documentsReady) || data.documentsReady.length === 0) {
        // allow empty but flag if they didn't confirm review
        if (data.docsReviewed !== "yes") errors.push("docsReviewed");
      } else if (data.docsReviewed !== "yes") {
        errors.push("docsReviewed");
      }
    }

    return errors;
  }

  /**
   * @param {string} stepId
   * @param {string[]} errorKeys
   */
  function paintErrors(stepId, errorKeys) {
    const root = document.querySelector(`[data-step="${stepId}"]`);
    if (!root) return;
    root.querySelectorAll("[data-error-for]").forEach((el) => {
      el.textContent = "";
      el.classList.add("hidden");
    });
    errorKeys.forEach((key) => {
      const err = root.querySelector(`[data-error-for="${CSS.escape(key)}"]`);
      if (err) {
        err.textContent = "Please complete this item.";
        err.classList.remove("hidden");
      }
    });
    const status = document.querySelector("#wizard-status");
    if (status) {
      status.textContent = errorKeys.length
        ? "Please complete the highlighted fields before continuing."
        : "";
    }
  }

  /**
   * Scoring deliberately separates "practice onboarding readiness" from
   * "Services Australia provider number issuance" (which the practice cannot do).
   * @param {Record<string, any>} a
   */
  function assess(a) {
    let score = 0;
    /** @type {{ id: string, label: string, severity: "high"|"medium"|"low" }[]} */
    const missing = [];
    /** @type {{ id: string, label: string, owner: "doctor"|"practice"|"services_australia", done: boolean }[]} */
    const checklist = [];

    // --- Provider numbers (max 25) — status awareness, not practice issuance ---
    if (a.hasProviderNumber === "yes") {
      score += 18;
      const count = Number(a.providerNumberCount || 0);
      if (count >= 1) score += 4;
      checklist.push({
        id: "confirm_existing_pn",
        label: "Confirm existing Medicare provider number(s) with Services Australia for this practice location",
        owner: "doctor",
        done: false,
      });
      checklist.push({
        id: "share_pn_details",
        label: "Provide provider number details to the practice for billing setup (after offer)",
        owner: "doctor",
        done: Boolean(count >= 1),
      });
    } else if (a.hasProviderNumber === "applied") {
      score += 8;
      missing.push({
        id: "pn_application_pending",
        label: "Medicare provider number application is still in progress with Services Australia",
        severity: "high",
      });
      checklist.push({
        id: "track_sa_application",
        label: "Track provider number application status directly with Services Australia / Medicare",
        owner: "services_australia",
        done: false,
      });
      checklist.push({
        id: "notify_practice_when_issued",
        label: "Notify the practice when Services Australia issues a provider number for this location",
        owner: "doctor",
        done: false,
      });
    } else {
      missing.push({
        id: "no_provider_number",
        label: "No current Medicare provider number — you must apply to Services Australia (the practice cannot issue one)",
        severity: "high",
      });
      checklist.push({
        id: "apply_services_australia",
        label: "Apply for a Medicare provider number via Services Australia for the Woolloongabba practice location",
        owner: "services_australia",
        done: false,
      });
      checklist.push({
        id: "practice_location_details",
        label: "Request practice location details from WMC to support your Services Australia application",
        owner: "practice",
        done: false,
      });
    }

    if (a.understandsIssuer === "yes") score += 3;
    else {
      missing.push({
        id: "issuer_understanding",
        label: "Confirm understanding that Services Australia issues provider numbers — not Woolloongabba Medical Centre",
        severity: "high",
      });
    }

    // --- Previous practices (max 15) ---
    const prevCount = Number(a.previousPracticeCount);
    if (prevCount >= 2) score += 10;
    else if (prevCount === 1) score += 7;
    else if (prevCount === 0) {
      score += 3;
      missing.push({
        id: "no_prior_practice",
        label: "No previous practice history — onboarding may need extra orientation time",
        severity: "low",
      });
    }

    if (["general_practice", "aboriginal_health", "hospital_gp"].includes(a.mostRecentPracticeType)) {
      score += 5;
    } else if (a.mostRecentPracticeType) {
      score += 2;
    }

    checklist.push({
      id: "practice_history_cv",
      label: "Ensure CV lists previous practice locations and dates accurately",
      owner: "doctor",
      done: prevCount >= 1,
    });

    // --- Medicare experience (max 25) ---
    const billing = a.medicareBillingExperience;
    if (billing === "extensive") score += 12;
    else if (billing === "moderate") score += 8;
    else if (billing === "limited") {
      score += 4;
      missing.push({
        id: "limited_medicare_billing",
        label: "Limited Medicare billing experience — plan supervised orientation with practice team",
        severity: "medium",
      });
    } else if (billing === "none") {
      missing.push({
        id: "no_medicare_billing",
        label: "No Medicare billing experience yet — structured onboarding support recommended",
        severity: "medium",
      });
    }

    if (a.bulkBillingFamiliarity === "confident") score += 7;
    else if (a.bulkBillingFamiliarity === "some") score += 4;
    else if (a.bulkBillingFamiliarity === "none") {
      score += 1;
      missing.push({
        id: "bulk_billing_familiarity",
        label: "Bulk billing familiarity to be covered in practice orientation",
        severity: "low",
      });
    }

    if (a.mbsItemConfidence === "high") score += 6;
    else if (a.mbsItemConfidence === "moderate") score += 4;
    else if (a.mbsItemConfidence === "low") {
      score += 1;
      missing.push({
        id: "mbs_confidence",
        label: "MBS item confidence is low — include billing education in onboarding",
        severity: "medium",
      });
    }

    checklist.push({
      id: "billing_orientation",
      label: "Schedule Medicare / MBS orientation with practice management (does not replace provider number requirements)",
      owner: "practice",
      done: false,
    });

    // --- DPA (max 15) ---
    if (a.dpaStatus === "eligible" || a.dpaStatus === "not_required") score += 10;
    else if (a.dpaStatus === "unsure") {
      score += 4;
      missing.push({
        id: "dpa_unsure",
        label: "DPA eligibility unsure — verify your Distribution Priority Area status via official government sources",
        severity: "medium",
      });
    } else if (a.dpaStatus === "not_eligible") {
      score += 2;
      missing.push({
        id: "dpa_not_eligible",
        label: "DPA not eligible — confirm whether this affects your intended start pathway and discuss with the practice",
        severity: "high",
      });
    }

    if (a.dpaAwareness === "yes") score += 5;
    else {
      score += 1;
      missing.push({
        id: "dpa_awareness",
        label: "Review official DPA guidance before finalising onboarding plans",
        severity: "low",
      });
    }

    checklist.push({
      id: "verify_dpa",
      label: "Verify DPA eligibility via official Health Department / Services Australia channels (not issued by the practice)",
      owner: "doctor",
      done: a.dpaStatus === "eligible" || a.dpaStatus === "not_required",
    });

    // --- Documents (max 20) ---
    const ready = new Set(Array.isArray(a.documentsReady) ? a.documentsReady : []);
    const docPoints = Math.round((ready.size / REQUIRED_DOCS.length) * 17);
    score += docPoints;
    if (a.docsReviewed === "yes") score += 3;

    REQUIRED_DOCS.forEach((doc) => {
      const done = ready.has(doc.id);
      if (!done) {
        missing.push({
          id: `doc_${doc.id}`,
          label: `Missing document: ${doc.label}`,
          severity: doc.id === "medicare_provider_letter" || doc.id === "ahpra" ? "high" : "medium",
        });
      }
      checklist.push({
        id: `upload_${doc.id}`,
        label: `Provide: ${doc.label}`,
        owner: "doctor",
        done,
      });
    });

    checklist.push({
      id: "practice_cannot_issue_pn",
      label: "Acknowledgement on file: Woolloongabba Medical Centre does not issue Medicare provider numbers",
      owner: "practice",
      done: a.understandsIssuer === "yes",
    });

    checklist.push({
      id: "onboarding_meeting",
      label: "Book practice onboarding meeting once provider-number pathway and documents are clear",
      owner: "practice",
      done: false,
    });

    score = Math.min(100, Math.round(score));

    /** @type {"ready"|"nearly"|"preparing"|"blocked"} */
    let band = "blocked";
    if (score >= 80 && a.hasProviderNumber === "yes" && a.understandsIssuer === "yes") band = "ready";
    else if (score >= 60) band = "nearly";
    else if (score >= 40) band = "preparing";

    const bandMeta = {
      ready: {
        label: "Ready for practice onboarding conversation",
        detail:
          "Core readiness looks strong. Proceed to an onboarding discussion. Provider numbers remain a Services Australia matter.",
      },
      nearly: {
        label: "Nearly ready — close the gaps below",
        detail:
          "You are close. Resolve high-severity missing items (especially provider number pathway and key documents) before a start date.",
      },
      preparing: {
        label: "Still preparing",
        detail:
          "Focus on documents, Medicare familiarity, and your Services Australia provider number pathway before formal onboarding.",
      },
      blocked: {
        label: "Not ready to onboard yet",
        detail:
          "Critical gaps remain. The practice can share location details for your application, but cannot issue a provider number.",
      },
    }[band];

    return {
      readinessScore: score,
      band,
      bandLabel: bandMeta.label,
      bandDetail: bandMeta.detail,
      missingItems: missing.sort((a, b) => {
        const rank = { high: 0, medium: 1, low: 2 };
        return rank[a.severity] - rank[b.severity];
      }),
      onboardingChecklist: checklist,
    };
  }

  /**
   * @param {Record<string, any>} a
   * @param {ReturnType<typeof assess>} result
   */
  function buildExport(a, result) {
    return {
      formType: "provider_number_readiness_workflow",
      version: "1.0.0",
      clinicSlug: "woolloongabba",
      completedAt: new Date().toISOString(),
      importantNotice:
        "Medicare provider numbers are issued by Services Australia. Woolloongabba Medical Centre does not issue, approve, or guarantee provider numbers. This workflow only assesses onboarding preparedness.",
      captures: {
        currentProviderNumbers: {
          hasProviderNumber: a.hasProviderNumber || null,
          providerNumberCount: a.providerNumberCount || null,
          applicationStatus: a.applicationStatus || null,
          locationBoundNotes: a.locationBoundNotes || null,
        },
        previousPractices: {
          previousPracticeCount: a.previousPracticeCount || null,
          mostRecentPracticeType: a.mostRecentPracticeType || null,
          practiceHistoryNotes: a.practiceHistoryNotes || null,
        },
        medicareExperience: {
          medicareBillingExperience: a.medicareBillingExperience || null,
          bulkBillingFamiliarity: a.bulkBillingFamiliarity || null,
          mbsItemConfidence: a.mbsItemConfidence || null,
        },
        dpaEligibility: {
          dpaStatus: a.dpaStatus || null,
          dpaAwareness: a.dpaAwareness || null,
        },
        requiredDocuments: {
          documentsReady: Array.isArray(a.documentsReady) ? a.documentsReady : [],
          docsReviewed: a.docsReviewed || null,
        },
        acknowledgements: {
          understandsPracticeDoesNotIssueProviderNumbers: a.understandsIssuer === "yes",
        },
      },
      outputs: {
        readinessScore: result.readinessScore,
        readinessBand: result.band,
        readinessLabel: result.bandLabel,
        missingItems: result.missingItems,
        onboardingChecklist: result.onboardingChecklist,
      },
    };
  }

  function renderResults() {
    const result = assess(answers);
    const payload = buildExport(answers, result);

    const scoreEl = document.querySelector("#readiness-score");
    const bandEl = document.querySelector("#readiness-band");
    const detailEl = document.querySelector("#readiness-detail");
    if (scoreEl) scoreEl.textContent = String(result.readinessScore);
    if (bandEl) bandEl.textContent = result.bandLabel;
    if (detailEl) detailEl.textContent = result.bandDetail;

    const missingList = document.querySelector("#missing-list");
    if (missingList) {
      missingList.innerHTML = "";
      if (!result.missingItems.length) {
        missingList.innerHTML =
          '<li class="text-sm text-ink-soft">No major missing items flagged from your answers.</li>';
      } else {
        result.missingItems.forEach((item) => {
          const li = document.createElement("li");
          const colour =
            item.severity === "high"
              ? "border-red-500/30 bg-red-50 text-red-900"
              : item.severity === "medium"
                ? "border-amber-500/40 bg-amber-50 text-amber-950"
                : "border-line bg-mist text-ink";
          li.className = `rounded-xl border px-3 py-2.5 text-sm ${colour}`;
          li.innerHTML = `<span class="text-[10px] font-semibold uppercase tracking-wide">${item.severity}</span>
            <p class="mt-1">${escapeHtml(item.label)}</p>`;
          missingList.appendChild(li);
        });
      }
    }

    const checkList = document.querySelector("#checklist");
    if (checkList) {
      checkList.innerHTML = "";
      result.onboardingChecklist.forEach((item) => {
        const li = document.createElement("li");
        li.className =
          "flex items-start gap-3 rounded-xl border border-line px-3 py-2.5 text-sm";
        const ownerLabel =
          item.owner === "services_australia"
            ? "Services Australia"
            : item.owner === "practice"
              ? "Practice"
              : "Doctor";
        li.innerHTML = `
          <span class="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
            item.done ? "border-emerald-600 bg-emerald-600 text-white" : "border-line bg-white text-transparent"
          }" aria-hidden="true">${item.done ? "✓" : "·"}</span>
          <div>
            <p class="${item.done ? "text-ink-soft line-through" : "text-ink"}">${escapeHtml(item.label)}</p>
            <p class="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-soft">${ownerLabel}</p>
          </div>
        `;
        checkList.appendChild(li);
      });
    }

    const jsonPre = document.querySelector("#json-preview");
    if (jsonPre) jsonPre.textContent = JSON.stringify(payload, null, 2);
    window.__lastProviderReadiness = payload;

    void fetch("/api/provider-number-readiness", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }

  /**
   * @param {string} str
   */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function syncProviderFields() {
    const value = /** @type {HTMLInputElement|null} */ (
      document.querySelector('input[name="hasProviderNumber"]:checked')
    )?.value;
    document.querySelector("#provider-yes-fields")?.classList.toggle("hidden", value !== "yes");
    document.querySelector("#provider-applied-fields")?.classList.toggle("hidden", value !== "applied");
  }

  function restoreInputs() {
    Object.entries(answers).forEach(([name, value]) => {
      if (Array.isArray(value)) {
        value.forEach((v) => {
          const el = document.querySelector(
            `input[type="checkbox"][name="${CSS.escape(name)}"][value="${CSS.escape(String(v))}"]`,
          );
          if (el instanceof HTMLInputElement) el.checked = true;
        });
        return;
      }
      const radio = document.querySelector(
        `input[type="radio"][name="${CSS.escape(name)}"][value="${CSS.escape(String(value))}"]`,
      );
      if (radio instanceof HTMLInputElement) {
        radio.checked = true;
        return;
      }
      const field = document.querySelector(`[name="${CSS.escape(name)}"]`);
      if (
        field instanceof HTMLInputElement ||
        field instanceof HTMLSelectElement ||
        field instanceof HTMLTextAreaElement
      ) {
        field.value = String(value);
      }
    });
    syncProviderFields();
  }

  function init() {
    const draft = loadDraft();
    if (draft?.answers) answers = draft.answers;
    restoreInputs();

    document.querySelectorAll('input[name="hasProviderNumber"]').forEach((el) => {
      el.addEventListener("change", syncProviderFields);
    });

    const start =
      draft && typeof draft.stepIndex === "number" && draft.stepIndex < ASSESSMENT_STEPS
        ? draft.stepIndex
        : 0;
    showStep(start);

    document.querySelector("#btn-back")?.addEventListener("click", () => {
      const i = currentStepIndex();
      if (i > 0) showStep(i - 1);
    });

    document.querySelector("#btn-next")?.addEventListener("click", () => {
      const i = currentStepIndex();
      const stepId = STEPS[i];
      if (stepId === "results") return;
      const errs = validateStep(stepId);
      paintErrors(stepId, errs);
      if (errs.length) return;
      answers = { ...answers, ...collectStep(stepId) };
      saveDraft();
      if (i === ASSESSMENT_STEPS - 1) {
        renderResults();
        showStep(ASSESSMENT_STEPS);
        return;
      }
      showStep(i + 1);
    });

    document.querySelector("#btn-restart")?.addEventListener("click", () => {
      answers = {};
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        /* ignore */
      }
      document.querySelectorAll("input[type='radio'], input[type='checkbox']").forEach((el) => {
        if (el instanceof HTMLInputElement) el.checked = false;
      });
      document.querySelectorAll("input[type='text'], input[type='number'], textarea, select").forEach((el) => {
        if (
          el instanceof HTMLInputElement ||
          el instanceof HTMLTextAreaElement ||
          el instanceof HTMLSelectElement
        ) {
          el.value = "";
        }
      });
      syncProviderFields();
      showStep(0);
    });

    document.querySelector("#btn-download-json")?.addEventListener("click", () => {
      const payload = window.__lastProviderReadiness || buildExport(answers, assess(answers));
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wmc-provider-number-readiness-${payload.outputs.readinessScore}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });

    document.querySelector("#btn-copy-json")?.addEventListener("click", async () => {
      const payload = window.__lastProviderReadiness || buildExport(answers, assess(answers));
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

  window.ProviderNumberReadiness = { assess, buildExport };
})();
