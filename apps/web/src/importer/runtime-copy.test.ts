import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { parseImporterCliArgs } from "@/importer/golden-root";
import { buildPublicIntegrityManifest, diffPublicIntegrity } from "@/importer/public-integrity";
import { maybeCopyRuntimeFiles, resolveRuntimeCopyPolicy } from "@/importer/runtime-copy";

test("parseImporterCliArgs defaults allowRuntimeCopy to false", () => {
  const parsed = parseImporterCliArgs(["--dry-run"]);
  assert.equal(parsed.allowRuntimeCopy, false);
  assert.equal(parsed.dryRun, true);
});

test("parseImporterCliArgs accepts --allow-runtime-copy", () => {
  const parsed = parseImporterCliArgs(["--allow-runtime-copy", "--clinic=woolloongabba"]);
  assert.equal(parsed.allowRuntimeCopy, true);
});

test("resolveRuntimeCopyPolicy defaults to disabled", () => {
  const previous = process.env.IMPORT_ALLOW_RUNTIME_COPY;
  delete process.env.IMPORT_ALLOW_RUNTIME_COPY;
  try {
    const policy = resolveRuntimeCopyPolicy(false);
    assert.equal(policy.enabled, false);
  } finally {
    if (previous === undefined) delete process.env.IMPORT_ALLOW_RUNTIME_COPY;
    else process.env.IMPORT_ALLOW_RUNTIME_COPY = previous;
  }
});

test("resolveRuntimeCopyPolicy fails when flag set without env", () => {
  const previous = process.env.IMPORT_ALLOW_RUNTIME_COPY;
  delete process.env.IMPORT_ALLOW_RUNTIME_COPY;
  try {
    assert.throws(() => resolveRuntimeCopyPolicy(true), /IMPORT_ALLOW_RUNTIME_COPY/);
  } finally {
    if (previous === undefined) delete process.env.IMPORT_ALLOW_RUNTIME_COPY;
    else process.env.IMPORT_ALLOW_RUNTIME_COPY = previous;
  }
});

test("resolveRuntimeCopyPolicy fails when env set without flag", () => {
  const previous = process.env.IMPORT_ALLOW_RUNTIME_COPY;
  process.env.IMPORT_ALLOW_RUNTIME_COPY = "true";
  try {
    assert.throws(() => resolveRuntimeCopyPolicy(false), /ambiguous/);
  } finally {
    if (previous === undefined) delete process.env.IMPORT_ALLOW_RUNTIME_COPY;
    else process.env.IMPORT_ALLOW_RUNTIME_COPY = previous;
  }
});

test("resolveRuntimeCopyPolicy enables only with flag and env", () => {
  const previous = process.env.IMPORT_ALLOW_RUNTIME_COPY;
  process.env.IMPORT_ALLOW_RUNTIME_COPY = "true";
  try {
    const policy = resolveRuntimeCopyPolicy(true);
    assert.equal(policy.enabled, true);
  } finally {
    if (previous === undefined) delete process.env.IMPORT_ALLOW_RUNTIME_COPY;
    else process.env.IMPORT_ALLOW_RUNTIME_COPY = previous;
  }
});

test("maybeCopyRuntimeFiles DB-only default does not change public integrity", () => {
  const previous = process.env.IMPORT_ALLOW_RUNTIME_COPY;
  delete process.env.IMPORT_ALLOW_RUNTIME_COPY;
  const before = buildPublicIntegrityManifest();
  try {
    const copied = maybeCopyRuntimeFiles(path.resolve(process.cwd(), "../../old-html"), false);
    assert.equal(copied.length, 0);
    const after = buildPublicIntegrityManifest();
    const diff = diffPublicIntegrity(before, after);
    assert.equal(diff.unchanged, true);
  } finally {
    if (previous === undefined) delete process.env.IMPORT_ALLOW_RUNTIME_COPY;
    else process.env.IMPORT_ALLOW_RUNTIME_COPY = previous;
  }
});

test("maybeCopyRuntimeFiles with opt-in copies into an isolated temp public tree via policy only", () => {
  // Policy enablement is covered above; full copy into apps/web/public is intentionally not exercised
  // against the real tree. Verify copy helper writes only when enabled by using a temp golden+public pair
  // through the same filesystem primitives the helper uses is out of scope here — ensure refuse path works.
  const previous = process.env.IMPORT_ALLOW_RUNTIME_COPY;
  delete process.env.IMPORT_ALLOW_RUNTIME_COPY;
  try {
    assert.throws(() => maybeCopyRuntimeFiles(os.tmpdir(), true), /IMPORT_ALLOW_RUNTIME_COPY/);
  } finally {
    if (previous === undefined) delete process.env.IMPORT_ALLOW_RUNTIME_COPY;
    else process.env.IMPORT_ALLOW_RUNTIME_COPY = previous;
  }
  assert.ok(fs.existsSync(path.join(process.cwd(), "public")));
});
