import assert from "node:assert/strict";
import test from "node:test";
import {
  careFilterTokens,
  isNewToPracticeActive,
  NEW_TO_PRACTICE_DAYS,
  parseGrowthFields,
  resolvePractitionerServices,
} from "./practitioner-growth";

test("new badge active inside 60-day window and expires after", () => {
  const start = new Date("2026-11-01T00:00:00.000Z");
  assert.equal(isNewToPracticeActive(start.toISOString(), new Date("2026-11-06T00:00:00.000Z")), true);
  const after = new Date(start.getTime() + (NEW_TO_PRACTICE_DAYS + 1) * 24 * 60 * 60 * 1000);
  assert.equal(isNewToPracticeActive(start.toISOString(), after), false);
});

test("not_accepting forces acceptingNewPatients false", () => {
  const growth = parseGrowthFields({
    acceptingNewPatients: true,
    availabilityStatus: "not_accepting",
  });
  assert.equal(growth.acceptingNewPatients, false);
});

test("care filter tokens map published interests", () => {
  const tokens = careFilterTokens(["Women's health", "Chronic disease management", "Children's health"]);
  assert.deepEqual(tokens.sort(), ["childrens-health", "chronic-disease", "womens-health"]);
});

test("resolve services prefers relatedServices paths", () => {
  const services = resolvePractitionerServices(
    ["services/chronic-disease-care.html"],
    ["Women's health"],
  );
  assert.equal(services.length, 1);
  assert.equal(services[0].path, "services/chronic-disease-care.html");
});
