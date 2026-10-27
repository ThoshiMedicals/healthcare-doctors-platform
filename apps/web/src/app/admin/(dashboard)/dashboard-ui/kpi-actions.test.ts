import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { KpiInfoReasons, KpiTargets, kpiAction, kpiInfo } from "./kpi-actions";

describe("KPI actions (D1)", () => {
  it("builds filtered workflow hrefs with section anchors", () => {
    const filters = { range: "last_7" as const, data: "demo" as const };
    const booking = KpiTargets.bookingJourney(filters);
    assert.equal(booking.kind, "action");
    assert.match(booking.href, /\/admin\/conversion-intelligence/);
    assert.match(booking.href, /range=last_7/);
    assert.match(booking.href, /data=demo/);
    assert.match(booking.href, /#ci-funnel/);

    const search = KpiTargets.searchQuality(filters);
    assert.match(search.href, /\/admin\/digital-reception/);
    assert.match(search.href, /#dr-flags/);

    const due = KpiTargets.governanceQueue("due_soon", filters);
    assert.match(due.href, /\/admin\/governance\/management/);
    assert.match(due.href, /queue=due_soon/);
    assert.match(due.href, /data=demo/);
  });

  it("marks informational KPIs explicitly", () => {
    const info = kpiInfo(KpiInfoReasons.volumeContext);
    assert.equal(info.kind, "informational");
    assert.match(info.reason, /Informational/);
    const action = kpiAction("/admin/executive", "Open website overview");
    assert.equal(action.kind, "action");
  });
});
