import { PrismaClient } from "@prisma/client";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
// Domain helpers are TypeScript — run via compiled path is awkward; duplicate minimal seed here for smoke.
const prisma = new PrismaClient();

async function main() {
  const clinic = await prisma.clinic.findFirst({ where: { slug: "woolloongabba" } });
  if (!clinic) throw new Error("woolloongabba clinic missing");

  const stubs = [
    {
      preferredPublishedName: "Dr Golnar Mortezaei",
      title: "Dr",
      shortIntroduction: "General practitioner joining the Woolloongabba Medical Centre team.",
      biography:
        "Dr Golnar Mortezaei is a general practitioner preparing her Woolloongabba Medical Centre profile. This seed draft supports the Professional Profile Builder migration workflow until a full portal submission is received.",
      languages: ["English", "Persian"],
      specialInterests: ["Family Medicine", "Women's Health", "Preventive Health"],
      qualifications: ["MBBS", "FRACGP"],
      memberships: ["RACGP"],
    },
    {
      preferredPublishedName: "Dr James",
      title: "Dr",
      shortIntroduction: "General practitioner draft profile for Healthcare Doctors network publishing.",
      biography:
        "Dr James is a seeded migration example for the GP Readiness Professional Profile Builder. Staff can review, update, and republish through the same workflow used for portal submissions.",
      languages: ["English"],
      specialInterests: ["Family Medicine", "Men's Health", "Chronic Disease Management"],
      qualifications: ["MBBS"],
      memberships: ["RACGP", "AMA"],
    },
  ];

  for (const stub of stubs) {
    const existing = await prisma.gpDoctorProfileDraft.findFirst({
      where: {
        clinicId: clinic.id,
        source: "manual_seed",
        preferredPublishedName: stub.preferredPublishedName,
      },
    });
    if (existing) continue;
    await prisma.gpDoctorProfileDraft.create({
      data: {
        clinicId: clinic.id,
        source: "manual_seed",
        status: "draft",
        title: stub.title,
        preferredPublishedName: stub.preferredPublishedName,
        credentials: stub.qualifications,
        biography: stub.biography,
        shortIntroduction: stub.shortIntroduction,
        qualifications: stub.qualifications,
        specialInterests: stub.specialInterests,
        languages: stub.languages,
        memberships: stub.memberships,
        completenessScore: 55,
      },
    });
  }

  const published = await prisma.practitioner.findMany({
    where: { clinicId: clinic.id, status: "published" },
    orderBy: { name: "asc" },
    take: 2,
  });

  for (const practitioner of published) {
    const existing = await prisma.gpDoctorProfileDraft.findFirst({
      where: { clinicId: clinic.id, practitionerId: practitioner.id, source: "practitioner_import" },
    });
    if (existing) continue;
    await prisma.gpDoctorProfileDraft.create({
      data: {
        clinicId: clinic.id,
        practitionerId: practitioner.id,
        source: "practitioner_import",
        status: "draft",
        title: "Dr",
        preferredPublishedName: practitioner.name,
        credentials: practitioner.qualifications.slice(0, 6),
        biography: practitioner.biography,
        shortIntroduction: practitioner.biography.slice(0, 250),
        qualifications: practitioner.qualifications,
        specialInterests: practitioner.professionalInterests,
        languages: practitioner.languages,
        memberships: [],
        headshotPath: practitioner.portraitPath,
        completenessScore: 40,
      },
    });
  }

  const stats = await prisma.gpDoctorProfileDraft.groupBy({
    by: ["status"],
    where: { clinicId: clinic.id },
    _count: { _all: true },
  });
  const names = await prisma.gpDoctorProfileDraft.findMany({
    where: { clinicId: clinic.id },
    select: { preferredPublishedName: true, source: true, status: true },
    orderBy: { preferredPublishedName: "asc" },
  });
  console.log(JSON.stringify({ stats, names }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
