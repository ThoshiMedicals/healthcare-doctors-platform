import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifyAuthorityTier } from "@/measurement/authority-framework";
import { buildExecutiveFixtureEvents } from "@/measurement/fixtures";
import { buildPracticePractitionerAuthorityDashboard } from "@/measurement/practitioner-authority-report";
import { containsRawQueryField } from "@/measurement/sanitize";
import type { PractitionerAuthoritySignals } from "@/measurement/authority-framework";
import type { RawMeasurementEvent } from "@/measurement/types";

const sampleSignals: PractitionerAuthoritySignals[] = [
  {
    slug: "dr-tanya-goodwill",
    url: "doctors/dr-tanya-goodwill.html",
    title: "Dr Tanya Goodwill",
    practitioner_links: 20,
    inbound_article_links: 12,
    related_services: 8,
    ...classifyAuthorityTier({ practitioner_links: 20, inbound_article_links: 12, related_services: 8 }),
  },
  {
    slug: "dr-sumita-singh",
    url: "doctors/dr-sumita-singh.html",
    title: "Dr Sumita Singh",
    practitioner_links: 8,
    inbound_article_links: 3,
    related_services: 4,
    ...classifyAuthorityTier({ practitioner_links: 8, inbound_article_links: 3, related_services: 4 }),
  },
  {
    slug: "dr-anand-singh",
    url: "doctors/dr-anand-singh.html",
    title: "Dr Anand Singh",
    practitioner_links: 2,
    inbound_article_links: 0,
    related_services: 1,
    ...classifyAuthorityTier({ practitioner_links: 2, inbound_article_links: 0, related_services: 1 }),
  },
];

describe("practitioner authority framework (3D)", () => {
  it("classifies Hub, Developing, and Thin from authority signals", () => {
    assert.equal(classifyAuthorityTier({ practitioner_links: 20, inbound_article_links: 20, related_services: 10 }).tier, "Hub");
    assert.equal(classifyAuthorityTier({ practitioner_links: 8, inbound_article_links: 3, related_services: 4 }).tier, "Developing");
    assert.equal(classifyAuthorityTier({ practitioner_links: 2, inbound_article_links: 0, related_services: 1 }).tier, "Thin");
  });
});

describe("practice practitioner authority dashboard (3D)", () => {
  it("shows profile views, bookings, calls, contact rate, DR metrics, and ranks", () => {
    const now = new Date("2026-10-26T02:00:00.000Z");
    const report = buildPracticePractitionerAuthorityDashboard(
      buildExecutiveFixtureEvents(now),
      sampleSignals,
      "last_7",
      now,
    );

    assert.equal(report.dashboard, "practitioner_authority");
    assert.ok(report.practitioners.length >= 3);
    assert.ok(report.tier_counts.Hub + report.tier_counts.Developing + report.tier_counts.Thin >= 3);
    assert.ok(report.totals.profile_views > 0);
    assert.ok(["up", "down", "flat"].includes(report.trends.profile_views.direction));
    assert.ok(["up", "down", "flat"].includes(report.trends.booking_intent.direction));
    assert.ok(["up", "down", "flat"].includes(report.trends.contact_rate.direction));

    const tanya = report.practitioners.find((row) => row.slug === "dr-tanya-goodwill");
    assert.ok(tanya);
    assert.ok(tanya!.profile_views > 0);
    assert.ok(tanya!.booking_clicks >= 0);
    assert.ok(tanya!.call_clicks >= 0);
    assert.equal(typeof tanya!.contact_rate === "number" || tanya!.contact_rate === null, true);
    assert.equal(typeof tanya!.booking_intent === "number" || tanya!.booking_intent === null, true);
    assert.ok(tanya!.signals.practitioner_links >= 0);
    assert.ok(tanya!.digital_reception_recommendations >= 0);
    assert.ok(tanya!.digital_reception_selections >= 0);
    assert.ok(["up", "down", "flat"].includes(tanya!.trends.profile_views.direction));
    assert.ok(["up", "down", "flat"].includes(tanya!.trends.contact_rate.direction));
    assert.ok(["up", "down", "flat"].includes(tanya!.trends.booking_intent.direction));

    assert.equal(report.ranked_by_profile_views.length, report.practitioners.length);
    assert.equal(report.ranked_by_contact_rate.length, report.practitioners.length);
    assert.equal(report.ranked_by_booking_intent.length, report.practitioners.length);

    for (let i = 1; i < report.ranked_by_contact_rate.length; i++) {
      const prev = report.ranked_by_contact_rate[i - 1].contact_rate ?? -1;
      const curr = report.ranked_by_contact_rate[i].contact_rate ?? -1;
      assert.ok(prev >= curr);
    }
    for (let i = 1; i < report.ranked_by_profile_views.length; i++) {
      assert.ok(
        report.ranked_by_profile_views[i - 1].profile_views >= report.ranked_by_profile_views[i].profile_views,
      );
    }

    assert.equal(containsRawQueryField(report), false);
  });

  it("attributes Digital Reception recommendations and selections by session", () => {
    const events: RawMeasurementEvent[] = [
      {
        event: "digital_reception_open",
        measurement_version: "2G",
        ts: "2026-10-25T01:00:00.000Z",
        session_id: "dr_session",
        page_path: "index.html",
        page_group: "home",
      },
      {
        event: "digital_reception_result_click",
        measurement_version: "2G",
        ts: "2026-10-25T01:01:00.000Z",
        session_id: "dr_session",
        page_path: "doctors/dr-tanya-goodwill.html",
        page_group: "practitioner",
        step: "practitioner",
        practitioner: "dr-tanya-goodwill",
      },
      {
        event: "page_view",
        measurement_version: "2G",
        ts: "2026-10-25T01:02:00.000Z",
        session_id: "dr_session",
        page_path: "doctors/dr-tanya-goodwill.html",
        page_group: "practitioner",
        practitioner: "dr-tanya-goodwill",
      },
      {
        event: "book_appointment_click",
        measurement_version: "2G",
        ts: "2026-10-25T01:03:00.000Z",
        session_id: "dr_session",
        page_path: "doctors/dr-tanya-goodwill.html",
        page_group: "practitioner",
        placement: "digital_reception",
        destination: "practitioner",
        practitioner: "dr-tanya-goodwill",
      },
      {
        event: "page_view",
        measurement_version: "2G",
        ts: "2026-10-25T02:00:00.000Z",
        session_id: "direct_session",
        page_path: "doctors/dr-sumita-singh.html",
        page_group: "practitioner",
        practitioner: "dr-sumita-singh",
      },
      {
        event: "book_appointment_click",
        measurement_version: "2G",
        ts: "2026-10-25T02:01:00.000Z",
        session_id: "direct_session",
        page_path: "doctors/dr-sumita-singh.html",
        page_group: "practitioner",
        placement: "profile",
        destination: "practitioner",
        practitioner: "dr-sumita-singh",
      },
    ];

    const report = buildPracticePractitionerAuthorityDashboard(
      events,
      sampleSignals,
      "last_7",
      new Date("2026-10-26T02:00:00.000Z"),
    );

    const tanya = report.practitioners.find((row) => row.slug === "dr-tanya-goodwill")!;
    const sumita = report.practitioners.find((row) => row.slug === "dr-sumita-singh")!;

    assert.ok(tanya.digital_reception_recommendations >= 1);
    assert.equal(tanya.digital_reception_selections, 1);
    assert.equal(tanya.booking_clicks, 1);
    assert.equal(tanya.profile_views, 1);
    assert.equal(tanya.contact_rate, 100);

    assert.equal(sumita.digital_reception_recommendations, 0);
    assert.equal(sumita.digital_reception_selections, 0);
    assert.equal(sumita.booking_clicks, 1);
    assert.equal(sumita.booking_intent, 100);
  });

  it("highlights Hub Developing Thin tiers on ranked rows", () => {
    const now = new Date("2026-10-26T02:00:00.000Z");
    const report = buildPracticePractitionerAuthorityDashboard(
      buildExecutiveFixtureEvents(now),
      sampleSignals,
      "last_7",
      now,
    );
    const tiers = new Set(report.ranked_by_contact_rate.map((row) => row.tier));
    assert.ok(tiers.has("Hub"));
    assert.ok(tiers.has("Developing"));
    assert.ok(tiers.has("Thin"));
  });
});
