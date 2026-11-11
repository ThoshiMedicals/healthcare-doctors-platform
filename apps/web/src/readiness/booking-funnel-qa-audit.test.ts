import assert from "node:assert/strict";
import { describe, it } from "node:test";
import fs from "node:fs";
import path from "node:path";
import { runInNewContext } from "node:vm";
import { getBookingFunnelQaAudit, getConversionScore } from "./booking-funnel-qa-audit";

describe("booking funnel QA audit (QA6)", () => {
  it("exposes conversion score, friction report, and recommendations", () => {
    const audit = getBookingFunnelQaAudit();
    assert.equal(audit.promptId, "QA6");
    assert.equal(getConversionScore(), audit.conversionScore);

    assert.ok(audit.conversionScore >= 85);
    assert.equal(
      audit.conversionScore,
      Math.round(
        Object.values(audit.dimensionScores).reduce((sum, n) => sum + n, 0) /
          Object.keys(audit.dimensionScores).length,
      ),
    );

    assert.equal(audit.coverage.practitionersWithBook, 13);
    assert.equal(audit.coverage.practitionersPhoneOnly, 1);
    assert.equal(audit.coverage.servicesWithBook, 29);
    assert.ok(audit.frictionReport.length >= 5);
    assert.ok(audit.recommendations.some((item) => item.priority === "now"));
    assert.ok(audit.priorityFixes.every((item) => item.severity === "P0" || item.severity === "P1"));
    assert.ok(audit.priorityFixes.some((item) => item.id === "B-F1"));
    assert.ok(audit.priorityFixes.some((item) => item.id === "B-F2"));

    assert.equal(audit.recommendation, "CONVERSION_STRONG_WITH_FRICTION");
    assert.match(audit.reportPath, /BOOKING_FUNNEL_QA_AUDIT_QA6/);
  });

  it("scores homepage and HotDoc above call-action friction", () => {
    const audit = getBookingFunnelQaAudit();
    assert.ok(audit.dimensionScores.homepage >= 90);
    assert.ok(audit.dimensionScores.hotdocJourneys >= 88);
    assert.ok(audit.dimensionScores.trustPlacement >= 88);
    assert.ok(audit.dimensionScores.callActions < audit.dimensionScores.homepage);
  });
});

const SITE_JS = fs.readFileSync(path.resolve(process.cwd(), "public/site.js"), "utf8");
const GOLDEN_JS = fs.readFileSync(path.resolve(process.cwd(), "../../old-html/site.js"), "utf8");

it("public and golden scripts parse, keeping all 15 published peer records", () => {
  for (const source of [SITE_JS, GOLDEN_JS]) {
    assert.doesNotThrow(() => new Function(source));
    // Normalise CRLF so the PEERS marker parse is stable on Windows checkouts.
    const normalised = source.replace(/\r\n/g, "\n");
    const start = normalised.indexOf("  const PEERS = ");
    const end = normalised.indexOf(";\n\n  const path =", start);
    assert.ok(start > 0 && end > start);
    const peers = JSON.parse(normalised.slice(start + "  const PEERS = ".length, end));
    assert.equal(Object.keys(peers.practitioners).length, 15);
    assert.equal(peers.practitioners["doctors/dr-mary-abadir.html"].name, "Dr Mary Abadir, Gynaecologist");
  }
});


function generatedPractitionerBooking(href: string): {
  support: string;
  links: Array<{href:string;label:string;book?:boolean;call?:boolean}>;
  buttons: Array<Record<string, string>>;
} {
  // Exercise the real production snippets with a minimal DOM, not an independent copy.
  const section = SITE_JS.indexOf("/* 4C — Reusable mid-page conversion bands.");
  const begin = SITE_JS.indexOf("    if (path.includes('/doctors/')) {", section);
  const end = SITE_JS.indexOf("    } else if (path.includes('/services/')) {", begin);
  const renderBegin = SITE_JS.indexOf("    links.forEach(item => {", end);
  const renderEnd = SITE_JS.indexOf("    actions.append(copy, linkRow);", renderBegin);
  assert.ok(section >= 0 && begin > section && end > begin && renderBegin > end && renderEnd > renderBegin);
  const branch = SITE_JS.slice(begin, end) + "\n    }";
  const rendering = SITE_JS.slice(renderBegin, renderEnd);
  const program = [
    "(() => {",
    "const path = '/doctors/dr-mary-abadir.html';",
    "const h1 = 'Dr Mary Abadir';",
    "const TEL = 'tel:+61732173344';",
    "const CLINIC_BOOK = 'https://www.hotdoc.com.au/medical-centres/example/doctors?wp=w_lightbox';",
    "const practitionerBook = { getAttribute: () => " + JSON.stringify(href) + " };",
    "const document = {",
    "  querySelector: () => null,",
    "  createElement: () => ({",
    "    attributes: {},",
    "    classList: {add() {}},",
    "    setAttribute(key, value) {this.attributes[key] = value;},",
    "    set href(value) {this.attributes.href = value;},",
    "    set textContent(value) {this.label = value;}",
    "  })",
    "};",
    "let type = 'next', title = '', support = '', links = [];",
    branch,
    "const linkRow = {children: [], append(value) {this.children.push(value);}};",
    rendering,
    "return {support, links, buttons: linkRow.children.map(x => ({...x.attributes, label: x.label}))};",
    "})()",
  ].join("\n");
  return JSON.parse(JSON.stringify(runInNewContext(program, {}, {timeout: 1000})));
}

describe("phone-only practitioner booking — source_findings.csv H-02", () => {
  it("renders telephone booking as Call Reception to Book, without HotDoc attributes", () => {
    const result = generatedPractitionerBooking("tel:+61732173344");
    const primary = result.buttons[0];
    assert.equal(primary.label, "Call Reception to Book");
    assert.equal(primary.href, "tel:+61732173344");
    assert.equal(primary["data-hotdoc-button"], undefined);
    assert.equal(primary["data-hotdoc-widget"], undefined);
    assert.equal(primary["aria-label"], undefined);
    assert.equal(result.links[0].book, undefined);
    assert.equal(result.links[0].call, true);
    assert.ok(result.support.startsWith("Call reception"));
  });

  it("preserves normal practitioner HotDoc lightbox booking and telephone fallback", () => {
    const hotdoc = "https://www.hotdoc.com.au/medical-centres/example/doctors/dr-example?wp=w_lightbox";
    const result = generatedPractitionerBooking(hotdoc);
    assert.equal(result.buttons[0].label, "Book Appointment");
    assert.equal(result.buttons[0].href, hotdoc);
    assert.equal(result.buttons[0]["data-hotdoc-button"], "");
    assert.equal(result.buttons[0]["data-hotdoc-widget"], "lightbox");
    assert.equal(result.buttons[1].href, "tel:+61732173344");
    assert.equal(result.buttons[1]["data-hotdoc-button"], undefined);
    assert.equal(result.buttons[1]["data-hotdoc-widget"], undefined);
  });

  it("the approved Mary Abadir profile provides telephone-only booking", () => {
    const html = fs.readFileSync(path.resolve(process.cwd(), "../../old-html/doctors/dr-mary-abadir.html"), "utf8");
    const actions = html.match(/<div class="doctor-profile-actions">([\s\S]*?)<\/div>/)?.[1];
    assert.ok(actions, "Mary's booking section must be present");
    assert.match(actions, /Call Reception to Book/);
    assert.match(actions, /href="tel:\+61732173344"/);
    assert.doesNotMatch(actions, /data-hotdoc-button|data-hotdoc-widget/);
  });
});
