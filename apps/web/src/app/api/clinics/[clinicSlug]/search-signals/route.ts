import { ZodError } from "zod";
import { prisma } from "@/db/prisma";
import { normalizeSearchTerm, parseSearchDemandSignal } from "@/forms/search-demand-signal";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const RETENTION_DAYS = 90;

export async function POST(
  request: Request,
  context: { params: Promise<{ clinicSlug: string }> },
) {
  const { clinicSlug } = await context.params;
  const clinic = await prisma.clinic.findUnique({ where: { slug: clinicSlug }, select: { id: true, status: true } });
  if (!clinic || clinic.status !== "live") {
    return Response.json({ error: "Clinic not found." }, { status: 404 });
  }

  try {
    const input = await parseSearchDemandSignal(request);
    const normalizedTerm = normalizeSearchTerm(input.term);
    if (!normalizedTerm) {
      return Response.json({ error: "Search term required." }, { status: 400 });
    }

    const noResult =
      input.noResult === true ||
      input.resultType === "no_result" ||
      (typeof input.resultCount === "number" && input.resultCount === 0 && input.resultType !== "emergency");

    const created = await prisma.searchDemandSignal.create({
      data: {
        clinicId: clinic.id,
        occurredAt: input.occurredAt ? new Date(input.occurredAt) : new Date(),
        normalizedTerm,
        intentBucket: input.intentBucket || "unmatched",
        resultType: input.resultType || (noResult ? "no_result" : ""),
        resultCount: input.resultCount ?? 0,
        noResult,
        clickedResultPath: input.clickedResultPath || null,
        clickedStep: input.clickedStep || null,
        practitionerSlug: input.practitionerSlug || null,
        pagePath: input.pagePath || "",
        sessionKey: input.sessionKey || null,
      },
      select: { id: true },
    });

    // Best-effort retention trim (ignore failures).
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 86_400_000);
    void prisma.searchDemandSignal
      .deleteMany({ where: { clinicId: clinic.id, occurredAt: { lt: cutoff } } })
      .catch(() => undefined);

    return Response.json({ id: created.id }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Invalid search signal." }, { status: 400 });
    }
    throw error;
  }
}
