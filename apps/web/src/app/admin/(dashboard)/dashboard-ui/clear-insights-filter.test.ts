import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { INSIGHTS_DASHBOARD_ROUTES } from "./filter-policy";
import {
  clearInsightsFocus,
  clearInsightsHref,
  type InsightsFilters,
} from "./insights-filters";
import { buildInvestigationBannerModel } from "./investigation";
import {
  parseInsightsPreferencesCookie,
  resolveInsightsCookiePreferences,
  serializeInsightsPreferencesCookie,
} from "./insights-preferences";
import { resolveInsightsFilterState } from "./resolve-insights-filter-state";

const focused: InsightsFilters = {
  range: "last_7",
  data: "demo",
  practitioner: "dr-a",
  service: "telehealth",
  queue: "expired",
  tier: "Thin",
  health: "governance",
  intent: "vaccination",
  from: "recommendation",
};

const focusParameters = ["practitioner", "service", "queue", "tier", "health", "intent", "focus", "from"];

function search(href: string): URLSearchParams {
  return new URL(href, "https://example.test").searchParams;
}

describe("FP-03 Phase 5: clear-filter behaviour", () => {
  it("keeps only range and data when removing every focus dimension", () => {
    const original = { ...focused };
    assert.deepEqual(clearInsightsFocus(focused), { range: "last_7", data: "demo" });
    assert.deepEqual(focused, original, "must not mutate input filters");
  });

  it("validates range and data when clearing malformed runtime state", () => {
    const malformed = { ...focused, range: "not-a-range", data: "not-a-mode" } as unknown as InsightsFilters;
    assert.deepEqual(clearInsightsFocus(malformed), {});
    assert.deepEqual(clearInsightsFocus({ range: "last_30" }), { range: "last_30" });
    assert.deepEqual(clearInsightsFocus({ data: "live" }), { data: "live" });
  });

  it("produces a clean Executive overview with range and data retained", () => {
    assert.equal(clearInsightsHref("/admin/executive", focused),
      "/admin/executive?range=last_7&data=demo");
  });

  it("removes source, unsupported focus, and investigation fragments on Digital Reception", () => {
    const href = clearInsightsHref(
      "/admin/digital-reception?intent=vaccination&service=telehealth&queue=expired&from=chart#intent-vaccination",
      focused,
    );
    assert.equal(href, "/admin/digital-reception?range=last_7&data=demo");
  });

  it("drops every focus dimension on every destination route", () => {
    for (const route of INSIGHTS_DASHBOARD_ROUTES) {
      const href = clearInsightsHref(route, focused);
      const params = search(href);
      for (const key of focusParameters) {
        assert.equal(params.has(key), false, `${route}: ${key}`);
      }
      assert.equal(href.includes("#"), false, `${route}: investigation fragment`);
      assert.equal(params.get("data"), "demo", `${route}: mode`);
      const ownsRange = !route.startsWith("/admin/governance") &&
        route !== "/admin/executive/monthly";
      assert.equal(params.get("range"), ownsRange ? "last_7" : null, `${route}: range policy`);
    }
  });

  it("keeps valid monthly report month from an existing URL while dropping focus and hash", () => {
    assert.equal(clearInsightsHref(
      "/admin/executive/monthly?month=2026-10&health=analytics&from=health#exec-performance",
      focused,
    ), "/admin/executive/monthly?month=2026-10&data=demo");
  });

  it("preserves an explicit monthly period supplied by the banner, without modifying dashboard routes", () => {
    assert.equal(clearInsightsHref("/admin/executive/monthly", focused, { month: "2026-09" }),
      "/admin/executive/monthly?month=2026-09&data=demo");
    assert.equal(clearInsightsHref("/admin/executive/monthly?month=2026-10", focused, { month: "2026-08" }),
      "/admin/executive/monthly?month=2026-08&data=demo");
  });

  it("rejects invalid months and never carries a month into non-monthly routes", () => {
    assert.equal(clearInsightsHref("/admin/executive/monthly?month=2026-13", focused),
      "/admin/executive/monthly?data=demo");
    assert.equal(clearInsightsHref("/admin/executive/monthly", focused, { month: "../2026-10" }),
      "/admin/executive/monthly?data=demo");
    assert.equal(clearInsightsHref("/admin/digital-reception?month=2026-10", focused, { month: "2026-09" }),
      "/admin/digital-reception?range=last_7&data=demo");
  });

  it("preserves governance reporting preferences without projecting an operational range parameter", () => {
    const href = clearInsightsHref("/admin/governance/management?queue=expired#queue-expired", focused);
    assert.equal(href, "/admin/governance/management?data=demo");
    // Governance does not own range as a URL filter; the v2 cookie retains it.
    const preferences = parseInsightsPreferencesCookie(serializeInsightsPreferencesCookie(clearInsightsFocus(focused)));
    assert.deepEqual(preferences, { range: "last_7", data: "demo" });
    const resolved = resolveInsightsFilterState(
      Object.fromEntries(search(href)) as { data?: string },
      preferences,
      "/admin/governance/management",
    );
    assert.deepEqual(resolved, { data: "demo" });
  });

  it("builds banner clear links with no investigation focus or source", () => {
    const banner = buildInvestigationBannerModel({
      pathname: "/admin/practitioner-authority?focus=dr-a&tier=Thin&from=chart#pa-roster",
      filters: focused,
    });
    assert.ok(banner);
    assert.equal(banner.clearHref, "/admin/practitioner-authority?range=last_7&data=demo");
  });

  it("passes the reporting month through the shared investigation banner model", () => {
    const banner = buildInvestigationBannerModel({
      pathname: "/admin/executive/monthly",
      month: "2026-10",
      filters: focused,
    });
    assert.ok(banner);
    assert.equal(banner.clearHref, "/admin/executive/monthly?month=2026-10&data=demo");
  });

  it("does not resurrect investigation focus on refresh with v2 and a retired legacy cookie", () => {
    const v2 = serializeInsightsPreferencesCookie(focused);
    const legacy = encodeURIComponent(JSON.stringify(focused));
    const preferences = resolveInsightsCookiePreferences(v2, legacy);
    const href = clearInsightsHref("/admin/digital-reception", focused);
    const resolved = resolveInsightsFilterState(
      Object.fromEntries(search(href)) as { range?: string; data?: string },
      preferences,
      "/admin/digital-reception",
    );
    assert.deepEqual(resolved, { range: "last_7", data: "demo" });
  });

  it("does not resurrect focus even if v2 is absent and an old cookie remains", () => {
    const legacy = encodeURIComponent(JSON.stringify(focused));
    const preferences = resolveInsightsCookiePreferences(undefined, legacy);
    assert.deepEqual(resolveInsightsFilterState(
      { range: "last_7", data: "demo" },
      preferences,
      "/admin/practitioner-authority",
    ), { range: "last_7", data: "demo" });
  });

  it("allows browser Back to restore an earlier explicit focus without rehydrating cookie focus", () => {
    const preferences = resolveInsightsCookiePreferences(
      serializeInsightsPreferencesCookie(focused),
      undefined,
    );
    const cleared = resolveInsightsFilterState(
      { range: "last_7", data: "demo" },
      preferences,
      "/admin/governance/management",
    );
    assert.deepEqual(cleared, { data: "demo" });
    const restoredByBack = resolveInsightsFilterState(
      { queue: "expired", from: "queue", data: "demo" },
      preferences,
      "/admin/governance/management",
    );
    assert.deepEqual(restoredByBack, { data: "demo", queue: "expired", from: "queue" });
  });
});
