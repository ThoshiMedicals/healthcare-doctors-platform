import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  IOS_INSTALL_PANEL_ID,
  PATIENT_INSTALL_IOS_SCRIPT_VERSION,
  PATIENT_INSTALL_STORAGE_DISMISSED,
  PATIENT_INSTALL_STORAGE_IOS_GUIDE_DISMISSED,
  injectPatientInstallIos,
} from "./patient-install-ios";

const hubBody = `<html><head><title>Patient Hub</title></head><body><main>Hub</main></body></html>`;

test("injectPatientInstallIos: patient-hub only, idempotent panel + script", () => {
  const once = injectPatientInstallIos(hubBody, "patient-hub.html");
  const twice = injectPatientInstallIos(once, "patient-hub.html");

  assert.match(once, new RegExp(`id="${IOS_INSTALL_PANEL_ID}"`));
  assert.match(once, /Safari does not show an automatic install button/);
  assert.match(once, /Add to Home Screen/);
  assert.match(once, /Open as Web App/);
  assert.match(once, /Book appointments/);
  assert.match(once, /Preferred GP/);
  assert.match(once, /Digital Reception/);
  assert.match(once, /Call the clinic/);
  assert.match(once, /Practice information/);
  assert.match(
    once,
    new RegExp(
      `<script defer src="/patient-install-ios.js\\?v=${PATIENT_INSTALL_IOS_SCRIPT_VERSION}"><\\/script>`,
    ),
  );
  assert.doesNotMatch(once, /install prompt/i);
  assert.doesNotMatch(once, /automatically install/i);

  assert.equal((twice.match(/wmc-ios-install-guide:start/g) || []).length, 1);
});

test("injectPatientInstallIos: other pages untouched", () => {
  const result = injectPatientInstallIos(hubBody, "patient-information.html");
  assert.equal(result, hubBody);
});

test("patient-install-ios.js: iOS Safari detection, standalone guard, storage keys", () => {
  const jsPath = path.join(
    path.dirname(import.meta.dirname),
    "..",
    "public",
    "patient-install-ios.js",
  );
  const source = readFileSync(jsPath, "utf8");

  assert.match(source, new RegExp(PATIENT_INSTALL_STORAGE_DISMISSED));
  assert.match(source, new RegExp(PATIENT_INSTALL_STORAGE_IOS_GUIDE_DISMISSED));
  assert.match(source, /navigator\.standalone/);
  assert.match(source, /display-mode: standalone/);
  assert.match(source, /CriOS|FxiOS|OPiOS|EdgiOS/);
  assert.match(source, /localStorage\.setItem/);
  assert.doesNotMatch(source, /beforeinstallprompt/);
  assert.doesNotMatch(source, /\.prompt\(/);
});
