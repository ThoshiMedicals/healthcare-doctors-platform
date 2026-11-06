import { prisma } from "../src/db/prisma";
import { seedAttractionAssetPlaceholders } from "../src/asset-library/seed-placeholders";

async function main() {
  const clinic =
    (await prisma.clinic.findFirst({ where: { slug: "woolloongabba" } })) ??
    (await prisma.clinic.findFirst());
  if (!clinic) throw new Error("No clinic found");
  const result = await seedAttractionAssetPlaceholders(clinic.id);
  console.log(JSON.stringify({ clinic: clinic.slug, ...result }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
