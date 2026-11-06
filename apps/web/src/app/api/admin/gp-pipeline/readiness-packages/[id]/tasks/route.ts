import { NextResponse } from "next/server";
import type { GpReadinessPackageTaskStatus } from "@prisma/client";
import { requireAction } from "@/cms/context";
import {
  createRecruitmentPackageTask,
  updateRecruitmentPackageTask,
} from "@/gp-pipeline/recruitment-ops";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { clinic, user } = await requireAction("edit");
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  if (!body?.title) {
    return NextResponse.json({ error: "title required" }, { status: 400 });
  }

  try {
    const task = await createRecruitmentPackageTask({
      clinicId: clinic.id,
      packageId: id,
      title: String(body.title),
      taskKey: body.taskKey ? String(body.taskKey) : null,
      assignedToUserId: body.assignedToUserId ? String(body.assignedToUserId) : null,
      createdByUserId: user.id,
      dueAt: body.dueAt ? new Date(String(body.dueAt)) : null,
      notes: body.notes ? String(body.notes) : null,
    });
    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create task" },
      { status: 400 },
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { clinic } = await requireAction("edit");
  void context;
  const body = await request.json().catch(() => null);
  if (!body?.taskId) {
    return NextResponse.json({ error: "taskId required" }, { status: 400 });
  }

  try {
    const task = await updateRecruitmentPackageTask({
      clinicId: clinic.id,
      taskId: String(body.taskId),
      status: body.status ? (String(body.status) as GpReadinessPackageTaskStatus) : undefined,
      assignedToUserId:
        body.assignedToUserId === null
          ? null
          : body.assignedToUserId != null
            ? String(body.assignedToUserId)
            : undefined,
      dueAt:
        body.dueAt === null ? null : body.dueAt != null ? new Date(String(body.dueAt)) : undefined,
      notes: body.notes === null ? null : body.notes != null ? String(body.notes) : undefined,
      title: body.title != null ? String(body.title) : undefined,
    });
    return NextResponse.json({ task });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update task" },
      { status: 400 },
    );
  }
}
