import type { FormRequestStatus, Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";

export const FORM_REQUEST_STATUS_LABEL: Record<FormRequestStatus, string> = {
  new: "New",
  assigned: "Assigned",
  in_progress: "In Progress",
  waiting_for_patient: "Waiting For Patient",
  completed: "Completed",
  closed: "Closed",
};

export const FORM_REQUEST_STATUS_OPTIONS = Object.entries(FORM_REQUEST_STATUS_LABEL) as Array<
  [FormRequestStatus, string]
>;

export const OPEN_FORM_REQUEST_STATUSES: FormRequestStatus[] = [
  "new",
  "assigned",
  "in_progress",
  "waiting_for_patient",
];

/** Canonical request types for the operations inbox. */
export const FORM_REQUEST_TYPES = [
  "Patient Registration",
  "Medical Records",
  "Contact Request",
  "Feedback",
  "General Request",
  "Other",
] as const;

export type FormRequestType = (typeof FORM_REQUEST_TYPES)[number];

const LEGACY_TYPE_MAP: Record<string, FormRequestType> = {
  "New patient registration": "Patient Registration",
  "Medical records transfer request": "Medical Records",
  "Patient Registration": "Patient Registration",
  "Medical Records": "Medical Records",
  "Contact Request": "Contact Request",
  Feedback: "Feedback",
  "General Request": "General Request",
  Other: "Other",
};

export function normalizeFormRequestType(raw: string): FormRequestType {
  const mapped = LEGACY_TYPE_MAP[raw.trim()];
  if (mapped) return mapped;
  const match = FORM_REQUEST_TYPES.find((type) => type.toLowerCase() === raw.trim().toLowerCase());
  return match ?? "Other";
}

export function isFormRequestStatus(value: string): value is FormRequestStatus {
  return value in FORM_REQUEST_STATUS_LABEL;
}

export function isFormRequestType(value: string): value is FormRequestType {
  return (FORM_REQUEST_TYPES as readonly string[]).includes(value);
}

export const OVERDUE_AFTER_DAYS = 3;

export type FormRequestHistoryEntry = {
  at: string;
  actorId?: string | null;
  actorName?: string | null;
  action: "created" | "status" | "assign" | "notes";
  from?: string | null;
  to?: string | null;
  note?: string | null;
};

export function parseFormRequestHistory(value: unknown): FormRequestHistoryEntry[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row) => {
    if (!row || typeof row !== "object") return [];
    const entry = row as Record<string, unknown>;
    const at = typeof entry.at === "string" ? entry.at : "";
    const action = entry.action;
    if (!at || (action !== "created" && action !== "status" && action !== "assign" && action !== "notes")) {
      return [];
    }
    return [
      {
        at,
        actorId: typeof entry.actorId === "string" ? entry.actorId : null,
        actorName: typeof entry.actorName === "string" ? entry.actorName : null,
        action,
        from: typeof entry.from === "string" ? entry.from : null,
        to: typeof entry.to === "string" ? entry.to : null,
        note: typeof entry.note === "string" ? entry.note : null,
      } satisfies FormRequestHistoryEntry,
    ];
  });
}

export function appendFormRequestHistory(
  existing: unknown,
  entry: FormRequestHistoryEntry,
): FormRequestHistoryEntry[] {
  return [...parseFormRequestHistory(existing), entry].slice(-100);
}

export type PatientRequestListFilters = {
  q?: string;
  status?: FormRequestStatus | "all";
  formType?: string | "all";
  assignedToUserId?: string | "all" | "unassigned";
  from?: string;
  to?: string;
};

export function patientRequestWhere(
  clinicId: string,
  filters: PatientRequestListFilters,
): Prisma.FormRequestWhereInput {
  const where: Prisma.FormRequestWhereInput = { clinicId };
  if (filters.status && filters.status !== "all") where.status = filters.status;
  if (filters.formType && filters.formType !== "all") where.formType = filters.formType;
  if (filters.assignedToUserId === "unassigned") where.assignedToUserId = null;
  else if (filters.assignedToUserId && filters.assignedToUserId !== "all") {
    where.assignedToUserId = filters.assignedToUserId;
  }
  if (filters.from || filters.to) {
    where.createdAt = {};
    if (filters.from) where.createdAt.gte = new Date(`${filters.from}T00:00:00.000Z`);
    if (filters.to) where.createdAt.lte = new Date(`${filters.to}T23:59:59.999Z`);
  }
  const q = filters.q?.trim();
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { formType: { contains: q, mode: "insensitive" } },
      { notes: { contains: q, mode: "insensitive" } },
    ];
  }
  return where;
}

export type PatientRequestDashboardStats = {
  totalOpen: number;
  newToday: number;
  awaitingAction: number;
  assigned: number;
  waitingForPatient: number;
  overdue: number;
  closedThisWeek: number;
};

export async function patientRequestDashboardStats(
  clinicId: string,
  now = new Date(),
): Promise<PatientRequestDashboardStats> {
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const overdueBefore = new Date(now.getTime() - OVERDUE_AFTER_DAYS * 86_400_000);
  const weekAgo = new Date(now.getTime() - 7 * 86_400_000);

  const [totalOpen, newToday, awaitingAction, assigned, waitingForPatient, overdue, closedThisWeek] =
    await Promise.all([
      prisma.formRequest.count({
        where: { clinicId, status: { in: OPEN_FORM_REQUEST_STATUSES } },
      }),
      prisma.formRequest.count({
        where: { clinicId, createdAt: { gte: startOfDay } },
      }),
      prisma.formRequest.count({
        where: { clinicId, status: { in: ["new", "waiting_for_patient"] } },
      }),
      prisma.formRequest.count({
        where: { clinicId, status: { in: ["assigned", "in_progress"] } },
      }),
      prisma.formRequest.count({
        where: { clinicId, status: "waiting_for_patient" },
      }),
      prisma.formRequest.count({
        where: {
          clinicId,
          status: { in: OPEN_FORM_REQUEST_STATUSES },
          createdAt: { lt: overdueBefore },
        },
      }),
      prisma.formRequest.count({
        where: {
          clinicId,
          status: { in: ["completed", "closed"] },
          updatedAt: { gte: weekAgo },
        },
      }),
    ]);

  return {
    totalOpen,
    newToday,
    awaitingAction,
    assigned,
    waitingForPatient,
    overdue,
    closedThisWeek,
  };
}
