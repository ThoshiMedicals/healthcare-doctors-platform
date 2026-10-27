import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getAuthorityMaturityScore,
  getTrustAuthorityQaAudit,
  getTrustMaturityScore,
} from "./trust-authority-qa-audit";

describe("trust + authority QA audit (QA7)", () => {
  it("exposes Trust and Authority maturity scores with recommendations", () => {
    const audit = getTrustAuthorityQaAudit();
    assert.equal(audit.promptId, "QA7");
    assert.equal(getTrustMaturityScore(), audit.trustMaturityScore);
    assert.equal(getAuthorityMaturityScore(), audit.authorityMaturityScore);

    assert.ok(audit.trustMaturityScore >= 88);
    assert.ok(audit.authorityMaturityScore >= 75);
    assert.ok(audit.authorityMaturityScore < audit.trustMaturityScore);
    assert.equal(
      audit.complianceScore,
      Math.round((audit.trustMaturityScore + audit.authorityMaturityScore) / 2),
    );

    assert.equal(audit.coverage.governanceRecordsPublished, 0);
    assert.ok(audit.recommendations.some((item) => item.priority === "now"));
    assert.ok(audit.priorityFixes.every((issue) => issue.severity === "P0" || issue.severity === "P1"));
    assert.ok(audit.priorityFixes.some((issue) => issue.id === "T-A1"));
    assert.ok(audit.priorityFixes.some((issue) => issue.id === "T-A2"));

    assert.equal(audit.recommendation, "TRUST_STRONG_AUTHORITY_POLISH");
    assert.match(audit.reportPath, /TRUST_AUTHORITY_QA_AUDIT_QA7/);
  });

  it("scores AGPAL and practitioner authority above empty governance", () => {
    const audit = getTrustAuthorityQaAudit();
    assert.ok(audit.dimensionScores.agpal >= 90);
    assert.ok(audit.dimensionScores.practitionerAuthority >= 88);
    assert.ok(audit.dimensionScores.governanceStrips < 70);
    assert.ok(audit.dimensionScores.reviewLocations < 80);
  });
});
