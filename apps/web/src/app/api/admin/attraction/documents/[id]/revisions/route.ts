import { NextResponse } from "next/server";
import { requireAction } from "@/cms/context";
import { createAttractionRevision } from "@/attraction-cms/documents";
import type { AttractionChangeClass } from "@prisma/client";

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
    const result = await createAttractionRevision({
      documentId: id,
      clinicId: clinic.id,
      body: body.body,
      changeClass: body.changeClass as AttractionChangeClass | undefined,
      authorId: user.id,
      note: body.note ? String(body.note) : undefined,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Revision failed" },
      { status: 400 },
    );
  }
}
