import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Serve the PWA manifest through Next.js so Hostinger/Passenger cannot
 * short-circuit a static public/manifest.webmanifest as text/plain.
 * Source of truth: public/seo-approved/manifest.webmanifest (not under public root).
 */
async function readManifest(): Promise<string> {
  return readFile(path.join(process.cwd(), "public", "seo-approved", "manifest.webmanifest"), "utf8");
}

export async function GET() {
  const body = await readManifest();
  return new Response(body, {
    status: 200,
    headers: {
      "content-type": "application/manifest+json; charset=utf-8",
      "cache-control": "no-cache, max-age=0, must-revalidate",
    },
  });
}
