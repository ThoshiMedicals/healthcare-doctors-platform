import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AUTHORITY_TONE,
  COLOUR_ACCESSIBILITY_AUDIT,
  DASHBOARD_TONE,
  SEMANTIC_TONE,
  assertPalettesSeparated,
  toneFamily,
} from "./tokens";

describe("dashboard colour accessibility (B4)", () => {
  it("separates authority tiers from success / warning / failure", () => {
    const check = assertPalettesSeparated();
    assert.equal(check.ok, true, check.issues.join("; "));
    assert.notEqual(AUTHORITY_TONE.hub.bar, SEMANTIC_TONE.good.bar);
    assert.notEqual(AUTHORITY_TONE.developing.bar, SEMANTIC_TONE.info.bar);
    assert.notEqual(AUTHORITY_TONE.thin.bar, SEMANTIC_TONE.neutral.bar);
    assert.equal(toneFamily("hub"), "authority");
    assert.equal(toneFamily("good"), "semantic");
    assert.equal(toneFamily("warn"), "semantic");
    assert.equal(toneFamily("bad"), "semantic");
  });

  it("meets WCAG AA badge contrast for every tone", () => {
    for (const [key, style] of Object.entries(DASHBOARD_TONE)) {
      assert.ok(
        style.badgeContrast >= COLOUR_ACCESSIBILITY_AUDIT.minContrast,
        `${key} contrast ${style.badgeContrast} < ${COLOUR_ACCESSIBILITY_AUDIT.minContrast}`,
      );
    }
    assert.ok(COLOUR_ACCESSIBILITY_AUDIT.score >= 90);
    assert.equal(COLOUR_ACCESSIBILITY_AUDIT.familiesSeparated, true);
  });

  it("keeps authority hues out of the semantic hue set", () => {
    for (const hue of COLOUR_ACCESSIBILITY_AUDIT.authorityHues) {
      assert.equal(
        (COLOUR_ACCESSIBILITY_AUDIT.semanticHues as readonly string[]).includes(hue),
        false,
        `authority hue ${hue} collides with semantic set`,
      );
    }
  });
});
