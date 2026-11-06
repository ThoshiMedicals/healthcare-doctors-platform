import { NextResponse } from "next/server";
import type { GpDoctorProfileStatus } from "@prisma/client";
import { requireAction } from "@/cms/context";
import {
  isGpDoctorProfileStatus,
  publishDoctorProfileToPractitioner,
  transitionDoctorProfileStatus,
} from "@/gp-pipeline/doctor-profile";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { clinic, user } = await requireAction("edit");
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  if (!body?.status && body?.action !== "publish") {
    return NextResponse.json({ error: "status or action=publish required" }, { status: 400 });
  }

  try {
    if (body.action === "publish") {
      const result = await publishDoctorProfileToPractitioner({
        clinicId: clinic.id,
        profileId: id,
        actorUserId: user.id,
        actorName: user.name || user.email || user.id,
      });
      return NextResponse.json(result);
    }

    const status = String(body.status || "");
    if (!isGpDoctorProfileStatus(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const profile = await transitionDoctorProfileStatus({
      clinicId: clinic.id,
      profileId: id,
      toStatus: status as GpDoctorProfileStatus,
      actorUserId: user.id,
      actorName: user.name || user.email || user.id,
      note: body.note ? String(body.note) : undefined,
    });
    return NextResponse.json({ profile });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Status update failed" },
      { status: 400 },
    );
  }
}
