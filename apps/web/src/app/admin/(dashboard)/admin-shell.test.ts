import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ADMIN_SHELL_ANALYTICS_MAX,
  ADMIN_SHELL_CMS_MAX,
  adminShellKind,
  adminShellMaxClass,
  isAnalyticsAdminPath,
} from "./admin-shell";

describe("admin shell width rules (C2)", () => {
  it("uses the analytics shell for command centre and insight dashboards", () => {
    for (const path of [
      "/admin",
      "/admin/",
      "/admin?range=last_7",
      "/admin/executive",
      "/admin/executive/monthly",
      "/admin/digital-reception",
      "/admin/practitioner-authority",
      "/admin/service-authority",
      "/admin/conversion-intelligence",
      "/admin/governance",
      "/admin/governance/management",
      "/admin/governance/expiry",
      "/admin/governance/abc",
    ]) {
      assert.equal(isAnalyticsAdminPath(path), true, path);
      assert.equal(adminShellKind(path), "analytics", path);
      assert.equal(adminShellMaxClass(path), ADMIN_SHELL_ANALYTICS_MAX, path);
    }
  });

  it("keeps CMS content-editor routes on max-w-6xl", () => {
    for (const path of [
      "/admin/pages",
      "/admin/practitioners",
      "/admin/practitioners/dr-tanya",
      "/admin/services",
      "/admin/knowledge",
      "/admin/updates",
      "/admin/about",
      "/admin/patient-information",
      "/admin/media",
      "/admin/navigation",
      "/admin/settings",
      "/admin/account",
      "/admin/users",
      "/admin/image-governance",
      "/admin/collections/foo",
    ]) {
      assert.equal(isAnalyticsAdminPath(path), false, path);
      assert.equal(adminShellKind(path), "cms", path);
      assert.equal(adminShellMaxClass(path), ADMIN_SHELL_CMS_MAX, path);
    }
  });
});
