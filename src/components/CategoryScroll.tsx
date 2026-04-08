"use client";

// =============================================================================
// NaKmetiji.si — CategoryScroll
// Vodoravni scroll kategorij z ikonami na dnu Hero sekcije
// =============================================================================

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Wine,
  Bed,
  Users,
  ChefHat,
  Sparkles,
  Mountain,
  PawPrint,
  Hammer,
  Leaf,
  PartyPopper,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const CATEGORIES = [
  { slug: "vino", label: "Vino & Degustacija", icon: Wine, color: "from-purple-500/20 to-purple-600/20" },
  { slug: "prenocisce", label: "Prenočišče", icon: Bed, color: "from-blue-500/20 to-blue-600/20" },
  { slug: "druzine", label: "Za družine", icon: Users, color: "from-orange-500/20 to-orange-600/20" },
  { slug: "kulinarika", label: "Kulinarika", icon: ChefHat, color: "from-amber-500/20 to-amber-600/20" },
  { slug: "wellness", label: "Wellness", icon: Sparkles, color: "from-pink-500/20 to-pink-600/20" },
  { slug: "sport", label: "Šport & Avantura", icon: Mountain, color: "from-emerald-500/20 to-emerald-600/20" },
  { slug: "zivali", label: "Živali", icon: PawPrint, color: "from-yellow-500/20 to-yellow-600/20" },
  { slug: "delavnice", label: "Delavnice", icon: Hammer, color: "from-stone-500/20 to-stone-600/20" },
  { slug: "ekologija", label: "Ekološko", icon: Leaf, color: "from-lime-500/20 to-lime-600/20" },
  { slug: "prireditve", label: "Prireditve", icon: PartyPopper, color: "from-rose-500/20 to-rose-600/20" },
] as const;

export function CategoryScroll() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 240;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.9, ease: "easeOut" }}
      className="relative w-full max-w-5xl mx-auto mt-10"
    >
      {/* Scroll arrows */}
      <button
        onClick={() => scroll("left")}
        className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 hidden md:flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg border border-earth-200 text-forest-700 hover:bg-white hover:scale-110 transition-all"
        aria-label="Pomakni levo"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={() => scroll("right")}
        className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 hidden md:flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-lg border border-earth-200 text-forest-700 hover:bg-white hover:scale-110 transition-all"
        aria-label="Pomakni desno"
      >
        <ChevronRight size={20} />
      </button>

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 px-2 snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {CATEGORIES.map((cat, i) => {
          const Icon = cat.icon;
          return (
            <motion.button
              key={cat.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0 + i * 0.06, duration: 0.4 }}
              onClick={() =>
                router.push(`/kmetije?dozivetje=${cat.slug}`)
              }
              className="flex flex-col items-center gap-2.5 min-w-[100px] px-4 py-4 rounded-2xl bg-white/80 backdrop-blur-sm border border-white/50 shadow-sm hover:shadow-md hover:bg-white hover:-translate-y-1 hover:border-forest-200 transition-all duration-300 snap-start group"
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${cat.color} group-hover:scale-110 transition-transform duration-300`}
              >
                <Icon
                  size={22}
                  className="text-forest-700"
                  strokeWidth={1.8}
                />
              </div>
              <span className="text-xs font-semibold text-forest-800 whitespace-nowrap">
                {cat.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
