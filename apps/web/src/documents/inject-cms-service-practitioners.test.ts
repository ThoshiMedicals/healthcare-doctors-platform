import assert from "node:assert/strict";
import test from "node:test";
import {
  buildServicePractitionerInjectLinks,
} from "./inject-cms-service-practitioners";
import type { CmsPractitionerCard } from "./inject-cms-practitioners";

const golnar: CmsPractitionerCard = {
  slug: "dr-golnar-mortezaei",
  name: "Dr Golnar Mortezaei",
  role: "General Practitioner",
  qualifications: ["MD", "FRACGP"],
  areasOfCare: ["Veterans' health", "Chronic disease management", "Diabetes"],
  portraitFile: null,
  bookingUrl: null,
  pagePath: "doctors/dr-golnar-mortezaei.html",
};

const james: CmsPractitionerCard = {
  slug: "dr-james",
  name: "Dr James Chanaka",
  role: "General Practitioner",
  qualifications: ["FRACGP"],
  areasOfCare: ["Children's health", "Mental health", "Family medicine"],
  portraitFile: null,
  bookingUrl: "https://www.hotdoc.com.au/example",
  pagePath: "doctors/dr-james.html",
};

const yamesha: CmsPractitionerCard = {
  slug: "dr-yamesha-ranatunga",
  name: "Dr Yamesha Ranatunga",
  role: "General Practitioner",
  qualifications: ["FRACGP"],
  areasOfCare: ["Women's health", "Adolescent and youth health", "Chronic disease management"],
  portraitFile: null,
  bookingUrl: "https://www.hotdoc.com.au/example-y",
  pagePath: "doctors/dr-yamesha-ranatunga.html",
};

test("chronic disease service receives Golnar and Yamesha from care areas", () => {
  const links = buildServicePractitionerInjectLinks(
    "services/chronic-disease-care.html",
    [golnar, james, yamesha],
    "",
  );
  assert.equal(links.some((l) => l.includes("dr-golnar-mortezaei")), true);
  assert.equal(links.some((l) => l.includes("dr-yamesha-ranatunga")), true);
  assert.equal(links.some((l) => l.includes("dr-james")), false);
});

test("womens health receives Yamesha only among the three CMS GPs", () => {
  const links = buildServicePractitionerInjectLinks("services/womens-health.html", [golnar, james, yamesha], "");
  assert.equal(links.length, 1);
  assert.match(links[0], /dr-yamesha-ranatunga/);
  assert.match(links[0], /Women'?s health/i);
});

test("does not duplicate an already-listed practitioner path", () => {
  const existing = `href="../doctors/dr-james.html"`;
  const links = buildServicePractitionerInjectLinks(
    "services/mental-health.html",
    [james],
    existing,
  );
  assert.equal(links.length, 0);
});
