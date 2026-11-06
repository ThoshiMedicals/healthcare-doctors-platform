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
