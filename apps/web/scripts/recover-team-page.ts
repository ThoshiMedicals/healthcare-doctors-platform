/**
 * One-page Team golden-master recovery. By default READ ONLY.
 * Run from apps/web: npx.cmd tsx scripts/recover-team-page.ts
 * To repoint only the page's publishedRevisionId:
 *   npx.cmd tsx scripts/recover-team-page.ts --apply
 *
 * This is not a re-import; it never modifies page metadata, nav ownership,
 * published practitioner payloads, schema models, or any other page.
 */
import fs from "node:fs";
import path from "node:path";
import { prisma } from "../src/db/prisma";
import { goldenHtmlRoot } from "../src/importer/golden-root";
import { fingerprintContent } from "../src/governance/fingerprint";
import { parseDocument } from "../src/importer/parse-document";
import { assessTeamOpening } from "../src/regression/team-opening";

const pagePath = "team.html";
const mode = process.argv[2] ?? "--check";
if (!["--check", "--apply"].includes(mode) || process.argv.length > 3) {
  throw new Error("Usage: npx.cmd tsx scripts/recover-team-page.ts [--check|--apply]");
}

async function main() {
  const golden = fs.readFileSync(path.join(goldenHtmlRoot(), pagePath), "utf8");
  const clinic = await prisma.clinic.findUnique({ where: { slug: "woolloongabba" } });
  if (!clinic) throw new Error("Woolloongabba clinic is not present in this database.");
  const page = await prisma.page.findUnique({
    where: { clinicId_path: { clinicId: clinic.id, path: pagePath } },
    include: { publishedRevision: true },
  });
  if (!page || page.status !== "published" || !page.publishedRevision?.immutable) {
    throw new Error("Team page is not published with an immutable revision.");
  }

  const originalRevisionId = page.publishedRevisionId;
  const assessment = assessTeamOpening(page.publishedRevision.html, golden);
  console.log(JSON.stringify({
    path: pagePath,
    publishedRevisionId: originalRevisionId,
    publishedContentSha256: page.publishedRevision.contentSha256,
    goldenContentSha256: fingerprintContent(golden),
    ...assessment,
  }, null, 2));

  if (mode === "--check") {
    console.log("READ ONLY: no changes made.");
    return;
  }

  if (assessment.status !== "opening-damaged") {
    throw new Error("No restoration performed: only proven opening-only corruption may be repaired automatically.");
  }

  const contentSha256 = fingerprintContent(golden);
  const previousApproved = await prisma.pageRevision.findFirst({
    where: { pageId: page.id, contentSha256, immutable: true },
  });
  const parsed = parseDocument(golden, pagePath);
  const revision = previousApproved ?? await prisma.pageRevision.create({
    data: {
      pageId: page.id,
      html: golden,
      immutable: true,
      contentSha256,
      body: {
        source: "golden-master",
        goldenPath: pagePath,
        schema: parsed.schemaBlocks,
        navOwner: parsed.navOwner,
        navIsHub: parsed.navIsHub,
        navRoute: parsed.navRoute,
      },
    },
  });

  // Optimistic update: refuse to override another publisher's concurrent change.
  const updated = await prisma.page.updateMany({
    where: { id: page.id, publishedRevisionId: originalRevisionId },
    data: { publishedRevisionId: revision.id },
  });
  if (updated.count !== 1) {
    throw new Error("The published revision changed during recovery; no page pointer was updated.");
  }
  console.log("TEAM PAGE RECOVERED");
  console.log("Old revision ID (retain for explicit rollback):", originalRevisionId);
  console.log("New golden revision ID:", revision.id);
  console.log("Only the team.html publishedRevisionId changed. Verify staging before acceptance.");
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await prisma.$disconnect();
});
