import type {
  GpReadinessPackageStatus,
  GpReadinessPackageTaskStatus,
  GpRecruitmentSource,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/db/prisma";
import { scoreDoctorProfileCompleteness } from "./doctor-profile";

export const GP_READINESS_STATUS_LABEL: Record<GpReadinessPackageStatus, string> = {
  new_lead: "New Lead",
  confidential_discussion: "Confidential Discussion",
  recruitment_review: "Recruitment Review",
  applicant: "Applicant",
  onboarding_candidate: "Onboarding Candidate",
  provider_number_support: "Provider Number Support",
  website_profile_preparation: "Website Profile Preparation",
  offer_extended: "Offer Extended",
  ready_to_start: "Ready To Start",
  active_gp: "Active GP",
  on_hold: "On Hold",
  not_proceeding: "Not Proceeding",
};

export const GP_READINESS_STATUS_OPTIONS = Object.entries(GP_READINESS_STATUS_LABEL) as Array<
  [GpReadinessPackageStatus, string]
>;

export const GP_RECRUITMENT_SOURCE_LABEL: Record<GpRecruitmentSource, string> = {
  practice_website: "Practice Website",
  seek: "Seek",
  linkedin: "LinkedIn",
  indeed: "Indeed",
  referral: "Referral",
  recruitment_agency: "Recruitment Agency",
  existing_gp: "Existing GP",
  google_search: "Google Search",
  other: "Other",
};

export const GP_RECRUITMENT_SOURCE_OPTIONS = Object.entries(GP_RECRUITMENT_SOURCE_LABEL) as Array<
  [GpRecruitmentSource, string]
>;

export const GP_READINESS_TASK_PRESETS = [
  { key: "review_ahpra", title: "Review AHPRA" },
  { key: "review_spousal", title: "Review Spousal Eligibility" },
  { key: "provider_number_support", title: "Provider Number Support" },
  { key: "prepare_website_profile", title: "Prepare Website Profile" },
  { key: "schedule_practice_visit", title: "Schedule Practice Visit" },
  { key: "commercial_discussion", title: "Commercial Discussion" },
  { key: "final_review", title: "Final Review" },
] as const;

export type PracticeManagerFilter =
  | "all"
  | "needs_provider_number"
  | "needs_website_profile"
  | "pending_documents"
  | "pending_review"
  | "ready_to_start"
  | "active_gps";

export function isGpReadinessPackageStatus(value: string): value is GpReadinessPackageStatus {
  return value in GP_READINESS_STATUS_LABEL;
}

export function isGpRecruitmentSource(value: string): value is GpRecruitmentSource {
  return value in GP_RECRUITMENT_SOURCE_LABEL;
}

const ALLOWED_TRANSITIONS: Record<GpReadinessPackageStatus, GpReadinessPackageStatus[]> = {
  new_lead: ["confidential_discussion", "recruitment_review", "on_hold", "not_proceeding"],
  confidential_discussion: ["recruitment_review", "applicant", "on_hold", "not_proceeding"],
  recruitment_review: ["applicant", "confidential_discussion", "on_hold", "not_proceeding"],
  applicant: [
    "onboarding_candidate",
    "provider_number_support",
    "website_profile_preparation",
    "on_hold",
    "not_proceeding",
  ],
  onboarding_candidate: [
    "provider_number_support",
    "website_profile_preparation",
    "offer_extended",
    "on_hold",
    "not_proceeding",
  ],
  provider_number_support: [
    "website_profile_preparation",
    "onboarding_candidate",
    "offer_extended",
    "on_hold",
    "not_proceeding",
  ],
  website_profile_preparation: [
    "provider_number_support",
    "offer_extended",
    "ready_to_start",
    "on_hold",
    "not_proceeding",
  ],
  offer_extended: ["ready_to_start", "on_hold", "not_proceeding"],
  ready_to_start: ["active_gp", "on_hold", "not_proceeding"],
  active_gp: ["on_hold", "not_proceeding"],
  on_hold: [
    "new_lead",
    "confidential_discussion",
    "recruitment_review",
    "applicant",
    "onboarding_candidate",
    "provider_number_support",
    "website_profile_preparation",
    "offer_extended",
    "ready_to_start",
    "not_proceeding",
  ],
  not_proceeding: ["new_lead", "on_hold"],
};

export type RecruitmentPackageFilters = {
  q?: string;
  status?: GpReadinessPackageStatus | "all";
  source?: GpRecruitmentSource | "all";
  pmFilter?: PracticeManagerFilter;
};

function packageWhere(clinicId: string, filters: RecruitmentPackageFilters = {}): Prisma.GpReadinessPackageWhereInput {
  const and: Prisma.GpReadinessPackageWhereInput[] = [{ clinicId }];
  if (filters.status && filters.status !== "all") and.push({ status: filters.status });
  if (filters.source && filters.source !== "all") and.push({ recruitmentSource: filters.source });
  if (filters.q?.trim()) {
    const q = filters.q.trim();
    and.push({
      OR: [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
        { mobile: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  switch (filters.pmFilter) {
    case "needs_provider_number":
      and.push({
        OR: [
          { status: "provider_number_support" },
          { providerNumberPath: "additional" },
          {
            providerReadinessJson: {
              path: ["medicareProviderNumber"],
              equals: "need_assistance",
            },
          },
        ],
      });
      break;
    case "needs_website_profile":
      and.push({
        OR: [
          { status: "website_profile_preparation" },
          { doctorProfileDraft: { completenessScore: { lt: 70 } } },
          { doctorProfileDraft: null },
        ],
      });
      break;
    case "pending_documents":
      and.push({ documentsJson: { equals: [] } });
      break;
    case "pending_review":
      and.push({
        status: { in: ["new_lead", "confidential_discussion", "recruitment_review", "applicant"] },
      });
      break;
    case "ready_to_start":
      and.push({ status: "ready_to_start" });
      break;
    case "active_gps":
      and.push({ status: "active_gp" });
      break;
    default:
      break;
  }

  return { AND: and };
}

export async function listRecruitmentPackages(clinicId: string, filters: RecruitmentPackageFilters = {}) {
  return prisma.gpReadinessPackage.findMany({
    where: packageWhere(clinicId, filters),
    orderBy: [{ statusChangedAt: "desc" }, { submittedAt: "desc" }],
    take: 250,
    include: {
      doctorProfileDraft: {
        select: { id: true, completenessScore: true, status: true, preferredPublishedName: true },
      },
      _count: { select: { notes: true, tasks: true } },
    },
  });
}

export async function recruitmentDashboardStats(clinicId: string) {
  const groups = await prisma.gpReadinessPackage.groupBy({
    by: ["status"],
    where: { clinicId },
    _count: { _all: true },
  });
  const counts = Object.fromEntries(
    GP_READINESS_STATUS_OPTIONS.map(([status]) => [status, 0]),
  ) as Record<GpReadinessPackageStatus, number>;
  for (const row of groups) counts[row.status] = row._count._all;
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

  const funnel = {
    portalSubmission: total,
    discussion: counts.confidential_discussion + counts.recruitment_review,
    applicant: counts.applicant,
    onboarding:
      counts.onboarding_candidate +
      counts.provider_number_support +
      counts.website_profile_preparation +
      counts.offer_extended +
      counts.ready_to_start,
    activeGp: counts.active_gp,
    offersExtended: counts.offer_extended,
  };

  return { total, counts, funnel };
}

export async function getRecruitmentPackage(clinicId: string, id: string) {
  return prisma.gpReadinessPackage.findFirst({
    where: { clinicId, id },
    include: {
      doctorProfileDraft: true,
      notes: { orderBy: { createdAt: "desc" }, take: 100 },
      tasks: {
        orderBy: [{ status: "asc" }, { dueAt: "asc" }, { createdAt: "desc" }],
        include: {
          assignedTo: { select: { id: true, name: true, email: true, username: true } },
          createdBy: { select: { id: true, name: true, email: true, username: true } },
        },
      },
      statusAudits: { orderBy: { createdAt: "desc" }, take: 100 },
      enquiry: { select: { id: true, status: true, doctorDisplayName: true } },
    },
  });
}

export function packageProfileCompleteness(packageRow: {
  payloadJson: unknown;
  documentsJson: unknown;
  doctorProfileDraft?: {
    biography: string;
    qualifications: string[];
    languages: string[];
    specialInterests: string[];
    headshotPath: string | null;
    shortIntroduction: string;
    preferredPublishedName: string;
    memberships: string[];
    completenessScore: number;
  } | null;
}) {
  if (packageRow.doctorProfileDraft) {
    return scoreDoctorProfileCompleteness(packageRow.doctorProfileDraft);
  }
  const payload =
    packageRow.payloadJson && typeof packageRow.payloadJson === "object"
      ? (packageRow.payloadJson as Record<string, unknown>)
      : {};
  const website =
    payload.websiteProfile && typeof payload.websiteProfile === "object"
      ? (payload.websiteProfile as Record<string, unknown>)
      : {};
  const docs = Array.isArray(packageRow.documentsJson) ? packageRow.documentsJson : [];
  const headshot = docs.find(
    (doc) => doc && typeof doc === "object" && (doc as { key?: string }).key === "headshot",
  );
  return scoreDoctorProfileCompleteness({
    biography: String(website.biography || ""),
    shortIntroduction: String(website.shortIntroduction || ""),
    preferredPublishedName: String(website.preferredPublishedName || ""),
    qualifications: Array.isArray(website.qualifications)
      ? (website.qualifications as string[])
      : String(website.qualifications || "")
          .split(/[,;\n]+/)
          .map((s) => s.trim())
          .filter(Boolean),
    specialInterests: Array.isArray(website.specialInterests)
      ? (website.specialInterests as string[])
      : [],
    languages: Array.isArray(website.languagesSpoken)
      ? (website.languagesSpoken as string[])
      : Array.isArray(website.languages)
        ? (website.languages as string[])
        : String(website.languagesSpoken || "")
            .split(/[,;\n]+/)
            .map((s) => s.trim())
            .filter(Boolean),
    memberships: Array.isArray(website.memberships) ? (website.memberships as string[]) : [],
    headshotPath: headshot ? "present" : null,
  });
}

export async function transitionRecruitmentPackageStatus(input: {
  clinicId: string;
  packageId: string;
  toStatus: GpReadinessPackageStatus;
  actorUserId?: string | null;
  actorName?: string | null;
  note?: string;
}) {
  const current = await prisma.gpReadinessPackage.findFirst({
    where: { id: input.packageId, clinicId: input.clinicId },
  });
  if (!current) throw new Error("Readiness package not found.");
  const allowed = ALLOWED_TRANSITIONS[current.status] || [];
  if (current.status !== input.toStatus && !allowed.includes(input.toStatus)) {
    throw new Error(`Cannot move from ${current.status} to ${input.toStatus}.`);
  }

  const updated = await prisma.gpReadinessPackage.update({
    where: { id: current.id },
    data: {
      status: input.toStatus,
      statusChangedAt: new Date(),
    },
  });
  await prisma.gpReadinessPackageStatusAudit.create({
    data: {
      packageId: current.id,
      fromStatus: current.status,
      toStatus: input.toStatus,
      actorUserId: input.actorUserId || null,
      actorName: input.actorName || null,
      note: input.note || null,
    },
  });
  return updated;
}

export async function updateRecruitmentPackageMeta(input: {
  clinicId: string;
  packageId: string;
  recruitmentSource?: GpRecruitmentSource | null;
}) {
  const current = await prisma.gpReadinessPackage.findFirst({
    where: { id: input.packageId, clinicId: input.clinicId },
  });
  if (!current) throw new Error("Readiness package not found.");
  return prisma.gpReadinessPackage.update({
    where: { id: current.id },
    data: {
      recruitmentSource:
        input.recruitmentSource === undefined ? current.recruitmentSource : input.recruitmentSource,
    },
  });
}

export async function addRecruitmentPackageNote(input: {
  clinicId: string;
  packageId: string;
  authorUserId: string;
  authorName?: string | null;
  body: string;
}) {
  const current = await prisma.gpReadinessPackage.findFirst({
    where: { id: input.packageId, clinicId: input.clinicId },
    select: { id: true },
  });
  if (!current) throw new Error("Readiness package not found.");
  const body = input.body.trim();
  if (!body) throw new Error("Note body is required.");
  return prisma.gpReadinessPackageNote.create({
    data: {
      packageId: current.id,
      authorUserId: input.authorUserId,
      authorName: input.authorName || null,
      body,
    },
  });
}

export async function createRecruitmentPackageTask(input: {
  clinicId: string;
  packageId: string;
  title: string;
  taskKey?: string | null;
  assignedToUserId?: string | null;
  createdByUserId?: string | null;
  dueAt?: Date | null;
  notes?: string | null;
}) {
  const current = await prisma.gpReadinessPackage.findFirst({
    where: { id: input.packageId, clinicId: input.clinicId },
    select: { id: true },
  });
  if (!current) throw new Error("Readiness package not found.");
  const title = input.title.trim();
  if (!title) throw new Error("Task title is required.");
  return prisma.gpReadinessPackageTask.create({
    data: {
      packageId: current.id,
      title,
      taskKey: input.taskKey || null,
      assignedToUserId: input.assignedToUserId || null,
      createdByUserId: input.createdByUserId || null,
      dueAt: input.dueAt || null,
      notes: input.notes || null,
    },
  });
}

export async function updateRecruitmentPackageTask(input: {
  clinicId: string;
  taskId: string;
  status?: GpReadinessPackageTaskStatus;
  assignedToUserId?: string | null;
  dueAt?: Date | null;
  notes?: string | null;
  title?: string;
}) {
  const task = await prisma.gpReadinessPackageTask.findFirst({
    where: { id: input.taskId, package: { clinicId: input.clinicId } },
  });
  if (!task) throw new Error("Task not found.");

  const data: Prisma.GpReadinessPackageTaskUpdateInput = {};
  if (input.title != null) data.title = input.title.trim();
  if (input.notes !== undefined) data.notes = input.notes;
  if (input.dueAt !== undefined) data.dueAt = input.dueAt;
  if (input.assignedToUserId !== undefined) {
    data.assignedTo = input.assignedToUserId
      ? { connect: { id: input.assignedToUserId } }
      : { disconnect: true };
  }
  if (input.status) {
    data.status = input.status;
    data.completedAt = input.status === "completed" ? new Date() : null;
  }

  return prisma.gpReadinessPackageTask.update({
    where: { id: task.id },
    data,
  });
}
