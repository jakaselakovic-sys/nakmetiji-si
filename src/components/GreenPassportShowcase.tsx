// =============================================================================
// NaKmetiji.si — GreenPassportShowcase
// Stamp-book hero for the Zeleni Potni List — 12 Slovenian regions rendered
// as postage stamps (some faded "not visited", some inked with a red ink-rough
// stamp). Watermark silhouette of Slovenia sits behind the spread.
// =============================================================================

import Link from "next/link";
import { ArrowRight, Leaf, MapPin } from "lucide-react";
import { BackgroundOrnaments } from "@/components/BackgroundOrnaments";
import { Region, REGION_LABELS } from "@/types/farm";

type StampEntry = {
  region: Region;
  emoji: string;
  visited: boolean;
  date?: string;
};

// Demo set — in commercial mode this reads from the user's collected stamps.
const DEMO_STAMPS: StampEntry[] = [
  { region: Region.Gorenjska, emoji: "🏔", visited: true, date: "VII 2025" },
  { region: Region.Primorska, emoji: "🌊", visited: true, date: "VI 2025" },
  { region: Region.Stajerska, emoji: "🍇", visited: true, date: "IX 2025" },
  { region: Region.Dolenjska, emoji: "🌳", visited: true, date: "V 2025" },
  { region: Region.Koroska, emoji: "⛰️", visited: false },
  { region: Region.Savinjska, emoji: "🍎", visited: true, date: "X 2025" },
  { region: Region.Pomurska, emoji: "🌻", visited: false },
  { region: Region.Notranjska, emoji: "🌲", visited: true, date: "VIII 2025" },
  { region: Region.Zasavska, emoji: "⛏️", visited: false },
  { region: Region.Posavska, emoji: "🍒", visited: false },
  { region: Region.JugovzhodnaSlovenija, emoji: "🐝", visited: false },
  { region: Region.OsrednjeSlovenska, emoji: "🏰", visited: true, date: "IV 2025" },
];

export function GreenPassportShowcase() {
  const visitedCount = DEMO_STAMPS.filter((s) => s.visited).length;

  return (
    <section className="relative overflow-hidden bg-forest-950 py-24 px-6 texture-paper">
      {/* Deep forest gradient wash */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 100% 70% at 50% 0%, rgba(45,90,39,0.55) 0%, rgba(17,28,15,0.95) 60%, #0b1508 100%)",
        }}
      />
      <BackgroundOrnaments variant="passport" />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/25 text-emerald-300 text-xs font-bold mb-6 backdrop-blur-sm">
            <Leaf size={12} /> Zeleni Potni List
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4 font-display">
            Potni list za <span className="text-emerald-300">vaše popotovanje</span>
          </h2>
          <p className="text-base text-white/60 max-w-xl mx-auto leading-relaxed">
            Obiščite 12 slovenskih regij, zbirajte žige in odklenite nagrade.
            Vsak žig pripoveduje zgodbo — o ljudeh, okusih in krajih.
          </p>
        </div>

        {/* Stats strip — journal entries */}
        <div className="flex flex-wrap gap-6 justify-center mb-12 text-white/80">
          <MiniStat value={`${visitedCount}/12`} label="Regij obiskano" />
          <MiniStat value="47" label="Štampiljk zbranih" />
          <MiniStat value="3" label="Nagrad odklenjenih" />
        </div>

        {/* Stamp book spread */}
        <div
          className="relative rounded-[28px] p-6 sm:p-10 backdrop-blur-sm"
          style={{
            background:
              "linear-gradient(180deg, rgba(250,246,235,0.06) 0%, rgba(250,246,235,0.03) 100%)",
            border: "1px solid rgba(250,246,235,0.08)",
            boxShadow:
              "0 40px 80px -30px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          {/* Book spine shadow */}
          <div
            aria-hidden="true"
            className="hidden md:block absolute left-1/2 top-6 bottom-6 w-[2px] -translate-x-1/2 opacity-40"
            style={{
              background:
                "linear-gradient(180deg, transparent, rgba(0,0,0,0.5) 20%, rgba(0,0,0,0.5) 80%, transparent)",
            }}
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
            {DEMO_STAMPS.map((s, i) => (
              <StampCard key={s.region} entry={s} index={i} />
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
          <Link
            href="/green-passport"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-8 py-4 text-sm shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:scale-[1.03] active:scale-[0.98] transition-all firefly-glow"
          >
            <Leaf size={18} /> Odpri moj potni list
          </Link>
          <Link
            href="/zemljevid"
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 text-sm border border-white/20 backdrop-blur-sm transition-all"
          >
            <MapPin size={18} /> Načrtuj naslednji žig
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Internals ────────────────────────────────────────────────────────────────

function MiniStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="font-display text-3xl font-black text-emerald-200 leading-none">
        {value}
      </p>
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/50 mt-1.5">
        {label}
      </p>
    </div>
  );
}

function StampCard({ entry, index }: { entry: StampEntry; index: number }) {
  const label = REGION_LABELS[entry.region];
  const tilts = ["rotate-[-1.4deg]", "rotate-[0.8deg]", "rotate-[-0.4deg]", "rotate-[1.2deg]"];
  const tilt = tilts[index % tilts.length];

  return (
    <div
      className={`stamp-border relative bg-[#f6efdb] px-3 pt-4 pb-3 ${tilt} ${
        entry.visited ? "" : "stamp-faded"
      }`}
      style={{
        boxShadow:
          "0 6px 18px rgba(0,0,0,0.28), inset 0 0 0 1px rgba(0,0,0,0.04)",
      }}
    >
      {/* Emoji "artwork" */}
      <div className="flex items-center justify-center h-16 sm:h-20 text-4xl sm:text-5xl">
        <span
          aria-hidden="true"
          className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.12)]"
        >
          {entry.emoji}
        </span>
      </div>

      {/* Caption */}
      <div className="mt-2 text-center">
        <p className="font-display text-[13px] sm:text-sm font-bold text-forest-900 leading-tight">
          {label}
        </p>
        {entry.visited ? (
          <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-forest-700/70 mt-0.5">
            {entry.date}
          </p>
        ) : (
          <p className="text-[10px] uppercase tracking-[0.12em] font-semibold text-earth-500/70 mt-0.5">
            Še neobiskano
          </p>
        )}
      </div>

      {/* Overlay ink stamp for visited */}
      {entry.visited && (
        <div
          aria-hidden="true"
          className="ink-stamp absolute -top-1 right-2 text-[9px] font-black uppercase tracking-[0.15em] px-2 py-1 rounded-sm rotate-[-12deg]"
        >
          Overjeno
        </div>
      )}
    </div>
  );
}
