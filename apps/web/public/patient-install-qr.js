/**
 * WMC Patient App — desktop QR handoff + mobile install entry (Phase 3B).
 * QR module bitmap for the canonical handoff URL (generated offline with MIT qrcode-generator 1.4.4).
 */
(function () {
  "use strict";

  var HANDOFF_URL =
    "https://gabbamedicalcentre.com.au/install-wmc-app.html?source=desktop-qr";

  /** 37×37 modules for HANDOFF_URL, ECC level M (1 = dark). */
  var QR_MODULES = [
    "1111111011101100000111100100001111111",
    "1000001010010110110101001100101000001",
    "1011101011111100000101100101001011101",
    "1011101000010110010011000100101011101",
    "1011101011011010001110000010101011101",
    "1000001001101011100011011100001000001",
    "1111111010101010101010101010101111111",
    "0000000001000101111100100110100000000",
    "1001111110011010000100000011010010111",
    "0010110011011000111000010111010110110",
    "0001111110100001111111110011101010101",
    "1001010110111110110110001011000010111",
    "0101101110111001100000100000101101001",
    "0101100110101001001000010111100011000",
    "0100001011111111101111101001011011111",
    "1011000001111100000010110000001101111",
    "1000001010101100011000001100001000100",
    "0100100100111110000001100001010101000",
    "1000111010101010100100010011011100101",
    "1111010001100011101110011101011001001",
    "0100001000101010110100001011111111000",
    "1011100010101111010101110011000010100",
    "0110111100110011000011110001100101001",
    "0110100010110110001110010010101111100",
    "0101111011101100010010010011001100001",
    "1001010001000010001100110101100110000",
    "1100011010010101011000100101001100111",
    "1001110111110100100100000001000011101",
    "1010101010111001000110111100111110110",
    "0000000011011111010100100100100010100",
    "1111111011100001011101110100101010001",
    "1000001010101010000100111101100010011",
    "1011101011111011101000001011111110010",
    "1011101011001100000011010110011000101",
    "1011101001010000010010111001010011001",
    "1000001000010011011100010001000011111",
    "1111111010011010100110011001111100001",
  ];

  var MOBILE_UA =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i;

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

    var onMobile = prefersMobileHandoff();
    setPanelVisible(desktop, !onMobile);
    setPanelVisible(mobile, onMobile);
    root.setAttribute("data-wmc-install-mode", onMobile ? "mobile" : "desktop");

    if (!onMobile && canvas) {
      drawMatrixToCanvas(canvas, QR_MODULES, { margin: 4, pixelSize: 6 });
      canvas.setAttribute(
        "aria-label",
        "QR code linking to " + HANDOFF_URL + " on your phone",
      );
    }

    if (urlOut) {
      urlOut.textContent = HANDOFF_URL;
      if (urlOut.tagName === "A") {
        urlOut.setAttribute("href", HANDOFF_URL);
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
    handoffUrl: HANDOFF_URL,
    drawMatrixToCanvas: drawMatrixToCanvas,
    prefersMobileHandoff: prefersMobileHandoff,
  };
})();
