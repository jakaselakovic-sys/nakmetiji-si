// =============================================================================
// NaKmetiji.si — Vendor CTA Strip
// Discreet but discoverable entry point for farm owners on the home page.
// Shown near the bottom, above the footer.
// =============================================================================

import Link from "next/link";
import { TreePine, ArrowRight, Sparkles, BarChart3, MessageCircle } from "lucide-react";

export function VendorCTAStrip() {
  return (
    <section className="relative px-6 lg:px-8 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="relative rounded-3xl bg-gradient-to-br from-forest-900 via-forest-800 to-emerald-900 text-white p-8 sm:p-12 overflow-hidden shadow-xl">
          {/* Glow effects */}
          <div aria-hidden className="absolute top-0 right-0 w-72 h-72 rounded-full bg-emerald-400/15 blur-3xl pointer-events-none" />
          <div aria-hidden className="absolute bottom-0 left-0 w-56 h-56 rounded-full bg-amber-400/10 blur-3xl pointer-events-none" />

          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left: pitch */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold mb-4">
                <TreePine size={12} /> Za lastnike kmetij
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-black tracking-tight mb-4 text-balance">
                Imaš kmetijo? <br className="hidden sm:block" />
                <span className="text-emerald-300">Pokaži jo svetu.</span>
              </h2>
              <p className="text-forest-100 text-base leading-relaxed mb-6 max-w-md">
                Brezplačno se pridruži NaKmetiji.si — predstavitev kmetije,
                rezervacijski sistem, AI orodja in zelena prepustnica za stalne goste.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/dodaj-kmetijo"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold shadow-lg transition-all hover:-translate-y-0.5"
                >
                  Dodaj svojo kmetijo <ArrowRight size={16} />
                </Link>
                <Link
                  href="/o-nas"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold border border-white/20 transition-all"
                >
                  Več o nas
                </Link>
              </div>
            </div>

            {/* Right: features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FeaturePill
                icon={<Sparkles size={16} className="text-amber-300" />}
                title="AI Orodja"
                description="Storyteller za opis, Apple-ify za fotografije, Price Advisor za cenik."
              />
              <FeaturePill
                icon={<MessageCircle size={16} className="text-emerald-300" />}
                title="Pametne rezervacije"
                description="Koledar zasedenosti, e-mail obvestila, iCal sinhronizacija."
              />
              <FeaturePill
                icon={<BarChart3 size={16} className="text-blue-300" />}
                title="Analitika obiskov"
                description="Spremljaj obiske profila, povpraševanja in rezervacije."
              />
              <FeaturePill
                icon={<TreePine size={16} className="text-forest-400" />}
                title="Green Passport"
                description="Tvoji gosti zbirajo žige — še en razlog, da se vrnejo."
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FeaturePill({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-2xl bg-white/8 backdrop-blur-sm border border-white/10 p-4">
      <div className="flex items-center gap-2 mb-1.5">
        {icon}
        <p className="text-sm font-bold text-white">{title}</p>
      </div>
      <p className="text-[12px] text-forest-200 leading-snug">{description}</p>
    </div>
  );
}
