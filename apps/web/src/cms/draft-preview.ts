/**
 * Clinic-scoped, expiring, revocable draft preview tokens.
 * Preview HTML is never written to public cache and always carries noindex.
 */

import { createHash, randomBytes } from "node:crypto";
import { applyOverlay, practitionerFromPayload, type TextContent } from "@/cms/overlay";
import { articleDocumentFrom } from "@/cms/article-document";
import { practiceDocumentFrom } from "@/cms/practice-document";
import { serviceDocumentFrom } from "@/cms/service-document";
import { writeAuditLog } from "@/cms/audit";
import { prisma } from "@/db/prisma";
import { applyStagingNoIndexMeta } from "@/seo/staging-noindex";
import type { Prisma } from "@prisma/client";

const DEFAULT_TTL_MS = 30 * 60 * 1000;

export function hashPreviewToken(rawToken: string): string {
  return createHash("sha256").update(rawToken, "utf8").digest("hex");
}

export function mintPreviewTokenSecret(): string {
  return randomBytes(32).toString("base64url");
}

export async function createDraftPreviewToken(input: {
  clinicId: string;
  createdById: string;
  pageId?: string;
  entityType?: string;
  entityId?: string;
  ttlMs?: number;
}): Promise<{ token: string; expiresAt: Date; id: string }> {
  if (!input.pageId && !(input.entityType && input.entityId)) {
    throw new Error("Preview requires a page or entity target.");
  }
  if (input.pageId) {
    const page = await prisma.page.findFirst({
      where: { id: input.pageId, clinicId: input.clinicId },
      select: { id: true },
    });
    if (!page) throw new Error("Page not found for this clinic.");
  }

  const token = mintPreviewTokenSecret();
  const expiresAt = new Date(Date.now() + (input.ttlMs ?? DEFAULT_TTL_MS));
  const row = await prisma.draftPreviewToken.create({
    data: {
      clinicId: input.clinicId,
      pageId: input.pageId ?? null,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      tokenHash: hashPreviewToken(token),
      createdById: input.createdById,
      expiresAt,
    },
    select: { id: true },
  });
  await writeAuditLog({
    clinicId: input.clinicId,
    actorId: input.createdById,
    action: "preview.token_create",
    entityType: input.entityType ?? "page",
    entityId: input.entityId ?? input.pageId ?? null,
    metadata: { tokenId: row.id, expiresAt: expiresAt.toISOString() },
  });
  return { token, expiresAt, id: row.id };
}

export async function revokeDraftPreviewToken(input: {
  clinicId: string;
  tokenId: string;
  actorId: string;
}): Promise<boolean> {
  const existing = await prisma.draftPreviewToken.findFirst({
    where: { id: input.tokenId, clinicId: input.clinicId, revokedAt: null },
    select: { id: true },
  });
  if (!existing) return false;
  await prisma.draftPreviewToken.update({
    where: { id: existing.id },
    data: { revokedAt: new Date() },
  });
  await writeAuditLog({
    clinicId: input.clinicId,
    actorId: input.actorId,
    action: "preview.token_revoke",
    entityType: "draft_preview_token",
    entityId: existing.id,
  });
  return true;
}

export async function resolveDraftPreviewToken(rawToken: string, clinicId: string) {
  const tokenHash = hashPreviewToken(rawToken);
  const row = await prisma.draftPreviewToken.findFirst({
    where: {
      tokenHash,
      clinicId,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
  return row;
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

/**
 * Render a draft overlay for preview without touching publishedPayload or public cache.
 */
export async function renderDraftPagePreview(input: {
  clinicId: string;
  pageId: string;
}): Promise<{ ok: true; html: string; path: string } | { ok: false; reason: string }> {
  const page = await prisma.page.findFirst({
    where: { id: input.pageId, clinicId: input.clinicId },
    include: {
      publishedRevision: true,
      practitioner: true,
      service: true,
      knowledgeArticle: true,
      practiceUpdate: true,
      practicePage: true,
    },
  });
  if (!page) return { ok: false, reason: "Page not found for this clinic." };
  const html = page.publishedRevision?.html;
  if (!html) return { ok: false, reason: "No HTML revision available to preview against." };

  // Draft preview prefers working entity fields merged over publishedPayload (never writes payload).
  const practitionerDraft = page.practitioner
    ? practitionerFromPayload({
        ...(record(page.practitioner.publishedPayload) ?? {}),
        name: page.practitioner.name,
        biography: page.practitioner.biography,
        bookingUrl: page.practitioner.bookingUrl,
      })
    : null;

  const overlaid = applyOverlay(html, {
    practitioner: practitionerDraft,
    service: textContent(
      page.service
        ? {
            ...(record(page.service.publishedPayload) ?? {}),
            title: page.service.title,
            summary: page.service.summary,
          }
        : null,
      page.path,
    ),
    article: textContent(
      page.knowledgeArticle
        ? {
            ...(record(page.knowledgeArticle.publishedPayload) ?? {}),
            title: page.knowledgeArticle.title,
            summary: page.knowledgeArticle.summary,
          }
        : null,
      page.path,
    ),
    update: textContent(
      page.practiceUpdate
        ? {
            ...(record(page.practiceUpdate.publishedPayload) ?? {}),
            title: page.practiceUpdate.title,
            summary: page.practiceUpdate.summary,
          }
        : null,
    ),
    practice: textContent(
      page.practicePage
        ? {
            ...(record(page.practicePage.publishedPayload) ?? {}),
            title: page.practicePage.title,
            summary: page.practicePage.summary,
          }
        : null,
      page.path,
    ),
  });

  if (overlaid.errors.length > 0) {
    return { ok: false, reason: overlaid.errors.join(" ") };
  }

  const banner =
    `<div data-wmc-draft-preview="true" style="position:sticky;top:0;z-index:9999;background:#7c2d12;color:#fff;padding:10px 16px;font:600 14px/1.4 system-ui,sans-serif">` +
    `DRAFT PREVIEW — not published — clinic-scoped — do not index</div>`;
  const withBanner = overlaid.html.replace(/<body\b[^>]*>/i, (open) => `${open}${banner}`);
  const noindex = applyStagingNoIndexMeta(withBanner);
  return { ok: true, html: noindex, path: page.path };
}
