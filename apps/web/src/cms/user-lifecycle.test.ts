import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { staffDisableDecision, staffGrantDecision, staffRoleDecision } from "./user-lifecycle";

describe("staff account lifecycle", () => {
  it("disables another staff account and keeps the last Super Admin", () => {
    assert.equal(
      staffDisableDecision({
        actorId: "super",
        targetId: "editor",
        targetRole: "content_editor",
        enabledSuperAdminCount: 1,
      }),
      "ok",
    );
    assert.equal(
      staffDisableDecision({
        actorId: "super",
        targetId: "super",
        targetRole: "super_admin",
        enabledSuperAdminCount: 1,
      }),
      "self",
    );
    assert.equal(
      staffDisableDecision({
        actorId: "super",
        targetId: "other-super",
        targetRole: "super_admin",
        enabledSuperAdminCount: 1,
      }),
      "last_super_admin",
    );
    assert.equal(
      staffDisableDecision({
        actorId: "super",
        targetId: "other-super",
        targetRole: "network_admin",
        enabledSuperAdminCount: 2,
      }),
      "ok",
    );
  });

  it("moves Content Editor and Clinic Admin and blocks every other role change", () => {
    assert.equal(
      staffRoleDecision({
        actorId: "super",
        targetId: "editor",
        currentRole: "content_editor",
        nextRole: "clinic_admin",
        enabledSuperAdminCount: 1,
      }),
      "ok",
    );
    assert.equal(
      staffRoleDecision({
        actorId: "super",
        targetId: "admin-user",
        currentRole: "clinic_admin",
        nextRole: "content_editor",
        enabledSuperAdminCount: 1,
      }),
      "ok",
    );
    assert.equal(
      staffRoleDecision({
        actorId: "super",
        targetId: "super",
        currentRole: "super_admin",
        nextRole: "clinic_admin",
        enabledSuperAdminCount: 1,
      }),
      "self",
    );
    assert.equal(
      staffRoleDecision({
        actorId: "super",
        targetId: "other-super",
        currentRole: "super_admin",
        nextRole: "content_editor",
        enabledSuperAdminCount: 1,
      }),
      "last_super_admin",
    );
    assert.equal(
      staffRoleDecision({
        actorId: "super",
        targetId: "other-super",
        currentRole: "network_admin",
        nextRole: "clinic_admin",
        enabledSuperAdminCount: 2,
      }),
      "forbidden",
    );
    for (const nextRole of ["clinical_reviewer", "practice_approver", "publisher", "editor", "super_admin"] as const) {
      assert.equal(
        staffRoleDecision({
          actorId: "super",
          targetId: "editor",
          currentRole: "content_editor",
          nextRole,
          enabledSuperAdminCount: 2,
        }),
        "forbidden",
      );
    }
    assert.equal(
      staffRoleDecision({
        actorId: "super",
        targetId: "editor",
        currentRole: "content_editor",
        nextRole: "content_editor",
        enabledSuperAdminCount: 1,
      }),
      "unchanged",
    );
  });

  it("grants Super Admin separately and cannot remove the last one", () => {
    assert.equal(
      staffGrantDecision({ actorId: "super", targetId: "editor", currentRole: "content_editor" }),
      "ok",
    );
    assert.equal(
      staffGrantDecision({ actorId: "super", targetId: "admin-user", currentRole: "clinic_admin" }),
      "ok",
    );
    assert.equal(
      staffGrantDecision({ actorId: "super", targetId: "super", currentRole: "clinic_admin" }),
      "self",
    );
    assert.equal(
      staffGrantDecision({ actorId: "super", targetId: "other-super", currentRole: "super_admin" }),
      "unchanged",
    );
    assert.equal(
      staffGrantDecision({ actorId: "super", targetId: "other-super", currentRole: "network_admin" }),
      "unchanged",
    );
    for (const currentRole of ["clinical_reviewer", "practice_approver", "publisher", "editor"] as const) {
      assert.equal(
        staffGrantDecision({ actorId: "super", targetId: "person", currentRole }),
        "forbidden",
      );
    }
    assert.equal(
      staffRoleDecision({
        actorId: "super",
        targetId: "other-super",
        currentRole: "super_admin",
        nextRole: "clinic_admin",
        enabledSuperAdminCount: 2,
      }),
      "forbidden",
    );
  });
});
