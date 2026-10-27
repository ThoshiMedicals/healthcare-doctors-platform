import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
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

  it("exposes a shared insights strip across dashboards", () => {
    const items = insightsNavItems("last_7");
    assert.ok(items.some((item) => item.id === "command-centre" && item.href === "/admin?range=last_7"));
    assert.ok(items.some((item) => item.id === "executive" && item.href.includes("range=last_7")));
    assert.ok(items.some((item) => item.id === "practitioner-authority"));
    assert.ok(items.some((item) => item.id === "governance-review"));
    assert.ok(items.some((item) => item.id === "governance-management"));
  });
});
