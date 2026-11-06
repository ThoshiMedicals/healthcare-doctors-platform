(function () {
  var btn = document.getElementById("sp-save");
  var status = document.getElementById("sp-status");
  if (!btn) return;
  btn.addEventListener("click", function () {
    var payload = {
      days: (document.getElementById("sp-days") || {}).value || "",
      count: (document.getElementById("sp-count") || {}).value || "",
      notes: (document.getElementById("sp-notes") || {}).value || "",
      at: Date.now(),
    };
    try {
      localStorage.setItem("wmc-session-planner-draft", JSON.stringify(payload));
      if (status) {
        status.hidden = false;
        status.textContent = "Notes kept on this device. Sessions are still confirmed with the practice in person.";
      }
      if (window.WmcAttractionTrack && window.WmcAttractionTrack.send) {
        window.WmcAttractionTrack.send({
          name: "tool_complete",
          surface: "gp_session_planner",
          toolId: "gp-session-planner",
          path: (location.pathname || "").replace(/^\//, ""),
        });
      }
    } catch (e) {
      if (status) {
        status.hidden = false;
        status.textContent = "Could not keep those notes — try again, or jot them elsewhere.";
      }
    }
  });
})();
