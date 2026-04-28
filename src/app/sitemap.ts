// =============================================================================
// NaKmetiji.si — Dynamic Sitemap
// Generira sitemap.xml z vsemi statičnimi in dinamičnimi rutami.
// Vključuje: statične strani, regije, kmetije, blog, znamenitosti.
// Revalidates every 12 hours (ISR) so newly approved farms appear automatically.
// =============================================================================

import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";
import { REGIJE } from "@/types/database";


const BASE_URL = "https://nakmetiji.si";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date().toISOString();

  // ── Static pages ────────────────────────────────────────────────────────────
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL,                             lastModified: now, changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE_URL}/kmetije`,                lastModified: now, changeFrequency: "hourly",  priority: 0.9 },
    { url: `${BASE_URL}/zemljevid`,              lastModified: now, changeFrequency: "daily",   priority: 0.8 },
    { url: `${BASE_URL}/regije`,                 lastModified: now, changeFrequency: "weekly",  priority: 0.75 },
    { url: `${BASE_URL}/blog`,                   lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE_URL}/green-passport`,         lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/o-nas`,                  lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/dodaj-kmetijo`,          lastModified: now, changeFrequency: "monthly", priority: 0.55 },
  ];

  // ── Region hub pages — high-value for "turistična kmetija [regija]" keyword ──
  const regionRoutes: MetadataRoute.Sitemap = REGIJE.map((slug) => ({
    url:             `${BASE_URL}/regije/${slug}`,
    lastModified:    now,
    changeFrequency: "daily" as const,
    priority:        0.88,
  }));

  // ── Dynamic farm pages + blog posts ─────────────────────────────────────────
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

    // ── Blog posts ────────────────────────────────────────────────────────────
    let blogRoutes: MetadataRoute.Sitemap = [];
    try {
      const { getAllPosts } = await import("@/lib/blog");
      const posts = getAllPosts();
      blogRoutes = posts.map((post) => ({
        url:             `${BASE_URL}/blog/${post.slug}`,
        lastModified:    post.date ?? now,
        changeFrequency: "monthly" as const,
        priority:        0.65,
      }));
    } catch {
      // Blog module may not be available — skip gracefully
    }

    return [...staticRoutes, ...regionRoutes, ...farmRoutes, ...blogRoutes];
  } catch {
    return [...staticRoutes, ...regionRoutes];
  }
}
