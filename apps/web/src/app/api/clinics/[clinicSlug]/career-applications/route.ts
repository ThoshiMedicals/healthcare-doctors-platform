import { randomUUID } from "node:crypto";
import { ZodError } from "zod";
import { writeAuditLog } from "@/cms/audit";
import { notifyCareerApplicationCreated } from "@/cms/careers-application-notify";
import { storeCareerResume } from "@/cms/careers-applications";
import { prisma } from "@/db/prisma";
import { parseCareerApplicationForm } from "@/forms/career-application";

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
    const { input, resume } = await parseCareerApplicationForm(request);

    let vacancyId: string | null = null;
    let vacancyTitle: string | null = null;
    if (input.vacancyId) {
      const vacancy = await prisma.vacancy.findFirst({
        where: { id: input.vacancyId, clinicId: clinic.id },
        select: { id: true, title: true },
      });
      if (vacancy) {
        vacancyId = vacancy.id;
        vacancyTitle = vacancy.title;
      }
    }

    const applicationId = randomUUID();
    let resumeMeta: {
      resumeFileName: string;
      resumeStoragePath: string;
      resumeMimeType: string;
      resumeSizeBytes: number;
    } | null = null;

    if (resume) {
      const bytes = Buffer.from(await resume.arrayBuffer());
      const stored = await storeCareerResume({
        clinicId: clinic.id,
        applicationId,
        fileName: resume.name || "resume.pdf",
        mimeType: resume.type || "application/octet-stream",
        bytes,
      });
      resumeMeta = {
        resumeFileName: stored.fileName,
        resumeStoragePath: stored.storagePath,
        resumeMimeType: stored.mimeType,
        resumeSizeBytes: stored.sizeBytes,
      };
    }

    const created = await prisma.careerApplication.create({
      data: {
        id: applicationId,
        clinicId: clinic.id,
        vacancyId,
        name: input.name,
        email: input.email,
        phone: input.phone || "",
        roleInterest: input.roleInterest,
        message: input.message || "",
        status: "new",
        privacyConfirmedAt: new Date(),
        source: vacancyId ? "vacancy_interest" : "talent_community",
        ...resumeMeta,
      },
    });

    await writeAuditLog({
      clinicId: clinic.id,
      action: "career_application.created",
      entityType: "CareerApplication",
      entityId: created.id,
      metadata: {
        roleInterest: created.roleInterest,
        vacancyId: created.vacancyId,
        hasResume: Boolean(created.resumeStoragePath),
      },
    });

    const origin = new URL(request.url).origin;
    await notifyCareerApplicationCreated({
      clinicId: clinic.id,
      clinicName: clinic.practiceName,
      clinicEmail: clinic.profile?.email ?? null,
      applicationId: created.id,
      name: created.name,
      email: created.email,
      phone: created.phone,
      roleInterest: created.roleInterest,
      vacancyTitle,
      hasResume: Boolean(created.resumeStoragePath),
      adminUrl: `${origin}/admin/careers/applications/${created.id}`,
    });

    return Response.json({ id: created.id }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json({ error: "Check the form fields and privacy confirmation." }, { status: 400 });
    }
    if (error instanceof Error && /Resume|PDF|Word|5 MB|empty/i.test(error.message)) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
