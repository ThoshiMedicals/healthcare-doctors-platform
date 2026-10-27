import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Prisma, PublicationStatus } from "@prisma/client";
import { writeAuditLog } from "@/cms/audit";
import { articleDocumentFrom, articleLinkProblems, knowledgeHubs, readArticleDocument } from "@/cms/article-document";
import { readServiceDocument, serviceDocumentFrom, serviceLinkProblems } from "@/cms/service-document";
import { practiceDocumentFrom, practiceLinkProblems, readPracticeDocument } from "@/cms/practice-document";
import { applyOverlay, phoneToTel, practitionerFromPayload, readLede, readTitle, readUpdateAuthor, readUpdateSummary, repeatFromPayload, type ClinicContent, type OverlayInput, type PractitionerContent, type TextContent } from "@/cms/overlay";
import { bookingUrlProblems, portraitBasename, portraitProblems, readPractitionerBookingUrl, readPractitionerPortraitFile } from "@/cms/practitioner-media";
import { comparePublishedPages } from "@/cms/publish-check";
import { evaluateContentPublication } from "@/cms/publish-gates";
import { recordRevision } from "@/cms/revisions";
import { prisma } from "@/db/prisma";
import { goldenHtmlRoot, webRoot } from "@/importer/golden-root";
import { fingerprintContent } from "@/governance/fingerprint";
import { governanceCompletionGaps } from "@/governance/status";
import { writePublishedGovernanceRegistry } from "@/governance/write-published-registry";

export type ReleaseEntity =
  | "practitioner"
  | "service"
  | "knowledge_article"
  | "practice_update"
  | "practice_page"
  | "knowledge_topic"
  | "clinic_settings";

type PageHtml = { path: string; html: string; input: OverlayInput; profile?: boolean };

export async function publishEntity(entry: {
  clinicId: string;
  authorId: string;
  authorName: string;
  entityType: ReleaseEntity;
  entityId: string;
}): Promise<{ ok: true } | { ok: false; reasons: string[] }> {
  const draft = await loadDraft(entry.clinicId, entry.entityType, entry.entityId);
  if (!draft) return { ok: false, reasons: ["That record could not be found."] };
  if (draft.status !== "approved") {
    return { ok: false, reasons: ["Publish the approved version. Drafts and reviews stay off the public site."] };
  }
  if (draft.mediaProblems && draft.mediaProblems.length > 0) return { ok: false, reasons: draft.mediaProblems };

  const preview = await renderPair(entry.clinicId, entry.entityType, entry.entityId, draft.overlay);
  if (preview.errors.length > 0) return { ok: false, reasons: preview.errors };
  const reasons = preview.pages.flatMap((page) => {
    const comparison = comparePublishedPages(page.current, page.next);
    return comparison.ok ? [] : comparison.reasons.map((reason) => `${page.path}: ${reason}`);
  });
  const assetReasons = await unchangedAssets();
  const knowledge = entry.entityType === "knowledge_article" ? await knowledgeProblems(entry.clinicId, preview.pages) : null;
  const service = entry.entityType === "service" ? await serviceProblems(entry.clinicId, preview.pages) : null;
  const practice = entry.entityType === "practice_page" ? await practiceProblems(entry.clinicId, preview.pages) : null;
  const releaseChecksAccepted = reasons.length === 0 && assetReasons.length === 0;
  const linksVerified =
    !(knowledge && knowledge.problems.length > 0) &&
    !(service && service.problems.length > 0) &&
    !(practice && practice.problems.length > 0);
  if (!releaseChecksAccepted || !linksVerified) {
    return {
      ok: false,
      reasons: [...reasons, ...assetReasons, ...(knowledge?.problems ?? []), ...(service?.problems ?? []), ...(practice?.problems ?? [])],
    };
  }
  const gate = await governancePublicationGate({
    clinicId: entry.clinicId,
    pageId: draft.pageId,
    pages: preview.pages,
    publisherName: entry.authorName,
    releaseChecksAccepted,
    linksVerified,
  });
  if (!gate.ok) return gate;

  await writePublishReport(entry, preview.pages, {
    ...(knowledge?.report ? { knowledge: knowledge.report } : {}),
    ...(service?.report ? { service: service.report } : {}),
    ...(practice?.report ? { practice: practice.report } : {}),
  });

  const previous = await workingSnapshot(entry.clinicId, entry.entityType, entry.entityId);
  await storePayload(entry.entityType, entry.entityId, entry.clinicId, draft.payload);
  if (draft.pageId) {
    await recordGovernanceAfterPublish(entry.clinicId, draft.pageId, gate.fingerprint);
  }
  const next = await workingSnapshot(entry.clinicId, entry.entityType, entry.entityId);
  if (previous && next) {
    await recordRevision({
      clinicId: entry.clinicId,
      authorId: entry.authorId,
      entityType: entry.entityType,
      entityId: entry.entityId,
      previous,
      next,
    });
  }
  await writeAuditLog({
    clinicId: entry.clinicId,
    actorId: entry.authorId,
    action: "content.published",
    entityType: entry.entityType,
    entityId: entry.entityId,
  });
  return { ok: true };
}

export async function moveWorkflow(entry: {
  clinicId: string;
  authorId: string;
  authorName: string;
  entityType: ReleaseEntity;
  entityId: string;
  to: PublicationStatus;
}): Promise<{ ok: true } | { ok: false; reasons: string[] }> {
  const current = await statusOf(entry.clinicId, entry.entityType, entry.entityId);
  if (!current) return { ok: false, reasons: ["That record could not be found."] };
  const allowed =
    (current === "drafting" && entry.to === "clinical_review") ||
    (current === "clinical_review" && entry.to === "approved") ||
    (current === "approved" && entry.to === "drafting") ||
    (current === "clinical_review" && entry.to === "drafting");
  if (!allowed) return { ok: false, reasons: ["That workflow step is not available from the current status."] };

  const previous = await workingSnapshot(entry.clinicId, entry.entityType, entry.entityId);
  await setStatus(entry.entityType, entry.entityId, entry.clinicId, entry.to);
  if (entry.to === "approved") {
    const pageId = await pageIdOf(entry.entityType, entry.entityId, entry.clinicId);
    if (pageId) {
      await prisma.clinicalReview.upsert({
        where: { pageId },
        create: {
          clinicId: entry.clinicId,
          pageId,
          reviewType: "clinical",
          status: "under_review",
          reviewedBy: entry.authorName,
          reviewerSignedBy: entry.authorName,
          reviewerSignedAt: new Date(),
        },
        update: {
          status: "under_review",
          reviewedBy: entry.authorName,
          reviewerSignedBy: entry.authorName,
          reviewerSignedAt: new Date(),
        },
      });
    }
  }
  const next = await workingSnapshot(entry.clinicId, entry.entityType, entry.entityId);
  if (previous && next) {
    await recordRevision({
      clinicId: entry.clinicId,
      authorId: entry.authorId,
      entityType: entry.entityType,
      entityId: entry.entityId,
      previous,
      next,
    });
  }
  return { ok: true };
}

async function governancePublicationGate(input: {
  clinicId: string;
  pageId: string | null;
  pages: Array<{ path: string; next: string }>;
  publisherName: string;
  releaseChecksAccepted: boolean;
  linksVerified: boolean;
}): Promise<{ ok: true; fingerprint: string } | { ok: false; reasons: string[] }> {
  const page = input.pageId
    ? await prisma.page.findFirst({ where: { id: input.pageId, clinicId: input.clinicId }, select: { path: true } })
    : null;
  const review = input.pageId ? await prisma.clinicalReview.findUnique({ where: { pageId: input.pageId } }) : null;
  const rendered = page ? input.pages.find((item) => item.path === page.path) : undefined;
  const contentSha256 = rendered?.next ? fingerprintContent(rendered.next) : null;
  const decision = evaluateContentPublication({
    reviewedBy: review?.reviewedBy ?? null,
    reviewerSignedAt: review?.reviewerSignedAt ?? null,
    approvedBy: review?.approvedBy ?? null,
    approvedAt: review?.approvedAt ?? null,
    approvalReference: review?.approvalReference ?? null,
    evidenceReference: review?.evidenceReference ?? null,
    contentOwner: review?.contentOwner ?? null,
    reviewedContentSha256: review?.reviewedContentSha256 ?? null,
    contentSha256,
    pagePath: page?.path ?? null,
    nextReview: review?.nextReview ?? null,
    publisherName: input.publisherName,
    releaseChecksAccepted: input.releaseChecksAccepted,
    linksVerified: input.linksVerified,
  });
  if (!decision.ok || !contentSha256) return decision.ok ? { ok: false, reasons: ["Content fingerprint and reviewed fingerprint are required."] } : decision;
  return { ok: true, fingerprint: contentSha256 };
}

export async function renderedContentFingerprint(clinicId: string, pageId: string): Promise<string | null> {
  const page = await prisma.page.findFirst({
    where: { id: pageId, clinicId },
    select: {
      path: true,
      practitioner: { select: { id: true } },
      service: { select: { id: true } },
      knowledgeArticle: { select: { id: true } },
      practiceUpdate: { select: { id: true } },
      practicePage: { select: { id: true } },
      knowledgeTopic: { select: { id: true } },
    },
  });
  if (!page) return null;
  const owner =
    page.practitioner ? { entityType: "practitioner" as const, entityId: page.practitioner.id }
    : page.service ? { entityType: "service" as const, entityId: page.service.id }
    : page.knowledgeArticle ? { entityType: "knowledge_article" as const, entityId: page.knowledgeArticle.id }
    : page.practiceUpdate ? { entityType: "practice_update" as const, entityId: page.practiceUpdate.id }
    : page.practicePage ? { entityType: "practice_page" as const, entityId: page.practicePage.id }
    : page.knowledgeTopic ? { entityType: "knowledge_topic" as const, entityId: page.knowledgeTopic.id }
    : null;
  if (!owner) return null;
  const draft = await loadDraft(clinicId, owner.entityType, owner.entityId);
  if (!draft) return null;
  const preview = await renderPair(clinicId, owner.entityType, owner.entityId, draft.overlay);
  const rendered = preview.pages.find((item) => item.path === page.path);
  return rendered?.next ? fingerprintContent(rendered.next) : null;
}

async function recordGovernanceAfterPublish(clinicId: string, pageId: string, fingerprint: string) {
  const existing = await prisma.clinicalReview.findUnique({ where: { pageId } });
  const gaps = governanceCompletionGaps({
    reviewedBy: existing?.reviewedBy ?? null,
    approvedBy: existing?.approvedBy ?? null,
    approvedAt: existing?.approvedAt ?? null,
    evidenceReference: existing?.evidenceReference ?? null,
    fingerprint,
  });
  const stripReady = Boolean(existing?.contentOwner?.trim() && existing?.nextReview);
  const alreadyComplete =
    existing?.status === "approved" || existing?.status === "published"
      ? existing.reviewedContentSha256 === fingerprint && gaps.length === 0 && stripReady
      : false;
  await prisma.clinicalReview.upsert({
    where: { pageId },
    create: {
      clinicId,
      pageId,
      reviewType: "clinical",
      status: "under_review",
      reviewedContentSha256: fingerprint,
    },
    update: {
      status: alreadyComplete ? "published" : "under_review",
      reviewedContentSha256: fingerprint,
    },
  });
  await writePublishedGovernanceRegistry(clinicId);
}

async function renderPair(clinicId: string, entityType: ReleaseEntity, entityId: string, overlay: OverlayInput) {
  const pages = await pagesFor(clinicId, entityType, entityId);
  const errors: string[] = [];
  const rendered = pages.map((page) => {
    const current = applyOverlay(page.html, page.input);
    const nextInput = entityType === "clinic_settings" ? { ...page.input, clinic: overlay.clinic } : overlayForPage(page, overlay);
    const next = applyOverlay(page.html, nextInput);
    errors.push(...next.errors.map((error) => `${page.path}: ${error}`));
    return { path: page.path, current: current.html, next: next.html };
  });
  return { pages: rendered, errors };
}

function overlayForPage(page: PageHtml, overlay: OverlayInput): OverlayInput {
  if (overlay.practitioner && page.profile === false) {
    return { ...page.input, practitioner: { ...overlay.practitioner, profileText: false } };
  }
  return { ...page.input, ...overlay };
}

async function pagesFor(clinicId: string, entityType: ReleaseEntity, entityId: string): Promise<PageHtml[]> {
  if (entityType === "clinic_settings") {
    const pages = await prisma.page.findMany({
      where: { clinicId, status: "published" },
      include: pageInclude,
    });
    return pages.flatMap((page) => {
      if (!page.publishedRevision?.html) return [];
      return [{ path: page.path, html: page.publishedRevision.html, input: inputFromPage(page) }];
    });
  }
  const page = await findOwnedPage(clinicId, entityType, entityId);
  if (!page?.publishedRevision?.html) return [];
  if (entityType !== "practitioner") {
    return [{ path: page.path, html: page.publishedRevision.html, input: inputFromPage(page), profile: true }];
  }
  const sourcePortrait = readPractitionerPortraitFile(page.publishedRevision.html);
  const sourceBooking = readPractitionerBookingUrl(page.publishedRevision.html);
  const pages = await prisma.page.findMany({
    where: { clinicId, status: "published" },
    include: pageInclude,
  });
  return pages.flatMap((candidate) => {
    const html = candidate.publishedRevision?.html;
    if (!html) return [];
    const profile = candidate.id === page.id;
    const related =
      profile ||
      (sourcePortrait.length > 0 && html.includes(sourcePortrait)) ||
      (sourceBooking.length > 0 && html.includes(sourceBooking));
    if (!related) return [];
    return [{ path: candidate.path, html, input: inputFromPage(candidate), profile }];
  });
}

const pageInclude = {
  publishedRevision: true,
  practitioner: true,
  service: true,
  knowledgeArticle: true,
  practiceUpdate: true,
  practicePage: true,
  clinic: { include: { profile: true } },
} satisfies Prisma.PageInclude;

type IncludedPage = Prisma.PageGetPayload<{ include: typeof pageInclude }>;

function inputFromPage(page: IncludedPage): OverlayInput {
  return {
    practitioner: practitionerFrom(page.practitioner?.publishedPayload),
    service: serviceText(page.service?.publishedPayload, page.path),
    article: textFrom(page.knowledgeArticle?.publishedPayload, page.path),
    update: textFrom(page.practiceUpdate?.publishedPayload),
    practice: practiceText(page.practicePage?.publishedPayload),
    clinic: clinicFrom(page.clinic.profile?.publishedPayload),
  };
}

async function findOwnedPage(clinicId: string, entityType: ReleaseEntity, entityId: string) {
  const where =
    entityType === "practitioner"
      ? { practitioner: { id: entityId, clinicId } }
      : entityType === "service"
        ? { service: { id: entityId, clinicId } }
        : entityType === "knowledge_article"
          ? { knowledgeArticle: { id: entityId, clinicId } }
          : entityType === "practice_update"
            ? { practiceUpdate: { id: entityId, clinicId } }
      : entityType === "practice_page"
        ? { practicePage: { id: entityId, clinicId } }
        : entityType === "knowledge_topic"
          ? { knowledgeTopic: { id: entityId, clinicId } }
          : { id: "missing" };
  return prisma.page.findFirst({ where, include: pageInclude });
}

async function loadDraft(
  clinicId: string,
  entityType: ReleaseEntity,
  entityId: string,
): Promise<{
  status: PublicationStatus;
  pageId: string | null;
  payload: Prisma.InputJsonValue;
  overlay: OverlayInput;
  mediaProblems?: string[];
} | null> {
  if (entityType === "practitioner") {
    const row = await prisma.practitioner.findFirst({ where: { id: entityId, clinicId } });
    if (!row) return null;
    const golden = row.pageId
      ? await prisma.page.findUnique({
          where: { id: row.pageId },
          include: { publishedRevision: { select: { html: true } } },
        })
      : null;
    const sourcePortraitFile = readPractitionerPortraitFile(golden?.publishedRevision?.html ?? "");
    const sourceBookingUrl = readPractitionerBookingUrl(golden?.publishedRevision?.html ?? "");
    const portraitFile = portraitBasename(row.portraitPath) || sourcePortraitFile;
    const bookingUrl = row.bookingUrl || sourceBookingUrl;
    const mediaProblems = [
      ...portraitProblems(sourcePortraitFile, portraitFile),
      ...(bookingUrl === sourceBookingUrl ? [] : bookingUrlProblems(bookingUrl)),
    ];
    const sourceName = readTitle(golden?.publishedRevision?.html ?? "");
    const content: PractitionerContent = {
      name: row.name,
      sourceName,
      biography: row.biography,
      areasOfCare: row.areasOfCare,
      professionalInterests: row.professionalInterests,
      qualifications: row.qualifications,
      languages: row.languages,
      portraitFile,
      sourcePortraitFile,
      bookingUrl,
      sourceBookingUrl,
    };
    return {
      status: row.status,
      pageId: row.pageId,
      payload: content,
      overlay: { practitioner: content },
      mediaProblems,
    };
  }
  if (entityType === "service") {
    const row = await prisma.service.findFirst({
      where: { id: entityId, clinicId },
      include: { page: { select: { path: true, publishedRevision: { select: { html: true } } } } },
    });
    if (!row) return null;
    const pagePath = row.page?.path ?? "";
    const baseline = readServiceDocument(row.page?.publishedRevision?.html ?? "", pagePath);
    const document = serviceDocumentFrom(row.patientEducation) ?? baseline;
    const content: TextContent = {
      title: document.title,
      summary: document.summary,
      serviceDocument: document,
      pagePath,
    };
    return {
      status: row.status,
      pageId: row.pageId,
      payload: { ...document, sourceTitle: baseline.title, sourceSummary: baseline.summary, pagePath },
      overlay: { service: content },
    };
  }
  if (entityType === "knowledge_article") {
    const row = await prisma.knowledgeArticle.findFirst({
      where: { id: entityId, clinicId },
      include: { page: { select: { path: true, publishedRevision: { select: { html: true } } } } },
    });
    if (!row) return null;
    const pagePath = row.page?.path ?? row.articlePath ?? "";
    const baseline = readArticleDocument(row.page?.publishedRevision?.html ?? "", pagePath);
    const document = articleDocumentFrom(row.educationalContent) ?? baseline;
    const content: TextContent = {
      title: document.title,
      summary: document.summary,
      introduction: document.sections.find((section) => section.id === "introduction")?.paragraphs[0] ?? "",
      document,
      pagePath,
    };
    return {
      status: row.status,
      pageId: row.pageId,
      payload: { ...document, sourceTitle: baseline.title, sourceSummary: baseline.summary, pagePath },
      overlay: { article: content },
    };
  }
  if (entityType === "practice_update") {
    const row = await prisma.practiceUpdate.findFirst({
      where: { id: entityId, clinicId },
      include: { page: { select: { path: true, publishedRevision: { select: { html: true } } } } },
    });
    if (!row) return null;
    const html = row.page?.publishedRevision?.html ?? "";
    const sourceAuthor = readUpdateAuthor(html);
    const author = (row.author ?? "").replace(/^By\s+/, "") || sourceAuthor;
    const pagePath = row.page?.path ?? "";
    const content: TextContent = { title: row.title, summary: row.summary, author, sourceAuthor, pagePath };
    return {
      status: row.status,
      pageId: row.pageId,
      payload: { ...content, sourceTitle: readTitle(html), sourceSummary: readUpdateSummary(html) },
      overlay: { update: content },
    };
  }
  if (entityType === "knowledge_topic") {
    const row = await prisma.knowledgeTopic.findFirst({
      where: { id: entityId, clinicId },
      include: { page: { select: { path: true, publishedRevision: { select: { html: true } } } } },
    });
    if (!row) return null;
    const html = row.page?.publishedRevision?.html ?? "";
    const pagePath = row.page?.path ?? "";
    const edited = Boolean(row.publishedPayload) || row.status !== "published";
    const payload = {
      title: edited ? row.title : readTitle(html),
      summary: edited ? row.summary : readLede(html),
      sourceTitle: readTitle(html),
      sourceSummary: readLede(html),
      author: "",
      sourceAuthor: "",
      pagePath,
      topicPage: true,
    };
    const binding = repeatFromPayload(payload, pagePath);
    return {
      status: row.status,
      pageId: row.pageId,
      payload,
      overlay: { repeats: binding ? [binding] : [] },
    };
  }
  if (entityType === "practice_page") {
    const row = await prisma.practicePage.findFirst({
      where: { id: entityId, clinicId },
      include: { page: { select: { path: true, publishedRevision: { select: { html: true } } } } },
    });
    if (!row) return null;
    const baseline = readPracticeDocument(row.page?.publishedRevision?.html ?? "");
    const document = practiceDocumentFrom(row.sections) ?? baseline;
    const pagePath = row.page?.path ?? "";
    const content: TextContent = { title: document.title, summary: document.summary, practiceDocument: document, pagePath };
    return {
      status: row.status,
      pageId: row.pageId,
      payload: { ...document, sourceTitle: baseline.title, sourceSummary: baseline.summary, pagePath },
      overlay: { practice: content },
    };
  }
  const clinic = await prisma.clinic.findFirst({
    where: { id: clinicId },
    include: { profile: true, openingHours: true },
  });
  if (!clinic?.profile || entityId !== clinicId) return null;
  const content: ClinicContent = {
    phoneDisplay: clinic.profile.phoneDisplay,
    phoneTel: phoneToTel(clinic.profile.phoneDisplay),
    email: clinic.profile.email,
    streetAddress: clinic.profile.streetAddress,
    suburb: clinic.profile.suburb,
    state: clinic.profile.state,
    postcode: clinic.profile.postcode,
    openingHours: clinic.openingHours.map((hour) => ({
      dayOfWeek: hour.dayOfWeek,
      opens: hour.opens,
      closes: hour.closes,
    })),
    hotdocUrl: clinic.profile.hotdocUrl ?? "",
  };
  return {
    status: clinic.profile.contentStatus,
    pageId: null,
    payload: content,
    overlay: { clinic: content },
  };
}

async function storePayload(entityType: ReleaseEntity, entityId: string, clinicId: string, payload: Prisma.InputJsonValue) {
  if (entityType === "practitioner") {
    await prisma.practitioner.update({ where: { id: entityId }, data: { publishedPayload: payload, status: "published" } });
  } else if (entityType === "service") {
    await prisma.service.update({ where: { id: entityId }, data: { publishedPayload: payload, status: "published" } });
  } else if (entityType === "knowledge_article") {
    await prisma.knowledgeArticle.update({
      where: { id: entityId },
      data: { publishedPayload: payload, status: "published", publicationDate: new Date() },
    });
  } else if (entityType === "practice_update") {
    await prisma.practiceUpdate.update({
      where: { id: entityId },
      data: { publishedPayload: payload, status: "published", publishedAt: new Date() },
    });
  } else if (entityType === "practice_page") {
    await prisma.practicePage.update({ where: { id: entityId }, data: { publishedPayload: payload, status: "published" } });
  } else if (entityType === "knowledge_topic") {
    await prisma.knowledgeTopic.update({ where: { id: entityId }, data: { publishedPayload: payload, status: "published" } });
  } else {
    await prisma.clinicProfile.update({
      where: { clinicId },
      data: { publishedPayload: payload, contentStatus: "published" },
    });
  }
}

async function setStatus(entityType: ReleaseEntity, entityId: string, clinicId: string, status: PublicationStatus) {
  if (entityType === "practitioner") await prisma.practitioner.update({ where: { id: entityId }, data: { status } });
  else if (entityType === "service") await prisma.service.update({ where: { id: entityId }, data: { status } });
  else if (entityType === "knowledge_article") await prisma.knowledgeArticle.update({ where: { id: entityId }, data: { status } });
  else if (entityType === "practice_update") await prisma.practiceUpdate.update({ where: { id: entityId }, data: { status } });
  else if (entityType === "practice_page") await prisma.practicePage.update({ where: { id: entityId }, data: { status } });
  else if (entityType === "knowledge_topic") await prisma.knowledgeTopic.update({ where: { id: entityId }, data: { status } });
  else await prisma.clinicProfile.update({ where: { clinicId }, data: { contentStatus: status } });
}

async function statusOf(clinicId: string, entityType: ReleaseEntity, entityId: string): Promise<PublicationStatus | null> {
  const draft = await loadDraft(clinicId, entityType, entityId);
  return draft?.status ?? null;
}

async function pageIdOf(entityType: ReleaseEntity, entityId: string, clinicId: string): Promise<string | null> {
  const draft = await loadDraft(clinicId, entityType, entityId);
  return draft?.pageId ?? null;
}

async function workingSnapshot(clinicId: string, entityType: ReleaseEntity, entityId: string): Promise<Prisma.InputJsonValue | null> {
  const reviewFor = async (pageId: string | null) => {
    if (!pageId) return null;
    const review = await prisma.clinicalReview.findUnique({ where: { pageId } });
    if (!review) return null;
    return {
      pageId: review.pageId,
      reviewedBy: review.reviewedBy,
      reviewerSignedBy: review.reviewerSignedBy,
      approvedBy: review.approvedBy,
      approvalReference: review.approvalReference,
      approvedAt: review.approvedAt?.toISOString() ?? null,
      evidenceReference: review.evidenceReference,
      reviewedContentSha256: review.reviewedContentSha256,
      lastReviewed: review.lastReviewed?.toISOString().slice(0, 10) ?? null,
      nextReview: review.nextReview?.toISOString().slice(0, 10) ?? null,
      status: review.status,
    };
  };

  if (entityType === "practitioner") {
    const row = await prisma.practitioner.findFirst({ where: { id: entityId, clinicId } });
    if (!row) return null;
    return {
      name: row.name,
      qualifications: row.qualifications,
      biography: row.biography,
      languages: row.languages,
      areasOfCare: row.areasOfCare,
      professionalInterests: row.professionalInterests,
      portraitPath: row.portraitPath,
      bookingUrl: row.bookingUrl,
      status: row.status,
      publishedPayload: row.publishedPayload ?? null,
      governance: await reviewFor(row.pageId),
    };
  }
  if (entityType === "service") {
    const row = await prisma.service.findFirst({ where: { id: entityId, clinicId } });
    if (!row) return null;
    return {
      title: row.title,
      summary: row.summary,
      document: serviceDocumentFrom(row.patientEducation),
      faqs: row.faqs ?? null,
      relatedPractitioners: row.relatedPractitioners,
      status: row.status,
      publishedPayload: row.publishedPayload ?? null,
      governance: await reviewFor(row.pageId),
    };
  }
  if (entityType === "knowledge_article") {
    const row = await prisma.knowledgeArticle.findFirst({ where: { id: entityId, clinicId } });
    if (!row) return null;
    return {
      title: row.title,
      summary: row.summary,
      introduction: introductionOf(row.educationalContent),
      document: articleDocumentFrom(row.educationalContent),
      category: row.category,
      contentOwner: row.contentOwner,
      status: row.status,
      publishedPayload: row.publishedPayload ?? null,
      governance: await reviewFor(row.pageId),
    };
  }
  if (entityType === "practice_update") {
    const row = await prisma.practiceUpdate.findFirst({ where: { id: entityId, clinicId } });
    if (!row) return null;
    return {
      title: row.title,
      summary: row.summary,
      author: row.author,
      status: row.status,
      publishedPayload: row.publishedPayload ?? null,
      governance: await reviewFor(row.pageId),
    };
  }
  if (entityType === "knowledge_topic") {
    const row = await prisma.knowledgeTopic.findFirst({ where: { id: entityId, clinicId } });
    if (!row) return null;
    return {
      title: row.title,
      summary: row.summary,
      status: row.status,
      publishedPayload: row.publishedPayload ?? null,
      governance: await reviewFor(row.pageId),
    };
  }
  if (entityType === "practice_page") {
    const row = await prisma.practicePage.findFirst({ where: { id: entityId, clinicId } });
    if (!row) return null;
    return {
      title: row.title,
      summary: row.summary,
      contentOwner: row.contentOwner,
      document: practiceDocumentFrom(row.sections),
      status: row.status,
      publishedPayload: row.publishedPayload ?? null,
      governance: await reviewFor(row.pageId),
    };
  }
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
    openingHours: clinic.openingHours.map((hours) => ({
      dayOfWeek: hours.dayOfWeek,
      opens: hours.opens,
      closes: hours.closes,
    })),
    status: clinic.profile.contentStatus,
    publishedPayload: clinic.profile.publishedPayload ?? null,
    governance: null,
  };
}

function practitionerFrom(value: Prisma.JsonValue | null | undefined): PractitionerContent | null {
  return practitionerFromPayload(value);
}

function practiceText(value: Prisma.JsonValue | null | undefined): TextContent | null {
  const document = practiceDocumentFrom(value);
  if (!document) return textFrom(value);
  return { title: document.title, summary: document.summary, practiceDocument: document };
}

function serviceText(value: Prisma.JsonValue | null | undefined, pagePath: string): TextContent | null {
  const document = serviceDocumentFrom(value);
  if (!document) return textFrom(value, pagePath);
  return { title: document.title, summary: document.summary, serviceDocument: document, pagePath };
}

function textFrom(value: Prisma.JsonValue | null | undefined, pagePath = ""): TextContent | null {
  const data = record(value);
  if (!data) return null;
  const document = articleDocumentFrom(data);
  return {
    title: document?.title ?? String(data.title ?? ""),
    summary: document?.summary ?? String(data.summary ?? ""),
    introduction: document
      ? document.sections.find((section) => section.id === "introduction")?.paragraphs[0]
      : data.introduction
        ? String(data.introduction)
        : undefined,
    author: data.author ? String(data.author) : undefined,
    sourceAuthor: data.sourceAuthor ? String(data.sourceAuthor) : undefined,
    document: document ?? undefined,
    pagePath: pagePath || (data.pagePath ? String(data.pagePath) : ""),
  };
}

function clinicFrom(value: Prisma.JsonValue | null | undefined): ClinicContent | null {
  const data = record(value);
  if (!data) return null;
  return {
    phoneDisplay: String(data.phoneDisplay ?? ""),
    phoneTel: String(data.phoneTel ?? ""),
    email: String(data.email ?? ""),
    streetAddress: String(data.streetAddress ?? ""),
    suburb: String(data.suburb ?? ""),
    state: String(data.state ?? ""),
    postcode: String(data.postcode ?? ""),
    openingHours: Array.isArray(data.openingHours)
      ? data.openingHours.flatMap((hour) => {
          if (!hour || typeof hour !== "object") return [];
          const row = hour as Record<string, unknown>;
          return [{ dayOfWeek: String(row.dayOfWeek ?? ""), opens: String(row.opens ?? ""), closes: String(row.closes ?? "") }];
        })
      : [],
    hotdocUrl: data.hotdocUrl ? String(data.hotdocUrl) : "",
  };
}

function introductionOf(value: Prisma.JsonValue | null): string {
  const document = articleDocumentFrom(value);
  const introduction = document?.sections.find((section) => section.id === "introduction")?.paragraphs[0];
  if (introduction) return introduction;
  const data = record(value);
  return data && typeof data.introduction === "string" ? data.introduction : "";
}

async function knowledgeProblems(clinicId: string, pages: Array<{ path: string; current: string; next: string }>) {
  const article = pages.find((page) => page.path.startsWith("knowledge/articles/")) ?? pages[0];
  if (!article) return { problems: ["The article page could not be checked."], report: null };
  const known = await prisma.page.findMany({ where: { clinicId, status: "published" }, select: { path: true } });
  const problems = articleLinkProblems(article.next, article.path, new Set(known.map((page) => page.path)));
  const hubPages = await prisma.page.findMany({
    where: { clinicId, status: "published", path: { startsWith: "knowledge/" } },
    select: { path: true, publishedRevision: { select: { html: true } } },
  });
  const hubs = knowledgeHubs(
    article.path,
    hubPages.flatMap((page) => (page.publishedRevision?.html ? [{ path: page.path, html: page.publishedRevision.html }] : [])),
  );
  if (hubs.some((hub) => !hub.linked)) problems.push("A Knowledge Centre hub no longer links to this article.");
  return {
    problems,
    report: {
      internalLinksValid: problems.length === 0,
      relatedServicesValid: problems.some((problem) => problem.includes("service")) === false,
      relatedPractitionersValid: problems.some((problem) => problem.includes("practitioner")) === false,
      hubs,
    },
  };
}

async function practiceProblems(clinicId: string, pages: Array<{ path: string; current: string; next: string }>) {
  const page = pages[0];
  if (!page) return { problems: ["The page could not be checked."], report: null };
  const known = await prisma.page.findMany({ where: { clinicId, status: "published" }, select: { path: true } });
  const problems = practiceLinkProblems(page.current, page.next, page.path, new Set(known.map((item) => item.path)));
  return {
    problems,
    report: {
      internalLinksValid: problems.some((problem) => problem.startsWith("Internal") || problem.startsWith("Links") || problem.startsWith("A link")) === false,
      footerLinksValid: problems.some((problem) => problem.startsWith("Footer")) === false,
    },
  };
}

async function serviceProblems(clinicId: string, pages: Array<{ path: string; current: string; next: string }>) {
  const page = pages.find((item) => item.path.startsWith("services/")) ?? pages[0];
  if (!page) return { problems: ["The service page could not be checked."], report: null };
  const known = await prisma.page.findMany({ where: { clinicId, status: "published" }, select: { path: true } });
  const problems = serviceLinkProblems(page.next, page.path, new Set(known.map((item) => item.path)));
  return {
    problems,
    report: {
      internalLinksValid: problems.length === 0,
      relatedPractitionersValid: problems.some((problem) => problem.toLowerCase().includes("practitioner")) === false,
    },
  };
}

function record(value: Prisma.JsonValue | null | undefined): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

async function unchangedAssets(): Promise<string[]> {
  const reasons: string[] = [];
  for (const file of ["styles.css", "site.js"]) {
    const golden = await readFile(path.join(goldenHtmlRoot(), file));
    const platform = await readFile(path.join(webRoot(), "public", file));
    if (!golden.equals(platform)) reasons.push(`${file} no longer matches the approved file.`);
  }
  return reasons;
}

async function writePublishReport(
  entry: { entityType: string; entityId: string },
  pages: Array<{ path: string; current: string; next: string }>,
  extra: Record<string, unknown> | null,
) {
  const checked = pages.map((page) => {
    const comparison = comparePublishedPages(page.current, page.next);
    return {
      path: page.path,
      contentChanged: page.current !== page.next,
      navigationUnchanged: comparison.reasons.includes("Navigation changed.") === false,
      layoutUnchanged: comparison.ok,
      schemaUnchanged: comparison.reasons.some((reason) => reason.includes("Schema")) === false,
      accessibilityUnchanged:
        comparison.reasons.some((reason) => reason.includes("skip link") || reason.includes("main landmark") || reason.includes("appointment")) ===
        false,
      reasons: comparison.reasons,
    };
  });
  const report = {
    publishedAt: new Date().toISOString(),
    entityType: entry.entityType,
    entityId: entry.entityId,
    cssUnchanged: true,
    javascriptUnchanged: true,
    ...(extra ?? {}),
    pages: checked,
  };
  const directory = path.join(webRoot(), "reports");
  await mkdir(directory, { recursive: true });
  await writeFile(path.join(directory, "publish-regression.json"), JSON.stringify(report, null, 2));
}
