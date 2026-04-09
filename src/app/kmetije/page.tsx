// =============================================================================
// NaKmetiji.si — Kmetije listing
// Server component: fetch Supabase → KmetijeClient
// =============================================================================

import type { Metadata } from "next";
import { createSupabaseServer } from "@/lib/supabase/server";
import type { Dozivetje, KmetijaSDozivetji } from "@/types/database";
import { KmetijeClient } from "./KmetijeClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vse kmetije | NaKmetiji",
  description: "Poiščite in filtrirajte turistične kmetije po vsej Sloveniji.",
};

function normalizirajKmetijo(raw: Record<string, unknown>): KmetijaSDozivetji {
  const { kmetija_dozivetje, ...kmetija } = raw;
  return {
    ...(kmetija as unknown as import("@/types/database").Kmetija),
    dozivetja: Array.isArray(kmetija_dozivetje)
      ? (kmetija_dozivetje as Record<string, unknown>[])
          .filter((kd) => kd.dozivetja)
          .map((kd) => kd.dozivetja as Dozivetje)
          .sort((a, b) => (a.vrstni_red ?? 0) - (b.vrstni_red ?? 0))
      : [],
  };
}

export default async function KmetijePage() {
  const supabase = await createSupabaseServer();

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

  const kmetije = ((kmetijeSurov as Record<string, unknown>[]) ?? []).map(normalizirajKmetijo);
  const dozivetja = (dozivetjaSurov as Dozivetje[]) ?? [];

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

      <KmetijeClient initialKmetije={kmetije} dozivetja={dozivetja} />
    </div>
  );
}
