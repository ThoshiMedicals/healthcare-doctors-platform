import { prisma } from "@/db/prisma";
import { PIPELINE_STAGES } from "./workflow-map";

/** Admin board snapshot across the five proposal-connected stages. */
export async function getPipelineBoard(clinicId: string) {
  const [readiness, enquiries, matches, onboarding, first90] = await Promise.all([
    prisma.gpDoctorReadinessResult.count({ where: { clinicId } }),
    prisma.gpEnquiry.groupBy({
      by: ["status"],
      where: { clinicId },
      _count: true,
    }),
    prisma.sessionCapacityMatchRun.count({ where: { clinicId } }),
    prisma.gpOnboardingCase.groupBy({
      by: ["status"],
      where: { clinicId },
      _count: true,
    }),
    prisma.gpFirst90SettlingCase.groupBy({
      by: ["status"],
      where: { clinicId },
      _count: true,
    }),
  ]);

  const recentEnquiries = await prisma.gpEnquiry.findMany({
    where: { clinicId },
    orderBy: { submittedAt: "desc" },
    take: 15,
    include: {
      readinessLink: { select: { overallBand: true, totalScore: true } },
      onboardingCase: {
        select: { id: true, status: true, currentStageId: true, first90Case: { select: { id: true, status: true, currentPhase: true } } },
      },
      _count: { select: { matchRuns: true } },
    },
  });

  return {
    stages: PIPELINE_STAGES,
    counts: {
      readiness,
      enquiriesByStatus: Object.fromEntries(enquiries.map((e) => [e.status, e._count])),
      matchRuns: matches,
      onboardingByStatus: Object.fromEntries(onboarding.map((e) => [e.status, e._count])),
      first90ByStatus: Object.fromEntries(first90.map((e) => [e.status, e._count])),
    },
    recentEnquiries,
    notice:
      "Operational pipeline connects existing proposals only. Scores and matches are advisory; gates and hired/go-live require named humans.",
  };
}
