import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifyServiceAuthorityTier } from "@/measurement/authority-framework";
import type { ServiceAuthoritySignals } from "@/measurement/authority-framework";
import { buildExecutiveFixtureEvents } from "@/measurement/fixtures";
import { containsRawQueryField } from "@/measurement/sanitize";
import { buildPracticeServiceAuthorityDashboard } from "@/measurement/service-authority-report";
import type { RawMeasurementEvent } from "@/measurement/types";

const sampleSignals: ServiceAuthoritySignals[] = [
  {
    slug: "family-health",
    url: "services/family-health.html",
    title: "Family Health",
    related_practitioners: 9,
    related_knowledge: 12,
    related_services: 6,
    inbound_article_links: 20,
    inbound_practitioner_links: 10,
    ...classifyServiceAuthorityTier({
      related_practitioners: 9,
      related_knowledge: 12,
      related_services: 6,
      inbound_article_links: 20,
      inbound_practitioner_links: 10,
    }),
  },
  {
    slug: "skin-checks",
    url: "services/skin-checks.html",
    title: "Skin Checks",
    related_practitioners: 3,
    related_knowledge: 4,
    related_services: 3,
    inbound_article_links: 2,
    inbound_practitioner_links: 2,
    ...classifyServiceAuthorityTier({
      related_practitioners: 3,
      related_knowledge: 4,
      related_services: 3,
      inbound_article_links: 2,
      inbound_practitioner_links: 2,
    }),
  },
  {
    slug: "ear-care-ear-syringing",
    url: "services/ear-care-ear-syringing.html",
    title: "Ear Care & Ear Syringing",
    related_practitioners: 0,
    related_knowledge: 1,
    related_services: 2,
    inbound_article_links: 1,
    inbound_practitioner_links: 0,
    ...classifyServiceAuthorityTier({
      related_practitioners: 0,
      related_knowledge: 1,
      related_services: 2,
      inbound_article_links: 1,
      inbound_practitioner_links: 0,
    }),
  },
];

describe("service authority framework (3E)", () => {
  it("classifies Hub, Developing, and Thin from service authority signals", () => {
    assert.equal(
      classifyServiceAuthorityTier({
        related_practitioners: 9,
        related_knowledge: 12,
        related_services: 6,
        inbound_article_links: 20,
        inbound_practitioner_links: 10,
      }).tier,
      "Hub",
    );
    assert.equal(
      classifyServiceAuthorityTier({
        related_practitioners: 3,
        related_knowledge: 4,
        related_services: 3,
        inbound_article_links: 2,
        inbound_practitioner_links: 2,
      }).tier,
      "Developing",
    );
    assert.equal(
      classifyServiceAuthorityTier({
        related_practitioners: 0,
        related_knowledge: 1,
        related_services: 2,
        inbound_article_links: 1,
        inbound_practitioner_links: 0,
      }).tier,
      "Thin",
    );
  });
});

describe("practice service authority dashboard (3E)", () => {
  it("shows views, bookings, calls, contact rate, DR metrics, and ranks", () => {
    const now = new Date("2026-10-26T02:00:00.000Z");
    const report = buildPracticeServiceAuthorityDashboard(
      buildExecutiveFixtureEvents(now),
      sampleSignals,
      "last_7",
      now,
    );

    assert.equal(report.dashboard, "service_authority");
    assert.ok(report.services.length >= 3);
    assert.ok(report.tier_counts.Hub + report.tier_counts.Developing + report.tier_counts.Thin >= 3);
    assert.ok(report.totals.service_views > 0);
    assert.equal(report.conversion_by_tier.length, 3);
    assert.deepEqual(
      report.conversion_by_tier.map((slice) => slice.tier),
      ["Hub", "Developing", "Thin"],
    );
    const shareSum = report.conversion_by_tier.reduce((sum, slice) => sum + slice.views_share, 0);
    assert.ok(shareSum === 0 || Math.abs(shareSum - 100) < 0.2);

    const family = report.services.find((row) => row.slug === "family-health");
    assert.ok(family);
    assert.ok(family!.service_views > 0);
    assert.equal(typeof family!.contact_rate === "number" || family!.contact_rate === null, true);
    assert.equal(typeof family!.booking_intent === "number" || family!.booking_intent === null, true);
    assert.ok(family!.related_knowledge_hub_clicks >= 0);
    assert.ok(family!.practitioner_clicks >= 0);
    assert.ok(family!.digital_reception_entrances >= 0);
    assert.ok(family!.digital_reception_outcomes >= 0);

    assert.equal(report.ranked_by_views.length, report.services.length);
    assert.equal(report.ranked_by_contact_rate.length, report.services.length);
    assert.equal(report.ranked_by_booking_intent.length, report.services.length);
    assert.equal(report.ranked_by_digital_reception.length, report.services.length);

    for (let i = 1; i < report.ranked_by_views.length; i++) {
      assert.ok(report.ranked_by_views[i - 1].service_views >= report.ranked_by_views[i].service_views);
    }
    for (let i = 1; i < report.ranked_by_contact_rate.length; i++) {
      const prev = report.ranked_by_contact_rate[i - 1].contact_rate ?? -1;
      const curr = report.ranked_by_contact_rate[i].contact_rate ?? -1;
      assert.ok(prev >= curr);
    }
    for (let i = 1; i < report.ranked_by_digital_reception.length; i++) {
      assert.ok(
        report.ranked_by_digital_reception[i - 1].digital_reception_entrances >=
          report.ranked_by_digital_reception[i].digital_reception_entrances,
      );
    }

    assert.equal(containsRawQueryField(report), false);
  });

  it("attributes knowledge, practitioner, and Digital Reception metrics by session", () => {
    const events: RawMeasurementEvent[] = [
      {
        event: "digital_reception_open",
        measurement_version: "2G",
        ts: "2026-10-25T01:00:00.000Z",
        session_id: "svc_session",
        page_path: "index.html",
        page_group: "home",
      },
      {
        event: "digital_reception_result_click",
        measurement_version: "2G",
        ts: "2026-10-25T01:01:00.000Z",
        session_id: "svc_session",
        page_path: "services/skin-checks.html",
        page_group: "service",
        step: "service",
      },
      {
        event: "page_view",
        measurement_version: "2G",
        ts: "2026-10-25T01:02:00.000Z",
        session_id: "svc_session",
        page_path: "services/skin-checks.html",
        page_group: "service",
      },
      {
        event: "page_view",
        measurement_version: "2G",
        ts: "2026-10-25T01:03:00.000Z",
        session_id: "svc_session",
        page_path: "knowledge/articles/when-should-i-book-a-skin-check.html",
        page_group: "advice_article",
      },
      {
        event: "page_view",
        measurement_version: "2G",
        ts: "2026-10-25T01:04:00.000Z",
        session_id: "svc_session",
        page_path: "doctors/dr-tanya-goodwill.html",
        page_group: "practitioner",
        practitioner: "dr-tanya-goodwill",
      },
      {
        event: "book_appointment_click",
        measurement_version: "2G",
        ts: "2026-10-25T01:05:00.000Z",
        session_id: "svc_session",
        page_path: "services/skin-checks.html",
        page_group: "service",
        placement: "digital_reception",
        destination: "clinic_list",
      },
      {
        event: "page_view",
        measurement_version: "2G",
        ts: "2026-10-25T02:00:00.000Z",
        session_id: "direct_session",
        page_path: "services/family-health.html",
        page_group: "service",
      },
      {
        event: "book_appointment_click",
        measurement_version: "2G",
        ts: "2026-10-25T02:01:00.000Z",
        session_id: "direct_session",
        page_path: "services/family-health.html",
        page_group: "service",
        placement: "hero",
        destination: "clinic_list",
      },
    ];

    const report = buildPracticeServiceAuthorityDashboard(
      events,
      sampleSignals,
      "last_7",
      new Date("2026-10-26T02:00:00.000Z"),
    );

    const skin = report.services.find((row) => row.slug === "skin-checks")!;
    const family = report.services.find((row) => row.slug === "family-health")!;

    assert.ok(skin.digital_reception_entrances >= 1);
    assert.equal(skin.digital_reception_outcomes, 1);
    assert.equal(skin.related_knowledge_hub_clicks, 1);
    assert.equal(skin.practitioner_clicks, 1);
    assert.equal(skin.booking_clicks, 1);
    assert.equal(skin.contact_rate, 100);

    assert.equal(family.digital_reception_entrances, 0);
    assert.equal(family.digital_reception_outcomes, 0);
    assert.equal(family.related_knowledge_hub_clicks, 0);
    assert.equal(family.practitioner_clicks, 0);
    assert.equal(family.booking_intent, 100);
  });

  it("highlights Hub Developing Thin tiers on ranked rows", () => {
    const now = new Date("2026-10-26T02:00:00.000Z");
    const report = buildPracticeServiceAuthorityDashboard(
      buildExecutiveFixtureEvents(now),
      sampleSignals,
      "last_7",
      now,
    );
    const tiers = new Set(report.ranked_by_views.map((row) => row.tier));
    assert.ok(tiers.has("Hub"));
    assert.ok(tiers.has("Developing"));
    assert.ok(tiers.has("Thin"));
  });
});
