import { prisma } from "@/db/prisma";
import { mustNoIndexRecruitmentPath } from "@/importer/recruitment-hold";
import { isSeoConsolidatedSourcePath } from "@/seo/launch-refinements";

export async function listIndexableUrls(clinicId: string, canonicalBaseUrl: string): Promise<string[]> {
  const pages = await prisma.page.findMany({
    where: { clinicId, status: "published", indexable: true },
    select: { path: true },
    orderBy: { path: "asc" },
  });

  const base = canonicalBaseUrl.replace(/\/$/, "");
  return pages
    .filter((page) => !mustNoIndexRecruitmentPath(page.path))
    .filter((page) => !isSeoConsolidatedSourcePath(page.path))
    .map((page) => (page.path === "/" ? `${base}/` : `${base}/${page.path}`));
}
