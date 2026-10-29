import type { NextConfig } from "next";
import { withSecurityHeaders } from "./security-headers";

const uatQuickTunnel = process.env.UAT_QUICK_TUNNEL === "true";

const nextConfig: NextConfig = {
  distDir: uatQuickTunnel ? ".next-uat" : ".next",
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  skipTrailingSlashRedirect: true,
  serverExternalPackages: ["sharp"],
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/styles.css", destination: "/styles.min.css" },
        { source: "/digital-reception-index.js", destination: "/api/reception-index" },
        {
          source: "/assets/brand/healthcare-doctors-woolloongabba-logo.png",
          destination: "/api/managed-image/assets/brand/healthcare-doctors-woolloongabba-logo.png",
        },
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
      ...(uatQuickTunnel ? [{
        source: "/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      }] : []),
      // Ensure browsers revalidate icon files after brand-mark revisions.
      ...["/favicon.ico", "/favicon-16x16.png", "/favicon-32x32.png", "/apple-touch-icon.png"]
        .map(source => ({
          source,
          headers: [{ key: "Cache-Control", value: "no-cache, max-age=0, must-revalidate" }],
        })),
    ];
  },
};

export default withSecurityHeaders(nextConfig);
