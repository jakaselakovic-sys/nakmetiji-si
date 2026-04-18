// =============================================================================
// NaKmetiji.si — Kmetije listing
// Server component: fetch Supabase → KmetijeClient
//
// ISR: data is revalidated every 60 s via unstable_cache (stale-while-revalidate).
// The page itself is statically rendered between revalidation cycles.
// =============================================================================

import { Suspense } from "react";
import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import type { Dozivetje } from "@/types/database";
import { normalizirajKmetijo } from "@/lib/utils/normaliziraj-kmetijo";
import { KmetijeClient } from "./KmetijeClient";

// ISR: revalidate every 60 seconds (stale-while-revalidate semantics)
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Vse turistične kmetije v Sloveniji | NaKmetiji",
  description:
    "Poiščite in filtrirajte turistične kmetije po vsej Sloveniji. Prenočišča, kulinarična doživetja, vinski turizem in družinska doživetja na podeželju.",
  keywords: [
    "turistične kmetije Slovenija",
    "kmečki turizem",
    "prenočišče na kmetiji",
    "podeželski turizem",
    "kmetija Slovenija",
    "agroturizem",
  ],
  openGraph: {
    title: "Vse turistične kmetije v Sloveniji",
    description:
      "Odkrijte najboljše turistične kmetije po vsej Sloveniji. Prenočišča, kulinarika, vinski turizem in doživetja za vso družino.",
    type: "website",
    locale: "sl_SI",
    siteName: "NaKmetiji",
    url: "https://nakmetiji.si/kmetije",
  },
  alternates: {
    canonical: "https://nakmetiji.si/kmetije",
  },
};

// ─── Cached data fetch (anon client — no cookies needed for public farms) ────
//
// unstable_cache wraps the fetch so that all concurrent requests within the
// 60-second window share a single Supabase round-trip. The anon client is
// intentional: RLS on kmetije must allow SELECT for the anon role on
// rows where aktivna = true (standard Supabase public-listing policy).
const getCachedFarmData = unstable_cache(
  async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const [{ data: kmetijeSurov }, { data: dozivetjaSurov }] = await Promise.all([
      supabase
        .from("kmetije")
        .select(`*, kmetija_dozivetje(dozivetja(*))`)
        .eq("aktivna", true)
        .order("ocena", { ascending: false, nullsFirst: false }),
      supabase
        .from("dozivetja")
        .select("*")
        .order("vrstni_red"),
    ]);

    return {
      kmetijeSurov: (kmetijeSurov ?? []) as Record<string, unknown>[],
      dozivetjaSurov: (dozivetjaSurov ?? []) as Dozivetje[],
    };
  },
  ["public-farms-listing"],
  { revalidate: 60, tags: ["farms"] }
);

export default async function KmetijePage() {
  const { kmetijeSurov, dozivetjaSurov } = await getCachedFarmData();

  const kmetije = kmetijeSurov.map(normalizirajKmetijo);
  const dozivetja = dozivetjaSurov;

  return (
    <div className="min-h-screen bg-cream">
      {/* ── Page Hero ── */}
      <div className="bg-forest-900 pt-32 pb-20 px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/images/hero-bg.png')] opacity-10 bg-cover bg-center mix-blend-overlay"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-forest-900 to-transparent"></div>

        <div className="relative z-10 max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4 animate-fade-in-up">
            Vse kmetije
          </h1>
          <p className="text-lg text-white/70 animate-fade-in-up delay-100">
            Odkrijte skrite dragulje slovenskega podeželja. Prilagodite iskanje
            svojim željam in najdite popolno destinacijo.
          </p>
        </div>
      </div>

      <Suspense fallback={
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-4 border-forest-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <KmetijeClient initialKmetije={kmetije} dozivetja={dozivetja} />
      </Suspense>
    </div>
  );
}
