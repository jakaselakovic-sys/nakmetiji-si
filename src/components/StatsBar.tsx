"use client";

// =============================================================================
// NaKmetiji.si — StatsBar (Journal / Wood-badge)
// Each stat is a small wooden badge with tilt, washi tape, and a handwritten
// caption — laid out like entries in a nature journal instead of a sterile
// metric strip.
// =============================================================================

import { motion } from "framer-motion";
import { MapPin, Star, TreePine, Users } from "lucide-react";

const STATS = [
  { icon: TreePine, value: "150+", label: "Kmetij na karti",   tilt: "rotate-[-1.4deg]" },
  { icon: MapPin,   value: "12",   label: "Regij Slovenije",   tilt: "rotate-[0.8deg]"  },
  { icon: Star,     value: "4.7",  label: "Povprečna ocena",   tilt: "rotate-[-0.6deg]" },
  { icon: Users,    value: "10k+", label: "Zadovoljnih gostov",tilt: "rotate-[1.1deg]"  },
] as const;

const SPRING = { type: "spring" as const, stiffness: 120, damping: 18, mass: 0.8 };

export function StatsBar() {
  return (
    <section className="relative z-20 py-16 px-6">
      <div className="mx-auto max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={SPRING}
          className="grid grid-cols-2 md:grid-cols-4 gap-5 sm:gap-7"
        >
          {STATS.map((stat, i) => {
            const Icon = stat.icon;
            const showTape = i % 2 === 0;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 14, rotate: 0 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ rotate: 0, y: -4 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, ...SPRING }}
                className={`relative card-polaroid ${stat.tilt} bg-white`}
              >
                {showTape && <span className="tape-strip tape-strip-tl" aria-hidden="true" />}
                {!showTape && <span className="tape-strip tape-strip-tr" aria-hidden="true" />}

                {/* Icon on wood badge */}
                <div className="flex justify-center pt-2">
                  <div className="wood-badge h-14 w-14 rounded-full flex items-center justify-center">
                    <Icon size={22} className="text-white drop-shadow" strokeWidth={2.4} />
                  </div>
                </div>

                {/* Numerals */}
                <p className="mt-3 text-center font-display text-3xl sm:text-4xl font-black text-forest-900 tracking-tight leading-none">
                  {stat.value}
                </p>

                {/* Handwritten caption */}
                <p className="handwritten text-center text-forest-700 text-base sm:text-lg mt-1 px-2">
                  {stat.label}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
