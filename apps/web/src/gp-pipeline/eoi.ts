import type { GpEnquiryStatus, Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { trackServerEvent } from "@/attraction-analytics/ingest";
import { assertHumanReviewerId } from "./human-gate";
import { notifyRoles } from "./notifications";

export async function submitGpEoi(input: {
  clinicId: string;
  applicant: { name: string; email: string; phone?: string };
  credentials?: {
    ahpraRegistration?: string;
    medicareProviderNumber?: string;
    fellowshipNote?: string;
    racgpFellowship?: string;
    acrrmFellowship?: string;
  };
  preferences?: {
    specialInterests?: string[];
    preferredStartDate?: string;
    preferredStartTiming?: string;
    currentPractice?: string;
    sessionsPerWeek?: number;
    availabilityNotes?: string;
    preferredSessions?: unknown[];
  };
  source?: string;
  readinessResultId?: string;
  raw?: Prisma.InputJsonValue;
}) {
  const fellowshipParts = [
    input.credentials?.fellowshipNote?.trim() || null,
    input.credentials?.racgpFellowship ? `RACGP:${input.credentials.racgpFellowship}` : null,
    input.credentials?.acrrmFellowship ? `ACRRM:${input.credentials.acrrmFellowship}` : null,
    input.credentials?.medicareProviderNumber?.trim()
      ? `Medicare provider: ${input.credentials.medicareProviderNumber.trim()}`
      : null,
  ].filter(Boolean);

  const availabilityParts = [
    input.preferences?.currentPractice?.trim()
      ? `Current/recent practice: ${input.preferences.currentPractice.trim()}`
      : null,
    input.preferences?.preferredStartTiming?.trim()
      ? `Preferred start: ${input.preferences.preferredStartTiming.trim()}`
      : null,
    input.preferences?.availabilityNotes?.trim() || null,
  ].filter(Boolean);

  const enquiry = await prisma.gpEnquiry.create({
    data: {
      clinicId: input.clinicId,
      doctorDisplayName: input.applicant.name.trim(),
      email: input.applicant.email.trim().toLowerCase(),
      phone: input.applicant.phone,
      status: "new_submission",
      source: input.source ?? "join_our_team",
      preferredStartDate: input.preferences?.preferredStartDate
        ? new Date(input.preferences.preferredStartDate)
        : undefined,
      sessionsPerWeek: input.preferences?.sessionsPerWeek,
      eoiSnapshot: {
        create: {
          ahpraStatus: input.credentials?.ahpraRegistration?.trim() || undefined,
          fellowship: fellowshipParts.length ? fellowshipParts.join(" · ") : undefined,
          clinicalInterests: input.preferences?.specialInterests ?? [],
          availabilityNotes: availabilityParts.length ? availabilityParts.join("\n\n") : undefined,
          rawSummaryJson: input.raw ?? {},
        },
      },
      sessionPreferences: input.preferences?.preferredSessions
        ? {
            create: {
              preferredDaysJson: input.preferences.preferredSessions as Prisma.InputJsonValue,
              sessionsPerWeek: input.preferences.sessionsPerWeek,
              completedAt: new Date(),
            },
          }
        : undefined,
    },
    include: { eoiSnapshot: true, sessionPreferences: true },
  });

  if (input.readinessResultId) {
    await prisma.gpDoctorReadinessResult.updateMany({
      where: { id: input.readinessResultId, clinicId: input.clinicId },
      data: { enquiryId: enquiry.id },
    });
  } else if (input.applicant.email) {
    // Attach latest readiness for same email if present and unlinked
    const prior = await prisma.gpDoctorReadinessResult.findFirst({
      where: {
        clinicId: input.clinicId,
        applicantEmail: input.applicant.email.trim().toLowerCase(),
        enquiryId: null,
      },
      orderBy: { createdAt: "desc" },
    });
    if (prior) {
      await prisma.gpDoctorReadinessResult.update({
        where: { id: prior.id },
        data: { enquiryId: enquiry.id },
      });
    }
  }

  await notifyRoles({
    clinicId: input.clinicId,
    eventId: "eoi_submitted",
    roles: ["practice_manager", "doctor"],
    payload: {
      enquiryId: enquiry.id,
      doctorCopy:
        "We have received your expression of interest. A team member will review it personally — this is not an automated decision.",
      adminCopy: "EOI ready for human review. Scoring aids queue order only.",
    },
    enquiryId: enquiry.id,
  });

  await trackServerEvent(input.clinicId, {
    name: "eoi_submit",
    anonymousSessionId: `server_eoi_${enquiry.id}`,
    surface: "gp_eoi",
    eoiSubmissionId: enquiry.id,
    props: {
      source: enquiry.source,
      priorReadinessLinked: Boolean(input.readinessResultId),
    },
  }).catch(() => undefined);

  if (input.readinessResultId) {
    await trackServerEvent(input.clinicId, {
      name: "path_edge",
      anonymousSessionId: `server_eoi_${enquiry.id}`,
      fromSurface: "doctor_readiness",
      toSurface: "gp_eoi",
    }).catch(() => undefined);
  }

  return enquiry;
}

export async function updateEnquiryStatus(input: {
  clinicId: string;
  enquiryId: string;
  status: GpEnquiryStatus;
  actorUserId: string;
  actorName: string;
  note?: string;
  humanConfirmation?: boolean;
}) {
  assertHumanReviewerId(input.actorUserId);
  if (input.status === "hired" && !input.humanConfirmation) {
    throw new Error("hired requires humanConfirmation=true");
  }

  const existing = await prisma.gpEnquiry.findFirst({
    where: { id: input.enquiryId, clinicId: input.clinicId },
  });
  if (!existing) throw new Error("Enquiry not found");

  const updated = await prisma.$transaction(async (tx) => {
    await tx.gpEnquiryStatusAudit.create({
      data: {
        enquiryId: existing.id,
        actorUserId: input.actorUserId,
        actorName: input.actorName,
        fromStatus: existing.status,
        toStatus: input.status,
        field: "status",
        fromValue: existing.status,
        toValue: input.status,
        note: input.note,
      },
    });
    return tx.gpEnquiry.update({
      where: { id: existing.id },
      data: { status: input.status },
    });
  });

  await notifyRoles({
    clinicId: input.clinicId,
    eventId: "eoi_decision",
    roles: ["doctor"],
    payload: {
      enquiryId: existing.id,
      decision: input.status,
      note: input.note ?? null,
    },
    enquiryId: existing.id,
  });

  return updated;
}

export async function listEnquiries(clinicId: string) {
  return prisma.gpEnquiry.findMany({
    where: { clinicId },
    orderBy: [{ priorityScore: "desc" }, { submittedAt: "desc" }],
    include: {
      eoiSnapshot: true,
      readinessLink: true,
      sessionPreferences: true,
      onboardingCase: { select: { id: true, status: true, currentStageId: true } },
      _count: { select: { matchRuns: true, statusAudits: true, notes: true } },
    },
  });
}

export async function getEnquiry(clinicId: string, enquiryId: string) {
  return prisma.gpEnquiry.findFirst({
    where: { id: enquiryId, clinicId },
    include: {
      eoiSnapshot: true,
      readinessLink: true,
      sessionPreferences: true,
      notes: { orderBy: { createdAt: "desc" }, take: 20 },
      statusAudits: { orderBy: { createdAt: "desc" }, take: 30 },
      matchRuns: { orderBy: { createdAt: "desc" }, take: 10 },
      onboardingCase: {
        include: {
          stages: true,
          gates: { orderBy: { createdAt: "desc" }, take: 10 },
          first90Case: true,
        },
      },
      notifications: { orderBy: { sentAt: "desc" }, take: 20 },
    },
  });
}
