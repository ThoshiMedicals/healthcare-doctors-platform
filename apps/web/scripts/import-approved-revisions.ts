import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertDbTarget, formatDbTargetSummary } from "../src/db/assert-db-target";
import { loadEnvFileSafe } from "../src/db/safe-env";
import { importApprovedRevisions } from "../src/importer/import-approved-revisions";
import { buildPublicIntegrityManifest, diffPublicIntegrity } from "../src/importer/public-integrity";
import { goldenHtmlRoot } from "../src/importer/golden-root";

const webDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function parseArgs(argv: string[]) {
  let clinicSlug = process.env.DEFAULT_CLINIC_SLUG || "woolloongabba";
  let dryRun = false;
  let manifestPath: string | undefined;
  let contentRoot: string | undefined;
  let goldenRoot: string | undefined;
  let offlineFixture = false;

  for (const arg of argv) {
    if (arg === "--dry-run") dryRun = true;
    else if (arg === "--offline-fixture") offlineFixture = true;
    else if (arg.startsWith("--clinic=")) clinicSlug = arg.slice("--clinic=".length);
    else if (arg.startsWith("--manifest=")) manifestPath = arg.slice("--manifest=".length);
    else if (arg.startsWith("--content-root=")) contentRoot = arg.slice("--content-root=".length);
    else if (arg.startsWith("--golden-root=")) goldenRoot = arg.slice("--golden-root=".length);
  }

  return { clinicSlug, dryRun, manifestPath, contentRoot, goldenRoot, offlineFixture };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.manifestPath) {
    console.error("Usage: import:approved --manifest=<path> [--dry-run] [--content-root=<dir>] [--clinic=<slug>]");
    process.exit(1);
  }

  const envLoad = loadEnvFileSafe(path.join(webDir, ".env"), { allowProtectedKeys: false });
  if (envLoad.skippedProtected.length > 0 && !args.dryRun) {
    console.warn(
      JSON.stringify({
        warning: "Protected DB env keys were present in .env but not applied; supply them explicitly in the process environment.",
        skippedProtected: envLoad.skippedProtected,
      }),
    );
  }

  if (!args.dryRun && !args.offlineFixture) {
    const target = assertDbTarget({ operation: "import" });
    console.log(JSON.stringify({ dbTarget: formatDbTargetSummary(target) }));
  }

  const beforePublic = buildPublicIntegrityManifest();
  const beforeGolden = buildTreeFingerprint(goldenHtmlRoot(args.goldenRoot));

  const imported = await importApprovedRevisions({
    clinicSlug: args.clinicSlug,
    dryRun: args.dryRun,
    manifestPath: path.resolve(args.manifestPath),
    contentRoot: args.contentRoot,
    goldenRoot: args.goldenRoot,
    offlineFixture: args.offlineFixture,
  });

  const afterPublic = buildPublicIntegrityManifest();
  const afterGolden = buildTreeFingerprint(goldenHtmlRoot(args.goldenRoot));
  const publicDiff = diffPublicIntegrity(beforePublic, afterPublic);

  if (!publicDiff.unchanged) {
    console.error(JSON.stringify({ error: "Public tree changed during approved import — aborting.", publicDiff }));
    process.exitCode = 1;
    return;
  }
  if (beforeGolden !== afterGolden) {
    console.error(JSON.stringify({ error: "Golden-master tree changed during approved import — aborting." }));
    process.exitCode = 1;
    return;
  }

  console.log(
    JSON.stringify(
      {
        imported,
        publicUnchanged: true,
        goldenUnchanged: true,
        envSkippedProtected: envLoad.skippedProtected,
      },
      null,
      2,
    ),
  );
}

function buildTreeFingerprint(root: string): string {
  const files: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === ".git" || entry.name === "node_modules") continue;
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else files.push(path.relative(root, absolute).split(path.sep).join("/"));
    }
  };
  walk(root);
  files.sort();
  const hash = crypto.createHash("sha256");
  for (const relative of files) {
    hash.update(relative);
    hash.update("\0");
    hash.update(fs.readFileSync(path.join(root, relative)));
    hash.update("\0");
  }
  return hash.digest("hex");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
