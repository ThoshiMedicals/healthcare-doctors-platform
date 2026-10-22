import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fingerprintContent } from "../governance/fingerprint";
import {
  evaluateContentPublication,
  evaluateImagePublication,
  evaluatePublishGates,
  type ContentPublicationEvidence,
  type PublishGateInput,
} from "./publish-gates";

const published = "<main>approved clinical page</main>";
const hash = fingerprintContent(published);

function completeEvidence(): ContentPublicationEvidence {
  return {
    reviewedBy: "Dr Lee",
    reviewerSignedAt: new Date("2026-09-30T02:00:00.000Z"),
    approvedBy: "Practice Manager",
    approvedAt: new Date("2026-10-01T00:00:00.000Z"),
    approvalReference: "CMS-2026-10",
    evidenceReference: "EV-100",
    contentOwner: "Dr Lee",
    reviewedContentSha256: hash,
    contentSha256: hash,
    pagePath: "knowledge/articles/adhd.html",
    nextReview: new Date("2027-10-01T00:00:00.000Z"),
    publisherName: "Practice Manager",
    releaseChecksAccepted: true,
    linksVerified: true,
  };
}

function completeGate(): PublishGateInput {
  const evidence = completeEvidence();
  return {
    reviewer: evidence.reviewedBy,
    contentOwner: evidence.contentOwner,
    dueDate: new Date("2026-09-15T00:00:00.000Z"),
    articlePath: evidence.pagePath,
    contentSha256: evidence.contentSha256,
    reviewedContentSha256: evidence.reviewedContentSha256,
    reviewerSignedAt: evidence.reviewerSignedAt,
    approvedAt: evidence.approvedAt,
    approvalReference: evidence.approvalReference,
    evidenceReference: evidence.evidenceReference,
    sourceVerificationComplete: true,
    seoReviewComplete: true,
    accessibilityReviewComplete: true,
    internalLinksVerified: true,
    nextReviewDate: evidence.nextReview,
    publicationDate: evidence.approvedAt,
    liveVerifiedBy: evidence.publisherName,
  };
}

describe("clinical publication gate", () => {
  it("publishes approved content when governance is complete", () => {
    assert.deepEqual(evaluateContentPublication(completeEvidence()), { ok: true });
    assert.deepEqual(evaluatePublishGates(completeGate()), { ok: true });
  });

  it("blocks an approved record when the reviewer is missing", () => {
    const result = evaluateContentPublication({ ...completeEvidence(), reviewedBy: "  " });
    assert.equal(result.ok, false);
    if (!result.ok) assert.ok(result.reasons.includes("Reviewer is required."));
  });

  it("blocks an approved record when the evidence reference is missing", () => {
    const result = evaluateContentPublication({ ...completeEvidence(), evidenceReference: null });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.ok(result.reasons.includes("Evidence reference is required."));
      assert.ok(result.reasons.includes("Source verification is incomplete."));
    }
  });

  it("blocks an approved record when the approval date is missing", () => {
    const result = evaluateContentPublication({ ...completeEvidence(), approvedAt: null });
    assert.equal(result.ok, false);
    if (!result.ok) assert.ok(result.reasons.includes("Approval date is required."));
  });

  it("blocks an approved record when the fingerprint does not match", () => {
    const result = evaluateContentPublication({
      ...completeEvidence(),
      reviewedContentSha256: fingerprintContent("a different page"),
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.ok(result.reasons.includes("Reviewed content fingerprint does not match the current content."));
    }
  });

  it("keeps the existing governance checks", () => {
    const missingApprover = evaluateContentPublication({ ...completeEvidence(), approvedBy: null });
    assert.equal(missingApprover.ok, false);
    if (!missingApprover.ok) assert.ok(missingApprover.reasons.includes("Approver is required."));

    const earlierApproval = evaluatePublishGates({
      ...completeGate(),
      approvedAt: new Date("2026-09-01T00:00:00.000Z"),
    });
    assert.equal(earlierApproval.ok, false);
    if (!earlierApproval.ok) {
      assert.ok(earlierApproval.reasons.includes("Practice approval must follow reviewer sign-off."));
    }

    const sameDay = evaluatePublishGates({
      ...completeGate(),
      reviewerSignedAt: new Date("2026-10-01T15:00:00.000Z"),
      approvedAt: new Date("2026-10-01T00:00:00.000Z"),
    });
    assert.equal(sameDay.ok, true);

    const incompleteRelease = evaluatePublishGates({
      ...completeGate(),
      sourceVerificationComplete: false,
      seoReviewComplete: false,
      accessibilityReviewComplete: false,
      internalLinksVerified: false,
      contentOwner: null,
      dueDate: null,
      liveVerifiedBy: " ",
    });
    assert.equal(incompleteRelease.ok, false);
    if (!incompleteRelease.ok) {
      for (const reason of [
        "Content owner is required.",
        "Due date is required.",
        "Source verification is incomplete.",
        "SEO review is incomplete.",
        "Accessibility review is incomplete.",
        "Internal links are not verified.",
        "A named operator must confirm the deployment.",
      ]) {
        assert.ok(incompleteRelease.reasons.includes(reason), reason);
      }
    }
  });

  it("uses the same decision for articles, services, practitioners, practice pages, and updates", () => {
    const evidence = completeEvidence();
    const paths = [
      "knowledge/articles/adhd.html",
      "services/womens-health.html",
      "doctors/dr-sumita-singh.html",
      "practice/fees.html",
      "updates/flu-clinic.html",
    ];
    const decisions = paths.map((pagePath) => evaluateContentPublication({ ...evidence, pagePath }));
    assert.deepEqual(decisions, paths.map(() => ({ ok: true })));
    const blocked = paths.map((pagePath) =>
      evaluateContentPublication({ ...evidence, pagePath, evidenceReference: null }),
    );
    for (const result of blocked) {
      assert.equal(result.ok, false);
      if (!result.ok) assert.ok(result.reasons.includes("Evidence reference is required."));
    }
  });
});

describe("image publication gate", () => {
  const proposal = fingerprintContent("proposed logo");
  const complete = {
    reviewedBy: "Dr Lee",
    evidenceReference: "EV-100",
    approvedAt: new Date("2026-10-02T00:00:00.000Z"),
    proposalSha256: proposal,
    reviewedSha256: proposal,
    storagePath: "assets/brand/healthcare-doctors-woolloongabba-logo.png",
    publisherName: "Practice Manager",
    fileChecksAccepted: true,
  };

  it("publishes an approved image when governance is complete", () => {
    assert.deepEqual(evaluateImagePublication(complete), { ok: true });
  });

  it("blocks an approved image when the reviewer is missing", () => {
    const result = evaluateImagePublication({ ...complete, reviewedBy: null });
    assert.equal(result.ok, false);
    if (!result.ok) assert.ok(result.reasons.includes("Reviewer is required."));
  });

  it("blocks an approved image when the evidence reference is missing", () => {
    const result = evaluateImagePublication({ ...complete, evidenceReference: null });
    assert.equal(result.ok, false);
    if (!result.ok) assert.ok(result.reasons.includes("Evidence reference is required."));
  });

  it("blocks an approved image when the approval date is missing", () => {
    const result = evaluateImagePublication({ ...complete, approvedAt: null });
    assert.equal(result.ok, false);
    if (!result.ok) assert.ok(result.reasons.includes("Approval date is required."));
  });

  it("blocks an approved image when the fingerprint does not match", () => {
    const result = evaluateImagePublication({
      ...complete,
      reviewedSha256: fingerprintContent("a different file"),
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.ok(result.reasons.includes("Reviewed image fingerprint does not match the proposed file."));
    }
  });

  it("keeps the file check from publishing an image", () => {
    const result = evaluateImagePublication({ ...complete, fileChecksAccepted: false });
    assert.equal(result.ok, false);
    if (!result.ok) assert.ok(result.reasons.includes("SEO review is incomplete."));
  });
});
