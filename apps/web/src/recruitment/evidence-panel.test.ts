import assert from "node:assert/strict";
import test from "node:test";
import { renderRecruitmentEvidencePanelHtml } from "./evidence-panel";

test("evidence panel surfaces snapshot, opportunity, contact, confidentiality", () => {
  const html = renderRecruitmentEvidencePanelHtml({
    eoiHref: "join-our-team/express-interest.html",
  });

  assert.match(html, /data-recruitment-evidence-panel="true"/);
  assert.match(html, /Opportunity Snapshot/);
  assert.match(html, /75% Billings/);
  assert.match(html, /\$250\/hr Minimum/);
  assert.match(html, /70,000\+ Patient Files/);
  assert.doesNotMatch(html, /11 Consulting Rooms/);
  assert.doesNotMatch(html, /10 GPs/);
  assert.doesNotMatch(html, /3 Nurses/);
  assert.doesNotMatch(html, /AGPAL Accredited/);
  assert.match(html, /Current Opportunity/);
  assert.match(html, /VR General Practitioner/);
  assert.match(html, /Woolloongabba · Flexible sessions/);
  assert.match(html, /href="#current-opportunities"/);
  assert.match(html, />View Opportunity</);
  assert.match(html, /Confidential Contact/);
  assert.match(html, /Roshan Samarawickrema/);
  assert.match(html, /Practice Operations/);
  assert.match(html, /href="tel:\+61481706474"/);
  assert.match(html, /mailto:roshan@tmedicals\.com\.au\?subject=GP%20opportunity%20%E2%80%94%20Woolloongabba/);
  assert.match(html, /body=Hi%20Roshan/);
  assert.match(html, /Availability%20%2F%20sessions%20of%20interest/);
  assert.match(html, />Phone</);
  assert.match(html, />Email</);
  assert.match(html, /Request Callback/);
  assert.match(html, /href="join-our-team\/express-interest\.html"/);
  assert.match(html, /Confidentiality/);
  assert.match(html, /No CV required/);
  assert.doesNotMatch(html, /Direct recruitment contact/);
  assert.match(html, /Confidential discussion/);
  assert.match(html, /Current employer will not be contacted/);
  assert.doesNotMatch(html, /doctor-readiness|GP Attraction|Am I ready|page-nav|On This Page/i);
});
