(function () {
  var script = document.currentScript;
  if (!script) return;
  var key = script.getAttribute("data-draft-key") || "wmc-draft";
  var statusId = script.getAttribute("data-status-id");
  var textareaId = script.getAttribute("data-textarea-id");
  var buttonId = script.getAttribute("data-button-id");
  var ta = textareaId ? document.getElementById(textareaId) : null;
  var btn = buttonId ? document.getElementById(buttonId) : null;
  var status = statusId ? document.getElementById(statusId) : null;
  if (!ta || !btn) return;
  try {
    var existing = localStorage.getItem(key);
    if (existing) ta.value = existing;
  } catch (e) {}
  btn.addEventListener("click", function () {
    try {
      localStorage.setItem(key, ta.value || "");
      if (status) {
        status.hidden = false;
        status.textContent = "Notes kept on this device.";
      }
      if (window.WmcAttractionTrack && window.WmcAttractionTrack.send) {
        var toolId =
          key.indexOf("pn") >= 0 || key.indexOf("provider") >= 0
            ? "provider-number-readiness"
            : key;
        var surface =
          toolId === "provider-number-readiness"
            ? "provider_number_readiness"
            : undefined;
        window.WmcAttractionTrack.send({
          name: "tool_complete",
          surface: surface,
          toolId: toolId,
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
