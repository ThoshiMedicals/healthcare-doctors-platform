(function () {
  var form = document.getElementById("doctor-readiness-form");
  var result = document.getElementById("doctor-readiness-result");
  if (!form || !result) return;
  var clinic =
    (document.currentScript && document.currentScript.getAttribute("data-clinic-slug")) ||
    (document.documentElement.getAttribute("data-clinic-slug") || "woolloongabba");

  function band(score) {
    if (score >= 80)
      return {
        id: "ready",
        label: "You already sound ready to get in touch",
        next: "A short note or a call with the practice is a natural next step — this page does not gate anything.",
      };
    if (score >= 60)
      return {
        id: "nearly_ready",
        label: "Close enough — a conversation often clears the rest",
        next: "You do not need to finish every detail here. A quick call or note with the practice is fine.",
      };
    if (score >= 40)
      return {
        id: "preparing",
        label: "Still gathering thoughts — that is fine",
        next: "Practice Experience and the GP FAQ may help. Or skip this and write when you are ready.",
      };
    return {
      id: "early",
      label: "Early days — no rush",
      next: "Start with Practice Experience if you want to picture the work. You can contact the practice whenever you like.",
    };
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var fd = new FormData(form);
    if (window.WmcAttractionTrack && window.WmcAttractionTrack.send) {
      window.WmcAttractionTrack.send({
        name: "tool_complete",
        surface: "doctor_readiness",
        toolId: "doctor-readiness",
        path: (location.pathname || "").replace(/^\//, ""),
      });
    }
    var themes = {
      credentials: Number(fd.get("credentials") || 0),
      availability: Number(fd.get("availability") || 0),
      clinical: Number(fd.get("clinical") || 0),
      fit: Number(fd.get("fit") || 0),
      practical: Number(fd.get("practical") || 0),
    };
    var total = themes.credentials + themes.availability + themes.clinical + themes.fit + themes.practical;
    var b = band(total);
    try {
      localStorage.setItem(
        "wmc-doctor-readiness-draft",
        JSON.stringify({ total: total, themes: themes, band: b, at: Date.now() }),
      );
    } catch (e) {}

    result.hidden = false;
    result.innerHTML =
      "<p><strong>" +
      b.label +
      "</strong></p><p>" +
      b.next +
      "</p><p><em>This is only for your own thinking. It does not decide anything for you or for us.</em></p><p><button type=\"button\" class=\"button\" id=\"ready-save\">Send these notes to the practice</button> <a class=\"button button-secondary\" href=\"express-interest.html\">Introduce yourself</a></p>";

    var saveBtn = document.getElementById("ready-save");
    if (saveBtn) {
      saveBtn.addEventListener("click", function () {
        saveBtn.disabled = true;
        fetch("/api/clinics/" + encodeURIComponent(clinic) + "/gp-pipeline/readiness", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            totalScore: total,
            themeScoresJson: themes,
            answersJson: { source: "doctor-readiness-ev", advisoryOnly: true },
            applicantName: String(fd.get("applicantName") || "") || undefined,
            applicantEmail: String(fd.get("applicantEmail") || "") || undefined,
          }),
        })
          .then(function (r) {
            return r.json().then(function (j) {
              return { ok: r.ok, j: j };
            });
          })
          .then(function (res) {
            result.innerHTML += res.ok
              ? "<p class=\"ev-synth\">Sent — someone at the practice will read it.</p>"
              : "<p class=\"ev-synth\">Could not send just now — try again or call the practice.</p>";
          })
          .catch(function () {
            result.innerHTML +=
              "<p class=\"ev-synth\">Could not send just now — try again or call the practice.</p>";
          })
          .finally(function () {
            saveBtn.disabled = false;
          });
      });
    }
  });
})();
