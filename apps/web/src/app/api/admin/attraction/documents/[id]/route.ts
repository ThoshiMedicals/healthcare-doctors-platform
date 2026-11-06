import { NextResponse } from "next/server";
import { requireAction } from "@/cms/context";
import { getAttractionDocument, updateAttractionDraft } from "@/attraction-cms/documents";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { clinic } = await requireAction("edit");
  const { id } = await context.params;
  const document = await getAttractionDocument(clinic.id, id);
  if (!document) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ document });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { clinic } = await requireAction("edit");
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  if (!body?.draftBody) {
    return NextResponse.json({ error: "draftBody required" }, { status: 400 });
  }
  try {
    const document = await updateAttractionDraft(clinic.id, id, body.draftBody, {
      title: body.title,
      summary: body.summary,
      surfacePath: body.surfacePath,
    });
    return NextResponse.json({ document });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update failed" },
      { status: 400 },
    );
  }
}
