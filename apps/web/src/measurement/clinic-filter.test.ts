import assert from "node:assert/strict";
import test from "node:test";
import { filterEventsForClinic } from "@/measurement/clinic-filter";
import type { MeasurementEvent } from "@/measurement/types";

function event(partial: Partial<MeasurementEvent>): MeasurementEvent {
  return {
    event: "page_view",
    measurement_version: "2G",
    ts: "2026-11-03T00:00:00.000Z",
    page_path: "/",
    page_group: "home",
    ...partial,
  };
}

test("filters by clinic_slug and keeps unscoped rows for the default clinic", () => {
  const events = [
    event({ clinic_slug: "woolloongabba" }),
    event({}),
    event({ clinic_slug: "other-clinic" }),
  ];
  const filtered = filterEventsForClinic(events, { clinicSlug: "woolloongabba" });
  assert.equal(filtered.length, 2);
  assert.ok(filtered.every((row) => !row.clinic_slug || row.clinic_slug === "woolloongabba"));
});

test("excludes unscoped rows for a non-default clinic", () => {
  const events = [event({}), event({ clinic_slug: "other-clinic" })];
  const filtered = filterEventsForClinic(events, { clinicSlug: "other-clinic" });
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0]?.clinic_slug, "other-clinic");
});
