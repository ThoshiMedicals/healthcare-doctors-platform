import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { CareerApplicationStatus, Prisma } from "@prisma/client";
import { prisma } from "@/db/prisma";

export const CAREER_APPLICATION_STATUS_LABEL: Record<CareerApplicationStatus, string> = {
  new: "New",
  reviewing: "Reviewing",
  interview: "Interview",
  offer: "Offer",
  hired: "Hired",
  rejected: "Rejected",
  closed: "Closed",
};

export const CAREER_APPLICATION_STATUS_OPTIONS = Object.entries(CAREER_APPLICATION_STATUS_LABEL) as Array<
  [CareerApplicationStatus, string]
>;

export const OPEN_APPLICATION_STATUSES: CareerApplicationStatus[] = ["new", "reviewing", "interview", "offer"];

export const RESUME_MAX_BYTES = 5 * 1024 * 1024;
export const RESUME_ALLOWED_EXTENSIONS = new Set([".pdf", ".doc", ".docx"]);
export const RESUME_ALLOWED_MIME = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

/** Prefer CAREER_RESUME_DIR outside the Hostinger release tree; default keeps local behaviour. */
export function careersStorageRoot(): string {
  const configured = process.env.CAREER_RESUME_DIR?.trim();
  return configured ? path.resolve(configured) : path.join(process.cwd(), "storage", "career-resumes");
}

export function isCareerApplicationStatus(value: string): value is CareerApplicationStatus {
  return value in CAREER_APPLICATION_STATUS_LABEL;
}

export function resumeAbsolutePath(storagePath: string): string {
  const root = careersStorageRoot();
  const resolved = path.resolve(root, storagePath);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    throw new Error("Invalid resume path.");
  }
  return resolved;
}

function safeFileName(original: string): string {
  const base = path.basename(original).replace(/[^\w.\-()+ ]+/g, "_").trim() || "resume";
  return base.slice(0, 120);
}

function extensionOf(fileName: string): string {
  return path.extname(fileName).toLowerCase();
}

export function assertAllowedResume(file: { name: string; type: string; size: number }): string {
  if (file.size <= 0) throw new Error("Resume file is empty.");
  if (file.size > RESUME_MAX_BYTES) throw new Error("Resume must be 5 MB or smaller.");
  const ext = extensionOf(file.name);
  if (!RESUME_ALLOWED_EXTENSIONS.has(ext)) throw new Error("Resume must be a PDF or Word document.");
  if (file.type && !RESUME_ALLOWED_MIME.has(file.type) && file.type !== "application/octet-stream") {
    throw new Error("Resume must be a PDF or Word document.");
  }
  return ext;
}

export async function storeCareerResume(input: {
  clinicId: string;
  applicationId: string;
  fileName: string;
  mimeType: string;
  bytes: Buffer;
}): Promise<{ storagePath: string; fileName: string; mimeType: string; sizeBytes: number }> {
  const fileName = safeFileName(input.fileName);
  assertAllowedResume({ name: fileName, type: input.mimeType, size: input.bytes.length });
  if (fileName.toLowerCase().endsWith(".pdf") && !input.bytes.subarray(0, 5).equals(Buffer.from("%PDF-"))) {
    throw new Error("Resume PDF content is invalid.");
  }

  const { putPrivateObject, privateObjectStoreMode } = await import("@/storage/private-object-store");
  if (privateObjectStoreMode() === "postgres") {
    return putPrivateObject({
      clinicId: input.clinicId,
      purpose: "career_resume",
      fileName,
      mimeType: input.mimeType || "application/octet-stream",
      bytes: input.bytes,
    });
  }

  const relativeDir = path.join(input.clinicId, input.applicationId);
  const absoluteDir = path.join(careersStorageRoot(), relativeDir);
  await mkdir(absoluteDir, { recursive: true });
  const absoluteFile = path.join(absoluteDir, fileName);
  await writeFile(absoluteFile, input.bytes);
  return {
    storagePath: path.join(relativeDir, fileName).replaceAll("\\", "/"),
    fileName,
    mimeType: input.mimeType || "application/octet-stream",
    sizeBytes: input.bytes.length,
  };
}

export type CareerApplicationDashboardStats = {
  openVacancies: number;
  newApplications: number;
  applicationsToday: number;
  awaitingReview: number;
  interviews: number;
  hiredThisMonth: number;
};

export async function careerApplicationDashboardStats(
  clinicId: string,
  now = new Date(),
): Promise<CareerApplicationDashboardStats> {
  const startOfDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  const [openVacancies, newApplications, applicationsToday, awaitingReview, interviews, hiredThisMonth] =
    await Promise.all([
      prisma.vacancy.count({
        where: { clinicId, active: true, status: { not: "closed" } },
      }),
      prisma.careerApplication.count({ where: { clinicId, status: "new" } }),
      prisma.careerApplication.count({
        where: { clinicId, createdAt: { gte: startOfDay } },
      }),
      prisma.careerApplication.count({
        where: { clinicId, status: { in: ["new", "reviewing"] } },
      }),
      prisma.careerApplication.count({ where: { clinicId, status: "interview" } }),
      prisma.careerApplication.count({
        where: { clinicId, status: "hired", updatedAt: { gte: startOfMonth } },
      }),
    ]);
  return {
    openVacancies,
    newApplications,
    applicationsToday,
    awaitingReview,
    interviews,
    hiredThisMonth,
  };
}

export type CareerApplicationListFilters = {
  q?: string;
  status?: CareerApplicationStatus | "all";
  vacancyId?: string | "all" | "none";
  from?: string;
  to?: string;
};

export function careerApplicationWhere(
  clinicId: string,
  filters: CareerApplicationListFilters,
): Prisma.CareerApplicationWhereInput {
  const where: Prisma.CareerApplicationWhereInput = { clinicId };
  if (filters.status && filters.status !== "all") where.status = filters.status;
  if (filters.vacancyId === "none") where.vacancyId = null;
  else if (filters.vacancyId && filters.vacancyId !== "all") where.vacancyId = filters.vacancyId;

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
      { roleInterest: { contains: q, mode: "insensitive" } },
      { message: { contains: q, mode: "insensitive" } },
      { notes: { contains: q, mode: "insensitive" } },
      { vacancy: { title: { contains: q, mode: "insensitive" } } },
    ];
  }
  return where;
}

/** Patch Talent Community form copy/attrs so live DB pages work without re-import. */
export function enhanceTalentCommunityForm(
  html: string,
  clinicSlug: string,
  practiceName = "Woolloongabba Medical Centre",
): string {
  if (!html.includes("data-talent-community-form")) return html;

  let next = html.replace(
    /<form\b[^>]*\bdata-talent-community-form(?:="")?[^>]*>/i,
    (openTag) => {
      let tag = openTag.replace(/>$/, "");
      if (/\bdata-clinic-slug=/.test(tag)) {
        tag = tag.replace(/\bdata-clinic-slug="[^"]*"/, `data-clinic-slug="${clinicSlug}"`);
      } else {
        tag += ` data-clinic-slug="${clinicSlug}"`;
      }
      if (!/\benctype=/.test(tag)) tag += ` enctype="multipart/form-data"`;
      if (!/\bmethod=/.test(tag)) tag += ` method="post"`;
      if (/\baction=/.test(tag)) {
        tag = tag.replace(/\baction="[^"]*"/, `action="/api/clinics/${clinicSlug}/career-applications"`);
      } else {
        tag += ` action="/api/clinics/${clinicSlug}/career-applications"`;
      }
      return `${tag}>`;
    },
  );

  if (!next.includes('data-talent-vacancy-field')) {
    next = next.replace(
      /(<form\b[^>]*\bdata-talent-community-form(?:="")?[^>]*>)/i,
      `$1<input type="hidden" name="vacancyId" value="" data-talent-vacancy-field="" />`,
    );
  }

  next = next.replace(
    /<p class="form-email-handoff">[\s\S]*?<\/p>/i,
    `<p class="form-email-handoff"><strong>How this works: </strong>Submit this form to register your interest with ${practiceName}. Your details and optional resume are stored securely for the practice recruitment team. You will not be added to a public job board.</p>`,
  );

  next = next.replace(
    /<span class="careers-file-hint">[\s\S]*?<\/span>/i,
    `<span class="careers-file-hint">Optional. PDF or Word document, up to 5&nbsp;MB.</span>`,
  );

  next = next.replace(
    /(<label class="form-consent"[^>]*>[\s\S]*?<span>)([\s\S]*?)(<\/span><\/label>)/i,
    `$1I understand this request is for career and contact details only, and I consent to the practice storing my details and resume for recruitment.$3`,
  );

  return next;
}
