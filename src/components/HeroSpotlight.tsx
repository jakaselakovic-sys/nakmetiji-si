"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Star, MapPin } from "lucide-react";
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
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (farms.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % farms.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [farms.length]);

  if (farms.length === 0) return null;

  const farm = farms[currentIndex];

  return (
    <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl mb-16 bg-forest-900 h-[400px] md:h-[500px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={farm.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <Image
            src={farm.coverImageUrl}
            alt={farm.name}
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 flex flex-col justify-end p-8 md:p-12 z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/50 backdrop-blur-md text-amber-300 text-xs font-black uppercase tracking-widest w-fit mb-4">
          <Star size={12} className="fill-amber-300" />
          Titan Elite Izbor
        </div>
        
        <AnimatePresence mode="wait">
          <motion.div
            key={`text-${farm.id}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h2 className="text-4xl md:text-5xl font-display font-black text-white mb-2 leading-tight">
              {farm.name}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm md:text-base mb-6">
              <span className="flex items-center gap-1.5">
                <MapPin size={16} />
                {REGIJA_LABELS[farm.region as import("@/types/database").Regija] ?? farm.region}
              </span>
              {farm.rating && (
                <span className="flex items-center gap-1.5 text-amber-300">
                  <Star size={16} className="fill-amber-300" />
                  {farm.rating.toFixed(1)} / 5
                </span>
              )}
            </div>
            {farm.tagline && (
              <p className="text-white/90 text-lg max-w-2xl mb-8 leading-relaxed line-clamp-2">
                {farm.tagline}
              </p>
            )}
            <Link
              href={`/kmetije/${farm.slug}`}
              className="inline-flex items-center gap-2 bg-white text-forest-900 px-6 py-3 rounded-xl font-bold hover:bg-earth-50 hover:scale-105 transition-all shadow-lg group"
            >
              Razišči kmetijo
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress Indicators */}
      {farms.length > 1 && (
        <div className="absolute bottom-8 right-8 z-20 flex gap-2">
          {farms.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
              }`}
              aria-label={`Pokaži kmetijo ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
