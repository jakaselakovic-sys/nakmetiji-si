"use client";

// =============================================================================
// NaKmetiji.si — FloatingCards
// Ilustrirani social proof kartice z glassmorphism — lebdijo ob hero sekciji
// =============================================================================

import { motion } from "framer-motion";
import Image from "next/image";
import { Star, Users, Clock, TrendingUp } from "lucide-react";

export function FloatingCards() {
  return (
    <div className="hidden xl:block">
      {/* ── Levo: Zadnja rezervacija ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: -50, y: 10 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: 1.4, duration: 0.8, ease: "easeOut" }}
        className="absolute left-[3%] 2xl:left-[6%] top-[48%] -translate-y-1/2 animate-float-gentle"
      >
        <div className="glass-illustrated p-5 shadow-xl max-w-[240px]">
          {/* Illustrated clock icon */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-forest-100/80">
              <Clock size={12} className="text-forest-600" />
            </div>
            <span className="text-[10px] font-bold text-forest-600 uppercase tracking-wider">
              Ravnokar rezervirano
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 rounded-2xl overflow-hidden flex-shrink-0 ring-2 ring-white/60 shadow-md">
              <Image
                src="/images/farms/kmetija-janezu.png"
                alt="Kmetija"
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
            <div>
              <p className="text-sm font-bold text-forest-900 leading-tight">
                Kmetija pr&apos; Janežu
              </p>
              <p className="text-[11px] text-earth-500 mt-0.5">
                pred 5 minutami
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Desno zgoraj: Ocena ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.6, duration: 0.8, ease: "easeOut" }}
        className="absolute right-[3%] 2xl:right-[6%] top-[40%] animate-float-slow"
        style={{ animationDelay: "0.5s" }}
      >
        <div className="glass-illustrated p-5 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-500 to-amber-600 shadow-lg">
              <Star size={24} className="text-white" fill="white" />
            </div>
            <div>
              <p className="text-3xl font-black text-forest-900 tracking-tight leading-none">
                4.8
              </p>
              <p className="text-xs text-earth-500 font-medium mt-1">
                Povprečna ocena
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Desno spodaj: Stats — 500+ kmetij + 10k gostov combined ── */}
      <motion.div
        initial={{ opacity: 0, x: 50, y: 20 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: 1.8, duration: 0.8, ease: "easeOut" }}
        className="absolute right-[5%] 2xl:right-[8%] top-[58%] animate-float-gentle"
        style={{ animationDelay: "1s" }}
      >
        <div className="glass-illustrated p-5 shadow-xl">
          {/* Row 1: Kmetije */}
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-100/80 text-forest-600">
              <TrendingUp size={18} />
            </div>
            <div>
              <p className="text-lg font-extrabold text-forest-900 leading-none">
                500+
              </p>
              <p className="text-[11px] text-earth-500">
                Kmetij po Sloveniji
              </p>
            </div>
          </div>
          {/* Divider */}
          <div className="h-px bg-forest-200/40 my-2" />
          {/* Row 2: Gostje */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-50/80 text-forest-600">
              <Users size={18} />
            </div>
            <div>
              <p className="text-lg font-extrabold text-forest-900 leading-none">
                10.000+
              </p>
              <p className="text-[11px] text-earth-500">
                Zadovoljnih gostov
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
