import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  INSIGHTS_FILTERS_COOKIE,
  parseInsightsFiltersCookie,
  type InsightsFilters,
} from "./insights-filters";
import {
  INSIGHTS_PREFERENCES_COOKIE,
  INSIGHTS_PREFERENCES_COOKIE_MAX_AGE,
  INSIGHTS_PREFERENCES_VERSION,
  insightsCookieValue,
  mergeInsightsPreferences,
  insightsPreferenceCookieWrites,
  insightsPreferencesWriteConfirmed,
  parseInsightsPreferencesCookie,
  pickInsightsPreferences,
  resolveInsightsCookiePreferences,
  serializeInsightsPreferencesCookie,
} from "./insights-preferences";
import { resolveInsightsFilterState } from "./resolve-insights-filter-state";

const oldFilters: InsightsFilters = {
  range: "last_30",
  data: "demo",
  practitioner: "dr-a",
  service: "telehealth",
  queue: "expired",
  tier: "Thin",
  health: "governance",
  intent: "vaccination",
  from: "queue",
};
const legacyRaw = encodeURIComponent(JSON.stringify(oldFilters));

describe("FP-03 Phase 4 v2 preference cookie migration", () => {
  it("merges missing range preferences on non-range dashboards without storing investigation focus", () => {
    const saved = { range: "last_30" as const, data: "demo" as const };
    const merged = mergeInsightsPreferences(saved, {
      data: "live", queue: "expired", tier: "Thin", from: "queue",
    });
    assert.deepEqual(merged, { range: "last_30", data: "live" });
    assert.deepEqual(mergeInsightsPreferences(saved, { range: "last_7" }), {
      range: "last_7", data: "demo",
    });
    const raw = serializeInsightsPreferencesCookie(merged);
    assert.deepEqual(parseInsightsPreferencesCookie(raw), merged);
  });

  it("reads exact browser cookie keys for safe migration without name-prefix collision", () => {
    const raw = serializeInsightsPreferencesCookie({ range: "last_7" });
    assert.equal(insightsCookieValue(
      `wmc_insights_prefs_v2_fake=ignored; wmc_insights_prefs_v2=${raw}`,
      "wmc_insights_prefs_v2",
    ), raw);
    assert.equal(insightsCookieValue("wmc_insights_prefs_v2_fake=ignored", "wmc_insights_prefs_v2"), undefined);
  });

  it("uses a distinct versioned cookie name and the existing eight-hour lifespan", () => {
    assert.equal(INSIGHTS_PREFERENCES_COOKIE, "wmc_insights_prefs_v2");
    assert.equal(INSIGHTS_PREFERENCES_VERSION, 2);
    assert.equal(INSIGHTS_PREFERENCES_COOKIE_MAX_AGE, 60 * 60 * 8);
    assert.equal(INSIGHTS_FILTERS_COOKIE, "wmc_insights_filters");
  });

  it("serializes exactly version/range/data, never investigation state", () => {
    const json = JSON.parse(decodeURIComponent(serializeInsightsPreferencesCookie(oldFilters)));
    assert.deepEqual(json, { version: 2, range: "last_30", data: "demo" });
    for (const field of ["practitioner", "service", "queue", "tier", "health", "intent", "from"]) {
      assert.equal(Object.hasOwn(json, field), false, field);
    }
    assert.deepEqual(parseInsightsPreferencesCookie(serializeInsightsPreferencesCookie(oldFilters)), {
      range: "last_30", data: "demo",
    });
  });

  it("writes version 2 even with no preferences, preventing stale-cookie resurrection", () => {
    assert.deepEqual(JSON.parse(decodeURIComponent(serializeInsightsPreferencesCookie({}))), { version: 2 });
    assert.deepEqual(parseInsightsPreferencesCookie(serializeInsightsPreferencesCookie({})), {});
    assert.deepEqual(resolveInsightsCookiePreferences(serializeInsightsPreferencesCookie({}), legacyRaw), {});
  });

  it("only migrates valid legacy range/data when v2 is absent", () => {
    assert.deepEqual(resolveInsightsCookiePreferences(undefined, legacyRaw), {
      range: "last_30", data: "demo",
    });
    assert.deepEqual(resolveInsightsCookiePreferences(null, legacyRaw), {
      range: "last_30", data: "demo",
    });
    assert.equal(parseInsightsFiltersCookie(legacyRaw).queue, "expired"); // Old parser stays compatible.
  });

  it("gives valid v2 preferences precedence over contradictory legacy values", () => {
    const v2 = serializeInsightsPreferencesCookie({ range: "mtd", data: "live" });
    assert.deepEqual(resolveInsightsCookiePreferences(v2, legacyRaw), {
      range: "mtd", data: "live",
    });
  });

  it("does not mix individual fields from legacy when v2 exists", () => {
    const v2 = serializeInsightsPreferencesCookie({ data: "empty" });
    assert.deepEqual(resolveInsightsCookiePreferences(v2, legacyRaw), { data: "empty" });
  });

  it("does not fall back to the legacy cookie when a malformed v2 cookie is present", () => {
    for (const bad of ["", "bad-json", "%E0%A4%A", encodeURIComponent("{}"),
      encodeURIComponent('{"version":1,"range":"mtd"}'),
      encodeURIComponent('{"version":"2","data":"live"}'),
      encodeURIComponent("null"),
      encodeURIComponent("[]")]) {
      assert.deepEqual(resolveInsightsCookiePreferences(bad, legacyRaw), {}, bad);
    }
  });

  it("validates v2 preference values and ignores extra keys", () => {
    const raw = encodeURIComponent(JSON.stringify({
      version: 2, range: "not-a-range", data: "not-a-mode",
      queue: "expired", practitioner: "dr-a",
    }));
    assert.deepEqual(parseInsightsPreferencesCookie(raw), {});
    assert.deepEqual(pickInsightsPreferences(oldFilters), { range: "last_30", data: "demo" });
  });

  it("ignores bad legacy values without discarding another valid preference", () => {
    const raw = encodeURIComponent(JSON.stringify({
      range: "invalid", data: "live", queue: "expired", health: "governance",
    }));
    assert.deepEqual(resolveInsightsCookiePreferences(undefined, raw), { data: "live" });
    assert.deepEqual(resolveInsightsCookiePreferences(undefined, "not-json"), {});
  });

  it("writes the v2 cookie first and expires the legacy cookie on the same path", () => {
    const [v2, legacy] = insightsPreferenceCookieWrites(oldFilters, false);
    assert.match(v2, /^wmc_insights_prefs_v2=/);
    assert.match(v2, /; Path=\/admin; Max-Age=28800; SameSite=Lax$/);
    assert.equal(legacy, "wmc_insights_filters=; Path=/admin; Max-Age=0; SameSite=Lax");
    assert.doesNotMatch(v2, /practitioner|service|queue|health|intent|tier|from/);
    assert.deepEqual(parseInsightsPreferencesCookie(v2.split(";")[0].split("=")[1]), {
      range: "last_30", data: "demo",
    });
  });

  it("retires legacy only when the exact v2 preference value is confirmed", () => {
    const [directive] = insightsPreferenceCookieWrites(oldFilters, true);
    const storedPair = directive.split(";")[0];
    assert.equal(insightsPreferencesWriteConfirmed("other=1; " + storedPair, oldFilters), true);
    assert.equal(insightsPreferencesWriteConfirmed("other=1", oldFilters), false);
    assert.equal(insightsPreferencesWriteConfirmed(storedPair, { range: "mtd" }), false);
    assert.equal(insightsPreferencesWriteConfirmed("wmc_insights_prefs_v2_fake=x; " + storedPair, oldFilters), true);
    assert.equal(insightsPreferencesWriteConfirmed("wmc_insights_prefs_v2_fake=x", oldFilters), false);
  });

  it("sets Secure only for HTTPS while keeping same-site scope", () => {
    const [v2, legacy] = insightsPreferenceCookieWrites({}, true);
    assert.match(v2, /; SameSite=Lax; Secure$/);
    assert.match(legacy, /; SameSite=Lax; Secure$/);
    const [v2Http, legacyHttp] = insightsPreferenceCookieWrites({}, false);
    assert.doesNotMatch(v2Http + legacyHttp, /Secure/);
  });

  it("does not rehydrate focus after refresh with v2, even when legacy was present", () => {
    const preferences = resolveInsightsCookiePreferences(
      serializeInsightsPreferencesCookie({ range: "last_7", data: "live" }),
      legacyRaw,
    );
    assert.deepEqual(resolveInsightsFilterState({}, preferences, "/admin/governance/management"), {
      data: "live",
    });
    assert.deepEqual(resolveInsightsFilterState({}, preferences, "/admin/digital-reception"), {
      range: "last_7", data: "live",
    });
  });

  it("keeps explicit URL investigations and URL preferences authoritative", () => {
    const preferences = resolveInsightsCookiePreferences(undefined, legacyRaw);
    assert.deepEqual(resolveInsightsFilterState({
      range: "last_7", data: "live", intent: "vaccination", from: "chart",
    }, preferences, "/admin/digital-reception"), {
      range: "last_7", data: "live", intent: "vaccination", from: "chart",
    });
    assert.deepEqual(resolveInsightsFilterState({
      queue: "due_soon", from: "queue",
    }, preferences, "/admin/governance/management"), {
      data: "demo", queue: "due_soon", from: "queue",
    });
  });

  it("never places investigation state into the cookie, even with focus-only filters", () => {
    const [v2] = insightsPreferenceCookieWrites({
      practitioner: "dr-a", queue: "expired", tier: "Thin", from: "queue",
    }, true);
    assert.deepEqual(parseInsightsPreferencesCookie(v2.split(";")[0].split("=")[1]), {});
    assert.deepEqual(JSON.parse(decodeURIComponent(v2.split(";")[0].split("=")[1])), { version: 2 });
  });
});
