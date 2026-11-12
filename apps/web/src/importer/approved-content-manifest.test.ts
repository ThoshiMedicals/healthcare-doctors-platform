import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  APPROVED_PUBLIC_PATHS,
  CLASS_B_NON_GOLDEN_PATHS,
  EXPECTED_APPROVED_PATH_COUNT,
} from "@/importer/approved-path-inventory";
import {
  type ApprovedContentManifest,
  type ApprovedContentPathDecision,
  buildDraftDecisionsFromReconciliation,
  digestDecisions,
  signDecisionsDigest,
  validateApprovedContentManifest,
} from "@/importer/approved-content-manifest";
import { fingerprintContent } from "@/governance/fingerprint";
import { importApprovedRevisions } from "@/importer/import-approved-revisions";
import { recruitmentHoldForPath } from "@/importer/recruitment-hold";
import {
  STAGING_REVISION_ARCHIVE_EXPECTED_COUNT,
  assertArchiveCount,
  buildEmptyArchiveSpec,
  classifyHistoricalRevision,
  looksLikeStagingTestLog,
} from "@/importer/revision-archive-spec";
import { mediaApprovalMetadataPresent, validateMediaReferencesForHtml } from "@/importer/media-integrity";

const SECRET = "test-manifest-secret-not-for-production";

function fakeSha(label: string): string {
  return crypto.createHash("sha256").update(label, "utf8").digest("hex");
}

function buildFullDraftRows() {
  return APPROVED_PUBLIC_PATHS.map((pathName) => {
    const nonGolden = (CLASS_B_NON_GOLDEN_PATHS as readonly string[]).includes(pathName);
    const comparison = nonGolden ? "NON_GOLDEN" : pathName.endsWith("contact.html") ? "DIFFERENT" : "MATCH";
    // Synthetic: one DIFFERENT for contact; rest MATCH or NON_GOLDEN — enough for structure tests.
    return {
      path: pathName,
      class: pathName.startsWith("join-our-team") ? "D" : nonGolden ? "B" : "A",
      comparison,
      goldenSha256: nonGolden ? null : fakeSha(`golden:${pathName}`),
      publishedSha256: fakeSha(`published:${pathName}`),
    };
  });
}

function signManifest(decisions: ApprovedContentPathDecision[]): ApprovedContentManifest {
  const decisionsDigest = digestDecisions(decisions);
  return {
    version: 1,
    clinicSlug: "woolloongabba",
    decisionsDigest,
    signature: signDecisionsDigest(decisionsDigest, SECRET),
    createdAt: new Date().toISOString(),
    createdBy: "b1d-fixture",
    decisions,
  };
}

test("B1C count model: 179 ordinary MATCH + recruitment hub = 180; 180+27+19=226", () => {
  assert.equal(EXPECTED_APPROVED_PATH_COUNT, 226);
  assert.equal(180 + 27 + 19, 226);
  assert.equal(179 + 1, 180);
  assert.ok(APPROVED_PUBLIC_PATHS.includes("join-our-team.html"));
  assert.ok(APPROVED_PUBLIC_PATHS.includes("patient-hub.html"));
  const hold = recruitmentHoldForPath("join-our-team.html");
  assert.ok(hold?.holdActive);
  assert.equal(hold?.mayIndex, false);
});

test("draft decisions cover all 226 paths without duplicates", () => {
  const decisions = buildDraftDecisionsFromReconciliation(buildFullDraftRows());
  assert.equal(decisions.length, 226);
  assert.equal(new Set(decisions.map((d) => d.path)).size, 226);
  const hub = decisions.find((d) => d.path === "join-our-team.html");
  assert.equal(hub?.recruitmentHold, true);
  assert.equal(hub?.importAction, "import_under_hold");
});

test("manifest validation rejects duplicate paths and incomplete executable approvals", () => {
  const decisions = buildDraftDecisionsFromReconciliation(buildFullDraftRows());
  const dup = [...decisions, { ...decisions[0] }];
  const issues = validateApprovedContentManifest(signManifest(dup), {
    requireExecutableApprovals: false,
    secret: SECRET,
  });
  assert.ok(issues.some((i) => i.code === "duplicate_paths"));

  const executableIssues = validateApprovedContentManifest(signManifest(decisions), {
    requireExecutableApprovals: true,
    secret: SECRET,
  });
  assert.ok(executableIssues.some((i) => i.code === "operator_approval_incomplete" || i.code === "unresolved_action"));
});

test("hash mismatch and unapproved authority are rejected on dry-run import planning", async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "wmc-approved-import-"));
  const pagePath = "404.html";
  const html = "<!doctype html><html><head><title>404</title></head><body><h1>Not found</h1></body></html>";
  const correctSha = fingerprintContent(html);
  // goldenHtmlRoot requires index.html as a corpus sentinel.
  fs.writeFileSync(
    path.join(tmp, "index.html"),
    "<!doctype html><html><head><title>Home</title></head><body></body></html>",
    "utf8",
  );
  fs.writeFileSync(path.join(tmp, pagePath), html, "utf8");

  const baseRows = buildFullDraftRows().map((row) => {
    if (row.path !== pagePath) {
      return {
        ...row,
        comparison: "MATCH" as const,
        goldenSha256: row.goldenSha256 ?? fakeSha(`g:${row.path}`),
        publishedSha256: row.publishedSha256,
      };
    }
    return {
      ...row,
      comparison: "MATCH" as const,
      goldenSha256: correctSha,
      publishedSha256: correctSha,
    };
  });
  let decisions = buildDraftDecisionsFromReconciliation(baseRows).map((d) => {
    if (d.path !== pagePath) {
      return {
        ...d,
        selectedAuthority: "pending" as const,
        selectedSourceSha256: null,
        importAction: "skip_until_approved" as const,
        operatorApproved: false,
      };
    }
    return {
      ...d,
      selectedAuthority: "golden" as const,
      selectedSourceSha256: fakeSha("wrong"),
      importAction: "import_golden" as const,
      operatorApproved: true,
      operatorApprovedBy: "tester",
      operatorApprovedAt: new Date().toISOString(),
      clinicalReviewRequired: false,
      clinicalReviewReference: null,
      recruitmentHold: false,
    };
  });

  await assert.rejects(
    () =>
      importApprovedRevisions({
        dryRun: true,
        offlineFixture: true,
        goldenRoot: tmp,
        manifestSecret: SECRET,
        manifest: signManifest(decisions),
      }),
    /Hash mismatch|Exact SHA256/,
  );

  decisions = decisions.map((d) =>
    d.path === pagePath
      ? {
          ...d,
          selectedAuthority: "pending" as const,
          selectedSourceSha256: correctSha,
          importAction: "import_golden" as const,
          operatorApproved: true,
          operatorApprovedBy: "tester",
          operatorApprovedAt: new Date().toISOString(),
        }
      : d,
  );
  await assert.rejects(
    () =>
      importApprovedRevisions({
        dryRun: true,
        offlineFixture: true,
        goldenRoot: tmp,
        manifestSecret: SECRET,
        manifest: signManifest(decisions),
      }),
    /Unsupported authority|pending|Cannot read HTML|authority/,
  );
});

test("recruitment HOLD keeps attraction workflows blocked and vacancies unimported", () => {
  assert.equal(process.env.RECRUITMENT_HOLD_LIFTED, undefined);
  const child = recruitmentHoldForPath("join-our-team/express-interest.html");
  assert.equal(child?.mayServePublicly, false);
  assert.equal(child?.mayOperateFormsAndWorkflows, false);
  assert.equal(child?.mayIndex, false);
});

test("media integrity rejects path escape and accounts for approval metadata", () => {
  const html = `<html><body><img src="../etc/passwd" alt="x"><img src="assets/team/dr-anand-singh.webp" alt="Dr Anand"></body></html>`;
  const result = validateMediaReferencesForHtml(html, "doctors/dr-anand-singh.html", {
    skipMissingFiles: true,
  });
  assert.ok(result.issues.some((i) => i.code === "path_escape"));
  const meta = mediaApprovalMetadataPresent({ approvedAt: null, contentSha256: "abc", evidenceReference: "ref" });
  assert.equal(meta.accounted, false);
  assert.ok(meta.missing.includes("approvedAt"));
});

test("revision archive spec is metadata-only and not full rollback", () => {
  const spec = buildEmptyArchiveSpec();
  assert.equal(spec.fullRollbackCapable, false);
  assert.equal(spec.payloadClass, "metadata_only");
  assert.equal(spec.expectedRecordCount, STAGING_REVISION_ARCHIVE_EXPECTED_COUNT);
  assert.equal(STAGING_REVISION_ARCHIVE_EXPECTED_COUNT, 253);
  assert.throws(() => assertArchiveCount(252));
  assert.equal(
    classifyHistoricalRevision({
      isPublishedPointer: true,
      pagePath: "index.html",
      looksLikeTestLog: false,
      recruitmentHold: false,
    }),
    "A_current_published",
  );
  assert.equal(looksLikeStagingTestLog({ path: ".tmp-scratch/page.html" }), true);
});

test("tampered manifest signature fails closed", () => {
  const decisions = buildDraftDecisionsFromReconciliation(buildFullDraftRows());
  const manifest = signManifest(decisions);
  manifest.decisions[0] = { ...manifest.decisions[0], notes: ["tampered"] };
  const issues = validateApprovedContentManifest(manifest, {
    requireExecutableApprovals: false,
    secret: SECRET,
  });
  assert.ok(issues.some((i) => i.code === "digest_mismatch" || i.code === "signature_invalid"));
});
