import type {
  GovernanceManagementRow,
  GovernanceSegment,
} from "@/governance/management-report";

/** Queues managers open from Insights alerts / workload cards (D5). */
export const GOVERNANCE_REMEDIATION_QUEUES = [
  "awaiting_review",
  "due_soon",
  "expired",
  "missing_ownership",
] as const;

export type GovernanceRemediationQueue = (typeof GOVERNANCE_REMEDIATION_QUEUES)[number];

export const GOVERNANCE_QUEUE_LABEL: Record<GovernanceRemediationQueue, string> = {
  awaiting_review: "Awaiting Review",
  due_soon: "Due Soon",
  expired: "Expired",
  missing_ownership: "Missing Owner",
};

/** One-line next action managers take for each queue. */
export const GOVERNANCE_QUEUE_NEXT_ACTION: Record<GovernanceRemediationQueue, string> = {
  awaiting_review: "Open the record and complete clinical review / approval",
  due_soon: "Schedule or complete the review before the due date",
  expired: "Re-review and update the next review due date immediately",
  missing_ownership: "Assign a Content Owner, then confirm review dates",
};

export const GOVERNANCE_QUEUE_HINT: Record<GovernanceRemediationQueue, string> = {
  awaiting_review: "Draft, under review, or review due — not yet cleared for public attribution",
  due_soon: "Next review due is still current but inside the 60-day horizon",
  expired: "Next review due is before today — public attribution may be withheld",
  missing_ownership: "Content Owner is not set — assign ownership before publishing review details",
};

export type GovernanceRemediationItem = {
  id: string;
  /** Affected page / content item. */
  affectedItem: string;
  path: string;
  segment: GovernanceSegment;
  /** Queue-specific next action. */
  nextAction: string;
  /** Responsible content owner (or unset). */
  responsibleOwner: string;
  ownerUnset: boolean;
  /** Review due date ISO (YYYY-MM-DD) or null. */
  reviewDueDate: string | null;
  reviewDueLabel: string;
  daysRemaining: number | null;
  urgencyLabel: string | null;
  statusLabel: string;
  /** Deep link into the editable governance record. */
  recordHref: string;
};

export function isGovernanceRemediationQueue(
  value: string | null | undefined,
): value is GovernanceRemediationQueue {
  return !!value && (GOVERNANCE_REMEDIATION_QUEUES as readonly string[]).includes(value);
}

function dueLabel(nextReviewDue: string | null, daysRemaining: number | null): string {
  if (!nextReviewDue) return "No due date set";
  if (daysRemaining === null) return nextReviewDue;
  if (daysRemaining < 0) return `${nextReviewDue} · ${Math.abs(daysRemaining)}d overdue`;
  if (daysRemaining === 0) return `${nextReviewDue} · due today`;
  return `${nextReviewDue} · ${daysRemaining}d left`;
}

function urgencyLabel(daysRemaining: number | null, queue: GovernanceRemediationQueue): string | null {
  if (queue === "missing_ownership") return null;
  if (daysRemaining === null) return null;
  if (daysRemaining < 0) return `${Math.abs(daysRemaining)}d overdue`;
  if (daysRemaining === 0) return "Due today";
  return `${daysRemaining}d left`;
}

/** Map a management-report row into remediation columns for a queue. */
export function toRemediationItem(
  row: GovernanceManagementRow,
  queue: GovernanceRemediationQueue,
): GovernanceRemediationItem {
  const owner = row.contentOwner?.trim() || "";
  return {
    id: row.id,
    affectedItem: row.title || row.path,
    path: row.path,
    segment: row.segment,
    nextAction: GOVERNANCE_QUEUE_NEXT_ACTION[queue],
    responsibleOwner: owner || "Owner unset",
    ownerUnset: !owner,
    reviewDueDate: row.nextReviewDue,
    reviewDueLabel: dueLabel(row.nextReviewDue, row.daysRemaining),
    daysRemaining: row.daysRemaining,
    urgencyLabel: urgencyLabel(row.daysRemaining, queue),
    statusLabel: row.status.replaceAll("_", " "),
    recordHref: `/admin/governance/${row.id}`,
  };
}

export function toRemediationItems(
  rows: GovernanceManagementRow[],
  queue: GovernanceRemediationQueue,
): GovernanceRemediationItem[] {
  return rows.map((row) => toRemediationItem(row, queue));
}
