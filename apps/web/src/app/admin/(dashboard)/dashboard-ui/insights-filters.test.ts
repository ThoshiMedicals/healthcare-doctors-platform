import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  clearInsightsFocus,
  insightsFiltersLabel,
  matchFocusKey,
  mergeInsightsFilters,
  parseInsightsFilters,
  parseInsightsFiltersCookie,
  serializeInsightsFiltersCookie,
  withInsightsQuery,
} from "./insights-filters";
import {
  conversionIntelligenceHref,
  digitalReceptionHref,
  governanceReviewHref,
  insightsNavItems,
  practitionerAuthorityHref,
  serviceAuthorityHref,
} from "./links";

describe("persistent insights filters (C5)", () => {
  it("parses practitioner / service / queue / tier / health focus from search params", () => {
    assert.deepEqual(
      parseInsightsFilters({
        range: "last_7",
        practitioner: "dr-tanya-goodwill",
        service: "telehealth",
        queue: "expired",
        tier: "Thin",
        health: "governance",
      }),
      {
        range: "last_7",
        practitioner: "dr-tanya-goodwill",
        service: "telehealth",
        queue: "expired",
        tier: "Thin",
        health: "governance",
      },
    );
    assert.equal(
      parseInsightsFilters({ focus: "dr-tanya", focusAs: "practitioner" }).practitioner,
      "dr-tanya",
    );
    assert.equal(parseInsightsFilters({ focus: "skin-check", focusAs: "service" }).service, "skin-check");
  });

  it("merges cookie + URL with URL winning", () => {
    const merged = mergeInsightsFilters(
      { range: "last_30", practitioner: "dr-a", service: "fees" },
      { range: "last_7", practitioner: "dr-b" },
    );
    assert.deepEqual(merged, {
      range: "last_7",
      practitioner: "dr-b",
      service: "fees",
      queue: undefined,
      data: undefined,
      tier: undefined,
      health: undefined,
      intent: undefined,
      from: undefined,
    });
  });

  it("round-trips cookie serialization", () => {
    const raw = serializeInsightsFiltersCookie({
      range: "mtd",
      service: "womens-health",
      queue: "due_soon",
    });
    assert.deepEqual(parseInsightsFiltersCookie(raw), {
      range: "mtd",
      service: "womens-health",
      queue: "due_soon",
    });
  });

  it("carries focus across Practitioner → Conversion and Service → DR hrefs", () => {
    assert.match(
      conversionIntelligenceHref({
        range: "last_7",
        practitioner: "dr-tanya-goodwill",
      }),
      /practitioner=dr-tanya-goodwill/,
    );
    assert.match(
      conversionIntelligenceHref({ range: "last_7", service: "telehealth" }),
      /service=telehealth/,
    );
    assert.match(
      digitalReceptionHref({ range: "last_30", service: "skin-check" }),
      /service=skin-check/,
    );
    assert.match(
      practitionerAuthorityHref({
        range: "last_7",
        focus: "dr-tanya-goodwill",
        filters: { service: "telehealth" },
      }),
      /focus=dr-tanya-goodwill/,
    );
    assert.match(
      serviceAuthorityHref({
        range: "last_7",
        focus: "telehealth",
        filters: { practitioner: "dr-tanya-goodwill" },
      }),
      /focus=telehealth/,
    );
  });

  it("opens governance review records with the active queue", () => {
    assert.equal(
      governanceReviewHref({ queue: "expired" }),
      "/admin/governance?queue=expired#gov-focus",
    );
    assert.match(insightsFiltersLabel({ queue: "expired" }), /Expired/);
    assert.deepEqual(
      clearInsightsFocus({
        range: "last_7",
        practitioner: "x",
        queue: "expired",
        tier: "Thin",
        health: "conversion",
      }),
      {
        range: "last_7",
      },
    );
    assert.match(insightsFiltersLabel({ health: "search" }), /Search/);
  });

  it("builds practitioner / service tier investigation hrefs into the roster", () => {
    assert.match(
      practitionerAuthorityHref({
        range: "last_7",
        tier: "Thin",
        filters: { data: "demo" },
      }),
      /tier=Thin/,
    );
    assert.match(
      practitionerAuthorityHref({
        range: "last_7",
        tier: "Developing",
      }),
      /#pa-roster$/,
    );
    assert.match(
      serviceAuthorityHref({
        range: "last_30",
        tier: "Hub",
      }),
      /tier=Hub/,
    );
    assert.match(
      serviceAuthorityHref({
        range: "last_30",
        tier: "Hub",
      }),
      /#sa-roster$/,
    );
    assert.match(insightsFiltersLabel({ tier: "Thin" }), /Needs more links/);
  });

  it("uses overview rather than investigation semantics in the Insights nav strip", () => {
    const items = insightsNavItems({
      range: "last_7",
      practitioner: "dr-tanya-goodwill",
      service: "telehealth",
    });
    const conversion = items.find((item) => item.id === "conversion-intelligence");
    const dr = items.find((item) => item.id === "digital-reception");
    assert.ok(conversion?.href.includes("range=last_7"));
    for (const item of items) {
      assert.doesNotMatch(item.href, /(?:practitioner|service|queue|tier|health|intent|from)=/);
    }
    assert.ok(dr?.href.includes("range=last_7"));
  });

  it("sanitises outgoing links for their destination without changing inbound parsing", () => {
    assert.equal(withInsightsQuery("/admin/executive", {
      range: "last_7", data: "demo", queue: "expired", from: "queue", health: "governance",
    }), "/admin/executive?range=last_7&data=demo");
    assert.equal(withInsightsQuery("/admin/digital-reception", {
      range: "last_30", data: "live", queue: "expired", intent: "vaccination", from: "queue",
    }), "/admin/digital-reception?range=last_30&data=live&intent=vaccination");
    assert.equal(withInsightsQuery("/admin/digital-reception", {
      intent: "vaccination", from: "chart", health: "search",
    }), "/admin/digital-reception?health=search&intent=vaccination&from=chart");
    assert.equal(withInsightsQuery("/admin/practitioner-authority", {
      practitioner: "dr-a", service: "telehealth", tier: "Thin", from: "chart",
    }, { practitionerAsFocus: true, hash: "pa-roster" }),
    "/admin/practitioner-authority?focus=dr-a&tier=Thin&from=chart#pa-roster");
    assert.equal(withInsightsQuery("/admin/users", { queue: "expired" }), "/admin/users");
  });

  it("supports explicit overview and investigation navigation contracts", () => {
    const filters = { range: "last_7" as const, data: "demo" as const, service: "telehealth", from: "chart" as const };
    assert.equal(withInsightsQuery("/admin/digital-reception", filters, { navigationIntent: "overview" }),
      "/admin/digital-reception?range=last_7&data=demo");
    assert.equal(withInsightsQuery("/admin/digital-reception", filters, { navigationIntent: "investigation" }),
      "/admin/digital-reception?range=last_7&service=telehealth&data=demo&from=chart");
  });

  it("preserves a valid monthly window when changing data mode", () => {
    assert.equal(withInsightsQuery(
      "/admin/executive/monthly?month=2026-10#summary",
      { range: "last_30", data: "demo", queue: "expired", from: "queue" },
    ), "/admin/executive/monthly?month=2026-10&data=demo#summary");
    assert.equal(withInsightsQuery("/admin/executive/monthly", { data: "live" }, { month: "2026-09" }),
      "/admin/executive/monthly?month=2026-09&data=live");
    assert.equal(withInsightsQuery("/admin/executive/monthly?month=2026-13", { data: "demo" }),
      "/admin/executive/monthly?data=demo");
    assert.equal(withInsightsQuery("/admin/digital-reception?month=2026-10&queue=expired", { data: "demo" }),
      "/admin/digital-reception?data=demo");
  });

  it("preserves validated legacy focus parsing without changing Phase 1 runtime", () => {
    const practitioner = parseInsightsFilters({
      practitioner: "dr-explicit", focus: "dr-legacy", focusAs: "practitioner",
    });
    assert.equal(practitioner.practitioner, "dr-explicit");
    assert.equal(parseInsightsFilters({ focus: "telehealth", focusAs: "service" }).service, "telehealth");
    assert.deepEqual(parseInsightsFilters({ queue: "invalid", tier: "invalid", health: "invalid", from: "invalid" }), {});
  });

  it("matches focus keys loosely for destination filtering", () => {
    assert.equal(matchFocusKey("services/telehealth.html", "telehealth"), true);
    assert.equal(matchFocusKey("telehealth", "services/telehealth"), true);
    assert.equal(matchFocusKey("fees", "telehealth"), false);
  });
});
