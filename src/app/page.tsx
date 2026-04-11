// =============================================================================
// NaKmetiji.si — Home Page
//
// ARCHITECTURE: Three independent sections, each independently swappable.
//
// ┌─────────────────────────────────────────────────────────────────────────┐
// │  SECTION 1 — Scrollytelling Hero (Day-to-Night, 800vh, sticky)          │
// │    ScrollytellingWrapper: Framer Motion useScroll + useSpring            │
// │    4-layer image cross-fade: Mountains → Vineyards → River → Night       │
// │    Apple-style progress bar, dynamic subtitle, spring-smoothed scroll    │
// ├─────────────────────────────────────────────────────────────────────────┤
// │  SECTION 2 — Discovery Engine                                            │
// │    HeroSearch + QuickFilters + CategoryScroll (real Supabase data)       │
// │    FeaturedFarms (ISR-cached, revalidate: 60s)                           │
// │    FarmOfMonth (curated pick)                                            │
// ├─────────────────────────────────────────────────────────────────────────┤
// │  SECTION 3 — Mock Booking Demo CTA                                       │
// │    When MOCK_BOOKING=true  → MockBookingForm (no DB writes)              │
// │    When MOCK_BOOKING=false → Real RezervacijaForm (commercial mode)      │
// └─────────────────────────────────────────────────────────────────────────┘
//
// OracleConcierge (AI chat FAB) is mounted globally in layout.tsx.
// DemoBanner + DemoFooterStrip are also in layout.tsx.
//
// TO GO LIVE (commercial mode):
//   Set in .env.local or Vercel:
//     NEXT_PUBLIC_DEMO_MODE=false
//     NEXT_PUBLIC_MOCK_BOOKING=false
//     NEXT_PUBLIC_PAYMENTS_ENABLED=true
//   No code changes needed here.
// =============================================================================

import Link from "next/link";
import { Suspense } from "react";
import { ArrowRight, Leaf } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase/server";

// UI components
import { HeroSearch } from "@/components/HeroSearch";
import { QuickFilters } from "@/components/QuickFilters";
import { CategoryScroll } from "@/components/CategoryScroll";
import { FarmOfMonth } from "@/components/FarmOfMonth";
import { StatsBar } from "@/components/StatsBar";
import { FeaturedFarms } from "@/components/FeaturedFarms";
import { SkeletonCard } from "@/components/ui/Skeleton";

// Scrollytelling hero
import { ScrollytellingWrapper } from "@/components/ScrollytellingWrapper";

// Demo / booking — swap MockBookingForm for real RezervacijaForm in production
import { MockBookingForm } from "@/components/MockBookingForm";

// Feature flags
import { MOCK_BOOKING, DEMO_MODE } from "@/lib/config/demo";

export default async function HomePage() {
  const supabase = await createSupabaseServer();
  const { data: dozivetja } = await supabase
    .from("dozivetja")
    .select("id, ime, slug")
    .order("vrstni_red");

  return (
    <>
      {/* ════════════════════════════════════════════════════════════════════
          SECTION 1 — LIQUID SCROLLYTELLING HERO
          800vh sticky container. 4 background layers cross-fade as user
          scrolls through. Spring-smoothed with stiffness:50, damping:20.
          Images: bg-mountains → bg-vineyards → bg-river → bg-sheep-night
          ════════════════════════════════════════════════════════════════════ */}
      <ScrollytellingWrapper />

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 2 — DISCOVERY ENGINE
          Search, filters, categories, featured farms (ISR-cached 60s).
          ════════════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 w-full overflow-hidden bg-cream">
        {/* Subtle wood-grain texture overlay */}
        <div
          className="absolute inset-0 z-0 opacity-40 mix-blend-multiply bg-[url('/images/wood-texture.webp')] bg-repeat"
          style={{ backgroundSize: "400px" }}
          aria-hidden="true"
        />
        {/* Shadow transition from hero */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-forest-950/20 to-transparent z-10 pointer-events-none" />

        <div className="relative z-20">
          {/* Search + filters */}
          <div className="py-20 flex flex-col items-center gap-8 px-6 lg:px-8 max-w-7xl mx-auto">
            <div className="w-full max-w-5xl group/main">
              <HeroSearch dozivetja={dozivetja ?? []} />
              <div className="relative z-10 mt-6 hover:opacity-100 w-full transition-all duration-300 group-focus-within/main:opacity-40">
                <QuickFilters />
              </div>
            </div>
            <div className="w-full mt-4">
              <CategoryScroll />
            </div>
          </div>

          {/* Stats bar */}
          <StatsBar />

          {/* Featured farms — ISR cached, Suspense skeleton */}
          <Suspense
            fallback={
              <section className="py-20 px-6 lg:px-8 bg-cream">
                <div className="mx-auto max-w-7xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
                    {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                  </div>
                </div>
              </section>
            }
          >
            <FeaturedFarms />
          </Suspense>

          <FarmOfMonth />
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 3 — MOCK BOOKING DEMO
          Shows the booking UX in demo mode. In production this section would
          either be removed or replaced with a real booking entry point.

          MOCK_BOOKING=true  → MockBookingForm (zero DB writes, zero emails)
          MOCK_BOOKING=false → Replace MockBookingForm with real form
          ════════════════════════════════════════════════════════════════════ */}
      {MOCK_BOOKING && (
        <section className="bg-earth-100 border-t border-earth-200 py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold mb-4">
                ⚗️ Demo rezervacijski sistem
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-forest-900 mb-3">
                Preizkusite rezervacijski tok
              </h2>
              <p className="text-earth-600 max-w-lg mx-auto text-sm">
                Vnesite testne podatke in doživite celoten UX — od izbire datuma do lažne potrditve.
                Noben email ni poslan, nič ni shranjeno.
              </p>
            </div>

            <div className="max-w-sm mx-auto">
              {/* ── Commercial switch point ──────────────────────────────
                  In production, replace <MockBookingForm> with the real
                  <RezervacijaForm> component from the farm detail page.
                  Props are identical (kmetijaId, kmetijaIme, cenaNoc, maxGostov).
                  ──────────────────────────────────────────────────────── */}
              <MockBookingForm
                kmetijaId="demo-farm-homepage"
                kmetijaIme="Kmetija Pr' Planšar (Demo)"
                cenaNoc={75}
                maxGostov={6}
              />
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          SECTION 4 — GREEN PASSPORT CTA
          ════════════════════════════════════════════════════════════════════ */}
      <section className="bg-forest-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none" aria-hidden="true">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-forest-400 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-emerald-300 blur-3xl" />
        </div>
        <div className="relative z-10 mx-auto max-w-4xl px-6 py-20 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold mb-6">
            <Leaf size={12} /> Green Passport
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4 font-display">
            Zbiraj spomine po celi Sloveniji
          </h2>
          <p className="text-base text-white/60 max-w-lg mx-auto mb-8">
            Obiščite 12 regij, pridobite štampiljke in odklenite nagrade. Vsak obisk šteje.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/green-passport"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-semibold px-8 py-4 text-sm shadow-lg hover:shadow-xl hover:scale-[1.03] active:scale-[0.98] transition-all"
            >
              <Leaf size={18} /> Zeleni Potni List
            </Link>
            <Link
              href="/dodaj-kmetijo"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-4 text-sm border border-white/20 transition-all"
            >
              Dodajte svojo kmetijo
              <ArrowRight size={18} />
            </Link>
          </div>

          {/* Demo mode note */}
          {DEMO_MODE && (
            <p className="mt-8 text-xs text-white/30">
              ⚗️ Tehnološki demo — nobene storitve se ne zaračunavajo ·{" "}
              <Link href="/pogoji-demo" className="underline hover:text-white/50 transition-colors">
                Pogoji
              </Link>
            </p>
          )}
        </div>
      </section>
    </>
  );
}
