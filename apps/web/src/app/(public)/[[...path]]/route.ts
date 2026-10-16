import { resolveClinicFromRequest } from "@/clinics/resolve-clinic";
import { toStoragePath } from "@/documents/paths";
import { renderStoredPage } from "@/documents/render-published-document";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function htmlResponse(body: string, status: number) {
  return new Response(body, {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ path?: string[] }> },
) {
  const clinic = await resolveClinicFromRequest();
  if (!clinic) {
    return new Response("Clinic not found for this host.", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const { path: segments } = await context.params;
  const storagePath = toStoragePath(segments);
  if (!storagePath) {
    return new Response("Invalid path.", {
      status: 400,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  const rendered = await renderStoredPage(clinic.id, storagePath);
  if (!rendered) {
    return new Response("Not found.", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  return htmlResponse(rendered.html, rendered.status);
}
