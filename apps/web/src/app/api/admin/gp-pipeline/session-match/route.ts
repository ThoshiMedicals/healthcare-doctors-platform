import { NextResponse } from "next/server";
import type { MatchRunSource } from "@prisma/client";
import { requireAction } from "@/cms/context";
import { runSessionCapacityMatch } from "@/gp-pipeline/session-match";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const { clinic, user } = await requireAction("edit");
  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.preferredSessions)) {
    return NextResponse.json({ error: "preferredSessions array required" }, { status: 400 });
  }
  try {
    const result = await runSessionCapacityMatch({
      clinicId: clinic.id,
      preferredSessions: body.preferredSessions,
      doctorDisplayName: body.doctorDisplayName ? String(body.doctorDisplayName) : undefined,
      enquiryId: body.enquiryId ? String(body.enquiryId) : undefined,
      onboardingCaseId: body.onboardingCaseId ? String(body.onboardingCaseId) : undefined,
      source: (body.source as MatchRunSource) || "admin_manual",
      persist: body.persist !== false,
      createdByUserId: user.id,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Match failed" },
      { status: 400 },
    );
  }
}
