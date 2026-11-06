import { NextResponse } from "next/server";
import { requireAction } from "@/cms/context";
import {
  doctorProfileDashboardStats,
  importDoctorProfileFromPractitioner,
  listDoctorProfiles,
  seedNamedProfileStubs,
} from "@/gp-pipeline/doctor-profile";
import { prisma } from "@/db/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const { clinic } = await requireAction("edit");
  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "all";
  const q = url.searchParams.get("q") || undefined;
  const [profiles, stats, practitioners] = await Promise.all([
    listDoctorProfiles(clinic.id, { status, q }),
    doctorProfileDashboardStats(clinic.id),
    prisma.practitioner.findMany({
      where: { clinicId: clinic.id },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, status: true },
    }),
  ]);
  return NextResponse.json({ profiles, stats, practitioners });
}

export async function POST(request: Request) {
  const { clinic, user } = await requireAction("edit");
  const body = await request.json().catch(() => null);
  if (!body?.action) {
    return NextResponse.json({ error: "action required" }, { status: 400 });
  }

  try {
    if (body.action === "import") {
      if (!body.practitionerId) {
        return NextResponse.json({ error: "practitionerId required" }, { status: 400 });
      }
      const profile = await importDoctorProfileFromPractitioner({
        clinicId: clinic.id,
        practitionerId: String(body.practitionerId),
        actorUserId: user.id,
        actorName: user.name || user.email || user.id,
      });
      return NextResponse.json({ profile }, { status: 201 });
    }

    if (body.action === "seed_examples") {
      const seeded = await seedNamedProfileStubs(clinic.id);
      const published = await prisma.practitioner.findMany({
        where: { clinicId: clinic.id, status: "published" },
        orderBy: { name: "asc" },
        take: 2,
        select: { id: true },
      });
      const imports = [];
      for (const practitioner of published) {
        const existing = await prisma.gpDoctorProfileDraft.findFirst({
          where: { clinicId: clinic.id, practitionerId: practitioner.id, source: "practitioner_import" },
        });
        if (existing) {
          imports.push(existing);
          continue;
        }
        imports.push(
          await importDoctorProfileFromPractitioner({
            clinicId: clinic.id,
            practitionerId: practitioner.id,
            actorUserId: user.id,
            actorName: user.name || user.email || user.id,
          }),
        );
      }
      return NextResponse.json({ seeded, imports }, { status: 201 });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Request failed" },
      { status: 400 },
    );
  }
}
