import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { resolveClinicFromRequest } from "@/clinics/resolve-clinic";
import { toStoragePath } from "@/documents/paths";
import { renderStoredPage } from "@/documents/render-published-document";
import {
  getPublicHtmlCache,
  peekPublicHtmlGeneration,
  setPublicHtmlCacheIfGeneration,
  syncPublicCacheEpochFromDb,
} from "@/documents/public-html-cache";
import { canServeRecruitmentPathPublicly } from "@/importer/recruitment-hold";
import {
  STAGING_ROBOTS_DIRECTIVE,
  applyStagingNoIndexMeta,
  isStagingNoIndexHost,
} from "@/seo/staging-noindex";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PublicCacheState = "HIT" | "HIT-DISK" | "MISS";

function serverTimingHeader(
  cache: PublicCacheState,
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

function weakEtag(body: string): string {
  return `W/"${createHash("sha1").update(body).digest("hex").slice(0, 16)}"`;
}

function htmlResponse(
  body: string,
  status: number,
  staging: boolean,
  cache: PublicCacheState,
  timings: Record<string, number> | undefined,
  request: Request,
) {
  const etag = weakEtag(body);
  const headersInit: Record<string, string> = {
    "content-type": "text/html; charset=utf-8",
    "x-wmc-cache": cache,
    "server-timing": serverTimingHeader(cache, timings),
    // Anonymous public HTML only. private = never shared CDN/auth bleed.
    // max-age=0 + must-revalidate keeps CMS freshness; avoids no-store which
    // blocks bfcache and forces full re-download of the document body.
    "cache-control": "private, max-age=0, must-revalidate",
    etag,
  };
  if (staging) headersInit["X-Robots-Tag"] = STAGING_ROBOTS_DIRECTIVE;

  const inm = request.headers.get("if-none-match");
  if (inm && inm === etag) {
    return new Response(null, {
      status: 304,
      headers: {
        etag,
        "x-wmc-cache": cache,
        "server-timing": serverTimingHeader(cache, timings),
        "cache-control": headersInit["cache-control"],
        ...(staging ? { "X-Robots-Tag": STAGING_ROBOTS_DIRECTIVE } : {}),
      },
    });
  }

  return new Response(body, { status, headers: headersInit });
}

export async function GET(
  request: Request,
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

  // Recruitment HOLD must win over durable/memory HTML cache. A pre-HOLD 200
  // snapshot must never bypass mayServePublicly fail-closed serving.
  if (!canServeRecruitmentPathPublicly(storagePath)) {
    const hold404 = await renderStoredPage(clinic.id, storagePath, {
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
    if (!hold404) {
      return new Response("Not found.", {
        status: 404,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "private, no-store",
          ...(staging ? { "X-Robots-Tag": STAGING_ROBOTS_DIRECTIVE } : {}),
        },
      });
    }
    // Do not seed public HTML cache for held paths (prevents stale reopen).
    return htmlResponse(
      staging ? applyStagingNoIndexMeta(hold404.html) : hold404.html,
      hold404.status,
      staging,
      "MISS",
      hold404.timings,
      request,
    );
  }

  // Multi-instance: align memory generation with Clinic.publicCacheEpoch before HIT.
  await syncPublicCacheEpochFromDb(clinic.id);

  const cached = getPublicHtmlCache(clinic.id, storagePath);
  if (cached) {
    const html = staging ? applyStagingNoIndexMeta(cached.html) : cached.html;
    const state: PublicCacheState = cached.source === "disk" ? "HIT-DISK" : "HIT";
    return htmlResponse(html, cached.status, staging, state, { total: 0 }, request);
  }

  // Capture generation before render so a concurrent CMS publish cannot let this
  // response re-seed durable/memory cache with pre-publish HTML.
  const generationAtStart = peekPublicHtmlGeneration(clinic.id);

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
  setPublicHtmlCacheIfGeneration(
    clinic.id,
    storagePath,
    {
      status: rendered.status,
      html: rendered.html,
      path: rendered.path,
    },
    generationAtStart,
  );

  const html = staging ? applyStagingNoIndexMeta(rendered.html) : rendered.html;
  return htmlResponse(html, rendered.status, staging, "MISS", rendered.timings, request);
}

/** HEAD must obey the same HOLD / cache rules as GET (no body). */
export async function HEAD(
  request: Request,
  context: { params: Promise<{ path?: string[] }> },
) {
  const response = await GET(request, context);
  return new Response(null, {
    status: response.status,
    headers: response.headers,
  });
}
