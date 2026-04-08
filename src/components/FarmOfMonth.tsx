"use client";

// =============================================================================
// NaKmetiji.si — FarmOfMonth (Kmetija Meseca)
// Ilustrirana kartica v spodnjem desnem kotu hero sekcije
// =============================================================================

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Award, ArrowRight } from "lucide-react";

export function FarmOfMonth() {
  return (
    <div className="hidden lg:block">
      <motion.div
        initial={{ opacity: 0, y: 40, x: 20 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        transition={{ delay: 2.2, duration: 0.9, ease: "easeOut" }}
        className="absolute bottom-[16%] right-[3%] 2xl:right-[5%] z-[15] animate-float-slow"
        style={{ animationDelay: "2s" }}
      >
        <Link
          href="/kmetije/kmetija-pr-janezu"
          className="group block"
        >
          <div className="glass-illustrated p-4 shadow-2xl max-w-[220px] transition-all duration-300 group-hover:shadow-3xl group-hover:scale-[1.03]">
            {/* Header badge */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-gold-500 to-amber-500 shadow-sm">
                <Award size={12} className="text-white" />
              </div>
              <span className="text-[10px] font-bold text-gold-600 uppercase tracking-wider">
                Kmetija meseca
              </span>
            </div>

            {/* Farm image */}
            <div className="relative h-28 w-full rounded-xl overflow-hidden mb-3 ring-1 ring-white/40 shadow-md">
              <Image
                src="/images/farms/kmetija-janezu.png"
                alt="Kmetija pr' Janežu"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                sizes="220px"
              />
              {/* Illustrated style overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-forest-900/30 to-transparent" />
            </div>

            {/* Farm info */}
            <p className="text-sm font-bold text-forest-900 leading-tight mb-1">
              Kmetija pr&apos; Janežu
            </p>
            <p className="text-[11px] text-earth-500 mb-2.5 leading-snug">
              Gorenjska idila z razgledom
            </p>

            {/* CTA */}
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-forest-600 group-hover:text-forest-700 transition-colors">
              <span>Oglej si</span>
              <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </Link>
      </motion.div>
    </div>
  );
}
