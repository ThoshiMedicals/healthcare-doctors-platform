import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getDigitalReceptionActionabilityScore,
  getDigitalReceptionQaAudit,
  getDigitalReceptionUsabilityScore,
  getSearchIntelligenceScore,
} from "./digital-reception-qa-audit";

describe("digital reception QA audit (QA10)", () => {
  it("exposes Search intelligence, Usability, and Actionability scores", () => {
    const audit = getDigitalReceptionQaAudit();
    assert.equal(audit.promptId, "QA10");
    assert.equal(getSearchIntelligenceScore(), audit.searchIntelligenceScore);
    assert.equal(getDigitalReceptionUsabilityScore(), audit.usabilityScore);
    assert.equal(getDigitalReceptionActionabilityScore(), audit.actionabilityScore);

    assert.ok(audit.searchIntelligenceScore >= 90);
    assert.ok(audit.usabilityScore >= 88);
    assert.ok(audit.actionabilityScore >= 85);
    assert.ok(audit.actionabilityScore < audit.searchIntelligenceScore);
    assert.ok(audit.priorityFixes.some((issue) => issue.id === "DR-F1"));
    assert.equal(audit.recommendation, "DIGITAL_RECEPTION_OPERATIONAL_POLISH");
    assert.match(audit.reportPath, /DIGITAL_RECEPTION_QA_AUDIT_QA10/);
  });

  it("scores help and intent charts above recommendations and filters", () => {
    const audit = getDigitalReceptionQaAudit();
    assert.ok(audit.dimensionScores.helpContent >= 94);
    assert.ok(audit.dimensionScores.intentCharts >= 94);
    assert.ok(audit.dimensionScores.drillThrough >= 92);
    assert.ok(audit.dimensionScores.recommendations < 85);
    assert.ok(audit.dimensionScores.filters < audit.dimensionScores.gauges);
  });

  it("covers gauges, funnel, watchlist, and data modes", () => {
    const audit = getDigitalReceptionQaAudit();
    assert.match(audit.coverage.gauges, /Resolution/);
    assert.match(audit.coverage.funnelStages, /Booking/);
    assert.match(audit.coverage.watchlist, /Vaccine/);
    assert.match(audit.coverage.dataModes, /Demo/);
  });
});
