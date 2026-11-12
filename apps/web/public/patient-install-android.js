/**
 * Android Chrome / Samsung Internet install CTA — client runtime.
 *
 * Listens for `beforeinstallprompt`, surfaces a soft bottom card (no modal spam),
 * honours `wmc.patientInstall.v1.*` localStorage, and hides when already installed standalone.
 */
(function () {
  "use strict";

  var DISMISSED_KEY = "wmc.patientInstall.v1.dismissedAt";
  var INSTALLED_KEY = "wmc.patientInstall.v1.installed";
  var COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;
  var SHOW_DELAY_MS = 1800;

  var ROOT_ID = "wmc-android-install";
  var deferredPrompt = null;

  function storageGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function storageSet(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (e) {}
  }

  function parseDismissedAt(raw) {
    if (!raw) return null;
    var ms = Number(raw);
    return isFinite(ms) && ms > 0 ? ms : null;
  }

  function isStandalone() {
    try {
      if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) return true;
      if (window.matchMedia && window.matchMedia("(display-mode: minimal-ui)").matches) return true;
      if (window.navigator && window.navigator.standalone) return true;
    } catch (e) {}
    return false;
  }

  /**
   * UA heuristics (keep aligned with patient-install-android.ts):
   * Android + (SamsungBrowser OR Chrome without Samsung/EdgA/OPR/Firefox/wv).
   */
  function classifyUa(ua) {
    ua = ua || "";
    if (!/Android/i.test(ua)) return { supported: false, browser: "unsupported" };
    if (/SamsungBrowser\/\d+/i.test(ua)) return { supported: true, browser: "samsung" };
    var chrome =
      /Chrome\/\d+/i.test(ua) &&
      !/SamsungBrowser/i.test(ua) &&
      !/EdgA\//i.test(ua) &&
      !/OPR\//i.test(ua) &&
      !/Firefox\//i.test(ua) &&
      !/; wv\)/i.test(ua);
    if (chrome) return { supported: true, browser: "chrome" };
    return { supported: false, browser: "unsupported" };
  }

  function practiceNameFromDom() {
    var html = document.documentElement;
    var fromHtml = html && html.getAttribute && html.getAttribute("data-practice-name");
    if (fromHtml) return fromHtml;
    var slot = document.querySelector("[data-practice-name]");
    if (slot) {
      var attr = slot.getAttribute("data-practice-name");
      if (attr) return attr;
    }
    return null;
  }

  function hideRoot(root) {
    if (root) root.hidden = true;
  }

  function showRoot(root) {
    if (!root) return;
    root.hidden = false;
  }

  function dismiss(root) {
    storageSet(DISMISSED_KEY, String(Date.now()));
    hideRoot(root);
  }

  function markInstalled(root) {
    storageSet(INSTALLED_KEY, "1");
    hideRoot(root);
  }

  function cooldownActive() {
    if (storageGet(INSTALLED_KEY)) return true;
    var dismissed = parseDismissedAt(storageGet(DISMISSED_KEY));
    if (!dismissed) return false;
    return Date.now() - dismissed < COOLDOWN_MS;
  }

  function wireUi(root) {
    if (!root || root.getAttribute("data-wmc-android-wired") === "1") return;
    root.setAttribute("data-wmc-android-wired", "1");

    var name = practiceNameFromDom();
    if (name) {
      var slot = root.querySelector("[data-wmc-practice-name-slot]");
      if (slot) slot.textContent = name;
    }

    var installBtn = root.querySelector("[data-wmc-android-install-cta]");
    var dismissBtn = root.querySelector("[data-wmc-android-install-dismiss]");

    if (dismissBtn) {
      dismissBtn.addEventListener("click", function () {
        dismiss(root);
      });
    }

    if (installBtn) {
      installBtn.addEventListener("click", function () {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        deferredPrompt.userChoice
          .then(function (choice) {
            if (choice && choice.outcome === "accepted") {
              markInstalled(root);
            }
          })
          .catch(function () {})
          .finally(function () {
            deferredPrompt = null;
            if (installBtn) installBtn.hidden = true;
          });
      });
    }
  }

  function onPromptReady(root) {
    wireUi(root);
    var installBtn = root.querySelector("[data-wmc-android-install-cta]");
    if (installBtn) installBtn.hidden = false;
    window.setTimeout(function () {
      if (!deferredPrompt) return;
      if (cooldownActive()) return;
      showRoot(root);
    }, SHOW_DELAY_MS);
  }

  function init() {
    var uaInfo = classifyUa((window.navigator && window.navigator.userAgent) || "");
    if (!uaInfo.supported) return;

    if (isStandalone()) return;
    if (cooldownActive()) return;

    var root = document.getElementById(ROOT_ID);
    if (!root) return;

    wireUi(root);

    window.addEventListener("beforeinstallprompt", function (event) {
      event.preventDefault();
      deferredPrompt = event;
      onPromptReady(root);
    });

    window.addEventListener("appinstalled", function () {
      markInstalled(root);
      deferredPrompt = null;
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
