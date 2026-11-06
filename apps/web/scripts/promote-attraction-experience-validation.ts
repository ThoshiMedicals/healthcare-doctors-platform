/**
 * Promote GP Attraction Experience Validation pages to UAT PageRevisions.
 *
 * Does NOT publish AttractionDocuments.
 * Does NOT call publishAttractionDocumentToProduction().
 *
 * Usage (from apps/web):
 *   npx tsx scripts/promote-attraction-experience-validation.ts
 *   npx tsx scripts/promote-attraction-experience-validation.ts --clinic=woolloongabba --seed
 */
import { prisma } from "../src/db/prisma";
import { promoteAttractionExperienceValidation } from "../src/attraction-cms/experience-validation";
import { seedAttractionAssetPlaceholders } from "../src/asset-library/seed-placeholders";
import { seedCompositeStoriesForEv } from "../src/story-capture/seed-composite-ev";
import { seedAttractionAnalyticsDemo } from "../src/attraction-analytics/seed-demo-events";

async function main() {
  const clinicArg = process.argv.find((a) => a.startsWith("--clinic="));
  const clinicSlug = clinicArg?.slice("--clinic=".length) || "woolloongabba";
  const doSeed = process.argv.includes("--seed");

  const clinic = await prisma.clinic.findUnique({ where: { slug: clinicSlug } });
  if (!clinic) {
    throw new Error(`Clinic "${clinicSlug}" not found. Run db:seed / import:golden first.`);
  }

  let authorId: string | undefined;
  const membership = await prisma.clinicMembership.findFirst({
    where: { clinicId: clinic.id },
    select: { userId: true },
  });
  authorId = membership?.userId;

  if (doSeed) {
    const assetSeed = await seedAttractionAssetPlaceholders(clinic.id, authorId);
    console.log(JSON.stringify({ assets: assetSeed }, null, 2));
    if (authorId) {
      const stories = await seedCompositeStoriesForEv(clinic.id, authorId);
      console.log(JSON.stringify({ stories }, null, 2));
    }
    const analytics = await seedAttractionAnalyticsDemo(clinic.id, authorId);
    console.log(JSON.stringify({ analytics }, null, 2));
  }

  const result = await promoteAttractionExperienceValidation({
    clinicId: clinic.id,
    clinicSlug,
    authorId,
    seedPacks: true,
  });

  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
