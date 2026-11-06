import type { Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { aggregateAttractionEvents } from "./aggregate";

/**
 * Graph ingestion plan (proposal: gp-attraction-knowledge-graph):
 * 1. Read raw attraction events for window
 * 2. Aggregate FAQ / readiness / paths / PE / pack signals
 * 3. Emit nodes (faq, readiness, eoi_path, intelligence) + edges (opens_faq, completes_tool, follows_path, submits_eoi)
 * 4. Persist snapshot — humans review; never auto-publish content or auto-reject EOIs
 * 5. Mirror FAQ usage into ContentIntelligenceSignalDaily for monthly recs
 */
export async function ingestAttractionKnowledgeGraph(
  clinicId: string,
  windowDays = 28,
  createdByUserId?: string,
) {
  const since = new Date();
  since.setUTCDate(since.getUTCDate() - windowDays);

  const events = await prisma.gpAttractionEvent.findMany({
    where: { clinicId, occurredAt: { gte: since } },
    take: 20000,
  });
  const agg = aggregateAttractionEvents(
    events.map((e) => ({
      ...e,
      props:
        e.props && typeof e.props === "object" && !Array.isArray(e.props)
          ? (e.props as Record<string, unknown>)
          : null,
    })),
  );

  const nodes: Array<{ id: string; type: string; label: string; meta?: Record<string, unknown> }> = [
    { id: "ready:doctor_readiness", type: "readiness", label: "Doctor Readiness results" },
    { id: "intel:monthly_recs", type: "intelligence", label: "Content intelligence · monthly recs" },
    {
      id: "surface:practice_experience",
      type: "intelligence",
      label: "Practice Experience engagement",
      meta: { sessions: agg.kpis.practiceExperienceSessions },
    },
    {
      id: "surface:opportunity_pack",
      type: "intelligence",
      label: "Opportunity Pack downloads",
      meta: { downloads: agg.kpis.opportunityPackDownloads },
    },
  ];

  const edges: Array<{ from: string; to: string; type: string; weight?: number }> = [];

  for (const faq of agg.topFaq) {
    const nodeId = `faq:${faq.faqId}`;
    nodes.push({
      id: nodeId,
      type: "faq",
      label: `FAQ · ${faq.faqId}`,
      meta: { opens: faq.count },
    });
    edges.push({
      from: "surface:practice_experience",
      to: nodeId,
      type: "opens_faq",
      weight: faq.count,
    });
  }

  for (const path of agg.topPaths) {
    const nodeId = `path:${path.path.replace(/[^a-z0-9>_-]+/gi, "_")}`;
    nodes.push({
      id: nodeId,
      type: "eoi_path",
      label: `Path · ${path.path}`,
      meta: { eoiSessions: path.eoiSessions },
    });
    edges.push({
      from: nodeId,
      to: "ready:doctor_readiness",
      type: path.path.includes("doctor_readiness") ? "completes_tool" : "follows_path",
      weight: path.eoiSessions,
    });
    edges.push({ from: nodeId, to: "intel:monthly_recs", type: "submits_eoi", weight: path.eoiSessions });
  }

  if (agg.kpis.readinessCompletions > 0) {
    edges.push({
      from: "ready:doctor_readiness",
      to: "intel:monthly_recs",
      type: "completes_tool",
      weight: agg.kpis.readinessCompletions,
    });
  }

  const snapshot = await prisma.attractionKnowledgeGraphSnapshot.create({
    data: {
      clinicId,
      windowDays,
      nodesJson: nodes as Prisma.InputJsonValue,
      edgesJson: edges as Prisma.InputJsonValue,
      summaryJson: {
        eventCount: events.length,
        kpis: agg.kpis,
        notice: "Advisory graph snapshot — not an automated decision engine.",
      } as Prisma.InputJsonValue,
    },
  });

  // Content intelligence daily signals (faq_usage / eoi_source style)
  const day = new Date();
  day.setUTCHours(0, 0, 0, 0);
  const signalRows = [
    ...agg.topFaq.map((f) => ({
      clinicId,
      day,
      source: "faq_usage",
      key: f.faqId,
      value: f.count,
      metaJson: { windowDays },
    })),
    {
      clinicId,
      day,
      source: "readiness_completion",
      key: "doctor-readiness",
      value: agg.kpis.readinessCompletions,
      metaJson: { windowDays },
    },
    {
      clinicId,
      day,
      source: "practice_experience",
      key: "sessions",
      value: agg.kpis.practiceExperienceSessions,
      metaJson: { windowDays },
    },
    {
      clinicId,
      day,
      source: "opportunity_pack",
      key: "downloads",
      value: agg.kpis.opportunityPackDownloads,
      metaJson: { windowDays },
    },
    {
      clinicId,
      day,
      source: "eoi_source",
      key: "eoi_submit",
      value: agg.kpis.eoiSubmissions,
      metaJson: { windowDays },
    },
  ];

  for (const row of signalRows) {
    await prisma.contentIntelligenceSignalDaily.upsert({
      where: {
        clinicId_day_source_key: {
          clinicId: row.clinicId,
          day: row.day,
          source: row.source,
          key: row.key,
        },
      },
      create: row,
      update: { value: row.value, metaJson: row.metaJson },
    });
  }

  const intelRun = await prisma.contentIntelligenceInsightRun.create({
    data: {
      clinicId,
      periodLabel: day.toISOString().slice(0, 7),
      windowDays,
      gapsJson: agg.topFaq.slice(0, 3).map((f) => ({
        type: "faq_pressure",
        faqId: f.faqId,
        opens: f.count,
      })),
      unansweredJson: [],
      highConvertingJson: agg.topPaths,
      monthlyRecsJson: {
        notice: "Human editor review required — recommendations are advisory.",
        items: [
          ...agg.contentOpportunities.slice(0, 4).map((o) => ({
            type: "content_opportunity",
            title: o.title,
            rationale: o.rationale,
          })),
          ...agg.topFaq.slice(0, 3).map((f) => ({
            type: "expand_faq",
            title: `Review FAQ ${f.label || f.faqId}`,
            rationale: `${f.count} opens in ${windowDays}d window`,
          })),
        ],
      },
      seoOpportunitiesJson: [],
      doctorInfoGapsJson: [],
      brandAlignmentJson: {
        pillars: ["community_care", "continuity_of_care", "gp_employer_brand"],
      },
      createdByUserId,
    },
  });

  return {
    snapshot,
    intelRun,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    signalCount: signalRows.length,
    notice: "Graph + intelligence ingest complete. No automated publishing or EOI decisions.",
  };
}
