import { prisma } from "@/db/prisma";
import { aggregateAttractionEvents } from "./aggregate";

export async function getAttractionAnalyticsDashboard(
  clinicId: string,
  windowDays = 28,
) {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - windowDays);

  const events = await prisma.gpAttractionEvent.findMany({
    where: { clinicId, occurredAt: { gte: since } },
    orderBy: { occurredAt: "asc" },
    take: 20000,
  });

  const aggregate = aggregateAttractionEvents(
    events.map((e) => ({
      ...e,
      props:
        e.props && typeof e.props === "object" && !Array.isArray(e.props)
          ? (e.props as Record<string, unknown>)
          : null,
    })),
  );
  const latestGraph = await prisma.attractionKnowledgeGraphSnapshot.findFirst({
    where: { clinicId },
    orderBy: { generatedAt: "desc" },
  });
  const latestIntel = await prisma.contentIntelligenceInsightRun.findFirst({
    where: { clinicId },
    orderBy: { generatedAt: "desc" },
  });

  const graphNodes = Array.isArray(latestGraph?.nodesJson)
    ? (latestGraph!.nodesJson as Array<{ id: string; type: string; label: string }>)
    : [];
  const graphEdges = Array.isArray(latestGraph?.edgesJson)
    ? (latestGraph!.edgesJson as Array<{ from: string; to: string; type: string; weight?: number }>)
    : [];
  const graphSummary =
    latestGraph?.summaryJson && typeof latestGraph.summaryJson === "object"
      ? (latestGraph.summaryJson as Record<string, unknown>)
      : null;

  const monthlyRecs =
    latestIntel?.monthlyRecsJson && typeof latestIntel.monthlyRecsJson === "object"
      ? (latestIntel.monthlyRecsJson as {
          notice?: string;
          items?: Array<{ type: string; title: string; rationale: string }>;
        })
      : null;
  const gaps = Array.isArray(latestIntel?.gapsJson)
    ? (latestIntel!.gapsJson as Array<{ type?: string; faqId?: string; opens?: number }>)
    : [];

  return {
    ...aggregate,
    windowDays,
    eventCount: events.length,
    graphSnapshotId: latestGraph?.id ?? null,
    graphGeneratedAt: latestGraph?.generatedAt ?? null,
    graphNodeCount: graphNodes.length,
    graphEdgeCount: graphEdges.length,
    graphNodes: graphNodes.slice(0, 24),
    graphEdges: graphEdges.slice(0, 40),
    graphSummary,
    intelligenceRunId: latestIntel?.id ?? null,
    intelligenceGeneratedAt: latestIntel?.generatedAt ?? null,
    intelligenceGaps: gaps.slice(0, 8),
    intelligenceRecs: monthlyRecs,
    decisionNotice:
      "Advisory only — Attraction Analytics never auto-publishes content, auto-rejects EOIs, or advances hiring/onboarding.",
  };
}
