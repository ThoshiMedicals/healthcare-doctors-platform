import assert from "node:assert/strict";
import test from "node:test";
import { canSwitchClinic, defaultClinicSlug } from "@/cms/active-clinic";
import { roleAllows } from "@/auth/permissions";

test("switch_clinic is limited to network and super admin roles", () => {
  assert.equal(canSwitchClinic("super_admin"), true);
  assert.equal(canSwitchClinic("network_admin"), true);
  assert.equal(canSwitchClinic("clinic_admin"), false);
  assert.equal(canSwitchClinic("content_editor"), false);
  assert.equal(canSwitchClinic(null), false);
  assert.equal(roleAllows("super_admin", "switch_clinic"), true);
  assert.equal(roleAllows("clinic_admin", "switch_clinic"), false);
});

test("default clinic slug falls back to woolloongabba", () => {
  assert.equal(defaultClinicSlug(), process.env.DEFAULT_CLINIC_SLUG || "woolloongabba");
});
