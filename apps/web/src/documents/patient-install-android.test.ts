import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import {
  ANDROID_INSTALL_SCRIPT_HREF,
  ANDROID_INSTALL_SCRIPT_VERSION,
  PATIENT_INSTALL_DISMISS_COOLDOWN_MS,
  PATIENT_INSTALL_DISMISSED_AT_KEY,
  PATIENT_INSTALL_INSTALLED_KEY,
  PHASE3A_ANDROID_INSTALL_BENEFITS,
  classifyAndroidInstallUserAgent,
  injectPatientInstallAndroid,
  isAndroidInstallSupportedBrowser,
  isPatientInstallDismissCooldownActive,
  parsePatientInstallDismissedAt,
  shouldInjectPatientInstallAndroid,
} from "./patient-install-android";

const CHROME_ANDROID =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";
const SAMSUNG_ANDROID =
  "Mozilla/5.0 (Linux; Android 13; SAMSUNG SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36";
const FIREFOX_ANDROID =
  "Mozilla/5.0 (Android 14; Mobile; rv:128.0) Gecko/128.0 Firefox/128.0";
const IPHONE_SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

function minimalPage(): string {
  return '<html data-practice-name="Woolloongabba Medical Centre"><head></head><body><main>Hub</main></body></html>';
}

test("ANDROID-INSTALL: UA classify Chrome and Samsung Android", () => {
  const chrome = classifyAndroidInstallUserAgent(CHROME_ANDROID);
  assert.equal(chrome.browser, "chrome");
  assert.equal(chrome.supportedAndroidBrowser, true);

  const samsung = classifyAndroidInstallUserAgent(SAMSUNG_ANDROID);
  assert.equal(samsung.browser, "samsung");
  assert.equal(samsung.supportedAndroidBrowser, true);

  assert.equal(isAndroidInstallSupportedBrowser(CHROME_ANDROID), true);
  assert.equal(isAndroidInstallSupportedBrowser(SAMSUNG_ANDROID), true);
});

test("ANDROID-INSTALL: UA excludes Firefox Android and iOS", () => {
  const fx = classifyAndroidInstallUserAgent(FIREFOX_ANDROID);
  assert.equal(fx.isAndroid, true);
  assert.equal(fx.supportedAndroidBrowser, false);

  const ios = classifyAndroidInstallUserAgent(IPHONE_SAFARI);
  assert.equal(ios.isAndroid, false);
  assert.equal(isAndroidInstallSupportedBrowser(IPHONE_SAFARI), false);
});

test("ANDROID-INSTALL: storage key contracts", () => {
  assert.equal(PATIENT_INSTALL_DISMISSED_AT_KEY, "wmc.patientInstall.v1.dismissedAt");
  assert.equal(PATIENT_INSTALL_INSTALLED_KEY, "wmc.patientInstall.v1.installed");
});

test("ANDROID-INSTALL: dismiss cooldown parsing", () => {
  const t0 = 1_700_000_000_000;
  assert.equal(parsePatientInstallDismissedAt("not-a-number"), null);
  assert.equal(parsePatientInstallDismissedAt(String(t0)), t0);
  assert.equal(isPatientInstallDismissCooldownActive(t0, t0 + 1000), true);
  assert.equal(
    isPatientInstallDismissCooldownActive(t0, t0 + PATIENT_INSTALL_DISMISS_COOLDOWN_MS + 1),
    false,
  );
});

test("ANDROID-INSTALL: inject only on patient-hub and install landing paths", () => {
  const html = minimalPage();
  assert.equal(shouldInjectPatientInstallAndroid("patient-hub.html"), true);
  assert.equal(shouldInjectPatientInstallAndroid("install-wmc-app.html"), true);
  assert.equal(shouldInjectPatientInstallAndroid("services.html"), false);

  const hub = injectPatientInstallAndroid(html, "patient-hub.html");
  assert.match(hub, /id="wmc-android-install"/);
  assert.match(hub, new RegExp(`src="${ANDROID_INSTALL_SCRIPT_HREF.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
  assert.match(hub, /Install WMC App/);
  for (const benefit of PHASE3A_ANDROID_INSTALL_BENEFITS) {
    assert.match(hub, new RegExp(benefit.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.doesNotMatch(injectPatientInstallAndroid(html, "contact.html"), /wmc-android-install:start/);
});

test("ANDROID-INSTALL: idempotent re-injection", () => {
  const once = injectPatientInstallAndroid(minimalPage(), "patient-hub.html");
  const twice = injectPatientInstallAndroid(once, "patient-hub.html");
  assert.equal(once, twice);
  assert.equal((twice.match(/wmc-android-install:start/g) || []).length, 1);
});

test("ANDROID-INSTALL: public script mirrors storage keys and UA gates", () => {
  const js = readFileSync(
    path.resolve(process.cwd(), "public/patient-install-android.js"),
    "utf8",
  );
  assert.match(js, /wmc\.patientInstall\.v1\.dismissedAt/);
  assert.match(js, /wmc\.patientInstall\.v1\.installed/);
  assert.match(js, /beforeinstallprompt/);
  assert.match(js, /SamsungBrowser/);
  assert.match(js, /data-practice-name/);
  assert.match(js, /display-mode: standalone/);
  assert.doesNotMatch(js, /sessionStorage/);
});

test("ANDROID-INSTALL: script version token is stable in SSR href", () => {
  assert.match(ANDROID_INSTALL_SCRIPT_HREF, new RegExp(ANDROID_INSTALL_SCRIPT_VERSION));
});
