import { NextResponse } from "next/server";
import type { GpStoryAttribution, GpStoryReuseChannel } from "@prisma/client";
import { requireAction } from "@/cms/context";
import {
  createConsentVersion,
  linkConsentToDraft,
  shareConsentSummary,
  signConsent,
} from "@/story-capture/consent";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { clinic, user } = await requireAction("edit");
  const { id } = await context.params;
  const body = await request.json().catch(() => null);
  if (!body?.action) {
    return NextResponse.json({ error: "action required" }, { status: 400 });
  }

  try {
    switch (body.action) {
      case "share_summary":
        return NextResponse.json({
          consent: await shareConsentSummary(clinic.id, id),
        });
      case "create_version":
        return NextResponse.json(
          {
            consent: await createConsentVersion({
              clinicId: clinic.id,
              storyId: id,
              consentVersion: body.consentVersion,
              channelsAllowed: body.channelsAllowed,
              attributionChosen: body.attributionChosen,
              linkedVersionId: body.linkedVersionId,
            }),
          },
          { status: 201 },
        );
      case "link_draft":
        return NextResponse.json({
          consent: await linkConsentToDraft({
            clinicId: clinic.id,
            storyId: id,
            consentId: String(body.consentId),
            versionId: String(body.versionId),
          }),
        });
      case "sign":
        return NextResponse.json({
          consent: await signConsent({
            clinicId: clinic.id,
            storyId: id,
            consentId: String(body.consentId),
            signedByName: String(body.signedByName),
            signedByEmail: body.signedByEmail ? String(body.signedByEmail) : undefined,
            documentUri: body.documentUri ? String(body.documentUri) : undefined,
            attributionChosen: body.attributionChosen as GpStoryAttribution,
            channelsAllowed: body.channelsAllowed as GpStoryReuseChannel[],
            commercialSilenceAck: Boolean(body.commercialSilenceAck),
            patientPrivacyAck: Boolean(body.patientPrivacyAck),
            editRightsAck: Boolean(body.editRightsAck),
            recordingAudioVideo: Boolean(body.recordingAudioVideo),
            actorUserId: user.id,
          }),
        });
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Consent action failed" },
      { status: 400 },
    );
  }
}
