import { headers } from "next/headers";
import { resolveClinicFromRequest } from "@/clinics/resolve-clinic";
import { toStoragePath } from "@/documents/paths";
import { renderStoredPage } from "@/documents/render-published-document";
import {
  STAGING_ROBOTS_DIRECTIVE,
  applyStagingNoIndexMeta,
  isStagingNoIndexHost,
} from "@/seo/staging-noindex";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function htmlResponse(body: string, status: number, staging: boolean) {
  const headersInit: Record<string, string> = {
    "content-type": "text/html; charset=utf-8",
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

  const rendered = await renderStoredPage(clinic.id, storagePath);
  if (!rendered) {
    return new Response("Not found.", {
      status: 404,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        ...(staging ? { "X-Robots-Tag": STAGING_ROBOTS_DIRECTIVE } : {}),
      },
    });
  }

  const html = staging ? applyStagingNoIndexMeta(rendered.html) : rendered.html;
  return htmlResponse(html, rendered.status, staging);
}
