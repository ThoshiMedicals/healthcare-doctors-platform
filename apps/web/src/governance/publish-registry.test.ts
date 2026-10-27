import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  sampleFailClosedGovernanceSources,
  samplePublishedGovernanceSources,
} from "./sample-approvals";
import {
  buildPublicGovernanceBundle,
  publicStripFieldGaps,
  renderGovernancePublishedJs,
} from "./publish-registry";
import { toPublicGovernanceFields } from "./public-fields";

const AUDIT_NOW = new Date("2026-10-26T02:00:00.000Z");

describe("governance public strip fields", () => {
  it("accepts Reviewed By, Content Owner, Last Reviewed, and Next Review Due when complete", () => {
    const [row] = samplePublishedGovernanceSources();
    const fields = toPublicGovernanceFields(row);
    assert.ok(fields);
    assert.equal(fields.reviewedBy, "Woolloongabba Medical Centre Clinical Team");
    assert.equal(fields.contentOwner, "Women's health clinical lead");
    assert.equal(fields.lastReviewed, "2026-09-15");
    assert.equal(fields.nextReviewDue, "2027-03-16");
    assert.deepEqual(publicStripFieldGaps(fields, AUDIT_NOW), []);
  });

  it("rejects incomplete or placeholder public fields", () => {
    assert.ok(publicStripFieldGaps(null, AUDIT_NOW).length > 0);
    assert.ok(
      publicStripFieldGaps(
        {
          reviewedBy: "TBD",
          contentOwner: "Practice management",
          lastReviewed: "2026-09-01",
          nextReviewDue: "2027-03-01",
        },
        AUDIT_NOW,
      ).some((gap) => gap.includes("Reviewed By")),
    );
    assert.ok(
      publicStripFieldGaps(
        {
          reviewedBy: "Clinical Team",
          contentOwner: "Practice management",
          lastReviewed: "2026-09-01",
          nextReviewDue: "2026-01-01",
        },
        AUDIT_NOW,
      ).some((gap) => gap.includes("Next Review Due")),
    );
  });
});

describe("governance publication registry", () => {
  it("builds sample published states for immediate strip publication", () => {
    const { bundle, included, omitted } = buildPublicGovernanceBundle(
      samplePublishedGovernanceSources(),
      AUDIT_NOW,
    );
    assert.equal(included, 3);
    assert.equal(omitted, 0);
    assert.deepEqual(Object.keys(bundle).sort(), [
      "patient-information/privacy.html",
      "services/womens-health.html",
      "telehealth.html",
    ]);
    assert.equal(bundle["telehealth.html"].status, "approved");
    assert.equal(bundle["telehealth.html"].nextReview, "2027-04-02");
    assert.equal(bundle["telehealth.html"].contentOwner, "Patient services");
  });

  it("fail-closes incomplete, overdue, draft, and private-evidence gaps", () => {
    const { bundle, included, omitted } = buildPublicGovernanceBundle(
      [...samplePublishedGovernanceSources(), ...sampleFailClosedGovernanceSources()],
      AUDIT_NOW,
    );
    assert.equal(included, 3);
    assert.equal(omitted, 6);
    assert.equal(bundle["services/draft-only.html"], undefined);
    assert.equal(bundle["services/no-owner.html"], undefined);
    assert.equal(bundle["services/placeholder-reviewer.html"], undefined);
    assert.equal(bundle["services/overdue.html"], undefined);
    assert.equal(bundle["services/no-evidence.html"], undefined);
    assert.equal(bundle["services/no-fingerprint.html"], undefined);
  });

  it("renders a fail-closed empty public JS bundle when nothing is approved", () => {
    const { bundle } = buildPublicGovernanceBundle(sampleFailClosedGovernanceSources(), AUDIT_NOW);
    const js = renderGovernancePublishedJs(bundle);
    assert.match(js, /window\.WMC_APPROVED_GOVERNANCE = Object\.freeze\(\{\}\);/);
    assert.doesNotMatch(js, /evidenceReference|approvalReference|reviewedContentSha256/);
  });

  it("renders only the four public fields in the published JS payload", () => {
    const { bundle } = buildPublicGovernanceBundle(samplePublishedGovernanceSources(), AUDIT_NOW);
    const js = renderGovernancePublishedJs(bundle);
    assert.match(js, /"reviewedBy":"Woolloongabba Medical Centre Clinical Team"/);
    assert.match(js, /"contentOwner":"Patient services"/);
    assert.match(js, /"lastReviewed":"2026-10-01"/);
    assert.match(js, /"nextReview":"2027-04-02"/);
    assert.doesNotMatch(js, /evidenceReference|approvalReference|reviewedContentSha256|approvedBy/);
  });
});
