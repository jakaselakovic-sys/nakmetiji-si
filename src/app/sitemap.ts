// =============================================================================
// NaKmetiji.si — Dynamic Sitemap
// Generira sitemap.xml z vsemi statičnimi in dinamičnimi rutami.
// Revalidates every 12 hours (ISR) so newly approved farms appear automatically.
// =============================================================================

import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 43_200; // 12 hours

const BASE_URL = "https://nakmetiji.si";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString();

  // ── Static pages ────────────────────────────────────────────────────────────
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL,                             lastModified: now, changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE_URL}/kmetije`,                lastModified: now, changeFrequency: "hourly",  priority: 0.9 },
    { url: `${BASE_URL}/zemljevid`,              lastModified: now, changeFrequency: "daily",   priority: 0.8 },
    { url: `${BASE_URL}/blog`,                   lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE_URL}/green-passport`,         lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];

  // ── Dynamic farm pages ──────────────────────────────────────────────────────
  // Anon client: no cookies needed, RLS on kmetije allows public reads
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data: farms } = await supabase
      .from("kmetije")
      .select("slug, posodobljeno")
      .eq("aktivna", true)
      .order("posodobljeno", { ascending: false });

    const farmRoutes: MetadataRoute.Sitemap = (farms ?? []).map((k) => ({
      url:             `${BASE_URL}/kmetije/${k.slug}`,
      lastModified:    k.posodobljeno ?? now,
      changeFrequency: "weekly" as const,
      priority:        0.85,
    }));

    return [...staticRoutes, ...farmRoutes];
  } catch {
    return staticRoutes;
  }
}
