import { NextResponse } from "next/server";
import { requireAction } from "@/cms/context";
import { seedCompositeStoriesForEv } from "@/story-capture/seed-composite-ev";

export async function POST() {
  try {
    const { clinic, user } = await requireAction("edit");
    const result = await seedCompositeStoriesForEv(clinic.id, user.id);
    return NextResponse.json({
      ok: true,
      created: Array.isArray(result) ? result.length : result,
      count: Array.isArray(result) ? result.length : undefined,
      result,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Seed failed" },
      { status: 400 },
    );
  }
}
