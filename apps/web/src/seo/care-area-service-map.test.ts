import assert from "node:assert/strict";
import test from "node:test";
import { matchingCareLabel, servicesForCareAreas } from "./care-area-service-map";

test("maps Golnar care areas to chronic and preventive services without inventing womens health", () => {
  const areas = ["Veterans' health", "Chronic disease management", "Diabetes"];
  const services = servicesForCareAreas(areas);
  assert.equal(
    services.some((s) => s.path === "services/chronic-disease-care.html"),
    true,
  );
  assert.equal(
    services.some((s) => s.path === "services/womens-health.html"),
    false,
  );
  assert.equal(matchingCareLabel(areas, "services/womens-health.html"), null);
  assert.ok(matchingCareLabel(areas, "services/chronic-disease-care.html"));
});

test("maps James care areas to children, mental, and family", () => {
  const areas = ["Children's health", "Mental health", "Family medicine"];
  const services = servicesForCareAreas(areas).map((s) => s.path).sort();
  assert.deepEqual(services, [
    "services/childrens-health.html",
    "services/family-health.html",
    "services/mental-health.html",
  ]);
});

test("Women's health does not also map to men's health", () => {
  const straight = servicesForCareAreas(["Women's health"]).map((s) => s.path);
  const curly = servicesForCareAreas(["Women\u2019s health"]).map((s) => s.path);
  assert.deepEqual(straight, ["services/womens-health.html"]);
  assert.deepEqual(curly, ["services/womens-health.html"]);
});

test("skin and chronic labels qualify both skin service paths and chronic medical conditions", () => {
  assert.ok(matchingCareLabel(["Skin cancer care"], "services/skin-cancer-care.html"));
  assert.ok(matchingCareLabel(["Skin checks"], "services/skin-checks.html"));
  assert.ok(matchingCareLabel(["Chronic medical conditions"], "services/chronic-disease-care.html"));
  const skin = servicesForCareAreas(["Skin cancer"]).map((s) => s.path).sort();
  assert.deepEqual(skin, ["services/skin-cancer-care.html", "services/skin-checks.html"]);
});

test("maps adolescent and youth health to children's health service", () => {
  const services = servicesForCareAreas(["Adolescent and youth health"]).map((s) => s.path);
  assert.deepEqual(services, ["services/childrens-health.html"]);
});

test("maps shared antenatal care and pre-pregnancy interests without inventing services", () => {
  const antenatal = servicesForCareAreas(["Shared antenatal care"]).map((s) => s.path);
  assert.ok(antenatal.includes("services/antenatal-postnatal-care.html"));
  const pre = servicesForCareAreas(["Pre-pregnancy counselling", "Recurrent miscarriage"]).map((s) => s.path).sort();
  assert.ok(pre.includes("services/pre-pregnancy-care.html"));
  assert.ok(pre.includes("services/womens-health.html"));
});
