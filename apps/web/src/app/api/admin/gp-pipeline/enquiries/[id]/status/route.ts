import { NextResponse } from "next/server";
import type { GpEnquiryStatus } from "@prisma/client";
import { requireAction } from "@/cms/context";
import { getEnquiry, updateEnquiryStatus } from "@/gp-pipeline/eoi";
import { createOnboardingCaseFromEnquiry } from "@/gp-pipeline/onboarding";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { clinic } = await requireAction("edit");
  const { id } = await context.params;
  const enquiry = await getEnquiry(clinic.id, id);
  if (!enquiry) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ enquiry });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { clinic, user } = await requireAction("edit");
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  if (!body?.status) {
    return NextResponse.json({ error: "status required" }, { status: 400 });
  }

  try {
    if (body.action === "open_onboarding") {
      const onboarding = await createOnboardingCaseFromEnquiry({
        clinicId: clinic.id,
        enquiryId: id,
        actorUserId: user.id,
      });
      return NextResponse.json({ onboarding }, { status: 201 });
    }

    const enquiry = await updateEnquiryStatus({
      clinicId: clinic.id,
      enquiryId: id,
      status: body.status as GpEnquiryStatus,
      actorUserId: user.id,
      actorName: user.name || user.email || user.id,
      note: body.note ? String(body.note) : undefined,
      humanConfirmation: Boolean(body.humanConfirmation),
    });
    return NextResponse.json({ enquiry });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Status update failed" },
      { status: 400 },
    );
  }
}
