// =============================================================================
// NaKmetiji.si — FeaturedFarms
// Dark editorial section. Polaroid cards on deep-forest canvas with film grain.
// Layout: HeroSpotlight (Titan Elite, if any) → editorial feature grid.
// =============================================================================

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FarmCard } from "@/components/FarmCard";
import { HeroSpotlight } from "@/components/HeroSpotlight";
import type { ExperienceTag } from "@/types";
import { getFeaturedFarmDTOs } from "@/lib/dal/farms";

function toFarmCardData(k: Awaited<ReturnType<typeof getFeaturedFarmDTOs>>[number]) {
  return {
    slug: k.slug,
    name: k.ime,
    tagline: k.kratki_opis || undefined,
    region: k.regija,
    obcina: k.obcina,
    coverImageUrl: k.naslovna_slika,
    experiencesOffered: k.dozivetja.map((d) => d.slug) as ExperienceTag[],
    rating: k.ocena,
    reviewCount: k.stevilo_ocen,
    isPremium: k.premium,
    cenaNoc: k.cena_noc,
    paket: k.paket,
  };
}

export async function FeaturedFarms() {
  const kmetije = await getFeaturedFarmDTOs(9);

  const titanFarms = kmetije
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

  const regularFarms = kmetije.filter((k) => !titanFarms.some((t) => t.id === k.id));
  const [featureFarm, ...restFarms] = regularFarms;

  const isEmpty = kmetije.length === 0;

  return (
    <section className="relative overflow-hidden section-grain" style={{ background: "#0b160c" }}>
      {/* Grain layer (the section-grain::after pseudo-element) */}

      {/* Titan Elite Spotlight */}
      {titanFarms.length > 0 && <HeroSpotlight farms={titanFarms} />}

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8 py-24 lg:py-32">
        {/* Section header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 lg:mb-20">
          <div>
            <p className="section-overline mb-5" style={{ color: "rgba(110,231,183,0.55)" }}>
              Izbrano za vas
            </p>
            <h2
              className="font-display font-bold text-white leading-[0.88] tracking-tight"
              style={{ fontSize: "clamp(3rem, 6vw, 5.5rem)" }}
            >
              Izpostavljene
              <br />
              <em style={{ color: "rgba(212,175,55,0.92)", fontStyle: "italic", fontWeight: 300 }}>
                kmetije
              </em>
            </h2>
          </div>
          <Link
            href="/kmetije"
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all self-start md:self-end flex-shrink-0 hover:bg-white/10"
            style={{ border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.60)" }}
          >
            Vse kmetije
            <ArrowRight size={14} />
          </Link>
        </header>

        {isEmpty ? (
          <p className="text-center py-16" style={{ color: "rgba(255,255,255,0.35)" }}>
            Kmalu bodo tukaj prikazane kmetije.
          </p>
        ) : (
          <>
            {/* Editorial asymmetric grid — feature left + 2 stacked right */}
            {featureFarm && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-5">
                {/* Feature card — 3/5 width, landscape photo */}
                <div className="lg:col-span-3">
                  <FarmCard
                    priority
                    index={0}
                    canvas="dark"
                    featured
                    farm={toFarmCardData(featureFarm)}
                  />
                </div>

                {/* 2 stacked cards — 2/5 width */}
                <div className="lg:col-span-2 flex flex-col gap-5">
                  {restFarms[0] && (
                    <FarmCard index={1} canvas="dark" farm={toFarmCardData(restFarms[0])} />
                  )}
                  {restFarms[1] && (
                    <FarmCard index={2} canvas="dark" farm={toFarmCardData(restFarms[1])} />
                  )}
                </div>
              </div>
            )}

            {/* Remaining farms — standard 3-col grid */}
            {restFarms.length > 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {restFarms.slice(2).map((k, i) => (
                  <FarmCard key={k.id} index={i + 3} canvas="dark" farm={toFarmCardData(k)} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
