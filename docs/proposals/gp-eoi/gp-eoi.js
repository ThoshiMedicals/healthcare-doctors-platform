/**
 * GP Expression of Interest — client validation + JSON submission
 * Woolloongabba Medical Centre (proposal / localhost test)
 */
(() => {
  "use strict";

  const ENDPOINT = "/api/gp-eoi";
  const CLINIC_SLUG = "woolloongabba";

  /** @type {Record<string, any>} */
  let messages = {};

  const INTEREST_VALUES = [
    "womens_health",
    "skin_checks",
    "chronic_disease",
    "mental_health",
    "childrens_health",
    "procedural",
    "preventive_care",
    "other",
  ];

  const NAME_RE = /^[A-Za-z][A-Za-z .'-]{1,118}[A-Za-z.]$|^[A-Za-z]{2}$/;
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const AHPRA_RE = /^MED\d{10}$/i;
  /** AU mobile 04… / +614… or landline 0[2378]… / +61[2378]… */
  const PHONE_RE = /^(?:\+?61|0)(?:4\d{8}|[2378]\d{8})$/;

  /**
   * @param {string} path
   */
  async function loadMessages(path) {
    const res = await fetch(path, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("validation messages failed to load");
    return res.json();
  }

  /**
   * @param {string} phone
   */
  function normalisePhone(phone) {
    const digits = phone.replace(/[\s()-]/g, "");
    if (digits.startsWith("+61")) return `+61${digits.slice(3)}`;
    if (digits.startsWith("61") && digits.length >= 11) return `+${digits}`;
    if (digits.startsWith("0")) return `+61${digits.slice(1)}`;
    return digits;
  }

  /**
   * @param {string} ahpra
   */
  function normaliseAhpra(ahpra) {
    return ahpra.replace(/\s+/g, "").toUpperCase();
  }

  /**
   * @param {string} isoDate
   */
  function isPastDate(isoDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(`${isoDate}T00:00:00`);
    return Number.isNaN(d.getTime()) || d < today;
  }

  /**
   * @param {HTMLFormElement} form
   */
  function readForm(form) {
    const fd = new FormData(form);
    const interests = INTEREST_VALUES.filter((v) => fd.getAll("specialInterests").includes(v));
    return {
      name: String(fd.get("name") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      phone: String(fd.get("phone") || "").trim(),
      ahpraRegistration: String(fd.get("ahpraRegistration") || "").trim(),
      racgpFellowship: String(fd.get("racgpFellowship") || ""),
      acrrmFellowship: String(fd.get("acrrmFellowship") || ""),
      specialInterests: interests,
      specialInterestsOther: String(fd.get("specialInterestsOther") || "").trim(),
      preferredStartDate: String(fd.get("preferredStartDate") || ""),
      privacyConfirm: fd.get("privacyConfirm") === "on" || fd.get("privacyConfirm") === "true",
    };
  }

  /**
   * @param {ReturnType<typeof readForm>} data
   * @returns {Record<string, string>}
   */
  function validate(data) {
    /** @type {Record<string, string>} */
    const errors = {};

    if (!data.name) errors.name = messages.name?.required;
    else if (data.name.length < 2) errors.name = messages.name?.min;
    else if (data.name.length > 120) errors.name = messages.name?.max;
    else if (!NAME_RE.test(data.name)) errors.name = messages.name?.pattern;

    if (!data.email) errors.email = messages.email?.required;
    else if (!EMAIL_RE.test(data.email) || data.email.length > 200) {
      errors.email = messages.email?.invalid;
    }

    const phoneNorm = normalisePhone(data.phone);
    if (!data.phone) errors.phone = messages.phone?.required;
    else if (!PHONE_RE.test(phoneNorm.replace(/\s/g, ""))) {
      errors.phone = messages.phone?.invalid;
    }

    const ahpra = normaliseAhpra(data.ahpraRegistration);
    if (!data.ahpraRegistration) errors.ahpraRegistration = messages.ahpraRegistration?.required;
    else if (!AHPRA_RE.test(ahpra)) errors.ahpraRegistration = messages.ahpraRegistration?.invalid;

    if (!["yes", "no", "in_progress"].includes(data.racgpFellowship)) {
      errors.racgpFellowship = messages.racgpFellowship?.required;
    }
    if (!["yes", "no", "in_progress"].includes(data.acrrmFellowship)) {
      errors.acrrmFellowship = messages.acrrmFellowship?.required;
    }

    if (!data.specialInterests.length) {
      errors.specialInterests = messages.specialInterests?.required;
    } else if (data.specialInterests.includes("other") && !data.specialInterestsOther) {
      errors.specialInterestsOther = messages.specialInterests?.otherRequired;
    } else if (data.specialInterestsOther.length > 500) {
      errors.specialInterestsOther = messages.specialInterests?.max;
    }

    if (!data.preferredStartDate) {
      errors.preferredStartDate = messages.preferredStartDate?.required;
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(data.preferredStartDate)) {
      errors.preferredStartDate = messages.preferredStartDate?.invalid;
    } else if (isPastDate(data.preferredStartDate)) {
      errors.preferredStartDate = messages.preferredStartDate?.past;
    }

    if (!data.privacyConfirm) {
      errors.privacyConfirm = messages.privacyConfirm?.required;
    }

    return errors;
  }

  /**
   * Builds the JSON submission payload.
   * @param {ReturnType<typeof readForm>} data
   */
  function toSubmissionModel(data) {
    const now = new Date().toISOString();
    return {
      formType: "gp_expression_of_interest",
      clinicSlug: CLINIC_SLUG,
      submittedAt: now,
      source: "localhost_test",
      applicant: {
        name: data.name,
        email: data.email.toLowerCase(),
        phone: normalisePhone(data.phone),
      },
      credentials: {
        ahpraRegistration: normaliseAhpra(data.ahpraRegistration),
        racgpFellowship: data.racgpFellowship,
        acrrmFellowship: data.acrrmFellowship,
      },
      preferences: {
        specialInterests: data.specialInterests,
        specialInterestsOther: data.specialInterests.includes("other")
          ? data.specialInterestsOther
          : null,
        preferredStartDate: data.preferredStartDate,
      },
      privacy: {
        confirmed: true,
        confirmedAt: now,
      },
    };
  }

  /**
   * @param {HTMLFormElement} form
   * @param {Record<string, string>} errors
   */
  function paintErrors(form, errors) {
    form.querySelectorAll("[data-error-for]").forEach((el) => {
      el.textContent = "";
      el.classList.add("hidden");
    });
    form.querySelectorAll("[aria-invalid]").forEach((el) => {
      el.removeAttribute("aria-invalid");
    });

    for (const [field, message] of Object.entries(errors)) {
      const input =
        form.querySelector(`#${CSS.escape(field)}`) ||
        form.querySelector(`[name="${CSS.escape(field)}"]`);
      const errorEl = form.querySelector(`[data-error-for="${CSS.escape(field)}"]`);
      if (errorEl) {
        errorEl.textContent = message || "";
        errorEl.classList.toggle("hidden", !message);
      }
      if (input) {
        input.setAttribute("aria-invalid", "true");
      }
      if (field === "specialInterests") {
        const fs = form.querySelector("#special-interests-fieldset");
        if (fs) fs.setAttribute("aria-invalid", "true");
      }
      if (field === "racgpFellowship" || field === "acrrmFellowship") {
        form.querySelectorAll(`input[name="${CSS.escape(field)}"]`).forEach((el) => {
          el.setAttribute("aria-invalid", "true");
        });
      }
    }
  }

  /**
   * @param {HTMLElement} status
   * @param {"idle"|"submitting"|"success"|"error"} state
   * @param {string} text
   */
  function setStatus(status, state, text) {
    status.textContent = text;
    status.dataset.state = state;
    status.classList.remove("text-ink-soft", "text-green", "text-red-700");
    if (state === "success") status.classList.add("text-green");
    else if (state === "error") status.classList.add("text-red-700");
    else status.classList.add("text-ink-soft");
  }

  /**
   * @param {HTMLFormElement} form
   */
  function syncOtherInterest(form) {
    const otherChecked = form.querySelector("#interest-other")?.checked;
    const wrap = form.querySelector("#other-interest-wrap");
    const input = form.querySelector("#specialInterestsOther");
    if (!wrap || !input) return;
    wrap.classList.toggle("hidden", !otherChecked);
    input.required = Boolean(otherChecked);
    if (!otherChecked) {
      input.value = "";
      const err = form.querySelector('[data-error-for="specialInterestsOther"]');
      if (err) {
        err.textContent = "";
        err.classList.add("hidden");
      }
    }
  }

  /**
   * @param {HTMLFormElement} form
   * @param {HTMLElement} status
   * @param {HTMLButtonElement} submitBtn
   * @param {HTMLPreElement | null} preview
   */
  async function onSubmit(form, status, submitBtn, preview) {
    const data = readForm(form);
    const errors = validate(data);
    paintErrors(form, errors);

    if (Object.keys(errors).length) {
      setStatus(status, "error", messages.form?.incomplete || "Please fix the highlighted fields.");
      const firstKey = Object.keys(errors)[0];
      const first =
        form.querySelector(`#${CSS.escape(firstKey)}`) ||
        form.querySelector(`[name="${CSS.escape(firstKey)}"]`) ||
        form.querySelector("#special-interests-fieldset");
      if (first && "focus" in first) /** @type {HTMLElement} */ (first).focus();
      return;
    }

    const payload = toSubmissionModel(data);
    if (preview) {
      preview.textContent = JSON.stringify(payload, null, 2);
      preview.parentElement?.classList.remove("hidden");
    }

    submitBtn.disabled = true;
    setStatus(status, "submitting", messages.form?.submitting || "Submitting…");

    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(
          status,
          "error",
          body.error || messages.form?.server || "Submission failed.",
        );
        submitBtn.disabled = false;
        return;
      }
      setStatus(status, "success", messages.form?.success || "Submitted.");
      form.reset();
      syncOtherInterest(form);
      paintErrors(form, {});
    } catch {
      setStatus(status, "error", messages.form?.network || "Network error.");
    } finally {
      submitBtn.disabled = false;
    }
  }

  async function init() {
    const form = document.querySelector("#gp-eoi-form");
    const status = document.querySelector("#gp-eoi-status");
    const submitBtn = document.querySelector("#gp-eoi-submit");
    const preview = document.querySelector("#gp-eoi-json-preview");
    if (!(form instanceof HTMLFormElement) || !(status instanceof HTMLElement)) return;
    if (!(submitBtn instanceof HTMLButtonElement)) return;

    try {
      messages = await loadMessages("./validation-messages.json");
    } catch {
      messages = {
        form: {
          incomplete: "Please fix the highlighted fields before submitting.",
          submitting: "Sending…",
          success: "Thank you. Your expression of interest was received.",
          network: "Network error. Please try again.",
          server: "Server error. Please try again.",
        },
      };
    }

    const start = form.querySelector("#preferredStartDate");
    if (start instanceof HTMLInputElement) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      start.min = `${yyyy}-${mm}-${dd}`;
    }

    form.querySelectorAll('input[name="specialInterests"]').forEach((el) => {
      el.addEventListener("change", () => syncOtherInterest(form));
    });
    syncOtherInterest(form);

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void onSubmit(form, status, submitBtn, preview instanceof HTMLPreElement ? preview : null);
    });

    // Live clear of field error on input
    form.addEventListener("input", (event) => {
      const t = event.target;
      if (!(t instanceof HTMLElement) || !t.id) return;
      const err = form.querySelector(`[data-error-for="${CSS.escape(t.id)}"]`);
      if (err) {
        err.textContent = "";
        err.classList.add("hidden");
      }
      t.removeAttribute("aria-invalid");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => void init());
  } else {
    void init();
  }

  // Expose for localhost console testing
  window.GpEoi = { validate, toSubmissionModel, readForm, normalisePhone, normaliseAhpra };
})();
