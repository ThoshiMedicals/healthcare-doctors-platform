import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  INSIGHTS_DASHBOARD_FAMILIES,
  INSIGHTS_DASHBOARD_POLICIES,
  INSIGHTS_DASHBOARD_ROUTES,
  INSIGHTS_FOCUS_KEYS,
  INSIGHTS_HEALTH_DOMAIN_ROUTES,
  INSIGHTS_PREFERENCE_KEYS,
  insightsDashboardPolicy,
  insightsDashboardRoute,
  insightsRouteAllowsSource,
  insightsRouteOwnsFilter,
  insightsRouteOwnsHealth,
} from "./filter-policy";

describe("FP-03 Phase 1 dashboard filter ownership", () => {
  it("declares six families and exactly ten known Insights routes", () => {
    assert.deepEqual(INSIGHTS_DASHBOARD_FAMILIES, [
      "briefing", "executive", "search", "authority", "conversion", "governance",
    ]);
    assert.equal(INSIGHTS_DASHBOARD_ROUTES.length, 10);
    assert.equal(new Set(INSIGHTS_DASHBOARD_ROUTES).size, 10);
    assert.deepEqual(new Set(INSIGHTS_DASHBOARD_ROUTES.map((path) => INSIGHTS_DASHBOARD_POLICIES[path].family)), new Set(INSIGHTS_DASHBOARD_FAMILIES));
  });

  it("normalises known routes but rejects unknown admin, CMS and record pages", () => {
    assert.equal(insightsDashboardRoute("/admin/digital-reception/?intent=vaccination"), "/admin/digital-reception");
    assert.equal(insightsDashboardRoute("/admin/executive/monthly#report"), "/admin/executive/monthly");
    assert.equal(insightsDashboardRoute("/admin"), "/admin");
    for (const path of ["/admin/governance/abc123", "/admin/users", "/admin/not-a-dashboard", "//admin/executive", "https://example.com/admin"]) {
      assert.equal(insightsDashboardRoute(path), null, path);
      assert.equal(insightsDashboardPolicy(path), null, path);
    }
  });

  it("separates shared preferences from focus and investigation provenance", () => {
    assert.deepEqual(INSIGHTS_PREFERENCE_KEYS, ["range", "data"]);
    assert.deepEqual(INSIGHTS_FOCUS_KEYS, ["practitioner", "service", "queue", "tier", "health", "intent"]);
    assert.equal(insightsRouteOwnsFilter("/admin", "range"), true);
    assert.equal(insightsRouteOwnsFilter("/admin", "from"), false);
    assert.equal(insightsRouteOwnsFilter("/admin/executive/monthly", "range"), false);
    assert.equal(insightsDashboardPolicy("/admin/executive/monthly")?.reportingPeriod, "month");
    assert.equal(insightsDashboardPolicy("/admin/governance/management")?.reportingPeriod, "preference-only");
  });

  it("isolates governance queue from non-governance dashboards", () => {
    for (const path of INSIGHTS_DASHBOARD_ROUTES) {
      const expected = path === "/admin/governance" || path === "/admin/governance/management";
      assert.equal(insightsRouteOwnsFilter(path, "queue"), expected, path);
    }
    assert.equal(insightsRouteOwnsFilter("/admin/governance/expiry", "queue"), false);
  });

  it("assigns service, practitioner, tier and intent to their legitimate destinations", () => {
    assert.equal(insightsRouteOwnsFilter("/admin/practitioner-authority", "practitioner"), true);
    assert.equal(insightsRouteOwnsFilter("/admin/practitioner-authority", "service"), false);
    assert.equal(insightsRouteOwnsFilter("/admin/service-authority", "service"), true);
    assert.equal(insightsRouteOwnsFilter("/admin/service-authority", "practitioner"), false);
    assert.equal(insightsRouteOwnsFilter("/admin/conversion-intelligence", "service"), true);
    assert.equal(insightsRouteOwnsFilter("/admin/conversion-intelligence", "practitioner"), true);
    assert.equal(insightsRouteOwnsFilter("/admin/conversion-intelligence", "tier"), false);
    assert.equal(insightsRouteOwnsFilter("/admin/digital-reception", "intent"), true);
    assert.equal(insightsRouteOwnsFilter("/admin/executive", "intent"), false);
    assert.equal(insightsDashboardPolicy("/admin/practitioner-authority")?.legacyFocusAs, "practitioner");
    assert.equal(insightsDashboardPolicy("/admin/service-authority")?.legacyFocusAs, "service");
  });

  it("assigns each health domain to exactly one dashboard destination", () => {
    assert.equal(Object.keys(INSIGHTS_HEALTH_DOMAIN_ROUTES).length, 7);
    for (const [domain, path] of Object.entries(INSIGHTS_HEALTH_DOMAIN_ROUTES)) {
      assert.equal(insightsRouteOwnsFilter(path, "health"), true, domain);
      assert.equal(insightsRouteOwnsHealth(path, domain as keyof typeof INSIGHTS_HEALTH_DOMAIN_ROUTES), true);
      assert.equal(insightsRouteOwnsHealth("/admin", domain as keyof typeof INSIGHTS_HEALTH_DOMAIN_ROUTES), false);
    }
    assert.equal(insightsRouteOwnsHealth("/admin/executive", "governance"), false);
    assert.equal(insightsRouteOwnsHealth("/admin/service-authority", "authority"), false);
  });

  it("allows provenance only alongside an owned investigation focus", () => {
    assert.equal(insightsRouteAllowsSource("/admin/governance/management", { queue: "expired", from: "recommendation" }), true);
    assert.equal(insightsRouteAllowsSource("/admin/digital-reception", { intent: "vaccination", from: "chart" }), true);
    assert.equal(insightsRouteAllowsSource("/admin/conversion-intelligence", { practitioner: "dr-a", from: "kpi" }), true);
    assert.equal(insightsRouteAllowsSource("/admin/practitioner-authority", { tier: "Developing", from: "chart" }), true);
    assert.equal(insightsRouteAllowsSource("/admin/executive", { health: "analytics", from: "health" }), true);
    assert.equal(insightsRouteAllowsSource("/admin/executive", { health: "governance", from: "health" }), false);
    assert.equal(insightsRouteAllowsSource("/admin/digital-reception", { queue: "expired", from: "queue" }), false);
    assert.equal(insightsRouteAllowsSource("/admin/governance", { from: "queue" }), false);
    assert.equal(insightsRouteAllowsSource("/admin/executive/monthly", { intent: "vaccination", from: "chart" }), false);
  });
});
