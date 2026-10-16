import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  skipTrailingSlashRedirect: true,
  serverExternalPackages: ["sharp"],
  async rewrites() {
    return {
      beforeFiles: [
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
};

export default nextConfig;
