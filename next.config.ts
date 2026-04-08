import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    qualities: [75, 92],
  },
};

export default withSentryConfig(nextConfig, {
  // Sentry organizacija in projekt (nastavi v .env.local)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Tiha gradnja — brez Sentry logov med buildom
  silent: true,

  // Source maps — upload samo v produkciji
  sourcemaps: {
    disable: process.env.NODE_ENV !== "production",
  },

  // Onemogoči Sentry tunneling (ni potrebno za osnovni setup)
  tunnelRoute: undefined,

});
