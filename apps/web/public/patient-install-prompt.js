/**
 * Patient PWA install tip — client runtime (Phase 3B).
 *
 * Pairs with patient-install-prompt.ts (storage keys + cooldown policy).
 * Loaded defer from the SSR block in pwa-meta / patient-install-prompt.
 */
(function () {
  "use strict";

  var KEYS = {
    dismissedAt: "wmc.patientInstall.v1.dismissedAt",
    installed: "wmc.patientInstall.v1.installed",
  };
  var LEGACY_SESSION = "wmcPwaInstallTipDismissed";
  var COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;
  var SHOW_DELAY_MS = 2500;
  var TIP_ID = "wmc-pwa-install-tip";
  var COPY = {
    default:
      "Install Gabba Medical for quick access: book appointments, your Preferred GP, Digital Reception, and call reception.",
    ios: 'Install Gabba Medical: tap Share, then "Add to Home Screen" for booking, Preferred GP, Digital Reception, and call.',
  };

  function nowMs() {
    return Date.now();
  }

  function parseDismissedAt(raw) {
    if (raw == null || raw === "") return null;
    var trimmed = String(raw).trim();
    if (/^\d+$/.test(trimmed)) {
      var epoch = Number(trimmed);
      return Number.isFinite(epoch) && epoch > 0 ? epoch : null;
    }
    var parsed = Date.parse(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  function isStandalone() {
    try {
      if (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) return true;
      if (window.navigator && window.navigator.standalone) return true;
    } catch (e) {}
    return false;
  }

  function readInstalled() {
    try {
      return localStorage.getItem(KEYS.installed) === "1";
    } catch (e) {
      return false;
    }
  }

  function readDismissedAt() {
    try {
      return parseDismissedAt(localStorage.getItem(KEYS.dismissedAt));
    } catch (e) {
      return null;
    }
  }

  function migrateLegacyDismiss() {
    try {
      if (!window.sessionStorage) return;
      if (!sessionStorage.getItem(LEGACY_SESSION)) return;
      var existing = localStorage.getItem(KEYS.dismissedAt);
      if (!existing) {
        localStorage.setItem(KEYS.dismissedAt, new Date(nowMs()).toISOString());
      }
      sessionStorage.removeItem(LEGACY_SESSION);
    } catch (e) {}
  }

  function shouldShow(now, dismissedAt, installed, standalone) {
    if (standalone) return false;
    if (installed) return false;
    if (dismissedAt == null) return true;
    return now - dismissedAt >= COOLDOWN_MS;
  }

  function persistDismiss() {
    try {
      localStorage.setItem(KEYS.dismissedAt, new Date(nowMs()).toISOString());
    } catch (e) {}
  }

  function markInstalled() {
    try {
      localStorage.setItem(KEYS.installed, "1");
    } catch (e) {}
    persistDismiss();
  }

  function hideTip(tip) {
    if (tip) tip.hidden = true;
  }

  try {
    if (isStandalone()) return;

    migrateLegacyDismiss();

    if (!shouldShow(nowMs(), readDismissedAt(), readInstalled(), false)) return;

    var tip = document.getElementById(TIP_ID);
    if (!tip) return;

    var textEl = document.getElementById(TIP_ID + "-text");
    var installBtn = document.getElementById(TIP_ID + "-install");
    var dismissBtn = document.getElementById(TIP_ID + "-dismiss");
    var deferredPrompt = null;
    var shown = false;

    function hide() {
      hideTip(tip);
    }

    function onDismiss() {
      persistDismiss();
      hide();
    }

    if (dismissBtn) {
      dismissBtn.addEventListener("click", onDismiss);
    }

    function reveal(mode) {
      if (shown) return;
      if (!shouldShow(nowMs(), readDismissedAt(), readInstalled(), isStandalone())) return;
      shown = true;
      if (mode === "ios" && textEl) {
        textEl.textContent = COPY.ios;
      } else if (installBtn) {
        installBtn.hidden = false;
        installBtn.addEventListener("click", function () {
          if (!deferredPrompt) return;
          deferredPrompt.prompt();
          deferredPrompt.userChoice.finally(function () {
            deferredPrompt = null;
            onDismiss();
          });
        });
      }
      tip.hidden = false;
    }

    var ua = (window.navigator && window.navigator.userAgent) || "";
    var isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    var isIOSSafari = isIOS && /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(ua);

    window.addEventListener("beforeinstallprompt", function (e) {
      e.preventDefault();
      deferredPrompt = e;
      setTimeout(function () {
        reveal("android");
      }, SHOW_DELAY_MS);
    });

    if (isIOSSafari) {
      setTimeout(function () {
        reveal("ios");
      }, SHOW_DELAY_MS);
    }

    window.addEventListener("appinstalled", function () {
      markInstalled();
      hide();
    });
  } catch (e) {}
})();
