import assert from "node:assert/strict";
import test from "node:test";
import {
  approvedEntry, kindForPath, methodForStatus, pathsForBatch,
  type RecoveryRecord, type RecoveryApproval,
} from "./production-recovery";

test("batches do not overlap and include priority service and practitioner routes", () => {
  const all = ["team.html", "services/family-health.html", "doctors/dr-tanya-goodwill.html",
    "doctors/dr-extra.html", "knowledge/index.html", "knowledge/articles/example.html"];
  const one = pathsForBatch(1, all), two = pathsForBatch(2, all), three = pathsForBatch(3, all);
  assert.deepEqual(one, ["team.html"]);
  assert.equal(two.length, 6);
  assert.ok(three.includes("doctors/dr-tanya-goodwill.html"));
  assert.ok(three.includes("doctors/dr-extra.html"));
  assert.ok(three.includes("knowledge/index.html"));
  assert.equal(new Set([...one, ...two, ...three]).size, one.length + two.length + three.length);
  assert.equal(kindForPath("knowledge/articles/a.html"), "knowledge-article");
  assert.equal(kindForPath("doctors/a.html"), "practitioner");
});

test("status mapping blocks automatic repair for drift and healthy pages", () => {
  assert.equal(methodForStatus("healthy"), "none");
  assert.equal(methodForStatus("other-drift"), "manual-review");
  assert.equal(methodForStatus("opening-damaged"), "golden-opening");
  assert.equal(methodForStatus("unsafe"), "golden-full-approved");
});

const record: RecoveryRecord = {
  page: "team.html", kind: "team", status: "unsafe",
  issue: "protected differences", missing: ["page hero"],
  method: "golden-full-approved", expectedOutcome: "",
  pageId: "page1", previousRevisionId: "old1",
  previousSha256: "oldsha", goldenSha256: "newsha",
  repositorySha256: "newsha", originalBackup: "backup.html",
};
const approval: RecoveryApproval = {
  batch: 1, approvedBy: "Clinical and publishing owner",
  entries: [{
    page: "team.html", previousRevisionId: "old1", previousSha256: "oldsha",
    goldenSha256: "newsha", method: "golden-full-approved", unsafeReviewed: true,
  }],
};
test("unsafe restoration requires a matching exact-record signed-off approval", () => {
  assert.ok(approvedEntry(record, approval, 1));
  assert.throws(() => approvedEntry(record, {
    ...approval, entries: [{ ...approval.entries[0], unsafeReviewed: false }],
  }, 1), /unsafeReviewed/);
  assert.throws(() => approvedEntry(record, {
    ...approval, entries: [{ ...approval.entries[0], previousSha256: "stale" }],
  }, 1), /mismatch/);
  assert.throws(() => approvedEntry(record, approval, 2), /matching batch/);
});
