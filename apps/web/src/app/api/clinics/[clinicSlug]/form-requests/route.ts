import { ZodError } from "zod";
import { prisma } from "@/db/prisma";
import { writeAuditLog } from "@/cms/audit";
import { parseFormRequest } from "@/forms/form-request";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(
  request: Request,
  context: { params: Promise<{ clinicSlug: string }> },
) {
  const { clinicSlug } = await context.params;
  const clinic = await prisma.clinic.findUnique({ where: { slug: clinicSlug } });
  if (!clinic || clinic.status !== "live") {
    return Response.json({ error: "Clinic not found." }, { status: 404 });
  }

  try {
    const input = await parseFormRequest(request);
    const created = await prisma.formRequest.create({
      data: {
        clinicId: clinic.id,
        name: input.name,
        email: input.email || null,
        phone: input.phone || null,
        formType: input.formType,
        delivery: input.delivery ?? null,
        privacyConfirmedAt: new Date(),
      },
    });

    await writeAuditLog({
      clinicId: clinic.id,
      action: "form_request.created",
      entityType: "FormRequest",
      entityId: created.id,
      metadata: { formType: created.formType, delivery: created.delivery },
    });

    return Response.json({ id: created.id }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Check the form fields and privacy confirmation." }, { status: 400 });
    }
    throw error;
  }
}
