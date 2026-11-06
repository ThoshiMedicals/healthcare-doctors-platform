import { cookies } from "next/headers";
import type { MembershipRole } from "@prisma/client";
import { canAccessClinic, isSuperAdmin, roleAllows } from "@/auth/permissions";
import { prisma } from "@/db/prisma";

export const ACTIVE_CLINIC_COOKIE = "wmc_active_clinic";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 180;

type MembershipRef = { clinicId: string; role: MembershipRole };

export function defaultClinicSlug(): string {
  return process.env.DEFAULT_CLINIC_SLUG || "woolloongabba";
}

export function canSwitchClinic(role: MembershipRole | null | undefined): boolean {
  return Boolean(role && roleAllows(role, "switch_clinic"));
}

/**
 * Resolve which clinic slug the admin session should use.
 * Network/Super Admin: cookie when valid, else DEFAULT_CLINIC_SLUG.
 * Clinic-scoped roles: their membership clinic (cookie ignored).
 */
export async function resolveActiveClinicSlug(
  memberships: readonly MembershipRef[],
  role: MembershipRole | null,
  cookieSlug?: string | null,
): Promise<string> {
  const fallback = defaultClinicSlug();

  if (!canSwitchClinic(role)) {
    const scoped = memberships.find((m) => !isSuperAdmin(m.role));
    if (scoped) {
      const clinic = await prisma.clinic.findUnique({
        where: { id: scoped.clinicId },
        select: { slug: true },
      });
      if (clinic) return clinic.slug;
    }
    return fallback;
  }

  const candidate = (cookieSlug || "").trim() || fallback;
  const clinic = await prisma.clinic.findUnique({
    where: { slug: candidate },
    select: { id: true, slug: true },
  });
  if (!clinic) return fallback;
  if (!canAccessClinic(memberships, clinic.id)) return fallback;
  return clinic.slug;
}

export async function readActiveClinicCookie(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(ACTIVE_CLINIC_COOKIE)?.value;
}

export async function writeActiveClinicCookie(slug: string): Promise<void> {
  const jar = await cookies();
  jar.set(ACTIVE_CLINIC_COOKIE, slug, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
    secure: process.env.NODE_ENV === "production",
  });
}
