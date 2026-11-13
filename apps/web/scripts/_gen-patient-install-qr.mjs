/**
 * One-shot generator for public/patient-install-qr.js (Phase B1 host-aware QR).
 * Requires qrcode (dev) and apps/web/.tmp-qr-modules.json from a prior create pass.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(fs.readFileSync(path.join(root, ".tmp-qr-modules.json"), "utf8"));

const entries = Object.entries(data)
  .map(([host, v]) => {
    const rows = v.rows.map((r) => JSON.stringify(r)).join(",\n      ");
    return (
      `    ${JSON.stringify(host)}: {\n` +
      `      url: ${JSON.stringify(v.url)},\n` +
      `      modules: [\n      ${rows}\n      ]\n` +
      `    }`
    );
  })
  .join(",\n");

const js = `/**
 * WMC Patient App — desktop QR handoff + mobile install entry (Phase B1).
 * Host-aware: QR and link use the current site origin (staging vs production).
 * Module bitmaps generated offline (qrcode 1.5.4, ECC M).
 */
(function () {
  "use strict";

  var INSTALL_PATH = "/install-wmc-app.html?source=desktop-qr";
  var PRODUCTION_HOST = "gabbamedicalcentre.com.au";

  /** Precomputed QR matrices for known public hosts (decode-verified in tests). */
  var QR_BY_HOST = {
${entries}
  };

  var MOBILE_UA =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i;

  function normalizeHost(hostname) {
    var h = String(hostname || "").toLowerCase().replace(/:\\d+$/, "");
    if (h === "www.gabbamedicalcentre.com.au") return PRODUCTION_HOST;
    return h;
  }

  function resolveInstallHandoffUrl(locationLike) {
    var loc = locationLike || (typeof window !== "undefined" ? window.location : null);
    if (!loc || !loc.hostname) {
      return "https://" + PRODUCTION_HOST + INSTALL_PATH;
    }
    var host = normalizeHost(loc.hostname);
    var known = QR_BY_HOST[host];
    if (known) return known.url;
    var origin = loc.origin || loc.protocol + "//" + loc.host;
    return String(origin).replace(/\\/$/, "") + INSTALL_PATH;
  }

  function modulesForHost(hostname) {
    var host = normalizeHost(hostname);
    var known = QR_BY_HOST[host];
    return known ? known.modules : null;
  }

  function prefersMobileHandoff() {
    var narrow =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(max-width: 767px)").matches;
    return narrow || MOBILE_UA.test(navigator.userAgent || "");
  }

  function drawMatrixToCanvas(canvas, modules, opts) {
    var size = modules.length;
    var margin = (opts && opts.margin) || 4;
    var px = (opts && opts.pixelSize) || 6;
    var light = (opts && opts.light) || "#ffffff";
    var dark = (opts && opts.dark) || "#0b2545";

    var dim = size + margin * 2;
    canvas.width = dim * px;
    canvas.height = dim * px;

    var ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = light;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = dark;

    for (var row = 0; row < size; row++) {
      var line = modules[row];
      for (var col = 0; col < size; col++) {
        if (line.charAt(col) === "1") {
          ctx.fillRect((col + margin) * px, (row + margin) * px, px, px);
        }
      }
    }
  }

  function setPanelVisible(el, show) {
    if (!el) return;
    el.hidden = !show;
    el.setAttribute("aria-hidden", show ? "false" : "true");
  }

  function initInstallHandoff() {
    var root = document.documentElement;
    if (!root || root.getAttribute("data-wmc-install-page") !== "true") return;

    var desktop = document.getElementById("wmc-install-desktop");
    var mobile = document.getElementById("wmc-install-mobile");
    var canvas = document.getElementById("wmc-install-qr-canvas");
    var urlOut = document.getElementById("wmc-install-handoff-url");
    var handoffUrl = resolveInstallHandoffUrl(window.location);
    var modules = modulesForHost(window.location.hostname);

    var onMobile = prefersMobileHandoff();
    setPanelVisible(desktop, !onMobile);
    setPanelVisible(mobile, onMobile);
    root.setAttribute("data-wmc-install-mode", onMobile ? "mobile" : "desktop");
    root.setAttribute("data-wmc-install-handoff", handoffUrl);

    if (!onMobile && canvas && modules) {
      drawMatrixToCanvas(canvas, modules, { margin: 4, pixelSize: 6 });
      canvas.setAttribute(
        "aria-label",
        "QR code linking to " + handoffUrl + " on your phone",
      );
      canvas.hidden = false;
    } else if (canvas && !modules) {
      canvas.hidden = true;
    }

    if (urlOut) {
      urlOut.textContent = handoffUrl;
      if (urlOut.tagName === "A") {
        urlOut.setAttribute("href", handoffUrl);
      }
    }

    var params = new URLSearchParams(window.location.search || "");
    if (params.get("source") === "desktop-qr" && onMobile) {
      var notice = document.getElementById("wmc-install-scanned-notice");
      if (notice) notice.hidden = false;
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initInstallHandoff);
  } else {
    initInstallHandoff();
  }

  window.wmcPatientInstallQr = {
    resolveInstallHandoffUrl: resolveInstallHandoffUrl,
    modulesForHost: modulesForHost,
    drawMatrixToCanvas: drawMatrixToCanvas,
    prefersMobileHandoff: prefersMobileHandoff,
    qrByHost: QR_BY_HOST,
  };
})();
`;

fs.writeFileSync(path.join(root, "public", "patient-install-qr.js"), js);
console.log("wrote public/patient-install-qr.js");
