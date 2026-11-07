import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Serve selected public static assets through Next so Hostinger cannot
 * short-circuit them without Cache-Control (empty headers on /styles.min.css).
 * Query-string cache busts keep URLs unique; responses are immutable.
 */
const ALLOWED_EXT = new Set([
  ".css",
  ".js",
  ".webp",
  ".png",
  ".jpg",
  ".jpeg",
  ".svg",
  ".woff2",
  ".ico",
]);

const CONTENT_TYPES: Record<string, string> = {
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};

const CACHE_CONTROL = "public, max-age=31536000, immutable";

function publicRoot(): string {
  return path.join(process.cwd(), "public");
}

export async function GET(
  request: Request,
  context: { params: Promise<{ path?: string[] }> },
) {
  const segments = (await context.params).path ?? [];
  if (
    !segments.length ||
    segments.some((s) => !s || s === "." || s === ".." || s.includes("\0") || s.includes("/") || s.includes("\\"))
  ) {
    return new Response("Not found.", { status: 404 });
  }

  const root = publicRoot();
  const abs = path.resolve(root, ...segments);
  if (!abs.startsWith(root + path.sep)) {
    return new Response("Not found.", { status: 404 });
  }

  const ext = path.extname(abs).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    return new Response("Not found.", { status: 404 });
  }

  let buf: Buffer;
  try {
    buf = await readFile(abs);
  } catch {
    return new Response("Not found.", { status: 404 });
  }

  const etag = `"${createHash("sha1").update(buf).digest("hex").slice(0, 16)}"`;
  if (request.headers.get("if-none-match") === etag) {
    return new Response(null, {
      status: 304,
      headers: {
        ETag: etag,
        "Cache-Control": CACHE_CONTROL,
        "X-Content-Type-Options": "nosniff",
      },
    });
  }

  return new Response(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type": CONTENT_TYPES[ext] || "application/octet-stream",
      "Cache-Control": CACHE_CONTROL,
      ETag: etag,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
