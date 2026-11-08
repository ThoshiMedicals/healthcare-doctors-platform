/**
 * Archival specification for staging PageRevision records (metadata class only).
 *
 * Scope: prepare classification for all staging revision rows before production population.
 * This module does NOT export HTML or private metadata in B1D.
 *
 * Important: a metadata-only archive is NOT a full rollback capability.
 * Rollback to a prior published experience requires the immutable HTML payload,
 * related navigation/collection rows, and verified media assets — not SHA digests alone.
 */

export const STAGING_REVISION_ARCHIVE_EXPECTED_COUNT = 253;

export type RevisionArchiveClass =
  | "A_current_published"
  | "B_superseded_same_path"
  | "C_orphan_unpublished"
  | "D_recruitment_hold"
  | "E_test_or_scratch"
  | "F_unknown_requires_review";

export type RevisionArchiveRecordSpec = {
  /** Staging revision id (opaque). Never fabricate. */
  revisionId: string;
  pagePath: string | null;
  contentSha256: string;
  classification: RevisionArchiveClass;
  retainedForProduction: boolean;
  clinicalReviewReference: string | null;
  /** Why this row is not suitable as production authority without further review. */
  notes: string[];
};

export type RevisionArchiveManifestSpec = {
  version: 1;
  expectedRecordCount: typeof STAGING_REVISION_ARCHIVE_EXPECTED_COUNT;
  /** Metadata-only; no HTML bodies. */
  payloadClass: "metadata_only";
  fullRollbackCapable: false;
  records: RevisionArchiveRecordSpec[];
  governance: {
    noFabricatedApprovals: true;
    noStagingTestLogImport: true;
    historicalSeparatelyClassified: true;
    preserveExistingClinicalReviewReferences: true;
  };
};

export function assertArchiveCount(actual: number): void {
  if (actual !== STAGING_REVISION_ARCHIVE_EXPECTED_COUNT) {
    throw new Error(
      `Revision archive expected ${STAGING_REVISION_ARCHIVE_EXPECTED_COUNT} records, found ${actual}. Reconcile before export.`,
    );
  }
}

export function classifyHistoricalRevision(input: {
  isPublishedPointer: boolean;
  pagePath: string | null;
  looksLikeTestLog: boolean;
  recruitmentHold: boolean;
}): RevisionArchiveClass {
  if (input.looksLikeTestLog) return "E_test_or_scratch";
  if (input.recruitmentHold) return "D_recruitment_hold";
  if (input.isPublishedPointer) return "A_current_published";
  if (input.pagePath) return "B_superseded_same_path";
  return "C_orphan_unpublished";
}

export function buildEmptyArchiveSpec(): Omit<RevisionArchiveManifestSpec, "records"> & { records: [] } {
  return {
    version: 1,
    expectedRecordCount: STAGING_REVISION_ARCHIVE_EXPECTED_COUNT,
    payloadClass: "metadata_only",
    fullRollbackCapable: false,
    records: [],
    governance: {
      noFabricatedApprovals: true,
      noStagingTestLogImport: true,
      historicalSeparatelyClassified: true,
      preserveExistingClinicalReviewReferences: true,
    },
  };
}

/** Detect obvious staging test / scratch payloads without reading private content into logs. */
export function looksLikeStagingTestLog(meta: {
  title?: string | null;
  path?: string | null;
  sourceTag?: string | null;
}): boolean {
  const hay = `${meta.title ?? ""} ${meta.path ?? ""} ${meta.sourceTag ?? ""}`.toLowerCase();
  return (
    hay.includes("test log") ||
    hay.includes("scratch") ||
    hay.includes(".tmp-") ||
    hay.includes("fixture-only") ||
    hay.includes("cypress") ||
    hay.includes("playwright")
  );
}
