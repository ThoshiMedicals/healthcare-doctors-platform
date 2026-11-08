import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { submitGpEoi } from "@/gp-pipeline/eoi";
import { canOperateRecruitmentPublicWorkflows } from "@/importer/recruitment-hold";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Public EOI submit — creates enquiry + notification.
 * Never auto-approves or auto-advances workflow gates.
 * Blocked while recruitment HOLD is active (RECRUITMENT_HOLD_LIFTED must be true).
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ clinicSlug: string }> },
) {
  if (!canOperateRecruitmentPublicWorkflows()) {
    return NextResponse.json(
      { error: "Recruitment workflows are on HOLD and are not accepting public submissions." },
      { status: 403 },
    );
  }

  const { clinicSlug } = await context.params;
  const clinic = await prisma.clinic.findUnique({
    where: { slug: clinicSlug },
    select: { id: true, status: true },
  });
  if (!clinic || (clinic.status !== "live" && clinic.status !== "draft")) {
    return NextResponse.json({ error: "Clinic not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.applicant?.name || !body?.applicant?.email) {
    return NextResponse.json(
      { error: "applicant.name and applicant.email required" },
      { status: 400 },
    );
  }

  try {
    const enquiry = await submitGpEoi({
      clinicId: clinic.id,
      applicant: body.applicant,
      credentials: body.credentials,
      preferences: body.preferences,
      source: body.source ?? "join_our_team_public_ev",
      readinessResultId: body.readinessResultId,
      raw: { ...body, publicEvSubmit: true, advisoryOnly: true },
    });
    return NextResponse.json(
      {
        enquiry: { id: enquiry.id, status: enquiry.status },
        notice:
          "Expression of interest received for human review. This is not an automated hire decision.",
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "EOI failed" },
      { status: 400 },
    );
  }
}
