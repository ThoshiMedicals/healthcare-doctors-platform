import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getPlatformReadinessScorecard, isClearToShip } from "./platform-readiness";

describe("platform readiness audit (L7)", () => {
  it("exposes production readiness score >= 85 with 0 Critical/High and clear-to-ship", () => {
    const card = getPlatformReadinessScorecard();
    assert.equal(card.promptId, "L7");
    assert.ok(card.productionReadinessScore >= 85);
    assert.equal(card.issueCounts.critical, 0);
    assert.equal(card.issueCounts.high, 0);
    assert.equal(card.domains.length, 10);
    assert.equal(card.goLiveRecommendation, "CLEAR_TO_SHIP");
    assert.equal(isClearToShip(card), true);
    assert.ok(card.gatesBeforeGoLive.some((g) => /CLOSED/i.test(g)));
  });
});
