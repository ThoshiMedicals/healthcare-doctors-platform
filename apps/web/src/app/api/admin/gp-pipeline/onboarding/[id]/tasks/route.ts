import { NextResponse } from "next/server";
import { requireAction } from "@/cms/context";
import { completeOnboardingTask } from "@/gp-pipeline/onboarding";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { clinic, user } = await requireAction("edit");
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  if (!body?.taskKey) {
    return NextResponse.json({ error: "taskKey required" }, { status: 400 });
  }
  try {
    const task = await completeOnboardingTask({
      clinicId: clinic.id,
      caseId: id,
      taskKey: String(body.taskKey),
      actorId: user.id,
      status: body.status,
      notes: body.notes ? String(body.notes) : undefined,
    });
    return NextResponse.json({ task });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Task update failed" },
      { status: 400 },
    );
  }
}
