import type { Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";

/** Catalog from gp-onboarding-workflow/notification-model.json (+ enquiry events). */
export const PIPELINE_NOTIFICATION_CATALOG = [
  { id: "enquiry_received", recipients: ["practice_manager"], requiresHumanFollowUp: true },
  { id: "eoi_submitted", recipients: ["practice_manager", "doctor"], requiresHumanFollowUp: true },
  { id: "eoi_decision", recipients: ["doctor"], requiresHumanFollowUp: false },
  { id: "credentials_requested", recipients: ["doctor"], requiresHumanFollowUp: true },
  { id: "credentials_gate_pending", recipients: ["practice_manager"], requiresHumanFollowUp: true },
  { id: "session_match_advisory", recipients: ["practice_manager"], requiresHumanFollowUp: true },
  { id: "session_allocation_gate_pending", recipients: ["practice_manager"], requiresHumanFollowUp: true },
  { id: "go_live_approved", recipients: ["practice_manager", "doctor"], requiresHumanFollowUp: true },
  { id: "first90_opened", recipients: ["practice_manager", "doctor"], requiresHumanFollowUp: true },
  { id: "first90_review_due", recipients: ["practice_manager"], requiresHumanFollowUp: true },
] as const;

export async function logPipelineNotification(input: {
  clinicId: string;
  eventId: string;
  recipientRole: string;
  payload: Prisma.InputJsonValue;
  enquiryId?: string | null;
  onboardingCaseId?: string | null;
  channel?: string;
}) {
  return prisma.gpPipelineNotificationLog.create({
    data: {
      clinicId: input.clinicId,
      eventId: input.eventId,
      channel: input.channel ?? "in_app",
      recipientRole: input.recipientRole,
      payload: input.payload,
      enquiryId: input.enquiryId ?? undefined,
      onboardingCaseId: input.onboardingCaseId ?? undefined,
      countsAsApproval: false,
    },
  });
}

export async function notifyRoles(input: {
  clinicId: string;
  eventId: string;
  roles: string[];
  payload: Prisma.InputJsonValue;
  enquiryId?: string | null;
  onboardingCaseId?: string | null;
}) {
  const rows = [];
  for (const role of input.roles) {
    rows.push(
      await logPipelineNotification({
        clinicId: input.clinicId,
        eventId: input.eventId,
        recipientRole: role,
        payload: input.payload,
        enquiryId: input.enquiryId,
        onboardingCaseId: input.onboardingCaseId,
      }),
    );
  }
  return rows;
}
