import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

// =============================================================================
// Content Security Policy
// - 'unsafe-inline' on style-src: required for Tailwind runtime injection and
//   Mapbox GL styles. Acceptable because CSP still blocks script injection.
// - 'unsafe-eval' + 'unsafe-inline' on script-src: required for Mapbox GL,
//   Next.js dev HMR, and Sentry replay. Tightened in production (no eval).
// - blob:/data: on worker-src + img-src: Mapbox, Service Worker, QR codes.
// =============================================================================
const isProd = process.env.NODE_ENV === "production";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isProd ? "" : " 'unsafe-eval'"} https://api.mapbox.com https://*.ingest.sentry.io https://*.ingest.de.sentry.io`,
  "script-src-elem 'self' 'unsafe-inline' https://api.mapbox.com",
  "style-src 'self' 'unsafe-inline' https://api.mapbox.com",
  "img-src 'self' data: blob: https: https://*.supabase.co https://api.mapbox.com https://*.tiles.mapbox.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.mapbox.com https://events.mapbox.com https://*.tiles.mapbox.com https://*.ingest.sentry.io https://*.ingest.de.sentry.io https://api.groq.com https://api.anthropic.com",
  "worker-src 'self' blob:",
  "media-src 'self' https://*.supabase.co",
  "frame-src 'self' https://www.openstreetmap.org",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self), interest-cohort=(), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [75, 92],
    remotePatterns: [
      {
        // Supabase Storage (projekt-specifičen URL)
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

// Sentry code-transform wrapper instruments every client module; in dev that
// means noticeable memory pressure for no runtime benefit (source maps don't
// upload locally, and error reporting works fine without the wrapper). We
// only pay the cost in production builds.
export default isProd
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: true,
      sourcemaps: {
        disable: process.env.NODE_ENV !== "production",
      },
      tunnelRoute: undefined,
    })
  : nextConfig;
