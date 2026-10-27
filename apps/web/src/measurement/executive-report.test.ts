import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { containsRawQueryField } from "@/measurement/sanitize";
import {
  buildPracticeExecutiveDashboard,
  resolvePreviousExecutiveRange,
} from "@/measurement/executive-report";
import { buildExecutiveFixtureEvents } from "@/measurement/fixtures";
import { resolveExecutiveRange } from "@/measurement/ranges";
import type { RawMeasurementEvent } from "@/measurement/types";

describe("practice executive dashboard (3B)", () => {
  it("resolves last 7, last 30, and month-to-date ranges", () => {
    const now = new Date("2026-10-26T02:00:00.000Z");
    assert.deepEqual(resolveExecutiveRange("last_7", now), {
      start: "2026-10-20",
      end: "2026-10-26",
      label: "Last 7 days",
    });
    assert.deepEqual(resolveExecutiveRange("last_30", now), {
      start: "2026-09-27",
      end: "2026-10-26",
      label: "Last 30 days",
    });
    assert.deepEqual(resolveExecutiveRange("mtd", now), {
      start: "2026-10-01",
      end: "2026-10-26",
      label: "Month-to-date",
    });
  });

  it("resolves equal-length previous windows for trends", () => {
    const now = new Date("2026-10-26T02:00:00.000Z");
    assert.deepEqual(resolvePreviousExecutiveRange("last_7", now), {
      start: "2026-10-13",
      end: "2026-10-19",
    });
    assert.deepEqual(resolvePreviousExecutiveRange("last_30", now), {
      start: "2026-08-28",
      end: "2026-09-26",
    });
  });

  it("shows traffic, sessions, bookings, calls, tops, placement mix, and rates", () => {
    const now = new Date("2026-10-26T02:00:00.000Z");
    const report = buildPracticeExecutiveDashboard(buildExecutiveFixtureEvents(now), "last_7", now);

    assert.equal(report.dashboard, "executive_practice");
    assert.ok(report.kpis.traffic > 0);
    assert.ok(report.kpis.sessions > 0);
    assert.ok(report.kpis.booking_clicks > 0);
    assert.ok(report.kpis.clinic_calls > 0);

    assert.ok(report.top_pages.length <= 10);
    assert.ok(report.top_services.length <= 10);
    assert.ok(report.top_practitioners.length <= 10);
    assert.ok(report.top_pages[0].count >= report.top_pages.at(-1)!.count);

    const placements = report.booking_placement_mix.map((row) => row.placement);
    assert.deepEqual(placements, ["header", "dock", "profile", "digital_reception", "other"]);
    assert.ok(report.booking_placement_mix.some((row) => row.placement === "digital_reception" && row.count >= 0));

    const rateKeys = report.rates.map((row) => row.key);
    assert.deepEqual(rateKeys, ["contact_rate", "booking_intent_rate", "call_intent_rate"]);
    for (const card of report.rates) {
      assert.equal(typeof card.value === "number" || card.value === null, true);
      assert.ok(["up", "down", "flat"].includes(card.trend.direction));
    }
    assert.equal(report.series.length, 7);
    assert.ok(report.series.every((point) => typeof point.traffic === "number"));
    assert.ok(report.series.every((point) => typeof point.booking_clicks === "number"));
    assert.ok(report.series.every((point) => typeof point.call_clicks === "number"));
    assert.ok(report.trends.traffic.direction);
    assert.ok(report.digital_reception.opens >= 0);
    assert.equal(containsRawQueryField(report), false);
  });

  it("folds mobile_header into header placement mix", () => {
    const events: RawMeasurementEvent[] = [
      {
        event: "book_appointment_click",
        measurement_version: "2G",
        ts: "2026-10-25T01:00:00.000Z",
        session_id: "s1",
        page_path: "index.html",
        page_group: "home",
        placement: "mobile_header",
        destination: "clinic_list",
      },
      {
        event: "page_view",
        measurement_version: "2G",
        ts: "2026-10-25T00:50:00.000Z",
        session_id: "s1",
        page_path: "index.html",
        page_group: "home",
      },
    ];
    const report = buildPracticeExecutiveDashboard(events, "last_7", new Date("2026-10-26T02:00:00.000Z"));
    const header = report.booking_placement_mix.find((row) => row.placement === "header");
    assert.equal(header?.count, 1);
  });
});
