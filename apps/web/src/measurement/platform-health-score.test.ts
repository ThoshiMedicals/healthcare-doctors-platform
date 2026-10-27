import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildPracticeConversionIntelligenceReport } from "./conversion-intelligence-report";
import { buildPracticeDigitalReceptionDashboard } from "./digital-reception-report";
import { buildPracticeExecutiveDashboard } from "./executive-report";
import { buildExecutiveFixtureEvents } from "./fixtures";
import {
  PLATFORM_HEALTH_DOMAIN_LABEL,
  PLATFORM_HEALTH_WEIGHTS,
  buildPlatformHealthScorecard,
} from "./platform-health-score";

describe("platform health score (C7)", () => {
  it("builds overall score, seven domain subscores, and trends", () => {
    const now = new Date("2026-10-26T02:00:00.000Z");
    const previousNow = new Date("2026-10-19T02:00:00.000Z");
    const events = buildExecutiveFixtureEvents(now);
    const executive = buildPracticeExecutiveDashboard(events, "last_7", now);
    const digitalReception = buildPracticeDigitalReceptionDashboard(events, "last_7", now);
    const previousDigitalReception = buildPracticeDigitalReceptionDashboard(
      events,
      "last_7",
      previousNow,
    );
    const conversion = buildPracticeConversionIntelligenceReport(events, "last_7", now);
    const previousConversion = buildPracticeConversionIntelligenceReport(events, "last_7", previousNow);

    const card = buildPlatformHealthScorecard({
      executive,
      digitalReception,
      previousDigitalReception,
      conversion,
      previousConversion,
      governance: {
        totals: {
          total: 10,
          awaiting_review: 1,
          due_within_60_days: 2,
          expired: 0,
          missing_ownership: 0,
          missing_approval: 0,
          missing_review_metadata: 0,
        },
      },
      accessibilityAuditScore: 91,
    });

    assert.ok(card.overall_score >= 0 && card.overall_score <= 100);
    assert.ok(["healthy", "watch", "needs_attention"].includes(card.overall_state));
    assert.ok(["up", "down", "flat"].includes(card.overall_trend.direction));
    assert.equal(card.domains.length, 7);

    const weightSum = Object.values(PLATFORM_HEALTH_WEIGHTS).reduce((sum, weight) => sum + weight, 0);
    assert.ok(Math.abs(weightSum - 1) < 0.001);

    for (const domain of card.domains) {
      assert.equal(domain.label, PLATFORM_HEALTH_DOMAIN_LABEL[domain.id]);
      assert.ok(domain.score >= 0 && domain.score <= 100);
      assert.ok(domain.summary.length > 0);
      assert.ok(["up", "down", "flat"].includes(domain.trend.direction));
    }

    const expected = Math.round(
      card.domains.reduce((sum, domain) => sum + domain.score * domain.weight, 0),
    );
    assert.equal(card.overall_score, expected);
  });

  it("drops overall health when governance and search are at risk", () => {
    const now = new Date("2026-10-26T02:00:00.000Z");
    const events = buildExecutiveFixtureEvents(now);
    const executive = buildPracticeExecutiveDashboard(events, "last_7", now);
    const digitalReception = buildPracticeDigitalReceptionDashboard(events, "last_7", now);

    const healthy = buildPlatformHealthScorecard({
      executive,
      digitalReception: {
        ...digitalReception,
        kpis: { ...digitalReception.kpis, resolution_band: "green", resolution_rate: 82, zero_result_rate: 8 },
        flagged_intents: [],
      },
      governance: {
        totals: {
          total: 8,
          awaiting_review: 0,
          due_within_60_days: 0,
          expired: 0,
          missing_ownership: 0,
          missing_approval: 0,
          missing_review_metadata: 0,
        },
      },
      accessibilityAuditScore: 95,
    });

    const atRisk = buildPlatformHealthScorecard({
      executive,
      digitalReception: {
        ...digitalReception,
        kpis: { ...digitalReception.kpis, resolution_band: "red", resolution_rate: 28, zero_result_rate: 40 },
        flagged_intents: digitalReception.top_intent_buckets.slice(0, 3).map((row) => ({
          ...row,
          flagged: true,
          resolution_band: "red" as const,
          resolution_rate: 20,
        })),
      },
      governance: {
        totals: {
          total: 8,
          awaiting_review: 3,
          due_within_60_days: 4,
          expired: 3,
          missing_ownership: 2,
          missing_approval: 0,
          missing_review_metadata: 0,
        },
      },
      accessibilityAuditScore: 70,
    });

    assert.ok(atRisk.overall_score < healthy.overall_score);
    assert.equal(atRisk.overall_state, "needs_attention");
    assert.ok(atRisk.domains.find((domain) => domain.id === "search")!.score < 70);
    assert.ok(atRisk.domains.find((domain) => domain.id === "governance")!.score < 70);
  });
});
