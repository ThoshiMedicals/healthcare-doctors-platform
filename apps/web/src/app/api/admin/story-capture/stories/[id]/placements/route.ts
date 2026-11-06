import { NextResponse } from "next/server";
import type { GpStoryReuseChannel } from "@prisma/client";
import { requireAction } from "@/cms/context";
import {
  createPlacement,
  goLivePlacement,
  takeDownPlacement,
} from "@/story-capture/placements";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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
    if (body.action === "create") {
      const placement = await createPlacement({
        clinicId: clinic.id,
        storyId: id,
        versionId: String(body.versionId),
        channel: body.channel as GpStoryReuseChannel,
        moduleKey: body.moduleKey ? String(body.moduleKey) : undefined,
        surfacePath: body.surfacePath ? String(body.surfacePath) : undefined,
      });
      return NextResponse.json({ placement }, { status: 201 });
    }
    if (body.action === "go_live") {
      const placement = await goLivePlacement({
        clinicId: clinic.id,
        storyId: id,
        placementId: String(body.placementId),
        actorUserId: user.id,
        actorName: user.name || user.email || user.id,
      });
      return NextResponse.json({ placement });
    }
    if (body.action === "take_down") {
      const placement = await takeDownPlacement({
        clinicId: clinic.id,
        storyId: id,
        placementId: String(body.placementId),
        reason: String(body.reason || "Manual take-down"),
      });
      return NextResponse.json({ placement });
    }
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Placement action failed" },
      { status: 400 },
    );
  }
}
