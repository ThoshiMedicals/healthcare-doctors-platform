/**
 * Patient PWA standalone quick-access strip — client enhancement.
 *
 * Scope: wires the `.patient-pwa-quicknav` strip that public-ux.ts injects
 * into every patient page that already has the approved persistent-care
 * booking dock. The strip itself is CSS-hidden outside
 * `@media (display-mode: standalone)`, so this script is a deliberate no-op
 * in every ordinary browser tab (the overwhelming majority of traffic) and
 * only does any work when the site has been launched as an installed PWA.
 *
 * Does NOT:
 *  - read, store, or cache any patient/personal data (no localStorage/cookies)
 *  - register or touch any service worker (that is Agent 1 / Agent 3 scope —
 *    see hook comment below if a service worker needs to notify this module)
 *  - implement booking logic — Digital Reception is opened by proxying a
 *    click to the existing `.digital-reception-launcher`, the same pattern
 *    already used by the homepage hero's `[data-open-digital-reception]`
 *    button (see apps/web/src/documents/public-ux.ts).
 */
(function () {
  "use strict";

  var isStandalone = false;
  try {
    isStandalone =
      (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
      // Legacy iOS Safari "Add to Home Screen" flag.
      window.navigator.standalone === true;
  } catch (e) {
    isStandalone = false;
  }

  // No-op in a normal browser tab — the quicknav strip is also CSS-hidden there.
  if (!isStandalone) return;

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else {
      fn();
    }
  }

  ready(function () {
    var nav = document.querySelector(".patient-pwa-quicknav");
    if (!nav) return;

    // Digital Reception: proxy-click the existing launcher. Mirrors the
    // homepage hero's data-open-digital-reception delegate so there is a
    // single source of truth for "how to open Digital Reception".
    document.addEventListener("click", function (event) {
      var trigger =
        event.target && event.target.closest && event.target.closest("[data-open-digital-reception]");
      if (!trigger || !nav.contains(trigger)) return;
      event.preventDefault();
      var launcher = document.querySelector(".digital-reception-launcher");
      if (launcher) launcher.click();
    });

    // Optional: tiny top progress indicator for in-app HTML navigations only.
    // Standalone windows have no browser chrome loading affordance, so a
    // brief indeterminate bar gives feedback between tap and next paint.
    var bar = document.createElement("div");
    bar.className = "patient-pwa-nav-progress";
    bar.setAttribute("aria-hidden", "true");
    document.body.appendChild(bar);

    var EXTERNAL_HREF_RE = /^(tel:|mailto:|https?:\/\/|#)/i;
    var links = nav.querySelectorAll("a.patient-pwa-quicknav-link[href]");
    for (var i = 0; i < links.length; i += 1) {
      links[i].addEventListener("click", function (event) {
        var href = this.getAttribute("href") || "";
        if (EXTERNAL_HREF_RE.test(href)) return; // tel:/HotDoc links — no in-app navigation
        if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.button === 1) {
          return;
        }
        document.body.classList.add("pwa-nav-loading");
      });
    }

    window.addEventListener("pagehide", function () {
      document.body.classList.remove("pwa-nav-loading");
    });

    // Hook for Agent 1/3's service worker, if/when one lands: dispatch a
    // "wmc:pwa-nav-ready" event here so a future SW-aware layer can detect
    // this module without this file depending on the service worker at all.
  });
})();
