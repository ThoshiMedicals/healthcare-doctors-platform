/**
 * Read-only multi-page golden-master / PostgreSQL / rendered-HTML recovery audit.
 * Run from apps/web: npx.cmd tsx scripts/audit-production-openings.ts
 * Generates CSV and JSON under the Windows TEMP directory; NEVER updates data.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { prisma } from "../src/db/prisma";
import { goldenHtmlRoot, listHtmlFiles } from "../src/importer/golden-root";
import { fingerprintContent } from "../src/governance/fingerprint";
import { getPublishedDocument, renderStoredPage } from "../src/documents/render-published-document";
import { auditPublishedOpening, stageMissing, type RecoveryKind, type RecoveryStatus } from "../src/regression/production-opening-audit";

const PRIORITY = [
  "team.html",
  "services/family-health.html",
  "services/mens-health.html",
  "services/childrens-health.html",
  "services/mental-health.html",
  "services/chronic-disease-care.html",
  "services/skin-checks.html",
  "doctors/dr-tanya-goodwill.html",
  "doctors/dr-wasantha-hettiarchchi.html",
  "doctors/dr-kooshyar-karimi.html",
] as const;

const args = process.argv.slice(2);
if (args.some(a => a !== "--priority" && a !== "--all")) {
  throw new Error("Usage: npx.cmd tsx scripts/audit-production-openings.ts [--priority|--all]");
}
const priorityOnly = args.includes("--priority");
const goldenRoot = goldenHtmlRoot();
const repositoryRoot = path.resolve(process.cwd(), "../../old-html");
const allKnowledge = listHtmlFiles(repositoryRoot).filter(p => p.startsWith("knowledge/") && p.endsWith(".html"));
const selected = priorityOnly ? [...PRIORITY] : [...PRIORITY, ...allKnowledge];
const paths = [...new Set(selected)];

function kindFor(p: string): RecoveryKind {
  if (p === "team.html") return "team";
  if (p.startsWith("services/")) return "service";
  if (p.startsWith("doctors/")) return "practitioner";
  if (p.startsWith("knowledge/articles/")) return "knowledge-article";
  return "knowledge-hub";
}

function actionFor(status: RecoveryStatus): string {
  switch (status) {
    case "healthy": return "No DB change. If invisible, inspect rendered HTML, CSS and deployment.";
    case "opening-damaged": return "Eligible for proposed targeted golden revision switch after backup and approval.";
    case "other-drift": return "No automatic restore. Review text and payload changes against approved source.";
    case "unsafe": return "STOP: manual diff, preserve metadata/cards/booking and approve surgical recovery.";
  }
}

type AuditRow = {
  page: string;
  kind: RecoveryKind;
  status: RecoveryStatus;
  missing: string[];
  sourceVsGolden: boolean;
  databaseVsGolden: boolean;
  goldenHash: string;
  repositoryHash: string;
  publishedHash: string | null;
  revisionId: string | null;
  headPreserved: boolean;
  chromePreserved: boolean;
  downstreamPreserved: boolean;
  afterOverlayMissing: string[];
  deliveredHtmlMissing: string[];
  renderingError: string | null;
  reason: string;
  recoveryAction: string;
};

function csvCell(v: unknown) {
  const value = Array.isArray(v) ? v.join("; ") : v == null ? "" : String(v);
  return '"' + value.replace(/"/g, '""') + '"';
}

async function main() {
  const clinic = await prisma.clinic.findUnique({ where: { slug: "woolloongabba" } });
  if (!clinic) throw new Error("Woolloongabba clinic not found. Check the staging DATABASE_URL.");
  const rows: AuditRow[] = [];
  for (const p of paths) {
    const kind = kindFor(p);
    const repoFile = path.join(repositoryRoot, p);
    const goldenFile = path.join(goldenRoot, p);
    if (!fs.existsSync(repoFile) || !fs.existsSync(goldenFile)) {
      rows.push({
        page: p, kind, status: "unsafe", missing: ["repository or golden file"],
        sourceVsGolden: false, databaseVsGolden: false, goldenHash: "", repositoryHash: "",
        publishedHash: null, revisionId: null, headPreserved: false,
        chromePreserved: false, downstreamPreserved: false, afterOverlayMissing: [], deliveredHtmlMissing: [],
        renderingError: "Source file absent", reason: "Approved source unavailable.",
        recoveryAction: actionFor("unsafe"),
      });
      continue;
    }
    const repository = fs.readFileSync(repoFile, "utf8");
    const golden = fs.readFileSync(goldenFile, "utf8");
    const page = await prisma.page.findUnique({
      where: { clinicId_path: { clinicId: clinic.id, path: p } },
      include: { publishedRevision: true },
    });
    const published = page?.status === "published" && page.publishedRevision?.immutable
      ? page.publishedRevision.html : null;
    const audit = auditPublishedOpening(kind, repository, golden, published);
    let overlay: string | null = null;
    let delivered: string | null = null;
    let error: string | null = null;
    if (published != null) {
      try {
        overlay = (await getPublishedDocument(clinic.id, p))?.html ?? null;
        delivered = (await renderStoredPage(clinic.id, p))?.html ?? null;
      } catch (e) {
        error = e instanceof Error ? e.message : String(e);
      }
    }
    rows.push({
      page: p, kind, status: audit.status, missing: audit.missing,
      sourceVsGolden: audit.repositoryMatchesGolden,
      databaseVsGolden: audit.publishedMatchesGolden,
      goldenHash: fingerprintContent(golden), repositoryHash: fingerprintContent(repository),
      publishedHash: published == null ? null : fingerprintContent(published),
      revisionId: page?.publishedRevisionId ?? null, headPreserved: audit.headPreserved,
      chromePreserved: audit.chromePreserved, downstreamPreserved: audit.downstreamPreserved,
      afterOverlayMissing: stageMissing(kind, golden, overlay),
      deliveredHtmlMissing: stageMissing(kind, golden, delivered),
      renderingError: error, reason: audit.reason, recoveryAction: actionFor(audit.status),
    });
    console.log("AUDIT " + String(rows.length).padStart(3, " ") + "/" + paths.length +
      " " + audit.status.padEnd(16) + " " + p +
      (audit.missing.length ? " | missing: " + audit.missing.join(", ") : ""));
  }

  const columns: Array<keyof AuditRow> = [
    "page", "kind", "status", "missing", "sourceVsGolden", "databaseVsGolden",
    "goldenHash", "repositoryHash", "publishedHash", "revisionId",
    "headPreserved", "chromePreserved", "downstreamPreserved", "afterOverlayMissing", "deliveredHtmlMissing",
    "renderingError", "reason", "recoveryAction",
  ];
  const csv = [columns.map(csvCell).join(",")].concat(
    rows.map(r => columns.map(c => csvCell(r[c])).join(","))
  ).join("\r\n") + "\r\n";
  const stamp = priorityOnly ? "priority" : "all-knowledge";
  const csvPath = path.join(os.tmpdir(), "wmc-production-opening-audit-" + stamp + ".csv");
  const jsonPath = path.join(os.tmpdir(), "wmc-production-opening-audit-" + stamp + ".json");
  fs.writeFileSync(csvPath, csv, "utf8");
  fs.writeFileSync(jsonPath, JSON.stringify({
    clinicSlug: "woolloongabba",
    mode: stamp,
    generatedAt: new Date().toISOString(),
    total: rows.length,
    summary: Object.fromEntries(
      (["healthy", "opening-damaged", "other-drift", "unsafe"] as RecoveryStatus[])
        .map(status => [status, rows.filter(r => r.status === status).length])
    ),
    rows,
  }, null, 2), "utf8");
  console.log("\nREAD-ONLY AUDIT COMPLETE. No database updates performed.");
  console.log("CSV: " + csvPath);
  console.log("JSON: " + jsonPath);
  console.log("Counts: " + JSON.stringify(
    Object.fromEntries(
      (["healthy", "opening-damaged", "other-drift", "unsafe"] as RecoveryStatus[])
        .map(status => [status, rows.filter(r => r.status === status).length])
    )
  ));
}

main().catch(e => {
  console.error(e);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
