import { redirect } from "next/navigation";
import type { MembershipRole } from "@prisma/client";
import { requireUser } from "@/auth/session";
import { assertRole, canAccessClinic, highestRoleForClinic, PermissionDeniedError, type CmsAction } from "@/auth/permissions";
import { prisma } from "@/db/prisma";

export async function editorContext() {
  const user = await requireUser();
  const memberships = await prisma.clinicMembership.findMany({
    where: { userId: user.id },
    select: { clinicId: true, role: true },
  });
  const slug = process.env.DEFAULT_CLINIC_SLUG || "woolloongabba";
  const clinic = await prisma.clinic.findUnique({
    where: { slug },
    include: { profile: true, openingHours: { orderBy: { dayOfWeek: "asc" } } },
  });
  const role = clinic ? highestRoleForClinic(memberships, clinic.id) : null;
  const allowed = clinic ? canAccessClinic(memberships, clinic.id) : false;
  return { user, memberships, clinic, role: allowed ? role : null };
}

export async function requireAction(action: CmsAction) {
  const context = await editorContext();
  if (!context.clinic || !context.role) redirect("/admin");
  try {
    assertRole(context.role, action);
  } catch (error) {
    if (error instanceof PermissionDeniedError) redirect("/admin");
    throw error;
  }
  return context as typeof context & { clinic: NonNullable<typeof context.clinic>; role: MembershipRole };
}
