import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getExecutiveDashboardQaAudit,
  getExecutiveFunctionalScore,
  getExecutiveReadinessScore,
  getExecutiveVisualScore,
} from "./executive-dashboard-qa-audit";

describe("executive dashboard QA audit (QA9)", () => {
  it("exposes Visual, Functional, and Executive-readiness scores", () => {
    const audit = getExecutiveDashboardQaAudit();
    assert.equal(audit.promptId, "QA9");
    assert.equal(getExecutiveVisualScore(), audit.visualScore);
    assert.equal(getExecutiveFunctionalScore(), audit.functionalScore);
    assert.equal(getExecutiveReadinessScore(), audit.executiveReadinessScore);

    assert.ok(audit.visualScore >= 88);
    assert.ok(audit.functionalScore >= 90);
    assert.ok(audit.executiveReadinessScore >= 88);
    assert.ok(audit.recommendations.some((item) => item.priority === "now"));
    assert.ok(audit.priorityFixes.some((issue) => issue.id === "EX-F1"));
    assert.equal(audit.recommendation, "EXECUTIVE_DASHBOARD_OPERATIONAL_POLISH");
    assert.match(audit.reportPath, /EXECUTIVE_DASHBOARD_QA_AUDIT_QA9/);
  });

  it("scores explanations and trends above charts and mobile chrome", () => {
    const audit = getExecutiveDashboardQaAudit();
    assert.ok(audit.dimensionScores.explanations >= 94);
    assert.ok(audit.dimensionScores.trendIndicators >= 94);
    assert.ok(audit.dimensionScores.demoMode >= 94);
    assert.ok(audit.dimensionScores.charts < audit.dimensionScores.explanations);
    assert.ok(audit.dimensionScores.responsiveness < audit.dimensionScores.kpiCards);
  });

  it("covers KPI tiles, charts, exports, and data modes", () => {
    const audit = getExecutiveDashboardQaAudit();
    assert.match(audit.coverage.charts, /4 line/);
    assert.match(audit.coverage.exportActions, /CSV/);
    assert.match(audit.coverage.dataModes, /Demo/);
    assert.match(audit.coverage.sections, /Digital Reception/);
  });
});
