import { NextResponse } from "next/server";
import type { GpStoryReviewDecision, GpStoryReviewRole } from "@prisma/client";
import { requireAction } from "@/cms/context";
import { recordStoryReview } from "@/story-capture/reviews";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { clinic, user, role } = await requireAction("clinical_signoff");
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  if (!body?.decision || !body?.rationale) {
    return NextResponse.json({ error: "decision and rationale required" }, { status: 400 });
  }
  try {
    const result = await recordStoryReview({
      clinicId: clinic.id,
      storyId: id,
      decision: body.decision as GpStoryReviewDecision,
      reviewerId: user.id,
      reviewerName: user.name || user.email || user.id,
      reviewerRole: (body.reviewerRole as GpStoryReviewRole) || "practice_manager",
      rationale: String(body.rationale),
      versionId: body.versionId ? String(body.versionId) : undefined,
      checklistSnapshot: body.checklistSnapshot,
    });
    return NextResponse.json({ ...result, actorRole: role }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Review failed" },
      { status: 400 },
    );
  }
}
