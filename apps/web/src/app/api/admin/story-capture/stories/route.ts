import { NextResponse } from "next/server";
import type { GpStoryCategory, GpStoryStatus } from "@prisma/client";
import { requireAction } from "@/cms/context";
import { createStory, listStories } from "@/story-capture/stories";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const { clinic } = await requireAction("edit");
  const status = new URL(request.url).searchParams.get("status") as GpStoryStatus | null;
  const stories = await listStories(clinic.id, status || undefined);
  return NextResponse.json({ stories });
}

export async function POST(request: Request) {
  const { clinic, user } = await requireAction("edit");
  const body = await request.json().catch(() => null);
  if (!body?.workingTitle || !body?.subjectDisplayName || !body?.primaryCategory) {
    return NextResponse.json(
      { error: "workingTitle, subjectDisplayName, primaryCategory required" },
      { status: 400 },
    );
  }
  try {
    const story = await createStory({
      clinicId: clinic.id,
      workingTitle: String(body.workingTitle),
      subjectDisplayName: String(body.subjectDisplayName),
      subjectEmail: body.subjectEmail ? String(body.subjectEmail) : undefined,
      primaryCategory: body.primaryCategory as GpStoryCategory,
      secondaryCategories: Array.isArray(body.secondaryCategories)
        ? body.secondaryCategories
        : undefined,
      specialInterestLabel: body.specialInterestLabel
        ? String(body.specialInterestLabel)
        : undefined,
      practitionerId: body.practitionerId ? String(body.practitionerId) : undefined,
      careerApplicationId: body.careerApplicationId
        ? String(body.careerApplicationId)
        : undefined,
      createdByUserId: user.id,
      internalNotes: body.internalNotes ? String(body.internalNotes) : undefined,
    });
    return NextResponse.json({ story }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Create failed" },
      { status: 400 },
    );
  }
}
