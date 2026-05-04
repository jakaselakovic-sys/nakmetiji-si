"use client";

// =============================================================================
// NaKmetiji.si — HeroSpotlight
// Editorial split layout for Titan Elite farms: text on left, image on right.
// =============================================================================

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, MapPin, Star } from "lucide-react";
import type { Regija } from "@/types/database";
import { REGIJA_LABELS } from "@/types/database";

interface SpotlightFarm {
  id: string;
  slug: string;
  name: string;
  tagline?: string;
  region: string;
  coverImageUrl: string;
  rating: number | null;
}

export function HeroSpotlight({ farms }: { farms: SpotlightFarm[] }) {
  const [current, setCurrent] = useState(0);

  const advance = useCallback(() => {
    setCurrent((prev) => (prev + 1) % farms.length);
  }, [farms.length]);

  useEffect(() => {
    if (farms.length <= 1) return;
    const id = setInterval(advance, 7000);
    return () => clearInterval(id);
  }, [farms.length, advance]);

  if (farms.length === 0) return null;

  const farm = farms[current];

  return (
    <div className="relative w-full overflow-hidden" style={{ height: "clamp(420px, 55vh, 620px)" }}>
      {/* Full-bleed image — right ~60% */}
      <AnimatePresence mode="wait">
        <motion.div
          key={farm.id}
          initial={{ opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <Image
            src={farm.coverImageUrl}
            alt={farm.name}
            fill
            className="object-cover object-center"
            priority
          />
          {/* Gradient: dark from left ~55%, transparent on right */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(92deg, #0b160c 0%, #0b160c 32%, rgba(11,22,12,0.90) 48%, rgba(11,22,12,0.55) 62%, rgba(11,22,12,0.20) 78%, transparent 100%)",
            }}
          />
          {/* Bottom fade into section */}
          <div
            className="absolute inset-x-0 bottom-0 h-32 pointer-events-none"
            style={{ background: "linear-gradient(to bottom, transparent, #0b160c)" }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Text content — left side */}
      <div className="absolute left-0 top-0 bottom-0 w-full lg:w-[58%] flex flex-col justify-center px-8 md:px-14 lg:px-16 z-10">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 w-fit px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.22em] mb-6"
          style={{
            background: "rgba(212,175,55,0.12)",
            border: "1px solid rgba(212,175,55,0.45)",
            color: "rgba(212,175,55,0.95)",
          }}
        >
          <Star size={10} fill="rgba(212,175,55,0.95)" className="text-transparent" />
          Titan Elite
        </div>

        {/* Farm name */}
        <AnimatePresence mode="wait">
          <motion.h2
            key={`name-${farm.id}`}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.55, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="font-display font-bold text-white mb-4"
            style={{
              fontSize: "clamp(2.6rem, 4.5vw, 4.2rem)",
              lineHeight: 0.9,
              letterSpacing: "-0.02em",
            }}
          >
            {farm.name}
          </motion.h2>
        </AnimatePresence>

        {/* Meta row */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`meta-${farm.id}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.22 }}
            className="flex flex-wrap items-center gap-5 mb-6"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            <span className="flex items-center gap-1.5 text-sm">
              <MapPin size={13} />
              {REGIJA_LABELS[farm.region as Regija] ?? farm.region}
            </span>
            {farm.rating !== null && (
              <span
                className="flex items-center gap-1.5 text-sm"
                style={{ color: "rgba(212,175,55,0.85)" }}
              >
                <Star size={13} fill="rgba(212,175,55,0.85)" className="text-transparent" />
                {farm.rating.toFixed(1)} / 5
              </span>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Tagline */}
        {farm.tagline && (
          <AnimatePresence mode="wait">
            <motion.p
              key={`tag-${farm.id}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="text-base leading-relaxed max-w-sm mb-8 line-clamp-2"
              style={{ color: "rgba(255,255,255,0.48)" }}
            >
              {farm.tagline}
            </motion.p>
          </AnimatePresence>
        )}

        <Link
          href={`/kmetije/${farm.slug}`}
          className="inline-flex items-center gap-2 w-fit rounded-full px-6 py-3 text-sm font-bold bg-white text-forest-950 hover:bg-earth-50 hover:scale-[1.03] active:scale-[0.98] transition-all shadow-lg group"
        >
          Razišči kmetijo
          <ChevronRight size={15} className="group-hover:translate-x-1 transition-transform" />
        </Link>

        {/* Navigation dots — bottom left */}
        {farms.length > 1 && (
          <div className="flex items-center gap-2 mt-10">
            {farms.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrent(idx)}
                aria-label={`Prikaži kmetijo ${idx + 1}`}
                className="h-[2px] rounded-full transition-all duration-500"
                style={{
                  width: idx === current ? "40px" : "14px",
                  background: idx === current ? "rgba(212,175,55,0.9)" : "rgba(255,255,255,0.22)",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
