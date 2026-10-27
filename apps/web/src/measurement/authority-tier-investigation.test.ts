import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { PractitionerAuthorityRow } from "@/measurement/practitioner-authority-report";
import type { ServiceAuthorityRow } from "@/measurement/service-authority-report";
import {
  filterRowsByTier,
  investigatePractitionerTier,
  investigateServiceTier,
} from "./authority-tier-investigation";

function practitionerFixture(
  overrides: Partial<PractitionerAuthorityRow> & Pick<PractitionerAuthorityRow, "tier" | "authority_score">,
): PractitionerAuthorityRow {
  return {
    slug: "dr-example",
    title: "Dr Example",
    url: "/doctors/dr-example.html",
    signals: {
      practitioner_links: 1,
      inbound_article_links: 0,
      related_services: 0,
    },
    profile_views: 10,
    booking_clicks: 1,
    call_clicks: 0,
    contact_rate: 10,
    booking_intent: 10,
    digital_reception_recommendations: 0,
    digital_reception_selections: 0,
    trends: {
      profile_views: { current: 10, previous: 10, delta: 0, delta_pct: 0, direction: "flat" },
      booking_intent: { current: 10, previous: 10, delta: 0, delta_pct: 0, direction: "flat" },
      contact_rate: { current: 10, previous: 10, delta: 0, delta_pct: 0, direction: "flat" },
    },
    ...overrides,
  };
}

function serviceFixture(
  overrides: Partial<ServiceAuthorityRow> & Pick<ServiceAuthorityRow, "tier" | "authority_score">,
): ServiceAuthorityRow {
  return {
    slug: "telehealth",
    title: "Telehealth",
    url: "/services/telehealth.html",
    signals: {
      related_practitioners: 0,
      related_knowledge: 0,
      related_services: 0,
      inbound_article_links: 0,
      inbound_practitioner_links: 0,
    },
    service_views: 20,
    booking_clicks: 2,
    call_clicks: 1,
    contact_rate: 15,
    booking_intent: 10,
    related_knowledge_hub_clicks: 0,
    practitioner_clicks: 0,
    digital_reception_entrances: 3,
    digital_reception_outcomes: 1,
    ...overrides,
  };
}

describe("authority tier investigation (D2)", () => {
  it("explains Thin practitioner gaps and recommends add links / services / articles / improve connections", () => {
    const result = investigatePractitionerTier(
      practitionerFixture({
        tier: "Thin",
        authority_score: 6,
        signals: {
          practitioner_links: 1,
          inbound_article_links: 0,
          related_services: 0,
        },
      }),
    );
    assert.equal(result.friendlyLabel, "Needs more links");
    assert.match(result.why, /Score 6/);
    assert.match(result.why, /Needs more links/);
    const ids = result.recommendations.map((r) => r.id);
    assert.ok(ids.includes("add_knowledge_articles"));
    assert.ok(ids.includes("add_services"));
    assert.ok(ids.includes("add_links"));
    assert.ok(ids.includes("improve_connections"));
  });

  it("explains Hub practitioner as well connected without gap language", () => {
    const result = investigatePractitionerTier(
      practitionerFixture({
        tier: "Hub",
        authority_score: 52,
        signals: {
          practitioner_links: 12,
          inbound_article_links: 8,
          related_services: 5,
        },
      }),
    );
    assert.equal(result.friendlyLabel, "Well connected");
    assert.match(result.why, /well linked/i);
    assert.ok(result.recommendations.length >= 1);
  });

  it("recommends practitioners + knowledge for thin services", () => {
    const result = investigateServiceTier(
      serviceFixture({
        tier: "Thin",
        authority_score: 4,
      }),
    );
    assert.equal(result.friendlyLabel, "Needs more links");
    const ids = result.recommendations.map((r) => r.id);
    assert.ok(ids.includes("add_knowledge_articles"));
    assert.ok(ids.includes("add_practitioners"));
    assert.ok(ids.includes("add_services"));
    assert.ok(ids.includes("add_links"));
    assert.ok(ids.includes("improve_connections"));
  });

  it("filters roster rows by tier", () => {
    const rows = [
      practitionerFixture({ slug: "a", tier: "Hub", authority_score: 45 }),
      practitionerFixture({ slug: "b", tier: "Thin", authority_score: 5 }),
      practitionerFixture({ slug: "c", tier: "Developing", authority_score: 20 }),
    ];
    assert.deepEqual(
      filterRowsByTier(rows, "Thin").map((r) => r.slug),
      ["b"],
    );
    assert.equal(filterRowsByTier(rows, null).length, 3);
  });
});
