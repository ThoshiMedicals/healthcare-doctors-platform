import { NextResponse } from "next/server";
import { requireAction } from "@/cms/context";
import { renderDraftPagePreview, resolveDraftPreviewToken } from "@/cms/draft-preview";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Authenticated, clinic-scoped draft preview. Never stores in public HTML cache.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> },
) {
  const { clinic, role } = await requireAction("preview_draft");
  const { token } = await context.params;
  const row = await resolveDraftPreviewToken(token, clinic.id);
  if (!row || !row.pageId) {
    return new NextResponse("Preview link expired, revoked, or not for this clinic.", {
      status: 404,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "private, no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }

  const preview = await renderDraftPagePreview({ clinicId: clinic.id, pageId: row.pageId });
  if (!preview.ok) {
    return new NextResponse(preview.reason, {
      status: 400,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "private, no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }

  void role;
  return new NextResponse(preview.html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "private, no-store",
      "X-Robots-Tag": "noindex, nofollow",
      "x-wmc-preview": "draft",
    },
  });
}
