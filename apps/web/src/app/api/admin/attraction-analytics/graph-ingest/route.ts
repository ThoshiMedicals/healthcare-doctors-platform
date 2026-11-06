import { NextResponse } from "next/server";
import { requireAction } from "@/cms/context";
import { ingestAttractionKnowledgeGraph } from "@/attraction-analytics/graph-ingest";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const { clinic, user } = await requireAction("manage_settings");
  const body = await request.json().catch(() => ({}));
  const windowDays = Number(body?.windowDays || 28);
  try {
    const result = await ingestAttractionKnowledgeGraph(
      clinic.id,
      Number.isFinite(windowDays) ? windowDays : 28,
      user.id,
    );
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Graph ingest failed" },
      { status: 400 },
    );
  }
}
