import { requireAction } from "@/cms/context";
import { loadMeasurementEvents } from "@/measurement/event-source";
import { downloadFilename, serviceAuthorityDashboardToCsv } from "@/measurement/management-exports";
import { isExecutiveRange, type ExecutiveRange } from "@/measurement/ranges";
import { buildPracticeServiceAuthorityDashboardFromIndex } from "@/measurement/service-authority-report";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  await requireAction("manage_settings");
  const url = new URL(request.url);
  const range: ExecutiveRange = isExecutiveRange(url.searchParams.get("range"))
    ? (url.searchParams.get("range") as ExecutiveRange)
    : "last_7";

  const loaded = await loadMeasurementEvents(url.searchParams.get("data"));
  const report = await buildPracticeServiceAuthorityDashboardFromIndex(loaded.events, range);
  const csv = serviceAuthorityDashboardToCsv(report);

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${downloadFilename(`service-authority-${range}`, "csv")}"`,
      "cache-control": "private, no-store",
    },
  });
}
