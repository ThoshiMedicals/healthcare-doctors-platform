import assert from "node:assert/strict";
import test from "node:test";
import {
  APPROVED_GP_CATALOG,
  buildPreferredGpRecord,
  getBookingModeForSlug,
  GOLNAR_APPROVED_HOTDOC_URL,
  parsePreferredGp,
  PREFERRED_GP_STORAGE_KEY,
  resolvePreferredGpBookingCta,
  serializePreferredGp,
  slugFromProfilePath,
} from "./patient-preferred-gp";

test("storage key is stable v1", () => {
  assert.equal(PREFERRED_GP_STORAGE_KEY, "wmc.preferredGp.v1");
});

test("catalog includes Mary phone-only and Golnar online", () => {
  assert.ok(APPROVED_GP_CATALOG.some((e) => e.slug === "dr-mary-abadir"));
  assert.ok(APPROVED_GP_CATALOG.some((e) => e.slug === "dr-golnar-mortezaei"));
  assert.equal(getBookingModeForSlug("dr-mary-abadir"), "PHONE_ONLY");
  assert.equal(getBookingModeForSlug("dr-golnar-mortezaei"), "ONLINE");
  assert.equal(getBookingModeForSlug("dr-anand-singh"), "PROFILE");
});

test("slugFromProfilePath resolves approved doctor paths", () => {
  assert.equal(slugFromProfilePath("doctors/dr-tanya-goodwill.html"), "dr-tanya-goodwill");
  assert.equal(slugFromProfilePath("/doctors/dr-golnar-mortezaei.html"), "dr-golnar-mortezaei");
  assert.equal(slugFromProfilePath("doctors/unknown.html"), null);
});

test("serialize and parse round-trip", () => {
  const record = buildPreferredGpRecord("dr-debra-larkins", "2026-11-11T10:00:00.000Z");
  assert.ok(record);
  const raw = serializePreferredGp(record!);
  const parsed = parsePreferredGp(raw);
  assert.deepEqual(parsed, record);
});

test("parse rejects tampered or unknown slugs", () => {
  const bad = serializePreferredGp({
    slug: "dr-not-in-catalog",
    name: "Dr X",
    profilePath: "doctors/dr-x.html",
    updatedAt: "2026-11-11T10:00:00.000Z",
  });
  assert.equal(parsePreferredGp(bad), null);
  assert.equal(parsePreferredGp("{not json"), null);
});

test("resolvePreferredGpBookingCta respects booking policy hints", () => {
  const mary = APPROVED_GP_CATALOG.find((e) => e.slug === "dr-mary-abadir")!;
  const golnar = APPROVED_GP_CATALOG.find((e) => e.slug === "dr-golnar-mortezaei")!;
  const tanya = APPROVED_GP_CATALOG.find((e) => e.slug === "dr-tanya-goodwill")!;

  assert.match(resolvePreferredGpBookingCta(mary).href, /^tel:\+61732173344$/);
  assert.equal(resolvePreferredGpBookingCta(golnar).href, GOLNAR_APPROVED_HOTDOC_URL);
  assert.equal(resolvePreferredGpBookingCta(golnar).external, true);
  assert.equal(resolvePreferredGpBookingCta(tanya).href, tanya.profilePath);
});
