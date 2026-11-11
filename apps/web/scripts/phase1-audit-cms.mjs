import { PrismaClient, Prisma } from "@prisma/client";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const prisma = new PrismaClient();

async function main() {
  const clinicCount = await prisma.clinic.count();
  const practitionerCount = await prisma.practitioner.count();
  console.log({ clinicCount, practitionerCount });

  const clinics = await prisma.clinic.findMany({
    select: { id: true, slug: true, practiceName: true },
  });
  console.log("clinics", clinics);

  let clinic =
    clinics.find((c) => c.slug === "woolloongabba-medical-centre") ||
    clinics.find((c) => /woolloongabba|wmc/i.test(`${c.slug} ${c.practiceName || ""}`)) ||
    null;

  if (!clinic) {
    // Prefer the clinic that actually has practitioner rows.
    for (const c of clinics) {
      const n = await prisma.practitioner.count({ where: { clinicId: c.id } });
      if (n > 0) {
        clinic = c;
        break;
      }
    }
  }

  if (!clinic) {
    console.error("No clinic found");
    process.exit(1);
  }

  // If preferred slug has zero practitioners, fall back to the populated clinic.
  const preferredCount = await prisma.practitioner.count({ where: { clinicId: clinic.id } });
  if (preferredCount === 0) {
    for (const c of clinics) {
      const n = await prisma.practitioner.count({ where: { clinicId: c.id } });
      if (n > 0) {
        clinic = c;
        break;
      }
    }
  }

  console.log("using clinic", clinic);

  const practitioners = await prisma.practitioner.findMany({
    where: { clinicId: clinic.id },
    include: {
      page: {
        select: {
          path: true,
          status: true,
          publishedRevision: { select: { body: true } },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const rows = practitioners.map((p) => {
    const payload =
      p.publishedPayload && typeof p.publishedPayload === "object" && !Array.isArray(p.publishedPayload)
        ? /** @type {Record<string, unknown>} */ (p.publishedPayload)
        : {};
    const body = p.page?.publishedRevision?.body;
    const importSource =
      body && typeof body === "object" && !Array.isArray(body)
        ? /** @type {{ source?: string }} */ (body).source
        : null;
    const quals = Array.isArray(payload.qualifications) ? payload.qualifications : p.qualifications;
    const areas =
      Array.isArray(payload.areasOfCare) && payload.areasOfCare.length
        ? payload.areasOfCare
        : p.areasOfCare;
    return {
      source: "cms",
      id: p.id,
      name: p.name,
      slug: p.slug,
      role: p.role,
      status: p.status,
      bookingUrl: p.bookingUrl || (typeof payload.bookingUrl === "string" ? payload.bookingUrl : null),
      qualifications: quals,
      areasOfCare: areas,
      professionalInterests: p.professionalInterests,
      languages: Array.isArray(payload.languages) ? payload.languages : [],
      bioLen: String(payload.biography || payload.bio || "").length,
      portraitPath: p.portraitPath,
      pagePath: p.page?.path || null,
      pageStatus: p.page?.status || null,
      importSource,
      publishedPayloadEmpty: p.publishedPayload == null,
    };
  });

  const out = path.resolve(__dirname, "../.tmp-phase1-cms-practitioners.json");
  fs.writeFileSync(out, JSON.stringify({ clinicId: clinic.id, clinicSlug: clinic.slug, rows }, null, 2));
  console.log(`wrote ${rows.length} CMS practitioners -> ${out}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
