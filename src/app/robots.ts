// =============================================================================
// NaKmetiji.si — robots.txt (generated via Next.js Metadata API)
// =============================================================================

import type { MetadataRoute } from "next";

const BASE_URL = "https://nakmetiji.si";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/dashboard/",
          "/api/",
          "/moj-potni-list",
        ],
      },
      {
        // Block AI training scrapers from product pages
        userAgent: ["GPTBot", "ClaudeBot", "CCBot", "anthropic-ai"],
        disallow: "/",
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
