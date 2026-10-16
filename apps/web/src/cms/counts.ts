import type { CmsCollectionKey } from "@/cms/collections";
import { prisma } from "@/db/prisma";
import { canAccessClinic } from "@/auth/permissions";

async function clinicIdsForUser(userId: string): Promise<string[] | "all"> {
  const memberships = await prisma.clinicMembership.findMany({
    where: { userId },
    select: { clinicId: true, role: true },
  });
  if (memberships.some((membership) => membership.role === "network_admin")) return "all";
  return memberships.filter((membership) => canAccessClinic(memberships, membership.clinicId)).map((membership) => membership.clinicId);
}

export async function countCollection(key: CmsCollectionKey, userId: string): Promise<number> {
  const scope = await clinicIdsForUser(userId);
  const where = scope === "all" ? {} : { clinicId: { in: scope } };

  switch (key) {
    case "pages":
      return prisma.page.count({ where });
    case "practitioners":
      return prisma.practitioner.count({ where });
    case "services":
      return prisma.service.count({ where });
    case "knowledge":
      return prisma.knowledgeArticle.count({ where });
    case "updates":
      return prisma.practiceUpdate.count({ where });
    case "faqs":
      return prisma.faq.count({ where });
    case "practice-pages":
      return prisma.practicePage.count({ where });
    case "media":
      return prisma.mediaAsset.count({ where });
    case "navigation":
      return prisma.navigationItem.count({ where });
    case "governance":
      return prisma.clinicalReview.count({ where });
    case "editorial":
      return prisma.editorialItem.count({ where });
    case "network": {
      if (scope === "all") return prisma.networkLocation.count();
      const clinics = await prisma.clinic.findMany({
        where: { id: { in: scope } },
        select: { networkId: true },
      });
      const networkIds = [...new Set(clinics.map((clinic) => clinic.networkId))];
      return prisma.networkLocation.count({ where: { networkId: { in: networkIds } } });
    }
    default:
      return 0;
  }
}
