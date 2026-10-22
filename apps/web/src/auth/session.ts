import { redirect } from "next/navigation";
import type { MembershipRole } from "@prisma/client";
import { auth } from "@/auth";
import { staffDisabled } from "@/auth/staff-status";
import { prisma } from "@/db/prisma";
import { canAccessClinic, highestRoleForClinic, type CmsAction, assertRole } from "@/auth/permissions";

export { staffDisabled };

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) redirect("/admin/login");
  if (await staffDisabled(session.user.id)) redirect("/admin/session-end");
  return session.user;
}

export async function requireClinicAccess(clinicId: string) {
  const user = await requireUser();
  const memberships = await prisma.clinicMembership.findMany({
    where: { userId: user.id },
    select: { clinicId: true, role: true },
  });
  if (!canAccessClinic(memberships, clinicId)) redirect("/admin");
  const role = highestRoleForClinic(memberships, clinicId);
  if (!role) redirect("/admin");
  return { user, role, memberships };
}

export async function requireClinicAction(clinicId: string, action: CmsAction) {
  const access = await requireClinicAccess(clinicId);
  assertRole(access.role, action);
  return access;
}

export type StaffAccess = {
  userId: string;
  role: MembershipRole;
  clinicId: string;
};
