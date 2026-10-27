import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getCommandCentreQaAudit,
  getCommandCentreScore,
  getManagementUsabilityScore,
} from "./command-centre-qa-audit";

describe("command centre QA audit (QA8)", () => {
  it("exposes Command Centre and Management Usability scores with recommendations", () => {
    const audit = getCommandCentreQaAudit();
    assert.equal(audit.promptId, "QA8");
    assert.equal(getCommandCentreScore(), audit.commandCentreScore);
    assert.equal(getManagementUsabilityScore(), audit.managementUsabilityScore);

    assert.ok(audit.commandCentreScore >= 90);
    assert.ok(audit.managementUsabilityScore >= 90);
    assert.ok(audit.recommendations.some((item) => item.priority === "now"));
    assert.ok(audit.priorityFixes.every((issue) => issue.severity === "P0" || issue.severity === "P1"));
    assert.ok(audit.priorityFixes.some((issue) => issue.id === "CC-H1"));

    assert.equal(audit.recommendation, "COMMAND_CENTRE_OPERATIONAL_POLISH");
    assert.match(audit.reportPath, /COMMAND_CENTRE_QA_AUDIT_QA8/);
  });

  it("scores deep links and recommendations above mobile chrome", () => {
    const audit = getCommandCentreQaAudit();
    assert.ok(audit.dimensionScores.deepLinks >= 95);
    assert.ok(audit.dimensionScores.recommendations >= 95);
    assert.ok(audit.dimensionScores.roleViews >= 94);
    assert.ok(audit.dimensionScores.mobileUx < audit.dimensionScores.deepLinks);
    assert.ok(audit.dimensionScores.healthScore < audit.dimensionScores.recommendations);
  });

  it("covers personas, data modes, and alert panels", () => {
    const audit = getCommandCentreQaAudit();
    assert.match(audit.coverage.personas, /4\/4/);
    assert.match(audit.coverage.dataModes, /Demo/);
    assert.match(audit.coverage.dataModes, /Empty/);
    assert.match(audit.coverage.recommendationDeepLinks, /Investigation/);
  });
});
