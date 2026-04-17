"use client";

// =============================================================================
// NaKmetiji.si — StatsBar (Handcrafted Luxury Redesign)
// Elegant horizontal stats strip with subtle dividers
// =============================================================================

import { motion } from "framer-motion";
import { MapPin, Star, TreePine, Users } from "lucide-react";

const STATS = [
  { icon: TreePine, value: "150+", label: "Kmetij",           color: "text-forest-600", bg: "bg-forest-100" },
  { icon: MapPin,   value: "12",   label: "Regij",            color: "text-forest-600", bg: "bg-forest-100" },
  { icon: Star,     value: "4.7",  label: "Povprečna ocena",  color: "text-gold-500",   bg: "bg-amber-100" },
  { icon: Users,    value: "10k+", label: "Zadovoljnih gostov", color: "text-forest-600", bg: "bg-forest-100" },
] as const;

const SPRING = { type: "spring" as const, stiffness: 120, damping: 18, mass: 0.8 };

export function StatsBar() {
  return (
    <section className="relative z-20 py-10">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={SPRING}
          className="flex items-center justify-between rounded-3xl bg-white border border-earth-200/50 shadow-sm shadow-earth-200/30 px-4 py-4 sm:px-8 sm:py-5"
        >
          {STATS.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, ...SPRING }}
                className="flex items-center gap-3 sm:gap-4 relative"
              >
                {/* Divider between items (not before first) */}
                {i > 0 && (
                  <div className="absolute -left-3 sm:-left-5 top-1 bottom-1 w-px bg-earth-200/60" />
                )}

                <div className={`hidden sm:flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}>
                  <Icon size={18} className={stat.color} strokeWidth={2.2} />
                </div>

                <div className="text-center sm:text-left">
                  <p className="text-lg sm:text-xl font-extrabold text-forest-900 tracking-tight leading-none">
                    {stat.value}
                  </p>
                  <p className="text-[10px] sm:text-xs text-earth-500 font-medium mt-0.5">
                    {stat.label}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
