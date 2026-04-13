// =============================================================================
// NaKmetiji.si — Guest Passport Dashboard
// Real data only. Level system, seasonal stamps, endowed progress.
// =============================================================================

import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ChevronLeft, Stamp, Award, CheckCircle2,
  Search, QrCode, Star, Lock, Info, MapPin, Gift,
} from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase/server";
import {
  getLevel, getNextLevel, getProgressToNext, calculateTotalPoints,
  SEASONAL_STAMPS, getCurrentSeasonalStamp, LEVELS,
} from "@/lib/greenPassport";
import { PassportShareButton } from "@/components/PassportShareButton";
import { ClaimRewardButton } from "@/components/ClaimRewardButton";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Moj Zeleni Potni List | NaKmetiji",
};

export default async function MojPotniListPage() {
  const supabase = await createSupabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/prijava?redirect=/moj-potni-list");

  const { data: profil } = await supabase
    .from("profili")
    .select("ime")
    .eq("id", user.id)
    .single();

  // ascending: true is required for calculateTotalPoints to correctly attribute
  // the region-bonus to the FIRST stamp in each region, not the most recent one.
  // The display grid reverses via .toReversed() below so newest still shows first.
  const { data: stampsRaw } = await supabase
    .from("green_stamps")
    .select("id, ustvarjeno, kmetije(ime, regija, slug)")
    .eq("gost_id", user.id)
    .order("ustvarjeno", { ascending: true });

  type StampRow = {
    id: string;
    ustvarjeno: string;
    kmetije: { ime: string; regija: string; slug: string } | null;
  };
  // stamps is ascending (oldest first) — needed for correct point calculation.
  // stampsDisplay reverses so the grid shows newest first.
  const stamps = (stampsRaw ?? []) as unknown as StampRow[];
  const stampsDisplay = stamps.toReversed();

  const totalStamps = stamps.length;
  const stampData = stamps.map((s) => ({ regija: s.kmetije?.regija ?? "" }));
  const uniqueRegions = new Set(stampData.map((s) => s.regija).filter(Boolean)).size;
  const totalPoints = calculateTotalPoints(stampData);

  const currentLevel = getLevel(totalStamps, uniqueRegions);
  const nextLevel = getNextLevel(totalStamps, uniqueRegions);
  const progress = getProgressToNext(totalStamps, uniqueRegions);
  const stepsToNext = nextLevel ? nextLevel.minStamps - totalStamps : null;

  const currentSeasonal = getCurrentSeasonalStamp();
  const rewardReady = nextLevel === null || totalStamps >= (nextLevel?.minStamps ?? 999);

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">

      {/* Header background */}
      <div className="absolute top-0 left-0 w-full h-[55dvh] bg-forest-900 z-0">
        <div className="absolute inset-0 bg-[url('/images/bg-mountains.webp')] opacity-20 bg-cover bg-center mix-blend-overlay" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 pt-20 pb-28">

        <div className="flex items-center justify-between mb-8">
          <Link
            href="/green-passport"
            className="inline-flex items-center gap-2 text-forest-200 hover:text-white transition-colors font-medium"
          >
            <ChevronLeft size={18} /> Zeleni potni list
          </Link>
          <PassportShareButton
            name={profil?.ime ?? "Popotnik"}
            stamps={totalStamps}
            regions={uniqueRegions}
            currentLevel={currentLevel}
            totalPoints={totalPoints}
          />
        </div>

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row items-start md:items-end gap-6 justify-between mb-10">
          <div className="text-white">
            <p className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1">
              {currentLevel.icon} {currentLevel.name}
            </p>
            <h1 className="text-4xl font-black mb-2 font-serif tracking-tight">
              Moj Zeleni Potni List
            </h1>
            <p className="text-forest-200 text-base">
              Zdravo, <span className="font-bold text-white">{profil?.ime ?? "Popotnik"}</span>!
            </p>
          </div>

          {/* Stats cluster */}
          <div className="flex gap-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-white text-center min-w-[90px]">
              <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-400 mb-0.5">Žigi</p>
              <p className="text-3xl font-black">{totalStamps}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-white text-center min-w-[90px]">
              <p className="text-[10px] uppercase tracking-widest font-bold text-amber-400 mb-0.5">Točke</p>
              <p className="text-3xl font-black">{totalPoints}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl text-white text-center min-w-[90px]">
              <p className="text-[10px] uppercase tracking-widest font-bold text-teal-400 mb-0.5">Regije</p>
              <p className="text-3xl font-black">{uniqueRegions}<span className="text-lg text-white/40">/12</span></p>
            </div>
          </div>
        </div>

        {/* ── Level progress card ── */}
        <div className="bg-white rounded-[2rem] p-7 shadow-xl mb-8 relative overflow-hidden border border-earth-100">
          <div className="absolute top-0 right-0 p-8 opacity-[0.04]">
            <Award size={200} />
          </div>
          <div className="relative z-10">

            {/* Endowed progress — shows "Le še N do nagrade" even at 0 stamps */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-forest-900 flex items-center gap-2">
                <Star size={16} className="text-amber-500" fill="currentColor" />
                {nextLevel ? `Naslednji nivo: ${nextLevel.name}` : "Vrhunski nivo dosežen!"}
              </h3>
              {stepsToNext !== null && stepsToNext > 0 && (
                <span className="text-xs text-earth-500 font-semibold">
                  Še {stepsToNext} {stepsToNext === 1 ? "žig" : "žige"}
                </span>
              )}
            </div>

            <div className="w-full bg-earth-100 h-3 rounded-full overflow-hidden mb-3">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-700 ease-out relative"
                style={{ width: `${progress.pct}%` }}
              >
                <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
              </div>
            </div>

            {nextLevel && (
              <p className="text-xs text-earth-500 mb-5">
                Nagrada:{" "}
                <span className="font-semibold text-forest-800">{nextLevel.rewardShort}</span>
              </p>
            )}

            {/* Current reward */}
            <div className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${currentLevel.colorClass} ${currentLevel.textClass}`}>
              <CheckCircle2 size={15} />
              Odklenjena nagrada: {currentLevel.rewardShort}
            </div>

            {rewardReady && nextLevel === null && (
              <ClaimRewardButton />
            )}
          </div>
        </div>

        {/* ── Level roadmap ── */}
        <div className="bg-white rounded-[2rem] p-7 shadow-sm border border-earth-100 mb-8">
          <h3 className="text-base font-bold text-forest-900 mb-5">Pot do vrha</h3>
          <div className="space-y-3">
            {LEVELS.map((lvl) => {
              const unlocked = totalStamps >= lvl.minStamps;
              const isCurrent = lvl.name === currentLevel.name;
              return (
                <div
                  key={lvl.name}
                  className={`flex items-center gap-4 rounded-2xl px-4 py-3 transition-all ${
                    isCurrent
                      ? "bg-emerald-50 border-2 border-emerald-200"
                      : unlocked
                      ? "bg-earth-50 border border-earth-200"
                      : "opacity-50"
                  }`}
                >
                  <span className="text-2xl">{lvl.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-forest-900 flex items-center gap-2">
                      {lvl.name}
                      {isCurrent && (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                          Tvoj nivo
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-earth-500 truncate">{lvl.rewardShort}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {unlocked ? (
                      <CheckCircle2 size={18} className="text-emerald-500" />
                    ) : (
                      <div className="flex items-center gap-1 text-earth-400 text-xs font-semibold">
                        <Lock size={13} /> {lvl.minStamps}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Seasonal stamps ── */}
        <div className="bg-white rounded-[2rem] p-7 shadow-sm border border-earth-100 mb-8">
          <h3 className="text-base font-bold text-forest-900 mb-1">Sezonski žigi</h3>
          <p className="text-xs text-earth-500 mb-5">Limitirani žigi — zberi jih pred iztekom sezone</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SEASONAL_STAMPS.map((s) => {
              const isActive = s.name === currentSeasonal.name;
              return (
                <div
                  key={s.name}
                  className={`rounded-2xl p-4 text-center border-2 transition-all ${
                    isActive
                      ? "border-amber-300 bg-amber-50"
                      : "border-earth-200 bg-earth-50 opacity-50 grayscale"
                  }`}
                >
                  <span className="text-3xl mb-2 block">{s.icon}</span>
                  <p className="text-[11px] font-bold text-forest-900 leading-tight">{s.name}</p>
                  <p className="text-[10px] text-earth-500 mt-1">{s.description}</p>
                  {isActive && (
                    <span className="mt-2 inline-block text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full uppercase tracking-wide">
                      Aktivno zdaj
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── How it works ── */}
        <div className="bg-white rounded-[2rem] p-7 shadow-sm border border-earth-100 mb-8">
          <h3 className="text-base font-bold text-forest-900 mb-1 flex items-center gap-2">
            <Info size={16} className="text-forest-500" />
            Kako deluje sistem žigov?
          </h3>
          <p className="text-xs text-earth-500 mb-5">Vse kar moraš vedeti o zbiranju žigov in točk</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center mb-3">
                <MapPin size={18} className="text-emerald-700" />
              </div>
              <p className="text-sm font-bold text-forest-900 mb-1">Pridobi žig</p>
              <p className="text-xs text-earth-600 leading-relaxed">
                Obišči kmetijo in na strani kmetije pritisni gumb <strong>»Pridobi žig«</strong>. Žig se takoj shrani v tvoj potni list.
              </p>
            </div>
            <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center mb-3">
                <Star size={18} className="text-amber-600" fill="currentColor" />
              </div>
              <p className="text-sm font-bold text-forest-900 mb-1">Zberi točke</p>
              <p className="text-xs text-earth-600 leading-relaxed">
                Vsak žig prinese <strong>10 točk</strong>. Prvi žig v vsaki novi regiji ti prinese dodatnih <strong>+5 točk</strong> bonusa za raznolikost.
              </p>
            </div>
            <div className="rounded-2xl bg-forest-50 border border-forest-100 p-4">
              <div className="w-9 h-9 rounded-xl bg-forest-100 flex items-center justify-center mb-3">
                <Gift size={18} className="text-forest-700" />
              </div>
              <p className="text-sm font-bold text-forest-900 mb-1">Osvoji nagrade</p>
              <p className="text-xs text-earth-600 leading-relaxed">
                Z napredovanjem po nivojih odkleneš popuste in ekskluzivne nagrade. Doseži vse 12 regij za naziv <strong>Legenda</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* ── Collected stamps grid ── */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-xl font-black text-forest-900">Zbrani žigi</h3>
          {totalStamps > 0 && (
            <Link
              href="/kmetije"
              className="text-sm text-forest-600 hover:text-forest-800 font-semibold flex items-center gap-1"
            >
              <Search size={14} /> Dodaj več
            </Link>
          )}
        </div>

        {totalStamps === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-earth-300 bg-white/60 p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-earth-100 text-earth-300">
              <QrCode size={32} />
            </div>
            <h4 className="text-lg font-bold text-forest-900 mb-2">Tvoj potni list je prazen</h4>
            <p className="text-sm text-earth-500 max-w-sm mx-auto mb-6">
              Obišči kmetijo in pritisni <strong>»Pridobi žig«</strong> na strani kmetije.
              Le še <strong>1 žig</strong> do prvega odklenjenega nivoja!
            </p>
            <Link
              href="/kmetije"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-forest-700 text-white font-semibold text-sm hover:bg-forest-600 transition-colors shadow-md"
            >
              <Search size={16} /> Poišči kmetijo
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stampsDisplay.map((stamp) => (
              <Link
                key={stamp.id}
                href={stamp.kmetije ? `/kmetije/${stamp.kmetije.slug}` : "#"}
                className="aspect-square bg-white rounded-3xl p-5 shadow-sm border-2 border-emerald-100 flex flex-col items-center justify-center text-center relative group hover:border-emerald-400 hover:shadow-md transition-all"
              >
                <div className="absolute -rotate-12 group-hover:rotate-0 transition-transform duration-500 ease-out text-emerald-600 drop-shadow-sm">
                  <Stamp size={64} strokeWidth={1.5} />
                </div>
                <div className="relative z-10 mt-auto bg-white/90 backdrop-blur-sm w-full py-2 rounded-xl">
                  <p className="font-bold text-forest-900 text-xs leading-tight mb-0.5 line-clamp-2">
                    {stamp.kmetije?.ime ?? "Kmetija"}
                  </p>
                  <p className="text-[10px] text-earth-500 uppercase tracking-wider font-semibold capitalize">
                    {stamp.kmetije?.regija}
                  </p>
                  <p className="text-[9px] text-earth-400 mt-1">
                    {new Date(stamp.ustvarjeno).toLocaleDateString("sl-SI")}
                  </p>
                </div>
              </Link>
            ))}

            {/* Empty slots up to next level */}
            {stepsToNext !== null &&
              Array.from({ length: Math.min(stepsToNext, 4) }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="aspect-square bg-earth-50 rounded-3xl p-5 border-2 border-earth-200 border-dashed flex flex-col items-center justify-center text-center opacity-60"
                >
                  <Stamp size={56} strokeWidth={1} className="text-earth-300" />
                  <p className="text-[10px] text-earth-400 uppercase tracking-wider font-bold mt-3">
                    +1 žig
                  </p>
                </div>
              ))}
          </div>
        )}

      </div>
    </div>
  );
}
