import { NextResponse } from "next/server";
import type { AttractionAssetKind, AttractionAssetStatus } from "@prisma/client";
import { requireAction } from "@/cms/context";
import { listLibraryAssets, upsertLibraryAsset } from "@/asset-library/registry";
import { seedAttractionAssetPlaceholders } from "@/asset-library/seed-placeholders";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const { clinic } = await requireAction("edit");
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind") as AttractionAssetKind | null;
  const status = url.searchParams.get("status") as AttractionAssetStatus | null;
  const assets = await listLibraryAssets(clinic.id, {
    kind: kind || undefined,
    status: status || undefined,
  });
  return NextResponse.json({ assets });
}

export async function POST(request: Request) {
  const { clinic, user } = await requireAction("edit");
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  if (body.action === "seed_placeholders") {
    const result = await seedAttractionAssetPlaceholders(clinic.id, user.id);
    return NextResponse.json(result);
  }

  if (!body.assetId || !body.kind) {
    return NextResponse.json({ error: "assetId and kind required" }, { status: 400 });
  }

  try {
    const asset = await upsertLibraryAsset({
      clinicId: clinic.id,
      assetId: String(body.assetId),
      kind: body.kind as AttractionAssetKind,
      status: body.status as AttractionAssetStatus | undefined,
      title: body.title ? String(body.title) : undefined,
      storagePath: body.storagePath != null ? String(body.storagePath) : undefined,
      replaceablePath: body.replaceablePath != null ? String(body.replaceablePath) : undefined,
      placeholderKind: body.placeholderKind != null ? String(body.placeholderKind) : undefined,
      mime: body.mime != null ? String(body.mime) : undefined,
      altText: body.altText ? String(body.altText) : undefined,
      caption: body.caption ? String(body.caption) : undefined,
      quoteText: body.quoteText != null ? String(body.quoteText) : undefined,
      scene: body.scene != null ? String(body.scene) : undefined,
      surfaceHints: Array.isArray(body.surfaceHints) ? body.surfaceHints.map(String) : undefined,
      moduleHints: Array.isArray(body.moduleHints) ? body.moduleHints.map(String) : undefined,
      personaHints: Array.isArray(body.personaHints) ? body.personaHints.map(String) : undefined,
      taxonomyTags: Array.isArray(body.taxonomyTags) ? body.taxonomyTags.map(String) : undefined,
      rightsClass: body.rightsClass,
      aiPolicy: body.aiPolicy ? String(body.aiPolicy) : undefined,
      sourceShotId: body.sourceShotId != null ? String(body.sourceShotId) : undefined,
      relatedStoryId: body.relatedStoryId != null ? String(body.relatedStoryId) : undefined,
      relatedStoryRef: body.relatedStoryRef != null ? String(body.relatedStoryRef) : undefined,
      consentRecordId: body.consentRecordId != null ? String(body.consentRecordId) : undefined,
      transcriptOfAssetId:
        body.transcriptOfAssetId != null ? String(body.transcriptOfAssetId) : undefined,
      relatedDocumentKind:
        body.relatedDocumentKind != null ? String(body.relatedDocumentKind) : undefined,
      ownerUserId: user.id,
    });
    return NextResponse.json({ asset }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Asset upsert failed" },
      { status: 400 },
    );
  }
}
