import type {
  AttractionChangeClass,
  AttractionDocumentKind,
  AttractionPublishState,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/db/prisma";
import { fingerprintContent } from "@/governance/fingerprint";
import { ruleSetForKind } from "./schema-rules";
import { validateAttractionBody } from "./validate-schema";

export const PRODUCTION_PUBLISH_BLOCKED =
  "Phase 1 Attraction CMS blocks production publish. Record approve_publish_intent only; live HTML publish ships in a later phase.";

export type CreateAttractionDocumentInput = {
  clinicId: string;
  kind: AttractionDocumentKind;
  slug: string;
  title: string;
  summary?: string;
  surfacePath?: string;
  draftBody: Prisma.InputJsonValue;
  changeClassDefault?: AttractionChangeClass;
  storyCaptureRef?: string;
  authorId?: string;
};

export type CreateRevisionInput = {
  documentId: string;
  clinicId: string;
  body: Prisma.InputJsonValue;
  changeClass?: AttractionChangeClass;
  authorId?: string;
  note?: string;
};

function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_key, v) => {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      return Object.fromEntries(Object.entries(v as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)));
    }
    return v;
  });
}

export function fingerprintAttractionBody(body: Prisma.JsonValue | Prisma.InputJsonValue): string {
  return fingerprintContent(stableStringify(body));
}

export async function listAttractionDocuments(clinicId: string, kind?: AttractionDocumentKind) {
  return prisma.attractionDocument.findMany({
    where: { clinicId, ...(kind ? { kind } : {}) },
    orderBy: [{ kind: "asc" }, { title: "asc" }],
    include: {
      publishedRevision: { select: { id: true, versionNumber: true, contentSha256: true, createdAt: true } },
      _count: { select: { revisions: true, approvalEvents: true } },
    },
  });
}

export async function getAttractionDocument(clinicId: string, documentId: string) {
  return prisma.attractionDocument.findFirst({
    where: { id: documentId, clinicId },
    include: {
      publishedRevision: true,
      revisions: { orderBy: { versionNumber: "desc" }, take: 20 },
      approvalEvents: { orderBy: { createdAt: "desc" }, take: 20 },
      schemaValidations: { orderBy: { checkedAt: "desc" }, take: 10 },
    },
  });
}

export async function createAttractionDocument(input: CreateAttractionDocumentInput) {
  const rules = ruleSetForKind(input.kind);
  const changeClass = input.changeClassDefault ?? defaultChangeClass(input.kind);

  return prisma.$transaction(async (tx) => {
    const document = await tx.attractionDocument.create({
      data: {
        clinicId: input.clinicId,
        kind: input.kind,
        slug: input.slug,
        title: input.title,
        summary: input.summary ?? "",
        surfacePath: input.surfacePath,
        schemaRuleSetKey: rules.key,
        changeClassDefault: changeClass,
        storyCaptureRef: input.storyCaptureRef,
        draftBody: input.draftBody,
        publishState: "drafting",
      },
    });

    const body = input.draftBody;
    const contentSha256 = fingerprintAttractionBody(body);
    const revision = await tx.attractionRevision.create({
      data: {
        documentId: document.id,
        versionNumber: 1,
        body,
        contentSha256,
        changeClass,
        authorId: input.authorId,
        immutable: true,
        note: "Initial revision",
      },
    });

    const validation = validateAttractionBody(input.kind, body as Prisma.JsonValue);
    await tx.attractionSchemaValidation.create({
      data: {
        documentId: document.id,
        revisionId: revision.id,
        ruleSetKey: validation.ruleSetKey,
        passed: validation.passed,
        violations: validation.violations,
      },
    });

    return { document, revision, validation };
  });
}

export async function updateAttractionDraft(
  clinicId: string,
  documentId: string,
  draftBody: Prisma.InputJsonValue,
  fields?: Partial<{ title: string; summary: string; surfacePath: string | null }>,
) {
  const existing = await prisma.attractionDocument.findFirst({
    where: { id: documentId, clinicId },
  });
  if (!existing) throw new Error("Attraction document not found");
  if (existing.publishState === "published") {
    throw new Error("Published documents cannot mutate draft without a new revision workflow");
  }

  return prisma.attractionDocument.update({
    where: { id: documentId },
    data: {
      draftBody,
      title: fields?.title ?? undefined,
      summary: fields?.summary ?? undefined,
      surfacePath: fields?.surfacePath === undefined ? undefined : fields.surfacePath,
    },
  });
}

export async function createAttractionRevision(input: CreateRevisionInput) {
  const document = await prisma.attractionDocument.findFirst({
    where: { id: input.documentId, clinicId: input.clinicId },
  });
  if (!document) throw new Error("Attraction document not found");

  const latest = await prisma.attractionRevision.findFirst({
    where: { documentId: document.id },
    orderBy: { versionNumber: "desc" },
  });
  const versionNumber = (latest?.versionNumber ?? 0) + 1;
  const changeClass = input.changeClass ?? document.changeClassDefault;
  const contentSha256 = fingerprintAttractionBody(input.body);

  return prisma.$transaction(async (tx) => {
    const revision = await tx.attractionRevision.create({
      data: {
        documentId: document.id,
        versionNumber,
        body: input.body,
        contentSha256,
        changeClass,
        authorId: input.authorId,
        immutable: true,
        note: input.note ?? "",
      },
    });

    await tx.attractionDocument.update({
      where: { id: document.id },
      data: {
        draftBody: input.body,
        publishState: document.publishState === "approved" ? "drafting" : document.publishState,
      },
    });

    const validation = validateAttractionBody(document.kind, input.body as Prisma.JsonValue);
    const schemaRow = await tx.attractionSchemaValidation.create({
      data: {
        documentId: document.id,
        revisionId: revision.id,
        ruleSetKey: validation.ruleSetKey,
        passed: validation.passed,
        violations: validation.violations,
      },
    });

    return { revision, validation: schemaRow, passed: validation.passed, violations: validation.violations };
  });
}

export function defaultChangeClass(kind: AttractionDocumentKind): AttractionChangeClass {
  if (kind === "registrar_pathway") return "C_clinical_or_capacity";
  if (kind === "story") return "B_substantive_copy";
  return "B_substantive_copy";
}

export function assertNotProductionPublish(toState: AttractionPublishState): void {
  if (toState === "published" || toState === "scheduled") {
    throw new Error(PRODUCTION_PUBLISH_BLOCKED);
  }
}
