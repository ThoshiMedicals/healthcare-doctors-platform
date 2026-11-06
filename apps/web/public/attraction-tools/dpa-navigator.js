(function () {
  var btn = document.getElementById("dpa-advise");
  var stage = document.getElementById("dpa-stage");
  var result = document.getElementById("dpa-result");
  if (!btn || !stage || !result) return;
  var copy = {
    exploring:
      "Start with Practice Experience if you want to picture the work. Official DPA (Distribution Priority Area) and 19AB answers sit with government sources — not with the practice. You can write to us whenever you like.",
    overseas_trained:
      "Confirm 19AB status with official sources first. We can talk about sessions once your pathway constraints are clear. We do not decide 19AB outcomes.",
    dpa_location:
      "Location classifications change. Check the current DPA listing in official directories before assuming Woolloongabba qualifies. A conversation with us is still welcome — it does not replace that check.",
    local_ready:
      "If your local pathway is mostly sorted, note preferred sessions if you like and introduce yourself. Someone at the practice reads every note.",
  };
  btn.addEventListener("click", function () {
    var key = stage.value;
    result.hidden = false;
    result.innerHTML =
      "<p><strong>A sensible next step</strong></p><p>" +
      (copy[key] || copy.exploring) +
      "</p><p><a href=\"doctor-readiness.html\">Am I ready to talk? (optional)</a> · <a href=\"express-interest.html\">Introduce yourself</a></p>";
    try {
      localStorage.setItem("wmc-dpa-draft", JSON.stringify({ stage: key, at: Date.now() }));
    } catch (e) {}
  });
})();
