import { NextResponse } from "next/server";
import type { GpReadinessPackageStatus } from "@prisma/client";
import { requireAction } from "@/cms/context";
import {
  isGpReadinessPackageStatus,
  transitionRecruitmentPackageStatus,
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
  if (!body?.status || !isGpReadinessPackageStatus(String(body.status))) {
    return NextResponse.json({ error: "Valid status required" }, { status: 400 });
  }

  try {
    const readinessPackage = await transitionRecruitmentPackageStatus({
      clinicId: clinic.id,
      packageId: id,
      toStatus: body.status as GpReadinessPackageStatus,
      actorUserId: user.id,
      actorName: user.name || user.email || user.id,
      note: body.note ? String(body.note) : undefined,
    });
    return NextResponse.json({ package: readinessPackage });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Status update failed" },
      { status: 400 },
    );
  }
}
