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

  it("propagates filters through the Insights nav strip", () => {
    const items = insightsNavItems({
      range: "last_7",
      practitioner: "dr-tanya-goodwill",
      service: "telehealth",
    });
    const conversion = items.find((item) => item.id === "conversion-intelligence");
    const dr = items.find((item) => item.id === "digital-reception");
    assert.ok(conversion?.href.includes("practitioner=dr-tanya-goodwill"));
    assert.ok(conversion?.href.includes("service=telehealth"));
    assert.ok(dr?.href.includes("service=telehealth"));
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
