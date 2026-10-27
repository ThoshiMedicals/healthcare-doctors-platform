import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildPracticeConversionIntelligenceReport } from "@/measurement/conversion-intelligence-report";
import { buildExecutiveFixtureEvents } from "@/measurement/fixtures";
import { containsRawQueryField } from "@/measurement/sanitize";
import type { RawMeasurementEvent } from "@/measurement/types";

describe("practice conversion intelligence (3F)", () => {
  it("tracks Visitor → Search → Service → Practitioner → Booking and ranks converters", () => {
    const now = new Date("2026-10-26T02:00:00.000Z");
    const report = buildPracticeConversionIntelligenceReport(buildExecutiveFixtureEvents(now), "last_7", now);

    assert.equal(report.dashboard, "conversion_intelligence");
    assert.deepEqual(
      report.funnel.map((step) => step.key),
      ["visitor", "search", "service", "practitioner", "booking"],
    );
    assert.ok(report.funnel[0].sessions > 0);
    assert.ok(report.funnel[0].sessions >= report.funnel[4].sessions);
    assert.ok(report.funnel.every((step) => step.drop_from_previous === null || typeof step.drop_from_previous === "number"));
    assert.equal(report.funnel.filter((step) => step.bottleneck).length <= 1, true);

    assert.ok(report.highest_converting_practitioners.length >= 0);
    assert.ok(report.highest_converting_services.length >= 0);
    assert.ok(report.highest_converting_entry_pages.length >= 0);
    assert.ok(Array.isArray(report.lowest_converting_practitioners));
    assert.ok(Array.isArray(report.lowest_converting_services));
    assert.ok(Array.isArray(report.lowest_converting_entry_pages));
    assert.ok(report.highest_exit_pages.length > 0);
    assert.ok(report.highest_abandonment_journeys.length > 0);

    assert.ok(Array.isArray(report.opportunities.weak_booking_paths));
    assert.ok(Array.isArray(report.opportunities.weak_service_journeys));
    assert.ok(Array.isArray(report.opportunities.weak_practitioner_journeys));
    assert.equal(containsRawQueryField(report), false);
  });

  it("identifies drop-off before booking and weak journeys", () => {
    const events: RawMeasurementEvent[] = [];

    // Converting practitioner path
    for (let i = 0; i < 4; i++) {
      const session = `convert_${i}`;
      events.push(
        {
          event: "page_view",
          measurement_version: "2G",
          ts: "2026-10-25T01:00:00.000Z",
          session_id: session,
          page_path: "services/skin-checks.html",
          page_group: "service",
        },
        {
          event: "page_view",
          measurement_version: "2G",
          ts: "2026-10-25T01:01:00.000Z",
          session_id: session,
          page_path: "doctors/dr-tanya-goodwill.html",
          page_group: "practitioner",
          practitioner: "dr-tanya-goodwill",
        },
        {
          event: "book_appointment_click",
          measurement_version: "2G",
          ts: "2026-10-25T01:02:00.000Z",
          session_id: session,
          page_path: "doctors/dr-tanya-goodwill.html",
          page_group: "practitioner",
          placement: "profile",
          destination: "practitioner",
          practitioner: "dr-tanya-goodwill",
        },
      );
    }

    // Weak service journey — search → service, no booking
    for (let i = 0; i < 5; i++) {
      const session = `weak_svc_${i}`;
      events.push(
        {
          event: "page_view",
          measurement_version: "2G",
          ts: "2026-10-25T02:00:00.000Z",
          session_id: session,
          page_path: "fees-billing.html",
          page_group: "patient_information",
        },
        {
          event: "digital_reception_search",
          measurement_version: "2G",
          ts: "2026-10-25T02:01:00.000Z",
          session_id: session,
          page_path: "fees-billing.html",
          page_group: "patient_information",
          intent_bucket: "fees_billing",
          result_type: "care_journey",
          result_count: 2,
        },
        {
          event: "page_view",
          measurement_version: "2G",
          ts: "2026-10-25T02:02:00.000Z",
          session_id: session,
          page_path: "services/mental-health.html",
          page_group: "service",
        },
      );
    }

    // Weak practitioner journey
    for (let i = 0; i < 4; i++) {
      const session = `weak_prac_${i}`;
      events.push({
        event: "page_view",
        measurement_version: "2G",
        ts: "2026-10-25T03:00:00.000Z",
        session_id: session,
        page_path: "doctors/dr-sumita-singh.html",
        page_group: "practitioner",
        practitioner: "dr-sumita-singh",
      });
    }

    const report = buildPracticeConversionIntelligenceReport(
      events,
      "last_7",
      new Date("2026-10-26T02:00:00.000Z"),
    );

    assert.equal(report.funnel.find((s) => s.key === "visitor")?.sessions, 13);
    assert.equal(report.funnel.find((s) => s.key === "booking")?.sessions, 4);

    const tanya = report.highest_converting_practitioners.find((row) => row.key === "dr-tanya-goodwill");
    assert.ok(tanya);
    assert.equal(tanya!.conversion_rate, 100);

    const skin = report.highest_converting_services.find((row) => row.key === "skin-checks");
    assert.ok(skin);
    assert.equal(skin!.conversion_rate, 100);

    assert.ok(report.highest_exit_pages.some((row) => row.path.includes("mental-health") || row.path.includes("sumita")));
    assert.ok(report.highest_abandonment_journeys.some((row) => row.last_stage === "service" || row.last_stage === "practitioner"));

    assert.ok(report.opportunities.weak_service_journeys.some((row) => row.key === "mental-health"));
    assert.ok(report.opportunities.weak_practitioner_journeys.some((row) => row.key === "dr-sumita-singh"));
    assert.ok(report.opportunities.weak_booking_paths.some((row) => row.key.includes("fees-billing")));
  });

  it("never exposes raw query fields", () => {
    const events: RawMeasurementEvent[] = [
      {
        event: "digital_reception_search",
        measurement_version: "2G",
        ts: "2026-10-25T01:00:00.000Z",
        session_id: "q1",
        page_path: "index.html",
        page_group: "home",
        intent_bucket: "diabetes",
        result_type: "care_journey",
        result_count: 1,
        query: "should never appear",
      },
      {
        event: "page_view",
        measurement_version: "2G",
        ts: "2026-10-25T01:01:00.000Z",
        session_id: "q1",
        page_path: "index.html",
        page_group: "home",
      },
    ];
    const report = buildPracticeConversionIntelligenceReport(
      events,
      "last_7",
      new Date("2026-10-26T02:00:00.000Z"),
    );
    assert.equal(containsRawQueryField(report), false);
  });
});
