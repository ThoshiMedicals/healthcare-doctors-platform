import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  PLATFORM_HEALTH_BAND_EXPLANATIONS,
  PLATFORM_HEALTH_BAND_LABEL,
  PLATFORM_HEALTH_DOMAIN_TARGETS,
  healthDomainsForPath,
  investigatePlatformHealthDomain,
  isPlatformHealthDomainId,
} from "./platform-health-investigation";
import type { PlatformHealthSubscore } from "./platform-health-score";

describe("platform health investigation (D3)", () => {
  it("exposes Healthy / Needs Watch / Needs Attention panels", () => {
    assert.equal(PLATFORM_HEALTH_BAND_LABEL.healthy, "Healthy");
    assert.equal(PLATFORM_HEALTH_BAND_LABEL.watch, "Needs Watch");
    assert.equal(PLATFORM_HEALTH_BAND_LABEL.needs_attention, "Needs Attention");
    for (const state of ["healthy", "watch", "needs_attention"] as const) {
      const band = PLATFORM_HEALTH_BAND_EXPLANATIONS[state];
      assert.ok(band.meaning.length > 20);
      assert.ok(band.whatToDo.length > 20);
      assert.ok(band.scoreBand.includes("Score"));
    }
  });

  it("maps every domain to a dashboard investigation target", () => {
    const expected: Record<string, string> = {
      search: "/admin/digital-reception",
      digital_reception: "/admin/digital-reception",
      governance: "/admin/governance/management",
      analytics: "/admin/executive",
      conversion: "/admin/conversion-intelligence",
      authority: "/admin/practitioner-authority",
      accessibility: "/admin/executive",
    };
    for (const [id, path] of Object.entries(expected)) {
      assert.ok(isPlatformHealthDomainId(id));
      assert.equal(PLATFORM_HEALTH_DOMAIN_TARGETS[id as keyof typeof expected].path, path);
      assert.ok(PLATFORM_HEALTH_DOMAIN_TARGETS[id as keyof typeof expected].cta.length > 5);
    }
  });

  it("resolves which domains belong to a destination path", () => {
    assert.deepEqual(healthDomainsForPath("/admin/digital-reception"), [
      "search",
      "digital_reception",
    ]);
    assert.deepEqual(healthDomainsForPath("/admin/executive"), ["analytics", "accessibility"]);
    assert.deepEqual(healthDomainsForPath("/admin/conversion-intelligence"), ["conversion"]);
  });

  it("packages domain investigation copy for focus mode", () => {
    const domain: PlatformHealthSubscore = {
      id: "governance",
      label: "Governance",
      score: 62,
      state: "needs_attention",
      weight: 0.15,
      summary: "2 expired · 1 due soon · 0 missing ownership.",
      trend: { current: 62, previous: 70, delta: -8, delta_pct: -11.4, direction: "down" },
    };
    const result = investigatePlatformHealthDomain(domain);
    assert.equal(result.band.label, "Needs Attention");
    assert.equal(result.domainLabel, "Governance");
    assert.match(result.cta, /governance/i);
    assert.match(result.focusLabel, /Governance health focus/i);
  });
});
