import { readFile } from "node:fs/promises";
import path from "node:path";
import { headers } from "next/headers";
import {
  STAGING_ROBOTS_DIRECTIVE,
  isStagingNoIndexHost,
  stagingSitemapXml,
} from "@/seo/staging-noindex";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Production sitemap lives under public/seo-approved so Hostinger cannot short-circuit /sitemap.xml as a static file. */
async function productionSitemapXml(): Promise<string> {
  return readFile(path.join(process.cwd(), "public", "seo-approved", "sitemap.xml"), "utf8");
}

export async function GET() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  if (isStagingNoIndexHost(host)) {
    return new Response(stagingSitemapXml(), {
      status: 200,
      headers: {
        "content-type": "application/xml; charset=utf-8",
        "X-Robots-Tag": STAGING_ROBOTS_DIRECTIVE,
        "cache-control": "no-store",
      },
    });
  }

  const body = await productionSitemapXml();
  return new Response(body, {
    status: 200,
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
}
