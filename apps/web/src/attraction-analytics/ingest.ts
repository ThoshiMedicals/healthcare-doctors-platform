import type {
  GpAttractionChannel,
  GpAttractionPersonaHint,
  GpAttractionSurface,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/db/prisma";
import {
  ATTRACTION_EVENT_NAMES,
  ATTRACTION_SURFACES,
  looksLikePiiPayload,
  type AttractionEventName,
} from "./event-schema";

export type IngestEventInput = {
  name: string;
  anonymousSessionId: string;
  surface?: string | null;
  toolId?: string | null;
  path?: string | null;
  referrerPath?: string | null;
  faqId?: string | null;
  ctaId?: string | null;
  stepId?: string | null;
  stepIndex?: number | null;
  lastStepId?: string | null;
  fromSurface?: string | null;
  toSurface?: string | null;
  vote?: string | null;
  eoiSubmissionId?: string | null;
  moduleId?: string | null;
  packId?: string | null;
  personaHint?: string | null;
  channel?: string | null;
  deviceClass?: string | null;
  durationMs?: number | null;
  props?: Record<string, unknown> | null;
  occurredAt?: string | Date | null;
};

function asSurface(v?: string | null): GpAttractionSurface | undefined {
  if (!v) return undefined;
  return (ATTRACTION_SURFACES as readonly string[]).includes(v)
    ? (v as GpAttractionSurface)
    : undefined;
}

export function validateAttractionEvent(input: IngestEventInput): string | null {
  if (!input.name || !(ATTRACTION_EVENT_NAMES as readonly string[]).includes(input.name)) {
    return `Invalid event name: ${input.name}`;
  }
  if (!input.anonymousSessionId?.trim()) return "anonymousSessionId required";
  const pii = looksLikePiiPayload(input as unknown as Record<string, unknown>);
  if (pii) return pii;
  if (input.props) {
    const propsPii = looksLikePiiPayload(input.props);
    if (propsPii) return propsPii;
  }
  const name = input.name as AttractionEventName;
  if (name === "faq_open" && !input.faqId) return "faqId required for faq_open";
  if (name === "tool_complete" && !input.toolId) return "toolId required for tool_complete";
  if (name === "eoi_submit" && !input.eoiSubmissionId) return "eoiSubmissionId required for eoi_submit";
  if (name === "path_edge" && (!input.fromSurface || !input.toSurface)) {
    return "fromSurface and toSurface required for path_edge";
  }
  if (name === "pack_download" && !input.packId && !input.ctaId) {
    return "packId or ctaId required for pack_download";
  }
  if (name === "module_view" && !input.moduleId) return "moduleId required for module_view";
  const opportunityEvents = new Set([
    "gp_opportunities_view",
    "job_card_open",
    "job_detail_view",
    "opportunity_to_pack",
    "opportunity_to_eoi",
    "opportunity_to_contact",
  ]);
  if (opportunityEvents.has(name)) {
    const opportunityId =
      (input.props && typeof input.props.opportunityId === "string"
        ? input.props.opportunityId
        : null) || input.ctaId;
    if (!opportunityId) {
      return "opportunityId required in props (or ctaId) for opportunity events";
    }
  }
  return null;
}

export async function ingestAttractionEvents(
  clinicId: string,
  events: IngestEventInput[],
): Promise<{ accepted: number; rejected: Array<{ index: number; error: string }> }> {
  const rejected: Array<{ index: number; error: string }> = [];
  const rows: Prisma.GpAttractionEventCreateManyInput[] = [];

  events.forEach((ev, index) => {
    const error = validateAttractionEvent(ev);
    if (error) {
      rejected.push({ index, error });
      return;
    }
    rows.push({
      clinicId,
      name: ev.name,
      anonymousSessionId: ev.anonymousSessionId.trim(),
      surface: asSurface(ev.surface),
      toolId: ev.toolId ?? undefined,
      path: ev.path ?? undefined,
      referrerPath: ev.referrerPath ?? undefined,
      faqId: ev.faqId ?? undefined,
      ctaId: ev.ctaId ?? undefined,
      stepId: ev.stepId ?? undefined,
      stepIndex: ev.stepIndex ?? undefined,
      lastStepId: ev.lastStepId ?? undefined,
      fromSurface: asSurface(ev.fromSurface),
      toSurface: asSurface(ev.toSurface),
      vote: ev.vote ?? undefined,
      eoiSubmissionId: ev.eoiSubmissionId ?? undefined,
      moduleId: ev.moduleId ?? undefined,
      packId: ev.packId ?? undefined,
      personaHint: (ev.personaHint as GpAttractionPersonaHint) || "unknown",
      channel: (ev.channel as GpAttractionChannel) || "unknown",
      deviceClass: ev.deviceClass ?? undefined,
      durationMs: ev.durationMs ?? undefined,
      props: (ev.props as Prisma.InputJsonValue | undefined) ?? undefined,
      occurredAt: ev.occurredAt ? new Date(ev.occurredAt) : undefined,
    });
  });

  if (rows.length) {
    await prisma.gpAttractionEvent.createMany({ data: rows });
  }

  return { accepted: rows.length, rejected };
}

/** Server-side emit helpers for pipeline integrations (still advisory). */
export async function trackServerEvent(
  clinicId: string,
  event: IngestEventInput,
) {
  const result = await ingestAttractionEvents(clinicId, [event]);
  if (result.rejected.length) {
    throw new Error(result.rejected[0].error);
  }
  return result;
}
