/**
 * Phase 3D — patient share runtime (Web Share API + Clipboard fallback).
 * No third-party share SDKs. No analytics / tracking pixels.
 */
(function () {
  "use strict";

  var LIVE_ID = "wmc-patient-share-live";
  var MSG = {
    shared: "Shared",
    copied: "Link copied",
    unavailable: "Sharing unavailable",
  };

  function liveEl() {
    return document.getElementById(LIVE_ID);
  }

  function announce(message) {
    var el = liveEl();
    if (!el) return;
    el.textContent = "";
    window.setTimeout(function () {
      el.textContent = message;
    }, 20);
  }

  function readPayload(btn) {
    return {
      url: String(btn.getAttribute("data-share-url") || "").trim(),
      title: String(btn.getAttribute("data-share-title") || "Woolloongabba Medical Centre").trim(),
      text: String(btn.getAttribute("data-share-text") || "").trim(),
    };
  }

  function copyFallback(url) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      return navigator.clipboard.writeText(url).then(function () {
        announce(MSG.copied);
        return "copied";
      });
    }
    return new Promise(function (resolve, reject) {
      try {
        var ta = document.createElement("textarea");
        ta.value = url;
        ta.setAttribute("readonly", "");
        ta.style.position = "fixed";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        var ok = document.execCommand("copy");
        document.body.removeChild(ta);
        if (ok) {
          announce(MSG.copied);
          resolve("copied");
        } else {
          reject(new Error("copy failed"));
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  function canNativeShare(payload) {
    if (!navigator.share || typeof navigator.share !== "function") return false;
    if (typeof navigator.canShare === "function") {
      try {
        return navigator.canShare({ title: payload.title, text: payload.text || undefined, url: payload.url });
      } catch (_e) {
        return true;
      }
    }
    return true;
  }

  function share(btn) {
    var payload = readPayload(btn);
    if (!payload.url) {
      announce(MSG.unavailable);
      return;
    }
    btn.setAttribute("aria-busy", "true");
    var done = function () {
      btn.removeAttribute("aria-busy");
    };

    var shareData = {
      title: payload.title,
      url: payload.url,
    };
    if (payload.text) shareData.text = payload.text;

    var chain;
    if (canNativeShare(shareData)) {
      chain = navigator.share(shareData).then(function () {
        announce(MSG.shared);
        return "shared";
      });
    } else {
      chain = copyFallback(payload.url);
    }

    chain
      .catch(function (err) {
        // User cancel on native share — stay quiet.
        if (err && (err.name === "AbortError" || err.name === "NotAllowedError")) {
          return;
        }
        return copyFallback(payload.url).catch(function () {
          announce(MSG.unavailable);
        });
      })
      .finally(done);
  }

  function onClick(event) {
    var t = event.target;
    if (!t || !t.closest) return;
    var btn = t.closest("[data-wmc-share]");
    if (!btn || btn.disabled) return;
    event.preventDefault();
    share(btn);
  }

  document.addEventListener("click", onClick, false);
})();
