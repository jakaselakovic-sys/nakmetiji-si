// =============================================================================
// NaKmetiji.si — GreenPassportShowcase v2
// Leather passport book aesthetic. Cream inner pages, dark binding,
// perforated stamps with circular ink "OVERJENO" seals.
// =============================================================================

import Link from "next/link";
import { Leaf, MapPin, ArrowRight } from "lucide-react";
import { BackgroundOrnaments } from "@/components/BackgroundOrnaments";
import { Region, REGION_LABELS } from "@/types/farm";

type StampEntry = {
  region: Region;
  emoji: string;
  visited: boolean;
  date?: string;
};

const DEMO_STAMPS: StampEntry[] = [
  { region: Region.Gorenjska,           emoji: "🏔",  visited: true,  date: "VII 2025" },
  { region: Region.Primorska,           emoji: "🌊",  visited: true,  date: "VI 2025" },
  { region: Region.Stajerska,           emoji: "🍇",  visited: true,  date: "IX 2025" },
  { region: Region.Dolenjska,           emoji: "🌳",  visited: true,  date: "V 2025" },
  { region: Region.Koroska,             emoji: "⛰️",  visited: false },
  { region: Region.Savinjska,           emoji: "🍎",  visited: true,  date: "X 2025" },
  { region: Region.Pomurska,            emoji: "🌻",  visited: false },
  { region: Region.Notranjska,          emoji: "🌲",  visited: true,  date: "VIII 2025" },
  { region: Region.Zasavska,            emoji: "⛏️",  visited: false },
  { region: Region.Posavska,            emoji: "🍒",  visited: false },
  { region: Region.JugovzhodnaSlovenija,emoji: "🐝",  visited: false },
  { region: Region.OsrednjeSlovenska,   emoji: "🏰",  visited: true,  date: "IV 2025" },
];

export function GreenPassportShowcase() {
  const visitedCount = DEMO_STAMPS.filter((s) => s.visited).length;

  return (
    <section className="relative overflow-hidden py-28 px-6" aria-labelledby="passport-heading">
      {/* ── Layered atmospheric background ── */}
      <div className="absolute inset-0 bg-forest-950" />
      {/* Subtle grain noise over dark background */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23g)'/%3E%3C/svg%3E")`,
          backgroundSize: "256px 256px",
          mixBlendMode: "overlay",
        }}
        aria-hidden="true"
      />
      {/* Deep green vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 110% 75% at 50% 0%, rgba(45,90,39,0.5) 0%, rgba(11,21,8,0.98) 70%)",
        }}
        aria-hidden="true"
      />
      <BackgroundOrnaments variant="passport" />

      <div className="relative z-10 max-w-5xl mx-auto">

        {/* ── Section header ── */}
        <div className="text-center mb-16">
          {/* Decorative rule with label */}
          <div className="flex items-center gap-4 mb-8 max-w-xs mx-auto">
            <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, transparent, rgba(110,231,183,0.3))" }} />
            <span className="text-[9px] font-bold uppercase tracking-[0.32em] text-emerald-400/55 flex items-center gap-1.5">
              <Leaf size={9} /> Zeleni Potni List
            </span>
            <div className="h-px flex-1" style={{ background: "linear-gradient(90deg, rgba(110,231,183,0.3), transparent)" }} />
          </div>

          <h2 id="passport-heading" className="font-display font-bold text-white leading-[0.92] tracking-tight">
            <span className="block text-5xl sm:text-6xl lg:text-7xl">Potni list za</span>
            <em className="block text-5xl sm:text-6xl lg:text-7xl text-emerald-300 not-italic"
              style={{ fontStyle: "italic", fontWeight: 300 }}>
              vaše popotovanje
            </em>
          </h2>

          <p className="mt-6 text-white/50 max-w-md mx-auto text-base leading-relaxed">
            Obiščite 12 slovenskih regij, zbirajte žige in odklenite nagrade.
            Vsak žig pripoveduje zgodbo — o ljudeh, okusih in krajih.
          </p>
        </div>

        {/* ── Stats — passport data field style ── */}
        <div className="flex justify-center mb-14">
          <div
            className="inline-flex rounded-2xl overflow-hidden divide-x divide-white/10"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <PassportStat value={`${visitedCount}/12`} label="Regij obiskano" />
            <PassportStat value="47" label="Žigov zbranih" />
            <PassportStat value="3" label="Nagrad odklenjenih" />
          </div>
        </div>

        {/* ── Passport book spread ── */}
        <div
          className="relative rounded-2xl overflow-hidden"
          style={{
            background: "linear-gradient(145deg, #2e1a0e 0%, #1a0e08 60%, #0f0905 100%)",
            boxShadow:
              "0 48px 100px -24px rgba(0,0,0,0.8), 0 16px 40px -16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(166,124,91,0.15)",
            border: "1px solid rgba(166,124,91,0.12)",
          }}
        >
          {/* Leather grain overlay */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.08]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='100' viewBox='0 0 200 100'%3E%3Cg fill='none' stroke='%23a67c5b' stroke-width='0.4' opacity='0.4'%3E%3Cpath d='M0,15 C50,10 100,20 200,13'/%3E%3Cpath d='M0,35 C60,42 120,30 200,38'/%3E%3Cpath d='M0,55 C40,50 110,62 200,56'/%3E%3Cpath d='M0,75 C70,80 130,68 200,76'/%3E%3Cpath d='M0,95 C55,88 115,98 200,92'/%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: "200px 100px",
            }}
            aria-hidden="true"
          />

          {/* Book binding spine */}
          <div
            className="absolute left-1/2 top-0 bottom-0 w-4 -translate-x-1/2 pointer-events-none hidden md:block"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(0,0,0,0.45) 30%, rgba(0,0,0,0.55) 50%, rgba(0,0,0,0.45) 70%, transparent)",
            }}
            aria-hidden="true"
          />

          {/* Inner page spread — cream paper */}
          <div
            className="m-3 sm:m-4 rounded-xl overflow-hidden"
            style={{
              background: "linear-gradient(165deg, #fefbf2 0%, #f9f1dc 50%, #f4e9ca 100%)",
              boxShadow: "inset 0 2px 8px rgba(0,0,0,0.08), inset 0 -1px 4px rgba(0,0,0,0.04)",
            }}
          >
            {/* Page header strip */}
            <div
              className="flex items-center justify-between px-6 sm:px-8 py-4 border-b"
              style={{ borderColor: "rgba(106,63,36,0.12)" }}
            >
              <div>
                <p className="text-[8px] font-bold uppercase tracking-[0.28em] text-earth-500">
                  Republika Slovenija
                </p>
                <p className="font-display text-base font-bold text-earth-900 mt-0.5 leading-none">
                  Zeleni Potni List
                </p>
              </div>
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: "rgba(45,90,39,0.12)" }}
              >
                <Leaf size={18} className="text-forest-700" />
              </div>
            </div>

            {/* Stamps grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-5 p-6 sm:p-8">
              {DEMO_STAMPS.map((s, i) => (
                <StampCard key={s.region} entry={s} index={i} />
              ))}
            </div>

            {/* Page footer */}
            <div
              className="px-6 sm:px-8 py-3 border-t flex justify-between items-center"
              style={{ borderColor: "rgba(106,63,36,0.10)" }}
            >
              <p className="text-[8px] text-earth-400 uppercase tracking-widest">
                {visitedCount} / 12 obiskano
              </p>
              <p className="text-[8px] text-earth-400 uppercase tracking-widest font-script text-xs normal-case">
                NaKmetiji.si
              </p>
            </div>
          </div>
        </div>

        {/* ── CTAs ── */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
          <Link
            href="/green-passport"
            className="inline-flex items-center justify-center gap-2.5 rounded-2xl text-white font-semibold px-8 py-4 text-sm shadow-xl hover:scale-[1.03] active:scale-[0.98] transition-all"
            style={{
              background: "linear-gradient(135deg, #2D5A27 0%, #38a169 100%)",
              boxShadow: "0 8px 24px rgba(45,90,39,0.35), 0 2px 8px rgba(0,0,0,0.2)",
            }}
          >
            <Leaf size={17} /> Odpri moj potni list
          </Link>
          <Link
            href="/zemljevid"
            className="inline-flex items-center justify-center gap-2.5 rounded-2xl font-semibold px-8 py-4 text-sm border backdrop-blur-sm transition-all hover:bg-white/15"
            style={{
              color: "rgba(255,255,255,0.85)",
              borderColor: "rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.06)",
            }}
          >
            <MapPin size={17} /> Načrtuj naslednji žig
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── PassportStat ──────────────────────────────────────────────────────────────

function PassportStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="px-8 py-5 text-center">
      <p className="font-display text-3xl font-bold text-emerald-200 leading-none tabular-nums">
        {value}
      </p>
      <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-white/35 mt-2">
        {label}
      </p>
    </div>
  );
}

// ── StampCard ─────────────────────────────────────────────────────────────────

const TILTS = ["-1.3deg", "0.9deg", "-0.5deg", "1.4deg", "-0.8deg", "0.6deg"];

function StampCard({ entry, index }: { entry: StampEntry; index: number }) {
  const label = REGION_LABELS[entry.region];
  const tilt = TILTS[index % TILTS.length];

  return (
    <div
      className={`relative select-none transition-all duration-300 hover:scale-[1.04] ${
        !entry.visited ? "opacity-40 grayscale" : ""
      }`}
      style={{ transform: `rotate(${tilt})` }}
    >
      {/* Stamp frame — perforated via stamp-border class */}
      <div
        className="stamp-border relative"
        style={{
          background: "linear-gradient(160deg, #fefcf5 0%, #f8f0dc 100%)",
          padding: "10px 8px 8px",
          boxShadow: entry.visited
            ? "0 8px 24px rgba(0,0,0,0.28), 0 2px 6px rgba(0,0,0,0.14), inset 0 0 0 1px rgba(0,0,0,0.04)"
            : "0 3px 10px rgba(0,0,0,0.18)",
        }}
      >
        {/* Emoji artwork */}
        <div className="flex items-center justify-center h-14 sm:h-16 text-3xl sm:text-4xl leading-none">
          <span aria-hidden="true" style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.15))" }}>
            {entry.emoji}
          </span>
        </div>

        {/* Region info */}
        <div className="mt-2 text-center">
          <p className="font-display text-[11px] sm:text-[12px] font-bold text-forest-900 leading-tight">
            {label}
          </p>
          <p
            className="text-[8px] font-bold uppercase tracking-[0.14em] mt-0.5"
            style={{ color: entry.visited ? "rgba(45,90,39,0.55)" : "rgba(106,63,36,0.4)" }}
          >
            {entry.visited ? entry.date : "Še neobiskano"}
          </p>
        </div>

        {/* OVERJENO — circular ink stamp */}
        {entry.visited && (
          <div
            className="absolute -top-2 -right-2 pointer-events-none"
            style={{ transform: "rotate(-14deg)" }}
            aria-hidden="true"
          >
            <svg width="46" height="46" viewBox="0 0 46 46" fill="none">
              {/* Outer ring */}
              <circle cx="23" cy="23" r="20" stroke="#8b2020" strokeWidth="1.2" strokeDasharray="2.5 1" opacity="0.75" />
              {/* Inner ring */}
              <circle cx="23" cy="23" r="14.5" stroke="#8b2020" strokeWidth="0.7" opacity="0.5" />
              {/* Curved text path */}
              <path id={`arc-${label}`} d="M 5 23 A 18 18 0 1 1 41 23" fill="none" />
              <text fontSize="4.5" fill="#8b2020" opacity="0.85" fontWeight="700" letterSpacing="0.8">
                <textPath href={`#arc-${label}`} startOffset="14%">OVERJENO · VERIFIED ·</textPath>
              </text>
              {/* Center star */}
              <text x="23" y="27" textAnchor="middle" fontSize="9" fill="#8b2020" opacity="0.7">✦</text>
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
