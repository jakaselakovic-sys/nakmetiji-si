// =============================================================================
// NaKmetiji.si — FeaturedFarms
// Server Component: pridobi izpostavljene kmetije iz Supabase
// =============================================================================

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FarmCard } from "@/components/FarmCard";
import { HeroSpotlight } from "@/components/HeroSpotlight";
import type { ExperienceTag } from "@/types";
import { getFeaturedFarmDTOs } from "@/lib/dal/farms";

export async function FeaturedFarms() {
  const kmetije = await getFeaturedFarmDTOs(9);

  let titanEliteFarms = kmetije
    .filter((k) => k.paket === "titan_elite")
    .map((k) => ({
      id: k.id,
      slug: k.slug,
      name: k.ime,
      tagline: k.kratki_opis ?? undefined,
      region: k.regija,
      coverImageUrl: k.naslovna_slika,
      rating: k.ocena,
    }));

  if (titanEliteFarms.length === 0 && kmetije.length > 0) {
    titanEliteFarms = kmetije.slice(0, 3).map((k) => ({
      id: k.id,
      slug: k.slug,
      name: k.ime,
      tagline: k.kratki_opis ?? undefined,
      region: k.regija,
      coverImageUrl: k.naslovna_slika,
      rating: k.ocena,
    }));
  }

  const regularFarms = kmetije.filter((k) => !titanEliteFarms.some(t => t.id === k.id));

  return (
    <section className="relative py-28 px-6 lg:px-8 overflow-hidden texture-topo">
      {/* Background — warm paper with topo lines */}
      <div className="absolute inset-0 bg-paper" style={{ opacity: 0.98 }} />

      {/* Decorative large background letter */}
      <div
        className="absolute -right-8 top-0 -translate-y-1/4 pointer-events-none select-none opacity-[0.03]"
        aria-hidden="true"
      >
        <span className="font-display text-[22rem] font-black text-forest-900 leading-none">K</span>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Section header — left-aligned, dramatic */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="max-w-xl">
            <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-forest-600 mb-5 flex items-center gap-2">
              <span className="inline-block w-6 h-px bg-forest-400" />
              Izbrano za vas
            </p>
            <h2 className="font-display text-5xl sm:text-6xl lg:text-7xl text-forest-900 leading-[0.92] tracking-tight">
              Izpostavljene<br />
              <em className="font-light" style={{ fontStyle: "italic" }}>kmetije</em>
            </h2>
            <p className="mt-5 text-earth-600 text-base leading-relaxed max-w-sm">
              Odkrijte najboljše turistične kmetije, ki so jih obiskovalci ocenili najvišje.
            </p>
          </div>
          <Link
            href="/kmetije"
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold border border-forest-200 text-forest-700 hover:bg-forest-50 hover:border-forest-300 transition-all self-start md:self-end flex-shrink-0"
          >
            Vse kmetije
            <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <HeroSpotlight farms={titanEliteFarms} />

        {regularFarms.length === 0 && titanEliteFarms.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-earth-500">Kmalu bodo tukaj prikazane kmetije.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {regularFarms.map((kmetija, i) => (
              <FarmCard
                key={kmetija.id}
                priority={i < 3}
                index={i}
                farm={{
                  slug: kmetija.slug,
                  name: kmetija.ime,
                  tagline: kmetija.kratki_opis || undefined,
                  region: kmetija.regija,
                  obcina: kmetija.obcina,
                  coverImageUrl: kmetija.naslovna_slika,
                  experiencesOffered: kmetija.dozivetja.map((d) => d.slug) as ExperienceTag[],
                  rating: kmetija.ocena,
                  reviewCount: kmetija.stevilo_ocen,
                  isPremium: kmetija.premium,
                  cenaNoc: kmetija.cena_noc,
                  paket: kmetija.paket,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
