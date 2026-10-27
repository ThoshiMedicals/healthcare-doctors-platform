import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getResolutionScore,
  getSearchReceptionQaAudit,
  getSearchScore,
} from "./search-reception-qa-audit";

describe("search + Digital Reception QA audit (QA5)", () => {
  it("exposes Search and Resolution scores with UX findings", () => {
    const audit = getSearchReceptionQaAudit();
    assert.equal(audit.promptId, "QA5");
    assert.equal(getSearchScore(), audit.searchScore);
    assert.equal(getResolutionScore(), audit.resolutionScore);

    assert.ok(audit.searchScore >= 80);
    assert.ok(audit.resolutionScore >= 85);
    assert.ok(audit.resolutionScore >= audit.searchScore - 5);
    assert.ok(audit.uxFindings.length >= 6);
    assert.ok(audit.liveChecks.some((check) => check.resultType === "no_result"));
    assert.ok(audit.liveChecks.some((check) => check.resultType === "care_journey"));
    assert.ok(audit.liveChecks.some((check) => check.resultType === "emergency"));

    assert.ok(audit.priorityFixes.every((issue) => issue.severity === "P0" || issue.severity === "P1"));
    assert.ok(audit.priorityFixes.some((issue) => issue.id === "R-V1"));
    assert.equal(audit.recommendation, "STRONG_RESOLUTION_VISIBILITY_POLISH");
    assert.match(audit.reportPath, /SEARCH_RECEPTION_QA_AUDIT_QA5/);
  });

  it("scores analytics and zero-result above search visibility", () => {
    const audit = getSearchReceptionQaAudit();
    assert.ok(audit.dimensionScores.analyticsTracking >= 90);
    assert.ok(audit.dimensionScores.zeroResultBehaviour >= 88);
    assert.ok(audit.dimensionScores.accessibility >= 88);
    assert.ok(audit.dimensionScores.searchVisibility < 80);
  });
});
