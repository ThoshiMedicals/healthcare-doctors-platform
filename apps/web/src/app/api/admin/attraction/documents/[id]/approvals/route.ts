import { NextResponse } from "next/server";
import type { AttractionApprovalDecision, AttractionChangeClass } from "@prisma/client";
import { requireAction } from "@/cms/context";
import {
  publishAttractionDocumentToProduction,
  recordAttractionApproval,
} from "@/attraction-cms/approvals";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const DECISIONS = new Set<AttractionApprovalDecision>([
  "submit_for_review",
  "request_changes",
  "approve",
  "pause",
  "archive",
  "approve_publish_intent",
]);

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { clinic, user, role } = await requireAction("clinical_signoff");
  const { id } = await context.params;
  const body = await request.json().catch(() => null);

  if (body?.action === "publish_production") {
    try {
      await publishAttractionDocumentToProduction();
    } catch (error) {
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : "Publish blocked",
          productionPublishBlocked: true,
        },
        { status: 403 },
      );
    }
  }

  if (!body?.revisionId || !body?.decision || !DECISIONS.has(body.decision)) {
    return NextResponse.json(
      { error: "revisionId and valid decision required" },
      { status: 400 },
    );
  }

  try {
    const result = await recordAttractionApproval({
      clinicId: clinic.id,
      documentId: id,
      revisionId: String(body.revisionId),
      decision: body.decision as AttractionApprovalDecision,
      reviewerId: user.id,
      reviewerName: user.name || user.email || user.id,
      reviewerRole: body.reviewerRole ? String(body.reviewerRole) : role,
      rationale: body.rationale ? String(body.rationale) : "",
      checklistSnapshot: body.checklistSnapshot,
      changeClass: body.changeClass as AttractionChangeClass | undefined,
    });
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Approval failed" },
      { status: 400 },
    );
  }
}
