// =============================================================================
// NaKmetiji.si — Home Page
// Hero z ilustriranim ozadjem, iskalnikom, floating karticami in animacijami
// =============================================================================

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, TreePine } from "lucide-react";
import { createSupabaseServer } from "@/lib/supabase/server";
import { HeroSearch } from "@/components/HeroSearch";
import { QuickFilters } from "@/components/QuickFilters";
import { CategoryScroll } from "@/components/CategoryScroll";
import { FeaturedFarms } from "@/components/FeaturedFarms";
import { StatsBar } from "@/components/StatsBar";
import { FloatingCards } from "@/components/FloatingCards";
import { AnimatedClouds } from "@/components/AnimatedClouds";
import { FarmOfMonth } from "@/components/FarmOfMonth";

export default async function HomePage() {
  const supabase = await createSupabaseServer();
  const { data: dozivetja } = await supabase
    .from("dozivetja")
    .select("id, ime, slug")
    .order("vrstni_red");

  return (
    <>
      {/* ════════════════════════════════════════════════════════════════════
          HERO SECTION — Illustrated style with animated clouds & fog
          ════════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[105vh] flex flex-col overflow-hidden">
        {/* ── Illustrated background (cartoon style) ── */}
        <div className="absolute inset-0 z-0">
          {/* HD illustrated landscape — 3840x2160 WebP */}
          <Image
            src="/images/hero-illustrated-hd.webp"
            alt="Slovensko podeželje — ilustracija z gorami in kmetijami"
            fill
            priority
            className="object-cover"
            style={{ objectPosition: "center 45%" }}
            sizes="100vw"
            quality={92}
          />
          {/* Soft gradient overlays for depth and text readability */}
          <div className="absolute inset-x-0 top-0 h-[40%] bg-gradient-to-b from-sky-100/25 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-forest-950/15 to-forest-950/45" style={{ top: "35%" }} />
        </div>

        {/* ── Animated clouds & fog (Layer 2) ── */}
        <AnimatedClouds />

        {/* ── Content (Layer 3) ── */}
        <div
          className="relative z-10 w-full px-6 lg:px-10 flex flex-col items-center text-center mt-auto"
          style={{ paddingTop: "25vh" }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md border border-white/20 px-5 py-2 text-xs font-semibold text-white mb-8 animate-fade-in shadow-lg">
            <TreePine size={14} />
            Odkrijte čar slovenskega podeželja
          </div>

          {/* ── Display title — large serif, commanding presence ── */}
          <div className="mb-10 max-w-6xl">
            <h1 className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-[7rem] xl:text-[8rem] font-black text-white tracking-tight leading-[1.02] mb-6 animate-fade-in-up text-shadow-hero">
              Najdite svojo
              <span className="block bg-gradient-to-r from-forest-200 via-lime-200 to-forest-300 bg-clip-text text-transparent mt-1" style={{ textShadow: "none" }}>
                popolno kmetijo
              </span>
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl text-white/85 max-w-3xl mx-auto leading-relaxed animate-fade-in-up delay-200 text-shadow-subtle">
              Turistične kmetije, vinska doživetja, kulinarika in nepozabne
              počitnice na najlepših kotičkih Slovenije.
            </p>
          </div>

          {/* ── Search bar — 60%+ width on desktop ── */}
          <div className="w-full max-w-6xl">
            <HeroSearch dozivetja={dozivetja ?? []} />
          </div>

          {/* ── Quick filters — expanded ── */}
          <QuickFilters />
        </div>

        {/* ── Floating social proof cards (desktop only) ── */}
        <FloatingCards />

        {/* ── Kmetija Meseca (desktop only) ── */}
        <FarmOfMonth />

        {/* ── Category dock ── */}
        <div className="relative z-20 mt-auto">
          <div className="absolute inset-0 bg-gradient-to-t from-cream/95 via-cream/70 to-transparent" />
          <div className="relative z-10 pb-6 pt-8">
            <CategoryScroll />
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          STATS BAR
          ════════════════════════════════════════════════════════════════════ */}
      <StatsBar />

      {/* ════════════════════════════════════════════════════════════════════
          FEATURED FARMS
          ════════════════════════════════════════════════════════════════════ */}
      <FeaturedFarms />

      {/* ════════════════════════════════════════════════════════════════════
          CTA SECTION
          ════════════════════════════════════════════════════════════════════ */}
      <section className="bg-forest-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-forest-400 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-forest-300 blur-3xl" />
        </div>
        <div className="relative z-10 mx-auto max-w-4xl px-6 py-20 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4 font-display">
            Imate kmetijo?
          </h2>
          <p className="text-base text-white/60 max-w-lg mx-auto mb-8">
            Pridružite se stotinam kmetij, ki že promovirajo svoje doživetja na
            NaKmetiji. Registracija je brezplačna.
          </p>
          <Link
            href="/dodaj-kmetijo"
            className="inline-flex items-center gap-2.5 rounded-xl bg-white text-forest-800 font-semibold px-8 py-4 text-sm shadow-lg hover:shadow-xl hover:scale-[1.03] active:scale-[0.98] transition-all duration-300"
          >
            Dodajte svojo kmetijo
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </>
  );
}
