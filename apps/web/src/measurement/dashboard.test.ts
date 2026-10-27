import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  aggregateByPeriod,
  aggregatePageViews,
  aggregateSearchIntents,
  buildDashboardSuite,
  buildDigitalReceptionDashboard,
  buildExecutiveDashboard,
  containsRawQueryField,
  DEBUG_RETENTION_POLICY,
  prepareEvents,
  sanitizeMeasurementEvent,
} from "@/measurement/index";
import type { RawMeasurementEvent } from "@/measurement/types";

const sample: RawMeasurementEvent[] = [
  {
    event: "page_view",
    measurement_version: "2G",
    ts: "2026-10-20T01:00:00.000Z",
    page_path: "index.html",
    page_group: "home",
  },
  {
    event: "page_view",
    measurement_version: "2G",
    ts: "2026-10-20T02:00:00.000Z",
    page_path: "doctors/dr-tanya-goodwill.html",
    page_group: "practitioner",
  },
  {
    event: "page_view",
    measurement_version: "2G",
    ts: "2026-10-21T02:00:00.000Z",
    page_path: "services/womens-health.html",
    page_group: "service",
  },
  {
    event: "book_appointment_click",
    measurement_version: "2G",
    ts: "2026-10-20T03:00:00.000Z",
    page_path: "doctors/dr-tanya-goodwill.html",
    page_group: "practitioner",
    placement: "profile",
    destination: "practitioner",
    practitioner: "dr-tanya-goodwill",
  },
  {
    event: "call_clinic_click",
    measurement_version: "2G",
    ts: "2026-10-20T03:05:00.000Z",
    page_path: "contact.html",
    page_group: "patient_information",
    placement: "header",
  },
  {
    event: "digital_reception_open",
    measurement_version: "2G",
    ts: "2026-10-20T04:00:00.000Z",
    page_path: "index.html",
    page_group: "home",
  },
  {
    event: "digital_reception_search",
    measurement_version: "2G",
    ts: "2026-10-20T04:01:00.000Z",
    page_path: "index.html",
    page_group: "home",
    intent_bucket: "diabetes",
    result_type: "care_journey",
    result_count: 2,
    query: "diabetes blood sugar",
  },
  {
    event: "digital_reception_result_click",
    measurement_version: "2G",
    ts: "2026-10-20T04:02:00.000Z",
    page_path: "index.html",
    page_group: "home",
    intent_bucket: "diabetes",
    step: "practitioner",
  },
  {
    event: "task_shortcut_click",
    measurement_version: "2G",
    ts: "2026-10-20T05:00:00.000Z",
    page_path: "index.html",
    page_group: "home",
    task: "new_patient",
    surface: "header",
  },
];

describe("measurement dashboard data layer (3A)", () => {
  it("strips raw queries before aggregation", () => {
    const cleaned = sanitizeMeasurementEvent(sample[6]);
    assert.ok(cleaned);
    assert.equal(cleaned.intent_bucket, "diabetes");
    assert.equal(cleaned.result_type, "care_journey");
    assert.equal(cleaned.result_count, 2);
    assert.equal("query" in cleaned, false);
    assert.equal(containsRawQueryField(cleaned), false);
  });

  it("aggregates core helpers without changing event collection shape", () => {
    const events = prepareEvents(sample);
    assert.equal(aggregatePageViews(events), 3);
    assert.equal(events.some((e) => "query" in e), false);

    const searches = aggregateSearchIntents(events);
    assert.equal(searches.length, 1);
    assert.deepEqual(Object.keys(searches[0]).sort(), [
      "avg_result_count",
      "intent_bucket",
      "result_type",
      "searches",
    ]);
    assert.equal(searches[0].intent_bucket, "diabetes");
    assert.equal(searches[0].result_type, "care_journey");
    assert.equal(searches[0].avg_result_count, 2);
  });

  it("supports daily, weekly, and monthly period views", () => {
    const events = prepareEvents(sample);
    const daily = aggregateByPeriod(events, "daily");
    const weekly = aggregateByPeriod(events, "weekly");
    const monthly = aggregateByPeriod(events, "monthly");

    assert.ok(daily.length >= 1);
    assert.ok(weekly.length >= 1);
    assert.ok(monthly.length >= 1);
    assert.equal(daily[0].grain, "daily");
    assert.equal(weekly[0].grain, "weekly");
    assert.equal(monthly[0].grain, "monthly");
    assert.match(weekly[0].period, /^\d{4}-W\d{2}$/);
    assert.match(monthly[0].period, /^\d{4}-\d{2}$/);
  });

  it("builds all five dashboard datasets without raw queries", () => {
    const suite = buildDashboardSuite(sample, "daily", {
      overdue: 1,
      due_within_horizon: 2,
      current: 10,
      hidden_until_approved: 3,
      total: 16,
    });

    assert.equal(suite.executive.dashboard, "executive");
    assert.equal(suite.executive.totals.page_views, 3);
    assert.equal(suite.executive.totals.booking_clicks, 1);
    assert.equal(suite.executive.totals.call_clicks, 1);
    assert.equal(suite.executive.totals.digital_reception_opens, 1);
    assert.equal(suite.executive.totals.digital_reception_searches, 1);
    assert.equal(suite.executive.totals.digital_reception_result_clicks, 1);
    assert.equal(suite.executive.totals.task_shortcuts, 1);

    assert.equal(suite.digital_reception.dashboard, "digital_reception");
    assert.equal(suite.digital_reception.searches_by_intent[0].intent_bucket, "diabetes");
    assert.equal(suite.digital_reception.result_clicks_by_step[0].key, "practitioner");

    assert.equal(suite.practitioner.dashboard, "practitioner");
    assert.ok(suite.practitioner.practitioners.some((row) => row.practitioner === "dr-tanya-goodwill"));

    assert.equal(suite.service.dashboard, "service");
    assert.ok(suite.service.services.some((row) => row.service === "womens-health"));

    assert.equal(suite.governance.dashboard, "governance");
    assert.equal(suite.governance.review_status?.overdue, 1);
    assert.equal(suite.governance.traffic_on_patient_information, 0);

    assert.equal(containsRawQueryField(suite), false);
    assert.equal(suite.digital_reception.meta.privacy.ttl_days, 14);
    assert.equal(suite.digital_reception.meta.privacy.dashboard_exposes_raw_query, false);
  });

  it("keeps the 14-day debug retention policy contract", () => {
    assert.equal(DEBUG_RETENTION_POLICY.ttl_days, 14);
    assert.equal(DEBUG_RETENTION_POLICY.store_key, "wmc_measurement_debug_queries");
    assert.deepEqual([...DEBUG_RETENTION_POLICY.exposed_search_fields], [
      "intent_bucket",
      "result_type",
      "result_count",
    ]);
  });

  it("executive dataset matches grain selection", () => {
    const weekly = buildExecutiveDashboard(sample, "weekly");
    const monthly = buildDigitalReceptionDashboard(sample, "monthly");
    assert.equal(weekly.meta.grain, "weekly");
    assert.equal(monthly.meta.grain, "monthly");
  });
});
