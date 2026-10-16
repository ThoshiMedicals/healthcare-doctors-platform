import { prisma } from "@/db/prisma";

export async function listIndexableUrls(clinicId: string, canonicalBaseUrl: string): Promise<string[]> {
  const pages = await prisma.page.findMany({
    where: { clinicId, status: "published", indexable: true },
    select: { path: true },
    orderBy: { path: "asc" },
  });

  const base = canonicalBaseUrl.replace(/\/$/, "");
  return pages.map((page) => (page.path === "/" ? `${base}/` : `${base}/${page.path}`));
}
