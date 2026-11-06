import assert from "node:assert/strict";
import test from "node:test";
import { assessSpousalEligibility } from "./readiness-package";

test("spousal assessment marks medical partner pathway as likely eligible when criteria met", () => {
  const result = assessSpousalEligibility({
    relationshipStatus: "married",
    partnerType: "medical_practitioner",
    partnerUnrestricted19ab: "yes",
    partnerMedicareAccess: "yes",
    evidenceTypes: ["Marriage Certificate", "Joint Lease"],
  });
  assert.equal(result.outcome, "likely_eligible");
});

test("spousal assessment requires further review when skilled migrant criteria incomplete", () => {
  const result = assessSpousalEligibility({
    relationshipStatus: "de_facto",
    partnerType: "skilled_migrant",
    skilledMigrationVisa: "yes",
    occupationAssessed: "no",
    currentlyEmployedInOccupation: "yes",
    migratedWithin10Years: "yes",
    evidenceTypes: ["Utility Bill"],
  });
  assert.equal(result.outcome, "further_review_required");
});

test("spousal assessment is further review when relationship is other", () => {
  const result = assessSpousalEligibility({
    relationshipStatus: "other",
    partnerType: "medical_practitioner",
  });
  assert.equal(result.outcome, "further_review_required");
});
