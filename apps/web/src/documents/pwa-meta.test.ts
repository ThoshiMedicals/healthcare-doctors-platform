import assert from "node:assert/strict";
import test from "node:test";
import {
  applyPwaHeadTags,
  applyPwaInstallTip,
  applyPwaMeta,
  applyPwaSafeAreaStyle,
  applyPwaServiceWorkerRegister,
  ensureViewportFitCover,
  PWA_HEAD_TAGS,
} from "./pwa-meta";

const basePage = (extraHead = "") =>
  [
    "<!DOCTYPE html><html><head>",
    '<meta charset="utf-8"/>',
    '<meta content="width=device-width,initial-scale=1" name="viewport"/>',
    "<title>Woolloongabba Medical Centre</title>",
    '<link href="styles.css" rel="stylesheet"/>',
    extraHead,
    "</head><body>",
    "<header>Header</header>",
    "<main>Patient information</main>",
    "</body></html>",
  ].join("\n");

test("applyPwaHeadTags: adds manifest link + theme-color + apple meta once", () => {
  const output = applyPwaHeadTags(basePage());
  assert.ok(output.includes(PWA_HEAD_TAGS));
  assert.equal((output.match(/rel="manifest"/g) || []).length, 1);
  assert.equal((output.match(/name="theme-color"/g) || []).length, 1);
  assert.equal((output.match(/name="apple-mobile-web-app-capable"/g) || []).length, 1);
  assert.equal((output.match(/name="apple-mobile-web-app-title"/g) || []).length, 1);
  // Not purple, matches existing brand navy/blue.
  assert.ok(output.includes('content="#163f62"'));
  assert.ok(!/purple|#[8-9a-fA-F][0-9a-fA-F][0-5][0-9a-fA-F]e[0-9a-fA-F]e/.test(output.toLowerCase()));
  // Preserved content.
  assert.ok(output.includes("<title>Woolloongabba Medical Centre</title>"));
  assert.ok(output.includes('<link href="styles.css" rel="stylesheet"/>'));
  assert.ok(output.includes("<main>Patient information</main>"));
});

test("applyPwaHeadTags: viewport gets viewport-fit=cover without disturbing other directives", () => {
  const output = applyPwaHeadTags(basePage());
  assert.ok(output.includes('content="width=device-width,initial-scale=1,viewport-fit=cover" name="viewport"'));
});

test("ensureViewportFitCover: no-ops when already present", () => {
  const html = '<head><meta content="width=device-width,viewport-fit=cover" name="viewport"/></head>';
  assert.equal(ensureViewportFitCover(html), html);
});

test("ensureViewportFitCover: no-ops when there is no viewport meta", () => {
  const html = "<head><title>No viewport</title></head>";
  assert.equal(ensureViewportFitCover(html), html);
});

test("applyPwaHeadTags: idempotent across repeated application", () => {
  const once = applyPwaHeadTags(basePage());
  const twice = applyPwaHeadTags(once);
  assert.equal(once, twice);
  assert.equal((twice.match(/rel="manifest"/g) || []).length, 1);
  assert.equal((twice.match(/viewport-fit=cover/g) || []).length, 1);
});

test("applyPwaHeadTags: no-ops when there is no <head>", () => {
  assert.equal(applyPwaHeadTags("<p>Sample</p>"), "<p>Sample</p>");
});

test("applyPwaSafeAreaStyle: inserts standalone-only CSS once, no effect outside display-mode:standalone", () => {
  const output = applyPwaSafeAreaStyle(basePage());
  assert.ok(output.includes('id="wmc-pwa-safe-area"'));
  assert.ok(output.includes("@media (display-mode: standalone)"));
  assert.ok(output.includes("env(safe-area-inset-top,0px)"));
  const twice = applyPwaSafeAreaStyle(output);
  assert.equal(output, twice);
  assert.equal((twice.match(/id="wmc-pwa-safe-area"/g) || []).length, 1);
});

test("applyPwaInstallTip: inserts dismissible tip once with sessionStorage-only dismiss, before </body>", () => {
  const output = applyPwaInstallTip(basePage());
  assert.ok(output.includes('id="wmc-pwa-install-tip"'));
  assert.ok(output.includes("sessionStorage"));
  assert.ok(!/localStorage|document\.cookie/.test(output));
  assert.ok(output.indexOf('id="wmc-pwa-install-tip"') < output.indexOf("</body>"));
  const twice = applyPwaInstallTip(output);
  assert.equal(output, twice);
  assert.equal((twice.match(/id="wmc-pwa-install-tip"/g) || []).length, 1);
});

test("applyPwaInstallTip: respects reduced motion (transition only added for no-preference)", () => {
  const output = applyPwaInstallTip(basePage());
  assert.ok(output.includes("prefers-reduced-motion:no-preference"));
});

test("applyPwaServiceWorkerRegister: registers /sw.js once before </body>", () => {
  const output = applyPwaServiceWorkerRegister(basePage());
  assert.ok(output.includes('serviceWorker.register("/sw.js"'));
  assert.ok(output.includes("wmc-pwa-sw-register"));
  assert.ok(output.indexOf("wmc-pwa-sw-register") < output.indexOf("</body>"));
  const twice = applyPwaServiceWorkerRegister(output);
  assert.equal(output, twice);
  assert.equal((twice.match(/serviceWorker\.register/g) || []).length, 1);
});

test("applyPwaMeta: composes head, safe-area, SW register, install tip and stays idempotent", () => {
  const once = applyPwaMeta(basePage());
  assert.ok(once.includes('rel="manifest"'));
  assert.ok(once.includes('id="wmc-pwa-safe-area"'));
  assert.ok(once.includes('serviceWorker.register("/sw.js"'));
  assert.ok(once.includes('id="wmc-pwa-install-tip"'));
  assert.ok(once.includes("<header>Header</header>"));
  assert.ok(once.includes("<main>Patient information</main>"));
  const twice = applyPwaMeta(once);
  assert.equal(once, twice);
});

test("applyPwaMeta: unrelated markup without head/body is unchanged", () => {
  assert.equal(applyPwaMeta("<p>Sample</p>"), "<p>Sample</p>");
});
