// =============================================================================
// NaKmetiji.si — Dynamic Sitemap
// Generira sitemap.xml z vsemi statičnimi in dinamičnimi rutami
// =============================================================================

import type { MetadataRoute } from "next";
import { createSupabaseServer } from "@/lib/supabase/server";

const BASE_URL = "https://nakmetiji.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString();

  // Statične strani
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/kmetije`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE_URL}/zemljevid`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
  ];

  // Dinamične kmetije iz Supabase
  try {
    const supabase = await createSupabaseServer();
    const { data } = await supabase
      .from("kmetije")
      .select("slug, posodobljeno")
      .eq("aktivna", true);

    const farmRoutes: MetadataRoute.Sitemap = (data ?? []).map((k) => ({
      url: `${BASE_URL}/kmetije/${k.slug}`,
      lastModified: k.posodobljeno,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    return [...staticRoutes, ...farmRoutes];
  } catch {
    return staticRoutes;
  }
}
