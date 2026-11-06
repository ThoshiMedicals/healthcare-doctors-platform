import { NextResponse } from "next/server";
import { prisma } from "@/db/prisma";
import { ingestAttractionEvents, type IngestEventInput } from "@/attraction-analytics/ingest";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Public anonymous ingest — no auth.
 * Rejects PII-like payloads. Never drives automated decisions.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const clinicSlug = String(body.clinicSlug || "woolloongabba");
  const clinic = await prisma.clinic.findFirst({ where: { slug: clinicSlug } });
  if (!clinic) return NextResponse.json({ error: "Unknown clinic" }, { status: 404 });

  const events: IngestEventInput[] = Array.isArray(body.events)
    ? body.events
    : body.event
      ? [body.event]
      : body.name
        ? [body as IngestEventInput]
        : [];

  if (!events.length) {
    return NextResponse.json({ error: "events array or single event required" }, { status: 400 });
  }
  if (events.length > 50) {
    return NextResponse.json({ error: "Max 50 events per request" }, { status: 400 });
  }

  const result = await ingestAttractionEvents(clinic.id, events);
  return NextResponse.json({
    ...result,
    notice: "Events stored for advisory analytics only — no automated decisions.",
  });
}
