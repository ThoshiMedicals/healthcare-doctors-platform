import { requireAction } from "@/cms/context";
import { loadMeasurementEvents } from "@/measurement/event-source";
import {
  buildMonthlyExecutiveReport,
  buildSimplePdf,
  downloadFilename,
  executiveDashboardSummaryLines,
  executiveDashboardToCsv,
} from "@/measurement/management-exports";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  await requireAction("manage_settings");
  const url = new URL(request.url);
  const format = url.searchParams.get("format") === "pdf" ? "pdf" : "csv";
  const month = url.searchParams.get("month");

  const loaded = await loadMeasurementEvents(url.searchParams.get("data"));
  const { window, report } = buildMonthlyExecutiveReport(loaded.events, month);

  if (format === "pdf") {
    const bytes = buildSimplePdf(
      executiveDashboardSummaryLines(report),
      `Monthly executive · ${window.label}`,
    );
    return new Response(Buffer.from(bytes), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${downloadFilename(`monthly-executive-${window.monthKey}`, "pdf")}"`,
        "cache-control": "private, no-store",
      },
    });
  }

  const csv = executiveDashboardToCsv(report);
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${downloadFilename(`monthly-executive-${window.monthKey}`, "csv")}"`,
      "cache-control": "private, no-store",
    },
  });
}
