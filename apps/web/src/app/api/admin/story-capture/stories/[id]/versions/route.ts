import { NextResponse } from "next/server";
import type { GpStoryAttribution, GpStoryFormat } from "@prisma/client";
import { requireAction } from "@/cms/context";
import { createStoryVersion } from "@/story-capture/versions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { clinic, user } = await requireAction("edit");
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  if (!body?.format || !body?.bodyText || !body?.attribution) {
    return NextResponse.json(
      { error: "format, bodyText, attribution required" },
      { status: 400 },
    );
  }
  try {
    const version = await createStoryVersion({
      clinicId: clinic.id,
      storyId: id,
      format: body.format as GpStoryFormat,
      bodyText: String(body.bodyText),
      pullQuoteText: body.pullQuoteText ? String(body.pullQuoteText) : undefined,
      transcriptText: body.transcriptText ? String(body.transcriptText) : undefined,
      attribution: body.attribution as GpStoryAttribution,
      publicByline: body.publicByline ? String(body.publicByline) : undefined,
      structureJson: body.structureJson,
      editorUserId: user.id,
    });
    return NextResponse.json({ version }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Version create failed" },
      { status: 400 },
    );
  }
}
