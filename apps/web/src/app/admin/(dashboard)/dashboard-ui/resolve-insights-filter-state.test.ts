import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { INSIGHTS_DASHBOARD_ROUTES } from "./filter-policy";
import {
  parseInsightsFiltersCookie,
  type InsightsFilters,
} from "./insights-filters";
import { resolveInsightsFilterState as resolve } from "./resolve-insights-filter-state";

const staleLegacyCookie: InsightsFilters = {
  range: "last_30",
  data: "demo",
  practitioner: "dr-old",
  service: "telehealth",
  queue: "expired",
  tier: "Thin",
  health: "governance",
  intent: "vaccination",
  from: "queue",
};

describe("FP-03 Phase 3 resolver ownership and cookie isolation", () => {
  it("uses only range/data from the legacy cookie on an unfiltered URL", () => {
    assert.deepEqual(resolve({}, staleLegacyCookie), { range: "last_30", data: "demo" });
    assert.deepEqual(resolve({ range: "last_7" }, staleLegacyCookie), {
      range: "last_7", data: "demo",
    });
  });

  it("gives validated explicit URL preferences precedence over cookie preferences", () => {
    assert.deepEqual(resolve(
      { range: "mtd", data: "live" }, staleLegacyCookie,
    ), { range: "mtd", data: "live" });
    assert.deepEqual(resolve(
      { range: "invalid", data: "invalid" }, staleLegacyCookie,
    ), { range: "last_30", data: "demo" });
  });

  it("uses explicit URL focus and never resurrects conflicting cookie investigation dimensions", () => {
    assert.deepEqual(resolve(
      { practitioner: "dr-new", from: "chart" }, staleLegacyCookie,
    ), {
      range: "last_30", data: "demo", practitioner: "dr-new", from: "chart",
    });
    assert.deepEqual(resolve(
      { intent: "skin-check", from: "chart" }, staleLegacyCookie,
    ), {
      range: "last_30", data: "demo", intent: "skin-check", from: "chart",
    });
  });

  it("removes orphan or source-incompatible provenance in compatibility mode", () => {
    assert.deepEqual(resolve({ from: "queue" }, staleLegacyCookie), {
      range: "last_30", data: "demo",
    });
    assert.deepEqual(resolve({ intent: "vaccination", from: "queue" }, staleLegacyCookie), {
      range: "last_30", data: "demo", intent: "vaccination",
    });
    assert.deepEqual(resolve({ intent: "vaccination", from: "chart" }, staleLegacyCookie), {
      range: "last_30", data: "demo", intent: "vaccination", from: "chart",
    });
  });

  it("accepts validated legacy PA/SA focus aliases in compatibility mode", () => {
    assert.deepEqual(resolve({ focus: "dr-a", focusAs: "practitioner" }, staleLegacyCookie), {
      range: "last_30", data: "demo", practitioner: "dr-a",
    });
    assert.deepEqual(resolve({ focus: "skin-check", focusAs: "service" }, staleLegacyCookie), {
      range: "last_30", data: "demo", service: "skin-check",
    });
  });

  it("rejects an explicitly unknown destination, even with valid URL preferences", () => {
    assert.deepEqual(resolve({ queue: "expired", range: "last_7" }, staleLegacyCookie, "/admin/users"), {});
    assert.deepEqual(resolve({}, staleLegacyCookie, "/admin/does-not-exist"), {});
  });

  it("isolates governance queue from every non-governance dashboard", () => {
    const params = { queue: "due_soon", from: "queue", data: "live" };
    for (const route of INSIGHTS_DASHBOARD_ROUTES) {
      const actual = resolve(params, staleLegacyCookie, route);
      assert.equal(actual.queue, route === "/admin/governance" ||
        route === "/admin/governance/management" ? "due_soon" : undefined, route);
      if (route !== "/admin/governance" && route !== "/admin/governance/management") {
        assert.equal(actual.from, undefined, route);
      }
    }
  });

  it("resolves Governance Management from explicit URL queue, not stale cookie queue", () => {
    assert.deepEqual(resolve({ queue: "due_soon", from: "queue" }, staleLegacyCookie,
      "/admin/governance/management"), {
      data: "demo", queue: "due_soon", from: "queue",
    });
    assert.deepEqual(resolve({}, staleLegacyCookie, "/admin/governance/management"), {
      data: "demo",
    });
  });

  it("resolves Digital Reception intent from URL without irrelevant cookie governance state", () => {
    assert.deepEqual(resolve({ intent: "vaccination", from: "chart" }, staleLegacyCookie,
      "/admin/digital-reception"), {
      range: "last_30", data: "demo", intent: "vaccination", from: "chart",
    });
    assert.deepEqual(resolve({ queue: "expired", from: "queue" }, staleLegacyCookie,
      "/admin/digital-reception"), {
      range: "last_30", data: "demo",
    });
  });

  it("enforces canonical PA and SA focus aliases based on the explicit route", () => {
    assert.deepEqual(resolve({ focus: "dr-a", tier: "Developing", from: "chart" },
      staleLegacyCookie, "/admin/practitioner-authority"), {
      range: "last_30", data: "demo", practitioner: "dr-a", tier: "Developing", from: "chart",
    });
    assert.deepEqual(resolve({ focus: "skin-check", tier: "Thin", from: "chart" },
      staleLegacyCookie, "/admin/service-authority"), {
      range: "last_30", data: "demo", service: "skin-check", tier: "Thin", from: "chart",
    });
    assert.deepEqual(resolve({ focus: "skin-check", tier: "Thin", from: "chart" },
      staleLegacyCookie, "/admin/executive"), {
      range: "last_30", data: "demo",
    });
  });

  it("requires both route ownership and correct health-domain destination", () => {
    assert.deepEqual(resolve({ health: "analytics", from: "health" }, staleLegacyCookie,
      "/admin/executive"), {
      range: "last_30", data: "demo", health: "analytics", from: "health",
    });
    assert.deepEqual(resolve({ health: "governance", from: "health" }, staleLegacyCookie,
      "/admin/executive"), {
      range: "last_30", data: "demo",
    });
    assert.deepEqual(resolve({ health: "governance", from: "health" }, staleLegacyCookie,
      "/admin/governance/management"), {
      data: "demo", health: "governance", from: "health",
    });
  });

  it("does not transfer service focus to practitioner authority or governance", () => {
    assert.deepEqual(resolve({ service: "telehealth", from: "chart" }, staleLegacyCookie,
      "/admin/practitioner-authority"), {
      range: "last_30", data: "demo",
    });
    assert.deepEqual(resolve({ practitioner: "dr-a", from: "chart" }, staleLegacyCookie,
      "/admin/governance"), {
      data: "demo",
    });
  });

  it("retains only data mode on monthly and expiry routes; reporting month stays separate", () => {
    assert.deepEqual(resolve({ range: "last_7", queue: "expired", tier: "Thin", data: "live" },
      staleLegacyCookie, "/admin/executive/monthly"), { data: "live" });
    assert.deepEqual(resolve({ range: "last_7", queue: "expired", data: "empty" },
      staleLegacyCookie, "/admin/governance/expiry"), { data: "empty" });
  });

  it("treats focus-free URLs as cleared even when the old cookie contains full focus", () => {
    assert.deepEqual(resolve({ range: "last_7" }, staleLegacyCookie,
      "/admin/governance/management"), { data: "demo" });
    assert.deepEqual(resolve({ data: "live" }, staleLegacyCookie,
      "/admin/practitioner-authority"), { range: "last_30", data: "live" });
  });

  it("accepts legacy raw cookie format for preferences without transferring investigation focus", () => {
    const raw = encodeURIComponent(JSON.stringify(staleLegacyCookie));
    const legacy = parseInsightsFiltersCookie(raw);
    assert.equal(legacy.queue, "expired"); // Parse remains unchanged until Phase 4.
    assert.deepEqual(resolve({}, legacy, "/admin/executive"), {
      range: "last_30", data: "demo",
    });
    assert.deepEqual(resolve({}, parseInsightsFiltersCookie("not-json"), "/admin/executive"), {});
  });
});
