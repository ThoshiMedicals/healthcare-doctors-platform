import { NextResponse } from "next/server";
import type { AttractionAssetReviewDecision } from "@prisma/client";
import { requireAction } from "@/cms/context";
import { getLibraryAsset } from "@/asset-library/registry";
import { recordAssetReview } from "@/asset-library/reviews";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { clinic, user } = await requireAction("clinical_signoff");
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  if (!body?.decision || !body?.rationale) {
    return NextResponse.json({ error: "decision and rationale required" }, { status: 400 });
  }
  const asset = await getLibraryAsset(clinic.id, id);
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const result = await recordAssetReview({
      clinicId: clinic.id,
      assetRowId: asset.id,
      decision: body.decision as AttractionAssetReviewDecision,
      reviewerId: user.id,
      reviewerName: user.name || user.email || user.id,
      rationale: String(body.rationale),
      checklistJson: body.checklistJson,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Review failed" },
      { status: 400 },
    );
  }
}
