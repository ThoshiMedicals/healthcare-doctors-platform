import type {
  GpDoctorProfileDraft,
  GpDoctorProfileSource,
  GpDoctorProfileStatus,
  Prisma,
  Practitioner,
} from "@prisma/client";
import { prisma } from "@/db/prisma";
import { invalidatePublicHtmlCache } from "@/documents/public-html-cache";
import type { ReadinessPackagePayload } from "./readiness-package";

export const GP_DOCTOR_PROFILE_STATUS_LABEL: Record<GpDoctorProfileStatus, string> = {
  draft: "Draft",
  awaiting_review: "Awaiting Review",
  approved: "Approved",
  published: "Published",
  archived: "Archived",
};

export const GP_DOCTOR_PROFILE_STATUS_OPTIONS = Object.entries(GP_DOCTOR_PROFILE_STATUS_LABEL) as Array<
  [GpDoctorProfileStatus, string]
>;

export type WebsiteProfilePayload = {
  title?: string;
  preferredPublishedName?: string;
  credentials?: string[] | string;
  biography?: string;
  shortIntroduction?: string;
  qualifications?: string[] | string;
  specialInterests?: string[] | string;
  languagesSpoken?: string[] | string;
  languages?: string[] | string;
  yearsPractising?: string;
  memberships?: string[] | string;
  careerHighlights?: string;
  headshotMeta?: Record<string, unknown>;
};

export type ProfileCompleteness = {
  score: number;
  missing: string[];
  checks: Record<string, boolean>;
};

function asStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/[,;\n]+/)
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return [];
}

function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function normalizeWebsiteProfile(
  raw: WebsiteProfilePayload | Record<string, unknown> | undefined,
  fallbackName?: string,
): {
  title: string;
  preferredPublishedName: string;
  credentials: string[];
  biography: string;
  shortIntroduction: string;
  qualifications: string[];
  specialInterests: string[];
  languages: string[];
  yearsPractising: string | null;
  memberships: string[];
  headshotMetaJson: Prisma.InputJsonValue | null;
} {
  const profile = (raw || {}) as WebsiteProfilePayload;
  const title = String(profile.title || "Dr").trim() || "Dr";
  const preferredPublishedName =
    String(profile.preferredPublishedName || fallbackName || "").trim() || "Unnamed GP";
  const biography = String(profile.biography || "").trim();
  const shortIntroduction = String(profile.shortIntroduction || "").trim().slice(0, 250);
  const credentials = asStringList(profile.credentials);
  const qualifications = asStringList(profile.qualifications);
  const specialInterests = asStringList(profile.specialInterests);
  const languages = asStringList(profile.languagesSpoken ?? profile.languages);
  const memberships = asStringList(profile.memberships);
  const yearsPractising = profile.yearsPractising ? String(profile.yearsPractising).trim() : null;
  const headshotMetaJson = profile.headshotMeta
    ? (profile.headshotMeta as Prisma.InputJsonValue)
    : null;

  return {
    title,
    preferredPublishedName,
    credentials: credentials.length ? credentials : qualifications.slice(0, 6),
    biography,
    shortIntroduction,
    qualifications,
    specialInterests,
    languages,
    yearsPractising,
    memberships,
    headshotMetaJson,
  };
}

export function scoreDoctorProfileCompleteness(input: {
  biography?: string | null;
  shortIntroduction?: string | null;
  preferredPublishedName?: string | null;
  qualifications?: string[] | null;
  specialInterests?: string[] | null;
  languages?: string[] | null;
  memberships?: string[] | null;
  headshotPath?: string | null;
}): ProfileCompleteness {
  const bioOk = wordCount(String(input.biography || "")) >= 80;
  const qualsOk = (input.qualifications || []).length > 0;
  const photoOk = Boolean(input.headshotPath);
  const languagesOk = (input.languages || []).length > 0;
  const interestsOk = (input.specialInterests || []).length > 0;
  const membershipsOk = (input.memberships || []).length > 0;
  const shortOk = String(input.shortIntroduction || "").trim().length >= 40;
  const nameOk = String(input.preferredPublishedName || "").trim().length >= 3;

  const checks = {
    biography: bioOk,
    qualifications: qualsOk,
    photo: photoOk,
    languages: languagesOk,
    specialInterests: interestsOk,
    memberships: membershipsOk,
    shortIntroduction: shortOk,
    preferredPublishedName: nameOk,
  };

  const weights: Array<[keyof typeof checks, number]> = [
    ["biography", 25],
    ["qualifications", 15],
    ["photo", 20],
    ["languages", 10],
    ["specialInterests", 10],
    ["memberships", 10],
    ["shortIntroduction", 5],
    ["preferredPublishedName", 5],
  ];

  let score = 0;
  const missing: string[] = [];
  for (const [key, weight] of weights) {
    if (checks[key]) score += weight;
    else missing.push(key);
  }

  return { score, missing, checks };
}

const ALLOWED_TRANSITIONS: Record<GpDoctorProfileStatus, GpDoctorProfileStatus[]> = {
  draft: ["awaiting_review", "archived"],
  awaiting_review: ["draft", "approved", "archived"],
  approved: ["awaiting_review", "published", "draft", "archived"],
  published: ["archived", "approved"],
  archived: ["draft"],
};

export function isGpDoctorProfileStatus(value: string): value is GpDoctorProfileStatus {
  return value in GP_DOCTOR_PROFILE_STATUS_LABEL;
}

export async function upsertDoctorProfileFromPackage(input: {
  clinicId: string;
  readinessPackageId: string;
  payload: ReadinessPackagePayload;
  headshotPath?: string | null;
  enquiryId?: string | null;
}): Promise<GpDoctorProfileDraft> {
  const personal = input.payload.personal || {};
  const professional = input.payload.professional || {};
  const fallbackName = `${String(personal.firstName || "").trim()} ${String(personal.lastName || "").trim()}`.trim();
  const website = normalizeWebsiteProfile(
    {
      ...(input.payload.websiteProfile || {}),
      yearsPractising:
        (input.payload.websiteProfile as WebsiteProfilePayload | undefined)?.yearsPractising ||
        String((professional as { yearsPractising?: string }).yearsPractising || ""),
      specialInterests:
        (input.payload.websiteProfile as WebsiteProfilePayload | undefined)?.specialInterests ||
        (professional as { specialInterests?: string[] }).specialInterests,
    },
    fallbackName ? `Dr ${fallbackName}` : undefined,
  );

  const headshotPath = input.headshotPath || null;
  const completeness = scoreDoctorProfileCompleteness({
    ...website,
    headshotPath,
  });
  const status: GpDoctorProfileStatus = completeness.score >= 70 ? "awaiting_review" : "draft";

  const existing = await prisma.gpDoctorProfileDraft.findUnique({
    where: { readinessPackageId: input.readinessPackageId },
  });

  const data = {
    clinicId: input.clinicId,
    readinessPackageId: input.readinessPackageId,
    enquiryId: input.enquiryId ?? undefined,
    source: "portal_submission" as GpDoctorProfileSource,
    status,
    title: website.title,
    preferredPublishedName: website.preferredPublishedName,
    credentials: website.credentials,
    biography: website.biography,
    shortIntroduction: website.shortIntroduction,
    qualifications: website.qualifications,
    specialInterests: website.specialInterests,
    languages: website.languages,
    yearsPractising: website.yearsPractising,
    memberships: website.memberships,
    headshotPath,
    headshotMetaJson: website.headshotMetaJson ?? undefined,
    completenessScore: completeness.score,
    submittedAt: status === "awaiting_review" ? new Date() : existing?.submittedAt ?? null,
  };

  if (existing) {
    const updated = await prisma.gpDoctorProfileDraft.update({
      where: { id: existing.id },
      data,
    });
    if (existing.status !== status) {
      await prisma.gpDoctorProfileStatusAudit.create({
        data: {
          profileId: existing.id,
          fromStatus: existing.status,
          toStatus: status,
          actorName: "portal",
          note: "Updated from GP Readiness portal submission",
        },
      });
    }
    return updated;
  }

  const created = await prisma.gpDoctorProfileDraft.create({ data });
  await prisma.gpDoctorProfileStatusAudit.create({
    data: {
      profileId: created.id,
      fromStatus: null,
      toStatus: status,
      actorName: "portal",
      note: "Created from GP Readiness portal submission",
    },
  });
  return created;
}

export async function listDoctorProfiles(clinicId: string, filters?: { status?: string; q?: string }) {
  const status =
    filters?.status && filters.status !== "all" && isGpDoctorProfileStatus(filters.status)
      ? filters.status
      : undefined;
  const q = filters?.q?.trim();
  return prisma.gpDoctorProfileDraft.findMany({
    where: {
      clinicId,
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { preferredPublishedName: { contains: q, mode: "insensitive" } },
              { biography: { contains: q, mode: "insensitive" } },
              { shortIntroduction: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ updatedAt: "desc" }],
    take: 200,
    include: {
      practitioner: { select: { id: true, slug: true, name: true, status: true } },
      readinessPackage: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
  });
}

export async function doctorProfileDashboardStats(clinicId: string) {
  const groups = await prisma.gpDoctorProfileDraft.groupBy({
    by: ["status"],
    where: { clinicId },
    _count: { _all: true },
  });
  const counts = Object.fromEntries(
    GP_DOCTOR_PROFILE_STATUS_OPTIONS.map(([status]) => [status, 0]),
  ) as Record<GpDoctorProfileStatus, number>;
  for (const row of groups) {
    counts[row.status] = row._count._all;
  }
  return {
    total: Object.values(counts).reduce((sum, n) => sum + n, 0),
    ...counts,
  };
}

export async function getDoctorProfile(clinicId: string, id: string) {
  return prisma.gpDoctorProfileDraft.findFirst({
    where: { clinicId, id },
    include: {
      practitioner: { select: { id: true, slug: true, name: true, status: true, pageId: true } },
      readinessPackage: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          mobile: true,
          submittedAt: true,
        },
      },
      statusAudits: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
}

export async function updateDoctorProfileFields(input: {
  clinicId: string;
  profileId: string;
  patch: Partial<{
    title: string;
    preferredPublishedName: string;
    credentials: string[];
    biography: string;
    shortIntroduction: string;
    qualifications: string[];
    specialInterests: string[];
    languages: string[];
    yearsPractising: string | null;
    memberships: string[];
    reviewNotes: string | null;
    practitionerId: string | null;
  }>;
}) {
  const current = await prisma.gpDoctorProfileDraft.findFirst({
    where: { id: input.profileId, clinicId: input.clinicId },
  });
  if (!current) throw new Error("Profile draft not found.");

  const next = {
    title: input.patch.title ?? current.title,
    preferredPublishedName: input.patch.preferredPublishedName ?? current.preferredPublishedName,
    credentials: input.patch.credentials ?? current.credentials,
    biography: input.patch.biography ?? current.biography,
    shortIntroduction: (input.patch.shortIntroduction ?? current.shortIntroduction).slice(0, 250),
    qualifications: input.patch.qualifications ?? current.qualifications,
    specialInterests: input.patch.specialInterests ?? current.specialInterests,
    languages: input.patch.languages ?? current.languages,
    yearsPractising:
      input.patch.yearsPractising === undefined ? current.yearsPractising : input.patch.yearsPractising,
    memberships: input.patch.memberships ?? current.memberships,
    reviewNotes: input.patch.reviewNotes === undefined ? current.reviewNotes : input.patch.reviewNotes,
    practitionerId:
      input.patch.practitionerId === undefined ? current.practitionerId : input.patch.practitionerId,
  };

  const completeness = scoreDoctorProfileCompleteness({
    ...next,
    headshotPath: current.headshotPath,
  });

  return prisma.gpDoctorProfileDraft.update({
    where: { id: current.id },
    data: {
      ...next,
      completenessScore: completeness.score,
    },
  });
}

export async function transitionDoctorProfileStatus(input: {
  clinicId: string;
  profileId: string;
  toStatus: GpDoctorProfileStatus;
  actorUserId?: string | null;
  actorName?: string | null;
  note?: string;
}) {
  const current = await prisma.gpDoctorProfileDraft.findFirst({
    where: { id: input.profileId, clinicId: input.clinicId },
  });
  if (!current) throw new Error("Profile draft not found.");
  const allowed = ALLOWED_TRANSITIONS[current.status] || [];
  if (!allowed.includes(input.toStatus)) {
    throw new Error(`Cannot move from ${current.status} to ${input.toStatus}.`);
  }

  const stamp: Prisma.GpDoctorProfileDraftUpdateInput = {
    status: input.toStatus,
    reviewNotes: input.note ?? current.reviewNotes,
  };
  if (input.toStatus === "awaiting_review") stamp.submittedAt = new Date();
  if (input.toStatus === "approved") stamp.approvedAt = new Date();
  if (input.toStatus === "published") stamp.publishedAt = new Date();
  if (input.toStatus === "archived") stamp.archivedAt = new Date();
  if (input.toStatus === "draft") {
    stamp.submittedAt = current.submittedAt;
  }

  const updated = await prisma.gpDoctorProfileDraft.update({
    where: { id: current.id },
    data: stamp,
  });
  await prisma.gpDoctorProfileStatusAudit.create({
    data: {
      profileId: current.id,
      fromStatus: current.status,
      toStatus: input.toStatus,
      actorUserId: input.actorUserId || null,
      actorName: input.actorName || null,
      note: input.note || null,
    },
  });
  return updated;
}

export async function importDoctorProfileFromPractitioner(input: {
  clinicId: string;
  practitionerId: string;
  actorUserId?: string | null;
  actorName?: string | null;
}): Promise<GpDoctorProfileDraft> {
  const practitioner = await prisma.practitioner.findFirst({
    where: { id: input.practitionerId, clinicId: input.clinicId },
  });
  if (!practitioner) throw new Error("Practitioner not found.");

  const payload =
    practitioner.publishedPayload && typeof practitioner.publishedPayload === "object"
      ? (practitioner.publishedPayload as Record<string, unknown>)
      : {};

  const biography = String(payload.biography || practitioner.biography || "");
  const qualifications = asStringList(payload.qualifications ?? practitioner.qualifications);
  const languages = asStringList(payload.languages ?? practitioner.languages);
  const specialInterests = asStringList(
    payload.professionalInterests ?? practitioner.professionalInterests,
  );
  const preferredPublishedName = String(payload.name || practitioner.name || "").trim();
  const title = preferredPublishedName.startsWith("A/Prof")
    ? "A/Prof"
    : preferredPublishedName.startsWith("Prof")
      ? "Prof"
      : "Dr";

  const completeness = scoreDoctorProfileCompleteness({
    biography,
    shortIntroduction: biography.slice(0, 250),
    preferredPublishedName,
    qualifications,
    specialInterests,
    languages,
    memberships: [],
    headshotPath: practitioner.portraitPath,
  });

  const created = await prisma.gpDoctorProfileDraft.create({
    data: {
      clinicId: input.clinicId,
      practitionerId: practitioner.id,
      source: "practitioner_import",
      status: "draft",
      title,
      preferredPublishedName,
      credentials: qualifications.slice(0, 6),
      biography,
      shortIntroduction: biography.slice(0, 250),
      qualifications,
      specialInterests,
      languages,
      memberships: [],
      headshotPath: practitioner.portraitPath,
      completenessScore: completeness.score,
    },
  });

  await prisma.gpDoctorProfileStatusAudit.create({
    data: {
      profileId: created.id,
      fromStatus: null,
      toStatus: "draft",
      actorUserId: input.actorUserId || null,
      actorName: input.actorName || null,
      note: `Imported from practitioner ${practitioner.slug}`,
    },
  });

  return created;
}

export async function seedNamedProfileStubs(clinicId: string): Promise<GpDoctorProfileDraft[]> {
  // Prefer live practitioner_import drafts created by onboard scripts; only seed placeholders
  // when no import/draft exists yet for that published name.
  const stubs = [
    {
      preferredPublishedName: "Dr Golnar Mortezaei",
      title: "Dr",
      shortIntroduction: "General practitioner joining the Woolloongabba Medical Centre team.",
      biography:
        "Dr Golnar Mortezaei is a general practitioner preparing her Woolloongabba Medical Centre profile. This seed draft supports the Professional Profile Builder migration workflow until a full portal submission is received.",
      languages: ["English", "Persian"],
      specialInterests: ["Family Medicine", "Women's Health", "Preventive Health"],
      qualifications: ["MBBS", "FRACGP"],
      memberships: ["RACGP"],
    },
    {
      preferredPublishedName: "Dr James",
      title: "Dr",
      shortIntroduction: "General practitioner draft profile for Healthcare Doctors network publishing.",
      biography:
        "Dr James is a seeded migration example for the GP Readiness Professional Profile Builder. Staff can review, update, and republish through the same workflow used for portal submissions.",
      languages: ["English"],
      specialInterests: ["Family Medicine", "Men's Health", "Chronic Disease Management"],
      qualifications: ["MBBS"],
      memberships: ["RACGP", "AMA"],
    },
  ];

  const created: GpDoctorProfileDraft[] = [];
  for (const stub of stubs) {
    const imported = await prisma.gpDoctorProfileDraft.findFirst({
      where: {
        clinicId,
        source: "practitioner_import",
        OR: [
          { preferredPublishedName: stub.preferredPublishedName },
          {
            preferredPublishedName: {
              startsWith: stub.preferredPublishedName === "Dr James" ? "Dr James" : stub.preferredPublishedName,
            },
          },
        ],
      },
    });
    if (imported) {
      created.push(imported);
      continue;
    }
    const existing = await prisma.gpDoctorProfileDraft.findFirst({
      where: {
        clinicId,
        source: "manual_seed",
        preferredPublishedName: stub.preferredPublishedName,
      },
    });
    if (existing) {
      created.push(existing);
      continue;
    }
    const completeness = scoreDoctorProfileCompleteness(stub);
    const row = await prisma.gpDoctorProfileDraft.create({
      data: {
        clinicId,
        source: "manual_seed",
        status: "draft",
        title: stub.title,
        preferredPublishedName: stub.preferredPublishedName,
        credentials: stub.qualifications,
        biography: stub.biography,
        shortIntroduction: stub.shortIntroduction,
        qualifications: stub.qualifications,
        specialInterests: stub.specialInterests,
        languages: stub.languages,
        memberships: stub.memberships,
        completenessScore: completeness.score,
      },
    });
    await prisma.gpDoctorProfileStatusAudit.create({
      data: {
        profileId: row.id,
        fromStatus: null,
        toStatus: "draft",
        actorName: "system",
        note: "Manual seed for profile migration examples",
      },
    });
    created.push(row);
  }
  return created;
}

export async function publishDoctorProfileToPractitioner(input: {
  clinicId: string;
  profileId: string;
  actorUserId?: string | null;
  actorName?: string | null;
}): Promise<{ profile: GpDoctorProfileDraft; practitioner: Practitioner }> {
  const profile = await prisma.gpDoctorProfileDraft.findFirst({
    where: { id: input.profileId, clinicId: input.clinicId },
  });
  if (!profile) throw new Error("Profile draft not found.");
  if (profile.status !== "approved" && profile.status !== "published") {
    throw new Error("Profile must be approved before publishing to a practitioner page.");
  }
  if (!profile.practitionerId) {
    throw new Error("Link a Practitioner (with an existing doctor page) before publishing.");
  }

  const practitioner = await prisma.practitioner.findFirst({
    where: { id: profile.practitionerId, clinicId: input.clinicId },
  });
  if (!practitioner) throw new Error("Linked practitioner not found.");
  if (!practitioner.pageId) {
    throw new Error("Linked practitioner has no public page yet — cannot publish overlay.");
  }

  const publishedPayload = {
    name: profile.preferredPublishedName,
    sourceName: practitioner.name,
    biography: profile.biography,
    qualifications: profile.qualifications.length ? profile.qualifications : profile.credentials,
    languages: profile.languages,
    professionalInterests: profile.specialInterests,
    areasOfCare: profile.specialInterests.slice(0, 6),
    portraitFile: profile.headshotPath || practitioner.portraitPath || null,
    sourcePortraitFile: practitioner.portraitPath || null,
    bookingUrl: practitioner.bookingUrl || null,
    sourceBookingUrl: practitioner.bookingUrl || null,
    profileText: profile.shortIntroduction || null,
  };

  const updatedPractitioner = await prisma.practitioner.update({
    where: { id: practitioner.id },
    data: {
      name: profile.preferredPublishedName,
      role: profile.title === "Other" ? practitioner.role : profile.title,
      biography: profile.biography,
      qualifications: profile.qualifications.length ? profile.qualifications : profile.credentials,
      languages: profile.languages,
      professionalInterests: profile.specialInterests,
      portraitPath: profile.headshotPath || practitioner.portraitPath,
      publishedPayload: publishedPayload as Prisma.InputJsonValue,
      status: "published",
    },
  });

  const updatedProfile =
    profile.status === "published"
      ? profile
      : await transitionDoctorProfileStatus({
          clinicId: input.clinicId,
          profileId: profile.id,
          toStatus: "published",
          actorUserId: input.actorUserId,
          actorName: input.actorName,
          note: `Published to practitioner ${practitioner.slug}`,
        });

  invalidatePublicHtmlCache(input.clinicId);
  return { profile: updatedProfile, practitioner: updatedPractitioner };
}

export type ProfileExportKind = "website" | "booking" | "announcement";

export function buildDoctorProfileExport(
  profile: GpDoctorProfileDraft,
  kind: ProfileExportKind,
): { filename: string; markdown: string; json: Record<string, unknown> } {
  const base = {
    preferredPublishedName: profile.preferredPublishedName,
    title: profile.title,
    credentials: profile.credentials,
    qualifications: profile.qualifications,
    shortIntroduction: profile.shortIntroduction,
    biography: profile.biography,
    specialInterests: profile.specialInterests,
    languages: profile.languages,
    memberships: profile.memberships,
    yearsPractising: profile.yearsPractising,
    headshotPath: profile.headshotPath,
    completenessScore: profile.completenessScore,
    status: profile.status,
  };

  if (kind === "booking") {
    const json = {
      kind: "booking_profile_package",
      name: profile.preferredPublishedName,
      credentials: profile.credentials,
      shortIntroduction: profile.shortIntroduction,
      languages: profile.languages,
      specialInterests: profile.specialInterests,
    };
    const markdown = [
      `# Booking Profile Package — ${profile.preferredPublishedName}`,
      "",
      `**Name:** ${profile.preferredPublishedName}`,
      `**Credentials:** ${profile.credentials.join(", ") || "—"}`,
      `**Short introduction:** ${profile.shortIntroduction || "—"}`,
      `**Languages:** ${profile.languages.join(", ") || "—"}`,
      `**Special interests:** ${profile.specialInterests.join(", ") || "—"}`,
      "",
      "_Paste into HotDoc / booking profile fields. No live HotDoc API sync._",
    ].join("\n");
    return {
      filename: `booking-profile-${slugify(profile.preferredPublishedName)}.md`,
      markdown,
      json,
    };
  }

  if (kind === "announcement") {
    const excerpt = profile.biography.trim().slice(0, 420);
    const json = {
      kind: "new_doctor_announcement_package",
      name: profile.preferredPublishedName,
      shortIntroduction: profile.shortIntroduction,
      biographyExcerpt: excerpt,
      specialInterests: profile.specialInterests,
      languages: profile.languages,
    };
    const markdown = [
      `# New Doctor Announcement — ${profile.preferredPublishedName}`,
      "",
      profile.shortIntroduction || "",
      "",
      excerpt,
      "",
      `**Interests:** ${profile.specialInterests.join(", ") || "—"}`,
      `**Languages:** ${profile.languages.join(", ") || "—"}`,
    ].join("\n");
    return {
      filename: `new-doctor-announcement-${slugify(profile.preferredPublishedName)}.md`,
      markdown,
      json,
    };
  }

  const json = { kind: "website_profile_package", ...base };
  const markdown = [
    `# Website Profile Package — ${profile.preferredPublishedName}`,
    "",
    `**Title:** ${profile.title}`,
    `**Credentials:** ${profile.credentials.join(", ") || "—"}`,
    `**Qualifications:** ${profile.qualifications.join(", ") || "—"}`,
    `**Languages:** ${profile.languages.join(", ") || "—"}`,
    `**Special interests:** ${profile.specialInterests.join(", ") || "—"}`,
    `**Memberships:** ${profile.memberships.join(", ") || "—"}`,
    `**Years practising:** ${profile.yearsPractising || "—"}`,
    `**Headshot path:** ${profile.headshotPath || "—"}`,
    "",
    "## Short introduction",
    profile.shortIntroduction || "—",
    "",
    "## Biography",
    profile.biography || "—",
  ].join("\n");

  return {
    filename: `website-profile-${slugify(profile.preferredPublishedName)}.md`,
    markdown,
    json,
  };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "doctor";
}
