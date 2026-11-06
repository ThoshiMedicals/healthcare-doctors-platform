import { readFile } from "node:fs/promises";
import path from "node:path";
import { headers } from "next/headers";
import {
  STAGING_ROBOTS_DIRECTIVE,
  isStagingNoIndexHost,
  stagingRobotsTxt,
} from "@/seo/staging-noindex";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Production robots live under public/seo-approved so Hostinger static hosting cannot short-circuit /robots.txt. */
async function productionRobotsTxt(): Promise<string> {
  return readFile(path.join(process.cwd(), "public", "seo-approved", "robots.txt"), "utf8");
}

export async function GET() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  if (isStagingNoIndexHost(host)) {
    return new Response(stagingRobotsTxt(), {
      status: 200,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "X-Robots-Tag": STAGING_ROBOTS_DIRECTIVE,
        "cache-control": "no-store",
      },
    });
  }

  const body = await productionRobotsTxt();
  return new Response(body, {
    status: 200,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}
