import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildPracticeDigitalReceptionDashboard,
  resolutionBand,
} from "@/measurement/digital-reception-report";
import { buildExecutiveFixtureEvents } from "@/measurement/fixtures";
import { containsRawQueryField } from "@/measurement/sanitize";
import type { RawMeasurementEvent } from "@/measurement/types";

describe("practice digital reception dashboard (3C)", () => {
  it("reports open rate, searches, resolution, zero-result, funnel, watchlist, and flags", () => {
    const now = new Date("2026-10-26T02:00:00.000Z");
    const report = buildPracticeDigitalReceptionDashboard(buildExecutiveFixtureEvents(now), "last_7", now);

    assert.equal(report.dashboard, "digital_reception_practice");
    assert.ok(report.kpis.opens > 0);
    assert.ok(report.kpis.searches > 0);
    assert.equal(typeof report.kpis.open_rate === "number" || report.kpis.open_rate === null, true);
    assert.equal(typeof report.kpis.resolution_rate === "number" || report.kpis.resolution_rate === null, true);
    assert.equal(typeof report.kpis.zero_result_rate === "number" || report.kpis.zero_result_rate === null, true);
    assert.ok(["green", "amber", "red", "unknown"].includes(report.kpis.resolution_band));

    assert.deepEqual(
      report.funnel.map((step) => step.key),
      ["open", "search", "result_click", "booking", "call"],
    );
    assert.ok(report.funnel[0].count >= report.funnel[1].count || report.funnel[1].count >= 0);

    assert.equal(report.watchlist.length, 3);
    assert.deepEqual(
      report.watchlist.map((row) => row.intent_bucket),
      ["new_patient", "hotdoc_message", "vaccination"],
    );
    for (const row of report.watchlist) {
      assert.ok(["green", "amber", "red", "unknown"].includes(row.resolution_band));
    }
    for (const row of report.top_intent_buckets) {
      assert.equal(row.resolution_band, resolutionBand(row.resolution_rate));
    }

    assert.ok(report.top_intent_buckets.length <= 10);
    assert.ok(report.top_search_destinations.length <= 10);
    assert.equal(containsRawQueryField(report), false);
  });

  it("maps resolution rates to green, amber, and red bands", () => {
    assert.equal(resolutionBand(null), "unknown");
    assert.equal(resolutionBand(70), "green");
    assert.equal(resolutionBand(69.9), "amber");
    assert.equal(resolutionBand(50), "amber");
    assert.equal(resolutionBand(49.9), "red");
  });

  it("flags high-search low-resolution intent buckets", () => {
    const events: RawMeasurementEvent[] = [];
    for (let i = 0; i < 8; i++) {
      events.push({
        event: "digital_reception_search",
        measurement_version: "2G",
        ts: "2026-10-25T01:00:00.000Z",
        session_id: `s${i}`,
        page_path: "index.html",
        page_group: "home",
        intent_bucket: "hotdoc_message",
        result_type: i < 6 ? "no_result" : "care_journey",
        result_count: i < 6 ? 0 : 1,
      });
    }
    for (let i = 0; i < 3; i++) {
      events.push({
        event: "digital_reception_search",
        measurement_version: "2G",
        ts: "2026-10-25T01:00:00.000Z",
        session_id: `t${i}`,
        page_path: "index.html",
        page_group: "home",
        intent_bucket: "skin_check",
        result_type: "care_journey",
        result_count: 2,
      });
    }

    const report = buildPracticeDigitalReceptionDashboard(events, "last_7", new Date("2026-10-26T02:00:00.000Z"));
    const flagged = report.flagged_intents.find((row) => row.intent_bucket === "hotdoc_message");
    assert.ok(flagged);
    assert.equal(flagged?.resolution_band, "red");
    assert.equal(
      report.flagged_intents.some((row) => row.intent_bucket === "skin_check"),
      false,
    );
  });

  it("never exposes raw query fields on destinations or intents", () => {
    const events: RawMeasurementEvent[] = [
      {
        event: "digital_reception_open",
        measurement_version: "2G",
        ts: "2026-10-25T01:00:00.000Z",
        session_id: "s1",
        page_path: "index.html",
        page_group: "home",
      },
      {
        event: "digital_reception_search",
        measurement_version: "2G",
        ts: "2026-10-25T01:01:00.000Z",
        session_id: "s1",
        page_path: "index.html",
        page_group: "home",
        intent_bucket: "new_patient",
        result_type: "direct_page",
        result_count: 1,
        query: "i am a new patient please help",
      },
      {
        event: "digital_reception_result_click",
        measurement_version: "2G",
        ts: "2026-10-25T01:02:00.000Z",
        session_id: "s1",
        page_path: "index.html",
        page_group: "home",
        intent_bucket: "new_patient",
        step: "book",
      },
    ];
    const report = buildPracticeDigitalReceptionDashboard(events, "last_7", new Date("2026-10-26T02:00:00.000Z"));
    assert.equal(containsRawQueryField(report), false);
    assert.equal(report.funnel.find((step) => step.key === "booking")?.count, 1);
    assert.ok(report.watchlist.find((row) => row.intent_bucket === "new_patient")?.searches === 1);
  });
});
