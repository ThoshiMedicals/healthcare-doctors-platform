import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  INSIGHTS_PERSONA_LABEL,
  insightsHomeLayout,
  insightsPersonaFromRole,
  resolveInsightsPersona,
} from "./insights-persona";

describe("insights home personas (C4)", () => {
  it("maps membership roles to presentation personas without changing permissions", () => {
    assert.equal(insightsPersonaFromRole("super_admin"), "practice_owner");
    assert.equal(insightsPersonaFromRole("network_admin"), "practice_owner");
    assert.equal(insightsPersonaFromRole("clinic_admin"), "practice_manager");
    assert.equal(insightsPersonaFromRole("clinical_reviewer"), "governance_lead");
    assert.equal(insightsPersonaFromRole("practice_approver"), "governance_lead");
    assert.equal(insightsPersonaFromRole("content_editor"), "marketing_growth");
    assert.equal(insightsPersonaFromRole("publisher"), "marketing_growth");
    assert.equal(insightsPersonaFromRole(null), "practice_manager");
  });

  it("allows presentation-only persona override via query", () => {
    assert.equal(resolveInsightsPersona("clinic_admin", "marketing_growth"), "marketing_growth");
    assert.equal(resolveInsightsPersona("clinic_admin", "not-a-persona"), "practice_manager");
    assert.equal(resolveInsightsPersona("super_admin", undefined), "practice_owner");
  });

  it("orders KPIs so each role sees relevant insights first", () => {
    const owner = insightsHomeLayout("practice_owner");
    assert.equal(owner.sections[0], "health");
    assert.ok(owner.sections.includes("guidance"));
    assert.equal(owner.trendKpis[0], "contact");
    assert.equal(owner.label, INSIGHTS_PERSONA_LABEL.practice_owner);

    const manager = insightsHomeLayout("practice_manager");
    assert.equal(manager.sections[0], "guidance");
    assert.equal(manager.trendKpis[0], "booking");
    assert.equal(manager.alertPanels[0], "governance");

    const governance = insightsHomeLayout("governance_lead");
    assert.equal(governance.sections[0], "guidance");
    assert.equal(governance.alertPanels[0], "governance");

    const growth = insightsHomeLayout("marketing_growth");
    assert.equal(growth.sections[0], "guidance");
    assert.equal(growth.leaderCards[0], "search_intents");
    assert.equal(growth.alertPanels[0], "conversion");
    assert.equal(growth.trendKpis[0], "booking");
  });
});

