import { headers } from "next/headers";
import { resolveClinicFromRequest } from "@/clinics/resolve-clinic";
import { invalidatePublicHtmlCache } from "@/documents/public-html-cache";
import { isStagingNoIndexHost } from "@/seo/staging-noindex";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Staging-only: invoke the same public HTML invalidation CMS publish uses.
 * Never registered on production apex (host check). Does not accept page bodies
 * or touch private tables — only clears anonymous public HTML snapshots.
 */
export async function POST(request: Request) {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  if (!isStagingNoIndexHost(host)) {
    return new Response("Not found.", { status: 404 });
  }

  let confirm = "";
  try {
    const body = (await request.json()) as { confirm?: string };
    confirm = String(body.confirm ?? "");
  } catch {
    confirm = "";
  }
  if (confirm !== "invalidate-public-html-only") {
    return Response.json({ ok: false, error: "confirm required" }, { status: 400 });
  }

  const clinic = await resolveClinicFromRequest();
  if (!clinic) {
    return Response.json({ ok: false, error: "clinic not found" }, { status: 404 });
  }

  invalidatePublicHtmlCache(clinic.id);
  return Response.json({
    ok: true,
    clinicSlug: clinic.slug,
    invalidated: true,
  });
}
