import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  DEFAULT_INSTALL_PROMPT_COOLDOWN_MS,
  INSTALL_TIP_COPY,
  INSTALL_TIP_ID,
  LEGACY_SESSION_DISMISS_KEY,
  PATIENT_INSTALL_STORAGE,
  applyPatientInstallTip,
  buildPatientInstallTipBlock,
  isStandaloneDisplay,
  isWithinInstallPromptCooldown,
  parseDismissedAt,
  shouldShowInstallPrompt,
} from "./patient-install-prompt";

const basePage = () =>
  "<!DOCTYPE html><html><head><title>Test</title></head><body><main>Hub</main></body></html>";

test("parseDismissedAt: accepts ISO and epoch strings", () => {
  const iso = "2026-11-01T12:00:00.000Z";
  assert.equal(parseDismissedAt(iso), Date.parse(iso));
  assert.equal(parseDismissedAt("1730462400000"), 1730462400000);
  assert.equal(parseDismissedAt(""), null);
  assert.equal(parseDismissedAt("not-a-date"), null);
});

test("shouldShowInstallPrompt: hides when standalone or installed", () => {
  const base = {
    now: 1_700_000_000_000,
    dismissedAt: null,
    cooldownMs: DEFAULT_INSTALL_PROMPT_COOLDOWN_MS,
  };
  assert.equal(shouldShowInstallPrompt({ ...base, installed: false, standalone: true }), false);
  assert.equal(shouldShowInstallPrompt({ ...base, installed: true, standalone: false }), false);
  assert.equal(shouldShowInstallPrompt({ ...base, installed: false, standalone: false }), true);
});

test("shouldShowInstallPrompt: honours dismissal cooldown", () => {
  const now = 1_700_000_000_000;
  const dismissedAt = now - 3 * 24 * 60 * 60 * 1000;
  assert.equal(
    shouldShowInstallPrompt({
      now,
      dismissedAt,
      installed: false,
      standalone: false,
      cooldownMs: DEFAULT_INSTALL_PROMPT_COOLDOWN_MS,
    }),
    false,
  );
  const expired = now - DEFAULT_INSTALL_PROMPT_COOLDOWN_MS - 1;
  assert.equal(
    shouldShowInstallPrompt({
      now,
      dismissedAt: expired,
      installed: false,
      standalone: false,
      cooldownMs: DEFAULT_INSTALL_PROMPT_COOLDOWN_MS,
    }),
    true,
  );
});

test("isWithinInstallPromptCooldown: boundary at cooldownMs", () => {
  const dismissed = 1000;
  assert.equal(isWithinInstallPromptCooldown(dismissed, 1000 + 14 * 86400000 - 1, 14 * 86400000), true);
  assert.equal(isWithinInstallPromptCooldown(dismissed, 1000 + 14 * 86400000, 14 * 86400000), false);
});

test("isStandaloneDisplay: display-mode or legacy iOS flag", () => {
  assert.equal(isStandaloneDisplay({}), false);
  assert.equal(isStandaloneDisplay({ displayModeStandalone: true }), true);
  assert.equal(isStandaloneDisplay({ navigatorStandalone: true }), true);
});

test("applyPatientInstallTip: external script + Phase 3A copy", () => {
  const output = applyPatientInstallTip(basePage());
  assert.ok(output.includes(`id="${INSTALL_TIP_ID}"`));
  assert.ok(output.includes("/patient-install-prompt.js?v="));
  assert.ok(output.includes(INSTALL_TIP_COPY.default));
  assert.ok(!output.includes("sessionStorage.getItem"));
  const twice = applyPatientInstallTip(output);
  assert.equal(output, twice);
});

test("public patient-install-prompt.js: canonical storage keys and legacy migrate", () => {
  const jsPath = path.join(process.cwd(), "public", "patient-install-prompt.js");
  const src = readFileSync(jsPath, "utf8");
  assert.ok(src.includes(PATIENT_INSTALL_STORAGE.dismissedAt));
  assert.ok(src.includes(PATIENT_INSTALL_STORAGE.installed));
  assert.ok(src.includes(LEGACY_SESSION_DISMISS_KEY));
  assert.ok(/14\s*\*\s*24\s*\*\s*60\s*\*\s*60\s*\*\s*1000/.test(src));
});

test("buildPatientInstallTipBlock: role=note (not alert/dialog)", () => {
  const block = buildPatientInstallTipBlock();
  assert.ok(block.includes('role="note"'));
  assert.ok(block.includes('aria-live="polite"'));
  assert.ok(!block.includes('role="alertdialog"'));
});
