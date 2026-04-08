// =============================================================================
// NaKmetiji.si — Dynamic Sitemap
// Generira sitemap.xml z vsemi statičnimi in dinamičnimi rutami
// =============================================================================

import type { MetadataRoute } from "next";
import { MOCK_KMETIJE } from "@/data/mock-data";

const BASE_URL = "https://nakmetiji.si";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  // Statične strani
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/kmetije`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/zemljevid`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  // Dinamične kmetije
  const farmRoutes: MetadataRoute.Sitemap = MOCK_KMETIJE.map((kmetija) => ({
    url: `${BASE_URL}/kmetije/${kmetija.slug}`,
    lastModified: kmetija.posodobljeno,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...farmRoutes];
}
