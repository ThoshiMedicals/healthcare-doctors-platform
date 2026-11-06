import type { Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { trackServerEvent } from "@/attraction-analytics/ingest";
import { notifyRoles } from "./notifications";

/** Bands from docs/proposals/doctor-readiness/scoring-model.json */
export function bandForScore(score: number): {
  id: string;
  label: string;
  nextActionId: string;
} {
  if (score >= 80) {
    return { id: "ready", label: "Ready to express interest", nextActionId: "submit_eoi" };
  }
  if (score >= 60) {
    return {
      id: "nearly_ready",
      label: "Nearly ready — clarify a few items",
      nextActionId: "call_practice",
    };
  }
  if (score >= 40) {
    return {
      id: "preparing",
      label: "Preparing — strengthen readiness",
      nextActionId: "prepare_then_eoi",
    };
  }
  return { id: "early", label: "Early stage", nextActionId: "explore_practice" };
}

export async function recordDoctorReadiness(input: {
  clinicId: string;
  applicantName?: string;
  applicantEmail?: string;
  totalScore: number;
  answersJson: Prisma.InputJsonValue;
  themeScoresJson?: Prisma.InputJsonValue;
  enquiryId?: string;
}) {
  const band = bandForScore(input.totalScore);
  const result = await prisma.gpDoctorReadinessResult.create({
    data: {
      clinicId: input.clinicId,
      applicantName: input.applicantName,
      applicantEmail: input.applicantEmail,
      overallBand: band.id,
      totalScore: input.totalScore,
      maxScore: 100,
      nextActionId: band.nextActionId,
      answersJson: input.answersJson,
      themeScoresJson: input.themeScoresJson ?? {},
      summaryJson: { bandLabel: band.label, advisoryOnly: true } as Prisma.InputJsonValue,
      advisoryOnly: true,
      enquiryId: input.enquiryId,
    },
  });

  await notifyRoles({
    clinicId: input.clinicId,
    eventId: "enquiry_received",
    roles: ["practice_manager"],
    payload: {
      kind: "doctor_readiness_completed",
      readinessId: result.id,
      band: band.id,
      nextActionId: band.nextActionId,
      notice: "Advisory only — not a hire decision.",
    },
    enquiryId: input.enquiryId,
  });

  await trackServerEvent(input.clinicId, {
    name: "tool_complete",
    anonymousSessionId: `server_ready_${result.id}`,
    surface: "doctor_readiness",
    toolId: "doctor-readiness",
    props: {
      band: band.id,
      nextActionId: band.nextActionId,
      advisoryOnly: true,
    },
  }).catch(() => undefined);

  return { result, band };
}
