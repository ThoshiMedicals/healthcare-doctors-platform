import { cache } from "react";
import { redirect } from "next/navigation";
import type { MembershipRole } from "@prisma/client";
import { requireUser } from "@/auth/session";
import { assertRole, canAccessClinic, highestRoleForClinic, PermissionDeniedError, type CmsAction } from "@/auth/permissions";
import {
  canSwitchClinic,
  readActiveClinicCookie,
  resolveActiveClinicSlug,
} from "@/cms/active-clinic";
import { prisma } from "@/db/prisma";

/**
 * Request-scoped clinic shell context. Cached so layout + page do not double-query.
 * Intentionally lean (no profile/hours) — settings loads those itself.
 */
export const editorContext = cache(async () => {
  const user = await requireUser();
  const memberships = await prisma.clinicMembership.findMany({
    where: { userId: user.id },
    select: { clinicId: true, role: true },
  });

  // Provisional role from any membership so switch_clinic holders can resolve cookie clinic.
  const provisionalRole =
    memberships.find((m) => canSwitchClinic(m.role))?.role ??
    memberships[0]?.role ??
    null;

  const slug = await resolveActiveClinicSlug(
    memberships,
    provisionalRole,
    await readActiveClinicCookie(),
  );

  const clinic = await prisma.clinic.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      practiceName: true,
      status: true,
    },
  });
  const role = clinic ? highestRoleForClinic(memberships, clinic.id) : null;
  const allowed = clinic ? canAccessClinic(memberships, clinic.id) : false;
  return {
    user,
    memberships,
    clinic,
    role: allowed ? role : null,
    canSwitchClinic: canSwitchClinic(allowed ? role : provisionalRole),
  };
});

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
