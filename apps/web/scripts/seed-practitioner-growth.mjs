/**
 * Seeds growth flags for newly onboarded GPs and merges into publishedPayload
 * so public injects work without a full republish cycle.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SEEDS = [
  {
    slug: "dr-golnar-mortezaei",
    acceptingNewPatients: true,
    availabilityStatus: "available_this_week",
    relatedServices: [
      "services/chronic-disease-care.html",
      "services/family-health.html",
      "services/preventive-healthcare.html",
    ],
  },
  {
    slug: "dr-james",
    acceptingNewPatients: true,
    availabilityStatus: "available_this_week",
    relatedServices: [
      "services/childrens-health.html",
      "services/mental-health.html",
      "services/family-health.html",
    ],
  },
  {
    slug: "dr-yamesha-ranatunga",
    acceptingNewPatients: true,
    availabilityStatus: "available_this_week",
    relatedServices: [
      "services/womens-health.html",
      "services/family-health.html",
      "services/chronic-disease-care.html",
    ],
  },
];

const now = new Date();

try {
  for (const seed of SEEDS) {
    const row = await prisma.practitioner.findFirst({ where: { slug: seed.slug } });
    if (!row) {
      console.log("skip missing", seed.slug);
      continue;
    }
    const prev =
      row.publishedPayload && typeof row.publishedPayload === "object" && !Array.isArray(row.publishedPayload)
        ? { ...row.publishedPayload }
        : {};
    const newToPracticeAt = row.newToPracticeAt || now;
    const nextPayload = {
      ...prev,
      acceptingNewPatients: seed.acceptingNewPatients,
      newToPracticeAt: newToPracticeAt.toISOString(),
      availabilityStatus: seed.availabilityStatus,
      relatedServices: seed.relatedServices,
    };
    await prisma.practitioner.update({
      where: { id: row.id },
      data: {
        acceptingNewPatients: seed.acceptingNewPatients,
        newToPracticeAt,
        availabilityStatus: seed.availabilityStatus,
        relatedServices: seed.relatedServices,
        publishedPayload: nextPayload,
      },
    });
    console.log("seeded", seed.slug, {
      newToPracticeAt: newToPracticeAt.toISOString(),
      relatedServices: seed.relatedServices.length,
    });
  }
} finally {
  await prisma.$disconnect();
}
