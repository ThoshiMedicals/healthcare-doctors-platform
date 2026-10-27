import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  chartEntitySlug,
  conversionFunnelStageHref,
  digitalReceptionFunnelStageHref,
  governanceQueueInvestigationHref,
  intentInvestigationHref,
  practitionerInvestigationHref,
  searchDestinationHref,
  serviceInvestigationHref,
} from "./chart-navigation";

describe("chart navigation (D4)", () => {
  it("builds intent investigation hrefs into Digital Reception", () => {
    const href = intentInvestigationHref("vaccination", { range: "last_7", data: "demo" });
    assert.match(href, /\/admin\/digital-reception\?/);
    assert.match(href, /intent=vaccination/);
    assert.match(href, /from=chart/);
    assert.match(href, /#intent-vaccination$/);
  });

  it("opens service and practitioner investigations from chart keys", () => {
    assert.equal(chartEntitySlug("services/telehealth.html", "service"), "telehealth");
    assert.equal(chartEntitySlug("doctors/dr-tanya-goodwill", "practitioner"), "dr-tanya-goodwill");
    assert.match(
      serviceInvestigationHref("services/telehealth.html", { range: "last_7" }),
      /\/admin\/service-authority\?.*focus=telehealth/,
    );
    assert.match(
      practitionerInvestigationHref("doctors/dr-tanya-goodwill", { range: "last_7" }),
      /\/admin\/practitioner-authority\?.*focus=dr-tanya-goodwill/,
    );
  });

  it("routes search destinations by entity type", () => {
    assert.match(searchDestinationHref("services/skin-check.html", {}), /service-authority/);
    assert.match(searchDestinationHref("doctors/dr-a", {}), /practitioner-authority/);
    assert.match(searchDestinationHref("knowledge/articles/x", {}), /digital-reception/);
  });

  it("maps funnel stages to investigation dashboards", () => {
    assert.match(conversionFunnelStageHref("search", { range: "last_7" }), /digital-reception/);
    assert.match(conversionFunnelStageHref("booking", {}), /conversion-intelligence.*#ci-opportunities/);
    assert.match(digitalReceptionFunnelStageHref("result_click", {}), /#dr-charts/);
    assert.match(digitalReceptionFunnelStageHref("call", {}), /conversion-intelligence/);
  });

  it("opens governance queues from chart segments", () => {
    assert.match(
      governanceQueueInvestigationHref("expired", { data: "demo" }),
      /\/admin\/governance\/management\?.*queue=expired/,
    );
  });
});
