import { articleDocumentFrom } from "@/cms/article-document";
import { serviceDocumentFrom } from "@/cms/service-document";
import { practiceDocumentFrom } from "@/cms/practice-document";
import { publishedRepeats } from "@/cms/repeat-bindings";
import { applyOverlay, applyRepeatBinding, practitionerFromPayload, type ClinicContent, type HourRow, type TextContent } from "@/cms/overlay";
import { prisma } from "@/db/prisma";
import { applyAccessibilityClosure } from "@/documents/accessibility";
import { Prisma } from "@prisma/client";

export type PublishedDocument = {
  path: string;
  template: string;
  html: string;
};

export type RenderedPage = {
  status: number;
  html: string;
  path: string;
};

/**
 * Returns the approved HTML for a published path, with published content values overlaid.
 * Draft content is ignored. Classes, IDs, and the stored golden revision stay in place.
 */
export async function getPublishedDocument(
  clinicId: string,
  path: string,
): Promise<PublishedDocument | null> {
  const page = await prisma.page.findUnique({
    where: { clinicId_path: { clinicId, path } },
    include: {
      publishedRevision: true,
      practitioner: true,
      service: true,
      knowledgeArticle: true,
      practiceUpdate: true,
      practicePage: true,
      clinic: { include: { profile: true } },
    },
  });

  if (!page || page.status !== "published" || page.publishedRevision?.html == null) return null;
  if (!page.publishedRevision.immutable) return null;

  const overlaid = applyOverlay(page.publishedRevision.html, {
    practitioner: practitionerFromPayload(page.practitioner?.publishedPayload),
    service: textContent(page.service?.publishedPayload, page.path),
    article: textContent(page.knowledgeArticle?.publishedPayload, page.path),
    update: textContent(page.practiceUpdate?.publishedPayload),
    practice: textContent(page.practicePage?.publishedPayload, page.path),
    clinic: clinicContent(page.clinic.profile?.publishedPayload),
  });
  const withMedia = await applyOtherPractitionerMedia(clinicId, page.practitioner?.id ?? null, overlaid.html);
  const html = await applyStoredRepeats(clinicId, withMedia);

  return {
    path: page.path,
    template: page.template,
    html,
  };
}

async function applyOtherPractitionerMedia(clinicId: string, ownerId: string | null, html: string): Promise<string> {
  if (!html.includes("data-practitioner-image") && !html.includes("www.hotdoc.com.au")) return html;
  const others = await prisma.practitioner.findMany({
    where: {
      clinicId,
      publishedPayload: { not: Prisma.DbNull },
      ...(ownerId ? { id: { not: ownerId } } : {}),
    },
    select: { publishedPayload: true },
  });
  let next = html;
  for (const other of others) {
    const content = practitionerFromPayload(other.publishedPayload);
    if (!content) continue;
    const mentionsPortrait = content.sourcePortraitFile ? next.includes(content.sourcePortraitFile) : false;
    const mentionsBooking = content.sourceBookingUrl ? next.includes(content.sourceBookingUrl) : false;
    if (!mentionsPortrait && !mentionsBooking) continue;
    const applied = applyOverlay(next, { practitioner: { ...content, profileText: false } });
    if (applied.errors.length === 0) next = applied.html;
  }
  return next;
}

function record(value: Prisma.JsonValue | null | undefined): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function textContent(value: Prisma.JsonValue | null | undefined, pagePath = ""): TextContent | null {
  const data = record(value);
  if (!data) return null;
  const service = serviceDocumentFrom(data);
  if (service) return { title: service.title, summary: service.summary, serviceDocument: service, pagePath };
  const practice = practiceDocumentFrom(data);
  if (practice) return { title: practice.title, summary: practice.summary, practiceDocument: practice, pagePath };
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
    pagePath,
  };
}

function clinicContent(value: Prisma.JsonValue | null | undefined): ClinicContent | null {
  const data = record(value);
  if (!data) return null;
  const hours = Array.isArray(data.openingHours) ? data.openingHours : [];
  return {
    phoneDisplay: String(data.phoneDisplay ?? ""),
    phoneTel: String(data.phoneTel ?? ""),
    email: String(data.email ?? ""),
    streetAddress: String(data.streetAddress ?? ""),
    suburb: String(data.suburb ?? ""),
    state: String(data.state ?? ""),
    postcode: String(data.postcode ?? ""),
    openingHours: hours.flatMap((hour) => {
      if (!hour || typeof hour !== "object") return [];
      const row = hour as Record<string, unknown>;
      return [{ dayOfWeek: String(row.dayOfWeek ?? ""), opens: String(row.opens ?? ""), closes: String(row.closes ?? "") } satisfies HourRow];
    }),
    hotdocUrl: data.hotdocUrl ? String(data.hotdocUrl) : "",
  };
}

async function applyStoredRepeats(clinicId: string, html: string): Promise<string> {
  const bindings = await publishedRepeats(clinicId);
  return bindings.reduce((current, binding) => applyRepeatBinding(current, binding), html);
}

/** Serves a stored page. Unknown paths receive the approved 404.html document with status 404. */
export async function renderStoredPage(clinicId: string, storagePath: string): Promise<RenderedPage | null> {
  const document = await getPublishedDocument(clinicId, storagePath);
  if (document) {
    return { status: 200, html: applyAccessibilityClosure(document.html, document.path), path: document.path };
  }

  if (storagePath === "404.html") return null;
  const notFound = await getPublishedDocument(clinicId, "404.html");
  if (!notFound) return null;
  return { status: 404, html: applyAccessibilityClosure(notFound.html, "404.html"), path: "404.html" };
}
