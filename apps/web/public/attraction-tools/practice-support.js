(function () {
  var btn = document.getElementById("matrix-save");
  var status = document.getElementById("matrix-status");
  if (!btn) return;
  btn.addEventListener("click", function () {
    var checked = Array.prototype.slice
      .call(document.querySelectorAll("[data-matrix]:checked"))
      .map(function (el) {
        return el.getAttribute("data-matrix");
      });
    try {
      localStorage.setItem("wmc-practice-support-matrix", JSON.stringify({ checked: checked, at: Date.now() }));
      if (status) {
        status.hidden = false;
        status.textContent = "Checklist saved on this device.";
      }
    } catch (e) {
      if (status) {
        status.hidden = false;
        status.textContent = "Could not keep those ticks — try again, or jot them elsewhere.";
      }
    }
  });
})();
