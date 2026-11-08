import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildContentReconciliationReport,
  loadPublishedShaFixture,
} from "../src/importer/content-reconciliation";
import { parseImporterCliArgs } from "../src/importer/golden-root";

const webDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function main() {
  const { goldenRoot } = parseImporterCliArgs();
  const fixtureArg = process.argv.find((a) => a.startsWith("--published-sha-fixture="));
  const fixturePath = fixtureArg?.slice("--published-sha-fixture=".length);
  const publishedShaFixture = fixturePath ? loadPublishedShaFixture(path.resolve(fixturePath)) : null;

  const report = buildContentReconciliationReport({ goldenRoot, publishedShaFixture });
  const outDir = path.join(webDir, "reports");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, "b1a-content-reconciliation.json");
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2), "utf8");

  const summary = {
    goldenPageCount: report.goldenPageCount,
    approvedInventoryCount: report.approvedInventoryCount,
    classBCount: report.classBCount,
    counts: report.counts,
    inventoryIntegrity: report.inventoryIntegrity,
    operatorApprovalRequired: report.operatorApprovalRequired,
    reportPath: outFile,
  };
  console.log(JSON.stringify(summary, null, 2));
  if (!report.inventoryIntegrity.approvedListLengthOk || !report.inventoryIntegrity.classBListLengthOk) {
    process.exitCode = 1;
  }
}

main();
