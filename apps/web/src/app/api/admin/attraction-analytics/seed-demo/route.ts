import { NextResponse } from "next/server";
import { requireAction } from "@/cms/context";
import { seedAttractionAnalyticsDemo } from "@/attraction-analytics/seed-demo-events";

export async function POST() {
  try {
    const { clinic, user } = await requireAction("manage_settings");
    const result = await seedAttractionAnalyticsDemo(clinic.id, user.id);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Seed failed" },
      { status: 400 },
    );
  }
}
