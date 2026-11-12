import assert from "node:assert/strict";
import test from "node:test";
import {
  APPROVED_PUBLIC_PATHS,
  CLASS_B_NON_GOLDEN_PATHS,
  EXPECTED_APPROVED_PATH_COUNT,
  EXPECTED_CLASS_B_COUNT,
} from "@/importer/approved-path-inventory";
import { buildContentReconciliationReport } from "@/importer/content-reconciliation";
import { listRecruitmentHoldPolicies } from "@/importer/recruitment-hold";

test("approved inventory lengths match B1 expectations", () => {
  assert.equal(APPROVED_PUBLIC_PATHS.length, EXPECTED_APPROVED_PATH_COUNT);
  assert.equal(CLASS_B_NON_GOLDEN_PATHS.length, EXPECTED_CLASS_B_COUNT);
  assert.equal(new Set(APPROVED_PUBLIC_PATHS).size, APPROVED_PUBLIC_PATHS.length);
});

test("buildContentReconciliationReport classifies golden vs approved without DB", () => {
  const report = buildContentReconciliationReport();
  assert.equal(report.goldenPageCount, 207);
  assert.equal(report.approvedInventoryCount, 226);
  assert.equal(report.classBCount, 19);
  assert.equal(report.inventoryIntegrity.approvedListLengthOk, true);
  assert.equal(report.inventoryIntegrity.classBListLengthOk, true);
  assert.equal(report.inventoryIntegrity.classBSubsetOfApproved, true);
  assert.ok(report.operatorApprovalRequired);
  assert.ok(report.counts.shaUnknownOnSharedPaths > 0);

  for (const path of CLASS_B_NON_GOLDEN_PATHS) {
    const row = report.paths.find((p) => p.path === path);
    assert.ok(row, path);
    assert.equal(row!.inGolden, false);
    assert.equal(row!.inApprovedInventory, true);
    assert.ok(["B", "D", "E"].includes(row!.parityClass), `${path} => ${row!.parityClass}`);
    assert.equal(row!.requiresOperatorApproval, true);
  }
});

test("recruitment HOLD policies gate forms and indexing", () => {
  const policies = listRecruitmentHoldPolicies();
  assert.ok(policies.length >= 11);
  const hub = policies.find((p) => p.path === "join-our-team.html");
  assert.ok(hub);
  assert.equal(hub!.mayExistInProductionDb, true);
  assert.equal(hub!.mayServePublicly, true);
  assert.equal(hub!.mayIndex, false);
  assert.equal(hub!.mayOperateFormsAndWorkflows, false);
  assert.equal(hub!.holdActive, true);

  const eoi = policies.find((p) => p.path === "join-our-team/express-interest.html");
  assert.ok(eoi);
  assert.equal(eoi!.mayServePublicly, false);
  assert.equal(eoi!.mayOperateFormsAndWorkflows, false);
});

test("fixture SHA mismatch is classified for operator approval", () => {
  const report = buildContentReconciliationReport({
    publishedShaFixture: {
      publishedShaByPath: {
        "index.html": "0".repeat(64),
      },
    },
  });
  const index = report.paths.find((p) => p.path === "index.html");
  assert.ok(index);
  assert.equal(index!.shaMatch, "mismatch");
  assert.equal(index!.requiresOperatorApproval, true);
});
