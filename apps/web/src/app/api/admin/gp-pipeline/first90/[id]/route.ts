import { NextResponse } from "next/server";
import type { GpFirst90CaseStatus } from "@prisma/client";
import { requireAction } from "@/cms/context";
import {
  closeFirst90Case,
  getFirst90Case,
  setFirst90ChecklistItem,
} from "@/gp-pipeline/first90";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { clinic } = await requireAction("edit");
  const { id } = await context.params;
  const settling = await getFirst90Case(clinic.id, id);
  if (!settling) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ settling });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { clinic, user } = await requireAction("edit");
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  if (!body?.action) {
    return NextResponse.json({ error: "action required" }, { status: 400 });
  }

  try {
    if (body.action === "checklist") {
      const item = await setFirst90ChecklistItem({
        clinicId: clinic.id,
        caseId: id,
        itemKey: String(body.itemKey),
        done: Boolean(body.done),
        actorId: user.id,
        notes: body.notes ? String(body.notes) : undefined,
      });
      return NextResponse.json({ item });
    }
    if (body.action === "close") {
      const settling = await closeFirst90Case({
        clinicId: clinic.id,
        caseId: id,
        actorId: user.id,
        status: body.status as Extract<GpFirst90CaseStatus, "closed_bau" | "closed_staged_growth">,
        summary: String(body.summary || ""),
      });
      return NextResponse.json({ settling });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "First 90 action failed" },
      { status: 400 },
    );
  }
}
