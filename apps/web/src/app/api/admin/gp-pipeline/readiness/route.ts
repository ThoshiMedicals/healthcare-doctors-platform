import { NextResponse } from "next/server";
import { requireAction } from "@/cms/context";
import { recordDoctorReadiness } from "@/gp-pipeline/readiness";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const { clinic } = await requireAction("edit");
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
      answersJson: body.answersJson ?? {},
      themeScoresJson: body.themeScoresJson,
      enquiryId: body.enquiryId ? String(body.enquiryId) : undefined,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Readiness failed" },
      { status: 400 },
    );
  }
}
