import type { RecoveryKind, RecoveryStatus } from "../regression/production-opening-audit";

export type BatchNumber = 1 | 2 | 3;
export type RecoveryMethod = "none" | "golden-opening" | "golden-full-approved" | "manual-review";

export const SERVICES = [
  "services/family-health.html",
  "services/mens-health.html",
  "services/childrens-health.html",
  "services/mental-health.html",
  "services/chronic-disease-care.html",
  "services/skin-checks.html",
] as const;

export const PRIORITY_PRACTITIONERS = [
  "doctors/dr-tanya-goodwill.html",
  "doctors/dr-wasantha-hettiarchchi.html",
  "doctors/dr-kooshyar-karimi.html",
] as const;

export function pathsForBatch(batch: BatchNumber, repositoryPaths: readonly string[]): string[] {
  if (batch === 1) return ["team.html"];
  if (batch === 2) return [...SERVICES];
  return [...new Set([
    ...PRIORITY_PRACTITIONERS,
    ...repositoryPaths.filter(p => /^doctors\/[^/]+\.html$/.test(p)),
    ...repositoryPaths.filter(p => /^knowledge\/.*\.html$/.test(p)),
  ])];
}

export function kindForPath(page: string): RecoveryKind {
  if (page === "team.html") return "team";
  if (page.startsWith("services/")) return "service";
  if (page.startsWith("doctors/")) return "practitioner";
  if (page.startsWith("knowledge/articles/")) return "knowledge-article";
  return "knowledge-hub";
}

export function methodForStatus(status: RecoveryStatus): RecoveryMethod {
  if (status === "opening-damaged") return "golden-opening";
  if (status === "unsafe") return "golden-full-approved";
  if (status === "other-drift") return "manual-review";
  return "none";
}

export function expectedOutcome(status: RecoveryStatus): string {
  if (status === "healthy") return "No publication change; source remains approved.";
  if (status === "other-drift") return "No automatic change; editorial owner decides whether drift is intentional.";
  return "Published immutable HTML equals the approved golden source, with existing published CMS overlays still applied at delivery.";
}

export type RecoveryRecord = {
  page: string;
  kind: RecoveryKind;
  status: RecoveryStatus;
  issue: string;
  missing: string[];
  method: RecoveryMethod;
  expectedOutcome: string;
  pageId: string | null;
  previousRevisionId: string | null;
  previousSha256: string | null;
  goldenSha256: string;
  repositorySha256: string;
  originalBackup: string | null;
};

export type RecoveryManifest = {
  version: 1;
  clinicSlug: "woolloongabba";
  batch: BatchNumber;
  createdAt: string;
  records: RecoveryRecord[];
};

export type ApprovalEntry = {
  page: string;
  previousRevisionId: string;
  previousSha256: string;
  goldenSha256: string;
  method: "golden-opening" | "golden-full-approved";
  unsafeReviewed?: boolean;
};

export type RecoveryApproval = {
  batch: BatchNumber;
  approvedBy: string;
  entries: ApprovalEntry[];
};

export function approvedEntry(
  record: RecoveryRecord,
  approvals: RecoveryApproval,
  batch: BatchNumber,
): ApprovalEntry | null {
  if (approvals.batch !== batch || !approvals.approvedBy?.trim()) {
    throw new Error("Approval file requires matching batch and named reviewer.");
  }
  const candidates = approvals.entries.filter(a => a.page === record.page);
  if (candidates.length > 1) throw new Error("Duplicate approvals for " + record.page);
  const entry = candidates[0];
  if (!entry) return null;
  if (record.method !== "golden-opening" && record.method !== "golden-full-approved") {
    throw new Error("Approval references a page that cannot be automatically repaired: " + record.page);
  }
  if (!record.previousRevisionId || !record.previousSha256 ||
      entry.previousRevisionId !== record.previousRevisionId ||
      entry.previousSha256 !== record.previousSha256 ||
      entry.goldenSha256 !== record.goldenSha256 ||
      entry.method !== record.method) {
    throw new Error("Approval revision/hash/method mismatch for " + record.page);
  }
  if (record.status === "unsafe" && entry.unsafeReviewed !== true) {
    throw new Error("Unsafe page requires explicit unsafeReviewed=true for " + record.page);
  }
  return entry;
}
