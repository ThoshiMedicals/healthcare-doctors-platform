/**
 * Startup preparation for public HTML delivery.
 * Connects Prisma and pre-renders critical paths into the memory + durable
 * public HTML cache so process restart does not force a cold Prisma fan-out
 * on the first visitor.
 */

import { resolveClinicByHost } from "@/clinics/resolve-clinic";
import { prisma } from "@/db/prisma";
import {
  getPublicHtmlCache,
  setPublicHtmlCache,
} from "@/documents/public-html-cache";
import { renderStoredPage, type RenderClinicContext } from "@/documents/render-published-document";

const CRITICAL_PATHS = [
  "index.html",
  "services.html",
  "team.html",
  "contact.html",
  "join-our-team.html",
  "knowledge/index.html",
  "doctors/dr-tanya-goodwill.html",
  "book-appointment.html",
] as const;

function warmEnabled(): boolean {
  return process.env.WMC_PUBLIC_HTML_WARM_ON_BOOT !== "0";
}

function hostCandidates(): string[] {
  const configured =
    process.env.WMC_WARM_HOSTNAMES?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];
  return [
    ...configured,
    "mediumslateblue-eagle-960503.hostingersite.com",
    "127.0.0.1",
    "localhost",
  ];
}

async function resolveWarmClinic() {
  for (const host of hostCandidates()) {
    const clinic = await resolveClinicByHost(host);
    if (clinic) return clinic;
  }
  const slug = process.env.DEFAULT_CLINIC_SLUG || "woolloongabba";
  return prisma.clinic.findUnique({
    where: { slug },
    include: { profile: true },
  });
}

function toContext(clinic: {
  slug: string;
  practiceName: string;
  profile: RenderClinicContext["profile"] | null;
}): RenderClinicContext {
  return {
    slug: clinic.slug,
    practiceName: clinic.practiceName,
    profile: clinic.profile
      ? {
          phoneDisplay: clinic.profile.phoneDisplay,
          phoneTel: clinic.profile.phoneTel,
          email: clinic.profile.email,
          streetAddress: clinic.profile.streetAddress,
          suburb: clinic.profile.suburb,
          state: clinic.profile.state,
          postcode: clinic.profile.postcode,
          hotdocUrl: clinic.profile.hotdocUrl,
          logoPath: clinic.profile.logoPath,
        }
      : null,
  };
}

async function warmPath(
  clinicId: string,
  storagePath: string,
  context: RenderClinicContext,
): Promise<boolean> {
  if (getPublicHtmlCache(clinicId, storagePath)) return true;
  const rendered = await renderStoredPage(clinicId, storagePath, context);
  if (!rendered) return false;
  setPublicHtmlCache(clinicId, storagePath, {
    status: rendered.status,
    html: rendered.html,
    path: rendered.path,
  });
  return true;
}

export async function warmPublicDelivery(): Promise<{
  connected: boolean;
  warmed: number;
  clinicId: string | null;
}> {
  await prisma.$connect();
  if (!warmEnabled()) {
    return { connected: true, warmed: 0, clinicId: null };
  }

  const clinic = await resolveWarmClinic();
  if (!clinic) return { connected: true, warmed: 0, clinicId: null };

  const context = toContext(clinic);
  let warmed = 0;

  // Await homepage so the first external hit can be HIT/HIT-DISK immediately.
  if (await warmPath(clinic.id, "index.html", context)) warmed += 1;

  // Remaining critical paths warm in the background (do not block listen).
  void (async () => {
    for (const storagePath of CRITICAL_PATHS) {
      if (storagePath === "index.html") continue;
      try {
        await warmPath(clinic.id, storagePath, context);
      } catch (error) {
        console.error(
          "[wmc-warm] path failed",
          storagePath,
          error instanceof Error ? error.message : error,
        );
      }
    }
  })();

  return { connected: true, warmed, clinicId: clinic.id };
}
