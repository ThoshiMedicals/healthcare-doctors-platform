import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  appendFormRequestHistory,
  isFormRequestStatus,
  normalizeFormRequestType,
  patientRequestWhere,
} from "./patient-requests";

describe("patient requests helpers", () => {
  it("normalises legacy and canonical request types", () => {
    assert.equal(normalizeFormRequestType("New patient registration"), "Patient Registration");
    assert.equal(normalizeFormRequestType("Medical records transfer request"), "Medical Records");
    assert.equal(normalizeFormRequestType("Feedback"), "Feedback");
    assert.equal(normalizeFormRequestType("Something odd"), "Other");
  });

  it("recognises statuses and builds inbox filters", () => {
    assert.equal(isFormRequestStatus("waiting_for_patient"), true);
    assert.equal(isFormRequestStatus("bogus"), false);
    const where = patientRequestWhere("clinic-1", {
      q: "Jane",
      status: "new",
      formType: "Patient Registration",
      assignedToUserId: "unassigned",
      from: "2026-11-01",
      to: "2026-11-30",
    });
    assert.equal(where.clinicId, "clinic-1");
    assert.equal(where.status, "new");
    assert.equal(where.formType, "Patient Registration");
    assert.equal(where.assignedToUserId, null);
    assert.ok(where.OR);
  });

  it("appends status history for audit", () => {
    const history = appendFormRequestHistory([], {
      at: "2026-11-03T00:00:00.000Z",
      action: "created",
      to: "new",
    });
    const next = appendFormRequestHistory(history, {
      at: "2026-11-03T01:00:00.000Z",
      actorName: "Reception",
      action: "status",
      from: "new",
      to: "assigned",
    });
    assert.equal(next.length, 2);
    assert.equal(next[1]?.action, "status");
  });
});
