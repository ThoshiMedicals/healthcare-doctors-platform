import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getServiceQaAudit, getServiceScore } from "./service-qa-audit";

describe("service QA audit (QA3)", () => {
  it("exposes service scorecard across all 29 templates", () => {
    const audit = getServiceQaAudit();
    assert.equal(audit.promptId, "QA3");
    assert.equal(audit.templateCount, 29);
    assert.equal(getServiceScore(), audit.serviceScore);

    const familyTotal =
      audit.templateFamilies.serviceHub.length +
      audit.templateFamilies.focusedService.length +
      audit.templateFamilies.independentProvider.length;
    assert.equal(familyTotal, 29);

    assert.ok(audit.serviceScore >= 80);
    assert.ok(audit.serviceScore <= 100);
    assert.equal(
      audit.serviceScore,
      Math.round(
        Object.values(audit.dimensionScores).reduce((sum, n) => sum + n, 0) /
          Object.keys(audit.dimensionScores).length,
      ),
    );

    assert.ok(audit.templateDeviations.length >= 2);
    assert.ok(audit.visualInconsistencies.length >= 2);
    assert.ok(audit.missingConnections.length >= 2);
    assert.ok(audit.priorityFixes.every((issue) => issue.severity === "P0" || issue.severity === "P1"));
    assert.ok(audit.priorityFixes.some((issue) => issue.id === "S-M1"));

    assert.ok(
      audit.recommendation === "ALIGNED_WITH_POLISH" ||
        audit.recommendation === "SERVICE_TEMPLATES_ALIGNED",
    );
    assert.match(audit.reportPath, /SERVICE_QA_AUDIT_QA3/);
  });

  it("scores knowledge and hero above related-practitioner gaps", () => {
    const audit = getServiceQaAudit();
    assert.ok(audit.dimensionScores.knowledgePathways >= audit.dimensionScores.relatedPractitioners);
    assert.ok(audit.dimensionScores.hero >= 88);
    assert.ok(audit.dimensionScores.conversionBands >= 85);
    assert.ok(audit.dimensionScores.relatedPractitioners < 88);
  });
});
