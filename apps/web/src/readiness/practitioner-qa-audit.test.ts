import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getPractitionerConsistencyScore,
  getPractitionerFunctionalScore,
  getPractitionerQaAudit,
  getPractitionerVisualScore,
} from "./practitioner-qa-audit";

describe("practitioner QA audit (QA2)", () => {
  it("exposes consistency, visual, and functional scores for all templates", () => {
    const audit = getPractitionerQaAudit();
    assert.equal(audit.promptId, "QA2");
    assert.equal(audit.templateCount, 13);
    assert.equal(audit.templatePaths.length, 13);
    assert.equal(getPractitionerConsistencyScore(), audit.consistencyScore);
    assert.equal(getPractitionerVisualScore(), audit.visualScore);
    assert.equal(getPractitionerFunctionalScore(), audit.functionalScore);

    assert.ok(audit.consistencyScore >= 85);
    assert.ok(audit.visualScore >= 80);
    assert.ok(audit.functionalScore >= 85);
    assert.equal(
      audit.complianceScore,
      Math.round((audit.consistencyScore + audit.visualScore + audit.functionalScore) / 3),
    );

    assert.ok(audit.conversionModel.hotdocDeepLinkCount >= 11);
    assert.ok(audit.conversionModel.phoneOnlyVariant.includes("dr-mary-abadir.html"));
    assert.ok(audit.conversionModel.runtimeEnrichment.some((item) => /peer/i.test(item)));

    assert.ok(audit.issues.length >= 5);
    assert.ok(audit.priorityFixes.every((issue) => issue.severity === "P0" || issue.severity === "P1"));
    assert.ok(audit.priorityFixes.some((issue) => issue.id === "P-V1"));

    assert.ok(
      audit.recommendation === "ONE_LANGUAGE_WITH_POLISH" ||
        audit.recommendation === "ONE_LANGUAGE_ONE_MODEL",
    );
    assert.match(audit.reportPath, /PRACTITIONER_QA_AUDIT_QA2/);
  });

  it("scores authority and related pathways above imagery gaps", () => {
    const audit = getPractitionerQaAudit();
    assert.ok(audit.dimensionScores.authoritySections >= audit.dimensionScores.profileImagery);
    assert.ok(audit.dimensionScores.relatedServices >= 88);
    assert.ok(audit.dimensionScores.bookingPaths >= 88);
  });
});
