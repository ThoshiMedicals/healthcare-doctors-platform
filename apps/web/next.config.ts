import type { NextConfig } from "next";
import { withSecurityHeaders } from "./security-headers";

const uatQuickTunnel = process.env.UAT_QUICK_TUNNEL === "true";
const stagingNoIndex = process.env.STAGING_NOINDEX === "true";

const nextConfig: NextConfig = {
  distDir: uatQuickTunnel ? ".next-uat" : ".next",
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  skipTrailingSlashRedirect: true,
  serverExternalPackages: ["sharp"],
  // Hostinger shared builds enforce tight process/thread limits. Default Next
  // parallelism (many page-data workers + Tokio threads) fails with EAGAIN /
  // "OS can't spawn worker thread" during "Collecting page data". Cap workers
  // and static-generation concurrency; pages and features are unchanged.
  experimental: {
    cpus: 1,
    workerThreads: false,
    staticGenerationMaxConcurrency: 1,
    staticGenerationMinPagesPerWorker: 50,
  },
  async rewrites() {
    return {
      beforeFiles: [
        // Prefer the live CMS/public-ux homepage over static public/index.html.
        { source: "/index.html", destination: "/" },
        { source: "/styles.css", destination: "/styles.min.css" },
        { source: "/digital-reception-index.js", destination: "/api/reception-index" },
        // Institution lockup stays on public/ (localhost authority). A stale
        // storage/images/live override was serving a different PNG on Hostinger.
        // CMS logo publish still updates public via writeLive sync.
        { source: "/assets/hero-final-desktop.webp", destination: "/api/managed-image/assets/hero-final-desktop.webp" },
        {
          source: "/assets/institutional-exterior-consistent.webp",
          destination: "/api/managed-image/assets/institutional-exterior-consistent.webp",
        },
        { source: "/assets/team/:file", destination: "/api/managed-image/assets/team/:file" },
      ],
    };
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      ...(uatQuickTunnel || stagingNoIndex ? [{
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" }],
      }] : []),
      // Ensure browsers revalidate icon files after brand-mark revisions.
      ...["/favicon.ico", "/favicon-16x16.png", "/favicon-32x32.png", "/apple-touch-icon.png"]
        .map(source => ({
          source,
          headers: [{ key: "Cache-Control", value: "no-cache, max-age=0, must-revalidate" }],
        })),
      // Mobile nav lives in site.js; do not let CDN/browser keep a broken copy for hours.
      {
        source: "/site.js",
        headers: [{ key: "Cache-Control", value: "no-cache, max-age=0, must-revalidate" }],
      },
      {
        source: "/assets/brand/healthcare-doctors-woolloongabba-logo.png",
        headers: [{ key: "Cache-Control", value: "public, max-age=60, must-revalidate" }],
      },
    ];
  },
};

export default withSecurityHeaders(nextConfig);
