/**
 * Doctor Readiness Assessment wizard
 * Woolloongabba Medical Centre — localhost proposal
 */
(() => {
  "use strict";

  const STORAGE_KEY = "wmc_doctor_readiness_draft_v1";
  const TOTAL_STEPS = 5; // assessment steps (result is step 6 UI)

  /** @type {Record<string, unknown>} */
  let answers = {};

  const STEP_IDS = ["credentials", "availability", "clinical", "fit", "practical", "results"];

  /**
   * Scoring: each step contributes points; sum capped at 100.
   * @param {Record<string, any>} a
   */
  function scoreAnswers(a) {
    let credentials = 0;
    let availability = 0;
    let clinical = 0;
    let fit = 0;
    let practical = 0;
    /** @type {string[]} */
    const notes = [];

    // Credentials (max 30)
    if (a.ahpraStatus === "current") credentials += 14;
    else if (a.ahpraStatus === "pending") {
      credentials += 6;
      notes.push("AHPRA registration is pending — confirm before consulting.");
    } else {
      notes.push("Current AHPRA registration is required for consulting.");
    }

    if (a.fellowship === "racgp" || a.fellowship === "acrrm" || a.fellowship === "both") {
      credentials += 12;
    } else if (a.fellowship === "in_progress") {
      credentials += 6;
      notes.push("Fellowship in progress — discuss supervision capacity with the practice.");
    } else if (a.fellowship === "none") {
      notes.push("Fellowship status may limit independent consulting options.");
    }

    if (a.indemnity === "yes") credentials += 4;
    else {
      notes.push("Professional indemnity cover is needed before starting.");
    }
    credentials = Math.min(30, credentials);

    // Availability (max 25)
    const sessions = Number(a.sessionsPerWeek || 0);
    if (sessions >= 6) availability += 12;
    else if (sessions >= 3) availability += 10;
    else if (sessions >= 1) availability += 6;
    else notes.push("Indicate preferred weekly sessions.");

    if (a.startWindow === "within_1_month") availability += 8;
    else if (a.startWindow === "1_to_3_months") availability += 6;
    else if (a.startWindow === "3_to_6_months") availability += 4;
    else if (a.startWindow === "exploring") {
      availability += 2;
      notes.push("Start timing is exploratory — a conversation may still help.");
    }

    if (a.arrangement === "permanent" || a.arrangement === "part_time") availability += 5;
    else if (a.arrangement === "flexible") availability += 3;
    availability = Math.min(25, availability);

    // Clinical (max 20)
    const interests = Array.isArray(a.clinicalInterests) ? a.clinicalInterests : [];
    if (interests.length >= 3) clinical += 8;
    else if (interests.length >= 1) clinical += 5;

    if (a.gpExperience === "5_plus") clinical += 8;
    else if (a.gpExperience === "2_to_5") clinical += 6;
    else if (a.gpExperience === "under_2") clinical += 4;
    else if (a.gpExperience === "registrar") clinical += 3;

    if (a.continuityComfort === "high") clinical += 4;
    else if (a.continuityComfort === "moderate") clinical += 2;
    clinical = Math.min(20, clinical);

    // Practice fit (max 15)
    if (a.valuesContinuity === "yes") fit += 5;
    if (a.teamBasedCare === "yes") fit += 5;
    if (a.communityGp === "yes") fit += 5;
    else if (a.communityGp === "unsure") fit += 2;
    fit = Math.min(15, fit);

    // Practical (max 10)
    if (a.brisbaneBased === "yes" || a.brisbaneBased === "relocating") practical += 4;
    else if (a.brisbaneBased === "no") {
      practical += 1;
      notes.push("Location / commute may need discussion.");
    }

    if (a.rightToWork === "yes") practical += 3;
    else notes.push("Confirm right to work in Australia.");

    if (a.cvReady === "yes") practical += 3;
    else notes.push("Have a current CV ready for the expression of interest.");
    practical = Math.min(10, practical);

    const total = Math.min(
      100,
      Math.round(credentials + availability + clinical + fit + practical),
    );

    return {
      total,
      breakdown: { credentials, availability, clinical, fit, practical },
      notes,
    };
  }

  /**
   * @param {number} total
   */
  function bandForScore(total) {
    if (total >= 80) {
      return {
        id: "ready",
        label: "Ready to express interest",
        nextAction: {
          id: "submit_eoi",
          title: "Submit a GP Expression of Interest",
          detail:
            "Your credentials, availability and practice-fit signals look strong. Share a brief introduction with Woolloongabba Medical Centre.",
          href: "../gp-eoi/",
          cta: "Open GP Expression of Interest",
        },
      };
    }
    if (total >= 60) {
      return {
        id: "nearly_ready",
        label: "Nearly ready — clarify a few items",
        nextAction: {
          id: "call_practice",
          title: "Call the practice for a short conversation",
          detail:
            "You are close. A brief call can clarify sessions, start timing or credential details before a formal expression of interest.",
          href: "tel:+61732173344",
          cta: "Call (07) 3217 3344",
        },
      };
    }
    if (total >= 40) {
      return {
        id: "preparing",
        label: "Preparing — strengthen readiness",
        nextAction: {
          id: "prepare_then_eoi",
          title: "Prepare credentials and availability, then return",
          detail:
            "Confirm AHPRA status, indemnity and preferred sessions. When those are clear, submit an expression of interest.",
          href: "../gp-eoi/",
          cta: "Preview Expression of Interest form",
        },
      };
    }
    return {
      id: "early",
      label: "Early stage",
      nextAction: {
        id: "explore_practice",
        title: "Explore the practice and fellowship pathway",
        detail:
          "Learn about our team and philosophy first. Complete fellowship or registration milestones before applying for consulting sessions.",
        href: "/team-general-practitioners.html",
        cta: "Meet our GPs (live site path)",
      },
    };
  }

  /**
   * @param {Record<string, any>} a
   * @param {ReturnType<typeof scoreAnswers>} scored
   * @param {ReturnType<typeof bandForScore>} band
   */
  function buildExport(a, scored, band) {
    return {
      formType: "doctor_readiness_assessment",
      version: "1.0.0",
      clinicSlug: "woolloongabba",
      completedAt: new Date().toISOString(),
      answers: { ...a },
      readinessScore: scored.total,
      scoreBreakdown: scored.breakdown,
      readinessBand: band.id,
      readinessLabel: band.label,
      recommendedNextAction: band.nextAction,
      guidanceNotes: scored.notes,
    };
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
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function currentStepIndex() {
    const active = document.querySelector("[data-step].block");
    if (!active) return 0;
    return STEP_IDS.indexOf(active.getAttribute("data-step") || "credentials");
  }

  /**
   * @param {number} index
   */
  function showStep(index) {
    const clamped = Math.max(0, Math.min(STEP_IDS.length - 1, index));
    document.querySelectorAll("[data-step]").forEach((el) => {
      const id = el.getAttribute("data-step");
      const on = id === STEP_IDS[clamped];
      el.classList.toggle("hidden", !on);
      el.classList.toggle("block", on);
      if (on) el.removeAttribute("hidden");
      else el.setAttribute("hidden", "");
    });

    const isResults = STEP_IDS[clamped] === "results";
    const progressWrap = document.querySelector("#progress-wrap");
    const nav = document.querySelector("#wizard-nav");
    if (progressWrap) progressWrap.classList.toggle("hidden", isResults);
    if (nav) nav.classList.toggle("hidden", isResults);

    // Progress: steps 0–4 map to 20–100%
    const pct = isResults ? 100 : Math.round(((clamped + 1) / TOTAL_STEPS) * 100);
    const bar = document.querySelector("#progress-bar");
    const label = document.querySelector("#progress-label");
    if (bar instanceof HTMLElement) {
      bar.style.width = `${pct}%`;
      bar.setAttribute("aria-valuenow", String(pct));
    }
    if (label) {
      label.textContent = isResults
        ? "Complete"
        : `Step ${clamped + 1} of ${TOTAL_STEPS}`;
    }

    const back = document.querySelector("#btn-back");
    const next = document.querySelector("#btn-next");
    if (back instanceof HTMLButtonElement) {
      back.disabled = clamped === 0;
      back.classList.toggle("opacity-40", clamped === 0);
    }
    if (next instanceof HTMLButtonElement) {
      next.textContent = clamped === TOTAL_STEPS - 1 ? "See my readiness" : "Continue";
    }

    const heading = document.querySelector(`#step-${STEP_IDS[clamped]}-title`);
    if (heading instanceof HTMLElement) heading.focus({ preventScroll: false });

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

    root.querySelectorAll("select, input[type='number'], input[type='text']").forEach((el) => {
      if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement) {
        if (el.name) data[el.name] = el.value;
      }
    });

    return data;
  }

  /**
   * @param {string} stepId
   * @returns {string[]}
   */
  function validateStep(stepId) {
    /** @type {string[]} */
    const errors = [];
    const required = {
      credentials: ["ahpraStatus", "fellowship", "indemnity"],
      availability: ["sessionsPerWeek", "startWindow", "arrangement"],
      clinical: ["gpExperience", "continuityComfort"],
      fit: ["valuesContinuity", "teamBasedCare", "communityGp"],
      practical: ["brisbaneBased", "rightToWork", "cvReady"],
    }[stepId];

    if (!required) return errors;

    const data = collectStep(stepId);
    for (const key of required) {
      const val = data[key];
      if (val === undefined || val === null || val === "" || (Array.isArray(val) && !val.length)) {
        errors.push(key);
      }
    }

    if (stepId === "clinical") {
      const interests = data.clinicalInterests;
      if (!Array.isArray(interests) || interests.length === 0) errors.push("clinicalInterests");
    }

    if (stepId === "availability") {
      const n = Number(data.sessionsPerWeek);
      if (!Number.isFinite(n) || n < 1 || n > 10) errors.push("sessionsPerWeek");
    }

    return errors;
  }

  /**
   * @param {string} stepId
   * @param {string[]} errorKeys
   */
  function paintStepErrors(stepId, errorKeys) {
    const root = document.querySelector(`[data-step="${stepId}"]`);
    if (!root) return;
    root.querySelectorAll("[data-error-for]").forEach((el) => {
      el.textContent = "";
      el.classList.add("hidden");
    });
    for (const key of errorKeys) {
      const err = root.querySelector(`[data-error-for="${CSS.escape(key)}"]`);
      if (err) {
        err.textContent = "Please complete this field.";
        err.classList.remove("hidden");
      }
    }
    const status = document.querySelector("#wizard-status");
    if (status) {
      status.textContent = errorKeys.length
        ? "Please complete the highlighted fields before continuing."
        : "";
    }
  }

  function renderResults() {
    const scored = scoreAnswers(answers);
    const band = bandForScore(scored.total);
    const payload = buildExport(answers, scored, band);

    const scoreEl = document.querySelector("#readiness-score");
    const bandEl = document.querySelector("#readiness-band");
    const actionTitle = document.querySelector("#next-action-title");
    const actionDetail = document.querySelector("#next-action-detail");
    const actionCta = document.querySelector("#next-action-cta");
    const notesList = document.querySelector("#guidance-notes");
    const breakdown = document.querySelector("#score-breakdown");
    const jsonPre = document.querySelector("#json-export");

    if (scoreEl) scoreEl.textContent = String(scored.total);
    if (bandEl) bandEl.textContent = band.label;
    if (actionTitle) actionTitle.textContent = band.nextAction.title;
    if (actionDetail) actionDetail.textContent = band.nextAction.detail;
    if (actionCta instanceof HTMLAnchorElement) {
      actionCta.href = band.nextAction.href;
      actionCta.textContent = band.nextAction.cta;
    }

    if (notesList) {
      notesList.innerHTML = "";
      if (!scored.notes.length) {
        const li = document.createElement("li");
        li.textContent = "No major gaps flagged from your answers.";
        notesList.appendChild(li);
      } else {
        scored.notes.forEach((n) => {
          const li = document.createElement("li");
          li.textContent = n;
          notesList.appendChild(li);
        });
      }
    }

    if (breakdown) {
      breakdown.innerHTML = "";
      const rows = [
        ["Credentials", scored.breakdown.credentials, 30],
        ["Availability", scored.breakdown.availability, 25],
        ["Clinical practice", scored.breakdown.clinical, 20],
        ["Practice fit", scored.breakdown.fit, 15],
        ["Practical readiness", scored.breakdown.practical, 10],
      ];
      rows.forEach(([label, pts, max]) => {
        const li = document.createElement("li");
        li.className = "flex justify-between gap-4 text-sm";
        li.innerHTML = `<span class="text-ink-soft">${label}</span><span class="font-semibold text-ink">${pts} / ${max}</span>`;
        breakdown.appendChild(li);
      });
    }

    if (jsonPre) {
      jsonPre.textContent = JSON.stringify(payload, null, 2);
    }

    const download = document.querySelector("#btn-download-json");
    if (download instanceof HTMLButtonElement) {
      download.onclick = () => {
        const blob = new Blob([JSON.stringify(payload, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `wmc-doctor-readiness-${scored.total}.json`;
        a.click();
        URL.revokeObjectURL(url);
      };
    }

    // Optional localhost persist
    void fetch("/api/doctor-readiness", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {
      /* offline / file open still works */
    });

    window.__lastReadinessExport = payload;
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
      if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement) {
        field.value = String(value);
      }
    });
  }

  function init() {
    const draft = loadDraft();
    if (draft?.answers) answers = draft.answers;
    restoreInputs();

    const startIndex =
      draft && typeof draft.stepIndex === "number" && draft.stepIndex < TOTAL_STEPS
        ? draft.stepIndex
        : 0;
    showStep(startIndex);

    document.querySelector("#btn-back")?.addEventListener("click", () => {
      const i = currentStepIndex();
      if (i > 0) showStep(i - 1);
    });

    document.querySelector("#btn-next")?.addEventListener("click", () => {
      const i = currentStepIndex();
      const stepId = STEP_IDS[i];
      if (stepId === "results") return;

      const errs = validateStep(stepId);
      paintStepErrors(stepId, errs);
      if (errs.length) {
        const first = document.querySelector(
          `[data-step="${stepId}"] [data-error-for="${errs[0]}"]`,
        );
        first?.parentElement?.querySelector("input, select, legend")?.focus?.();
        return;
      }

      answers = { ...answers, ...collectStep(stepId) };
      saveDraft();

      if (i === TOTAL_STEPS - 1) {
        renderResults();
        showStep(TOTAL_STEPS); // results
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
      document.querySelectorAll("select, input[type='number']").forEach((el) => {
        if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement) el.value = "";
      });
      const status = document.querySelector("#wizard-status");
      if (status) status.textContent = "";
      showStep(0);
    });

    document.querySelector("#btn-copy-json")?.addEventListener("click", async () => {
      const payload = window.__lastReadinessExport;
      if (!payload) return;
      try {
        await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
        const status = document.querySelector("#export-status");
        if (status) status.textContent = "JSON copied to clipboard.";
      } catch {
        const status = document.querySelector("#export-status");
        if (status) status.textContent = "Copy failed — use Download JSON instead.";
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  window.DoctorReadiness = { scoreAnswers, bandForScore, buildExport };
})();
