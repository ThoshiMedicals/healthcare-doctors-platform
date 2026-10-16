import { createHash } from "node:crypto";
import { managedPublicPath } from "@/cms/image-replacement";
import { readServedBytes } from "@/cms/image-store";
import { detectImageFormat } from "@/cms/image-signature";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await context.params;
  const relative = parts.join("/");
  if (!managedPublicPath(relative)) return new Response(null, { status: 404 });
  let bytes: Buffer;
  try {
    bytes = readServedBytes(relative);
  } catch {
    return new Response(null, { status: 404 });
  }
  const etag = `"${createHash("sha256").update(bytes).digest("hex")}"`;
  const headers = {
    "content-type": contentType(bytes),
    "cache-control": "public, max-age=60, must-revalidate",
    etag,
  };
  if (request.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers });
  return new Response(new Uint8Array(bytes), { headers });
}

function contentType(bytes: Buffer): string {
  const format = detectImageFormat(bytes);
  if (format === "png") return "image/png";
  if (format === "webp") return "image/webp";
  return "application/octet-stream";
}
