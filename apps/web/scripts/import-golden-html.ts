import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertDbTarget, formatDbTargetSummary } from "../src/db/assert-db-target";
import { loadEnvFileSafe } from "../src/db/safe-env";
import { parseImporterCliArgs } from "../src/importer/golden-root";
import { importGoldenHtml } from "../src/importer/import-golden-html";
import { buildPublicIntegrityManifest, diffPublicIntegrity } from "../src/importer/public-integrity";
import { validateGoldenImport, writeReports } from "../src/importer/validate-golden-html";

const webDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function main() {
  const { clinicSlug, dryRun, goldenRoot, allowRuntimeCopy } = parseImporterCliArgs();

  // Never silently inject DATABASE_URL / DIRECT_URL from apps/web/.env for write imports.
  const envLoad = loadEnvFileSafe(path.join(webDir, ".env"), { allowProtectedKeys: false });
  if (envLoad.skippedProtected.length > 0 && !dryRun) {
    console.warn(
      JSON.stringify({
        warning: "Protected DB env keys were present in .env but not applied; supply them explicitly in the process environment.",
        skippedProtected: envLoad.skippedProtected,
      }),
    );
  }

  if (!dryRun) {
    const target = assertDbTarget({ operation: "import" });
    console.log(JSON.stringify({ dbTarget: formatDbTargetSummary(target) }));
  }

  const beforePublic = buildPublicIntegrityManifest();
  const imported = await importGoldenHtml({ clinicSlug, dryRun, goldenRoot, allowRuntimeCopy });
  const afterPublic = buildPublicIntegrityManifest();
  const publicDiff = diffPublicIntegrity(beforePublic, afterPublic);

  if (!allowRuntimeCopy && !publicDiff.unchanged) {
    console.error(
      JSON.stringify({
        error: "Public tree changed during DB-only import — aborting.",
        publicDiff,
      }),
    );
    process.exitCode = 1;
    return;
  }

  if (dryRun) {
    console.log(
      JSON.stringify(
        {
          imported,
          dryRun: true,
          validated: false,
          publicUnchanged: publicDiff.unchanged,
          envSkippedProtected: envLoad.skippedProtected,
        },
        null,
        2,
      ),
    );
    return;
  }

  const { importReport, renderingReport } = await validateGoldenImport({ clinicSlug, goldenRoot });
  const directory = writeReports(importReport, renderingReport);

  console.log(
    JSON.stringify(
      {
        imported,
        reports: directory,
        importPassed: importReport.passed,
        renderingAccepted: renderingReport.accepted,
        publicUnchanged: publicDiff.unchanged,
        publicDiff,
      },
      null,
      2,
    ),
  );

  if (!importReport.passed || !renderingReport.accepted || (!allowRuntimeCopy && !publicDiff.unchanged)) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exit(1);
});
