import type { ContentCollection, PageTemplate, Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { fingerprintContent } from "@/governance/fingerprint";

export type PromoteEvPageInput = {
  clinicId: string;
  path: string;
  title: string;
  description: string;
  html: string;
  breadcrumb: string[];
  sectionKey: "about" | "join-team";
  body?: Prisma.InputJsonValue;
  collection?: ContentCollection;
  template?: PageTemplate;
};

/**
 * Upsert Page + immutable PageRevision for Experience Validation.
 * Does not touch AttractionDocument publishState.
 */
export async function promoteEvPageRevision(input: PromoteEvPageInput) {
  const contentSha256 = fingerprintContent(input.html);
  const page = await prisma.page.upsert({
    where: { clinicId_path: { clinicId: input.clinicId, path: input.path } },
    create: {
      clinicId: input.clinicId,
      path: input.path,
      template: input.template ?? "practice_page",
      collection: input.collection ?? "practice_information",
      indexable: false,
      title: input.title,
      description: input.description,
      canonicalPath: input.path,
      robots: "noindex,nofollow",
      breadcrumb: input.breadcrumb,
      status: "published",
    },
    update: {
      title: input.title,
      description: input.description,
      canonicalPath: input.path,
      robots: "noindex,nofollow",
      breadcrumb: input.breadcrumb,
      status: "published",
      collection: input.collection ?? "practice_information",
    },
  });

  const existing = await prisma.pageRevision.findFirst({
    where: { pageId: page.id, contentSha256, immutable: true },
  });
  const revision =
    existing ??
    (await prisma.pageRevision.create({
      data: {
        pageId: page.id,
        html: input.html,
        body: input.body ?? {
          source: "attraction-experience-validation",
          path: input.path,
        },
        contentSha256,
        immutable: true,
      },
    }));

  if (page.publishedRevisionId !== revision.id) {
    await prisma.page.update({
      where: { id: page.id },
      data: { publishedRevisionId: revision.id, status: "published" },
    });
  }

  await prisma.navigationOwnership.upsert({
    where: { pageId: page.id },
    create: {
      pageId: page.id,
      sectionKey: input.sectionKey,
      isHub: input.path === "join-our-team.html",
      breadcrumb: input.breadcrumb,
    },
    update: {
      sectionKey: input.sectionKey,
      isHub: input.path === "join-our-team.html",
      breadcrumb: input.breadcrumb,
    },
  });

  return { pageId: page.id, revisionId: revision.id, contentSha256, path: input.path };
}
