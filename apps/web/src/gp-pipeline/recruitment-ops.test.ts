import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  GP_READINESS_STATUS_LABEL,
  GP_RECRUITMENT_SOURCE_LABEL,
  isGpReadinessPackageStatus,
  isGpRecruitmentSource,
  packageProfileCompleteness,
} from "./recruitment-ops";

describe("recruitment ops labels", () => {
  it("covers the expanded package workflow statuses", () => {
    assert.equal(GP_READINESS_STATUS_LABEL.new_lead, "New Lead");
    assert.equal(GP_READINESS_STATUS_LABEL.active_gp, "Active GP");
    assert.equal(GP_READINESS_STATUS_LABEL.provider_number_support, "Provider Number Support");
    assert.equal(Object.keys(GP_READINESS_STATUS_LABEL).length, 12);
    assert.equal(isGpReadinessPackageStatus("applicant"), true);
    assert.equal(isGpReadinessPackageStatus("recruitment_applicant"), false);
  });

  it("covers recruitment source options", () => {
    assert.equal(GP_RECRUITMENT_SOURCE_LABEL.practice_website, "Practice Website");
    assert.equal(isGpRecruitmentSource("linkedin"), true);
    assert.equal(isGpRecruitmentSource("facebook"), false);
  });
});

describe("packageProfileCompleteness", () => {
  it("scores from payload when no draft exists", () => {
    const result = packageProfileCompleteness({
      payloadJson: {
        websiteProfile: {
          preferredPublishedName: "Dr Example",
          biography: Array.from({ length: 90 }, () => "word").join(" "),
          shortIntroduction: "A".repeat(50),
          qualifications: ["FRACGP"],
          specialInterests: ["Family Medicine"],
          languagesSpoken: ["English"],
          memberships: ["RACGP"],
        },
      },
      documentsJson: [{ key: "headshot", storagePath: "x.jpg" }],
    });
    assert.equal(result.score, 100);
  });
});
