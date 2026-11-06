import { prisma } from "../src/db/prisma";
import { promoteAttractionExperienceValidation } from "../src/attraction-cms/experience-validation";

async function main() {
  const clinic =
    (await prisma.clinic.findFirst({ where: { slug: "woolloongabba" } })) ??
    (await prisma.clinic.findFirst());
  if (!clinic) {
    console.error("NO_CLINIC");
    process.exit(1);
  }
  const membership = await prisma.clinicMembership.findFirst({
    where: { clinicId: clinic.id },
    select: { userId: true },
  });
  const authorId =
    membership?.userId ??
    (await prisma.user.findFirst({ select: { id: true } }))?.id;
  // Seed packs without a fake author FK first when no user is available.
  if (authorId) {
    const { seedAttractionPublishReadyContent } = await import(
      "../src/attraction-cms/seed-publish-ready"
    );
    await seedAttractionPublishReadyContent(clinic.id, authorId);
  } else {
    const { seedAttractionPublishReadyContent } = await import(
      "../src/attraction-cms/seed-publish-ready"
    );
    await seedAttractionPublishReadyContent(clinic.id);
  }
  const result = await promoteAttractionExperienceValidation({
    clinicId: clinic.id,
    clinicSlug: clinic.slug,
    authorId,
    seedPacks: false,
  });
  console.log(JSON.stringify({ clinic: clinic.slug, authorId: authorId ?? null, ...result }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
