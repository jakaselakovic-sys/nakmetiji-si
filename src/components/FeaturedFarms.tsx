// =============================================================================
// NaKmetiji.si — FeaturedFarms
// Server Component: pridobi izpostavljene kmetije iz Supabase
// =============================================================================

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FarmCard } from "@/components/FarmCard";
import { createSupabaseServer } from "@/lib/supabase/server";
import { SectionHeader } from "@/components/ui";
import { REGIJA_LABELS, type Kmetija, type Dozivetje, type Regija } from "@/types/database";
import type { ExperienceTag } from "@/types";

interface KmetijaZDozivetji extends Kmetija {
  dozivetja: Dozivetje[];
}

export async function FeaturedFarms() {
  const supabase = await createSupabaseServer();

  const { data: rawFarms } = await supabase
    .from("kmetije")
    .select("*, kmetija_dozivetje(dozivetja(*))")
    .eq("aktivna", true)
    .order("premium", { ascending: false })
    .order("ocena", { ascending: false, nullsFirst: false })
    .limit(6);

  const kmetije: KmetijaZDozivetji[] = ((rawFarms as Record<string, unknown>[]) ?? []).map(
    (raw) => {
      const { kmetija_dozivetje, ...rest } = raw;
      return {
        ...(rest as unknown as Kmetija),
        dozivetja: Array.isArray(kmetija_dozivetje)
          ? (kmetija_dozivetje as Record<string, unknown>[])
              .filter((kd) => kd.dozivetja)
              .map((kd) => kd.dozivetja as Dozivetje)
          : [],
      };
    }
  );

  return (
    <section className="py-20 px-6 lg:px-8 bg-cream">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          overline="Izbrano za vas"
          title="Izpostavljene kmetije"
          description="Odkrijte najboljše turistične kmetije, ki so jih obiskovalci ocenili najvišje."
          action={
            <Link
              href="/kmetije"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest-700 hover:text-forest-500 transition-colors group"
            >
              Vse kmetije
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          }
        />

        {kmetije.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-earth-500">Kmalu bodo tukaj prikazane kmetije.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {kmetije.map((kmetija) => (
              <FarmCard
                key={kmetija.id}
                farm={{
                  slug: kmetija.slug,
                  name: kmetija.ime,
                  tagline: kmetija.kratki_opis || undefined,
                  region: REGIJA_LABELS[kmetija.regija as Regija] ?? kmetija.regija,
                  coverImageUrl: kmetija.naslovna_slika,
                  experiencesOffered: kmetija.dozivetja.map((d) => d.slug) as ExperienceTag[],
                  rating: kmetija.ocena,
                  reviewCount: kmetija.stevilo_ocen,
                  isPremium: kmetija.premium,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
