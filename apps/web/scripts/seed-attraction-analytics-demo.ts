import { prisma } from "../src/db/prisma";
import { ingestAttractionEvents } from "../src/attraction-analytics/ingest";
import { ingestAttractionKnowledgeGraph } from "../src/attraction-analytics/graph-ingest";

async function main() {
  const clinic = await prisma.clinic.findFirst({ where: { slug: "woolloongabba" } });
  if (!clinic) throw new Error("No clinic");
  const sid = `sess_demo_${Date.now()}`;
  const ingest = await ingestAttractionEvents(clinic.id, [
    {
      name: "page_view",
      anonymousSessionId: sid,
      surface: "gp_opportunities",
      path: "join-our-team.html",
    },
    {
      name: "faq_open",
      anonymousSessionId: sid,
      surface: "gp_faq",
      faqId: "nursing-support",
    },
    {
      name: "page_view",
      anonymousSessionId: sid,
      surface: "practice_experience",
      path: "about-us/practice-experience.html",
    },
    {
      name: "module_view",
      anonymousSessionId: sid,
      surface: "practice_experience",
      moduleId: "typical_day",
    },
    {
      name: "tool_complete",
      anonymousSessionId: sid,
      surface: "doctor_readiness",
      toolId: "doctor-readiness",
    },
    {
      name: "pack_download",
      anonymousSessionId: sid,
      surface: "opportunity_pack",
      packId: "gp-opportunity-pack",
      ctaId: "opportunity_pack_download",
    },
    {
      name: "path_edge",
      anonymousSessionId: sid,
      fromSurface: "doctor_readiness",
      toSurface: "gp_eoi",
    },
    {
      name: "eoi_submit",
      anonymousSessionId: sid,
      surface: "gp_eoi",
      eoiSubmissionId: `demo_eoi_${Date.now()}`,
    },
  ]);
  const graph = await ingestAttractionKnowledgeGraph(clinic.id, 28);
  console.log(
    JSON.stringify(
      {
        ingest,
        graphNodes: graph.nodeCount,
        graphEdges: graph.edgeCount,
        signals: graph.signalCount,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
