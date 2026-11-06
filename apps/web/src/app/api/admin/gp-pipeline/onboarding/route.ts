import { NextResponse } from "next/server";
import { requireAction } from "@/cms/context";
import { createOnboardingCaseFromEnquiry } from "@/gp-pipeline/onboarding";
import { prisma } from "@/db/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const { clinic } = await requireAction("edit");
  const cases = await prisma.gpOnboardingCase.findMany({
    where: { clinicId: clinic.id },
    orderBy: { updatedAt: "desc" },
    include: {
      stages: true,
      first90Case: { select: { id: true, status: true, currentPhase: true } },
      enquiry: { select: { id: true, status: true, email: true } },
    },
  });
  return NextResponse.json({ cases });
}

export async function POST(request: Request) {
  const { clinic, user } = await requireAction("edit");
  const body = await request.json().catch(() => null);
  if (!body?.enquiryId) {
    return NextResponse.json({ error: "enquiryId required" }, { status: 400 });
  }
  try {
    const onboarding = await createOnboardingCaseFromEnquiry({
      clinicId: clinic.id,
      enquiryId: String(body.enquiryId),
      actorUserId: user.id,
    });
    return NextResponse.json({ onboarding }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Onboarding create failed" },
      { status: 400 },
    );
  }
}
