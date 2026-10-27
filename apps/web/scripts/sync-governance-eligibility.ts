/**
 * Upsert draft ClinicalReview rows for every eligibility-register page that
 * already has a Page record. Does not invent reviewers, owners, or dates.
 *
 * Usage: npx tsx scripts/sync-governance-eligibility.ts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "@/db/prisma";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const registryPath = path.join(root, "old-html/cms/governance-records.json");

type EligibilityRow = {
  path: string;
  collection: string;
  reviewType: "clinical" | "operational" | "institutional";
  status: string;
};

const collectionMap: Record<string, "practitioner" | "service" | "knowledge_topic" | "practice_information" | "knowledge_article"> = {
  practitioner: "practitioner",
  service: "service",
  knowledge_centre: "knowledge_topic",
  knowledge_article: "knowledge_article",
  practice_information: "practice_information",
  governance: "practice_information",
};

async function main() {
  const registry = JSON.parse(fs.readFileSync(registryPath, "utf8")) as { records: EligibilityRow[] };
  const clinic = await prisma.clinic.findUnique({ where: { slug: "woolloongabba" }, select: { id: true } });
  if (!clinic) throw new Error("woolloongabba clinic not found");

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of registry.records) {
    const page = await prisma.page.findFirst({
      where: { clinicId: clinic.id, path: row.path },
      select: { id: true },
    });
    if (!page) {
      skipped += 1;
      continue;
    }

    const existing = await prisma.clinicalReview.findUnique({ where: { pageId: page.id } });
    const collection = collectionMap[row.collection] ?? null;
    if (!existing) {
      await prisma.clinicalReview.create({
        data: {
          clinicId: clinic.id,
          pageId: page.id,
          collection,
          reviewType: row.reviewType,
          status: "draft",
        },
      });
      created += 1;
      continue;
    }

    await prisma.clinicalReview.update({
      where: { pageId: page.id },
      data: {
        collection: existing.collection ?? collection,
        reviewType: existing.reviewType || row.reviewType,
      },
    });
    updated += 1;
  }

  console.log(JSON.stringify({ eligible: registry.records.length, created, updated, skippedMissingPage: skipped }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
