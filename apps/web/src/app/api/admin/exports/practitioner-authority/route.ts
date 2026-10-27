import { requireAction } from "@/cms/context";
import { loadMeasurementEvents } from "@/measurement/event-source";
import { downloadFilename, practitionerAuthorityDashboardToCsv } from "@/measurement/management-exports";
import { buildPracticePractitionerAuthorityDashboardFromIndex } from "@/measurement/practitioner-authority-report";
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
  const report = await buildPracticePractitionerAuthorityDashboardFromIndex(loaded.events, range);
  const csv = practitionerAuthorityDashboardToCsv(report);

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${downloadFilename(`practitioner-authority-${range}`, "csv")}"`,
      "cache-control": "private, no-store",
    },
  });
}
