import { NextResponse } from "next/server";
import { requireAction } from "@/cms/context";
import { getAttractionAnalyticsDashboard } from "@/attraction-analytics/dashboard";
import { TRACKED_PRODUCT_SIGNALS } from "@/attraction-analytics/event-schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const { clinic } = await requireAction("manage_settings");
  const days = Number(new URL(request.url).searchParams.get("days") || 28);
  const dashboard = await getAttractionAnalyticsDashboard(
    clinic.id,
    Number.isFinite(days) ? days : 28,
  );
  return NextResponse.json({
    ...dashboard,
    trackedSignals: TRACKED_PRODUCT_SIGNALS,
  });
}
