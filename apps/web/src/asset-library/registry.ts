import type {
  AttractionAssetKind,
  AttractionAssetRightsClass,
  AttractionAssetStatus,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/db/prisma";
import { cadenceDaysForKind } from "./lifecycle";
import { taxonomyTag } from "./taxonomy";

export type UpsertLibraryAssetInput = {
  clinicId: string;
  assetId: string;
  kind: AttractionAssetKind;
  title?: string;
  status?: AttractionAssetStatus;
  storagePath?: string | null;
  replaceablePath?: string | null;
  placeholderKind?: string | null;
  mime?: string | null;
  width?: number | null;
  height?: number | null;
  durationSec?: number | null;
  contentSha256?: string | null;
  altText?: string;
  caption?: string;
  quoteText?: string | null;
  derivativesJson?: Prisma.InputJsonValue;
  scene?: string | null;
  surfaceHints?: string[];
  moduleHints?: string[];
  personaHints?: string[];
  taxonomyTags?: string[];
  rightsClass?: AttractionAssetRightsClass;
  aiPolicy?: string;
  sourceShotId?: string | null;
  relatedDocumentKind?: string | null;
  relatedStoryId?: string | null;
  relatedStoryRef?: string | null;
  consentRecordId?: string | null;
  consentRef?: string | null;
  transcriptOfAssetId?: string | null;
  parentAssetId?: string | null;
  channelsAllowed?: string[];
  channelsDenied?: string[];
  ownerUserId?: string | null;
};

export async function listLibraryAssets(
  clinicId: string,
  filters?: { kind?: AttractionAssetKind; status?: AttractionAssetStatus },
) {
  return prisma.attractionAsset.findMany({
    where: {
      clinicId,
      ...(filters?.kind ? { kind: filters.kind } : {}),
      ...(filters?.status ? { status: filters.status } : {}),
    },
    orderBy: [{ kind: "asc" }, { assetId: "asc" }],
    include: {
      consentRecord: true,
      relatedStory: { select: { id: true, workingTitle: true, status: true } },
      _count: { select: { reviewEvents: true } },
    },
  });
}

export async function getLibraryAsset(clinicId: string, idOrAssetId: string) {
  return prisma.attractionAsset.findFirst({
    where: {
      clinicId,
      OR: [{ id: idOrAssetId }, { assetId: idOrAssetId }],
    },
    include: {
      consentRecord: true,
      relatedStory: true,
      reviewEvents: { orderBy: { createdAt: "desc" }, take: 30 },
    },
  });
}

export async function upsertLibraryAsset(input: UpsertLibraryAssetInput) {
  const tags = new Set(input.taxonomyTags ?? []);
  if (input.scene) tags.add(taxonomyTag("scene", input.scene));
  for (const s of input.surfaceHints ?? []) tags.add(taxonomyTag("surface", s));
  for (const m of input.moduleHints ?? []) tags.add(taxonomyTag("module", m));
  for (const p of input.personaHints ?? []) tags.add(taxonomyTag("persona", p));
  if (input.aiPolicy) tags.add(taxonomyTag("ai", input.aiPolicy));

  const reviewCadenceDays = cadenceDaysForKind(input.kind);

  return prisma.attractionAsset.upsert({
    where: {
      clinicId_assetId: { clinicId: input.clinicId, assetId: input.assetId },
    },
    create: {
      clinicId: input.clinicId,
      assetId: input.assetId,
      kind: input.kind,
      status: input.status ?? "catalogued",
      title: input.title ?? input.assetId,
      storagePath: input.storagePath,
      replaceablePath: input.replaceablePath,
      placeholderKind: input.placeholderKind ?? "ai",
      mime: input.mime,
      width: input.width ?? undefined,
      height: input.height ?? undefined,
      durationSec: input.durationSec ?? undefined,
      contentSha256: input.contentSha256,
      altText: input.altText ?? "",
      caption: input.caption ?? "",
      quoteText: input.quoteText,
      derivativesJson: input.derivativesJson,
      scene: input.scene,
      surfaceHints: input.surfaceHints ?? [],
      moduleHints: input.moduleHints ?? [],
      personaHints: input.personaHints ?? [],
      taxonomyTags: [...tags],
      rightsClass: input.rightsClass ?? "ai_placeholder",
      aiPolicy: input.aiPolicy ?? "ai_ok",
      sourceShotId: input.sourceShotId,
      relatedDocumentKind: input.relatedDocumentKind,
      relatedStoryId: input.relatedStoryId,
      relatedStoryRef: input.relatedStoryRef,
      consentRecordId: input.consentRecordId,
      consentRef: input.consentRef,
      transcriptOfAssetId: input.transcriptOfAssetId,
      parentAssetId: input.parentAssetId,
      channelsAllowedJson: input.channelsAllowed ?? [],
      channelsDeniedJson: input.channelsDenied ?? [
        "job_boards",
        "recruitment_agencies",
      ],
      reviewCadenceDays,
      ownerUserId: input.ownerUserId,
    },
    update: {
      kind: input.kind,
      status: input.status,
      title: input.title,
      storagePath: input.storagePath === undefined ? undefined : input.storagePath,
      replaceablePath: input.replaceablePath === undefined ? undefined : input.replaceablePath,
      placeholderKind: input.placeholderKind === undefined ? undefined : input.placeholderKind,
      mime: input.mime === undefined ? undefined : input.mime,
      width: input.width === undefined ? undefined : input.width,
      height: input.height === undefined ? undefined : input.height,
      durationSec: input.durationSec === undefined ? undefined : input.durationSec,
      contentSha256: input.contentSha256 === undefined ? undefined : input.contentSha256,
      altText: input.altText,
      caption: input.caption,
      quoteText: input.quoteText === undefined ? undefined : input.quoteText,
      derivativesJson: input.derivativesJson,
      scene: input.scene === undefined ? undefined : input.scene,
      surfaceHints: input.surfaceHints,
      moduleHints: input.moduleHints,
      personaHints: input.personaHints,
      taxonomyTags: [...tags],
      rightsClass: input.rightsClass,
      aiPolicy: input.aiPolicy,
      sourceShotId: input.sourceShotId === undefined ? undefined : input.sourceShotId,
      relatedDocumentKind:
        input.relatedDocumentKind === undefined ? undefined : input.relatedDocumentKind,
      relatedStoryId: input.relatedStoryId === undefined ? undefined : input.relatedStoryId,
      relatedStoryRef: input.relatedStoryRef === undefined ? undefined : input.relatedStoryRef,
      consentRecordId: input.consentRecordId === undefined ? undefined : input.consentRecordId,
      consentRef: input.consentRef === undefined ? undefined : input.consentRef,
      transcriptOfAssetId:
        input.transcriptOfAssetId === undefined ? undefined : input.transcriptOfAssetId,
      parentAssetId: input.parentAssetId === undefined ? undefined : input.parentAssetId,
      channelsAllowedJson: input.channelsAllowed,
      channelsDeniedJson: input.channelsDenied,
      reviewCadenceDays,
      ownerUserId: input.ownerUserId === undefined ? undefined : input.ownerUserId,
    },
  });
}

/** Swap AI placeholder for a real master without changing assetId. */
export async function replacePlaceholderAsset(input: {
  clinicId: string;
  assetId: string;
  newStoragePath: string;
  replaceablePath?: string;
  contentSha256?: string;
  rightsClass?: AttractionAssetRightsClass;
  mime?: string;
}) {
  const existing = await prisma.attractionAsset.findUnique({
    where: { clinicId_assetId: { clinicId: input.clinicId, assetId: input.assetId } },
  });
  if (!existing) throw new Error("Asset not found");

  return prisma.attractionAsset.update({
    where: { id: existing.id },
    data: {
      storagePath: input.newStoragePath,
      replaceablePath: input.replaceablePath ?? existing.replaceablePath,
      placeholderKind: "none",
      contentSha256: input.contentSha256,
      rightsClass: input.rightsClass ?? "no_people",
      mime: input.mime ?? existing.mime,
      status: "catalogued",
      aiPolicy: existing.aiPolicy === "ai_ban" ? "ai_ban" : "photo_only",
    },
  });
}
