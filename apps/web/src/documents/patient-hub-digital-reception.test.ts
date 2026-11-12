import assert from "node:assert/strict";
import test from "node:test";
import {
  DIGITAL_RECEPTION_OPEN_ARIA_LABEL,
  applyPatientHubDigitalReception,
  ensureDigitalReceptionHubShortcut,
  ensureDigitalReceptionOpenAriaLabels,
  ensureDigitalReceptionOpenDelegate,
} from "./patient-hub-digital-reception";

const dock =
  '<nav aria-label="Appointment actions" class="persistent-care-actions"><div class="persistent-care-actions-inner">' +
  '<button type="button" class="digital-reception-launcher digital-reception-dock-action" aria-expanded="false">Digital Reception</button>' +
  "</div></nav>";

function patientHubPage(): string {
  return (
    `<html><head><title>Patient Hub</title></head><body class="has-persistent-care-actions">` +
    `<main><section class="patient-hub-tasks" id="common-patient-tasks"><div class="shell">` +
    `<h2>Common patient tasks</h2><p>Start here.</p>` +
    `<div class="patient-hub-task-grid">` +
    `<a href="repeat-scripts.html"><strong>Repeat Scripts</strong><span>Renew a script.</span></a>` +
    `</div></div></section></main>` +
    `${dock}</body></html>`
  );
}

test("patient hub: injected task grid contains data-open-digital-reception primary action", () => {
  const result = ensureDigitalReceptionHubShortcut(patientHubPage(), "patient-hub.html");
  assert.match(result, /patient-hub-dr-primary/);
  assert.match(result, /data-open-digital-reception/);
  assert.match(result, /id="digital-reception"/);
  assert.match(
    result,
    new RegExp(
      `aria-label="${DIGITAL_RECEPTION_OPEN_ARIA_LABEL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`,
    ),
  );
  assert.ok(
    result.indexOf("patient-hub-task-grid") < result.indexOf("data-open-digital-reception"),
    "DR shortcut lives inside the task grid",
  );
});

test("A11Y-002: ensureDigitalReceptionOpenAriaLabels fills missing dock aria-label on hubs only", () => {
  const html =
    '<html><body><button type="button" data-open-digital-reception="">Digital Reception</button>' +
    '<button type="button" data-open-digital-reception="" aria-label="Open Digital Reception — ask for information">Already</button></body></html>';
  const once = ensureDigitalReceptionOpenAriaLabels(html, "patient-hub.html");
  const twice = ensureDigitalReceptionOpenAriaLabels(once, "patient-hub.html");
  assert.equal(once, twice);
  assert.equal(
    (once.match(/aria-label="Open Digital Reception — ask for information"/g) || []).length,
    2,
  );
  const homepage = ensureDigitalReceptionOpenAriaLabels(html, "index.html");
  assert.equal(homepage, html);
});

test("patient hub: hash bootstrap script for PWA shortcut fragments", () => {
  const result = ensureDigitalReceptionHubShortcut(patientHubPage(), "patient-hub.html");
  assert.match(result, /id="wmc-patient-hub-dr-hash"/);
  assert.match(result, /digital-reception-panel/);
});

test("open delegate is injected idempotently when triggers exist", () => {
  const withTrigger =
    '<html><body><button type="button" data-open-digital-reception="">Open</button></body></html>';
  const once = ensureDigitalReceptionOpenDelegate(withTrigger);
  const twice = ensureDigitalReceptionOpenDelegate(once);
  assert.match(once, /id="wmc-digital-reception-open-delegate"/);
  assert.match(once, /querySelector\("\.digital-reception-launcher"\)/);
  assert.equal((twice.match(/wmc-digital-reception-open-delegate/g) || []).length, 1);
});

test("applyPatientHubDigitalReception wires hub shortcut and delegate together", () => {
  const result = applyPatientHubDigitalReception(patientHubPage(), "patient-hub.html");
  assert.match(result, /data-open-digital-reception/);
  assert.match(result, /wmc-digital-reception-open-delegate/);
  assert.match(
    result,
    new RegExp(
      `aria-label="${DIGITAL_RECEPTION_OPEN_ARIA_LABEL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`,
    ),
  );
});

test("non-hub pages are untouched by ensureDigitalReceptionHubShortcut", () => {
  const html = patientHubPage();
  const result = ensureDigitalReceptionHubShortcut(html, "patient-information.html");
  assert.equal(result, html);
});
