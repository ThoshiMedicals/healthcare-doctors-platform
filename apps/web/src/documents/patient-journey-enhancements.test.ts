import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";
import { refinePatientHubMobileDashboard } from "./patient-hub-mobile-dashboard";
import {
  PATIENT_JOURNEY_CARE_HUB_ID,
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

test("M1: single Prepare for Your Visit entry + Care Hub grid + Clear", () => {
  const once = hubWithJourney();
  const twice = refinePatientJourneyEnhancements(once, "patient-hub.html");
  const off = refinePatientJourneyEnhancements(fixture, "team.html");

  assert.match(once, /data-wmc-journey-entry/);
  assert.match(once, /Prepare for Your Visit/);
  assert.match(once, new RegExp(`href="#${PATIENT_JOURNEY_CARE_HUB_ID}"`));
  assert.match(once, /data-wmc-care-hub/);
  assert.match(once, /id="wmc-care-hub"/);
  assert.match(once, /data-wmc-visit-prep/);
  assert.match(once, /data-wmc-visit-prep-clear/);
  assert.match(once, /Clear checklist/);
  assert.match(once, new RegExp(PATIENT_JOURNEY_VISIT_PREP_STORAGE_KEY.replace(/\./g, "\\.")));
  assert.match(once, /More practice information/);
  assert.doesNotMatch(once, /pathology|clinical result|medical record/i);
  assert.doesNotMatch(once, /wmc_family_gps|five-tab|open now|closed now/i);

  // Hub primary band should not dump all 11 links as the only Care Hub surface —
  // entry card comes first after install.
  const install = once.indexOf("data-wmc-hub-install-card");
  const entry = once.indexOf("data-wmc-journey-entry");
  const care = once.indexOf('id="wmc-care-hub"');
  const preferred = once.indexOf('id="preferred-gp-panel"');
  assert.ok(preferred > -1 && install > preferred);
  assert.ok(entry > install);
  assert.ok(care > entry);

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
});

test("M1 visit prep ids are boolean-only checklist keys", () => {
  assert.equal(PATIENT_JOURNEY_VISIT_PREP_STORAGE_KEY, "wmc.visitPrep.v1");
  assert.deepEqual(listPatientJourneyVisitPrepIds(), [
    "medicare",
    "arrive",
    "reason",
    "telehealth",
  ]);
});
