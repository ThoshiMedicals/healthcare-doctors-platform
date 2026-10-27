import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildHealthcareDemoEvents } from "./demo/healthcare-demo-events";
import { buildHealthcareDemoGovernanceRows } from "./demo/healthcare-demo-governance";
import { resolveGovernanceDataset } from "./demo/load-governance-dataset";
import { buildPracticeConversionIntelligenceReport } from "./conversion-intelligence-report";
import { buildPracticeDigitalReceptionDashboard } from "./digital-reception-report";
import { loadMeasurementEvents } from "./event-source";
import { buildPracticeExecutiveDashboard } from "./executive-report";
import {
  defaultInsightsDataMode,
  isInsightsDataMode,
  resolveInsightsDataMode,
} from "./insights-data-mode";
import { buildPracticeGovernanceManagementReport } from "@/governance/management-report";

describe("insights data mode (C9)", () => {
  it("defaults to demo without warehouse and live when warehouse is available", () => {
    assert.equal(defaultInsightsDataMode(false), "demo");
    assert.equal(defaultInsightsDataMode(true), "live");
    assert.equal(resolveInsightsDataMode("empty", true), "empty");
    assert.equal(resolveInsightsDataMode("bogus", false), "demo");
    assert.ok(isInsightsDataMode("live"));
    assert.ok(isInsightsDataMode("demo"));
    assert.ok(isInsightsDataMode("empty"));
  });

  it("loads labelled demo events separately from empty and live-empty", async () => {
    const demo = await loadMeasurementEvents("demo");
    assert.equal(demo.mode, "demo");
    assert.equal(demo.isDemo, true);
    assert.equal(demo.source, "demo_dataset");
    assert.match(demo.feedLabel, /Demo data/i);
    assert.ok(demo.events.length > 100);

    const empty = await loadMeasurementEvents("empty");
    assert.equal(empty.mode, "empty");
    assert.equal(empty.events.length, 0);
    assert.equal(empty.isDemo, false);

    const live = await loadMeasurementEvents("live");
    assert.equal(live.mode, "live");
    assert.equal(live.isDemo, false);
    assert.ok(live.source === "warehouse_file" || live.source === "live_empty");
  });

  it("keeps Executive, Digital Reception, and Conversion meaningful on demo data", () => {
    const now = new Date("2026-10-26T02:00:00.000Z");
    const events = buildHealthcareDemoEvents(now);
    const executive = buildPracticeExecutiveDashboard(events, "last_7", now);
    const dr = buildPracticeDigitalReceptionDashboard(events, "last_7", now);
    const conversion = buildPracticeConversionIntelligenceReport(events, "last_7", now);

    assert.ok(executive.kpis.sessions > 0);
    assert.ok(dr.kpis.searches > 0);
    assert.ok(conversion.funnel.length >= 3);
  });

  it("builds governance demo queues without using Prisma rows", () => {
    const now = new Date("2026-10-26T02:00:00.000Z");
    const demo = resolveGovernanceDataset("demo", [], now);
    assert.equal(demo.isDemo, true);
    assert.ok(demo.rows.length >= 8);
    const report = buildPracticeGovernanceManagementReport(demo.rows, 60, now);
    assert.ok(report.totals.total >= 8);
    assert.ok(
      report.totals.expired +
        report.totals.due_within_60_days +
        report.totals.awaiting_review +
        report.totals.missing_ownership >
        0,
    );

    const empty = resolveGovernanceDataset("empty", buildHealthcareDemoGovernanceRows(now), now);
    assert.equal(empty.rows.length, 0);
  });
});
