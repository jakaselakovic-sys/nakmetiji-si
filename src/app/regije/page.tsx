// =============================================================================
// NaKmetiji.si — Regije
// Pregled vseh regij z linki do filtriranega iskanja kmetij
// =============================================================================

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase/server";
import { REGIJA_LABELS, REGIJE, type Regija } from "@/types/database";

export const metadata: Metadata = {
  title: "Regije | NaKmetiji",
  description:
    "Poiščite turistične kmetije po vseh 12 regijah Slovenije — od Gorenjske do Pomurja, od Primorske do Posavja.",
};

const REGIJA_EMOJI: Record<Regija, string> = {
  gorenjska: "🏔️",
  primorska: "🌊",
  stajerska: "🌾",
  dolenjska: "🍷",
  koroska: "⛰️",
  savinjska: "🌿",
  pomurska: "🌻",
  notranjska: "🌲",
  zasavska: "🏭",
  posavska: "🏞️",
  jugovzhodna_slovenija: "🦌",
  osrednjeslovenska: "🏙️",
};

const REGIJA_OPIS: Record<Regija, string> = {
  gorenjska: "Dežela Triglava, jezer in alpskih kmetij s svežim gorskim zrakom.",
  primorska: "Mediteransko podnebje, oljčni nasadi, morje in kraške kmetije.",
  stajerska: "Vinogradniška dežela s toplimi pobočji in bogatimi kulinaričnimi tradicijami.",
  dolenjska: "Mirna podeželska idila, sadovnjaki, vinogradništvo in termalnih vrelci.",
  koroska: "Gorska dežela ob avstrijski meji z bogatim planinskim izročilom.",
  savinjska: "Hmeljarsko srce Slovenije z zelenimi dolinami in čisto naravo.",
  pomurska: "Ravninska pokrajina ob Muri z bogato folklorno in kulinarično dediščino.",
  notranjska: "Skrivnostni kras, jamski svet in gozdnate samote notranje Slovenije.",
  zasavska: "Zelene doline ob Savi z bogato industrijsko in rudarsko zgodovino.",
  posavska: "Slikovite rečne doline ob Savi in Sotli z vinogradniško tradicijo.",
  jugovzhodna_slovenija: "Bela krajina in Kočevska — gozd, narava in pristna podeželska kultura.",
  osrednjeslovenska: "Zelena okolica prestolnice z dostopno naravo in podeželsko ponudbo.",
};

export default async function RegijeStran() {
  const supabase = await createSupabaseServer();

  // Preštej aktivne kmetije po regijah
  const { data } = await supabase
    .from("kmetije")
    .select("regija")
    .eq("aktivna", true);

  const stevilaPoRegijah: Record<string, number> = {};
  for (const row of data ?? []) {
    stevilaPoRegijah[row.regija] = (stevilaPoRegijah[row.regija] ?? 0) + 1;
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* ── Hero ── */}
      <div className="bg-forest-900 pt-32 pb-20 px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-1/4 w-96 h-96 rounded-full bg-forest-400 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-forest-300 blur-3xl" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-xs font-medium text-white mb-6">
            <MapPin size={14} />
            Vse regije
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
            Regije Slovenije
          </h1>
          <p className="text-lg text-white/70">
            Izberite regijo in odkrijte turistične kmetije v vaši bližini ali na vaši poti.
          </p>
        </div>
      </div>

      {/* ── Mreža regij ── */}
      <div className="max-w-6xl mx-auto px-6 py-16 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {REGIJE.map((regija) => {
            const stevilo = stevilaPoRegijah[regija] ?? 0;
            return (
              <Link
                key={regija}
                href={`/kmetije?regija=${regija}`}
                className="group flex flex-col rounded-2xl bg-white border border-earth-200/60 shadow-sm p-6 hover:shadow-lg hover:-translate-y-1 hover:border-forest-200 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl">{REGIJA_EMOJI[regija]}</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    stevilo > 0
                      ? "bg-forest-50 text-forest-700 border border-forest-200"
                      : "bg-earth-100 text-earth-500 border border-earth-200"
                  }`}>
                    {stevilo > 0 ? `${stevilo} ${stevilo === 1 ? "kmetija" : stevilo < 5 ? "kmetije" : "kmetij"}` : "Kmalu"}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-forest-900 mb-2 group-hover:text-forest-700 transition-colors">
                  {REGIJA_LABELS[regija]}
                </h2>
                <p className="text-sm text-earth-600 leading-relaxed flex-1">
                  {REGIJA_OPIS[regija]}
                </p>
                <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-forest-600 group-hover:gap-2 transition-all">
                  Poglej kmetije
                  <ArrowRight size={13} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
