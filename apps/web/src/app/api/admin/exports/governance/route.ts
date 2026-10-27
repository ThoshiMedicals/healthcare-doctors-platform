import { requireAction } from "@/cms/context";
import { prisma } from "@/db/prisma";
import { buildPracticeGovernanceManagementReport } from "@/governance/management-report";
import { resolveGovernanceDataset } from "@/measurement/demo/load-governance-dataset";
import { parseInsightsDataMode } from "@/measurement/insights-data-mode";
import {
  buildSimplePdf,
  downloadFilename,
  governanceQueuesSummaryLines,
  governanceQueuesToCsv,
} from "@/measurement/management-exports";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const { clinic } = await requireAction("clinical_signoff");
  const url = new URL(request.url);
  const format = url.searchParams.get("format") === "pdf" ? "pdf" : "csv";

  const liveRows = await prisma.clinicalReview.findMany({
    where: { clinicId: clinic.id },
    include: { page: { select: { path: true, title: true } } },
  });
  const mode =
    parseInsightsDataMode(url.searchParams.get("data")) ??
    (liveRows.length > 0 ? "live" : "demo");
  const dataset = resolveGovernanceDataset(mode, liveRows);
  const report = buildPracticeGovernanceManagementReport(dataset.rows, 60);

  if (format === "pdf") {
    const bytes = buildSimplePdf(governanceQueuesSummaryLines(report), "Governance summary");
    return new Response(Buffer.from(bytes), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${downloadFilename("governance-queues", "pdf")}"`,
        "cache-control": "private, no-store",
      },
    });
  }

  const csv = governanceQueuesToCsv(report);
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${downloadFilename("governance-queues", "csv")}"`,
      "cache-control": "private, no-store",
    },
  });
}
