(function () {
  var form = document.getElementById("eoi-form");
  var result = document.getElementById("eoi-result");
  if (!form || !result) return;
  var clinic =
    form.getAttribute("data-clinic-slug") ||
    (document.currentScript && document.currentScript.getAttribute("data-clinic-slug")) ||
    "woolloongabba";

  function text(fd, name) {
    var value = String(fd.get(name) || "").trim();
    return value || undefined;
  }

  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var fd = new FormData(form);
    var preferred = text(fd, "preferredContact");
    var message = text(fd, "availabilityNotes");
    var availabilityNotes = [
      preferred ? "Preferred contact: " + preferred : null,
      message || null,
    ]
      .filter(Boolean)
      .join("\n\n");
    var payload = {
      applicant: {
        name: String(fd.get("name") || ""),
        email: String(fd.get("email") || ""),
        phone: text(fd, "phone"),
      },
      preferences: {
        availabilityNotes: availabilityNotes || undefined,
      },
      source: "join_our_team_express_interest_ev",
      raw: {
        preferredContact: preferred || null,
        firstContactOnly: true,
      },
    };
    var btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    fetch("/api/clinics/" + encodeURIComponent(clinic) + "/gp-pipeline/eoi", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(function (r) {
        return r.json().then(function (j) {
          return { ok: r.ok, j: j };
        });
      })
      .then(function (res) {
        result.hidden = false;
        if (res.ok) {
          result.innerHTML =
            "<p><strong>Thank you.</strong> Your confidential enquiry has been received. Our recruitment lead will review it personally and get back to you.</p>";
          form.reset();
        } else {
          result.innerHTML =
            "<p>We could not send that just now" +
            (res.j && res.j.error ? " (" + res.j.error + ")" : "") +
            ". Please try again or call (07) 3217 3344.</p>";
        }
      })
      .catch(function () {
        result.hidden = false;
        result.innerHTML =
          "<p>We could not reach the practice just now — please call (07) 3217 3344.</p>";
      })
      .finally(function () {
        if (btn) btn.disabled = false;
      });
  });
})();
