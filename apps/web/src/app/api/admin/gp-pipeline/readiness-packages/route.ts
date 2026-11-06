import { NextResponse } from "next/server";
import { requireAction } from "@/cms/context";
import {
  isGpReadinessPackageStatus,
  isGpRecruitmentSource,
  listRecruitmentPackages,
  recruitmentDashboardStats,
  type PracticeManagerFilter,
} from "@/gp-pipeline/recruitment-ops";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PM_FILTERS = new Set([
  "all",
  "needs_provider_number",
  "needs_website_profile",
  "pending_documents",
  "pending_review",
  "ready_to_start",
  "active_gps",
]);

export async function GET(request: Request) {
  const { clinic } = await requireAction("edit");
  const url = new URL(request.url);
  const statusRaw = url.searchParams.get("status") || "all";
  const sourceRaw = url.searchParams.get("source") || "all";
  const pmRaw = url.searchParams.get("pm") || "all";
  const q = url.searchParams.get("q") || undefined;

  const status =
    statusRaw === "all" || !isGpReadinessPackageStatus(statusRaw) ? "all" : statusRaw;
  const source =
    sourceRaw === "all" || !isGpRecruitmentSource(sourceRaw) ? "all" : sourceRaw;
  const pmFilter = (PM_FILTERS.has(pmRaw) ? pmRaw : "all") as PracticeManagerFilter;

  const [packages, stats] = await Promise.all([
    listRecruitmentPackages(clinic.id, { status, source, q, pmFilter }),
    recruitmentDashboardStats(clinic.id),
  ]);

  return NextResponse.json({ packages, stats });
}
