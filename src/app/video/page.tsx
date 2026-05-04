// =============================================================================
// NaKmetiji.si — Video Produkcija
// Cinematic farm video production — pricing + order page
// =============================================================================

import type { Metadata } from "next";
import Link from "next/link";
import {
  Video, Check, Crown, Zap, Star, Sprout, ArrowRight, Mail,
} from "lucide-react";
import {
  PAKET_CONFIG, VIDEO_OSNOVNA_CENA, izracunajCenoVidea,
  type KmetijaPaket,
} from "@/types/database";
import { createSupabaseServer } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Cinematic Video Produkcija",
  description:
    `4K drone posnetki, profesionalna glasba, zgodba vaše kmetije v 90 sekundah. Osnovna cena ${VIDEO_OSNOVNA_CENA} €. Z Titan Elite paketom samo ${izracunajCenoVidea("titan_elite")} €.`,
};

const TIERS: KmetijaPaket[] = ["korenine", "avtenticnost", "posesek", "titan_elite"];

const TIER_ICONS = {
  korenine:     Sprout,
  avtenticnost: Star,
  posesek:      Zap,
  titan_elite:  Crown,
};

const VKLJUCENO = [
  { icon: "🎬", naslov: "4K Drone posnetki", opis: "Filmski posnetki iz zraka + talne perspektive" },
  { icon: "🎵", naslov: "Profesionalna glasba", opis: "Licencirana glasba, prilagojena vašemu vzdušju" },
  { icon: "✂️", naslov: "Profesionalna montaža", opis: "90-sekundni cinematic video, optimiran za splet" },
  { icon: "📱", naslov: "Vertikalna različica", opis: "Instagram Reels / TikTok format vključen" },
  { icon: "🌐", naslov: "Integracija na profil", opis: "Video se avtomatsko prikaže na vašem profilu" },
  { icon: "📁", naslov: "RAW datoteke", opis: "Vse RAW posnetke dobite v lastništvo" },
];

export default async function VideoPage() {
  const supabase = await createSupabaseServer();
  const { data: { session } } = await supabase.auth.getSession();
  
  let userPaket: KmetijaPaket | null = null;
  if (session?.user) {
    const { data: farm } = await supabase
      .from("kmetije")
      .select("paket")
      .eq("lastnik_id", session.user.id)
      .single();
    if (farm) {
      userPaket = farm.paket;
    }
  }

  const effectivePaket = userPaket ?? "korenine";
  const userCena = izracunajCenoVidea(effectivePaket);
  const isPremium = userPaket && userPaket !== "korenine";
  const userPrihranek = VIDEO_OSNOVNA_CENA - userCena;
  return (
    <div className="min-h-screen bg-paper">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative py-28 px-6 text-center bg-forest-950 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "url('/noise.png')", backgroundRepeat: "repeat" }} />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(212,168,83,0.12), transparent)" }} />

        <div className="relative z-10 mx-auto max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/15 text-amber-300 text-xs font-bold uppercase tracking-widest mb-6">
            <Video size={12} />
            Cinematic Video Produkcija
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
            Vaša kmetija v{" "}
            <span className="text-amber-400">90 sekundah</span>
          </h1>

          <p className="text-lg text-white/70 leading-relaxed max-w-2xl mx-auto mb-4">
            4K drone posnetki, profesionalna glasba, filmska montaža.
            En video, ki gostom pove tisto, kar besede ne morejo.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
            {isPremium ? (
              <>
                <div className="flex items-center gap-3">
                  <span className="text-white/40 text-sm line-through">{VIDEO_OSNOVNA_CENA} €</span>
                  <span className="text-4xl font-black text-amber-400">{userCena} €</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400 text-xs font-bold mt-2 sm:mt-0">
                  <Check size={14} /> Vaša cena z {PAKET_CONFIG[effectivePaket].label} paketom (prihranek {userPrihranek} €)
                </div>
              </>
            ) : (
              <>
                <span className="text-white/40 text-sm line-through">{VIDEO_OSNOVNA_CENA} €</span>
                <span className="text-4xl font-black text-amber-400">{izracunajCenoVidea("titan_elite")} €</span>
                <span className="text-white/50 text-sm">z Titan Elite</span>
              </>
            )}
          </div>

          <a
            href="mailto:info@nakmetiji.si?subject=Naročilo%20video%20produkcije"
            className="inline-flex items-center gap-2 px-8 py-4 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black rounded-xl transition-colors text-base"
          >
            <Mail size={16} />
            Naroči video zdaj
          </a>
        </div>
      </section>

      {/* ── What's included ──────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-display text-3xl font-black text-forest-950 text-center mb-12">
            Kaj je vključeno
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {VKLJUCENO.map(({ icon, naslov, opis }) => (
              <div key={naslov} className="bg-white rounded-2xl border border-earth-200 p-5 shadow-sm">
                <div className="text-3xl mb-3">{icon}</div>
                <h3 className="font-bold text-forest-900 mb-1">{naslov}</h3>
                <p className="text-sm text-earth-500">{opis}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing by tier ─────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-forest-50 border-y border-forest-100">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-black text-forest-950 mb-3">
              Cena glede na vaš paket
            </h2>
            <p className="text-earth-500 max-w-lg mx-auto">
              Osnovna cena je <strong>{VIDEO_OSNOVNA_CENA} €</strong>.
              Višji paket = večji popust. Z Titan Elite paketon privarčujete{" "}
              <strong>{VIDEO_OSNOVNA_CENA - izracunajCenoVidea("titan_elite")} €</strong>.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {TIERS.map((tier) => {
              const cfg = PAKET_CONFIG[tier];
              const Icon = TIER_ICONS[tier];
              const cena = izracunajCenoVidea(tier);
              const prihranek = VIDEO_OSNOVNA_CENA - cena;
              const isElite = tier === "titan_elite";

              return (
                <div
                  key={tier}
                  className={`rounded-2xl p-5 text-center ${
                    isElite
                      ? "bg-forest-950 ring-2 ring-amber-400 shadow-xl"
                      : "bg-white border border-earth-200"
                  }`}
                >
                  <div className="flex justify-center mb-2">
                    <Icon size={20} style={{ color: isElite ? "#d4a853" : cfg.barva }} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest mb-3"
                    style={{ color: isElite ? "#d4a853" : cfg.barva }}>
                    {cfg.label}
                  </p>
                  <p className={`text-2xl font-black mb-1 ${isElite ? "text-white" : "text-forest-950"}`}>
                    {cena} €
                  </p>
                  {prihranek > 0 ? (
                    <p className="text-xs font-bold text-green-500">
                      Prihranite {prihranek} €
                    </p>
                  ) : (
                    <p className={`text-xs ${isElite ? "text-white/40" : "text-earth-400"}`}>
                      Osnovna cena
                    </p>
                  )}
                  {cfg.video_popust > 0 && (
                    <div
                      className="mt-2 inline-block px-2 py-0.5 rounded-full text-[10px] font-bold"
                      style={{
                        background: isElite ? "rgba(212,168,83,0.2)" : `${cfg.barva}1a`,
                        color: isElite ? "#d4a853" : cfg.barva,
                      }}
                    >
                      –{Math.round(cfg.video_popust * 100)} % popust
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {userPaket ? (
            <p className="text-center text-sm text-forest-700 mt-6 font-semibold">
              Kot uporabnik paketa {PAKET_CONFIG[userPaket].label} imate do videa po ceni {izracunajCenoVidea(userPaket)} € dostop takoj.
            </p>
          ) : (
            <p className="text-center text-sm text-earth-400 mt-6">
              Nimate paketa? Z{" "}
              <Link href="/paketi" className="text-forest-700 underline decoration-dotted hover:text-forest-500">
                nadgradnjo paketa
              </Link>{" "}
              popust dobite takoj ob naslednji naročilnici.
            </p>
          )}
        </div>
      </section>

      {/* ── Process ─────────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display text-3xl font-black text-forest-950 text-center mb-12">
            Kako poteka produkcija
          </h2>
          <ol className="space-y-6">
            {[
              { n: 1, title: "Naročilo", desc: "Pošljete nam e-mail. V 24 urah se oglasite z datumom snemanja." },
              { n: 2, title: "Snemalni dan", desc: "Ekipa pride na lokacijo — jutro + dopoldne. Vse uredimo sami." },
              { n: 3, title: "Montaža", desc: "V 7–10 delovnih dneh dobite prvi osnutek v pregled." },
              { n: 4, title: "Odobritev", desc: "Dve brezplačni korekciji vključeni. Tretja korekcija + 50 €." },
              { n: 5, title: "Objava", desc: "Video naložimo na vaš profil in dostavimo RAW datoteke." },
            ].map(({ n, title, desc }) => (
              <li key={n} className="flex gap-5">
                <div className="flex-shrink-0 w-9 h-9 rounded-full bg-forest-600 text-white font-black text-sm flex items-center justify-center">
                  {n}
                </div>
                <div>
                  <h3 className="font-bold text-forest-900 mb-0.5">{title}</h3>
                  <p className="text-sm text-earth-500">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-forest-950 text-white text-center">
        <div className="mx-auto max-w-xl">
          <h2 className="font-display text-3xl font-black mb-4">
            Začnimo skupaj
          </h2>
          <p className="text-white/60 mb-8">
            Vsako leto pomagamo desetinam kmetij postati vidne.
            Vaša je naslednja.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:info@nakmetiji.si?subject=Naročilo%20video%20produkcije"
              className="inline-flex items-center gap-2 px-8 py-4 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black rounded-xl transition-colors"
            >
              <Mail size={16} />
              Naroči video
            </a>
            <Link
              href="/paketi"
              className="inline-flex items-center gap-2 px-8 py-4 border border-white/20 hover:border-white/40 text-white font-semibold rounded-xl transition-colors"
            >
              Poglej pakete
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
