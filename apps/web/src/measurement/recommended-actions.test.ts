import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildPracticeDigitalReceptionDashboard } from "./digital-reception-report";
import { buildExecutiveFixtureEvents } from "./fixtures";
import { buildPracticePractitionerAuthorityDashboard } from "./practitioner-authority-report";
import {
  buildRecommendedActions,
  isActionableRecommendationHref,
  type RecommendedActionLinkBuilders,
} from "./recommended-actions";
import { buildPracticeServiceAuthorityDashboard } from "./service-authority-report";
import type { AuthorityTier } from "./authority-framework";

const LINKS: RecommendedActionLinkBuilders = {
  digitalReceptionIntent: (intent) =>
    `/admin/digital-reception?intent=${encodeURIComponent(intent)}#intent-${intent}`,
  digitalReceptionIntentInvestigation: (intent) =>
    `/admin/digital-reception?intent=${encodeURIComponent(intent)}&from=recommendation#intent-${intent}`,
  serviceAuthority: (slug) => `/admin/service-authority?focus=${slug}`,
  serviceAuthorityInvestigation: (slug) =>
    `/admin/service-authority?focus=${slug}&from=recommendation`,
  practitionerAuthority: (slug) => `/admin/practitioner-authority?focus=${slug}`,
  practitionerAuthorityInvestigation: (slug) =>
    `/admin/practitioner-authority?focus=${slug}&from=recommendation`,
  conversionService: (slug) => `/admin/conversion-intelligence?service=${slug}&from=recommendation`,
  conversionPractitioner: (slug) =>
    `/admin/conversion-intelligence?practitioner=${slug}&from=recommendation`,
  conversionIntent: (intent) =>
    `/admin/conversion-intelligence?intent=${encodeURIComponent(intent)}&from=recommendation`,
  governanceReview: (queue) => `/admin/governance?queue=${queue}&from=recommendation`,
  governanceManagement: (queue) =>
    `/admin/governance/management?queue=${queue}&from=recommendation`,
  governanceExpiry: "/admin/governance/expiry?from=recommendation",
};

function assertFullyActionable(
  action: ReturnType<typeof buildRecommendedActions>[number],
) {
  assert.ok(action.priority);
  assert.ok(action.impact);
  assert.ok(action.reason);
  assert.equal(action.fixList.label, "Open Fix List");
  assert.equal(action.investigation.label, "Open Investigation");
  assert.equal(action.relatedDashboard.label, "Related Dashboard");
  for (const link of [action.fixList, action.investigation, action.relatedDashboard]) {
    assert.ok(
      isActionableRecommendationHref(link.href),
      `expected actionable href, got ${link.href}`,
    );
  }
}

describe("recommended actions (C6 + D7)", () => {
  it("rejects bare dashboard homepages as actionable", () => {
    assert.equal(isActionableRecommendationHref("/admin/service-authority"), false);
    assert.equal(isActionableRecommendationHref("/admin/service-authority?range=last_7"), false);
    assert.equal(isActionableRecommendationHref("/admin/service-authority?focus=telehealth"), true);
    assert.equal(isActionableRecommendationHref("/admin/governance?queue=expired"), true);
    assert.equal(isActionableRecommendationHref("/admin/governance/expiry"), true);
  });

  it("emits guidance cards for high-search low-resolution intents with three deep links", () => {
    const now = new Date("2026-10-26T02:00:00.000Z");
    const dr = buildPracticeDigitalReceptionDashboard(buildExecutiveFixtureEvents(now), "last_7", now);
    const actions = buildRecommendedActions({
      digitalReception: {
        ...dr,
        flagged_intents: [
          {
            intent_bucket: "new_patient",
            searches: 22,
            resolved: 4,
            zero_results: 10,
            result_clicks: 2,
            resolution_rate: 18,
            zero_result_rate: 45,
            resolution_band: "red",
            flagged: true,
          },
        ],
      },
      links: LINKS,
    });

    const intent = actions.find((action) => action.id === "dr-intent-new_patient");
    assert.ok(intent);
    assert.equal(intent.priority, "p0");
    assert.equal(intent.impact, "high");
    assert.match(intent.reason, /High-search, low-resolution/);
    assert.match(intent.action, /Digital Reception/);
    assert.match(intent.fixList.href, /intent=new_patient/);
    assert.match(intent.investigation.href, /from=recommendation/);
    assert.match(intent.relatedDashboard.href, /conversion-intelligence.*intent=new_patient/);
    assertFullyActionable(intent);
  });

  it("flags high-view low-contact services into affected service investigations", () => {
    const now = new Date("2026-10-26T02:00:00.000Z");
    const events = buildExecutiveFixtureEvents(now);

    const services = buildPracticeServiceAuthorityDashboard(
      events,
      [
        {
          slug: "telehealth",
          url: "/services/telehealth.html",
          title: "Telehealth",
          related_practitioners: 2,
          related_knowledge: 1,
          related_services: 0,
          inbound_article_links: 3,
          inbound_practitioner_links: 2,
          authority_score: 8,
          tier: "Hub" as AuthorityTier,
        },
      ],
      "last_7",
      now,
    );

    const patchedServices = {
      ...services,
      services: services.services.map((row) =>
        row.slug === "telehealth"
          ? { ...row, service_views: 40, contact_rate: 8, booking_clicks: 1, call_clicks: 1 }
          : row,
      ),
    };

    const practitioners = buildPracticePractitionerAuthorityDashboard(
      events,
      [
        {
          slug: "dr-tanya-goodwill",
          url: "/doctors/dr-tanya-goodwill.html",
          title: "Dr Tanya Goodwill",
          practitioner_links: 4,
          inbound_article_links: 5,
          related_services: 3,
          authority_score: 9,
          tier: "Hub" as AuthorityTier,
        },
      ],
      "last_7",
      now,
    );

    const patchedPractitioners = {
      ...practitioners,
      practitioners: practitioners.practitioners.map((row) =>
        row.slug === "dr-tanya-goodwill"
          ? {
              ...row,
              profile_views: 30,
              booking_intent: 10,
              booking_clicks: 2,
              tier: "Hub" as AuthorityTier,
              authority_score: 9,
            }
          : row,
      ),
    };

    const actions = buildRecommendedActions({
      services: patchedServices,
      practitioners: patchedPractitioners,
      links: LINKS,
    });

    const service = actions.find((action) => action.id === "sa-contact-telehealth");
    assert.ok(service);
    assert.match(service.fixList.href, /service-authority.*focus=telehealth/);
    assert.match(service.relatedDashboard.href, /conversion-intelligence.*service=telehealth/);
    assertFullyActionable(service);

    const practitioner = actions.find((action) => action.id === "pa-booking-dr-tanya-goodwill");
    assert.ok(practitioner);
    assert.match(practitioner.fixList.href, /practitioner-authority.*focus=dr-tanya-goodwill/);
    assertFullyActionable(practitioner);

    assert.ok(actions.every((action) => action.reason && action.action && action.priority && action.impact));
  });

  it("opens affected reviews for an expiring governance cluster", () => {
    const actions = buildRecommendedActions({
      governance: {
        totals: {
          total: 12,
          awaiting_review: 1,
          due_within_60_days: 4,
          expired: 2,
          missing_ownership: 0,
          missing_approval: 0,
          missing_review_metadata: 0,
        },
        pages_due_within_60_days: [],
        pages_expired: [],
      },
      links: LINKS,
    });

    const cluster = actions.find((action) => action.id === "gov-expiring-cluster");
    assert.ok(cluster);
    assert.equal(cluster.priority, "p0");
    assert.match(cluster.reason, /Expiring governance cluster/);
    assert.match(cluster.fixList.href, /\/admin\/governance\?.*queue=expired/);
    assert.match(cluster.investigation.href, /\/admin\/governance\/management\?.*queue=expired/);
    assert.match(cluster.relatedDashboard.href, /\/admin\/governance\/expiry/);
    assertFullyActionable(cluster);
  });
});
