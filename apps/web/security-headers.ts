import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV !== "production";

// CSP stays in Report-Only mode unless explicitly disabled at build time.
const isCspReportOnly = process.env.CSP_REPORT_ONLY !== "false";

const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  [
    "form-action 'self'",
    "https://hotdoc.com.au",
    "https://*.hotdoc.com.au",
  ].join(" "),
  [
    "script-src 'self' 'unsafe-inline'",
    ...(isDevelopment ? ["'unsafe-eval'"] : []),
    "https://hotdoc.com.au",
    "https://*.hotdoc.com.au",
    "https://www.googletagmanager.com",
    "https://www.google-analytics.com",
  ].join(" "),
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https:",
  [
    "connect-src 'self'",
    "https://hotdoc.com.au",
    "https://*.hotdoc.com.au",
    "https://www.google-analytics.com",
    "https://*.google-analytics.com",
    "https://www.googletagmanager.com",
    "https://stats.g.doubleclick.net",
    ...(isDevelopment ? ["ws:", "wss:"] : []),
  ].join(" "),
  [
    "frame-src 'self'",
    "https://hotdoc.com.au",
    "https://*.hotdoc.com.au",
    "https://www.google.com",
    "https://maps.google.com",
    "https://www.googletagmanager.com",
  ].join(" "),
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  ...(isDevelopment ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  {
    key: isCspReportOnly
      ? "Content-Security-Policy-Report-Only"
      : "Content-Security-Policy",
    value: contentSecurityPolicy,
  },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

export function withSecurityHeaders(config: NextConfig): NextConfig {
  const existingHeaders = config.headers?.bind(config);

  return {
    ...config,
    async headers() {
      const previousHeaders = existingHeaders
        ? await existingHeaders()
        : [];

      return [
        ...previousHeaders,
        {
          source: "/:path*",
          headers: securityHeaders,
        },
      ];
    },
  };
}
