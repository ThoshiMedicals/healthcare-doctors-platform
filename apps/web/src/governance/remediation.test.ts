import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { GovernanceManagementRow } from "./management-report";
import {
  GOVERNANCE_QUEUE_LABEL,
  GOVERNANCE_QUEUE_NEXT_ACTION,
  isGovernanceRemediationQueue,
  toRemediationItem,
  toRemediationItems,
} from "./remediation";

function row(overrides: Partial<GovernanceManagementRow> = {}): GovernanceManagementRow {
  return {
    id: "rev-1",
    path: "services/telehealth.html",
    title: "Telehealth",
    status: "under_review",
    collection: "service",
    segment: "services",
    contentOwner: "Dr Example",
    reviewedBy: null,
    approvedBy: null,
    lastReviewed: null,
    nextReviewDue: "2026-11-01",
    daysRemaining: 6,
    flags: {
      awaiting_review: true,
      due_within_60_days: true,
      expired: false,
      missing_ownership: false,
      missing_approval: false,
      missing_review_metadata: false,
    },
    ...overrides,
  };
}

describe("governance remediation (D5)", () => {
  it("labels the four remediable queues including Missing Owner", () => {
    assert.equal(GOVERNANCE_QUEUE_LABEL.awaiting_review, "Awaiting Review");
    assert.equal(GOVERNANCE_QUEUE_LABEL.due_soon, "Due Soon");
    assert.equal(GOVERNANCE_QUEUE_LABEL.expired, "Expired");
    assert.equal(GOVERNANCE_QUEUE_LABEL.missing_ownership, "Missing Owner");
    assert.ok(isGovernanceRemediationQueue("expired"));
    assert.equal(isGovernanceRemediationQueue("bogus"), false);
  });

  it("maps rows to affected item, next action, owner, and due date", () => {
    const item = toRemediationItem(row(), "due_soon");
    assert.equal(item.affectedItem, "Telehealth");
    assert.equal(item.nextAction, GOVERNANCE_QUEUE_NEXT_ACTION.due_soon);
    assert.equal(item.responsibleOwner, "Dr Example");
    assert.equal(item.ownerUnset, false);
    assert.equal(item.reviewDueDate, "2026-11-01");
    assert.match(item.reviewDueLabel, /2026-11-01/);
    assert.match(item.reviewDueLabel, /6d left/);
    assert.equal(item.recordHref, "/admin/governance/rev-1");
  });

  it("flags unset owners and overdue due dates for remediation", () => {
    const missing = toRemediationItem(
      row({
        contentOwner: null,
        nextReviewDue: null,
        daysRemaining: null,
        flags: {
          awaiting_review: false,
          due_within_60_days: false,
          expired: false,
          missing_ownership: true,
          missing_approval: false,
          missing_review_metadata: false,
        },
      }),
      "missing_ownership",
    );
    assert.equal(missing.responsibleOwner, "Owner unset");
    assert.equal(missing.ownerUnset, true);
    assert.equal(missing.reviewDueLabel, "No due date set");
    assert.equal(missing.nextAction, GOVERNANCE_QUEUE_NEXT_ACTION.missing_ownership);

    const expired = toRemediationItem(
      row({
        nextReviewDue: "2026-09-01",
        daysRemaining: -20,
        flags: {
          awaiting_review: false,
          due_within_60_days: false,
          expired: true,
          missing_ownership: false,
          missing_approval: false,
          missing_review_metadata: false,
        },
      }),
      "expired",
    );
    assert.match(expired.reviewDueLabel, /20d overdue/);
    assert.equal(expired.urgencyLabel, "20d overdue");
  });

  it("batch-maps queue rows for a remediation panel", () => {
    const items = toRemediationItems([row({ id: "a" }), row({ id: "b", path: "fees.html", title: "Fees" })], "awaiting_review");
    assert.equal(items.length, 2);
    assert.equal(items[1].affectedItem, "Fees");
    assert.equal(items[0].nextAction, GOVERNANCE_QUEUE_NEXT_ACTION.awaiting_review);
  });
});
