import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getAdminDashboardMaturityScorecard,
  getAdminPlatformMaturityScore,
  getManagementUsabilityScore,
  getOperationalIntelligenceScore,
  getOperationsConsoleMaturityScore,
} from "./admin-dashboard-maturity";

describe("operations console maturity audit (C8)", () => {
  it("exposes final headline scores and maintain-and-polish recommendation", () => {
    const card = getAdminDashboardMaturityScorecard();
    assert.equal(card.promptId, "C8");
    assert.equal(getAdminPlatformMaturityScore(), card.scores.adminPlatformMaturity);
    assert.equal(getOperationsConsoleMaturityScore(), card.scores.operationsConsoleMaturity);
    assert.equal(getManagementUsabilityScore(), card.scores.managementUsability);
    assert.equal(getOperationalIntelligenceScore(), card.scores.operationalIntelligence);

    assert.ok(card.scores.operationsConsoleMaturity >= 90);
    assert.ok(card.scores.managementUsability >= 90);
    assert.ok(card.scores.operationalIntelligence >= 90);
    assert.ok(card.scores.adminPlatformMaturity >= 90);
    assert.ok(card.scores.adminUx >= 90);
    assert.ok(card.scores.accessibility >= 90);
    assert.ok(card.scores.mobileUsability >= 85);

    assert.equal(card.recommendation, "OPERATIONS_CONSOLE_MAINTAIN_AND_POLISH");
    assert.ok(card.closedPrompts.includes("C7"));
    assert.ok(card.closedPrompts.includes("C8"));
    assert.ok(card.closedPrompts.includes("C9"));
    assert.ok(card.closedPrompts.includes("C10"));
    assert.ok(card.closedPrompts.includes("D1"));
    assert.ok(card.closedPrompts.includes("D2"));
    assert.ok(card.closedPrompts.includes("D3"));
    assert.ok(card.closedPrompts.includes("D4"));
    assert.ok(card.closedPrompts.includes("D5"));
    assert.ok(card.closedPrompts.includes("D6"));
    assert.ok(card.closedPrompts.includes("D7"));
    assert.ok(card.closedPrompts.includes("D8"));
    assert.equal(card.roadmapPhases.length, 3);

    const dims = card.dimensionScores;
    assert.equal(Object.keys(dims).length, 8);
    for (const score of Object.values(dims)) {
      assert.ok(score >= 85 && score <= 100);
    }
    const expectedOps = Math.round(
      Object.values(dims).reduce((sum, score) => sum + score, 0) / Object.keys(dims).length,
    );
    assert.equal(card.scores.operationsConsoleMaturity, expectedOps);

    assert.ok(card.scope.some((item) => item.includes("command-centre")));
    assert.ok(card.scope.some((item) => item.includes("platform-health-score")));
    assert.ok(card.scope.some((item) => item.includes("operations-console-audit")));
    assert.ok(card.scope.some((item) => item.includes("insights-demo-mode")));
    assert.ok(card.scope.some((item) => item.includes("how-to-read-dashboards")));
    assert.ok(card.scope.some((item) => item.includes("actionable-kpi-navigation")));
    assert.ok(card.scope.some((item) => item.includes("authority-tier-investigation")));
    assert.ok(card.scope.some((item) => item.includes("platform-health-investigation")));
    assert.ok(card.scope.some((item) => item.includes("chart-navigation")));
    assert.ok(card.scope.some((item) => item.includes("governance-remediation")));
    assert.ok(card.scope.some((item) => item.includes("investigation-banner")));
    assert.ok(card.scope.some((item) => item.includes("recommended-action-deep-links")));
    assert.ok(card.scope.some((item) => item.includes("insights-actionability-audit")));
    assert.match(card.reportPath, /ADMIN_OPERATIONS_CONSOLE_MATURITY_AUDIT_C8/);
  });
});
