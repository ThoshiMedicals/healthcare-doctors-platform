import { prisma } from "@/db/prisma";

const ABOUT_PATHS = ["medical-centre-network.html", "agpal-accreditation.html"];
const PATIENT_PATHS = ["faqs.html"];

export async function ensurePracticePages(clinicId: string, sectionKey: "about" | "patient-info") {
  const extraPaths = sectionKey === "about" ? ABOUT_PATHS : PATIENT_PATHS;
  const pages = await prisma.page.findMany({
    where: {
      clinicId,
      OR: [{ navigationOwnership: { sectionKey } }, { path: { in: extraPaths } }],
    },
    include: { practicePage: true },
  });
  for (const page of pages) {
    if (page.practicePage || page.template === "team_hub") continue;
    const slug = page.path.replace(/\.html$/, "").split("/").pop() ?? page.path;
    await prisma.practicePage.upsert({
      where: { clinicId_slug: { clinicId, slug } },
      create: {
        clinicId,
        pageId: page.id,
        slug,
        title: page.title,
        summary: page.description ?? "",
        status: "published",
      },
      update: { pageId: page.id },
    });
  }
  return prisma.practicePage.findMany({
    where: {
      clinicId,
      page: { OR: [{ navigationOwnership: { sectionKey } }, { path: { in: extraPaths } }] },
    },
    orderBy: { title: "asc" },
    include: { page: { select: { path: true } } },
  });
}
