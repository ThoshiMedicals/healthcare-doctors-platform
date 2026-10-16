import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { importGoldenHtml } from "../src/importer/import-golden-html";
import { validateGoldenImport, writeReports } from "../src/importer/validate-golden-html";

loadEnv(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env"));

async function main() {
  const imported = await importGoldenHtml();
  const { importReport, renderingReport } = await validateGoldenImport();
  const directory = writeReports(importReport, renderingReport);

  console.log(
    JSON.stringify(
      { imported, reports: directory, importPassed: importReport.passed, renderingAccepted: renderingReport.accepted },
      null,
      2,
    ),
  );

  if (!importReport.passed || !renderingReport.accepted) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

function loadEnv(file: string) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^([^#=\s]+)\s*=\s*(.*)$/);
    if (!match || process.env[match[1]]) continue;
    process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
  }
}
