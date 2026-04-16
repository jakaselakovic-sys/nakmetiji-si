// =============================================================================
// NaKmetiji.si — robots.txt (generated via Next.js Metadata API)
// Includes AI search bot rules and llms.txt reference for AI discoverability.
// =============================================================================

import type { MetadataRoute } from "next";

const BASE_URL = "https://nakmetiji.si";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // ── Default: allow all public pages, block private routes ──────────────
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/dashboard/", "/api/", "/moj-potni-list"],
      },
      // ── AI Search bots (Perplexity, Bing Copilot, you.com, Claude) — ALLOW ─
      // These index pages for real-time AI answers — essential for AI search visibility.
      {
        userAgent: ["PerplexityBot", "YouBot", "Applebot-Extended", "ChatGPT-User", "ClaudeBot", "anthropic-ai"],
        allow: ["/", "/kmetije/", "/regije/", "/blog/", "/green-passport", "/llms.txt", "/llms-full.txt"],
        disallow: ["/admin/", "/dashboard/", "/api/", "/moj-potni-list"],
      },
      // ── Training-only scrapers — BLOCK ─────────────────────────────────────
      // These harvest content for model training without providing search value.
      {
        userAgent: ["GPTBot", "CCBot", "omgili", "omgilibot", "Diffbot", "Bytespider"],
        disallow: "/",
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
