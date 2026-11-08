import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import {
  submitGpReadinessPackage,
  type ReadinessPackagePayload,
} from "@/gp-pipeline/readiness-package";
import { canOperateRecruitmentPublicWorkflows } from "@/importer/recruitment-hold";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Public GP Readiness & Onboarding Portal submit.
 * Separate from Express Interest EOI — stores a readiness package for human review.
 * Blocked while recruitment HOLD is active.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ clinicSlug: string }> },
) {
  if (!canOperateRecruitmentPublicWorkflows()) {
    return NextResponse.json(
      { error: "Recruitment workflows are on HOLD and are not accepting public readiness packages." },
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

  try {
    const contentType = request.headers.get("content-type") || "";
    let payload: ReadinessPackagePayload;
    const documents: Array<{
      key: string;
      fileName: string;
      mimeType: string;
      bytes: Buffer;
      kind: "headshot" | "document";
    }> = [];

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const raw = form.get("payload");
      if (typeof raw !== "string") {
        return NextResponse.json({ error: "payload JSON field required" }, { status: 400 });
      }
      payload = JSON.parse(raw) as ReadinessPackagePayload;
      for (const [key, value] of form.entries()) {
        if (key === "payload" || typeof value === "string") continue;
        if (!(value instanceof File)) continue;
        const kind = key === "headshot" ? "headshot" : "document";
        const bytes = Buffer.from(await value.arrayBuffer());
        documents.push({
          key,
          fileName: value.name,
          mimeType: value.type || "application/octet-stream",
          bytes,
          kind,
        });
      }
    } else {
      const body = await request.json().catch(() => null);
      if (!body?.payload) {
        return NextResponse.json({ error: "payload required" }, { status: 400 });
      }
      payload = body.payload as ReadinessPackagePayload;
    }

    const result = await submitGpReadinessPackage({
      clinicId: clinic.id,
      payload,
      documents,
      source: "join_our_team_readiness_portal",
    });

    return NextResponse.json(
      {
        package: {
          id: result.id,
          status: result.status,
          spousalOutcome: result.spousalOutcome,
        },
        notice:
          "GP Readiness & Onboarding package received for recruitment review. This is not an automated hire decision.",
        nextSteps: [
          "Recruitment review",
          "Confidential discussion",
          "Practice tour",
          "Commercial discussion",
          "Provider-number support",
          "Website profile preparation",
          "Planned onboarding",
        ],
        expectedReview: "1–2 business days",
        contact: {
          name: "Roshan Samarawickrema",
          role: "Practice Operations",
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Readiness package submit failed" },
      { status: 400 },
    );
  }
}
