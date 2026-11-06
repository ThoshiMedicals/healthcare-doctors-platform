import { NextResponse } from "next/server";
import { requireAction } from "@/cms/context";
import { getPipelineBoard } from "@/gp-pipeline/board";
import { PIPELINE_NOTIFICATION_CATALOG } from "@/gp-pipeline/notifications";
import { API_INTEGRATIONS, PIPELINE_STAGES } from "@/gp-pipeline/workflow-map";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const { clinic } = await requireAction("edit");
  const board = await getPipelineBoard(clinic.id);
  return NextResponse.json({
    ...board,
    apiIntegrations: API_INTEGRATIONS,
    notificationCatalog: PIPELINE_NOTIFICATION_CATALOG,
    workflowMap: PIPELINE_STAGES,
  });
}
