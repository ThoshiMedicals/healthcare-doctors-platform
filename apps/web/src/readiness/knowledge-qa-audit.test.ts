import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getKnowledgeAuthorityScore,
  getKnowledgeQaAudit,
  getKnowledgeUxScore,
  getKnowledgeVisualScore,
} from "./knowledge-qa-audit";

describe("knowledge QA audit (QA4)", () => {
  it("exposes Knowledge UX, Authority, and Visual scores for educational templates", () => {
    const audit = getKnowledgeQaAudit();
    assert.equal(audit.promptId, "QA4");
    assert.equal(audit.templateCount, 109);
    assert.equal(audit.topicCount + audit.articleCount, 109);
    assert.equal(getKnowledgeUxScore(), audit.knowledgeUxScore);
    assert.equal(getKnowledgeAuthorityScore(), audit.authorityScore);
    assert.equal(getKnowledgeVisualScore(), audit.visualScore);

    assert.ok(audit.knowledgeUxScore >= 85);
    assert.ok(audit.authorityScore >= 70);
    assert.ok(audit.authorityScore < audit.knowledgeUxScore);
    assert.ok(audit.visualScore >= 80);
    assert.equal(
      audit.complianceScore,
      Math.round((audit.knowledgeUxScore + audit.authorityScore + audit.visualScore) / 3),
    );

    assert.ok(audit.issues.length >= 5);
    assert.ok(audit.priorityFixes.every((issue) => issue.severity === "P0" || issue.severity === "P1"));
    assert.ok(audit.priorityFixes.some((issue) => issue.id === "K-A1"));
    assert.ok(audit.priorityFixes.some((issue) => issue.id === "K-A2"));

    assert.equal(audit.recommendation, "UX_ALIGNED_AUTHORITY_POLISH");
    assert.match(audit.reportPath, /KNOWLEDGE_QA_AUDIT_QA4/);
  });

  it("scores pathways and conversion above empty governance strips", () => {
    const audit = getKnowledgeQaAudit();
    assert.ok(audit.dimensionScores.knowledgePathways >= 90);
    assert.ok(audit.dimensionScores.conversionBands >= 88);
    assert.ok(audit.dimensionScores.governanceStrips < 70);
    assert.ok(audit.dimensionScores.typography >= 88);
  });
});
