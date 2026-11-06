import { NextResponse } from "next/server";
import type { GpOnboardingGateDecision, GpOnboardingStageId } from "@prisma/client";
import { requireAction } from "@/cms/context";
import { getOnboardingCase, recordOnboardingGate } from "@/gp-pipeline/onboarding";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { clinic } = await requireAction("edit");
  const { id } = await context.params;
  const onboarding = await getOnboardingCase(clinic.id, id);
  if (!onboarding) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ onboarding });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { clinic, user } = await requireAction("edit");
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  if (!body?.stageId || !body?.decision || !body?.rationale) {
    return NextResponse.json(
      { error: "stageId, decision, rationale required" },
      { status: 400 },
    );
  }
  try {
    const result = await recordOnboardingGate({
      clinicId: clinic.id,
      caseId: id,
      stageId: body.stageId as GpOnboardingStageId,
      decision: body.decision as GpOnboardingGateDecision,
      reviewerId: user.id,
      reviewerName: user.name || user.email || user.id,
      rationale: String(body.rationale),
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Gate failed" },
      { status: 400 },
    );
  }
}
