import { NextResponse } from "next/server";
import { requireAction } from "@/cms/context";
import { addRecruitmentPackageNote } from "@/gp-pipeline/recruitment-ops";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { clinic, user } = await requireAction("edit");
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  if (!body?.body) {
    return NextResponse.json({ error: "body required" }, { status: 400 });
  }

  try {
    const note = await addRecruitmentPackageNote({
      clinicId: clinic.id,
      packageId: id,
      authorUserId: user.id,
      authorName: user.name || user.email || user.id,
      body: String(body.body),
    });
    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not save note" },
      { status: 400 },
    );
  }
}
