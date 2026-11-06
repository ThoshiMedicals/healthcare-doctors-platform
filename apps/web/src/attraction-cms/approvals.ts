import type {
  AttractionApprovalDecision,
  AttractionChangeClass,
  AttractionPublishState,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/db/prisma";
import {
  assertNotProductionPublish,
  fingerprintAttractionBody,
  PRODUCTION_PUBLISH_BLOCKED,
} from "./documents";
import { isHumanReviewerId } from "./schema-rules";
import { validateAttractionBody } from "./validate-schema";

export type RecordApprovalInput = {
  clinicId: string;
  documentId: string;
  revisionId: string;
  decision: AttractionApprovalDecision;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: string;
  rationale: string;
  checklistSnapshot?: Prisma.InputJsonValue;
  changeClass?: AttractionChangeClass;
};

const DECISION_TRANSITIONS: Record<
  AttractionApprovalDecision,
  { from: AttractionPublishState[]; to: AttractionPublishState }
> = {
  submit_for_review: { from: ["drafting", "on_hold"], to: "in_review" },
  request_changes: { from: ["in_review", "approved"], to: "drafting" },
  approve: { from: ["in_review"], to: "approved" },
  pause: { from: ["drafting", "in_review", "approved"], to: "on_hold" },
  archive: { from: ["drafting", "in_review", "approved", "on_hold", "review_due"], to: "archived" },
  approve_publish_intent: { from: ["approved"], to: "approved" },
};

export async function recordAttractionApproval(input: RecordApprovalInput) {
  if (!isHumanReviewerId(input.reviewerId)) {
    throw new Error("Human approvals only — reviewerId cannot be system/auto/bot");
  }
  if (!input.reviewerName.trim()) {
    throw new Error("reviewerName is required");
  }
  if (!input.rationale.trim()) {
    throw new Error("rationale is required");
  }

  const document = await prisma.attractionDocument.findFirst({
    where: { id: input.documentId, clinicId: input.clinicId },
  });
  if (!document) throw new Error("Attraction document not found");

  const revision = await prisma.attractionRevision.findFirst({
    where: { id: input.revisionId, documentId: document.id },
  });
  if (!revision) throw new Error("Attraction revision not found");
  if (!revision.immutable) {
    throw new Error("Only immutable revisions can be approved");
  }

  const transition = DECISION_TRANSITIONS[input.decision];
  if (!transition.from.includes(document.publishState)) {
    throw new Error(
      `Decision ${input.decision} not allowed from state ${document.publishState}`,
    );
  }

  assertNotProductionPublish(transition.to);

  const bodySha = fingerprintAttractionBody(revision.body);
  if (bodySha !== revision.contentSha256) {
    throw new Error("Revision contentSha256 does not match body fingerprint — refuse approval");
  }

  const validation = validateAttractionBody(document.kind, revision.body);
  if (
    (input.decision === "approve" || input.decision === "approve_publish_intent") &&
    !validation.passed
  ) {
    throw new Error(`Schema validation failed: ${validation.violations.join("; ")}`);
  }

  if (input.decision === "approve_publish_intent") {
    // Explicit Phase 1 policy: record intent + keep approved; never set published.
    const event = await prisma.$transaction(async (tx) => {
      await tx.attractionSchemaValidation.create({
        data: {
          documentId: document.id,
          revisionId: revision.id,
          ruleSetKey: validation.ruleSetKey,
          passed: validation.passed,
          violations: validation.violations,
        },
      });
      return tx.attractionApprovalEvent.create({
        data: {
          documentId: document.id,
          revisionId: revision.id,
          fromState: document.publishState,
          toState: "approved",
          decision: input.decision,
          changeClass: input.changeClass ?? revision.changeClass,
          reviewerId: input.reviewerId,
          reviewerName: input.reviewerName.trim(),
          reviewerRole: input.reviewerRole.trim() || "practice_manager",
          rationale: `${input.rationale.trim()}\n\n[${PRODUCTION_PUBLISH_BLOCKED}]`,
          checklistSnapshot: input.checklistSnapshot,
          reviewedContentSha256: revision.contentSha256,
        },
      });
    });
    return {
      event,
      document: await prisma.attractionDocument.findUniqueOrThrow({ where: { id: document.id } }),
      productionPublishBlocked: true as const,
      message: PRODUCTION_PUBLISH_BLOCKED,
    };
  }

  const event = await prisma.$transaction(async (tx) => {
    await tx.attractionSchemaValidation.create({
      data: {
        documentId: document.id,
        revisionId: revision.id,
        ruleSetKey: validation.ruleSetKey,
        passed: validation.passed,
        violations: validation.violations,
      },
    });

    const created = await tx.attractionApprovalEvent.create({
      data: {
        documentId: document.id,
        revisionId: revision.id,
        fromState: document.publishState,
        toState: transition.to,
        decision: input.decision,
        changeClass: input.changeClass ?? revision.changeClass,
        reviewerId: input.reviewerId,
        reviewerName: input.reviewerName.trim(),
        reviewerRole: input.reviewerRole.trim() || "content_editor",
        rationale: input.rationale.trim(),
        checklistSnapshot: input.checklistSnapshot,
        reviewedContentSha256: revision.contentSha256,
      },
    });

    await tx.attractionDocument.update({
      where: { id: document.id },
      data: { publishState: transition.to },
    });

    return created;
  });

  return {
    event,
    document: await prisma.attractionDocument.findUniqueOrThrow({ where: { id: document.id } }),
    productionPublishBlocked: false as const,
  };
}

/**
 * Hard block — Phase 1 never sets publishedRevisionId or publishState=published.
 */
export async function publishAttractionDocumentToProduction(): Promise<never> {
  throw new Error(PRODUCTION_PUBLISH_BLOCKED);
}
