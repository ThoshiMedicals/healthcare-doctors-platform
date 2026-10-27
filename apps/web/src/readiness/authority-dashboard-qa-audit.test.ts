import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getAuthorityDashboardQaAudit,
  getAuthorityDashboardScore,
  getAuthorityManagementUsabilityScore,
} from "./authority-dashboard-qa-audit";

describe("authority dashboard QA audit (QA11)", () => {
  it("exposes Authority Dashboard and Management Usability scores", () => {
    const audit = getAuthorityDashboardQaAudit();
    assert.equal(audit.promptId, "QA11");
    assert.equal(getAuthorityDashboardScore(), audit.authorityDashboardScore);
    assert.equal(getAuthorityManagementUsabilityScore(), audit.managementUsabilityScore);

    assert.ok(audit.authorityDashboardScore >= 88);
    assert.ok(audit.managementUsabilityScore >= 88);
    assert.ok(audit.issues.some((issue) => issue.id === "AU-C1" && issue.patchedInPass));
    assert.ok(audit.priorityFixes.some((issue) => issue.id === "AU-G1"));
    assert.ok(!audit.priorityFixes.some((issue) => issue.id === "AU-C1"));
    assert.equal(audit.recommendation, "AUTHORITY_DASHBOARD_OPERATIONAL_POLISH");
    assert.match(audit.reportPath, /AUTHORITY_DASHBOARD_QA_AUDIT_QA11/);
  });

  it("scores explanations and badges above recommendations and consistency", () => {
    const audit = getAuthorityDashboardQaAudit();
    assert.ok(audit.dimensionScores.explanations >= 94);
    assert.ok(audit.dimensionScores.badges >= 92);
    assert.ok(audit.dimensionScores.tierLabels >= 90);
    assert.ok(audit.dimensionScores.recommendations < audit.dimensionScores.badges);
    assert.ok(audit.dimensionScores.visualConsistency < audit.dimensionScores.explanations);
  });

  it("covers both authority surfaces and tier filter recovery", () => {
    const audit = getAuthorityDashboardQaAudit();
    assert.match(audit.coverage.practitionerTiers, /Well connected/);
    assert.match(audit.coverage.serviceTiers, /Needs more links/);
    assert.match(audit.coverage.tierFilter, /verified after import patch/);
    assert.match(audit.coverage.dataModes, /Demo/);
  });
});
