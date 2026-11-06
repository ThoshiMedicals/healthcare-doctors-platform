import { prisma } from "@/db/prisma";
import {
  createAttractionDocument,
  createAttractionRevision,
  listAttractionDocuments,
} from "./documents";
import { PUBLISH_READY_SPECS } from "./content";

/**
 * Populate / refresh Attraction CMS with publish-ready synthetic content packs.
 * Creates missing documents; updates existing drafts via a new immutable revision.
 */
export async function seedAttractionPublishReadyContent(clinicId: string, authorId?: string) {
  const existing = await listAttractionDocuments(clinicId);
  const byKey = new Map(existing.map((d) => [`${d.kind}:${d.slug}`, d]));

  const created: string[] = [];
  const updated: string[] = [];

  for (const spec of PUBLISH_READY_SPECS) {
    const key = `${spec.kind}:${spec.slug}`;
    const row = byKey.get(key);

    if (!row) {
      const result = await createAttractionDocument({
        clinicId,
        kind: spec.kind,
        slug: spec.slug,
        title: spec.title,
        summary: spec.summary,
        surfacePath: spec.surfacePath,
        draftBody: spec.draftBody,
        storyCaptureRef: spec.storyCaptureRef,
        authorId,
      });
      created.push(`${key}:${result.document.id}`);
      continue;
    }

    await createAttractionRevision({
      documentId: row.id,
      clinicId,
      body: spec.draftBody,
      authorId,
      note: "Publish-ready synthetic content refresh",
    });

    await prisma.attractionDocument.update({
      where: { id: row.id },
      data: {
        title: spec.title,
        summary: spec.summary,
        surfacePath: spec.surfacePath ?? null,
      },
    });

    updated.push(`${key}:${row.id}`);
  }

  return {
    createdCount: created.length,
    updatedCount: updated.length,
    created,
    updated,
    packs: PUBLISH_READY_SPECS.map((s) => ({ kind: s.kind, slug: s.slug, title: s.title })),
  };
}
