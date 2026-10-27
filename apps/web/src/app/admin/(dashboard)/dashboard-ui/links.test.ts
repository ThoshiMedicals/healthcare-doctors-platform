import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  executiveHref,
  digitalReceptionHref,
  conversionIntelligenceHref,
  governanceManagementHref,
  insightsNavItems,
  practitionerAuthorityHref,
  serviceAuthorityHref,
} from "./links";

describe("dashboard drill-through links (B5 + C5)", () => {
  it("builds filtered practitioner and service authority hrefs", () => {
    assert.equal(
      practitionerAuthorityHref({ range: "last_7", focus: "dr-tanya-goodwill" }),
      "/admin/practitioner-authority?range=last_7&focus=dr-tanya-goodwill#pa-focus",
    );
    assert.equal(
      serviceAuthorityHref({ range: "last_30", focus: "womens-health" }),
      "/admin/service-authority?range=last_30&focus=womens-health#sa-focus",
    );
  });

  it("opens governance queues from workload indicators", () => {
    assert.equal(
      governanceManagementHref({ queue: "due_soon" }),
      "/admin/governance/management?queue=due_soon&from=queue#queue-due_soon",
    );
    assert.equal(governanceManagementHref(), "/admin/governance/management");
    assert.equal(
      governanceManagementHref({ queue: "expired", filters: { from: "recommendation", data: "demo" } }),
      "/admin/governance/management?queue=expired&data=demo&from=recommendation#queue-expired",
    );
  });

  it("retains explicit investigation focus only on its compatible destination", () => {
    const href = practitionerAuthorityHref({
      focus: "dr-a", filters: { data: "demo", queue: "expired", tier: "Thin", from: "chart" },
    });
    assert.equal(href, "/admin/practitioner-authority?focus=dr-a&data=demo&from=chart#pa-focus");
    assert.equal(practitionerAuthorityHref({
      focus: "dr-a", tier: "Thin", filters: { from: "chart", data: "demo" },
    }), "/admin/practitioner-authority?focus=dr-a&data=demo&tier=Thin&from=chart#pa-focus");
    const governance = governanceManagementHref({
      queue: "expired", filters: { service: "telehealth", from: "recommendation", data: "demo" },
    });
    assert.equal(governance, "/admin/governance/management?queue=expired&data=demo&from=recommendation#queue-expired");
    const fromHealth = governanceManagementHref({
      queue: "due_soon", filters: { health: "governance", from: "health", data: "demo" },
    });
    assert.equal(fromHealth, "/admin/governance/management?queue=due_soon&data=demo&from=queue#queue-due_soon");
  });

  it("enforces overview at the named link-builder boundary", () => {
    const filters = {
      range: "last_7" as const,
      data: "demo" as const,
      intent: "vaccination",
      service: "telehealth",
      practitioner: "dr-a",
      health: "analytics" as const,
      queue: "expired" as const,
      from: "recommendation" as const,
    };
    assert.equal(executiveHref(filters), "/admin/executive?range=last_7&data=demo");
    assert.equal(digitalReceptionHref(filters), "/admin/digital-reception?range=last_7&data=demo");
    assert.equal(conversionIntelligenceHref(filters), "/admin/conversion-intelligence?range=last_7&data=demo");
    assert.equal(digitalReceptionHref(filters, undefined, { focusKeys: ["intent"] }),
      "/admin/digital-reception?range=last_7&data=demo&intent=vaccination&from=recommendation");
    assert.equal(conversionIntelligenceHref(filters, undefined, { focusKeys: ["service"] }),
      "/admin/conversion-intelligence?range=last_7&service=telehealth&data=demo&from=recommendation");
  });

  it("exposes a shared insights strip across dashboards", () => {
    const items = insightsNavItems("last_7");
    assert.ok(items.some((item) => item.id === "command-centre" && item.href === "/admin?range=last_7"));
    assert.ok(items.some((item) => item.id === "executive" && item.href.includes("range=last_7")));
    assert.ok(items.some((item) => item.id === "practitioner-authority"));
    assert.ok(items.some((item) => item.id === "governance-review"));
    assert.ok(items.some((item) => item.id === "governance-management"));
    const focused = insightsNavItems({
      range: "last_7", data: "demo", queue: "expired", tier: "Thin", intent: "vaccination", from: "queue",
    });
    for (const item of focused) {
      assert.doesNotMatch(item.href, /(?:queue|tier|intent|from)=/);
    }
  });
});
