import assert from "node:assert/strict";
import test from "node:test";
import { isAdminSwitchableClinicStatus } from "@/clinics/resolve-clinic";

test("admin switcher allows live and draft only", () => {
  assert.equal(isAdminSwitchableClinicStatus("live"), true);
  assert.equal(isAdminSwitchableClinicStatus("draft"), true);
  assert.equal(isAdminSwitchableClinicStatus("external"), false);
});
