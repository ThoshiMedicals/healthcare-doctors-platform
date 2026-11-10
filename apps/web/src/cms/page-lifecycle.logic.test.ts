import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { roleAllows } from "@/auth/permissions";

/**
 * Lifecycle permission contracts (DB integration covered separately when
 * WMC_P0_TEST_DATABASE_URL is configured).
 */
describe("page lifecycle permissions", () => {
  it("restricts unpublish to publisher authority and restore/publish similarly", () => {
    assert.equal(roleAllows("publisher", "unpublish_page"), true);
    assert.equal(roleAllows("publisher", "publish"), true);
    assert.equal(roleAllows("content_editor", "unpublish_page"), false);
    assert.equal(roleAllows("clinical_reviewer", "unpublish_page"), false);
    assert.equal(roleAllows("practice_approver", "unpublish_page"), false);
    assert.equal(roleAllows("clinic_admin", "unpublish_page"), true);
  });

  it("keeps clinical and operational approvals segregated", () => {
    assert.equal(roleAllows("clinical_reviewer", "clinical_signoff"), true);
    assert.equal(roleAllows("clinical_reviewer", "practice_approve"), false);
    assert.equal(roleAllows("practice_approver", "practice_approve"), true);
    assert.equal(roleAllows("practice_approver", "clinical_signoff"), false);
    assert.equal(roleAllows("publisher", "publish"), true);
    assert.equal(roleAllows("publisher", "practice_approve"), false);
  });
});
