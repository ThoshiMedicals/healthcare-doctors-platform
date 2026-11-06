import { ZodError } from "zod";
import { writeAuditLog } from "@/cms/audit";
import { notifyPatientRequestCreated } from "@/cms/patient-request-notify";
import { appendFormRequestHistory } from "@/cms/patient-requests";
import { prisma } from "@/db/prisma";
import { parseFormRequest } from "@/forms/form-request";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ clinicSlug: string }> },
) {
  const { clinicSlug } = await context.params;
  const clinic = await prisma.clinic.findUnique({
    where: { slug: clinicSlug },
    include: { profile: { select: { email: true } } },
  });
  if (!clinic || clinic.status !== "live") {
    return Response.json({ error: "Clinic not found." }, { status: 404 });
  }

  try {
    const input = await parseFormRequest(request);
    const history = appendFormRequestHistory([], {
      at: new Date().toISOString(),
      action: "created",
      to: "new",
      note: `${input.formType} submitted from public forms`,
    });

    const created = await prisma.formRequest.create({
      data: {
        clinicId: clinic.id,
        name: input.name,
        email: input.email || null,
        phone: input.phone || null,
        formType: input.formType,
        delivery: input.delivery ?? null,
        status: "new",
        history,
        privacyConfirmedAt: new Date(),
      },
    });

    await writeAuditLog({
      clinicId: clinic.id,
      action: "form_request.created",
      entityType: "FormRequest",
      entityId: created.id,
      metadata: { formType: created.formType, delivery: created.delivery, status: created.status },
    });

    const origin = new URL(request.url).origin;
    await notifyPatientRequestCreated({
      clinicId: clinic.id,
      clinicName: clinic.practiceName,
      clinicEmail: clinic.profile?.email ?? null,
      requestId: created.id,
      name: created.name,
      email: created.email,
      phone: created.phone,
      formType: created.formType,
      delivery: created.delivery,
      adminUrl: `${origin}/admin/operations/patient-requests/${created.id}`,
    });

    return Response.json({ id: created.id }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Check the form fields and privacy confirmation." }, { status: 400 });
    }
    throw error;
  }
}
