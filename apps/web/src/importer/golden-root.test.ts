import assert from "node:assert/strict";
import test from "node:test";
import { parseImporterCliArgs } from "@/importer/golden-root";

test("parses --clinic=slug and --dry-run", () => {
  const parsed = parseImporterCliArgs(["--clinic=example-clinic", "--dry-run"]);
  assert.equal(parsed.clinicSlug, "example-clinic");
  assert.equal(parsed.dryRun, true);
});

test("parses two-token --clinic and --golden-root", () => {
  const parsed = parseImporterCliArgs(["--clinic", "gabba", "--golden-root", "C:/tmp/golden"]);
  assert.equal(parsed.clinicSlug, "gabba");
  assert.equal(parsed.goldenRoot, "C:/tmp/golden");
  assert.equal(parsed.dryRun, false);
});
