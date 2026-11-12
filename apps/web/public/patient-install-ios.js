/**
 * Patient Hub — iPhone Safari Add to Home Screen guide (client runtime).
 *
 * Shows `#wmc-ios-install` only on iOS Safari when the site is not already
 * launched from the Home Screen. Honors shared dismiss timestamps in
 * localStorage (see patient-install-ios.ts exports).
 *
 * Does NOT trigger or simulate install prompts — Apple provides no automatic
 * install UI in Safari; patients follow the on-screen steps manually.
 */
(function () {
  "use strict";

  var PANEL_ID = "wmc-ios-install";
  var KEYS = {
    dismissedAt: "wmc.patientInstall.v1.dismissedAt",
    iosGuideDismissedAt: "wmc.patientInstall.v1.iosGuideDismissedAt",
  };
  /** Keep in sync with PATIENT_INSTALL_IOS_DISMISS_COOLDOWN_MS in patient-install-ios.ts */
  var COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;

  function isStandalone() {
    try {
      if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) {
        return true;
      }
      if (window.navigator && window.navigator.standalone === true) {
        return true;
      }
    } catch (e) {
      /* ignore */
    }
    return false;
  }

  function isIosSafari() {
    try {
      var ua = (window.navigator && window.navigator.userAgent) || "";
      var isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
      if (!isIOS) return false;
      var isSafari = /Safari/i.test(ua);
      var isAltBrowser = /CriOS|FxiOS|OPiOS|EdgiOS/i.test(ua);
      return isSafari && !isAltBrowser;
    } catch (e) {
      return false;
    }
  }

  function parseDismissedAt(key) {
    try {
      var raw = window.localStorage.getItem(key);
      if (!raw) return null;
      var ts = Number(raw);
      return Number.isFinite(ts) && ts > 0 ? ts : null;
    } catch (e) {
      return null;
    }
  }

  function inCooldown() {
    var now = Date.now();
    var shared = parseDismissedAt(KEYS.dismissedAt);
    var ios = parseDismissedAt(KEYS.iosGuideDismissedAt);
    if (shared && now - shared < COOLDOWN_MS) return true;
    if (ios && now - ios < COOLDOWN_MS) return true;
    return false;
  }

  function recordDismiss() {
    var now = String(Date.now());
    try {
      window.localStorage.setItem(KEYS.dismissedAt, now);
      window.localStorage.setItem(KEYS.iosGuideDismissedAt, now);
    } catch (e) {
      /* ignore quota / private mode */
    }
  }

  function hide(panel) {
    if (panel) panel.hidden = true;
  }

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  ready(function () {
    if (!isIosSafari() || isStandalone() || inCooldown()) return;

    var panel = document.getElementById(PANEL_ID);
    if (!panel) return;

    var dismissBtn = panel.querySelector("[data-wmc-ios-install-dismiss]");
    if (dismissBtn) {
      dismissBtn.addEventListener("click", function () {
        recordDismiss();
        hide(panel);
      });
    }

    panel.hidden = false;
  });
})();
