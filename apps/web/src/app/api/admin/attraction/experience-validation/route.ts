import { NextResponse } from "next/server";
import { requireAction } from "@/cms/context";
import { promoteAttractionExperienceValidation } from "@/attraction-cms/experience-validation";
import { seedAttractionAssetPlaceholders } from "@/asset-library/seed-placeholders";
import { seedCompositeStoriesForEv } from "@/story-capture/seed-composite-ev";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Experience Validation promote — writes UAT PageRevisions only.
 * Does not publish AttractionDocuments / does not call production publish.
 */
export async function POST(request: Request) {
  const { clinic, user } = await requireAction("edit");
  const body = await request.json().catch(() => ({}));
  const seed = body?.seed !== false;

  try {
    if (seed) {
      await seedAttractionAssetPlaceholders(clinic.id, user.id);
      await seedCompositeStoriesForEv(clinic.id, user.id);
    }

    const result = await promoteAttractionExperienceValidation({
      clinicId: clinic.id,
      clinicSlug: clinic.slug,
      authorId: user.id,
      seedPacks: seed,
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "EV promote failed" },
      { status: 400 },
    );
  }
}
