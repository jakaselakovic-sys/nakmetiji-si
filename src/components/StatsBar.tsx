"use client";

// =============================================================================
// NaKmetiji.si — StatsBar
// Statistična vrstica pod Hero sekcijo
// =============================================================================

import { motion } from "framer-motion";
import { MapPin, Star, TreePine, Users } from "lucide-react";

const STATS = [
  { icon: TreePine, value: "150+", label: "Kmetij", color: "text-forest-600" },
  { icon: MapPin, value: "12", label: "Regij", color: "text-forest-600" },
  { icon: Star, value: "4.7", label: "Povp. ocena", color: "text-gold-500" },
  { icon: Users, value: "10k+", label: "Zadovoljnih gostov", color: "text-forest-600" },
] as const;

export function StatsBar() {
  return (
    <section className="relative z-20 -mt-2 pb-12">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {STATS.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="glass-card rounded-2xl p-5 text-center flex flex-col items-center gap-2"
              >
                <Icon size={22} className={stat.color} strokeWidth={2} />
                <span className="text-2xl font-extrabold text-forest-900 tracking-tight">
                  {stat.value}
                </span>
                <span className="text-xs text-earth-500 font-medium">
                  {stat.label}
                </span>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
