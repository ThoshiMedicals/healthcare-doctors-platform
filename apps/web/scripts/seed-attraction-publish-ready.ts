/**
 * Seed publish-ready attraction content for the primary local clinic.
 * Usage: npx tsx scripts/seed-attraction-publish-ready.ts
 */
import { prisma } from "../src/db/prisma";
import { seedAttractionPublishReadyContent } from "../src/attraction-cms/seed-publish-ready";
import { validateAttractionBody } from "../src/attraction-cms/validate-schema";
import { PUBLISH_READY_SPECS } from "../src/attraction-cms/content";
import type { Prisma } from "@prisma/client";

async function main() {
  for (const spec of PUBLISH_READY_SPECS) {
    const result = validateAttractionBody(spec.kind, spec.draftBody as Prisma.JsonValue);
    if (!result.passed) {
      throw new Error(`${spec.kind}:${spec.slug} validation failed: ${result.violations.join("; ")}`);
    }
  }

  const clinic =
    (await prisma.clinic.findFirst({ where: { slug: "woolloongabba" } })) ??
    (await prisma.clinic.findFirst({ where: { status: "live" } })) ??
    (await prisma.clinic.findFirst());

  if (!clinic) throw new Error("No clinic found");

  const result = await seedAttractionPublishReadyContent(clinic.id);
  console.log(JSON.stringify({ clinic: clinic.slug, ...result }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
