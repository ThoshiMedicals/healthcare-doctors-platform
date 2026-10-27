import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getInsightsActionabilityAudit,
  getInsightsActionabilityScore,
  getManagementEfficiencyScore,
  listRemainingNonActionableElements,
} from "./insights-actionability-audit";

describe("insights actionability audit (D8)", () => {
  it("exposes Actionability + Management Efficiency headlines and remaining gaps", () => {
    const audit = getInsightsActionabilityAudit();
    assert.equal(audit.promptId, "D8");
    assert.equal(getInsightsActionabilityScore(), audit.actionabilityScore);
    assert.equal(getManagementEfficiencyScore(), audit.managementEfficiencyScore);

    assert.ok(audit.actionabilityScore >= 88);
    assert.ok(audit.managementEfficiencyScore >= 88);
    assert.ok(
      audit.recommendation === "ACTIONABLE_WITH_POLISH" ||
        audit.recommendation === "ACTIONABLE_OPERATIONS_READY",
    );

    assert.equal(audit.dashboards.length, 10);
    for (const dashboard of audit.dashboards) {
      assert.ok(dashboard.overall >= 60 && dashboard.overall <= 100);
      for (const score of Object.values(dashboard.measures)) {
        assert.ok(score >= 60 && score <= 100);
      }
    }

    const expectedOverall = Math.round(
      audit.dashboards.reduce((sum, row) => sum + row.overall, 0) / audit.dashboards.length,
    );
    assert.equal(audit.actionabilityScore, expectedOverall);

    const m = audit.measureAverages;
    const expectedEfficiency = Math.round(
      (m.investigationContinuity + m.timeToRemediation + m.workflowCompleteness) / 3,
    );
    assert.equal(audit.managementEfficiencyScore, expectedEfficiency);

    const remaining = listRemainingNonActionableElements();
    assert.ok(remaining.length >= 5);
    assert.ok(remaining.some((item) => item.dashboard === "executive-monthly"));
    assert.ok(remaining.some((item) => item.severity === "high"));

    assert.ok(audit.closedPrompts.includes("D7"));
    assert.ok(audit.closedPrompts.includes("D8"));
    assert.ok(audit.scope.includes("investigation-banner"));
    assert.ok(audit.scope.includes("recommended-action-deep-links"));
    assert.match(audit.reportPath, /INSIGHTS_ACTIONABILITY_AUDIT_D8/);
  });

  it("scores core remediation surfaces above the monthly report", () => {
    const audit = getInsightsActionabilityAudit();
    const byId = Object.fromEntries(audit.dashboards.map((row) => [row.id, row]));
    assert.ok(byId["command-centre"]!.overall >= 95);
    assert.ok(byId["governance-review"]!.overall >= 95);
    assert.ok(byId["service-authority"]!.overall >= 95);
    assert.ok(byId["executive-monthly"]!.overall < byId["executive"]!.overall);
  });
});
