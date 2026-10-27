import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  platformHealthBandExplanation,
  platformHealthDomainCta,
  platformHealthDomainHref,
} from "./platform-health-actions";

describe("platform health domain actions (D3)", () => {
  it("builds focus-mode hrefs for each clickable domain", () => {
    assert.match(
      platformHealthDomainHref("search", { range: "last_7", data: "demo" }),
      /\/admin\/digital-reception\?.*health=search/,
    );
    assert.match(platformHealthDomainHref("search", { range: "last_7" }), /#dr-flags$/);
    assert.match(
      platformHealthDomainHref("digital_reception", { range: "last_7" }),
      /health=digital_reception/,
    );
    assert.match(
      platformHealthDomainHref("governance", { range: "last_7" }),
      /\/admin\/governance\/management\?.*health=governance/,
    );
    assert.match(
      platformHealthDomainHref("analytics", { range: "last_7" }),
      /\/admin\/executive\?.*health=analytics/,
    );
    assert.match(
      platformHealthDomainHref("conversion", { range: "last_7" }),
      /\/admin\/conversion-intelligence\?.*health=conversion/,
    );
    assert.match(
      platformHealthDomainHref("authority", { range: "last_7" }),
      /\/admin\/practitioner-authority\?.*health=authority/,
    );
    assert.match(
      platformHealthDomainHref("accessibility", { range: "last_7" }),
      /health=accessibility/,
    );
  });

  it("opens Thin tier when authority needs work", () => {
    const href = platformHealthDomainHref(
      "authority",
      { range: "last_30", data: "live" },
      { authorityNeedsWork: true },
    );
    assert.match(href, /health=authority/);
    assert.match(href, /tier=Thin/);
    assert.match(href, /#pa-roster$/);
  });

  it("clears slug focus when opening a health investigation", () => {
    const href = platformHealthDomainHref("conversion", {
      range: "last_7",
      practitioner: "dr-tanya",
      service: "telehealth",
      queue: "expired",
    });
    assert.doesNotMatch(href, /practitioner=/);
    assert.doesNotMatch(href, /service=/);
    assert.doesNotMatch(href, /queue=/);
    assert.match(href, /health=conversion/);
  });

  it("returns band explanation and CTA copy", () => {
    assert.equal(platformHealthBandExplanation("watch").label, "Needs Watch");
    assert.equal(platformHealthDomainCta("search"), "Investigate search");
  });
});
