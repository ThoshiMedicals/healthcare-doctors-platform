import assert from "node:assert/strict";
import test from "node:test";
import {
  WMC_RECRUITMENT_OFFER,
  offerBillingHeadline,
  offerFaqBillingAnswer,
  offerFaqPercentageAnswer,
  offerFeaturedHighlights,
  offerHasHourlyGuarantee,
  offerPatientDemandHeadline,
  offerPatientDemandSupport,
  resolvePublicRemunerationNote,
  sanitizeVacancyOfferHighlights,
} from "./offer-config";

test("offer config is the canonical commercial and scale source", () => {
  assert.equal(WMC_RECRUITMENT_OFFER.billingPercentage, "75%");
  assert.equal(WMC_RECRUITMENT_OFFER.billingSplitLabel, "75/25");
  assert.equal(WMC_RECRUITMENT_OFFER.gps, "10+");
  assert.equal(WMC_RECRUITMENT_OFFER.nurses, "5+");
  assert.equal(WMC_RECRUITMENT_OFFER.negotiable, true);
  assert.equal(WMC_RECRUITMENT_OFFER.activePatientFiles, "70,000+");
  assert.equal(WMC_RECRUITMENT_OFFER.consultRooms, 11);
  assert.equal(WMC_RECRUITMENT_OFFER.agpalAccredited, true);
  assert.equal(offerHasHourlyGuarantee(), true);
  assert.equal(WMC_RECRUITMENT_OFFER.hourlyGuarantee, "$250/hr");
  assert.equal(offerPatientDemandHeadline(), "Established Patient Demand");
  assert.match(offerPatientDemandSupport(), /70,000\+ patient files and ongoing appointment demand/);
  assert.equal("typicalBusyListWindow" in WMC_RECRUITMENT_OFFER, false);
});

test("derived offer copy stays aligned across surfaces", () => {
  assert.match(offerBillingHeadline(), /75% billings/);
  assert.match(offerFaqBillingAnswer(), /75% billings/);
  assert.match(offerFaqBillingAnswer(), /\$250\/hr/);
  assert.match(offerFaqPercentageAnswer(), /75% billings/);
  const highlights = offerFeaturedHighlights().join(" ");
  assert.match(highlights, /\$250\/hr for agreed sessions/);
  assert.doesNotMatch(highlights, /75% Billings/);
  assert.match(highlights, /Established Patient Demand/);
  assert.match(highlights, /AGPAL Accredited Practice/);
  assert.match(highlights, /Flexible Consulting Sessions/);
});

test("sanitizeVacancyOfferHighlights drops unverified guarantee windows and normalises billings", () => {
  const cleaned = sanitizeVacancyOfferHighlights(
    [
      "Guaranteed $250 per hour for first 3 months",
      "70% of billings after guarantee period",
      "Flexible sessions",
    ],
    { isGpRole: true },
  );
  // Unverified "first 3 months" window is dropped; SSoT billings remain.
  assert.doesNotMatch(cleaned.join(" "), /first 3 months/i);
  assert.ok(cleaned.includes("75% Billings"));
  assert.ok(cleaned.includes("Flexible sessions"));
});

test("resolvePublicRemunerationNote ignores unverified CMS notes for GPs", () => {
  assert.equal(
    resolvePublicRemunerationNote("Guaranteed $250/hr for 3 months", { isGpRole: true, featured: true }),
    "75% billings (negotiable)",
  );
  assert.equal(resolvePublicRemunerationNote("Guaranteed $250/hr for 3 months", { isGpRole: true }), "");
  assert.equal(
    resolvePublicRemunerationNote("75% billings", { isGpRole: true, featured: true }),
    "75% billings (negotiable)",
  );
  assert.equal(
    resolvePublicRemunerationNote("$250/hr for agreed sessions", { isGpRole: true, featured: true }),
    "$250/hr for agreed sessions",
  );
});
