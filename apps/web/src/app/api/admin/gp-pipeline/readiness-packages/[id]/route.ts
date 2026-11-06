import { NextResponse } from "next/server";
import type { GpRecruitmentSource } from "@prisma/client";
import { requireAction } from "@/cms/context";
import {
  getRecruitmentPackage,
  isGpRecruitmentSource,
  packageProfileCompleteness,
  updateRecruitmentPackageMeta,
} from "@/gp-pipeline/recruitment-ops";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { clinic } = await requireAction("edit");
  const { id } = await context.params;
  const readinessPackage = await getRecruitmentPackage(clinic.id, id);
  if (!readinessPackage) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const completeness = packageProfileCompleteness(readinessPackage);
  return NextResponse.json({ package: readinessPackage, completeness });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { clinic } = await requireAction("edit");
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "JSON body required" }, { status: 400 });
  }

  try {
    let recruitmentSource: GpRecruitmentSource | null | undefined = undefined;
    if (body.recruitmentSource === null) recruitmentSource = null;
    else if (typeof body.recruitmentSource === "string") {
      if (!isGpRecruitmentSource(body.recruitmentSource)) {
        return NextResponse.json({ error: "Invalid recruitmentSource" }, { status: 400 });
      }
      recruitmentSource = body.recruitmentSource;
    }

    const updated = await updateRecruitmentPackageMeta({
      clinicId: clinic.id,
      packageId: id,
      recruitmentSource,
    });
    return NextResponse.json({ package: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update failed" },
      { status: 400 },
    );
  }
}
