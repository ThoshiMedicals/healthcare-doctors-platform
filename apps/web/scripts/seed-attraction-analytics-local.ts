import { prisma } from "../src/db/prisma";
import { seedAttractionAnalyticsDemo } from "../src/attraction-analytics/seed-demo-events";

async function main() {
  const clinic =
    (await prisma.clinic.findFirst({ where: { slug: "woolloongabba" } })) ??
    (await prisma.clinic.findFirst());
  if (!clinic) {
    console.error("NO_CLINIC");
    process.exit(1);
  }
  const result = await seedAttractionAnalyticsDemo(clinic.id);
  console.log(JSON.stringify({ clinic: clinic.slug, ...result }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
