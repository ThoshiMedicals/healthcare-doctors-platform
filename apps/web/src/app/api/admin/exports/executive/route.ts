import { requireAction } from "@/cms/context";
import { loadMeasurementEvents } from "@/measurement/event-source";
import { buildPracticeExecutiveDashboard } from "@/measurement/executive-report";
import {
  buildSimplePdf,
  downloadFilename,
  executiveDashboardSummaryLines,
  executiveDashboardToCsv,
} from "@/measurement/management-exports";
import { isExecutiveRange, type ExecutiveRange } from "@/measurement/ranges";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  await requireAction("manage_settings");
  const url = new URL(request.url);
  const format = url.searchParams.get("format") === "pdf" ? "pdf" : "csv";
  const range: ExecutiveRange = isExecutiveRange(url.searchParams.get("range"))
    ? (url.searchParams.get("range") as ExecutiveRange)
    : "last_7";

  const loaded = await loadMeasurementEvents(url.searchParams.get("data"));
  const report = buildPracticeExecutiveDashboard(loaded.events, range);

  if (format === "pdf") {
    const bytes = buildSimplePdf(executiveDashboardSummaryLines(report), "Executive summary");
    return new Response(Buffer.from(bytes), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${downloadFilename(`executive-${range}`, "pdf")}"`,
        "cache-control": "private, no-store",
      },
    });
  }

  const csv = executiveDashboardToCsv(report);
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${downloadFilename(`executive-${range}`, "csv")}"`,
      "cache-control": "private, no-store",
    },
  });
}
