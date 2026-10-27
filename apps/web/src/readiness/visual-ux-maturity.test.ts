import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getVisualUxMaturityScorecard } from "./visual-ux-maturity";

describe("visual UX brand maturity audit (3I)", () => {
  it("exposes maturity scores and polish-not-rebuild recommendation", () => {
    const card = getVisualUxMaturityScorecard();
    assert.equal(card.promptId, "3I");
    assert.equal(card.scores.overallWebsiteMaturity, 80);
    assert.ok(card.scores.visualMaturity >= 70);
    assert.ok(card.scores.conversionMaturity >= card.scores.brandMaturity);
    assert.equal(card.recommendation, "STRONG_BASELINE_POLISH_NEXT_NOT_REBUILD");
    assert.equal(card.highPriorityCount, 4);
    assert.equal(card.quickWinCount, 6);
  });
});
