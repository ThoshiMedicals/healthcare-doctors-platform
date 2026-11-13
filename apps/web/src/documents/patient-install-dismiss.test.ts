import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  PATIENT_INSTALL_COOLDOWN_MS,
  isInstallDismissCooldownActive,
  parseInstallDismissedAt,
  serializeInstallDismissedAt,
} from "./patient-install-dismiss";

test("parseInstallDismissedAt: ISO and epoch (backward compatible)", () => {
  const iso = "2026-11-01T12:00:00.000Z";
  assert.equal(parseInstallDismissedAt(iso), Date.parse(iso));
  assert.equal(parseInstallDismissedAt("1730462400000"), 1730462400000);
  assert.equal(parseInstallDismissedAt(""), null);
  assert.equal(parseInstallDismissedAt("not-a-date"), null);
});

test("serializeInstallDismissedAt: ISO round-trip", () => {
  const now = 1_700_000_000_000;
  const raw = serializeInstallDismissedAt(now);
  assert.equal(parseInstallDismissedAt(raw), now);
});

test("isInstallDismissCooldownActive: 14-day window", () => {
  const dismissed = 1_000_000;
  assert.equal(
    isInstallDismissCooldownActive(dismissed, dismissed + PATIENT_INSTALL_COOLDOWN_MS - 1),
    true,
  );
  assert.equal(
    isInstallDismissCooldownActive(dismissed, dismissed + PATIENT_INSTALL_COOLDOWN_MS),
    false,
  );
  assert.equal(isInstallDismissCooldownActive(null, Date.now()), false);
});

test("public runtimes: tip/android/ios all accept ISO and epoch", () => {
  const publicDir = path.join(process.cwd(), "public");
  for (const file of ["patient-install-prompt.js", "patient-install-android.js", "patient-install-ios.js"]) {
    const src = readFileSync(path.join(publicDir, file), "utf8");
    assert.match(src, /Date\.parse/, `${file} should parse ISO`);
    assert.match(src, /\/\^\\d\+\$\//, `${file} should detect epoch`);
    assert.match(src, /14\s*\*\s*24\s*\*\s*60\s*\*\s*60\s*\*\s*1000/);
  }
});
