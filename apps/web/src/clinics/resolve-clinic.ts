import { headers } from "next/headers";
import type { Clinic, ClinicProfile, ClinicStatus } from "@prisma/client";
import { prisma } from "@/db/prisma";
import { CLINIC_HOST_HEADER, hostnameFromHostHeader, isLocalHost, isQuickTunnelHost } from "@/clinics/host";

export { CLINIC_HOST_HEADER, hostnameFromHostHeader };

export type ResolvedClinic = Clinic & {
  profile: ClinicProfile | null;
};

export async function resolveClinicByHost(hostname: string): Promise<ResolvedClinic | null> {
  const host = hostnameFromHostHeader(hostname);
  if (!host) return null;

  if (isLocalHost(host) || isQuickTunnelHost(host)) {
    const slug = process.env.DEFAULT_CLINIC_SLUG || "woolloongabba";
    return prisma.clinic.findUnique({
      where: { slug },
      include: { profile: true },
    });
  }

  const domain = await prisma.clinicDomain.findUnique({
    where: { hostname: host },
    include: { clinic: { include: { profile: true } } },
  });

  if (!domain) return null;
  if (domain.clinic.status !== "live") return null;
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
