import { NextResponse } from "next/server";
import { requireAction } from "@/cms/context";
import { getLibraryAsset, replacePlaceholderAsset } from "@/asset-library/registry";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { clinic } = await requireAction("edit");
  const { id } = await context.params;
  const asset = await getLibraryAsset(clinic.id, id);
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ asset });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { clinic } = await requireAction("edit");
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  if (body?.action !== "replace_placeholder" || !body.newStoragePath) {
    return NextResponse.json(
      { error: "action=replace_placeholder and newStoragePath required" },
      { status: 400 },
    );
  }
  const existing = await getLibraryAsset(clinic.id, id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    const asset = await replacePlaceholderAsset({
      clinicId: clinic.id,
      assetId: existing.assetId,
      newStoragePath: String(body.newStoragePath),
      replaceablePath: body.replaceablePath ? String(body.replaceablePath) : undefined,
      contentSha256: body.contentSha256 ? String(body.contentSha256) : undefined,
      rightsClass: body.rightsClass,
      mime: body.mime ? String(body.mime) : undefined,
    });
    return NextResponse.json({ asset });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Replace failed" },
      { status: 400 },
    );
  }
}
