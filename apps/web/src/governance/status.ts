export const GOVERNANCE_STATUSES = ["draft", "under_review", "approved", "published", "review_due"] as const;

export type GovernanceStatus = (typeof GOVERNANCE_STATUSES)[number];

const COMPLETE: ReadonlySet<GovernanceStatus> = new Set(["approved", "published"]);

export function parseGovernanceStatus(value: string): GovernanceStatus | null {
  const normalized = value.trim().toLowerCase();
  return (GOVERNANCE_STATUSES as readonly string[]).includes(normalized) ? (normalized as GovernanceStatus) : null;
}

/** Maps historical review labels so an older revision can still be restored. */
export function normalizeStoredGovernanceStatus(value: string, fallback: GovernanceStatus): GovernanceStatus {
  const parsed = parseGovernanceStatus(value);
  if (parsed) return parsed;
  if (value === "awaiting_review") return "draft";
  if (value === "in_review") return "under_review";
  if (value === "superseded") return "review_due";
  return fallback;
}

export function isGovernanceCompleteStatus(status: GovernanceStatus): boolean {
  return COMPLETE.has(status);
}

export function governanceCompletionGaps(input: {
  reviewedBy: string | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  evidenceReference: string | null;
  fingerprint: string | null;
}): string[] {
  const gaps: string[] = [];
  if (!input.reviewedBy?.trim()) gaps.push("Reviewer is required.");
  if (!input.approvedBy?.trim()) gaps.push("Approver is required.");
  if (!input.approvedAt || Number.isNaN(input.approvedAt.getTime())) gaps.push("Approval date is required.");
  if (!input.fingerprint || !/^[a-f0-9]{64}$/i.test(input.fingerprint)) gaps.push("Fingerprint is required.");
  if (!input.evidenceReference?.trim()) gaps.push("Evidence reference is required.");
  return gaps;
}

export function governanceStatusForRestore(
  value: unknown,
  fallback: GovernanceStatus,
  evidence: {
    reviewedBy: string | null;
    approvedBy: string | null;
    approvedAt: Date | null;
    evidenceReference: string | null;
    fingerprint: string | null;
  },
): GovernanceStatus {
  const status = normalizeStoredGovernanceStatus(String(value ?? ""), fallback);
  if (isGovernanceCompleteStatus(status) && governanceCompletionGaps(evidence).length > 0) return "under_review";
  return status;
}
