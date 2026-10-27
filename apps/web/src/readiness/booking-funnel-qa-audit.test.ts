import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getBookingFunnelQaAudit, getConversionScore } from "./booking-funnel-qa-audit";

describe("booking funnel QA audit (QA6)", () => {
  it("exposes conversion score, friction report, and recommendations", () => {
    const audit = getBookingFunnelQaAudit();
    assert.equal(audit.promptId, "QA6");
    assert.equal(getConversionScore(), audit.conversionScore);

    assert.ok(audit.conversionScore >= 85);
    assert.equal(
      audit.conversionScore,
      Math.round(
        Object.values(audit.dimensionScores).reduce((sum, n) => sum + n, 0) /
          Object.keys(audit.dimensionScores).length,
      ),
    );

    assert.equal(audit.coverage.practitionersWithBook, 13);
    assert.equal(audit.coverage.practitionersPhoneOnly, 1);
    assert.equal(audit.coverage.servicesWithBook, 29);
    assert.ok(audit.frictionReport.length >= 5);
    assert.ok(audit.recommendations.some((item) => item.priority === "now"));
    assert.ok(audit.priorityFixes.every((item) => item.severity === "P0" || item.severity === "P1"));
    assert.ok(audit.priorityFixes.some((item) => item.id === "B-F1"));
    assert.ok(audit.priorityFixes.some((item) => item.id === "B-F2"));

    assert.equal(audit.recommendation, "CONVERSION_STRONG_WITH_FRICTION");
    assert.match(audit.reportPath, /BOOKING_FUNNEL_QA_AUDIT_QA6/);
  });

  it("scores homepage and HotDoc above call-action friction", () => {
    const audit = getBookingFunnelQaAudit();
    assert.ok(audit.dimensionScores.homepage >= 90);
    assert.ok(audit.dimensionScores.hotdocJourneys >= 88);
    assert.ok(audit.dimensionScores.trustPlacement >= 88);
    assert.ok(audit.dimensionScores.callActions < audit.dimensionScores.homepage);
  });
});
