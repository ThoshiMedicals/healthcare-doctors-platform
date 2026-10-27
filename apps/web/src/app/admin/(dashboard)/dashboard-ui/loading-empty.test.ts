import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const dashboardRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const INSIGHT_LOADING_ROUTES = [
  "executive/loading.tsx",
  "digital-reception/loading.tsx",
  "practitioner-authority/loading.tsx",
  "service-authority/loading.tsx",
  "conversion-intelligence/loading.tsx",
  "governance/loading.tsx",
  "governance/management/loading.tsx",
  "governance/expiry/loading.tsx",
] as const;

describe("dashboard loading + empty consistency (B6)", () => {
  it("ships loading.tsx for every insight dashboard route", () => {
    for (const relative of INSIGHT_LOADING_ROUTES) {
      const file = path.join(dashboardRoot, relative);
      assert.equal(existsSync(file), true, `missing ${relative}`);
    }
  });

  it("exports LoadingState, DashboardLoading, and EmptyState from the design system", async () => {
    const ui = await import("./index");
    assert.equal(typeof ui.LoadingState, "function");
    assert.equal(typeof ui.DashboardLoading, "function");
    assert.equal(typeof ui.EmptyState, "function");
  });
});
