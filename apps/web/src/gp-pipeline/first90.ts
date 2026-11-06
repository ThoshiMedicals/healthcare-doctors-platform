import type { GpFirst90CaseStatus, GpFirst90Phase } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { assertHumanReviewerId } from "./human-gate";
import { notifyRoles } from "./notifications";

/** Checklist from docs/proposals/gp-first-90-days/framework.json */
const CHECKLIST: Array<{
  id: string;
  phase: GpFirst90Phase;
  owner: string;
  theme: string;
  item: string;
}> = [
  { id: "d1_orient", phase: "day1", owner: "doctor", theme: "systems_adoption", item: "Orientation walk complete" },
  { id: "d1_login", phase: "day1", owner: "doctor", theme: "systems_adoption", item: "Systems login and core templates verified" },
  { id: "d1_nurse", phase: "day1", owner: "doctor", theme: "nursing_integration", item: "Named nurse and reception contacts confirmed" },
  { id: "d1_session", phase: "day1", owner: "doctor", theme: "session_expansion", item: "First session completed within agreed footprint" },
  { id: "d1_buddy", phase: "day1", owner: "practice", theme: "nursing_integration", item: "Buddy assigned and present" },
  { id: "d1_roster", phase: "day1", owner: "practice", theme: "session_expansion", item: "HotDoc/roster matches agreed sessions only" },
  { id: "d1_debrief", phase: "day1", owner: "practice", theme: "systems_adoption", item: "End-of-day debrief held" },
  { id: "w1_handoff", phase: "week1", owner: "doctor", theme: "nursing_integration", item: "Daily nursing handoff used when clinically appropriate" },
  { id: "w1_checkin", phase: "week1", owner: "practice", theme: "systems_adoption", item: "Day 2–5 soft check-ins logged" },
  { id: "w1_no_expand", phase: "week1", owner: "practice", theme: "session_expansion", item: "No unilateral session expansion" },
  { id: "m1_review", phase: "month1", owner: "practice", theme: "systems_adoption", item: "Fortnightly settling review completed" },
  { id: "m2_wellbeing", phase: "month2", owner: "practice", theme: "systems_adoption", item: "Wellbeing / admin-burden check held" },
  { id: "m3_meeting", phase: "month3", owner: "practice", theme: "session_expansion", item: "Formal 90-day review meeting and written summary" },
  { id: "m3_expand_gate", phase: "month3", owner: "practice", theme: "session_expansion", item: "Expansion only if rooms + nursing + reliability met" },
  { id: "m3_close", phase: "month3", owner: "practice", theme: "systems_adoption", item: "Settling status closed to BAU or staged plan" },
];

export async function openFirst90FromGoLive(input: {
  clinicId: string;
  onboardingCaseId: string;
  doctorDisplayName: string;
  goLiveAt?: Date;
}) {
  const existing = await prisma.gpFirst90SettlingCase.findUnique({
    where: { onboardingCaseId: input.onboardingCaseId },
  });
  if (existing) return existing;

  const goLiveAt = input.goLiveAt ?? new Date();
  const reviewDueAt = new Date(goLiveAt);
  reviewDueAt.setUTCDate(reviewDueAt.getUTCDate() + 90);

  const created = await prisma.gpFirst90SettlingCase.create({
    data: {
      clinicId: input.clinicId,
      onboardingCaseId: input.onboardingCaseId,
      doctorDisplayName: input.doctorDisplayName,
      status: "active",
      currentPhase: "day1",
      goLiveAt,
      reviewDueAt,
      checklistItems: {
        create: CHECKLIST.map((c) => ({
          itemKey: c.id,
          phase: c.phase,
          owner: c.owner,
          theme: c.theme,
          label: c.item,
        })),
      },
    },
    include: { checklistItems: true },
  });

  await prisma.gpOnboardingCase.update({
    where: { id: input.onboardingCaseId },
    data: { status: "settling" },
  });

  await notifyRoles({
    clinicId: input.clinicId,
    eventId: "first90_opened",
    roles: ["practice_manager", "doctor"],
    payload: {
      first90CaseId: created.id,
      notice: "First 90 Days settling opened after go-live. Continuity over volume.",
    },
    onboardingCaseId: input.onboardingCaseId,
  });

  return created;
}

export async function setFirst90ChecklistItem(input: {
  clinicId: string;
  caseId: string;
  itemKey: string;
  done: boolean;
  actorId: string;
  notes?: string;
}) {
  assertHumanReviewerId(input.actorId);
  const settling = await prisma.gpFirst90SettlingCase.findFirst({
    where: { id: input.caseId, clinicId: input.clinicId },
  });
  if (!settling) throw new Error("First 90 case not found");

  return prisma.gpFirst90ChecklistItem.update({
    where: { caseId_itemKey: { caseId: settling.id, itemKey: input.itemKey } },
    data: {
      done: input.done,
      doneAt: input.done ? new Date() : null,
      doneBy: input.done ? input.actorId : null,
      notes: input.notes,
    },
  });
}

export async function closeFirst90Case(input: {
  clinicId: string;
  caseId: string;
  actorId: string;
  status: Extract<GpFirst90CaseStatus, "closed_bau" | "closed_staged_growth">;
  summary: string;
}) {
  assertHumanReviewerId(input.actorId);
  if (!input.summary.trim()) throw new Error("close summary required");

  const settling = await prisma.gpFirst90SettlingCase.findFirst({
    where: { id: input.caseId, clinicId: input.clinicId },
  });
  if (!settling) throw new Error("First 90 case not found");

  return prisma.gpFirst90SettlingCase.update({
    where: { id: settling.id },
    data: {
      status: input.status,
      closedAt: new Date(),
      closeSummary: input.summary.trim(),
      currentPhase: "month3",
    },
  });
}

export async function getFirst90Case(clinicId: string, caseId: string) {
  return prisma.gpFirst90SettlingCase.findFirst({
    where: { id: caseId, clinicId },
    include: {
      checklistItems: { orderBy: [{ phase: "asc" }, { itemKey: "asc" }] },
      onboardingCase: true,
    },
  });
}
