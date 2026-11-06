import { NextResponse } from "next/server";
import { requireAction } from "@/cms/context";
import { getLibraryAsset } from "@/asset-library/registry";
import {
  createAssetConsent,
  linkAssetToConsent,
  linkAssetToStory,
  signAssetConsent,
} from "@/asset-library/consent";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { clinic } = await requireAction("edit");
  const { id } = await context.params;
  const asset = await getLibraryAsset(clinic.id, id);
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await request.json().catch(() => null);
  if (!body?.action) {
    return NextResponse.json({ error: "action required" }, { status: 400 });
  }

  try {
    switch (body.action) {
      case "create_consent": {
        const consent = await createAssetConsent({
          clinicId: clinic.id,
          consentVersion: String(body.consentVersion || "wmc-asset-consent-2026-11"),
          subjectDisplayName: String(body.subjectDisplayName || "Staff subject"),
          channelsAllowed: Array.isArray(body.channelsAllowed)
            ? body.channelsAllowed.map(String)
            : ["practice_experience_web"],
          relatedStoryId: body.relatedStoryId ? String(body.relatedStoryId) : undefined,
        });
        const linked = await linkAssetToConsent({
          clinicId: clinic.id,
          assetRowId: asset.id,
          consentId: consent.id,
        });
        return NextResponse.json({ consent, asset: linked }, { status: 201 });
      }
      case "sign_consent": {
        if (!body.consentId || !body.signedByName) {
          return NextResponse.json(
            { error: "consentId and signedByName required" },
            { status: 400 },
          );
        }
        const consent = await signAssetConsent({
          clinicId: clinic.id,
          consentId: String(body.consentId),
          signedByName: String(body.signedByName),
          documentUri: body.documentUri ? String(body.documentUri) : undefined,
          channelsAllowed: Array.isArray(body.channelsAllowed)
            ? body.channelsAllowed.map(String)
            : [],
        });
        return NextResponse.json({ consent });
      }
      case "link_story": {
        if (!body.storyId) {
          return NextResponse.json({ error: "storyId required" }, { status: 400 });
        }
        const linked = await linkAssetToStory({
          clinicId: clinic.id,
          assetRowId: asset.id,
          storyId: String(body.storyId),
        });
        return NextResponse.json({ asset: linked });
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Consent action failed" },
      { status: 400 },
    );
  }
}
