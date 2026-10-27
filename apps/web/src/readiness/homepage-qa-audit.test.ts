import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getHomepageQaAudit,
  getHomepageScore,
  listHomepagePriorityFixes,
} from "./homepage-qa-audit";

describe("homepage QA audit (QA1)", () => {
  it("exposes Homepage Score with functional, visual, and design-system findings", () => {
    const audit = getHomepageQaAudit();
    assert.equal(audit.promptId, "QA1");
    assert.equal(getHomepageScore(), audit.homepageScore);
    assert.ok(audit.homepageScore >= 80 && audit.homepageScore <= 95);
    assert.equal(audit.sectionScores.length, 8);
    assert.ok(audit.functionalIssues.length >= 3);
    assert.ok(audit.visualIssues.length >= 3);
    assert.ok(audit.designSystemDeviations.length >= 3);

    const fixes = listHomepagePriorityFixes();
    assert.ok(fixes.length >= 3);
    assert.ok(fixes.every((issue) => issue.severity === "P0" || issue.severity === "P1"));
    assert.ok(fixes.some((issue) => issue.id === "F1" || issue.id === "F2"));

    assert.ok(
      audit.recommendation === "MATCHES_WITH_POLISH" ||
        audit.recommendation === "MATCHES_ARCHITECTURE",
    );
    assert.match(audit.reportPath, /HOMEPAGE_QA_AUDIT_QA1/);
    assert.ok(audit.scope.includes("digital-reception-cta"));
    assert.ok(audit.checkScores.accessibility >= 75);
    assert.ok(audit.checkScores.conversionHierarchy >= 85);
  });

  it("scores booking and trust above practitioner pathway polish gaps", () => {
    const audit = getHomepageQaAudit();
    const byId = Object.fromEntries(audit.sectionScores.map((row) => [row.id, row]));
    assert.ok(byId["booking-cta"]!.score >= byId["practitioner-pathways"]!.score);
    assert.ok(byId["trust-row"]!.score >= 88);
    assert.ok(byId["digital-reception-cta"]!.score >= 85);
  });
});
