// =============================================================================
// NaKmetiji.si — O nas
// =============================================================================

import type { Metadata } from "next";
import Link from "next/link";
import { Leaf, Users, MapPin, Heart, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "O nas | NaKmetiji",
  description:
    "NaKmetiji.si je slovensko spletno mesto, ki povezuje turistične kmetije z gosti iz vsega sveta. Spoznajte našo zgodbo.",
};

const VREDNOTE = [
  {
    icon: <Leaf size={24} className="text-forest-600" />,
    naslov: "Trajnostni turizem",
    opis: "Podpiramo ekološke in trajnostne prakse na slovenskem podeželju ter spodbujamo odgovorno potovanje.",
  },
  {
    icon: <Users size={24} className="text-forest-600" />,
    naslov: "Skupnost",
    opis: "Gradimo skupnost med lastniki kmetij in gosti, ki cenijo pristnost, lokalno hrano in naravo.",
  },
  {
    icon: <MapPin size={24} className="text-forest-600" />,
    naslov: "Slovenija",
    opis: "Ponosni smo na 12 regij naše dežele — od Triglava do Jadrana, od Pomurja do Koroške.",
  },
  {
    icon: <Heart size={24} className="text-forest-600" />,
    naslov: "Pristnost",
    opis: "Vsaka kmetija na naši platformi je ročno pregledana. Prikazujemo le kmetije z resnično ponudbo.",
  },
];

const STATS = [
  { vrednost: "50+", oznaka: "kmetij" },
  { vrednost: "12", oznaka: "regij" },
  { vrednost: "100%", oznaka: "slovensko" },
  { vrednost: "0 €", oznaka: "za goste" },
];

export default function ONasPage() {
  return (
    <div className="min-h-screen bg-cream">
      {/* ── Hero ── */}
      <div className="bg-forest-900 pt-32 pb-24 px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-1/4 w-96 h-96 rounded-full bg-forest-400 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full bg-forest-300 blur-3xl" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-xs font-medium text-white mb-6">
            <Leaf size={14} />
            Naša zgodba
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-5 font-display">
            O nas
          </h1>
          <p className="text-lg text-white/70 leading-relaxed max-w-2xl mx-auto">
            NaKmetiji.si je nastala iz ljubezni do slovenskega podeželja in prepričanja,
            da si najboljše počitnice zaslužijo pristno doživetje — ne hotelska soba.
          </p>
        </div>
      </div>

      {/* ── Statistike ── */}
      <div className="bg-white border-b border-earth-200/60">
        <div className="max-w-5xl mx-auto px-6 py-10 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {STATS.map((s) => (
              <div key={s.oznaka}>
                <p className="text-3xl sm:text-4xl font-extrabold text-forest-800 mb-1">{s.vrednost}</p>
                <p className="text-sm text-earth-500 font-medium uppercase tracking-wider">{s.oznaka}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-16 lg:px-8 space-y-20">

        {/* ── Zgodba ── */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-forest-600 mb-3 block">Naša zgodba</span>
            <h2 className="text-3xl font-extrabold text-forest-900 mb-5 leading-tight">
              Začelo se je z enim vikend odhodom na kmetijo
            </h2>
            <div className="space-y-4 text-earth-700 leading-relaxed">
              <p>
                Ko smo leta 2024 iskali turistično kmetijo za družinski izlet, smo ugotovili,
                da je ponudba slovenskega podeželja raztresena po stotinah nepovezanih spletnih strani,
                Facebookovih profilih in turističnih brošurah.
              </p>
              <p>
                Odločili smo se to spremeniti. NaKmetiji.si je enotna platforma, kjer
                lastniki kmetij enostavno predstavijo svojo ponudbo, gostje pa v minutah
                najdejo in rezervirajo svojo popolno destinacijo.
              </p>
              <p>
                Danes pokrivamo vse regije Slovenije in rastemo z vsako novo kmetijo,
                ki se nam pridruži.
              </p>
            </div>
          </div>
          <div className="rounded-3xl bg-forest-50 border border-forest-200/60 p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-forest-700 text-white">
                <Leaf size={22} strokeWidth={2.5} />
              </div>
              <div>
                <p className="font-bold text-forest-900">NaKmetiji.si</p>
                <p className="text-sm text-earth-500">Turistične kmetije Slovenije</p>
              </div>
            </div>
            <blockquote className="text-forest-800 italic leading-relaxed text-lg">
              &ldquo;Vsaka kmetija ima svojo zgodbo. Naše poslanstvo je,
              da te zgodbe dosežejo prave poslušalce.&rdquo;
            </blockquote>
            <p className="mt-4 text-sm font-semibold text-forest-700">— Ekipa NaKmetiji</p>
          </div>
        </section>

        {/* ── Vrednote ── */}
        <section>
          <span className="text-xs font-bold uppercase tracking-widest text-forest-600 mb-3 block text-center">Naše vrednote</span>
          <h2 className="text-3xl font-extrabold text-forest-900 mb-10 text-center">
            Kar nas poganja
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {VREDNOTE.map((v) => (
              <div
                key={v.naslov}
                className="flex gap-5 p-6 rounded-2xl bg-white border border-earth-200/60 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-forest-50">
                  {v.icon}
                </div>
                <div>
                  <h3 className="font-bold text-forest-900 mb-2">{v.naslov}</h3>
                  <p className="text-sm text-earth-600 leading-relaxed">{v.opis}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Za kmetije ── */}
        <section className="rounded-3xl bg-forest-900 p-10 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-forest-400 blur-3xl" />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">
              Imate kmetijo?
            </h2>
            <p className="text-white/70 mb-8 max-w-lg mx-auto">
              Registracija je brezplačna. Dosežite tisoče gostov, ki iščejo
              pristno slovensko doživetje.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/registracija"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white text-forest-800 font-semibold px-7 py-3.5 text-sm shadow-lg hover:shadow-xl hover:scale-[1.03] active:scale-[0.98] transition-all"
              >
                Registrirajte kmetijo
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/kmetije"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 text-white font-semibold px-7 py-3.5 text-sm hover:bg-white/10 transition-colors"
              >
                Brskajte po kmetijah
              </Link>
            </div>
          </div>
        </section>

        {/* ── Kontakt ── */}
        <section className="text-center">
          <h2 className="text-2xl font-extrabold text-forest-900 mb-4">Pišite nam</h2>
          <p className="text-earth-600 mb-2">Za vprašanja, predloge ali sodelovanje:</p>
          <a
            href="mailto:info@nakmetiji.si"
            className="text-forest-700 font-semibold hover:text-forest-500 transition-colors text-lg"
          >
            info@nakmetiji.si
          </a>
        </section>

      </div>
    </div>
  );
}
