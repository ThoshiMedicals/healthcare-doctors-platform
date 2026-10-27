import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildInvestigationBannerModel,
  inferInvestigationSource,
  investigationActive,
  withInvestigationSource,
} from "./investigation";

describe("investigation banner (D6)", () => {
  it("stamps and reads investigation sources", () => {
    assert.equal(withInvestigationSource({ range: "last_7" }, "kpi").from, "kpi");
    assert.equal(inferInvestigationSource({ from: "recommendation", tier: "Thin" }), "recommendation");
    assert.equal(inferInvestigationSource({ health: "search" }), "health");
    assert.equal(inferInvestigationSource({ queue: "expired" }), "queue");
    assert.equal(inferInvestigationSource({ tier: "Thin" }), "chart");
    assert.equal(inferInvestigationSource({ intent: "vaccination" }), "chart");
  });

  it("builds Viewing · Needs more links · N Services with continue + recommendations + clear", () => {
    const model = buildInvestigationBannerModel({
      filters: { range: "last_7", data: "demo", tier: "Thin", from: "chart" },
      pathname: "/admin/service-authority",
      counts: { count: 7, entityLabel: "Services" },
    });
    assert.ok(model);
    assert.equal(model!.source, "chart");
    assert.equal(model!.viewing.title, "Needs more links");
    assert.equal(model!.viewing.detail, "7 Services");
    assert.ok(model!.recommendations.length >= 2);
    assert.ok(model!.recommendations.some((r) => /add links/i.test(r)));
    assert.match(model!.clearHref, /\/admin\/service-authority\?/);
    assert.doesNotMatch(model!.clearHref, /tier=/);
    assert.doesNotMatch(model!.clearHref, /from=/);
    assert.ok(model!.continueLinks.length >= 1);
  });

  it("activates for KPI / recommendation / health / queue arrivals", () => {
    assert.equal(investigationActive({ from: "kpi" }), true);
    assert.equal(investigationActive({ from: "recommendation", service: "telehealth" }), true);
    assert.equal(investigationActive({ health: "conversion" }), true);
    assert.equal(investigationActive({ queue: "due_soon" }), true);
    assert.equal(investigationActive({ range: "last_7" }), false);

    const health = buildInvestigationBannerModel({
      filters: { health: "governance", from: "health" },
      pathname: "/admin/governance/management",
    });
    assert.ok(health);
    assert.match(health!.viewing.title, /Governance health/i);

    const queue = buildInvestigationBannerModel({
      filters: { queue: "expired", from: "queue" },
      pathname: "/admin/governance",
      counts: { count: 3, entityLabel: "Records" },
    });
    assert.ok(queue);
    assert.equal(queue!.viewing.detail, "3 Records");
    assert.ok(queue!.recommendations.length >= 1);
  });
});
