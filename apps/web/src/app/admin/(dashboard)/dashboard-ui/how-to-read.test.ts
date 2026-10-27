import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  AUTHORITY_TIER_FRIENDLY,
  HOW_TO_READ_GUIDES,
  RESOLUTION_BAND_FRIENDLY,
  getHowToReadGuide,
  getMetricGuide,
  healthFromValue,
} from "./how-to-read";

describe("how to read dashboards (C10)", () => {
  it("covers every Insights destination with a 60-second briefing and status key", () => {
    const ids = Object.keys(HOW_TO_READ_GUIDES);
    assert.ok(ids.length >= 10);
    for (const id of ids) {
      const guide = getHowToReadGuide(id as keyof typeof HOW_TO_READ_GUIDES);
      assert.ok(guide.inSixtySeconds.length > 40, id);
      assert.ok(guide.whatGoodLooksLike.length > 20, id);
      assert.ok(guide.scanOrder.length >= 2, id);
      assert.ok(guide.statusKey.some((row) => row.level === "healthy"), id);
      assert.ok(guide.statusKey.some((row) => row.level === "critical"), id);
      for (const metric of guide.metrics) {
        assert.ok(metric.label.length > 0, `${id}:${metric.id}`);
        assert.ok(metric.meaning.length > 10, `${id}:${metric.id}`);
        assert.ok(metric.guidance.length > 10, `${id}:${metric.id}`);
      }
    }
  });

  it("maps technical bands to management language", () => {
    assert.equal(RESOLUTION_BAND_FRIENDLY.green, "Healthy");
    assert.equal(RESOLUTION_BAND_FRIENDLY.red, "Needs attention");
    assert.equal(AUTHORITY_TIER_FRIENDLY.Hub, "Well connected");
    assert.equal(AUTHORITY_TIER_FRIENDLY.Thin, "Needs more links");
  });

  it("classifies metric health from target thresholds", () => {
    const contact = getMetricGuide("executive", "contact_rate");
    assert.ok(contact?.thresholds);
    assert.equal(healthFromValue(6, contact!.thresholds), "healthy");
    assert.equal(healthFromValue(3, contact!.thresholds), "watch");
    assert.equal(healthFromValue(1, contact!.thresholds), "critical");

    const zero = getMetricGuide("digital-reception", "zero_result_rate");
    assert.equal(healthFromValue(10, zero!.thresholds), "healthy");
    assert.equal(healthFromValue(20, zero!.thresholds), "watch");
    assert.equal(healthFromValue(40, zero!.thresholds), "critical");
  });
});
