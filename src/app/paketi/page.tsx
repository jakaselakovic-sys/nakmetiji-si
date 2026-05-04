// =============================================================================
// NaKmetiji.si — Paketi za lastnike kmetij
// 4-tier pricing page: Korenine → Avtentičnost → Pospešek → Titan Elite
// =============================================================================

import type { Metadata } from "next";
import Link from "next/link";
import { Check, Sprout, Star, Zap, Crown, Video, ArrowRight } from "lucide-react";
import {
  PAKET_CONFIG, izracunajCenoVidea,
  type KmetijaPaket,
} from "@/types/database";

export const metadata: Metadata = {
  title: "Paketi za lastnike kmetij",
  description:
    "Izberite naročniški paket, ki ustreza vaši kmetiji. Od brezplačnega profila do Titan Elite statusa z zlatobordno kartico in Jože's Choice značko.",
};

const TIERS: KmetijaPaket[] = ["korenine", "avtenticnost", "posesek", "titan_elite"];

const TIER_ICONS = {
  korenine:    Sprout,
  avtenticnost: Star,
  posesek:     Zap,
  titan_elite: Crown,
};

const TIER_FEATURES: Record<KmetijaPaket, string[]> = {
  korenine: [
    "Osnovni profil kmetije",
    "Jože AI: standardni opis",
    "Video produkcija: 400 €",
    "Iskalna prioriteta: zadnja mesta",
  ],
  avtenticnost: [
    "Vse iz paketa Korenine",
    "Jože AI: lokalna omemba",
    "Video produkcija: 390 € (–2,5 %)",
    "Iskalna prioriteta: sredina",
    "Zelena Jože značka",
  ],
  posesek: [
    "Vse iz paketa Avtentičnost",
    "Jože AI: aktivno priporočilo",
    "Video produkcija: 380 € (–5 %)",
    "Iskalna prioriteta: visoka",
    "Video v iskalniku",
    "🎯 Priporočeno značka na kartici",
  ],
  titan_elite: [
    "Vse iz paketa Pospešek",
    "Jože AI: Jože's Choice (top izbor)",
    "Video produkcija: 360 € (–10 %)",
    "Iskalna prioriteta: absolutni vrh",
    "Video na Hero strani",
    "✦ Jože's Choice značka",
    "Zlatobordna kartica kmetije",
  ],
};

export default function PaketiPage() {
  return (
    <div className="min-h-screen bg-paper">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative py-24 px-6 text-center bg-forest-950 overflow-hidden">
        {/* Background grain */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "url('/noise.png')", backgroundRepeat: "repeat" }} />

        {/* Amber glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-3xl opacity-20"
          style={{ background: "radial-gradient(ellipse, #d4a853, transparent)" }} />

        <div className="relative z-10 mx-auto max-w-3xl">
          <span className="inline-block px-4 py-1.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold uppercase tracking-widest mb-6">
            Za lastnike kmetij
          </span>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
            Vaša kmetija si zasluži{" "}
            <span className="text-amber-400">spotlight</span>
          </h1>
          <p className="text-lg text-white/70 leading-relaxed max-w-xl mx-auto mb-10">
            Izberite raven vidnosti, ki ustreza vašim ciljem.
            Vsak plačljiv paket vključuje prednostno uvrščanje v iskanju,
            tier-aware Jože AI in popust na cinematic video produkcijo.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="#paketi"
              className="px-7 py-3.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold rounded-xl transition-colors"
            >
              Poglej pakete
            </Link>
            <Link
              href="/video"
              className="px-7 py-3.5 border border-white/20 hover:border-white/40 text-white font-semibold rounded-xl transition-colors"
            >
              Video produkcija →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Pricing cards ─────────────────────────────────────────────────── */}
      <section id="paketi" className="py-20 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-black text-forest-950 mb-3">
              Štirje paketi, ena platforma
            </h2>
            <p className="text-earth-500 text-base max-w-lg mx-auto">
              Začnite brezplačno, nadgradite ko boste pripravljeni.
              Brez skritih stroškov, brez letnih obveznosti.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch">
            {TIERS.map((tier) => {
              const cfg = PAKET_CONFIG[tier];
              const Icon = TIER_ICONS[tier];
              const cenoVidea = izracunajCenoVidea(tier);
              const isElite = tier === "titan_elite";
              const features = TIER_FEATURES[tier];

              return (
                <div
                  key={tier}
                  className={`relative flex flex-col rounded-2xl overflow-hidden ${
                    isElite
                      ? "bg-forest-950 text-white shadow-2xl ring-2 ring-amber-400"
                      : "bg-white border border-earth-200 shadow-sm"
                  }`}
                >
                  {/* Recommended label */}
                  {isElite && (
                    <div className="absolute -top-px left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-amber-300 to-amber-500" />
                  )}
                  {isElite && (
                    <div className="text-center py-2 bg-amber-400/10 border-b border-amber-400/20">
                      <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                        ✦ Priporočamo
                      </span>
                    </div>
                  )}

                  <div className="p-6 flex flex-col flex-1">
                    {/* Header */}
                    <div className="mb-5">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                        style={{ background: isElite ? "rgba(212,168,83,0.15)" : cfg.barva_bg }}
                      >
                        <Icon size={20} style={{ color: isElite ? "#d4a853" : cfg.barva }} />
                      </div>

                      <p
                        className="text-xs font-black uppercase tracking-widest mb-2"
                        style={{ color: isElite ? "#d4a853" : cfg.barva }}
                      >
                        {cfg.emoji} {cfg.label}
                      </p>

                      {cfg.cena_mesec === null ? (
                        <p className={`text-3xl font-black ${isElite ? "text-white" : "text-forest-950"}`}>
                          Brezplačno
                        </p>
                      ) : (
                        <div className="flex items-baseline gap-1">
                          <span className={`text-3xl font-black ${isElite ? "text-white" : "text-forest-950"}`}>
                            {cfg.cena_mesec} €
                          </span>
                          <span className={`text-sm ${isElite ? "text-white/50" : "text-earth-400"}`}>
                            /mesec
                          </span>
                        </div>
                      )}

                      <p className={`text-sm mt-1 ${isElite ? "text-white/60" : "text-earth-500"}`}>
                        {cfg.opis}
                      </p>
                    </div>

                    {/* Video price highlight */}
                    <div
                      className={`rounded-xl px-3 py-2.5 mb-5 flex items-center justify-between ${
                        isElite ? "bg-amber-400/10 border border-amber-400/20" : "bg-earth-50 border border-earth-100"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Video size={14} style={{ color: isElite ? "#d4a853" : cfg.barva }} />
                        <span className={`text-xs font-semibold ${isElite ? "text-amber-300" : "text-earth-600"}`}>
                          Video produkcija
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-black ${isElite ? "text-amber-400" : "text-forest-900"}`}>
                          {cenoVidea} €
                        </span>
                        {cfg.video_popust > 0 && (
                          <span className="block text-[10px] font-bold text-green-500">
                            –{Math.round(cfg.video_popust * 100)} %
                          </span>
                        )}
                      </div>
                    </div>

                    <div className={`border-t mb-4 ${isElite ? "border-white/10" : "border-earth-100"}`} />

                    {/* Features */}
                    <ul className="space-y-2.5 flex-1 mb-6">
                      {features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check
                            size={14}
                            className="mt-0.5 flex-shrink-0"
                            style={{ color: isElite ? "#d4a853" : cfg.barva }}
                          />
                          <span className={isElite ? "text-white/80" : "text-earth-700"}>
                            {f}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <Link
                      href={tier === "korenine" ? "/dodaj-kmetijo" : "mailto:info@nakmetiji.si?subject=Paket%20" + cfg.label}
                      className={`block text-center px-4 py-3 rounded-xl font-bold text-sm transition-colors ${
                        isElite
                          ? "bg-amber-400 hover:bg-amber-300 text-amber-950"
                          : tier === "korenine"
                            ? "border border-earth-300 text-earth-700 hover:bg-earth-50"
                            : "bg-forest-600 hover:bg-forest-500 text-white"
                      }`}
                    >
                      {tier === "korenine" ? "Začni brezplačno" : `Nadgradi na ${cfg.label}`}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Comparison table ─────────────────────────────────────────────── */}
      <section className="py-16 px-6 bg-forest-50 border-y border-forest-100">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-display text-2xl font-black text-forest-950 text-center mb-10">
            Primerjava paketov
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-forest-200">
                  <th className="text-left py-3 pr-4 text-earth-600 font-semibold">Lastnost</th>
                  {TIERS.map((tier) => (
                    <th key={tier} className="py-3 px-2 text-center font-bold" style={{ color: PAKET_CONFIG[tier].barva }}>
                      {PAKET_CONFIG[tier].emoji} {PAKET_CONFIG[tier].label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-earth-100">
                {[
                  { label: "Mesečna cena", values: ["Brezplačno", "12 €", "29 €", "49 €"] },
                  { label: "Video produkcija", values: ["400 €", "390 €", "380 €", "360 €"] },
                  { label: "Jože AI status", values: ["Opis", "Lokalna omemba", "Priporočilo", "Jože's Choice"] },
                  { label: "Iskalna prioriteta", values: ["Zadnja mesta", "Sredina", "Visoka", "Absolutni vrh"] },
                  { label: "Video v iskalniku", values: ["—", "—", "✓", "✓"] },
                  { label: "Video na Hero strani", values: ["—", "—", "—", "✓"] },
                  { label: "Zlata kartica", values: ["—", "—", "—", "✓"] },
                ].map(({ label, values }) => (
                  <tr key={label}>
                    <td className="py-3 pr-4 text-earth-700 font-medium">{label}</td>
                    {values.map((v, i) => (
                      <td key={i} className={`py-3 px-2 text-center ${
                        i === 3 ? "font-bold text-amber-700" : "text-earth-600"
                      }`}>
                        {v}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────────────── */}
      <section className="py-20 px-6 text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="font-display text-2xl font-black text-forest-950 mb-4">
            Še vprašanja?
          </h2>
          <p className="text-earth-500 mb-8">
            Pišite nam na{" "}
            <a href="mailto:info@nakmetiji.si" className="text-forest-700 underline decoration-dotted hover:text-forest-500">
              info@nakmetiji.si
            </a>{" "}
            ali nas pokličite. Z veseljem vam pomagamo izbrati pravi paket.
          </p>
          <Link
            href="/video"
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-forest-600 hover:bg-forest-500 text-white font-bold rounded-xl transition-colors"
          >
            <Video size={16} />
            Poglej video produkcijo
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}
