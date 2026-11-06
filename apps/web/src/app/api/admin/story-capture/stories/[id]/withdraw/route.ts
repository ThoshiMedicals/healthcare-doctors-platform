import { NextResponse } from "next/server";
import { requireAction } from "@/cms/context";
import { withdrawStory } from "@/story-capture/withdrawal";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { clinic, user } = await requireAction("clinical_signoff");
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  if (!body?.reason) {
    return NextResponse.json({ error: "reason required" }, { status: 400 });
  }
  try {
    const result = await withdrawStory({
      clinicId: clinic.id,
      storyId: id,
      reviewerId: user.id,
      reviewerName: user.name || user.email || user.id,
      reason: String(body.reason),
      consentId: body.consentId ? String(body.consentId) : undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Withdrawal failed" },
      { status: 400 },
    );
  }
}
