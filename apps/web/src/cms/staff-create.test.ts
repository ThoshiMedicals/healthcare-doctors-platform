import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isCreatableStaffRole } from "@/auth/permissions";
import { staffCreateMessage, staffCreateProblems } from "./staff-create";

describe("staff creation messages", () => {
  const valid = {
    name: "Practice Manager",
    username: "pm",
    password: "long-enough",
    confirmation: "long-enough",
    roleAllowed: true,
  };

  it("names the missing field", () => {
    assert.equal(staffCreateProblems({ ...valid, name: " " }), "name");
    assert.equal(staffCreateProblems({ ...valid, username: "a" }), "username");
    assert.equal(staffCreateProblems({ ...valid, password: "short", confirmation: "short" }), "short");
    assert.equal(staffCreateProblems({ ...valid, confirmation: "other-value" }), "confirm");
    assert.equal(staffCreateProblems({ ...valid, roleAllowed: false }), "role");
    assert.equal(staffCreateProblems(valid), null);
    assert.equal(staffCreateMessage("role"), "Choose Super Admin, Clinic Admin, or Content Editor.");
    assert.equal(isCreatableStaffRole("super_admin"), true);
    assert.equal(isCreatableStaffRole("network_admin"), false);
    assert.equal(isCreatableStaffRole("clinical_reviewer"), false);
  });

  it("explains a duplicate username and the password length", () => {
    assert.match(staffCreateMessage("duplicate"), /already in use/);
    assert.match(staffCreateMessage("short"), /8 characters/);
    assert.match(staffCreateMessage("role"), /Clinic Admin/);
  });
});
