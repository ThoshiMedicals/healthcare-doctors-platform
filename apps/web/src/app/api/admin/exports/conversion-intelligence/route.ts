import { requireAction } from "@/cms/context";
import { buildPracticeConversionIntelligenceReport } from "@/measurement/conversion-intelligence-report";
import { loadMeasurementEvents } from "@/measurement/event-source";
import { conversionIntelligenceDashboardToCsv, downloadFilename } from "@/measurement/management-exports";
import { isExecutiveRange, type ExecutiveRange } from "@/measurement/ranges";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  await requireAction("manage_settings");
  const url = new URL(request.url);
  const range: ExecutiveRange = isExecutiveRange(url.searchParams.get("range"))
    ? (url.searchParams.get("range") as ExecutiveRange)
    : "last_7";

  const loaded = await loadMeasurementEvents(url.searchParams.get("data"));
  const report = buildPracticeConversionIntelligenceReport(loaded.events, range);
  const csv = conversionIntelligenceDashboardToCsv(report);

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${downloadFilename(`conversion-intelligence-${range}`, "csv")}"`,
      "cache-control": "private, no-store",
    },
  });
}
