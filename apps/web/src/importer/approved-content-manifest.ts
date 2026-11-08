import crypto from "node:crypto";
import fs from "node:fs";
import { APPROVED_PUBLIC_PATHS, EXPECTED_APPROVED_PATH_COUNT } from "@/importer/approved-path-inventory";
import { recruitmentHoldForPath } from "@/importer/recruitment-hold";

/**
 * Operator-signed content decision manifest for production population.
 * Approvals live in the manifest — never hardcoded in the importer.
 */

export type ProductionAuthority = "golden" | "staging_published" | "pending";

export type ImportAction =
  | "import_golden"
  | "import_approved_payload"
  | "import_under_hold"
  | "skip_until_approved";

export type ApprovedContentPathDecision = {
  path: string;
  /** B1C comparison when known. */
  comparison?: "MATCH" | "DIFFERENT" | "NON_GOLDEN" | "MISSING" | "UNKNOWN";
  class?: "A" | "B" | "D" | "E";
  publishedSha256: string | null;
  goldenSha256: string | null;
  /** Which corpus is authorised for production. Must not be pending for executable imports. */
  selectedAuthority: ProductionAuthority;
  /** Exact SHA that will be imported (golden or staging payload). */
  selectedSourceSha256: string | null;
  clinicalReviewRequired: boolean;
  clinicalReviewReference: string | null;
  operatorApproved: boolean;
  operatorApprovedBy: string | null;
  operatorApprovedAt: string | null;
  recruitmentHold: boolean;
  importAction: ImportAction;
  /** Relative HTML payload under contentRoot, or absolute path. Required for staging_published imports. */
  contentFile?: string | null;
  assetDependencies: string[];
  notes?: string[];
};

export type ApprovedContentManifest = {
  version: 1;
  clinicSlug: string;
  /** SHA256 of canonical decisions payload (excludes this field and signature). */
  decisionsDigest: string;
  /** HMAC-SHA256 hex of decisionsDigest using APPROVED_CONTENT_MANIFEST_SECRET. */
  signature: string;
  createdAt: string;
  createdBy: string;
  notes?: string;
  decisions: ApprovedContentPathDecision[];
};

export type ManifestValidationIssue = {
  code: string;
  path?: string;
  message: string;
};

function canonicalDecisionsJson(decisions: ApprovedContentPathDecision[]): string {
  const sorted = [...decisions].sort((a, b) => a.path.localeCompare(b.path));
  return JSON.stringify(sorted);
}

export function digestDecisions(decisions: ApprovedContentPathDecision[]): string {
  return crypto.createHash("sha256").update(canonicalDecisionsJson(decisions), "utf8").digest("hex");
}

export function signDecisionsDigest(digest: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(digest, "utf8").digest("hex");
}

export function verifyManifestSignature(
  manifest: ApprovedContentManifest,
  secret: string | undefined,
): ManifestValidationIssue[] {
  const issues: ManifestValidationIssue[] = [];
  const expectedDigest = digestDecisions(manifest.decisions);
  if (manifest.decisionsDigest !== expectedDigest) {
    issues.push({
      code: "digest_mismatch",
      message: "decisionsDigest does not match canonical decisions payload (tamper or stale digest).",
    });
  }
  if (!secret) {
    issues.push({
      code: "missing_signing_secret",
      message: "APPROVED_CONTENT_MANIFEST_SECRET is required to verify the manifest signature.",
    });
    return issues;
  }
  const expectedSig = signDecisionsDigest(expectedDigest, secret);
  if (manifest.signature !== expectedSig) {
    issues.push({
      code: "signature_invalid",
      message: "Manifest signature does not match decisionsDigest + signing secret.",
    });
  }
  return issues;
}

export function validateApprovedContentManifest(
  manifest: ApprovedContentManifest,
  options?: { requireExecutableApprovals?: boolean; secret?: string },
): ManifestValidationIssue[] {
  const issues: ManifestValidationIssue[] = [];
  const requireExecutable = options?.requireExecutableApprovals !== false;

  if (manifest.version !== 1) {
    issues.push({ code: "unsupported_version", message: `Unsupported manifest version ${manifest.version}` });
  }
  if (!manifest.clinicSlug?.trim()) {
    issues.push({ code: "missing_clinic", message: "clinicSlug is required." });
  }

  issues.push(...verifyManifestSignature(manifest, options?.secret ?? process.env.APPROVED_CONTENT_MANIFEST_SECRET));

  const paths = manifest.decisions.map((d) => d.path);
  if (paths.length !== EXPECTED_APPROVED_PATH_COUNT) {
    issues.push({
      code: "path_count",
      message: `Expected ${EXPECTED_APPROVED_PATH_COUNT} decisions, found ${paths.length}.`,
    });
  }
  if (new Set(paths).size !== paths.length) {
    issues.push({ code: "duplicate_paths", message: "Duplicate path decisions are not allowed." });
  }
  for (const required of APPROVED_PUBLIC_PATHS) {
    if (!paths.includes(required)) {
      issues.push({ code: "missing_path", path: required, message: "Approved inventory path missing from manifest." });
    }
  }
  for (const pathName of paths) {
    if (!(APPROVED_PUBLIC_PATHS as readonly string[]).includes(pathName)) {
      issues.push({ code: "unapproved_path", path: pathName, message: "Path is not in the approved public inventory." });
    }
  }

  for (const decision of manifest.decisions) {
    const hold = recruitmentHoldForPath(decision.path);
    if (hold?.holdActive && !decision.recruitmentHold) {
      issues.push({
        code: "hold_flag_required",
        path: decision.path,
        message: "Recruitment HOLD path must set recruitmentHold=true while HOLD is active.",
      });
    }

    if (decision.importAction === "skip_until_approved") {
      if (requireExecutable) {
        issues.push({
          code: "unresolved_action",
          path: decision.path,
          message: "Import action remains skip_until_approved — not executable for production population.",
        });
      }
      continue;
    }

    if (decision.selectedAuthority === "pending") {
      issues.push({
        code: "authority_pending",
        path: decision.path,
        message: "selectedAuthority is pending — operator must choose golden or staging_published.",
      });
      continue;
    }

    if (!decision.selectedSourceSha256 || !/^[a-f0-9]{64}$/i.test(decision.selectedSourceSha256)) {
      issues.push({
        code: "missing_source_sha",
        path: decision.path,
        message: "selectedSourceSha256 must be a 64-char hex digest for executable imports.",
      });
    }

    if (decision.selectedAuthority === "golden") {
      if (!decision.goldenSha256) {
        issues.push({ code: "golden_sha_required", path: decision.path, message: "Golden authority requires goldenSha256." });
      } else if (decision.selectedSourceSha256 && decision.selectedSourceSha256 !== decision.goldenSha256) {
        issues.push({
          code: "golden_sha_mismatch",
          path: decision.path,
          message: "selectedSourceSha256 must equal goldenSha256 when authority is golden.",
        });
      }
      if (decision.importAction !== "import_golden" && decision.importAction !== "import_under_hold") {
        issues.push({
          code: "action_authority_mismatch",
          path: decision.path,
          message: "Golden authority requires import_golden or import_under_hold.",
        });
      }
    }

    if (decision.selectedAuthority === "staging_published") {
      if (!decision.publishedSha256) {
        issues.push({
          code: "published_sha_required",
          path: decision.path,
          message: "staging_published authority requires publishedSha256 from reconciliation.",
        });
      } else if (decision.selectedSourceSha256 && decision.selectedSourceSha256 !== decision.publishedSha256) {
        issues.push({
          code: "published_sha_mismatch",
          path: decision.path,
          message: "selectedSourceSha256 must equal publishedSha256 when authority is staging_published.",
        });
      }
      if (decision.importAction !== "import_approved_payload" && decision.importAction !== "import_under_hold") {
        issues.push({
          code: "action_authority_mismatch",
          path: decision.path,
          message: "staging_published authority requires import_approved_payload or import_under_hold.",
        });
      }
      if (!decision.contentFile?.trim()) {
        issues.push({
          code: "content_file_required",
          path: decision.path,
          message: "staging_published imports require contentFile pointing at approved HTML payload.",
        });
      }
    }

    if (requireExecutable) {
      if (!decision.operatorApproved || !decision.operatorApprovedBy || !decision.operatorApprovedAt) {
        issues.push({
          code: "operator_approval_incomplete",
          path: decision.path,
          message: "Executable import requires operatorApproved + approvedBy + approvedAt.",
        });
      }
      if (decision.clinicalReviewRequired && !decision.clinicalReviewReference) {
        issues.push({
          code: "clinical_review_missing",
          path: decision.path,
          message: "clinicalReviewRequired is true but clinicalReviewReference is empty.",
        });
      }
    }
  }

  return issues;
}

export function loadApprovedContentManifest(filePath: string): ApprovedContentManifest {
  const raw = JSON.parse(fs.readFileSync(filePath, "utf8")) as ApprovedContentManifest;
  return raw;
}

/** Build an unsigned draft with MATCH→golden and unresolved DIFFERENT/NON_GOLDEN. Not production-executable. */
export function buildDraftDecisionsFromReconciliation(rows: Array<{
  path: string;
  class: string;
  comparison: string;
  goldenSha256: string | null;
  publishedSha256: string | null;
}>): ApprovedContentPathDecision[] {
  return rows.map((row) => {
    const hold = Boolean(recruitmentHoldForPath(row.path)?.holdActive);
    const clinicalReviewRequired = row.class === "E";
    if (row.comparison === "MATCH" && row.goldenSha256) {
      return {
        path: row.path,
        comparison: "MATCH",
        class: row.class as ApprovedContentPathDecision["class"],
        publishedSha256: row.publishedSha256,
        goldenSha256: row.goldenSha256,
        selectedAuthority: "golden",
        selectedSourceSha256: row.goldenSha256,
        clinicalReviewRequired,
        clinicalReviewReference: null,
        operatorApproved: false,
        operatorApprovedBy: null,
        operatorApprovedAt: null,
        recruitmentHold: hold,
        importAction: hold ? "import_under_hold" : "import_golden",
        contentFile: null,
        assetDependencies: [],
        notes: hold ? ["Draft: hub/child HOLD — operator must still sign executable manifest."] : ["Draft: MATCH→golden."],
      };
    }
    return {
      path: row.path,
      comparison: row.comparison as ApprovedContentPathDecision["comparison"],
      class: row.class as ApprovedContentPathDecision["class"],
      publishedSha256: row.publishedSha256,
      goldenSha256: row.goldenSha256,
      selectedAuthority: "pending",
      selectedSourceSha256: null,
      clinicalReviewRequired,
      clinicalReviewReference: null,
      operatorApproved: false,
      operatorApprovedBy: null,
      operatorApprovedAt: null,
      recruitmentHold: hold,
      importAction: "skip_until_approved",
      contentFile: null,
      assetDependencies: [],
      notes: ["Draft: operator must choose golden or staging_published before population."],
    };
  });
}
