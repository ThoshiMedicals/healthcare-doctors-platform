import { NextResponse } from "next/server";
import { requireAction } from "@/cms/context";
import {
  getDoctorProfile,
  updateDoctorProfileFields,
} from "@/gp-pipeline/doctor-profile";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function asList(value: unknown): string[] | undefined {
  if (value == null) return undefined;
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split(/[,;\n]+/)
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return undefined;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { clinic } = await requireAction("edit");
  const { id } = await context.params;
  const profile = await getDoctorProfile(clinic.id, id);
  if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ profile });
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
    const profile = await updateDoctorProfileFields({
      clinicId: clinic.id,
      profileId: id,
      patch: {
        title: body.title != null ? String(body.title) : undefined,
        preferredPublishedName:
          body.preferredPublishedName != null ? String(body.preferredPublishedName) : undefined,
        credentials: asList(body.credentials),
        biography: body.biography != null ? String(body.biography) : undefined,
        shortIntroduction:
          body.shortIntroduction != null ? String(body.shortIntroduction) : undefined,
        qualifications: asList(body.qualifications),
        specialInterests: asList(body.specialInterests),
        languages: asList(body.languages),
        yearsPractising:
          body.yearsPractising === null
            ? null
            : body.yearsPractising != null
              ? String(body.yearsPractising)
              : undefined,
        memberships: asList(body.memberships),
        reviewNotes:
          body.reviewNotes === null
            ? null
            : body.reviewNotes != null
              ? String(body.reviewNotes)
              : undefined,
        practitionerId:
          body.practitionerId === null
            ? null
            : body.practitionerId != null
              ? String(body.practitionerId)
              : undefined,
      },
    });
    return NextResponse.json({ profile });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update failed" },
      { status: 400 },
    );
  }
}
