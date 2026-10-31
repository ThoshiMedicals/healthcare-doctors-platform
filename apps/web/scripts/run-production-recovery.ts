/**
 * Production recovery by three gated batches. PREPARE is the default.
 * No golden files, metadata, practitioner payloads, navigation or other records are modified.
 *
 * npx.cmd tsx scripts/run-production-recovery.ts --batch 1 --prepare
 * npx.cmd tsx scripts/run-production-recovery.ts --batch 1 --apply --manifest "..." --approval "..."
 * npx.cmd tsx scripts/run-production-recovery.ts --batch 1 --rollback --result "..."
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { prisma } from "../src/db/prisma";
import { goldenHtmlRoot, listHtmlFiles } from "../src/importer/golden-root";
import { fingerprintContent } from "../src/governance/fingerprint";
import { parseDocument } from "../src/importer/parse-document";
import { auditPublishedOpening, stageMissing } from "../src/regression/production-opening-audit";
import { getPublishedDocument, renderStoredPage } from "../src/documents/render-published-document";
import {
  approvedEntry, expectedOutcome, kindForPath, methodForStatus, pathsForBatch,
  type BatchNumber, type RecoveryApproval, type RecoveryManifest, type RecoveryRecord,
} from "../src/recovery/production-recovery";

const args = process.argv.slice(2);
function flag(name: string): string | null {
  const i = args.indexOf(name);
  return i < 0 ? null : args[i + 1] ?? null;
}
function required(name: string): string {
  const val = flag(name);
  if (!val || val.startsWith("--")) throw Error("Missing argument " + name);
  return val;
}
const batch = Number(required("--batch"));
if (![1, 2, 3].includes(batch)) throw Error("--batch must be 1, 2, or 3");
const modeFlags = ["--prepare", "--apply", "--rollback"].filter(v => args.includes(v));
if (modeFlags.length > 1) throw Error("Choose only one mode.");
const mode = modeFlags[0] ?? "--prepare";
const allowed = new Set(["--batch", "--prepare", "--apply", "--rollback", "--manifest", "--approval", "--result"]);
for (const arg of args) if (arg.startsWith("--") && !allowed.has(arg)) throw Error("Unknown flag: " + arg);
const outputRoot = path.join(os.tmpdir(), "wmc-production-recovery");
fs.mkdirSync(outputRoot, { recursive: true });
const goldenRoot = goldenHtmlRoot();
const repoRoot = path.resolve(process.cwd(), "../../old-html");

function readJson<T>(file: string): T { return JSON.parse(fs.readFileSync(file, "utf8")) as T; }
function writeExclusive(file: string, value: unknown): void {
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n", { encoding: "utf8", flag: "wx" });
}
function assertSafePage(p: string): void {
  if (!/^[a-z0-9/-]+\.html$/.test(p) || p.includes("..") || p.startsWith("/")) {
    throw Error("Unsafe page path: " + p);
  }
}
function failUnless(value: unknown, reason: string): asserts value {
  if (!value) throw Error(reason);
}
async function clinicId(): Promise<string> {
  const c = await prisma.clinic.findUnique({ where: { slug: "woolloongabba" } });
  failUnless(c, "Woolloongabba clinic missing; check DATABASE_URL");
  return c.id;
}
function originalHtml(p: string): { golden: string; repository: string } {
  assertSafePage(p);
  return {
    golden: fs.readFileSync(path.join(goldenRoot, p), "utf8"),
    repository: fs.readFileSync(path.join(repoRoot, p), "utf8"),
  };
}
async function loadRecord(clinic: string, p: string, backupDir: string): Promise<RecoveryRecord> {
  const { golden, repository } = originalHtml(p);
  failUnless(repository === golden, "Repository differs from golden source: " + p);
  const page = await prisma.page.findUnique({
    where: { clinicId_path: { clinicId: clinic, path: p } },
    include: { publishedRevision: true },
  });
  const published = page?.status === "published" && page.publishedRevision?.immutable
    ? page.publishedRevision.html : null;
  const result = auditPublishedOpening(kindForPath(p), repository, golden, published);
  const sha = published == null ? null : fingerprintContent(published);
  const backupPath = published == null ? null : path.join(backupDir, p);
  if (backupPath && published != null) {
    fs.mkdirSync(path.dirname(backupPath), { recursive: true });
    fs.writeFileSync(backupPath, published, { flag: "wx" });
  }
  return {
    page: p, kind: kindForPath(p), status: result.status, issue: result.reason,
    missing: result.missing, method: methodForStatus(result.status),
    expectedOutcome: expectedOutcome(result.status),
    pageId: page?.id ?? null,
    previousRevisionId: page?.publishedRevisionId ?? null,
    previousSha256: sha,
    goldenSha256: fingerprintContent(golden),
    repositorySha256: fingerprintContent(repository),
    originalBackup: backupPath,
  };
}
async function prepare(clinic: string): Promise<void> {
  const paths = pathsForBatch(batch as BatchNumber, listHtmlFiles(repoRoot));
  const directory = path.join(outputRoot, "batch-" + batch + "-" + new Date().toISOString().replace(/[:.]/g, "-"));
  fs.mkdirSync(directory, { recursive: false });
  const records: RecoveryRecord[] = [];
  for (const p of paths) {
    records.push(await loadRecord(clinic, p, path.join(directory, "backups")));
    const r = records[records.length - 1];
    console.log(r.status.padEnd(16) + " " + p + " => " + r.method);
  }
  const manifest: RecoveryManifest = {
    version: 1, clinicSlug: "woolloongabba", batch: batch as BatchNumber,
    createdAt: new Date().toISOString(), records,
  };
  const manifestFile = path.join(directory, "manifest.json");
  writeExclusive(manifestFile, manifest);
  const template: RecoveryApproval = {
    batch: batch as BatchNumber, approvedBy: "",
    entries: records.filter(r => r.method === "golden-opening" || r.method === "golden-full-approved")
      .filter(r => r.previousRevisionId && r.previousSha256)
      .map(r => ({
        page: r.page, previousRevisionId: r.previousRevisionId!,
        previousSha256: r.previousSha256!, goldenSha256: r.goldenSha256,
        method: r.method as "golden-opening" | "golden-full-approved",
        ...(r.status === "unsafe" ? { unsafeReviewed: false } : {}),
      })),
  };
  writeExclusive(path.join(directory, "approval-TEMPLATE.json"), template);
  const rows = records.map(r => ({
    page: r.page, issue: r.issue, status: r.status, method: r.method,
    expectedOutcome: r.expectedOutcome,
  }));
  writeExclusive(path.join(directory, "repair-plan.json"), rows);
  console.log("PREPARED, NO DATABASE CHANGES. " + manifestFile);
  console.log("Review source backups and remove any entry not explicitly approved from approval-TEMPLATE.json.");
}
type Applied = { page: string; pageId: string; before: string; after: string; beforeSha: string; afterSha: string };
async function apply(clinic: string): Promise<void> {
  const manifestFile = required("--manifest");
  const approvalFile = required("--approval");
  failUnless(path.resolve(manifestFile) !== path.resolve(approvalFile), "Manifest and approval must be different files.");
  const manifest = readJson<RecoveryManifest>(manifestFile);
  const approval = readJson<RecoveryApproval>(approvalFile);
  failUnless(manifest.version === 1 && manifest.clinicSlug === "woolloongabba" && manifest.batch === batch, "Manifest mismatch.");
  failUnless(approval.batch === batch && approval.approvedBy?.trim(), "Missing named approval.");
  const targets = manifest.records.filter(r => approval.entries.some(a => a.page === r.page));
  failUnless(targets.length > 0, "No page approvals provided.");
  failUnless(new Set(approval.entries.map(a => a.page)).size === approval.entries.length, "Duplicate approval entries.");
  failUnless(targets.length === approval.entries.length, "Approval refers to page outside manifest.");
  for (const r of targets) {
    approvedEntry(r, approval, batch as BatchNumber);
    const { golden, repository } = originalHtml(r.page);
    failUnless(golden === repository && fingerprintContent(golden) === r.goldenSha256, "Golden source changed: " + r.page);
    failUnless(r.originalBackup && fs.existsSync(r.originalBackup), "Missing original backup: " + r.page);
    failUnless(fingerprintContent(fs.readFileSync(r.originalBackup, "utf8")) === r.previousSha256, "Backup checksum failed: " + r.page);
    const now = await prisma.page.findUnique({ where: { clinicId_path: { clinicId: clinic, path: r.page } }, include: { publishedRevision: true } });
    failUnless(now && now.id === r.pageId && now.status === "published" &&
      now.publishedRevisionId === r.previousRevisionId &&
      now.publishedRevision?.immutable &&
      fingerprintContent(now.publishedRevision.html) === r.previousSha256, "Published page changed since prepare: " + r.page);
    const state = auditPublishedOpening(r.kind, repository, golden, now.publishedRevision.html);
    failUnless(state.status === r.status, "Page classification changed: " + r.page);
    failUnless(r.method !== "golden-opening" || (state.headPreserved && state.chromePreserved && state.downstreamPreserved),
      "Opening recovery integrity gate failed: " + r.page);
  }
  const out = path.join(path.dirname(manifestFile), "result-" + new Date().toISOString().replace(/[:.]/g, "-") + ".json");
  // Reserve the result file before mutation, so an unexpected filesystem failure cannot leave undocumented changes.
  writeExclusive(out, { status: "pending", batch, approvedBy: approval.approvedBy, manifestFile, entries: [] });
  const applied = await prisma.$transaction(async tx => {
    const entries: Applied[] = [];
    for (const r of targets) {
      const current = await tx.page.findUnique({ where: { id: r.pageId! }, include: { publishedRevision: true } });
      failUnless(current && current.publishedRevisionId === r.previousRevisionId &&
        current.publishedRevision?.immutable &&
        fingerprintContent(current.publishedRevision.html) === r.previousSha256, "Concurrent publication: " + r.page);
      const { golden } = originalHtml(r.page);
      const parsed = parseDocument(golden, r.page);
      const existing = await tx.pageRevision.findFirst({
        where: { pageId: current.id, contentSha256: r.goldenSha256, immutable: true },
      });
      // Don't trust a hash field by itself; verify actual revision bytes before using a previous revision.
      if (existing && fingerprintContent(existing.html) !== r.goldenSha256) throw Error("Stored approved revision is invalid: " + r.page);
      const revision = existing ?? await tx.pageRevision.create({
        data: {
          pageId: current.id, html: golden, immutable: true, contentSha256: r.goldenSha256,
          body: { source: "golden-master", goldenPath: r.page,
            schema: parsed.schemaBlocks, navOwner: parsed.navOwner,
            navIsHub: parsed.navIsHub, navRoute: parsed.navRoute },
        },
      });
      const changed = await tx.page.updateMany({
        where: { id: current.id, publishedRevisionId: r.previousRevisionId! },
        data: { publishedRevisionId: revision.id },
      });
      failUnless(changed.count === 1, "Concurrent publication prevented update: " + r.page);
      entries.push({ page: r.page, pageId: current.id, before: r.previousRevisionId!,
        after: revision.id, beforeSha: r.previousSha256!, afterSha: r.goldenSha256 });
    }
    return entries;
  }, { timeout: 120000, maxWait: 20000 });
  fs.writeFileSync(out, JSON.stringify({ status: "applied", batch, approvedBy: approval.approvedBy,
    manifestFile, entries: applied }, null, 2) + "\n");
  console.log("APPLIED " + applied.length + " revisions. ROLLBACK RESULT: " + out);
  for (const entry of applied) {
    const original = originalHtml(entry.page).golden;
    const published = await prisma.page.findUnique({ where: { id: entry.pageId }, include: { publishedRevision: true } });
    const overlay = await getPublishedDocument(clinic, entry.page);
    const delivered = await renderStoredPage(clinic, entry.page);
    const problems = [
      ...(published?.publishedRevision?.html === original ? [] : ["stored revision differs"]),
      ...stageMissing(kindForPath(entry.page), original, overlay?.html ?? null).map(x => "overlay missing " + x),
      ...stageMissing(kindForPath(entry.page), original, delivered?.html ?? null).map(x => "delivered missing " + x),
      ...(delivered?.status === 200 ? [] : ["delivered page not 200"]),
    ];
    console.log((problems.length ? "VERIFY-FAILED " : "VERIFY-PASS ") + entry.page +
      (problems.length ? ": " + problems.join("; ") : ""));
    if (problems.length) process.exitCode = 2;
  }
}
async function rollback(clinic: string): Promise<void> {
  const resultFile = required("--result");
  const result = readJson<{ status: string; batch: number; entries: Applied[] }>(resultFile);
  failUnless(result.status === "applied" && result.batch === batch && result.entries?.length, "Invalid rollback result.");
  await prisma.$transaction(async tx => {
    for (const item of result.entries) {
      const current = await tx.page.findUnique({ where: { id: item.pageId }, include: { publishedRevision: true } });
      failUnless(current && current.clinicId === clinic && current.path === item.page &&
        current.publishedRevisionId === item.after &&
        current.publishedRevision?.immutable &&
        fingerprintContent(current.publishedRevision.html) === item.afterSha, "Rollback conflict: " + item.page);
      const previous = await tx.pageRevision.findUnique({ where: { id: item.before } });
      failUnless(previous && previous.pageId === item.pageId && previous.immutable &&
        fingerprintContent(previous.html) === item.beforeSha, "Original revision mismatch: " + item.page);
      const changed = await tx.page.updateMany({
        where: { id: item.pageId, publishedRevisionId: item.after },
        data: { publishedRevisionId: item.before },
      });
      failUnless(changed.count === 1, "Rollback concurrent change: " + item.page);
    }
  }, { timeout: 120000, maxWait: 20000 });
  console.log("ROLLED BACK " + result.entries.length + " pages from batch " + batch);
}
async function main() {
  const clinic = await clinicId();
  if (mode === "--prepare") await prepare(clinic);
  else if (mode === "--apply") await apply(clinic);
  else await rollback(clinic);
}
main().catch(e => { console.error(e); process.exitCode = 1; })
  .finally(async () => { await prisma.$disconnect(); });
