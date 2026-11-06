import { NextResponse } from "next/server";
import { requireAction } from "@/cms/context";
import { listEnquiries, submitGpEoi } from "@/gp-pipeline/eoi";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const { clinic } = await requireAction("edit");
  const enquiries = await listEnquiries(clinic.id);
  return NextResponse.json({
    enquiries,
    notice: "Priority score orders human review only — not an automated hire decision.",
  });
}

export async function POST(request: Request) {
  const { clinic } = await requireAction("edit");
  const body = await request.json().catch(() => null);
  if (!body?.applicant?.name || !body?.applicant?.email) {
    return NextResponse.json({ error: "applicant.name and applicant.email required" }, { status: 400 });
  }
  try {
    const enquiry = await submitGpEoi({
      clinicId: clinic.id,
      applicant: body.applicant,
      credentials: body.credentials,
      preferences: body.preferences,
      source: body.source,
      readinessResultId: body.readinessResultId,
      raw: body,
    });
    return NextResponse.json({ enquiry }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "EOI failed" },
      { status: 400 },
    );
  }
}
