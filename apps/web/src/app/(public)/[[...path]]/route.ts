import { headers } from "next/headers";
import { resolveClinicFromRequest } from "@/clinics/resolve-clinic";
import { toStoragePath } from "@/documents/paths";
import { renderStoredPage } from "@/documents/render-published-document";
import {
  getPublicHtmlCache,
  setPublicHtmlCache,
} from "@/documents/public-html-cache";
import {
  STAGING_ROBOTS_DIRECTIVE,
  applyStagingNoIndexMeta,
  isStagingNoIndexHost,
} from "@/seo/staging-noindex";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function serverTimingHeader(
  cache: "HIT" | "MISS",
  timings?: Record<string, number>,
): string {
  const parts = [`cache;desc="${cache}"`];
  if (timings) {
    for (const [name, ms] of Object.entries(timings)) {
      if (!Number.isFinite(ms)) continue;
      parts.push(`${name};dur=${Math.round(ms)}`);
    }
  }
  return parts.join(", ");
}

function htmlResponse(
  body: string,
  status: number,
  staging: boolean,
  cache: "HIT" | "MISS",
  timings?: Record<string, number>,
) {
  const headersInit: Record<string, string> = {
    "content-type": "text/html; charset=utf-8",
    "x-wmc-cache": cache,
    "server-timing": serverTimingHeader(cache, timings),
    // Public HTML is clinic+path cached in-process; browsers/CDNs must not share
    // personalised or auth responses — these routes are anonymous public only.
    "cache-control": "private, no-store",
  };
  if (staging) headersInit["X-Robots-Tag"] = STAGING_ROBOTS_DIRECTIVE;
  return new Response(body, { status, headers: headersInit });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ path?: string[] }> },
) {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const staging = isStagingNoIndexHost(host);

  const clinic = await resolveClinicFromRequest();
  if (!clinic) {
    return new Response("Clinic not found for this host.", {
      status: 404,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        ...(staging ? { "X-Robots-Tag": STAGING_ROBOTS_DIRECTIVE } : {}),
      },
    });
  }

  const { path: segments } = await context.params;
  const storagePath = toStoragePath(segments);
  if (!storagePath) {
    return new Response("Invalid path.", {
      status: 400,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        ...(staging ? { "X-Robots-Tag": STAGING_ROBOTS_DIRECTIVE } : {}),
      },
    });
  }

  const cached = getPublicHtmlCache(clinic.id, storagePath);
  if (cached) {
    const html = staging ? applyStagingNoIndexMeta(cached.html) : cached.html;
    return htmlResponse(html, cached.status, staging, "HIT", { total: 0 });
  }

  const rendered = await renderStoredPage(clinic.id, storagePath, {
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
  });
  if (!rendered) {
    return new Response("Not found.", {
      status: 404,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        ...(staging ? { "X-Robots-Tag": STAGING_ROBOTS_DIRECTIVE } : {}),
      },
    });
  }

  // Cache the pre-staging HTML so staging noindex meta is applied per request host.
  setPublicHtmlCache(clinic.id, storagePath, {
    status: rendered.status,
    html: rendered.html,
    path: rendered.path,
  });

  const html = staging ? applyStagingNoIndexMeta(rendered.html) : rendered.html;
  return htmlResponse(html, rendered.status, staging, "MISS", rendered.timings);
}
