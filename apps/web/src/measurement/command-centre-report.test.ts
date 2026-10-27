import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildCommandCentreSnapshot, COMMAND_CENTRE_HEALTH_LABEL } from "./command-centre-report";
import { buildPracticeConversionIntelligenceReport } from "./conversion-intelligence-report";
import { buildPracticeDigitalReceptionDashboard } from "./digital-reception-report";
import { buildPracticeExecutiveDashboard } from "./executive-report";
import { buildExecutiveFixtureEvents } from "./fixtures";
import { PLATFORM_READINESS_SCORECARD_L7 } from "@/readiness/platform-readiness";

const LINKS = {
  executive: "/admin/executive",
  digitalReception: "/admin/digital-reception",
  conversion: "/admin/conversion-intelligence",
  governanceAwaiting: "/admin/governance/management?queue=awaiting_review",
  governanceDueSoon: "/admin/governance/management?queue=due_soon",
  governanceExpired: "/admin/governance/management?queue=expired",
  governanceOwnership: "/admin/governance/management?queue=missing_ownership",
};

describe("command centre snapshot (C1)", () => {
  it("builds a scannable health snapshot from fixture dashboards", () => {
    const now = new Date("2026-10-26T02:00:00.000Z");
    const events = buildExecutiveFixtureEvents(now);
    const executive = buildPracticeExecutiveDashboard(events, "last_7", now);
    const digitalReception = buildPracticeDigitalReceptionDashboard(events, "last_7", now);
    const conversion = buildPracticeConversionIntelligenceReport(events, "last_7", now);

    const snapshot = buildCommandCentreSnapshot({
      executive,
      digitalReception,
      conversion,
      governance: {
        totals: {
          total: 10,
          awaiting_review: 2,
          due_within_60_days: 1,
          expired: 0,
          missing_ownership: 0,
          missing_approval: 0,
          missing_review_metadata: 0,
        },
      },
      readiness: PLATFORM_READINESS_SCORECARD_L7,
      links: LINKS,
    });

    assert.equal(snapshot.range, "last_7");
    assert.ok(snapshot.website_health_score >= 0 && snapshot.website_health_score <= 100);
    assert.ok(Object.keys(COMMAND_CENTRE_HEALTH_LABEL).includes(snapshot.website_health_state));
    assert.equal(snapshot.platform_health.overall_score, snapshot.website_health_score);
    assert.equal(snapshot.platform_health.domains.length, 7);
    assert.ok(["up", "down", "flat"].includes(snapshot.platform_health.overall_trend.direction));
    assert.equal(snapshot.launch_readiness_score, PLATFORM_READINESS_SCORECARD_L7.productionReadinessScore);
    assert.equal(snapshot.launch_clear_to_ship, true);
    assert.equal(typeof snapshot.booking_clicks, "number");
    assert.equal(typeof snapshot.clinic_calls, "number");
    assert.ok(Array.isArray(snapshot.series));
    assert.ok(snapshot.alerts.governance.some((alert) => alert.id === "gov-awaiting"));
    assert.ok(snapshot.alert_counts.total >= snapshot.alert_counts.governance);
  });

  it("escalates to Needs Attention when reviews are expired", () => {
    const now = new Date("2026-10-26T02:00:00.000Z");
    const events = buildExecutiveFixtureEvents(now);
    const executive = buildPracticeExecutiveDashboard(events, "last_7", now);

    const snapshot = buildCommandCentreSnapshot({
      executive,
      governance: {
        totals: {
          total: 4,
          awaiting_review: 0,
          due_within_60_days: 0,
          expired: 3,
          missing_ownership: 0,
          missing_approval: 0,
          missing_review_metadata: 0,
        },
      },
      readiness: PLATFORM_READINESS_SCORECARD_L7,
      links: LINKS,
    });

    assert.equal(snapshot.website_health_state, "needs_attention");
    assert.equal(COMMAND_CENTRE_HEALTH_LABEL[snapshot.website_health_state], "Needs Attention");
    assert.ok(snapshot.website_health_score < 85);
  });
});
