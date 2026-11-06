import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildPracticeOperationsSnapshot } from "./practice-operations-dashboard";

describe("practice operations dashboard", () => {
  it("surfaces action queues and KPI strips from module stats", () => {
    const snapshot = buildPracticeOperationsSnapshot({
      careers: {
        openVacancies: 2,
        newApplications: 3,
        applicationsToday: 1,
        awaitingReview: 4,
        interviews: 1,
        hiredThisMonth: 0,
      },
      patients: {
        totalOpen: 5,
        newToday: 2,
        awaitingAction: 3,
        assigned: 1,
        waitingForPatient: 1,
        overdue: 2,
        closedThisWeek: 4,
      },
      media: {
        total: 40,
        unused: 6,
        largeFiles: 2,
        missingAlt: 7,
        recentUploads: 3,
      },
      search: {
        topSearches: 18,
        risingSearches: 3,
        noResults: 5,
        highestOpportunityScore: 82,
        opportunityQueue: 6,
        pagesDue: 4,
        reviewsOverdue: 1,
        pagesUpdatedThisMonth: 9,
      },
    });

    assert.equal(snapshot.actionCentre.length, 6);
    assert.equal(snapshot.actionCentre.find((item) => item.id === "applications")?.value, 4);
    assert.equal(snapshot.actionCentre.find((item) => item.id === "overdue-content")?.tone, "critical");
    assert.ok(snapshot.needsAttentionTotal >= 4 + 3 + 4 + 1 + 7);
    assert.equal(snapshot.recruitment[4]?.label, "Hired this month");
    assert.equal(snapshot.patientOps.find((card) => card.label === "Waiting for patient")?.value, 1);
    assert.equal(snapshot.search.find((card) => card.label === "Highest opportunity score")?.value, 82);
    assert.equal(snapshot.media.find((card) => card.label === "Missing alt text")?.value, 7);
  });

  it("tolerates missing modules without inventing noise", () => {
    const snapshot = buildPracticeOperationsSnapshot({
      careers: null,
      patients: null,
      media: null,
      search: null,
    });
    assert.equal(snapshot.needsAttentionTotal, 0);
    assert.equal(snapshot.recruitment.every((card) => card.value === 0), true);
  });
});
