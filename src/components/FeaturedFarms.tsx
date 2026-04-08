"use client";

// =============================================================================
// NaKmetiji.si — FeaturedFarms
// Izpostavljene kmetije na domači strani
// =============================================================================

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FarmCard } from "@/components/FarmCard";
import { pridobiMockKmetijeSDozivetji } from "@/data/mock-data";
import { SectionHeader } from "@/components/ui";
import type { ExperienceTag } from "@/types";

const featured = pridobiMockKmetijeSDozivetji()
  .filter((k) => k.premium || k.ocena! >= 4.7)
  .slice(0, 6);

export function FeaturedFarms() {
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
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {featured.map((kmetija, i) => (
            <motion.div
              key={kmetija.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
            >
              <FarmCard
                farm={{
                  slug: kmetija.slug,
                  name: kmetija.ime,
                  tagline: kmetija.kratki_opis || undefined,
                  region: kmetija.regija,
                  coverImageUrl: kmetija.naslovna_slika,
                  experiencesOffered: kmetija.dozivetja.map(
                    (d) => d.slug
                  ) as ExperienceTag[],
                  rating: kmetija.ocena,
                  reviewCount: kmetija.stevilo_ocen,
                  isPremium: kmetija.premium,
                }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
