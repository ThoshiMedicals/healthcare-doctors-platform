import { requireAction } from "@/cms/context";
import { readPending } from "@/cms/image-store";
import { detectImageFormat } from "@/cms/image-signature";
import { prisma } from "@/db/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { clinic } = await requireAction("clinical_signoff");
  const { id } = await context.params;
  const asset = await prisma.mediaAsset.findFirst({ where: { id, clinicId: clinic.id }, select: { id: true } });
  if (!asset) return new Response(null, { status: 404 });
  const bytes = readPending(asset.id, "full");
  if (!bytes) return new Response(null, { status: 404 });
  const format = detectImageFormat(bytes);
  return new Response(new Uint8Array(bytes), {
    headers: {
      "content-type": format === "png" ? "image/png" : format === "webp" ? "image/webp" : "application/octet-stream",
      "cache-control": "private, no-store",
    },
  });
}
