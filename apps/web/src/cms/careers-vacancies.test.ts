import assert from "node:assert/strict";
import test from "node:test";
import type { Vacancy } from "@prisma/client";
import { renderVacanciesMarkup, renderVacancyCard } from "./careers-vacancies";

function sample(partial: Partial<Vacancy> = {}): Vacancy {
  return {
    id: "vac_1",
    clinicId: "clinic_1",
    title: "General Practitioner (VR GP)",
    status: "now_hiring",
    location: "Woolloongabba, Brisbane",
    employmentType: "Full-Time or Part-Time",
    roleCategory: "general_practitioner",
    shortSummary: "Join a continuity-focused practice.",
    fullDescription: "Trusted Brisbane general practice.\n\n- Clinical autonomy\n- Collaborative team",
    remunerationNote: "70% billings",
    offerHighlights: ["70,000+ active patient files", "70% billings", "Flexible sessions"],
    requirements: ["Current AHPRA registration"],
    applyUrl: "",
    featured: false,
    displayOrder: 1,
    active: true,
    publishedAt: new Date("2026-11-03T00:00:00.000Z"),
    expiresAt: null,
    createdAt: new Date("2026-11-03T00:00:00.000Z"),
    updatedAt: new Date("2026-11-03T00:00:00.000Z"),
    ...partial,
  };
}

test("renders expandable vacancy cards with status badges", () => {
  const html = renderVacancyCard(sample());
  assert.match(html, /<details class="careers-opportunity-card/);
  assert.match(html, /Open/);
  assert.match(html, /View Opportunity/);
  assert.match(html, /Apply Confidentially/);
  assert.match(html, /data-talent-vacancy-id="/);
  assert.match(html, /Offer highlights/);
  assert.match(html, /AHPRA/);
});

test("strips unverified guarantee windows from vacancy cards", () => {
  const html = renderVacancyCard(
    sample({
      remunerationNote: "Guaranteed $250/hr for 3 months",
      offerHighlights: [
        "Guaranteed $250 per hour for first 3 months",
        "70% of billings after guarantee period",
        "Flexible sessions",
      ],
    }),
  );
  assert.doesNotMatch(html, /first 3 months/i);
  assert.doesNotMatch(html, /Guaranteed \$250\/hr for 3 months/);
  assert.match(html, /75% Billings/);
  assert.match(html, /Flexible sessions/);
});

test("empty careers state avoids implying active recruitment", () => {
  const html = renderVacanciesMarkup([]);
  assert.match(html, /not currently advertising a specific role/i);
  assert.doesNotMatch(html, /General Practitioner \(VR GP\)/);
});

test("gp-recruit empty state falls back to offer-featured VR GP card", () => {
  const html = renderVacanciesMarkup([], { variant: "gp-recruit" });
  assert.match(html, /Featured Opportunity/);
  assert.match(html, /VR General Practitioner/);
  assert.match(html, /View Opportunity/);
  assert.match(html, /GP Readiness Portal/);
  assert.match(html, /data-gp-readiness-open="true"/);
  assert.match(html, /data-offer-featured="true"/);
  assert.match(html, /data-gp-recruit-vacancies="true"/);
  assert.doesNotMatch(html, /Expressions of Interest Welcome/);
});

test("gp-recruit featured card renders first with view CTA from offer facts", () => {
  const html = renderVacanciesMarkup(
    [
      sample({
        id: "vac_2",
        title: "Practice Nurse",
        roleCategory: "practice_nurse",
        featured: false,
        displayOrder: 1,
      }),
      sample({
        id: "vac_1",
        title: "VR General Practitioner",
        featured: true,
        displayOrder: 9,
        offerHighlights: [],
      }),
    ],
    { variant: "gp-recruit", pagePath: "join-our-team.html" },
  );
  assert.match(html, /Featured Opportunity/);
  assert.match(html, /VR General Practitioner/);
  assert.match(html, /View Opportunity/);
  assert.match(html, /\$250\/hr for agreed sessions/);
  assert.match(html, /Established Patient Demand/);
  assert.match(html, /AGPAL Accredited Practice/);
  assert.match(html, /Confidential discussions available/);
  assert.match(html, /data-recruitment-contact="true"/);
  const featuredIdx = html.indexOf("Featured Opportunity");
  const nurseIdx = html.indexOf("Practice Nurse");
  assert.ok(featuredIdx >= 0 && nurseIdx > featuredIdx);
  const featuredSlice = html.slice(featuredIdx, nurseIdx);
  assert.doesNotMatch(featuredSlice, /75% Billings/);
  assert.match(featuredSlice, /\$250\/hr for agreed sessions/);
  assert.match(featuredSlice, /GP Readiness Portal/);
  const nurseSlice = html.slice(nurseIdx);
  assert.match(nurseSlice, /View Opportunity/);
  assert.doesNotMatch(nurseSlice, /Prepare Your Onboarding|GP Readiness Portal|data-gp-readiness-open/);
});

test("gp-recruit readiness CTAs only appear on GP vacancy cards", () => {
  const html = renderVacanciesMarkup(
    [
      sample({
        id: "vac_gp",
        title: "General Practitioner (GP)",
        roleCategory: "general_practitioner",
        featured: false,
      }),
      sample({
        id: "vac_rx",
        title: "Medical Receptionist",
        roleCategory: "reception",
        featured: false,
        offerHighlights: [],
        remunerationNote: "",
      }),
    ],
    { variant: "gp-recruit", pagePath: "join-our-team.html" },
  );
  const gpSlice = html.slice(html.indexOf("General Practitioner (GP)"), html.indexOf("Medical Receptionist"));
  const rxSlice = html.slice(html.indexOf("Medical Receptionist"));
  assert.match(gpSlice, /Prepare Your Onboarding/);
  assert.match(gpSlice, /data-gp-readiness-open="true"/);
  assert.doesNotMatch(rxSlice, /Prepare Your Onboarding|GP Readiness Portal|data-gp-readiness-open/);
});
