import { NextResponse } from "next/server";
import type { AttractionDocumentKind } from "@prisma/client";
import { requireAction } from "@/cms/context";
import {
  createAttractionDocument,
  listAttractionDocuments,
} from "@/attraction-cms/documents";
import { seedAttractionCmsDefaults } from "@/attraction-cms/seed-defaults";
import { seedAttractionPublishReadyContent } from "@/attraction-cms/seed-publish-ready";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const KINDS = new Set<AttractionDocumentKind>([
  "opportunities",
  "faq",
  "practice_experience",
  "registrar_pathway",
  "story",
  "catchment_analysis",
  "continuity_network",
  "clinical_interests",
]);

export async function GET(request: Request) {
  const { clinic } = await requireAction("edit");
  const kind = new URL(request.url).searchParams.get("kind");
  if (kind && !KINDS.has(kind as AttractionDocumentKind)) {
    return NextResponse.json({ error: "Invalid kind" }, { status: 400 });
  }
  const documents = await listAttractionDocuments(
    clinic.id,
    kind ? (kind as AttractionDocumentKind) : undefined,
  );
  return NextResponse.json({ documents });
}

export async function POST(request: Request) {
  const { clinic, user } = await requireAction("edit");
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.action === "seed_defaults") {
    const result = await seedAttractionCmsDefaults(clinic.id, user.id);
    return NextResponse.json(result);
  }

  if (body.action === "seed_publish_ready") {
    const result = await seedAttractionPublishReadyContent(clinic.id, user.id);
    return NextResponse.json(result);
  }

  const kind = body.kind as AttractionDocumentKind;
  if (!KINDS.has(kind) || !body.slug || !body.title || body.draftBody == null) {
    return NextResponse.json(
      { error: "kind, slug, title, draftBody required" },
      { status: 400 },
    );
  }

  try {
    const result = await createAttractionDocument({
      clinicId: clinic.id,
      kind,
      slug: String(body.slug),
      title: String(body.title),
      summary: body.summary ? String(body.summary) : undefined,
      surfacePath: body.surfacePath ? String(body.surfacePath) : undefined,
      draftBody: body.draftBody,
      storyCaptureRef: body.storyCaptureRef ? String(body.storyCaptureRef) : undefined,
      authorId: user.id,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Create failed" },
      { status: 400 },
    );
  }
}
