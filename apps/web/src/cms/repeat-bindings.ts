import { repeatFromPayload, type RepeatBinding } from "@/cms/overlay";
import { prisma } from "@/db/prisma";
import {
  getCachedPublishedRepeats,
  setCachedPublishedRepeats,
} from "@/documents/public-html-cache";
import { Prisma } from "@prisma/client";

/** Published titles and summaries that already appear on another card, hub, or index. */
export async function publishedRepeats(clinicId: string): Promise<RepeatBinding[]> {
  const cached = getCachedPublishedRepeats<RepeatBinding[]>(clinicId);
  if (cached) return cached;

  const where = { clinicId, publishedPayload: { not: Prisma.DbNull } } as const;
  const [services, articles, updates, topics, pages] = await Promise.all([
    prisma.service.findMany({ where, select: { publishedPayload: true, page: { select: { path: true } } } }),
    prisma.knowledgeArticle.findMany({ where, select: { publishedPayload: true, page: { select: { path: true } } } }),
    prisma.practiceUpdate.findMany({ where, select: { publishedPayload: true, page: { select: { path: true } } } }),
    prisma.knowledgeTopic.findMany({ where, select: { publishedPayload: true, page: { select: { path: true } } } }),
    prisma.practicePage.findMany({ where, select: { publishedPayload: true, page: { select: { path: true } } } }),
  ]);
  const bindings = [...services, ...articles, ...updates, ...topics, ...pages].flatMap((row) => {
    const binding = repeatFromPayload(row.publishedPayload, row.page?.path ?? "");
    return binding ? [binding] : [];
  });
  setCachedPublishedRepeats(clinicId, bindings);
  return bindings;
}
