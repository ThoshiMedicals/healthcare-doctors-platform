import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { recordDoctorReadiness } from "@/gp-pipeline/readiness";
import { canOperateRecruitmentPublicWorkflows } from "@/importer/recruitment-hold";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Public advisory readiness save — creates a record + notification.
 * Never auto-approves hiring or advances onboarding gates.
 * Blocked while recruitment HOLD is active.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ clinicSlug: string }> },
) {
  if (!canOperateRecruitmentPublicWorkflows()) {
    return NextResponse.json(
      { error: "Recruitment workflows are on HOLD and are not accepting public readiness submissions." },
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
  if (!body || typeof body.totalScore !== "number") {
    return NextResponse.json({ error: "totalScore required" }, { status: 400 });
  }

  try {
    const result = await recordDoctorReadiness({
      clinicId: clinic.id,
      applicantName: body.applicantName ? String(body.applicantName) : undefined,
      applicantEmail: body.applicantEmail ? String(body.applicantEmail) : undefined,
      totalScore: Number(body.totalScore),
      answersJson: {
        ...(body.answersJson && typeof body.answersJson === "object" ? body.answersJson : {}),
        publicEvSubmit: true,
        advisoryOnly: true,
      },
      themeScoresJson: body.themeScoresJson,
      enquiryId: body.enquiryId ? String(body.enquiryId) : undefined,
    });
    return NextResponse.json(
      {
        ...result,
        notice: "Advisory only — not a hire decision. Humans review pipeline records.",
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Readiness failed" },
      { status: 400 },
    );
  }
}
