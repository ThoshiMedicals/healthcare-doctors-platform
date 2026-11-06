import type { GpOnboardingGateDecision, GpOnboardingStageId } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { assertHumanReviewerId } from "./human-gate";
import { notifyRoles } from "./notifications";
import { ONBOARDING_STAGE_ORDER } from "./workflow-map";
import { openFirst90FromGoLive } from "./first90";

const STAGE_TASKS: Array<{
  stageId: GpOnboardingStageId;
  taskKey: string;
  owner: "admin" | "doctor" | "external";
  label: string;
  required: boolean;
}> = [
  {
    stageId: "initial_discussion",
    taskKey: "id_capture_enquiry",
    owner: "admin",
    label: "Log enquiry source and preferred contact method",
    required: true,
  },
  {
    stageId: "initial_discussion",
    taskKey: "id_share_boundaries",
    owner: "admin",
    label: "Share practice support boundaries (provider numbers, no guarantees)",
    required: true,
  },
  {
    stageId: "initial_discussion",
    taskKey: "id_invite_eoi",
    owner: "admin",
    label: "Invite Expression of Interest when mutual interest is clear",
    required: true,
  },
  {
    stageId: "eoi_review",
    taskKey: "er_validate_completeness",
    owner: "admin",
    label: "Check EOI completeness",
    required: true,
  },
  {
    stageId: "eoi_review",
    taskKey: "er_human_decision",
    owner: "admin",
    label: "Record human review decision and rationale",
    required: true,
  },
  {
    stageId: "credential_checks",
    taskKey: "cc_request_docs",
    owner: "admin",
    label: "Request credential documents",
    required: true,
  },
  {
    stageId: "credential_checks",
    taskKey: "cc_human_sight",
    owner: "admin",
    label: "Human sighting of credentials",
    required: true,
  },
  {
    stageId: "provider_number_preparation",
    taskKey: "pn_share_location",
    owner: "admin",
    label: "Share practice location pack for Services Australia",
    required: true,
  },
  {
    stageId: "provider_number_preparation",
    taskKey: "pn_await_external",
    owner: "external",
    label: "Doctor progresses Services Australia application",
    required: true,
  },
  {
    stageId: "session_allocation",
    taskKey: "sa_review_match",
    owner: "admin",
    label: "Review advisory session-capacity match",
    required: true,
  },
  {
    stageId: "session_allocation",
    taskKey: "sa_confirm_sessions",
    owner: "admin",
    label: "Human confirm session footprint",
    required: true,
  },
  {
    stageId: "orientation",
    taskKey: "or_schedule",
    owner: "admin",
    label: "Schedule orientation",
    required: true,
  },
  {
    stageId: "orientation",
    taskKey: "or_complete",
    owner: "admin",
    label: "Orientation complete sign-off",
    required: true,
  },
  {
    stageId: "go_live",
    taskKey: "gl_checklist",
    owner: "admin",
    label: "Go-live readiness checklist reviewed",
    required: true,
  },
];

export async function createOnboardingCaseFromEnquiry(input: {
  clinicId: string;
  enquiryId: string;
  actorUserId: string;
}) {
  assertHumanReviewerId(input.actorUserId);
  const enquiry = await prisma.gpEnquiry.findFirst({
    where: { id: input.enquiryId, clinicId: input.clinicId },
    include: { onboardingCase: true },
  });
  if (!enquiry) throw new Error("Enquiry not found");
  if (enquiry.onboardingCase) return enquiry.onboardingCase;

  const created = await prisma.$transaction(async (tx) => {
    const onboarding = await tx.gpOnboardingCase.create({
      data: {
        clinicId: input.clinicId,
        doctorDisplayName: enquiry.doctorDisplayName,
        doctorEmail: enquiry.email,
        enquiryId: enquiry.id,
        careerApplicationId: enquiry.careerApplicationId,
        status: "eoi_received",
        currentStageId: "eoi_review",
      },
    });

    for (const stageId of ONBOARDING_STAGE_ORDER) {
      await tx.gpOnboardingStageState.create({
        data: {
          caseId: onboarding.id,
          stageId,
          status: stageId === "eoi_review" ? "in_progress" : "not_started",
          startedAt: stageId === "eoi_review" ? new Date() : undefined,
        },
      });
    }

    for (const task of STAGE_TASKS) {
      await tx.gpOnboardingTask.create({
        data: {
          caseId: onboarding.id,
          stageId: task.stageId,
          taskKey: task.taskKey,
          owner: task.owner,
          label: task.label,
          required: task.required,
        },
      });
    }

    await tx.gpEnquiry.update({
      where: { id: enquiry.id },
      data: { status: "onboarding" },
    });

    await tx.gpEnquiryStatusAudit.create({
      data: {
        enquiryId: enquiry.id,
        actorUserId: input.actorUserId,
        fromStatus: enquiry.status,
        toStatus: "onboarding",
        field: "status",
        note: `Opened onboarding case ${onboarding.id}`,
      },
    });

    return onboarding;
  });

  await notifyRoles({
    clinicId: input.clinicId,
    eventId: "credentials_requested",
    roles: ["practice_manager"],
    payload: { onboardingCaseId: created.id, enquiryId: enquiry.id },
    enquiryId: enquiry.id,
    onboardingCaseId: created.id,
  });

  return created;
}

export async function recordOnboardingGate(input: {
  clinicId: string;
  caseId: string;
  stageId: GpOnboardingStageId;
  decision: GpOnboardingGateDecision;
  reviewerId: string;
  reviewerName: string;
  rationale: string;
}) {
  assertHumanReviewerId(input.reviewerId);
  if (!input.rationale.trim()) throw new Error("rationale required");

  const onboarding = await prisma.gpOnboardingCase.findFirst({
    where: { id: input.caseId, clinicId: input.clinicId },
    include: { stages: true, tasks: true },
  });
  if (!onboarding) throw new Error("Onboarding case not found");
  if (onboarding.currentStageId !== input.stageId) {
    throw new Error(`Gate must be on current stage ${onboarding.currentStageId}`);
  }

  if (input.decision === "approve_advance") {
    const required = onboarding.tasks.filter(
      (t) => t.stageId === input.stageId && t.required && t.owner !== "external",
    );
    const incomplete = required.filter((t) => t.status !== "done" && t.status !== "waived_with_rationale");
    if (incomplete.length) {
      throw new Error(
        `Required tasks incomplete: ${incomplete.map((t) => t.taskKey).join(", ")}`,
      );
    }
  }

  return prisma.$transaction(async (tx) => {
    const event = await tx.gpOnboardingGateEvent.create({
      data: {
        caseId: onboarding.id,
        stageId: input.stageId,
        decision: input.decision,
        reviewerId: input.reviewerId,
        reviewerName: input.reviewerName,
        rationale: input.rationale.trim(),
      },
    });

    if (input.decision === "pause") {
      await tx.gpOnboardingCase.update({
        where: { id: onboarding.id },
        data: { status: "paused" },
      });
      return { event, case: onboarding, first90: null };
    }
    if (input.decision === "decline") {
      await tx.gpOnboardingCase.update({
        where: { id: onboarding.id },
        data: { status: "declined" },
      });
      return { event, case: onboarding, first90: null };
    }
    if (input.decision === "withdraw") {
      await tx.gpOnboardingCase.update({
        where: { id: onboarding.id },
        data: { status: "withdrawn" },
      });
      return { event, case: onboarding, first90: null };
    }
    if (input.decision === "acknowledge_awaiting_external") {
      await tx.gpOnboardingStageState.update({
        where: { caseId_stageId: { caseId: onboarding.id, stageId: input.stageId } },
        data: { status: "awaiting_external" },
      });
      await tx.gpOnboardingCase.update({
        where: { id: onboarding.id },
        data: { status: "awaiting_external" },
      });
      return { event, case: onboarding, first90: null };
    }
    if (input.decision === "request_changes") {
      await tx.gpOnboardingStageState.update({
        where: { caseId_stageId: { caseId: onboarding.id, stageId: input.stageId } },
        data: { status: "awaiting_doctor" },
      });
      await tx.gpOnboardingCase.update({
        where: { id: onboarding.id },
        data: { status: "awaiting_doctor" },
      });
      return { event, case: onboarding, first90: null };
    }

    // approve_advance
    await tx.gpOnboardingStageState.update({
      where: { caseId_stageId: { caseId: onboarding.id, stageId: input.stageId } },
      data: { status: "gate_approved", gateApprovedAt: new Date() },
    });

    const idx = ONBOARDING_STAGE_ORDER.indexOf(input.stageId);
    const nextStage = ONBOARDING_STAGE_ORDER[idx + 1];

    if (input.stageId === "go_live") {
      const updated = await tx.gpOnboardingCase.update({
        where: { id: onboarding.id },
        data: {
          status: "live",
          firstSessionAt: new Date(),
        },
      });
      // First 90 opened outside transaction helper after commit
      return { event, case: updated, openFirst90: true as const };
    }

    if (nextStage) {
      await tx.gpOnboardingStageState.update({
        where: { caseId_stageId: { caseId: onboarding.id, stageId: nextStage } },
        data: { status: "in_progress", startedAt: new Date() },
      });
      const updated = await tx.gpOnboardingCase.update({
        where: { id: onboarding.id },
        data: {
          currentStageId: nextStage,
          status: nextStage === "session_allocation" ? "in_review" : "in_review",
        },
      });
      return { event, case: updated, openFirst90: false as const };
    }

    return { event, case: onboarding, openFirst90: false as const };
  }).then(async (result) => {
    if (result.openFirst90) {
      const first90 = await openFirst90FromGoLive({
        clinicId: input.clinicId,
        onboardingCaseId: onboarding.id,
        doctorDisplayName: onboarding.doctorDisplayName,
      });
      await notifyRoles({
        clinicId: input.clinicId,
        eventId: "go_live_approved",
        roles: ["practice_manager", "doctor"],
        payload: { onboardingCaseId: onboarding.id, first90CaseId: first90.id },
        onboardingCaseId: onboarding.id,
        enquiryId: onboarding.enquiryId,
      });
      return { event: result.event, case: result.case, first90 };
    }
    if (input.stageId === "session_allocation" && input.decision === "approve_advance") {
      await notifyRoles({
        clinicId: input.clinicId,
        eventId: "session_allocation_gate_pending",
        roles: ["practice_manager"],
        payload: { advanced: true, next: "orientation" },
        onboardingCaseId: onboarding.id,
      });
    }
    return { event: result.event, case: result.case, first90: null };
  });
}

export async function completeOnboardingTask(input: {
  clinicId: string;
  caseId: string;
  taskKey: string;
  actorId: string;
  status?: "done" | "waived_with_rationale" | "in_progress";
  notes?: string;
}) {
  assertHumanReviewerId(input.actorId);
  const onboarding = await prisma.gpOnboardingCase.findFirst({
    where: { id: input.caseId, clinicId: input.clinicId },
  });
  if (!onboarding) throw new Error("Onboarding case not found");

  return prisma.gpOnboardingTask.update({
    where: { caseId_taskKey: { caseId: onboarding.id, taskKey: input.taskKey } },
    data: {
      status: input.status ?? "done",
      completedAt: new Date(),
      completedBy: input.actorId,
      notes: input.notes,
    },
  });
}

export async function getOnboardingCase(clinicId: string, caseId: string) {
  return prisma.gpOnboardingCase.findFirst({
    where: { id: caseId, clinicId },
    include: {
      stages: true,
      tasks: true,
      gates: { orderBy: { createdAt: "desc" } },
      notifications: { orderBy: { sentAt: "desc" }, take: 20 },
      first90Case: { include: { checklistItems: true } },
      enquiry: true,
    },
  });
}
