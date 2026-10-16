"use server";

import { redirect } from "next/navigation";
import { Prisma, type DayOfWeek, type MembershipRole, type PublicationStatus } from "@prisma/client";
import { hashPassword } from "@/auth/password";
import { ASSIGNABLE_ROLES } from "@/auth/permissions";
import { writeAuditLog } from "@/cms/audit";
import { requireAction } from "@/cms/context";
import { applyArticleDocument, articleDocumentFrom, articleFromForm, readArticleDocument } from "@/cms/article-document";
import { applyServiceDocument, readServiceDocument, serviceDocumentFrom, serviceFromForm } from "@/cms/service-document";
import { applyPracticeDocument, practiceDocumentFrom, practiceFromForm, readPracticeDocument } from "@/cms/practice-document";
import { bookingUrlProblems, matchVerifiedUpload, portraitBasename, portraitProblems, readPractitionerBookingUrl, readPractitionerPortraitFile } from "@/cms/practitioner-media";
import { recordRevision } from "@/cms/revisions";
import { applyImageFiles, assetRevisionSnapshot } from "@/cms/image-replacement";
import { ImageArchiveError } from "@/cms/image-store";
import { alignRestoredSnapshot, snapshotStatus } from "@/cms/restore-sync";
import { fingerprintContent } from "@/governance/fingerprint";
import {
  governanceCompletionGaps,
  governanceStatusForRestore,
  isGovernanceCompleteStatus,
  parseGovernanceStatus,
  type GovernanceStatus,
} from "@/governance/status";
import { moveWorkflow, publishEntity, type ReleaseEntity } from "@/cms/release";
import { prisma } from "@/db/prisma";

function text(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function list(formData: FormData, key: string): string[] {
  return text(formData, key)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function jsonEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function revise(options: {
  clinicId: string;
  authorId: string;
  entityType: string;
  entityId: string;
  previous: Prisma.InputJsonValue;
  next: Prisma.InputJsonValue;
}) {
  if (jsonEqual(options.previous, options.next)) return;
  await recordRevision(options);
}

export async function saveClinicSettings(formData: FormData) {
  const { user, clinic } = await requireAction("manage_settings");
  const profile = clinic.profile;
  if (!profile) redirect("/admin/settings");

  const previous = {
    practiceName: clinic.practiceName,
    streetAddress: profile.streetAddress,
    suburb: profile.suburb,
    state: profile.state,
    postcode: profile.postcode,
    phoneDisplay: profile.phoneDisplay,
    email: profile.email,
    hotdocUrl: profile.hotdocUrl,
    billingPolicy: profile.billingPolicy,
    agpalStatus: profile.agpalStatus,
    contentStatus: profile.contentStatus,
    publishedPayload: profile.publishedPayload ?? null,
    openingHours: clinic.openingHours.map((hours) => ({
      dayOfWeek: hours.dayOfWeek,
      opens: hours.opens,
      closes: hours.closes,
    })),
  };

  const next = {
    practiceName: clinic.practiceName,
    streetAddress: text(formData, "streetAddress"),
    suburb: text(formData, "suburb"),
    state: text(formData, "state"),
    postcode: text(formData, "postcode"),
    phoneDisplay: text(formData, "phoneDisplay"),
    email: text(formData, "email"),
    hotdocUrl: text(formData, "hotdocUrl") || profile.hotdocUrl,
    billingPolicy: profile.billingPolicy,
    agpalStatus: profile.agpalStatus,
    contentStatus: "drafting" as const,
    publishedPayload: profile.publishedPayload ?? null,
    openingHours: clinic.openingHours.map((hours) => ({
      dayOfWeek: hours.dayOfWeek,
      opens: text(formData, `opens-${hours.dayOfWeek}`) || hours.opens,
      closes: text(formData, `closes-${hours.dayOfWeek}`) || hours.closes,
    })),
  };

  await prisma.clinicProfile.update({
    where: { clinicId: clinic.id },
    data: {
      streetAddress: next.streetAddress,
      suburb: next.suburb,
      state: next.state,
      postcode: next.postcode,
      phoneDisplay: next.phoneDisplay,
      email: next.email,
      hotdocUrl: next.hotdocUrl,
      contentStatus: "drafting",
    },
  });
  for (const hours of next.openingHours) {
    await prisma.openingHours.update({
      where: { clinicId_dayOfWeek: { clinicId: clinic.id, dayOfWeek: hours.dayOfWeek as DayOfWeek } },
      data: { opens: hours.opens, closes: hours.closes },
    });
  }
  await revise({
    clinicId: clinic.id,
    authorId: user.id,
    entityType: "clinic_settings",
    entityId: clinic.id,
    previous,
    next,
  });
  redirect("/admin/settings?saved=1");
}

export async function savePractitioner(formData: FormData) {
  const { user, clinic } = await requireAction("edit");
  const id = text(formData, "id");
  const current = await prisma.practitioner.findFirst({
    where: { id, clinicId: clinic.id },
    include: { page: { include: { publishedRevision: { select: { html: true } } } } },
  });
  if (!current) redirect("/admin/practitioners");
  const goldenHtml = current.page?.publishedRevision?.html ?? "";
  const sourcePortrait = readPractitionerPortraitFile(goldenHtml);
  const sourceBooking = readPractitionerBookingUrl(goldenHtml);
  const upload = formData.get("portraitUpload");
  let portraitFile = portraitBasename(text(formData, "portraitFile")) || sourcePortrait;
  if (upload instanceof File && upload.size > 0) {
    const matched = matchVerifiedUpload(Buffer.from(await upload.arrayBuffer()), sourcePortrait);
    if (!matched.file) {
      redirect(`/admin/practitioners/${id}?error=gate&reason=${encodeURIComponent(matched.problems.join(" "))}`);
    }
    portraitFile = matched.file;
  }
  const bookingUrl = text(formData, "bookingUrl") || sourceBooking;
  const problems = [
    ...portraitProblems(sourcePortrait, portraitFile),
    ...(bookingUrl === sourceBooking ? [] : bookingUrlProblems(bookingUrl)),
  ];
  if (problems.length > 0) {
    redirect(`/admin/practitioners/${id}?error=gate&reason=${encodeURIComponent(problems.join(" "))}`);
  }
  const previous = practitionerSnapshot(current);
  const next = {
    ...previous,
    name: text(formData, "name"),
    qualifications: list(formData, "qualifications"),
    biography: text(formData, "biography"),
    languages: list(formData, "languages"),
    areasOfCare: list(formData, "areasOfCare"),
    professionalInterests: list(formData, "professionalInterests"),
    portraitPath: portraitFile,
    bookingUrl,
    status: "drafting" as PublicationStatus,
  };
  await prisma.practitioner.update({
    where: { id },
    data: {
      name: next.name,
      qualifications: next.qualifications,
      biography: next.biography,
      languages: next.languages,
      areasOfCare: next.areasOfCare,
      professionalInterests: next.professionalInterests,
      portraitPath: next.portraitPath,
      bookingUrl: next.bookingUrl,
      status: next.status,
    },
  });
  await revise({ clinicId: clinic.id, authorId: user.id, entityType: "practitioner", entityId: id, previous, next });
  redirect(`/admin/practitioners/${id}?saved=1`);
}

export async function saveService(formData: FormData) {
  const { user, clinic } = await requireAction("edit");
  const id = text(formData, "id");
  const current = await prisma.service.findFirst({
    where: { id, clinicId: clinic.id },
    include: { page: { select: { path: true, publishedRevision: { select: { html: true } } } } },
  });
  if (!current) redirect("/admin/services");
  const pagePath = current.page?.path ?? "";
  const baseline = readServiceDocument(current.page?.publishedRevision?.html ?? "", pagePath);
  const document = serviceFromForm(formData, baseline);
  const structure = applyServiceDocument(current.page?.publishedRevision?.html ?? "", document, pagePath);
  if (structure.errors.length > 0) {
    redirect(`/admin/services/${id}?error=gate&reason=${encodeURIComponent(structure.errors.join(" "))}`);
  }
  const previous = serviceSnapshot(current);
  const next = {
    ...previous,
    title: document.title,
    summary: document.summary,
    document,
    status: "drafting" as const,
  };
  await prisma.service.update({
    where: { id },
    data: {
      title: document.title,
      summary: document.summary,
      status: "drafting",
      patientEducation: { document },
      faqs: document.sections.flatMap((section) => section.faqs),
      relatedPractitioners: document.sections.flatMap((section) => section.practitioners.map((practitioner) => practitioner.href)),
    },
  });
  await revise({ clinicId: clinic.id, authorId: user.id, entityType: "service", entityId: id, previous, next });
  redirect(`/admin/services/${id}?saved=1`);
}

export async function saveKnowledgeTopic(formData: FormData) {
  const { user, clinic } = await requireAction("edit");
  const id = text(formData, "id");
  const current = await prisma.knowledgeTopic.findFirst({ where: { id, clinicId: clinic.id } });
  if (!current) redirect("/admin/knowledge");
  const previous = { title: current.title, summary: current.summary, status: current.status, publishedPayload: current.publishedPayload ?? null };
  const next = {
    title: text(formData, "title"),
    summary: text(formData, "summary"),
    status: "drafting" as const,
    publishedPayload: current.publishedPayload ?? null,
  };
  await prisma.knowledgeTopic.update({
    where: { id },
    data: { title: next.title, summary: next.summary, status: "drafting" },
  });
  await revise({ clinicId: clinic.id, authorId: user.id, entityType: "knowledge_topic", entityId: id, previous, next });
  redirect(`/admin/knowledge/topics/${id}?saved=1`);
}

export async function saveKnowledgeArticle(formData: FormData) {
  const context = await requireAction("edit");
  const id = text(formData, "id");
  const current = await prisma.knowledgeArticle.findFirst({
    where: { id, clinicId: context.clinic.id },
    include: { page: { select: { path: true, publishedRevision: { select: { html: true } } } } },
  });
  if (!current) redirect("/admin/knowledge");
  const pagePath = current.page?.path ?? current.articlePath ?? "";
  const baseline = readArticleDocument(current.page?.publishedRevision?.html ?? "", pagePath);
  const document = articleFromForm(formData, baseline);
  const structure = applyArticleDocument(current.page?.publishedRevision?.html ?? "", document, pagePath);
  if (structure.errors.length > 0) {
    redirect(`/admin/knowledge/${id}?error=gate&reason=${encodeURIComponent(structure.errors.join(" "))}`);
  }
  const introduction = document.sections.find((section) => section.id === "introduction")?.paragraphs[0] ?? "";
  const previous = articleSnapshot(current);
  const next = {
    ...previous,
    title: document.title,
    summary: document.summary,
    introduction,
    document,
    category: current.category,
    status: "drafting" as const,
    contentOwner: current.contentOwner,
    nextReviewDate: document.updated || null,
  };
  await prisma.knowledgeArticle.update({
    where: { id },
    data: {
      title: next.title,
      summary: next.summary,
      status: "drafting",
      educationalContent: { introduction, document },
      faqs: document.sections.flatMap((section) => section.faqs),
      trustedSources: document.sections.flatMap((section) => section.sources),
      relatedServices: document.sections.flatMap((section) => section.services.map((service) => service.href)),
      relatedPractitioners: document.sections.flatMap((section) => section.practitioners.map((practitioner) => practitioner.href)),
      ...(document.updated ? { nextReviewDate: new Date(`${document.updated}T00:00:00.000Z`) } : {}),
    },
  });
  await revise({
    clinicId: context.clinic.id,
    authorId: context.user.id,
    entityType: "knowledge_article",
    entityId: id,
    previous,
    next,
  });
  redirect(`/admin/knowledge/${id}?saved=1`);
}

export async function saveUpdate(formData: FormData) {
  const { user, clinic } = await requireAction("edit");
  const id = text(formData, "id");
  const current = await prisma.practiceUpdate.findFirst({ where: { id, clinicId: clinic.id } });
  if (!current) redirect("/admin/updates");
  const previous = {
    title: current.title,
    summary: current.summary,
    author: current.author,
    status: current.status,
    publishedPayload: current.publishedPayload ?? null,
  };
  const next = {
    title: text(formData, "title"),
    summary: text(formData, "summary"),
    author: text(formData, "author") || null,
    status: "drafting" as const,
    publishedPayload: current.publishedPayload ?? null,
  };
  await prisma.practiceUpdate.update({
    where: { id },
    data: { title: next.title, summary: next.summary, author: next.author, status: "drafting" },
  });
  await revise({ clinicId: clinic.id, authorId: user.id, entityType: "practice_update", entityId: id, previous, next });
  redirect(`/admin/updates/${id}?saved=1`);
}

export async function savePracticePage(formData: FormData) {
  const { user, clinic } = await requireAction("edit");
  const id = text(formData, "id");
  const returnTo = text(formData, "returnTo") || "/admin/patient-information";
  const current = await prisma.practicePage.findFirst({
    where: { id, clinicId: clinic.id },
    include: { page: { select: { publishedRevision: { select: { html: true } } } } },
  });
  if (!current) redirect(returnTo);
  const baseline = readPracticeDocument(current.page?.publishedRevision?.html ?? "");
  const document = practiceFromForm(formData, baseline);
  const structure = applyPracticeDocument(current.page?.publishedRevision?.html ?? "", document);
  if (structure.errors.length > 0) {
    redirect(`${returnTo}/${id}?error=gate&reason=${encodeURIComponent(structure.errors.join(" "))}`);
  }
  const previous = practiceSnapshot(current);
  const next = {
    ...previous,
    title: document.title,
    summary: document.summary,
    contentOwner: current.contentOwner,
    document,
    status: "drafting" as const,
  };
  await prisma.practicePage.update({
    where: { id },
    data: {
      title: document.title,
      summary: document.summary,
      status: "drafting",
      sections: { document },
    },
  });
  await revise({ clinicId: clinic.id, authorId: user.id, entityType: "practice_page", entityId: id, previous, next });
  redirect(`${returnTo}/${id}?saved=1`);
}

export async function saveImageGovernance(formData: FormData) {
  const { user, clinic } = await requireAction("clinical_signoff");
  const id = text(formData, "id");
  const current = await prisma.mediaAsset.findFirst({ where: { id, clinicId: clinic.id } });
  if (!current) redirect("/admin/image-governance");
  const nextFields = {
    uploadedBy: text(formData, "uploadedBy") || null,
    approvedAt: dateOrNull(text(formData, "approvedAt")),
    photographer: text(formData, "photographer") || null,
    copyrightOwner: text(formData, "copyrightOwner") || null,
    expiresAt: dateOrNull(text(formData, "expiresAt")),
    altText: text(formData, "altText"),
  };
  const previous = assetRevisionSnapshot(current);
  const next = assetRevisionSnapshot({ ...current, ...nextFields });
  if (!jsonEqual(previous, next)) {
    await prisma.mediaAsset.update({ where: { id }, data: nextFields });
    await revise({ clinicId: clinic.id, authorId: user.id, entityType: "media_asset", entityId: id, previous, next });
  }
  redirect(`/admin/image-governance/${id}?saved=1`);
}

export async function saveMedia(_formData: FormData) {
  await requireAction("edit");
  redirect("/admin");
}

export async function uploadMedia(_formData: FormData) {
  await requireAction("edit");
  redirect("/admin");
}

export async function saveGovernance(formData: FormData) {
  const { user, clinic } = await requireAction("clinical_signoff");
  const id = text(formData, "id");
  const current = await prisma.clinicalReview.findFirst({
    where: { id, clinicId: clinic.id },
    include: { page: { include: { publishedRevision: { select: { html: true } } } } },
  });
  if (!current) redirect("/admin/governance");
  const status = parseGovernanceStatus(text(formData, "status"));
  if (!status) {
    redirect(`/admin/governance/${id}?error=gate&reason=${encodeURIComponent("That governance status is not allowed.")}`);
  }
  const reviewedBy = text(formData, "reviewedBy") || null;
  const approvedBy = text(formData, "approvedBy") || null;
  const evidenceReference = text(formData, "evidenceReference") || null;
  const approvalDate = text(formData, "lastReviewed");
  const approvedAt = approvalDate ? new Date(`${approvalDate}T00:00:00.000Z`) : null;
  const fingerprint = fingerprintContent(current.page.publishedRevision?.html ?? current.page.path);
  if (isGovernanceCompleteStatus(status)) {
    const gaps = governanceCompletionGaps({
      reviewedBy,
      approvedBy,
      approvedAt,
      evidenceReference,
      fingerprint,
    });
    if (gaps.length > 0) {
      redirect(`/admin/governance/${id}?error=gate&reason=${encodeURIComponent(gaps.join(" "))}`);
    }
  }
  const previous = governanceSnapshot(current);
  const next = {
    ...previous,
    reviewedBy,
    contentOwner: text(formData, "contentOwner") || null,
    reviewerSignedBy: text(formData, "reviewerSignedBy") || reviewedBy,
    approvedBy,
    approvalReference: text(formData, "approvalReference") || null,
    evidenceReference,
    reviewedContentSha256: isGovernanceCompleteStatus(status) ? fingerprint : current.reviewedContentSha256,
    lastReviewed: approvalDate || null,
    nextReview: text(formData, "nextReview") || null,
    status,
  };
  await prisma.clinicalReview.update({
    where: { id },
    data: {
      reviewedBy: next.reviewedBy,
      contentOwner: next.contentOwner,
      reviewerSignedBy: next.reviewerSignedBy,
      reviewerSignedAt: next.reviewerSignedBy ? new Date() : current.reviewerSignedAt,
      approvedBy: next.approvedBy,
      approvedAt: isGovernanceCompleteStatus(status) ? approvedAt : current.approvedAt,
      approvalReference: next.approvalReference,
      evidenceReference: next.evidenceReference,
      reviewedContentSha256: next.reviewedContentSha256,
      lastReviewed: next.lastReviewed ? new Date(`${next.lastReviewed}T00:00:00.000Z`) : null,
      nextReview: next.nextReview ? new Date(`${next.nextReview}T00:00:00.000Z`) : null,
      status,
    },
  });
  await revise({ clinicId: clinic.id, authorId: user.id, entityType: "clinical_review", entityId: id, previous, next });
  redirect(`/admin/governance/${id}?saved=1`);
}

export async function submitContent(formData: FormData) {
  const { user, clinic } = await requireAction("submit_for_review");
  await runWorkflow(formData, clinic.id, user.id, user.name || user.email || "Staff", "clinical_review");
}

export async function approveContent(formData: FormData) {
  const { user, clinic } = await requireAction("clinical_signoff");
  await runWorkflow(formData, clinic.id, user.id, user.name || user.email || "Staff", "approved");
}

export async function publishContent(formData: FormData) {
  const { user, clinic } = await requireAction("publish");
  const entityType = text(formData, "entityType") as ReleaseEntity;
  const entityId = text(formData, "entityId");
  const returnTo = text(formData, "returnTo") || "/admin";
  const result = await publishEntity({
    clinicId: clinic.id,
    authorId: user.id,
    authorName: user.name || user.email || "Staff",
    entityType,
    entityId,
  });
  if (!result.ok) redirect(`${returnTo}?error=gate&reason=${encodeURIComponent(result.reasons.join(" "))}`);
  redirect(`${returnTo}?published=1`);
}

async function runWorkflow(
  formData: FormData,
  clinicId: string,
  authorId: string,
  authorName: string,
  to: PublicationStatus,
) {
  const entityType = text(formData, "entityType") as ReleaseEntity;
  const entityId = text(formData, "entityId");
  const returnTo = text(formData, "returnTo") || "/admin";
  const result = await moveWorkflow({ clinicId, authorId, authorName, entityType, entityId, to });
  if (!result.ok) redirect(`${returnTo}?error=gate&reason=${encodeURIComponent(result.reasons.join(" "))}`);
  redirect(`${returnTo}?saved=1`);
}

export async function rollbackRevision(formData: FormData) {
  const { user, clinic } = await requireAction("rollback");
  const id = text(formData, "revisionId");
  const revision = await prisma.contentRevision.findFirst({ where: { id, clinicId: clinic.id } });
  if (!revision) redirect("/admin");
  const current = await currentSnapshot(revision.entityType, revision.entityId, clinic.id);
  if (!current) redirect("/admin");
  const restored = keepCurrentImageUsage(revision.entityType, revision.next as Prisma.InputJsonValue, current);
  try {
    await applySnapshot(revision.entityType, revision.entityId, restored);
  } catch (error) {
    if (error instanceof ImageArchiveError) {
      redirect(`/admin/revisions/${revision.entityType}/${revision.entityId}?error=archive`);
    }
    throw error;
  }
  await recordRevision({
    clinicId: clinic.id,
    authorId: user.id,
    entityType: revision.entityType,
    entityId: revision.entityId,
    previous: current,
    next: restored,
  });
  await writeAuditLog({
    clinicId: clinic.id,
    actorId: user.id,
    action: "content.rollback",
    entityType: revision.entityType,
    entityId: revision.entityId,
    metadata: { restoredRevisionId: revision.id },
  });
  redirect(`/admin/revisions/${revision.entityType}/${revision.entityId}?rolled=1`);
}

export async function createStaffUser(formData: FormData) {
  const { user, clinic } = await requireAction("create_users");
  const username = text(formData, "username").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const role = text(formData, "role") as (typeof ASSIGNABLE_ROLES)[number];
  if (!ASSIGNABLE_ROLES.includes(role) || username.length < 2 || password.length < 8) {
    redirect("/admin/users?error=1");
  }
  let created;
  try {
    created = await prisma.user.create({
      data: {
        username,
        name: text(formData, "name") || username,
        passwordHash: await hashPassword(password),
        memberships: { create: { clinicId: clinic.id, role: role as MembershipRole } },
      },
    });
  } catch {
    redirect("/admin/users?error=1");
  }
  await writeAuditLog({
    clinicId: clinic.id,
    actorId: user.id,
    action: "user.created",
    entityType: "user",
    entityId: created.id,
    metadata: { username, role },
  });
  redirect("/admin/users?saved=1");
}

function practitionerSnapshot(current: {
  name: string;
  qualifications: string[];
  biography: string;
  languages: string[];
  areasOfCare: string[];
  portraitPath: string | null;
  bookingUrl: string | null;
  professionalInterests: string[];
  publishedPayload: Prisma.JsonValue | null;
  status: PublicationStatus;
}) {
  return {
    name: current.name,
    qualifications: current.qualifications,
    biography: current.biography,
    languages: current.languages,
    areasOfCare: current.areasOfCare,
    professionalInterests: current.professionalInterests,
    portraitPath: current.portraitPath,
    bookingUrl: current.bookingUrl,
    status: current.status,
    publishedPayload: current.publishedPayload ?? null,
  };
}

function governanceSnapshot(current: {
  reviewedBy: string | null;
  contentOwner: string | null;
  reviewerSignedBy: string | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  approvalReference: string | null;
  evidenceReference: string | null;
  reviewedContentSha256: string | null;
  lastReviewed: Date | null;
  nextReview: Date | null;
  status: string;
}) {
  return {
    reviewedBy: current.reviewedBy,
    contentOwner: current.contentOwner,
    reviewerSignedBy: current.reviewerSignedBy,
    approvedBy: current.approvedBy,
    approvedAt: current.approvedAt?.toISOString() ?? null,
    approvalReference: current.approvalReference,
    evidenceReference: current.evidenceReference,
    reviewedContentSha256: current.reviewedContentSha256,
    lastReviewed: current.lastReviewed?.toISOString().slice(0, 10) ?? null,
    nextReview: current.nextReview?.toISOString().slice(0, 10) ?? null,
    status: current.status,
  };
}

async function currentSnapshot(entityType: string, entityId: string, clinicId: string): Promise<Prisma.InputJsonValue | null> {
  if (entityType === "practitioner") {
    const row = await prisma.practitioner.findFirst({ where: { id: entityId, clinicId } });
    return row ? practitionerSnapshot(row) : null;
  }
  if (entityType === "service") {
    const row = await prisma.service.findFirst({ where: { id: entityId, clinicId } });
    return row ? serviceSnapshot(row) : null;
  }
  if (entityType === "knowledge_topic") {
    const row = await prisma.knowledgeTopic.findFirst({ where: { id: entityId, clinicId } });
    return row
      ? { title: row.title, summary: row.summary, status: row.status, publishedPayload: row.publishedPayload ?? null }
      : null;
  }
  if (entityType === "knowledge_article") {
    const row = await prisma.knowledgeArticle.findFirst({ where: { id: entityId, clinicId } });
    return row ? articleSnapshot(row) : null;
  }
  if (entityType === "practice_update") {
    const row = await prisma.practiceUpdate.findFirst({ where: { id: entityId, clinicId } });
    return row
      ? {
          title: row.title,
          summary: row.summary,
          author: row.author,
          status: row.status,
          publishedPayload: row.publishedPayload ?? null,
        }
      : null;
  }
  if (entityType === "practice_page") {
    const row = await prisma.practicePage.findFirst({ where: { id: entityId, clinicId } });
    return row ? practiceSnapshot(row) : null;
  }
  if (entityType === "media_asset") {
    const row = await prisma.mediaAsset.findFirst({ where: { id: entityId, clinicId } });
    return row ? assetRevisionSnapshot(row) : null;
  }
  if (entityType === "clinical_review") {
    const row = await prisma.clinicalReview.findFirst({ where: { id: entityId, clinicId } });
    return row ? governanceSnapshot(row) : null;
  }
  if (entityType === "clinic_settings") {
    const clinic = await prisma.clinic.findFirst({
      where: { id: clinicId },
      include: { profile: true, openingHours: true },
    });
    if (!clinic?.profile) return null;
    return {
      practiceName: clinic.practiceName,
      streetAddress: clinic.profile.streetAddress,
      suburb: clinic.profile.suburb,
      state: clinic.profile.state,
      postcode: clinic.profile.postcode,
      phoneDisplay: clinic.profile.phoneDisplay,
      email: clinic.profile.email,
      hotdocUrl: clinic.profile.hotdocUrl,
      billingPolicy: clinic.profile.billingPolicy,
      agpalStatus: clinic.profile.agpalStatus,
      contentStatus: clinic.profile.contentStatus,
      publishedPayload: clinic.profile.publishedPayload ?? null,
      openingHours: clinic.openingHours.map((hours) => ({
        dayOfWeek: hours.dayOfWeek,
        opens: hours.opens,
        closes: hours.closes,
      })),
    };
  }
  return null;
}

async function applySnapshot(entityType: string, entityId: string, snapshot: Prisma.InputJsonValue) {
  const data = alignRestoredSnapshot(entityType, snapshot as Record<string, unknown>);
  const restoredStatus = snapshotStatus(data);
  if (entityType === "practitioner") {
    await prisma.practitioner.update({
      where: { id: entityId },
      data: {
        name: String(data.name ?? ""),
        qualifications: asStringList(data.qualifications),
        biography: String(data.biography ?? ""),
        languages: asStringList(data.languages),
        areasOfCare: asStringList(data.areasOfCare),
        professionalInterests: asStringList(data.professionalInterests),
        portraitPath: stringOrNull(data.portraitPath),
        bookingUrl: stringOrNull(data.bookingUrl),
        status: String(data.status ?? "drafting") as PublicationStatus,
        ...payloadUpdate(data),
      },
    });
    await restoreGovernance(data);
    return;
  }
  if (entityType === "service") {
    await prisma.service.update({
      where: { id: entityId },
      data: {
        title: String(data.title ?? ""),
        summary: String(data.summary ?? ""),
        ...(data.status ? { status: String(data.status) as PublicationStatus } : {}),
        ...serviceRollback(data),
        ...payloadUpdate(data),
      },
    });
    await restoreGovernance(data);
    return;
  }
  if (entityType === "knowledge_topic") {
    await prisma.knowledgeTopic.update({
      where: { id: entityId },
      data: {
        title: String(data.title ?? ""),
        summary: String(data.summary ?? ""),
        ...(data.status ? { status: String(data.status) as PublicationStatus } : {}),
        ...payloadUpdate(data),
      },
    });
    return;
  }
  if (entityType === "knowledge_article") {
    await prisma.knowledgeArticle.update({
      where: { id: entityId },
      data: {
        title: String(data.title ?? ""),
        summary: String(data.summary ?? ""),
        category: stringOrNull(data.category),
        status: String(data.status ?? "drafting") as PublicationStatus,
        contentOwner: stringOrNull(data.contentOwner),
        ...(data.status ? { status: String(data.status) as PublicationStatus } : {}),
        ...articleRollback(data),
        ...payloadUpdate(data),
      },
    });
    await restoreGovernance(data);
    return;
  }
  if (entityType === "practice_update") {
    await prisma.practiceUpdate.update({
      where: { id: entityId },
      data: {
        title: String(data.title ?? ""),
        summary: String(data.summary ?? ""),
        author: stringOrNull(data.author),
        ...(data.status ? { status: String(data.status) as PublicationStatus } : {}),
        ...payloadUpdate(data),
      },
    });
    await restoreGovernance(data);
    return;
  }
  if (entityType === "practice_page") {
    await prisma.practicePage.update({
      where: { id: entityId },
      data: {
        title: String(data.title ?? ""),
        summary: String(data.summary ?? ""),
        contentOwner: stringOrNull(data.contentOwner),
        ...(data.status ? { status: String(data.status) as PublicationStatus } : {}),
        ...practiceRollback(data),
        ...payloadUpdate(data),
      },
    });
    await restoreGovernance(data);
    return;
  }
  if (entityType === "media_asset") {
    const existing = await prisma.mediaAsset.findUnique({ where: { id: entityId } });
    if (!existing) return;
    applyImageFiles(existing, data);
    await prisma.mediaAsset.update({
      where: { id: entityId },
      data: {
        ...("altText" in data ? { altText: String(data.altText ?? "") } : {}),
        ...("subject" in data ? { subject: stringOrNull(data.subject) } : {}),
        ...("uploadedBy" in data ? { uploadedBy: stringOrNull(data.uploadedBy) } : {}),
        ...("approvedAt" in data ? { approvedAt: dateOrNull(data.approvedAt) } : {}),
        ...("photographer" in data ? { photographer: stringOrNull(data.photographer) } : {}),
        ...("copyrightOwner" in data ? { copyrightOwner: stringOrNull(data.copyrightOwner) } : {}),
        ...("expiresAt" in data ? { expiresAt: dateOrNull(data.expiresAt) } : {}),
        ...("usage" in data ? { usage: asStringList(data.usage) } : {}),
        ...("replacementStatus" in data
          ? { replacementStatus: data.replacementStatus ? (String(data.replacementStatus) as PublicationStatus) : null }
          : {}),
      },
    });
    return;
  }
  if (entityType === "clinical_review") {
    const existing = await prisma.clinicalReview.findUnique({ where: { id: entityId } });
    if (!existing) return;
    const evidence = restoredEvidence(data, existing);
    await prisma.clinicalReview.update({
      where: { id: entityId },
      data: {
        reviewedBy: evidence.reviewedBy,
        contentOwner: stringOrNull(data.contentOwner),
        reviewerSignedBy: stringOrNull(data.reviewerSignedBy),
        approvedBy: evidence.approvedBy,
        approvedAt: evidence.approvedAt,
        approvalReference: stringOrNull(data.approvalReference),
        evidenceReference: evidence.evidenceReference,
        reviewedContentSha256: evidence.fingerprint,
        lastReviewed: data.lastReviewed ? new Date(String(data.lastReviewed)) : null,
        nextReview: data.nextReview ? new Date(String(data.nextReview)) : null,
        status: governanceStatusForRestore(data.status, existing.status, evidence),
      },
    });
    return;
  }
  if (entityType === "clinic_settings") {
    const hours = Array.isArray(data.openingHours) ? data.openingHours : [];
    await prisma.clinic.update({ where: { id: entityId }, data: { practiceName: String(data.practiceName ?? "") } });
    await prisma.clinicProfile.update({
      where: { clinicId: entityId },
      data: {
        streetAddress: String(data.streetAddress ?? ""),
        suburb: String(data.suburb ?? ""),
        state: String(data.state ?? ""),
        postcode: String(data.postcode ?? ""),
        phoneDisplay: String(data.phoneDisplay ?? ""),
        email: String(data.email ?? ""),
        hotdocUrl: stringOrNull(data.hotdocUrl),
        billingPolicy: stringOrNull(data.billingPolicy),
        agpalStatus: stringOrNull(data.agpalStatus),
        ...(restoredStatus ? { contentStatus: restoredStatus as PublicationStatus } : {}),
        ...payloadUpdate(data),
      },
    });
    for (const row of hours) {
      const item = row as { dayOfWeek?: string; opens?: string; closes?: string };
      if (!item.dayOfWeek) continue;
      await prisma.openingHours.update({
        where: { clinicId_dayOfWeek: { clinicId: entityId, dayOfWeek: item.dayOfWeek as DayOfWeek } },
        data: { opens: item.opens ?? "", closes: item.closes ?? "" },
      });
    }
  }
}

function practiceSnapshot(current: {
  title: string;
  summary: string;
  contentOwner: string | null;
  status: PublicationStatus;
  sections: Prisma.JsonValue | null;
  publishedPayload: Prisma.JsonValue | null;
}) {
  return {
    title: current.title,
    summary: current.summary,
    contentOwner: current.contentOwner,
    document: practiceDocumentFrom(current.sections),
    status: current.status,
    publishedPayload: current.publishedPayload ?? null,
  };
}

function practiceRollback(data: Record<string, unknown>): Prisma.PracticePageUpdateInput {
  const document = practiceDocumentFrom(data.document);
  if (document) return { sections: { document }, title: document.title, summary: document.summary };
  if ("document" in data) return { sections: Prisma.DbNull };
  return {};
}

function serviceSnapshot(current: {
  title: string;
  summary: string;
  status: PublicationStatus;
  patientEducation: Prisma.JsonValue | null;
  faqs: Prisma.JsonValue | null;
  relatedPractitioners: string[];
  publishedPayload: Prisma.JsonValue | null;
}) {
  return {
    title: current.title,
    summary: current.summary,
    document: serviceDocumentFrom(current.patientEducation),
    faqs: current.faqs ?? null,
    relatedPractitioners: current.relatedPractitioners,
    status: current.status,
    publishedPayload: current.publishedPayload ?? null,
  };
}

function serviceRollback(data: Record<string, unknown>): Prisma.ServiceUpdateInput {
  const document = serviceDocumentFrom(data.document);
  if (document) {
    return {
      patientEducation: { document },
      faqs: document.sections.flatMap((section) => section.faqs),
      relatedPractitioners: document.sections.flatMap((section) => section.practitioners.map((practitioner) => practitioner.href)),
    };
  }
  if ("document" in data) {
    return { patientEducation: Prisma.DbNull, faqs: Prisma.DbNull, relatedPractitioners: [] };
  }
  return {};
}

function articleSnapshot(current: {
  title: string;
  summary: string;
  category: string | null;
  status: PublicationStatus;
  contentOwner: string | null;
  educationalContent: Prisma.JsonValue | null;
  publishedPayload: Prisma.JsonValue | null;
  nextReviewDate: Date | null;
}) {
  return {
    title: current.title,
    summary: current.summary,
    introduction: introductionOf(current.educationalContent),
    document: articleDocumentFrom(current.educationalContent),
    category: current.category,
    status: current.status,
    contentOwner: current.contentOwner,
    nextReviewDate: current.nextReviewDate?.toISOString().slice(0, 10) ?? null,
    publishedPayload: current.publishedPayload ?? null,
  };
}

function articleRollback(data: Record<string, unknown>): Prisma.KnowledgeArticleUpdateInput {
  const document = articleDocumentFrom(data.document);
  if (document) {
    return {
      educationalContent: {
        introduction: document.sections.find((section) => section.id === "introduction")?.paragraphs[0] ?? "",
        document,
      },
      faqs: document.sections.flatMap((section) => section.faqs),
      trustedSources: document.sections.flatMap((section) => section.sources),
      relatedServices: document.sections.flatMap((section) => section.services.map((service) => service.href)),
      relatedPractitioners: document.sections.flatMap((section) => section.practitioners.map((practitioner) => practitioner.href)),
      ...(document.updated ? { nextReviewDate: new Date(`${document.updated}T00:00:00.000Z`) } : {}),
    };
  }
  if ("document" in data) {
    return {
      educationalContent: Prisma.DbNull,
      faqs: Prisma.DbNull,
      trustedSources: Prisma.DbNull,
      relatedServices: [],
      relatedPractitioners: [],
      nextReviewDate: null,
    };
  }
  if (data.introduction != null) return { educationalContent: { introduction: String(data.introduction) } };
  return {};
}

function introductionOf(value: Prisma.JsonValue | null): string {
  const document = articleDocumentFrom(value);
  const introduction = document?.sections.find((section) => section.id === "introduction")?.paragraphs[0];
  if (introduction) return introduction;
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const stored = (value as Record<string, unknown>).introduction;
  return typeof stored === "string" ? stored : "";
}

function payloadUpdate(data: Record<string, unknown>): { publishedPayload?: Prisma.InputJsonValue | typeof Prisma.DbNull } {
  if (!("publishedPayload" in data)) return {};
  if (data.publishedPayload == null) return { publishedPayload: Prisma.DbNull };
  return { publishedPayload: data.publishedPayload as Prisma.InputJsonValue };
}

async function restoreGovernance(data: Record<string, unknown>) {
  const governance = data.governance;
  if (!governance || typeof governance !== "object" || Array.isArray(governance)) return;
  const row = governance as Record<string, unknown>;
  if (!row.pageId) return;
  const existing = await prisma.clinicalReview.findUnique({ where: { pageId: String(row.pageId) } });
  if (!existing) return;
  const evidence = restoredEvidence(row, existing);
  await prisma.clinicalReview.update({
    where: { pageId: existing.pageId },
    data: {
      reviewedBy: evidence.reviewedBy,
      reviewerSignedBy: stringOrNull(row.reviewerSignedBy),
      approvedBy: evidence.approvedBy,
      approvedAt: evidence.approvedAt,
      approvalReference: stringOrNull(row.approvalReference),
      evidenceReference: evidence.evidenceReference,
      reviewedContentSha256: evidence.fingerprint,
      lastReviewed: row.lastReviewed ? new Date(String(row.lastReviewed)) : null,
      nextReview: row.nextReview ? new Date(String(row.nextReview)) : null,
      status: governanceStatusForRestore(row.status, existing.status, evidence),
    },
  });
}

function restoredEvidence(
  row: Record<string, unknown>,
  existing: {
    reviewedBy: string | null;
    approvedBy: string | null;
    approvedAt: Date | null;
    evidenceReference: string | null;
    reviewedContentSha256: string | null;
    status: GovernanceStatus;
  },
) {
  return {
    reviewedBy: "reviewedBy" in row ? stringOrNull(row.reviewedBy) : existing.reviewedBy,
    approvedBy: "approvedBy" in row ? stringOrNull(row.approvedBy) : existing.approvedBy,
    approvedAt: "approvedAt" in row ? (row.approvedAt ? new Date(String(row.approvedAt)) : null) : existing.approvedAt,
    evidenceReference: "evidenceReference" in row ? stringOrNull(row.evidenceReference) : existing.evidenceReference,
    fingerprint: "reviewedContentSha256" in row ? stringOrNull(row.reviewedContentSha256) : existing.reviewedContentSha256,
  };
}

function asStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)) : [];
}

function keepCurrentImageUsage(
  entityType: string,
  restored: Prisma.InputJsonValue,
  current: Prisma.InputJsonValue,
): Prisma.InputJsonValue {
  if (entityType !== "media_asset") return restored;
  if (!restored || typeof restored !== "object" || Array.isArray(restored)) return restored;
  if (!current || typeof current !== "object" || Array.isArray(current)) return restored;
  const usage = "usage" in current ? current.usage : [];
  return { ...restored, usage };
}

function dateOrNull(value: unknown): Date | null {
  const raw = String(value ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}/.test(raw)) return null;
  return new Date(`${raw.slice(0, 10)}T00:00:00.000Z`);
}

function stringOrNull(value: unknown): string | null {
  if (value == null || value === "") return null;
  return String(value);
}
