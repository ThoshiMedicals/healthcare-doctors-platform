import { headers } from "next/headers";
import type { Clinic, ClinicProfile, ClinicStatus } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { CLINIC_HOST_HEADER, hostnameFromHostHeader, isLocalHost, isQuickTunnelHost } from "@/clinics/host";
import {
  getCachedClinicByHost,
  setCachedClinicByHost,
} from "@/documents/public-html-cache";

export { CLINIC_HOST_HEADER, hostnameFromHostHeader };

export type ResolvedClinic = Clinic & {
  profile: ClinicProfile | null;
};

export async function resolveClinicByHost(hostname: string): Promise<ResolvedClinic | null> {
  const host = hostnameFromHostHeader(hostname);
  if (!host) return null;

  const cached = getCachedClinicByHost<ResolvedClinic | null>(host);
  if (cached !== undefined) return cached;

  if (isLocalHost(host) || isQuickTunnelHost(host)) {
    const slug = process.env.DEFAULT_CLINIC_SLUG || "woolloongabba";
    const clinic = await prisma.clinic.findUnique({
      where: { slug },
      include: { profile: true },
    });
    setCachedClinicByHost(host, clinic);
    return clinic;
  }

  const domain = await prisma.clinicDomain.findUnique({
    where: { hostname: host },
    include: { clinic: { include: { profile: true } } },
  });

  if (!domain || domain.clinic.status !== "live") {
    setCachedClinicByHost(host, null);
    return null;
  }
  setCachedClinicByHost(host, domain.clinic);
  return domain.clinic;
}

export async function resolveClinicFromRequest(): Promise<ResolvedClinic | null> {
  const headerStore = await headers();
  const host =
    headerStore.get(CLINIC_HOST_HEADER) ??
    headerStore.get("x-forwarded-host") ??
    headerStore.get("host");
  return resolveClinicByHost(host ?? "");
}

export async function listLiveClinics(): Promise<Array<{ id: string; slug: string; practiceName: string; status: ClinicStatus }>> {
  return prisma.clinic.findMany({
    where: { status: "live" },
    select: { id: true, slug: true, practiceName: true, status: true },
    orderBy: { practiceName: "asc" },
  });
}

/**
 * Clinics Network/Super Admin may switch into for CMS work.
 * Includes draft tenants (no public site / DNS). Excludes external stubs.
 */
export async function listAdminSwitchableClinics(): Promise<
  Array<{ id: string; slug: string; practiceName: string; status: ClinicStatus }>
> {
  return prisma.clinic.findMany({
    where: { status: { in: ["live", "draft"] } },
    select: { id: true, slug: true, practiceName: true, status: true },
    orderBy: [{ status: "asc" }, { practiceName: "asc" }],
  });
}

export function isAdminSwitchableClinicStatus(status: ClinicStatus): boolean {
  return status === "live" || status === "draft";
}
