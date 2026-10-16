import assert from "node:assert/strict";
import test from "node:test";
import { revisionChanges } from "./revision-summary";
import { alignRestoredSnapshot, clinicEditorValues, snapshotStatus } from "./restore-sync";
import { brisbaneTime, listPageName, publicPageName } from "./staff-labels";

test("public page names replace file paths", () => {
  assert.equal(publicPageName("doctors/dr-tanya-goodwill.html"), "Dr Tanya Goodwill");
  assert.equal(publicPageName("new-patients.html"), "New Patients");
  assert.equal(listPageName("New Patients", "new-patients.html"), "New Patients");
  assert.equal(
    listPageName("A safe and respectful environment for everyone.", "patient-code-of-conduct.html"),
    "Patient Code of Conduct",
  );
});

test("revision timestamps use Brisbane time", () => {
  const label = brisbaneTime(new Date("2026-10-15T01:38:00.000Z"));
  assert.match(label, /15 Oct 2026/);
  assert.match(label, /11:38/);
  assert.doesNotMatch(label, /01:38|Z$/);
});

test("revision history summarises what changed", () => {
  const lines = revisionChanges(
    { phoneDisplay: "(07) 3217 3344", publishedPayload: { phoneDisplay: "(07) 3217 3344" } },
    { phoneDisplay: "(07) 3217 3399", publishedPayload: { phoneDisplay: "(07) 3217 3344" } },
  );
  assert.deepEqual(lines, ["Phone: (07) 3217 3344 → (07) 3217 3399"]);
});

test("published rollback copies the live clinic values and workflow status", () => {
  const restored = alignRestoredSnapshot("clinic_settings", {
    phoneDisplay: "(07) 3217 3399",
    email: "reception.desk@gabbamedicalcentre.com.au",
    contentStatus: "published",
    publishedPayload: {
      phoneDisplay: "(07) 3217 3344",
      email: "reception@gabbamedicalcentre.com.au",
      openingHours: [{ dayOfWeek: "sunday", opens: "09:00", closes: "15:00" }],
    },
    openingHours: [{ dayOfWeek: "sunday", opens: "09:00", closes: "16:00" }],
  });
  assert.equal(restored.phoneDisplay, "(07) 3217 3344");
  assert.equal(restored.email, "reception@gabbamedicalcentre.com.au");
  assert.equal(snapshotStatus(restored), "published");
  assert.equal((restored.openingHours as Array<{ closes: string }>)[0]?.closes, "15:00");
});

test("draft rollback keeps the draft in the editor and records draft status", () => {
  const restored = alignRestoredSnapshot("clinic_settings", {
    phoneDisplay: "(07) 3217 3399",
    contentStatus: "drafting",
    publishedPayload: { phoneDisplay: "(07) 3217 3344" },
  });
  assert.equal(restored.phoneDisplay, "(07) 3217 3399");
  assert.equal(snapshotStatus(restored), "drafting");
});

test("a published clinic form shows the public values", () => {
  const values = clinicEditorValues({
    contentStatus: "published",
    publishedPayload: { phoneDisplay: "(07) 3217 3344", email: "reception@gabbamedicalcentre.com.au" },
    streetAddress: "468 Vulture Street",
    suburb: "Woolloongabba",
    state: "QLD",
    postcode: "4102",
    phoneDisplay: "(07) 3217 3399",
    email: "reception.desk@gabbamedicalcentre.com.au",
    hotdocUrl: "",
    openingHours: [],
  });
  assert.equal(values.phoneDisplay, "(07) 3217 3344");
  assert.equal(values.email, "reception@gabbamedicalcentre.com.au");
});
