import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { refinePatientHubMobileDashboard } from "./patient-hub-mobile-dashboard";
import {
  PATIENT_JOURNEY_MARKER,
  PATIENT_JOURNEY_VISIT_PREP_STORAGE_KEY,
  listPatientJourneyCareLinks,
  listPatientJourneyVisitPrepIds,
  refinePatientJourneyEnhancements,
} from "./patient-journey-enhancements";

const fixture = readFileSync(
  path.join(import.meta.dirname, "..", "..", "fixtures", "patient-hub.html"),
  "utf8",
);

function hubWithJourney(): string {
  const dash = refinePatientHubMobileDashboard(fixture, "patient-hub.html");
  return refinePatientJourneyEnhancements(dash, "patient-hub.html");
}

test("refinePatientJourneyEnhancements: Care Hub + visit prep on Patient Hub only", () => {
  const once = hubWithJourney();
  const twice = refinePatientJourneyEnhancements(once, "patient-hub.html");
  const off = refinePatientJourneyEnhancements(fixture, "team.html");

  assert.match(once, /data-wmc-care-hub/);
  assert.match(once, /Care Hub/);
  assert.match(once, /data-wmc-visit-prep/);
  assert.match(once, /Prepare for your visit/);
  assert.match(once, new RegExp(PATIENT_JOURNEY_VISIT_PREP_STORAGE_KEY.replace(/\./g, "\\.")));
  assert.match(once, /id="wmc-patient-journey-visit-prep-runtime"/);
  assert.doesNotMatch(once, /pathology|prescription|clinical result|medical record/i);
  assert.doesNotMatch(once, /wmc_family_gps|five-tab|open now|closed now/i);

  for (const link of listPatientJourneyCareLinks()) {
    assert.match(once, new RegExp(`href="${link.href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
  }
  for (const id of listPatientJourneyVisitPrepIds()) {
    assert.match(once, new RegExp(`data-prep-id="${id}"`));
  }

  assert.equal(
    (once.match(new RegExp(`${PATIENT_JOURNEY_MARKER}:start`, "g")) || []).length,
    1,
  );
  assert.equal(
    (twice.match(new RegExp(`${PATIENT_JOURNEY_MARKER}:start`, "g")) || []).length,
    1,
  );
  assert.doesNotMatch(off, /data-wmc-care-hub/);

  const install = once.indexOf("data-wmc-hub-install-card");
  const care = once.indexOf("data-wmc-care-hub");
  const prep = once.indexOf("data-wmc-visit-prep");
  const preferred = once.indexOf('id="preferred-gp-panel"');
  assert.ok(preferred > -1 && install > preferred);
  assert.ok(care > install);
  assert.ok(prep > care);
});

test("visit prep storage key is device checklist only (boolean ids)", () => {
  assert.equal(PATIENT_JOURNEY_VISIT_PREP_STORAGE_KEY, "wmc.visitPrep.v1");
  assert.deepEqual(listPatientJourneyVisitPrepIds(), [
    "medicare",
    "arrive",
    "reason",
    "telehealth",
    "afterHours",
  ]);
});
