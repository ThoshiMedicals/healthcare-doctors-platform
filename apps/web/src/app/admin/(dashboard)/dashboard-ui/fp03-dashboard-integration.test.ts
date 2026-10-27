import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  INSIGHTS_DASHBOARD_ROUTES,
  type InsightsDashboardRoute,
} from "./filter-policy";
import {
  clearInsightsHref,
  insightsDataModeHref,
  insightsRangeHref,
} from "./insights-filters";
import {
  insightsCookieValue,
  mergeInsightsPreferences,
  resolveInsightsCookiePreferences,
  serializeInsightsPreferencesCookie,
} from "./insights-preferences";
import { resolveInsightsFilterState } from "./resolve-insights-filter-state";
import {
  governanceManagementHref,
  insightsNavItems,
  practitionerAuthorityHref,
  serviceAuthorityHref,
} from "./links";

const pageByRoute: Record<InsightsDashboardRoute, string> = {
  "/admin": "page.tsx",
  "/admin/executive": "executive/page.tsx",
  "/admin/executive/monthly": "executive/monthly/page.tsx",
  "/admin/digital-reception": "digital-reception/page.tsx",
  "/admin/practitioner-authority": "practitioner-authority/page.tsx",
  "/admin/service-authority": "service-authority/page.tsx",
  "/admin/conversion-intelligence": "conversion-intelligence/page.tsx",
  "/admin/governance": "governance/page.tsx",
  "/admin/governance/management": "governance/management/page.tsx",
  "/admin/governance/expiry": "governance/expiry/page.tsx",
};
const readDashboard = (relative: string) =>
  readFileSync(new URL("../" + relative, import.meta.url), "utf8");
const parsedUrl = (href: string) => new URL(href, "https://test.invalid");

describe("FP-03 Phase 6 dashboard integration and cross-layer regression", () => {
  it("wires all ten dashboard routes to the explicitly owned resolver path", () => {
    assert.equal(Object.keys(pageByRoute).length, 10);
    for (const route of INSIGHTS_DASHBOARD_ROUTES) {
      const source = readDashboard(pageByRoute[route]);
      assert.ok(
        source.includes(`resolveInsightsFilters(params, "${route}")`),
        `${route} must provide destination ownership to resolver`,
      );
      assert.doesNotMatch(source, /resolveInsightsFilters\(\{\s*\.\.\.params,\s*focusAs:/);
    }
  });

  it("rejects inherited governance focus on every other route, including QA11 authority", () => {
    const cookie = { range: "last_7" as const, data: "demo" as const, queue: "expired" as const };
    for (const route of INSIGHTS_DASHBOARD_ROUTES) {
      const resolved = resolveInsightsFilterState(
        { queue: "expired", from: "queue" }, cookie, route,
      );
      const governance = route === "/admin/governance" || route === "/admin/governance/management";
      assert.equal(resolved.queue, governance ? "expired" : undefined, route);
      if (!governance) assert.equal(resolved.from, undefined, route);
    }
  });

  it("keeps shared Insights overview navigation preference-only even with stale focus", () => {
    const links = insightsNavItems({
      range: "last_30", data: "demo", queue: "expired",
      practitioner: "dr-a", service: "telehealth", tier: "Thin",
      health: "governance", intent: "vaccination", from: "queue",
    });
    assert.equal(links.length, 9);
    for (const link of links) {
      const url = parsedUrl(link.href);
      for (const key of ["queue", "practitioner", "service", "tier", "health", "intent", "from", "focus"]) {
        assert.equal(url.searchParams.has(key), false, link.id + " / " + key);
      }
    }
  });

  it("preserves explicit authority tier and practitioner focus, including legacy URL alias", () => {
    const href = practitionerAuthorityHref({
      range: "last_7", tier: "Developing", focus: "dr-a",
      filters: { data: "demo", queue: "expired", from: "chart" },
    });
    const url = parsedUrl(href);
    const resolved = resolveInsightsFilterState(
      Object.fromEntries(url.searchParams),
      { data: "demo", range: "last_30", queue: "expired" },
      url.pathname,
    );
    assert.deepEqual(resolved, {
      range: "last_7", data: "demo", practitioner: "dr-a", tier: "Developing", from: "chart",
    });
    assert.equal(resolved.queue, undefined);
  });

  it("preserves explicit service tier investigation and its roster filter", () => {
    const href = serviceAuthorityHref({
      range: "last_30", focus: "skin-check", tier: "Thin",
      filters: { data: "live", queue: "expired", from: "chart" },
    });
    const url = parsedUrl(href);
    assert.deepEqual(resolveInsightsFilterState(
      Object.fromEntries(url.searchParams), { queue: "expired" }, url.pathname,
    ), {
      range: "last_30", data: "live", service: "skin-check", tier: "Thin", from: "chart",
    });
  });

  it("retains investigation focus during range navigation but not overview navigation", () => {
    const href = insightsRangeHref(
      "/admin/digital-reception",
      { range: "last_30", data: "demo", service: "telehealth", intent: "vaccination", from: "chart", queue: "expired" },
      "last_7",
    );
    const u = parsedUrl(href);
    assert.equal(u.searchParams.get("range"), "last_7");
    assert.equal(u.searchParams.get("service"), "telehealth");
    assert.equal(u.searchParams.get("intent"), "vaccination");
    assert.equal(u.searchParams.get("from"), "chart");
    assert.equal(u.searchParams.has("queue"), false);
  });

  it("retains QA11 tier and optional focus on both Authority range controls", () => {
    for (const route of ["/admin/practitioner-authority", "/admin/service-authority"]) {
      const src = readDashboard(pageByRoute[route]);
      assert.match(src, /tier:\s*tierFilter\s*\?\?\s*undefined/);
      assert.match(src, /AUTHORITY_TIER_FRIENDLY\[tierFilter\]/);
      assert.match(src, /import\s*\{\s*AUTHORITY_TIER_FRIENDLY\s*,/);
      const focus = route.includes("practitioner") ? { practitioner: "dr-a" } : { service: "telehealth" };
      const href = insightsRangeHref(route, { ...focus, tier: "Thin", data: "demo", from: "chart" }, "last_7");
      assert.equal(parsedUrl(href).searchParams.get("tier"), "Thin");
    }
  });

  it("keeps valid governance queue handoff and drops unrelated health focus", () => {
    const href = governanceManagementHref({
      queue: "due_soon",
      filters: { data: "demo", health: "governance", from: "health" },
    });
    const u = parsedUrl(href);
    assert.deepEqual(resolveInsightsFilterState(
      Object.fromEntries(u.searchParams), { range: "last_30" }, u.pathname,
    ), { data: "demo", queue: "due_soon", from: "queue" });
  });

  it("keeps explicit health-domain focus on its target and rejects wrong destinations", () => {
    const pref = { range: "last_7" as const, data: "live" as const };
    assert.deepEqual(resolveInsightsFilterState(
      { health: "analytics", from: "health" }, pref, "/admin/executive",
    ), { ...pref, health: "analytics", from: "health" });
    assert.deepEqual(resolveInsightsFilterState(
      { health: "governance", from: "health" }, pref, "/admin/executive",
    ), pref);
  });

  it("clears investigations permanently across refresh, preserving valid preferences", () => {
    const focused = { range: "last_7" as const, data: "demo" as const, tier: "Thin" as const,
      practitioner: "dr-a", queue: "expired" as const, from: "queue" as const };
    const clean = clearInsightsHref("/admin/practitioner-authority?focus=dr-a&tier=Thin#pa-focus", focused);
    assert.equal(clean, "/admin/practitioner-authority?range=last_7&data=demo");
    const old = encodeURIComponent(JSON.stringify(focused));
    const pref = resolveInsightsCookiePreferences(serializeInsightsPreferencesCookie(focused), old);
    assert.deepEqual(resolveInsightsFilterState(
      Object.fromEntries(parsedUrl(clean).searchParams), pref, "/admin/practitioner-authority",
    ), { range: "last_7", data: "demo" });
  });

  it("retains a valid monthly report period through data-mode changes and clear links", () => {
    assert.equal(insightsDataModeHref(
      "/admin/executive/monthly", { data: "demo", range: "last_30" }, "live", "2026-10",
    ), "/admin/executive/monthly?month=2026-10&data=live");
    assert.equal(clearInsightsHref(
      "/admin/executive/monthly?month=2026-10#focus", { data: "live", tier: "Thin" },
    ), "/admin/executive/monthly?month=2026-10&data=live");
    const page = readDashboard(pageByRoute["/admin/executive/monthly"]);
    assert.match(page, /month=\{window\.monthKey\}/);
  });

  it("preserves global range in v2 when visiting a governance or monthly route", () => {
    const cookie = serializeInsightsPreferencesCookie({ range: "last_30", data: "demo" });
    const stored = resolveInsightsCookiePreferences(cookie, undefined);
    assert.deepEqual(mergeInsightsPreferences(stored, { data: "live" }), {
      range: "last_30", data: "live",
    });
    assert.deepEqual(mergeInsightsPreferences(stored, { data: "empty", queue: "expired" }), {
      range: "last_30", data: "empty",
    });
    assert.equal(insightsCookieValue(
      `other=1; wmc_insights_prefs_v2=${cookie}; x=2`, "wmc_insights_prefs_v2",
    ), cookie);
  });

  it("does not alter QA11's repaired authority-tier imports or roster sections", () => {
    for (const route of ["/admin/practitioner-authority", "/admin/service-authority"]) {
      const source = readDashboard(pageByRoute[route]);
      assert.match(source, /AUTHORITY_TIER_FRIENDLY/);
      assert.match(source, /filterRowsByTier\(/);
      assert.match(source, /tierFilter\s*\?\s*`/);
    }
  });
});
