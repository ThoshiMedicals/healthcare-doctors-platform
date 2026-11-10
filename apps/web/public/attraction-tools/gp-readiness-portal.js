/**
 * GP Readiness & Onboarding Portal — multi-step modal workflow.
 * Not a job application. Separate from Express Interest EOI.
 */
(function () {
  var TOTAL_STEPS = 11;
  var state = {
    step: 1,
    data: {},
    files: {},
    headshotUrl: null,
    spousalOutcome: null,
  };

  var INTERESTS = [
    "Family Medicine",
    "Women's Health",
    "Men's Health",
    "Skin Cancer",
    "Mental Health",
    "Chronic Disease Management",
    "Children's Health",
    "Travel Medicine",
    "Aged Care",
    "Preventive Health",
    "Procedures",
  ];
  var CREDENTIAL_PRESETS = ["FRACGP", "MBBS", "MD", "FACRRM", "Dip Child Health", "AMC Certification"];
  var LANGUAGE_PRESETS = ["English", "Persian", "Mandarin", "Hindi", "Tamil", "Sinhala"];
  var MEMBERSHIP_PRESETS = ["RACGP", "ACRRM", "AMA"];
  var DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  var SESSIONS = ["Morning", "Afternoon", "Evening"];
  var MIN_HEADSHOT_PX = 600;
  var DOC_KEYS = [
    { key: "cv", label: "CV" },
    { key: "ahpra", label: "AHPRA Registration Evidence" },
    { key: "fellowship", label: "FRACGP / FACRRM" },
    { key: "passport", label: "Passport Identification" },
    { key: "police", label: "Police Check" },
    { key: "indemnity", label: "Medical Indemnity Certificate" },
    { key: "workingRights", label: "Working Rights Documents" },
    { key: "other", label: "Other Supporting Documents" },
  ];

  function clinicSlug() {
    var root = document.getElementById("gp-readiness-portal");
    return (
      (root && root.getAttribute("data-clinic-slug")) ||
      (document.body && document.body.getAttribute("data-clinic-slug")) ||
      (document.currentScript && document.currentScript.getAttribute("data-clinic-slug")) ||
      "woolloongabba"
    );
  }

  function el(id) {
    return document.getElementById(id);
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function field(name, label, type, required, attrs) {
    attrs = attrs || "";
    var req = required ? " required" : "";
    var id = "grp-" + name;
    return (
      '<label class="grp-field" for="' +
      id +
      '"><span class="grp-label">' +
      escapeHtml(label) +
      (required ? " *" : "") +
      '</span><input id="' +
      id +
      '" name="' +
      escapeHtml(name) +
      '" type="' +
      (type || "text") +
      '"' +
      req +
      " " +
      attrs +
      " /></label>"
    );
  }

  function textarea(name, label, required) {
    var id = "grp-" + name;
    return (
      '<label class="grp-field" for="' +
      id +
      '"><span class="grp-label">' +
      escapeHtml(label) +
      (required ? " *" : "") +
      '</span><textarea id="' +
      id +
      '" name="' +
      escapeHtml(name) +
      '" rows="4"' +
      (required ? " required" : "") +
      "></textarea></label>"
    );
  }

  function select(name, label, options, required) {
    var id = "grp-" + name;
    var opts = options
      .map(function (o) {
        var v = typeof o === "string" ? o : o.value;
        var t = typeof o === "string" ? o : o.label;
        return '<option value="' + escapeHtml(v) + '">' + escapeHtml(t) + "</option>";
      })
      .join("");
    return (
      '<label class="grp-field" for="' +
      id +
      '"><span class="grp-label">' +
      escapeHtml(label) +
      (required ? " *" : "") +
      '</span><select id="' +
      id +
      '" name="' +
      escapeHtml(name) +
      '"' +
      (required ? " required" : "") +
      '><option value="">Select…</option>' +
      opts +
      "</select></label>"
    );
  }

  function radios(name, label, options) {
    var items = options
      .map(function (o, i) {
        var v = typeof o === "string" ? o : o.value;
        var t = typeof o === "string" ? o : o.label;
        var id = "grp-" + name + "-" + i;
        return (
          '<label class="grp-choice" for="' +
          id +
          '"><input id="' +
          id +
          '" type="radio" name="' +
          escapeHtml(name) +
          '" value="' +
          escapeHtml(v) +
          '" /> <span>' +
          escapeHtml(t) +
          "</span></label>"
        );
      })
      .join("");
    return (
      '<fieldset class="grp-fieldset"><legend class="grp-label">' +
      escapeHtml(label) +
      '</legend><div class="grp-choice-row">' +
      items +
      "</div></fieldset>"
    );
  }

  function checks(name, label, options) {
    var items = options
      .map(function (o, i) {
        var v = typeof o === "string" ? o : o.value;
        var t = typeof o === "string" ? o : o.label;
        var id = "grp-" + name + "-" + i;
        return (
          '<label class="grp-choice" for="' +
          id +
          '"><input id="' +
          id +
          '" type="checkbox" name="' +
          escapeHtml(name) +
          '" value="' +
          escapeHtml(v) +
          '" /> <span>' +
          escapeHtml(t) +
          "</span></label>"
        );
      })
      .join("");
    return (
      '<fieldset class="grp-fieldset"><legend class="grp-label">' +
      escapeHtml(label) +
      '</legend><div class="grp-choice-grid">' +
      items +
      "</div></fieldset>"
    );
  }

  function yesNoUnsure(name, label) {
    return radios(name, label, [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
      { value: "unsure", label: "Unsure" },
    ]);
  }

  function triad(name, label) {
    return radios(name, label, [
      { value: "yes", label: "✅ Yes" },
      { value: "need_assistance", label: "⚠ Need Assistance" },
      { value: "no", label: "❌ No" },
    ]);
  }

  function stepTitle(n) {
    return (
      [
        "Personal Details",
        "Registration & Eligibility",
        "Professional Background",
        "Professional Profile Builder",
        "Availability & Start Planning",
        "Provider Number Readiness",
        "Section 19AB Assessment",
        "Spousal Exemption Eligibility",
        "Provider Number Application Guidance",
        "Supporting Documents",
        "Review & Submit",
      ][n - 1] || ""
    );
  }

  function renderProgress() {
    var pct = Math.round(((state.step - 1) / TOTAL_STEPS) * 100);
    return (
      '<div class="grp-progress" role="status" aria-live="polite">' +
      '<div class="grp-progress-meta"><span>Step ' +
      state.step +
      " of " +
      TOTAL_STEPS +
      "</span><span>" +
      escapeHtml(stepTitle(state.step)) +
      "</span></div>" +
      '<div class="grp-progress-track"><span class="grp-progress-fill" style="width:' +
      pct +
      '%"></span></div></div>'
    );
  }

  function collectStep(form) {
    var fd = new FormData(form);
    function val(name) {
      var v = fd.get(name);
      return v == null ? "" : String(v).trim();
    }
    function multi(name) {
      return fd.getAll(name).map(String);
    }

    if (state.step === 1) {
      state.data.personal = {
        firstName: val("firstName"),
        lastName: val("lastName"),
        mobile: val("mobile"),
        email: val("email"),
        preferredContactMethod: val("preferredContactMethod"),
        bestContactTime: val("bestContactTime"),
      };
    } else if (state.step === 2) {
      state.data.registration = {
        ahpraNumber: val("ahpraNumber"),
        fracgp: val("fracgp"),
        facrrm: val("facrrm"),
        otherQualifications: val("otherQualifications"),
        vocationallyRegistered: val("vocationallyRegistered"),
        australianCitizen: val("australianCitizen"),
        permanentResident: val("permanentResident"),
        temporaryVisaHolder: val("temporaryVisaHolder"),
      };
    } else if (state.step === 3) {
      state.data.professional = {
        currentPractice: val("currentPractice"),
        currentLocation: val("currentLocation"),
        yearsPractising: val("yearsPractising"),
        currentMedicareProviderNumber: val("currentMedicareProviderNumber"),
        specialInterests: multi("specialInterests"),
      };
    } else if (state.step === 4) {
      var customInterests = val("customInterests")
        .split(/[,;\n]+/)
        .map(function (s) {
          return s.trim();
        })
        .filter(Boolean);
      var customLanguages = val("customLanguages")
        .split(/[,;\n]+/)
        .map(function (s) {
          return s.trim();
        })
        .filter(Boolean);
      var customMemberships = val("customMemberships")
        .split(/[,;\n]+/)
        .map(function (s) {
          return s.trim();
        })
        .filter(Boolean);
      var title = val("profileTitle");
      if (title === "Other") title = val("profileTitleOther") || "Other";
      var quals = val("qualificationsList")
        .split(/[,;\n]+/)
        .map(function (s) {
          return s.trim();
        })
        .filter(Boolean);
      state.data.websiteProfile = {
        title: title,
        preferredPublishedName: val("preferredPublishedName"),
        credentials: multi("credentials"),
        biography: val("biography"),
        shortIntroduction: val("shortIntroduction").slice(0, 250),
        qualifications: quals,
        specialInterests: multi("profileInterests").concat(customInterests),
        languagesSpoken: multi("languagesSpoken").concat(customLanguages),
        yearsPractising: val("profileYearsPractising"),
        memberships: multi("memberships").concat(customMemberships),
        headshotMeta: state.headshotMeta || null,
      };
      var shot = form.querySelector('input[name="headshot"]');
      if (shot && shot.files && shot.files[0]) state.files.headshot = shot.files[0];
    } else if (state.step === 5) {
      state.data.availability = {
        preference: val("availabilityPreference"),
        preferredDays: multi("preferredDays"),
        preferredSessions: multi("preferredSessions"),
        preferredStartDate: val("preferredStartDate"),
      };
    } else if (state.step === 6) {
      state.data.providerReadiness = {
        medicareProviderNumber: val("medicareProviderNumber"),
        prescriberNumber: val("prescriberNumber"),
        prodaAccount: val("prodaAccount"),
        hposAccess: val("hposAccess"),
      };
    } else if (state.step === 7) {
      state.data.section19ab = {
        countryOfPrimaryQualification: val("countryOfPrimaryQualification"),
        firstRegistrationDateAu: val("firstRegistrationDateAu"),
        imgStatus: val("imgStatus"),
        existingProviderNumber: val("existingProviderNumber"),
        currentPracticeLocation: val("currentPracticeLocation19ab"),
        subject19ab: val("subject19ab"),
        tenYearMoratorium: val("tenYearMoratorium"),
        dpaRequirements: val("dpaRequirements"),
      };
    } else if (state.step === 8) {
      state.data.spousal = {
        relationshipStatus: val("relationshipStatus"),
        partnerType: val("partnerType"),
        partnerName: val("partnerName"),
        partnerAhpra: val("partnerAhpra"),
        partnerProviderNumber: val("partnerProviderNumber"),
        partnerEmployer: val("partnerEmployer"),
        partnerPracticeAddress: val("partnerPracticeAddress"),
        partnerUnrestricted19ab: val("partnerUnrestricted19ab"),
        partnerMedicareAccess: val("partnerMedicareAccess"),
        occupation: val("skilledOccupation"),
        employer: val("skilledEmployer"),
        workplaceLocation: val("skilledWorkplace"),
        visaType: val("skilledVisaType"),
        migrationDate: val("skilledMigrationDate"),
        skilledMigrationVisa: val("skilledMigrationVisa"),
        occupationAssessed: val("occupationAssessed"),
        currentlyEmployedInOccupation: val("currentlyEmployedInOccupation"),
        migratedWithin10Years: val("migratedWithin10Years"),
        evidenceTypes: multi("evidenceTypes"),
      };
      state.spousalOutcome = assessSpousalClient(state.data.spousal);
    } else if (state.step === 9) {
      state.data.providerGuidance = { situation: val("providerSituation") };
    } else if (state.step === 10) {
      DOC_KEYS.forEach(function (d) {
        var input = form.querySelector('input[name="' + d.key + '"]');
        if (input && input.files && input.files[0]) state.files[d.key] = input.files[0];
      });
    }
  }

  function assessSpousalClient(s) {
    var rel = String(s.relationshipStatus || "").toLowerCase();
    var type = String(s.partnerType || "").toLowerCase();
    var evidence = s.evidenceTypes || [];
    var partnered = rel === "married" || rel === "de_facto";
    if (!partnered) return "further_review_required";
    if (type === "medical_practitioner") {
      if (s.partnerUnrestricted19ab === "yes" && s.partnerMedicareAccess === "yes" && evidence.length)
        return "likely_eligible";
      return "further_review_required";
    }
    if (type === "skilled_migrant") {
      if (
        s.skilledMigrationVisa === "yes" &&
        s.occupationAssessed === "yes" &&
        s.currentlyEmployedInOccupation === "yes" &&
        s.migratedWithin10Years === "yes" &&
        evidence.length
      )
        return "likely_eligible";
      return "further_review_required";
    }
    return "further_review_required";
  }

  function stepHtml(n) {
    if (n === 1) {
      return (
        field("firstName", "First Name", "text", true) +
        field("lastName", "Last Name", "text", true) +
        field("mobile", "Mobile", "tel", true) +
        field("email", "Email", "email", true) +
        select(
          "preferredContactMethod",
          "Preferred Contact Method",
          ["Phone", "Email", "Either"],
          true,
        ) +
        field("bestContactTime", "Best Contact Time", "text", false, 'placeholder="e.g. Weekday mornings"')
      );
    }
    if (n === 2) {
      return (
        field("ahpraNumber", "AHPRA Registration Number", "text", true) +
        field("fracgp", "FRACGP", "text", false) +
        field("facrrm", "FACRRM", "text", false) +
        textarea("otherQualifications", "Other Qualifications", false) +
        yesNoUnsure("vocationallyRegistered", "Vocationally Registered?") +
        yesNoUnsure("australianCitizen", "Australian Citizen?") +
        yesNoUnsure("permanentResident", "Permanent Resident?") +
        yesNoUnsure("temporaryVisaHolder", "Temporary Visa Holder?")
      );
    }
    if (n === 3) {
      return (
        field("currentPractice", "Current Practice", "text", false) +
        field("currentLocation", "Current Location", "text", false) +
        field("yearsPractising", "Years Practising", "text", false) +
        field("currentMedicareProviderNumber", "Current Medicare Provider Number (if available)", "text", false) +
        checks("specialInterests", "Special Interests", INTERESTS)
      );
    }
    if (n === 4) {
      var yearsDefault =
        (state.data.professional && state.data.professional.yearsPractising) ||
        (state.data.websiteProfile && state.data.websiteProfile.yearsPractising) ||
        "";
      var nameDefault =
        (state.data.websiteProfile && state.data.websiteProfile.preferredPublishedName) ||
        [
          "Dr",
          state.data.personal && state.data.personal.firstName,
          state.data.personal && state.data.personal.lastName,
        ]
          .filter(Boolean)
          .join(" ");
      return (
        '<p class="grp-note">Professional Profile Builder — collect everything needed for website, booking, and marketing profiles across Woolloongabba Medical Centre and Healthcare Doctors network sites.</p>' +
        select(
          "profileTitle",
          "Title",
          [
            { value: "Dr", label: "Dr" },
            { value: "A/Prof", label: "A/Prof" },
            { value: "Prof", label: "Prof" },
            { value: "Other", label: "Other" },
          ],
          true,
        ) +
        field("profileTitleOther", "Other title", "text", false, 'placeholder="e.g. Assoc. Prof"') +
        field(
          "preferredPublishedName",
          "Preferred Published Name",
          "text",
          true,
          'placeholder="e.g. Dr Golnar Mortezaei" value="' + escapeHtml(nameDefault) + '"',
        ) +
        checks("credentials", "Credentials", CREDENTIAL_PRESETS) +
        '<label class="grp-field" for="grp-biography"><span class="grp-label">Professional Biography</span><span class="grp-hint">Recommended 300–1000 words.</span><textarea id="grp-biography" name="biography" rows="8"></textarea></label>' +
        '<label class="grp-field" for="grp-shortIntroduction"><span class="grp-label">Short Introduction</span><span class="grp-hint">For cards, search results, and booking systems (max 250 characters).</span><textarea id="grp-shortIntroduction" name="shortIntroduction" rows="3" maxlength="250"></textarea><span class="grp-char-count" id="grp-short-count">0 / 250</span></label>' +
        '<label class="grp-field" for="grp-qualificationsList"><span class="grp-label">Qualifications</span><span class="grp-hint">One per line or comma-separated (MBBS, MD, FRACGP, FACRRM, AMC Certification…).</span><textarea id="grp-qualificationsList" name="qualificationsList" rows="3"></textarea></label>' +
        checks("profileInterests", "Special Interests", INTERESTS) +
        field("customInterests", "Additional special interests", "text", false, 'placeholder="Comma-separated custom interests"') +
        checks("languagesSpoken", "Languages Spoken", LANGUAGE_PRESETS) +
        field("customLanguages", "Additional languages", "text", false, 'placeholder="Comma-separated"') +
        field(
          "profileYearsPractising",
          "Clinical Experience (years practising)",
          "text",
          false,
          'placeholder="e.g. 12" value="' + escapeHtml(yearsDefault) + '"',
        ) +
        checks("memberships", "Professional Memberships", MEMBERSHIP_PRESETS) +
        field("customMemberships", "Additional memberships", "text", false, 'placeholder="Comma-separated"') +
        '<label class="grp-field"><span class="grp-label">Professional Headshot (JPG, PNG, WEBP)</span><span class="grp-hint">Minimum ' +
        MIN_HEADSHOT_PX +
        "×" +
        MIN_HEADSHOT_PX +
        ' px. Landscape and square crop previews update after upload.</span><input type="file" name="headshot" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" /></label>' +
        '<p class="grp-error" id="grp-headshot-error" hidden></p>' +
        '<div class="grp-crop-row" id="grp-crop-row" hidden>' +
        '<div class="grp-crop-frame grp-crop-landscape"><img id="grp-headshot-landscape" alt="Landscape crop preview" /></div>' +
        '<div class="grp-crop-frame grp-crop-square"><img id="grp-headshot-square" alt="Square crop preview" /></div>' +
        "</div>" +
        '<div class="grp-live-preview" id="grp-live-preview">' +
        '<p class="grp-label">Website preview</p>' +
        '<div class="grp-doctor-card" id="grp-doctor-card"></div>' +
        '<div class="grp-doctor-full" id="grp-doctor-full"></div>' +
        "</div>"
      );
    }
    if (n === 5) {
      return (
        radios("availabilityPreference", "Preferred", [
          { value: "full_time", label: "Full Time" },
          { value: "part_time", label: "Part Time" },
          { value: "flexible", label: "Flexible" },
        ]) +
        checks("preferredDays", "Preferred Days", DAYS) +
        checks("preferredSessions", "Preferred Sessions", SESSIONS) +
        field("preferredStartDate", "Preferred Start Date", "date", false)
      );
    }
    if (n === 6) {
      return (
        '<p class="grp-note">Identify onboarding support requirements for Medicare systems access.</p>' +
        triad("medicareProviderNumber", "Do you currently have a Medicare Provider Number?") +
        triad("prescriberNumber", "Do you currently have a Prescriber Number?") +
        triad("prodaAccount", "Do you currently have a PRODA Account?") +
        triad("hposAccess", "Do you currently have HPOS Access?")
      );
    }
    if (n === 7) {
      return (
        field("countryOfPrimaryQualification", "Country of Primary Qualification", "text", false) +
        field("firstRegistrationDateAu", "First Registration Date in Australia", "date", false) +
        select("imgStatus", "IMG Status", ["Yes", "No", "Unsure"], false) +
        field("existingProviderNumber", "Existing Provider Number", "text", false) +
        field("currentPracticeLocation19ab", "Current Practice Location", "text", false) +
        yesNoUnsure("subject19ab", "Are you currently subject to Section 19AB restrictions?") +
        yesNoUnsure("tenYearMoratorium", "Are you currently subject to the 10-year moratorium?") +
        yesNoUnsure("dpaRequirements", "Are you currently subject to DPA requirements?") +
        '<p class="grp-hint" id="grp-19ab-hint" hidden>We can help assess your situation during recruitment discussions.</p>'
      );
    }
    if (n === 8) {
      return (
        select(
          "relationshipStatus",
          "Relationship Status",
          [
            { value: "married", label: "Married" },
            { value: "de_facto", label: "De Facto" },
            { value: "other", label: "Other" },
          ],
          false,
        ) +
        select(
          "partnerType",
          "Is Your Partner",
          [
            { value: "medical_practitioner", label: "Medical Practitioner" },
            { value: "skilled_migrant", label: "Skilled Migrant Professional" },
            { value: "other", label: "Other" },
          ],
          false,
        ) +
        '<div id="grp-partner-medical" class="grp-conditional" hidden>' +
        field("partnerName", "Partner Name", "text", false) +
        field("partnerAhpra", "Partner AHPRA Number", "text", false) +
        field("partnerProviderNumber", "Partner Provider Number", "text", false) +
        field("partnerEmployer", "Partner Employer", "text", false) +
        textarea("partnerPracticeAddress", "Partner Practice Address", false) +
        yesNoUnsure("partnerUnrestricted19ab", "Is partner unrestricted under Section 19AB?") +
        yesNoUnsure("partnerMedicareAccess", "Does partner currently have ongoing access to Medicare rebates?") +
        "</div>" +
        '<div id="grp-partner-skilled" class="grp-conditional" hidden>' +
        field("skilledOccupation", "Occupation", "text", false) +
        field("skilledEmployer", "Employer", "text", false) +
        field("skilledWorkplace", "Workplace Location", "text", false) +
        field("skilledVisaType", "Visa Type", "text", false) +
        field("skilledMigrationDate", "Migration Date", "date", false) +
        yesNoUnsure("skilledMigrationVisa", "Skilled Migration Visa?") +
        yesNoUnsure("occupationAssessed", "Occupation assessed by relevant authority?") +
        yesNoUnsure("currentlyEmployedInOccupation", "Currently employed in occupation?") +
        yesNoUnsure("migratedWithin10Years", "Migrated within last 10 years?") +
        "</div>" +
        checks("evidenceTypes", "Available evidence", [
          "Marriage Certificate",
          "Joint Lease",
          "Joint Mortgage",
          "Utility Bill",
          "Joint Bank Account",
        ]) +
        '<div class="grp-outcome" id="grp-spousal-outcome" hidden></div>' +
        '<p class="grp-disclaimer">Preliminary guidance only. Formal eligibility must be determined by the Department of Health.</p>'
      );
    }
    if (n === 9) {
      return (
        radios("providerSituation", "Which Situation Applies?", [
          { value: "initial", label: "Option A — I require my first Provider Number." },
          {
            value: "additional",
            label: "Option B — I already have a Medicare Provider Number and need an additional location.",
          },
        ]) +
        '<div class="grp-guidance" id="grp-guide-initial" hidden>' +
        "<h3>Apply for Initial Provider and Prescriber Numbers</h3>" +
        "<p>Create a PRODA account, link HPOS, then apply for your initial Medicare provider number (and PBS prescriber number where eligible) through Services Australia.</p>" +
        '<p><a href="https://www.servicesaustralia.gov.au/medical-intern-application-for-provider-or-prescriber-number?context=20" target="_blank" rel="noopener">Services Australia — initial provider / prescriber guidance</a></p>' +
        '<p><a href="https://proda.humanservices.gov.au/" target="_blank" rel="noopener">Register / log in to PRODA</a></p>' +
        "</div>" +
        '<div class="grp-guidance" id="grp-guide-additional" hidden>' +
        "<h3>Apply for an Additional Provider Number</h3>" +
        "<p>Log in to PRODA → HPOS → My details → My provider numbers → Create a new provider location.</p>" +
        '<p><a href="https://www.servicesaustralia.gov.au/apply-for-additional-provider-numbers?context=20" target="_blank" rel="noopener">Services Australia — apply for additional provider numbers</a></p>' +
        '<p><a href="https://hpe.servicesaustralia.gov.au/info_PROVELIG.html" target="_blank" rel="noopener">PROVELIGINFO3 / Provider Eligibility guidance (Services Australia HPE)</a></p>' +
        "</div>"
      );
    }
    if (n === 10) {
      return (
        '<p class="grp-note">Optional uploads — share only what you are comfortable providing at this stage.</p>' +
        DOC_KEYS.map(function (d) {
          return (
            '<label class="grp-field"><span class="grp-label">' +
            escapeHtml(d.label) +
            '</span><input type="file" name="' +
            escapeHtml(d.key) +
            '" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,application/pdf,image/*" /></label>'
          );
        }).join("")
      );
    }
    if (n === 11) {
      return (
        '<div class="grp-summary" id="grp-summary">' +
        summaryHtml() +
        "</div>" +
        '<p class="grp-disclaimer">Submitting shares this package with Woolloongabba Medical Centre recruitment for confidential review. It is not an automated hire decision.</p>'
      );
    }
    return "";
  }

  function summaryHtml() {
    var p = state.data.personal || {};
    var r = state.data.registration || {};
    var w = state.data.websiteProfile || {};
    var a = state.data.availability || {};
    var pr = state.data.providerReadiness || {};
    var s19 = state.data.section19ab || {};
    var files = Object.keys(state.files);
    return (
      "<h3>Personal Information</h3><ul><li>" +
      escapeHtml((p.firstName || "") + " " + (p.lastName || "")) +
      "</li><li>" +
      escapeHtml(p.email || "") +
      "</li><li>" +
      escapeHtml(p.mobile || "") +
      "</li></ul>" +
      "<h3>Registration</h3><ul><li>AHPRA: " +
      escapeHtml(r.ahpraNumber || "—") +
      "</li><li>VR: " +
      escapeHtml(r.vocationallyRegistered || "—") +
      "</li></ul>" +
      "<h3>Professional Profile</h3><ul><li>" +
      escapeHtml(w.preferredPublishedName || "—") +
      "</li><li>" +
      escapeHtml((w.shortIntroduction || w.biography || "—").slice(0, 160)) +
      "</li><li>Languages: " +
      escapeHtml(
        Array.isArray(w.languagesSpoken) ? w.languagesSpoken.join(", ") : w.languagesSpoken || "—",
      ) +
      "</li></ul>" +
      "<h3>Availability</h3><ul><li>" +
      escapeHtml(a.preference || "—") +
      "</li><li>Days: " +
      escapeHtml((a.preferredDays || []).join(", ") || "—") +
      "</li><li>Start: " +
      escapeHtml(a.preferredStartDate || "—") +
      "</li></ul>" +
      "<h3>Provider Number Readiness</h3><ul><li>Provider #: " +
      escapeHtml(pr.medicareProviderNumber || "—") +
      "</li><li>PRODA: " +
      escapeHtml(pr.prodaAccount || "—") +
      "</li><li>HPOS: " +
      escapeHtml(pr.hposAccess || "—") +
      "</li></ul>" +
      "<h3>19AB Assessment</h3><ul><li>19AB: " +
      escapeHtml(s19.subject19ab || "—") +
      "</li><li>Moratorium: " +
      escapeHtml(s19.tenYearMoratorium || "—") +
      "</li><li>DPA: " +
      escapeHtml(s19.dpaRequirements || "—") +
      "</li></ul>" +
      "<h3>Spousal Assessment</h3><ul><li>Preliminary outcome: " +
      escapeHtml(
        state.spousalOutcome === "likely_eligible" ? "Likely Eligible" : "Further Review Required",
      ) +
      "</li></ul>" +
      "<h3>Uploaded Documents</h3><ul><li>" +
      escapeHtml(files.length ? files.join(", ") : "None attached") +
      "</li></ul>"
    );
  }

  function fillKnown(form) {
    var map = Object.assign(
      {},
      state.data.personal || {},
      state.data.registration || {},
      state.data.professional || {},
      state.data.websiteProfile || {},
      state.data.availability || {},
      state.data.providerReadiness || {},
      state.data.section19ab || {},
      state.data.spousal || {},
      state.data.providerGuidance || {},
    );
    if (state.data.websiteProfile) {
      var wp = state.data.websiteProfile;
      map.profileTitle = wp.title === "Dr" || wp.title === "A/Prof" || wp.title === "Prof" ? wp.title : "Other";
      if (map.profileTitle === "Other") map.profileTitleOther = wp.title || "";
      map.preferredPublishedName = wp.preferredPublishedName;
      map.credentials = wp.credentials;
      map.biography = wp.biography;
      map.shortIntroduction = wp.shortIntroduction;
      map.qualificationsList = Array.isArray(wp.qualifications)
        ? wp.qualifications.join("\n")
        : wp.qualifications;
      map.profileInterests = wp.specialInterests;
      map.languagesSpoken = wp.languagesSpoken || wp.languages;
      map.profileYearsPractising = wp.yearsPractising;
      map.memberships = wp.memberships;
    }
    if (state.data.section19ab) {
      map.currentPracticeLocation19ab = state.data.section19ab.currentPracticeLocation;
    }
    if (state.data.spousal) {
      map.skilledOccupation = state.data.spousal.occupation;
      map.skilledEmployer = state.data.spousal.employer;
      map.skilledWorkplace = state.data.spousal.workplaceLocation;
      map.skilledVisaType = state.data.spousal.visaType;
      map.skilledMigrationDate = state.data.spousal.migrationDate;
    }
    if (state.data.providerGuidance) map.providerSituation = state.data.providerGuidance.situation;

    Object.keys(map).forEach(function (key) {
      var value = map[key];
      if (Array.isArray(value)) {
        value.forEach(function (v) {
          var box = form.querySelector('input[name="' + key + '"][value="' + String(v).replace(/"/g, "") + '"]');
          if (box) box.checked = true;
        });
        return;
      }
      var input = form.querySelector('[name="' + key + '"]');
      if (!input) return;
      if (input.type === "radio") {
        var radio = form.querySelector(
          'input[name="' + key + '"][value="' + String(value).replace(/"/g, "") + '"]',
        );
        if (radio) radio.checked = true;
      } else {
        input.value = value == null ? "" : String(value);
      }
    });
  }

  function bindStepBehaviours(form) {
    if (state.step === 4) {
      var shot = form.querySelector('input[name="headshot"]');
      var cropRow = el("grp-crop-row");
      var imgLand = el("grp-headshot-landscape");
      var imgSquare = el("grp-headshot-square");
      var err = el("grp-headshot-error");
      var shortIntro = form.querySelector('[name="shortIntroduction"]');
      var shortCount = el("grp-short-count");
      var titleSelect = form.querySelector('[name="profileTitle"]');
      var titleOther = form.querySelector('[name="profileTitleOther"]');

      function syncTitleOther() {
        if (!titleOther) return;
        var wrap = titleOther.closest(".grp-field");
        if (wrap) wrap.hidden = !(titleSelect && titleSelect.value === "Other");
      }

      function updateCharCount() {
        if (!shortIntro || !shortCount) return;
        shortCount.textContent = String(shortIntro.value.length) + " / 250";
      }

      function listChecked(name) {
        return Array.prototype.map
          .call(form.querySelectorAll('input[name="' + name + '"]:checked'), function (node) {
            return node.value;
          })
          .filter(Boolean);
      }

      function updateLivePreview() {
        var name =
          (form.querySelector('[name="preferredPublishedName"]') || {}).value ||
          "Preferred published name";
        var shortText =
          (form.querySelector('[name="shortIntroduction"]') || {}).value ||
          "Short introduction for cards and booking systems.";
        var bio =
          (form.querySelector('[name="biography"]') || {}).value ||
          "Professional biography will appear on the full doctor profile.";
        var quals = ((form.querySelector('[name="qualificationsList"]') || {}).value || "")
          .split(/[,;\n]+/)
          .map(function (s) {
            return s.trim();
          })
          .filter(Boolean);
        var creds = listChecked("credentials");
        var interests = listChecked("profileInterests");
        var languages = listChecked("languagesSpoken");
        var card = el("grp-doctor-card");
        var full = el("grp-doctor-full");
        var photo =
          state.headshotUrl ||
          "data:image/svg+xml," +
            encodeURIComponent(
              '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect fill="%23dbe4e9" width="120" height="120"/><text x="50%" y="54%" text-anchor="middle" fill="%23596b78" font-size="12">Photo</text></svg>',
            );
        if (card) {
          card.innerHTML =
            '<div class="grp-card-photo"><img src="' +
            photo +
            '" alt="" /></div><div class="grp-card-copy"><strong>' +
            escapeHtml(name) +
            "</strong><span>" +
            escapeHtml((creds.length ? creds : quals).slice(0, 3).join(" · ") || "Credentials") +
            "</span><p>" +
            escapeHtml(shortText.slice(0, 250)) +
            "</p></div>";
        }
        if (full) {
          full.innerHTML =
            '<div class="grp-full-hero"><img src="' +
            photo +
            '" alt="" /><div><p class="grp-eyebrow">General Practitioner</p><h3>' +
            escapeHtml(name) +
            "</h3><p>" +
            escapeHtml((creds.length ? creds : quals).join(" · ") || "") +
            '</p></div></div><p class="grp-full-bio">' +
            escapeHtml(bio.slice(0, 480)) +
            (bio.length > 480 ? "…" : "") +
            '</p><ul class="grp-full-meta"><li><strong>Languages</strong> ' +
            escapeHtml(languages.join(", ") || "—") +
            "</li><li><strong>Special interests</strong> " +
            escapeHtml(interests.join(", ") || "—") +
            "</li></ul>";
        }
      }

      if (titleSelect) {
        titleSelect.addEventListener("change", syncTitleOther);
        syncTitleOther();
      }
      if (shortIntro) {
        shortIntro.addEventListener("input", function () {
          updateCharCount();
          updateLivePreview();
        });
        updateCharCount();
      }
      if (shot) {
        shot.addEventListener("change", function () {
          if (err) {
            err.hidden = true;
            err.textContent = "";
          }
          if (!(shot.files && shot.files[0])) return;
          var file = shot.files[0];
          var reader = new FileReader();
          reader.onload = function () {
            var probe = new Image();
            probe.onload = function () {
              if (probe.naturalWidth < MIN_HEADSHOT_PX || probe.naturalHeight < MIN_HEADSHOT_PX) {
                if (err) {
                  err.hidden = false;
                  err.textContent =
                    "Headshot must be at least " +
                    MIN_HEADSHOT_PX +
                    "×" +
                    MIN_HEADSHOT_PX +
                    " px. This image is " +
                    probe.naturalWidth +
                    "×" +
                    probe.naturalHeight +
                    ".";
                }
                shot.value = "";
                state.files.headshot = null;
                state.headshotMeta = null;
                return;
              }
              if (state.headshotUrl) URL.revokeObjectURL(state.headshotUrl);
              state.headshotUrl = URL.createObjectURL(file);
              state.files.headshot = file;
              state.headshotMeta = {
                width: probe.naturalWidth,
                height: probe.naturalHeight,
                fileName: file.name,
              };
              if (imgLand) imgLand.src = state.headshotUrl;
              if (imgSquare) imgSquare.src = state.headshotUrl;
              if (cropRow) cropRow.hidden = false;
              updateLivePreview();
            };
            probe.onerror = function () {
              if (err) {
                err.hidden = false;
                err.textContent = "Could not read that image. Please upload JPG, PNG, or WEBP.";
              }
            };
            probe.src = String(reader.result || "");
          };
          reader.readAsDataURL(file);
        });
      }
      form.addEventListener("input", updateLivePreview);
      form.addEventListener("change", updateLivePreview);
      if (state.headshotUrl) {
        if (imgLand) imgLand.src = state.headshotUrl;
        if (imgSquare) imgSquare.src = state.headshotUrl;
        if (cropRow) cropRow.hidden = false;
      }
      updateLivePreview();
    }
    if (state.step === 7) {
      form.addEventListener("change", function () {
        var unsure =
          form.querySelector('input[name="subject19ab"]:checked') ||
          form.querySelector('input[name="tenYearMoratorium"]:checked') ||
          form.querySelector('input[name="dpaRequirements"]:checked');
        var hint = el("grp-19ab-hint");
        if (!hint) return;
        var show =
          (form.querySelector('input[name="subject19ab"][value="unsure"]:checked') ||
            form.querySelector('input[name="tenYearMoratorium"][value="unsure"]:checked') ||
            form.querySelector('input[name="dpaRequirements"][value="unsure"]:checked')) != null;
        hint.hidden = !show;
        void unsure;
      });
    }
    if (state.step === 8) {
      function syncPartner() {
        var type = (form.querySelector('[name="partnerType"]') || {}).value;
        var med = el("grp-partner-medical");
        var sk = el("grp-partner-skilled");
        if (med) med.hidden = type !== "medical_practitioner";
        if (sk) sk.hidden = type !== "skilled_migrant";
      }
      var partnerType = form.querySelector('[name="partnerType"]');
      if (partnerType) partnerType.addEventListener("change", syncPartner);
      syncPartner();
      form.addEventListener("change", function () {
        collectStep(form);
        var box = el("grp-spousal-outcome");
        if (!box) return;
        var outcome = assessSpousalClient(state.data.spousal || {});
        state.spousalOutcome = outcome;
        box.hidden = false;
        box.innerHTML =
          "<strong>Preliminary Eligibility Outcome</strong><p>" +
          (outcome === "likely_eligible" ? "Likely Eligible" : "Further Review Required") +
          "</p>";
      });
    }
    if (state.step === 9) {
      function syncGuide() {
        var v = (form.querySelector('input[name="providerSituation"]:checked') || {}).value;
        var a = el("grp-guide-initial");
        var b = el("grp-guide-additional");
        if (a) a.hidden = v !== "initial";
        if (b) b.hidden = v !== "additional";
      }
      form.addEventListener("change", syncGuide);
      syncGuide();
    }
  }

  function renderStep() {
    var body = el("grp-body");
    if (!body) return;
    if (state.step > TOTAL_STEPS) {
      renderDone();
      return;
    }
    body.innerHTML =
      renderProgress() +
      '<form id="grp-form" class="grp-form" novalidate>' +
      "<h2 class=\"grp-step-title\">" +
      escapeHtml(stepTitle(state.step)) +
      "</h2>" +
      stepHtml(state.step) +
      '<div class="grp-actions">' +
      (state.step > 1
        ? '<button type="button" class="button button-secondary" id="grp-back">Back</button>'
        : "") +
      (state.step < TOTAL_STEPS
        ? '<button type="submit" class="button" id="grp-continue">Continue</button>'
        : '<button type="submit" class="button" id="grp-submit">Submit GP Readiness &amp; Onboarding Package</button>') +
      "</div>" +
      '<p class="grp-save-hint">Save progress is planned as a future enhancement — keep this window open until you submit.</p>' +
      "</form>";

    var form = el("grp-form");
    if (!form) return;
    fillKnown(form);
    bindStepBehaviours(form);
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (typeof form.reportValidity === "function" && !form.reportValidity()) return;
      collectStep(form);
      if (state.step === TOTAL_STEPS) {
        submitPackage();
        return;
      }
      state.step += 1;
      renderStep();
    });
    var back = el("grp-back");
    if (back) {
      back.addEventListener("click", function () {
        collectStep(form);
        state.step = Math.max(1, state.step - 1);
        renderStep();
      });
    }
  }

  function renderDone() {
    var body = el("grp-body");
    if (!body) return;
    var contactName = "Roshan Samarawickrema";
    body.innerHTML =
      '<div class="grp-done">' +
      "<h2>Your Next Steps</h2>" +
      "<ol class=\"grp-next-steps\">" +
      "<li>Recruitment review</li>" +
      "<li>Confidential discussion</li>" +
      "<li>Practice tour</li>" +
      "<li>Commercial discussion</li>" +
      "<li>Provider-number support</li>" +
      "<li>Website profile preparation</li>" +
      "<li>Planned onboarding</li>" +
      "</ol>" +
      "<p><strong>Expected review time:</strong> 1–2 business days.</p>" +
      "<p><strong>Contact:</strong> " +
      escapeHtml(contactName) +
      "<br/>Practice Operations</p>" +
      '<button type="button" class="button" id="grp-close-done">Close</button>' +
      "</div>";
    var btn = el("grp-close-done");
    if (btn) btn.addEventListener("click", closePortal);
  }

  function submitPackage() {
    var btn = el("grp-submit");
    if (btn) btn.disabled = true;
    var fd = new FormData();
    fd.append("payload", JSON.stringify(state.data));
    Object.keys(state.files).forEach(function (key) {
      fd.append(key, state.files[key], state.files[key].name);
    });
    fetch("/api/clinics/" + encodeURIComponent(clinicSlug()) + "/gp-pipeline/readiness-package", {
      method: "POST",
      body: fd,
    })
      .then(function (r) {
        return r.json().then(function (j) {
          return { ok: r.ok, j: j };
        });
      })
      .then(function (res) {
        if (!res.ok) {
          alert(
            "We could not submit just now" +
              (res.j && res.j.error ? " (" + res.j.error + ")" : "") +
              ". Please try again or call Roshan Samarawickrema on 0481 706 474.",
          );
          if (btn) btn.disabled = false;
          return;
        }
        state.step = TOTAL_STEPS + 1;
        renderDone();
      })
      .catch(function () {
        alert("We could not reach the practice just now — please call 0481 706 474.");
        if (btn) btn.disabled = false;
      });
  }

  function openPortal() {
    var portal = el("gp-readiness-portal");
    if (!portal) return;
    portal.hidden = false;
    portal.removeAttribute("hidden");
    portal.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("grp-portal-open");
    if (!state.step || state.step < 1 || state.step > TOTAL_STEPS) state.step = 1;
    try {
      renderStep();
    } catch (err) {
      var body = el("grp-body");
      if (body) {
        body.innerHTML =
          '<p class="grp-disclaimer">The portal could not start. Please refresh and try again, or call Roshan Samarawickrema on 0481 706 474.</p>';
      }
      if (typeof console !== "undefined" && console.error) console.error("GP readiness portal", err);
    }
    var close = el("grp-close");
    if (close) close.focus();
  }

  function closePortal() {
    var portal = el("gp-readiness-portal");
    if (!portal) return;
    portal.hidden = true;
    portal.setAttribute("hidden", "");
    portal.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("grp-portal-open");
  }

  function eventElement(ev) {
    var t = ev.target;
    if (!t) return null;
    // Text-node clicks have no Element.closest — climb to the parent element.
    if (t.nodeType === 3) t = t.parentElement;
    return t && t.closest ? t : null;
  }

  function onTrigger(ev) {
    var t = eventElement(ev);
    if (!t) return;
    var trigger = t.closest("[data-gp-readiness-open]");
    if (!trigger) return;
    ev.preventDefault();
    ev.stopPropagation();
    openPortal();
  }

  function boot() {
    document.addEventListener("click", onTrigger, true);
    var close = el("grp-close");
    var backdrop = el("grp-backdrop");
    if (close) close.addEventListener("click", closePortal);
    if (backdrop) backdrop.addEventListener("click", closePortal);
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") closePortal();
    });
    window.addEventListener("hashchange", function () {
      if (location.hash === "#gp-readiness-portal") openPortal();
    });
    if (location.hash === "#gp-readiness-portal") openPortal();
    window.WMCOpenGpReadiness = openPortal;
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
