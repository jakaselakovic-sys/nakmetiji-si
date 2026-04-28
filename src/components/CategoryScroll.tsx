"use client";

// =============================================================================
// NaKmetiji.si — CategoryScroll (Handcrafted Luxury Redesign)
// Horizontal scroll of category cards with rich icons and warm gradients
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
  Trees,
  Tent,
  Leaf,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// Two-tone palette — forest for nature/farming categories, amber for
// hospitality/food/sensory categories. The 8 random colors on the previous
// version (purple/blue/orange/pink/teal …) were visual noise without any
// taxonomy. Two tones map naturally to the brand and let the eye scan.
const CATEGORIES = [
  { slug: "vino",       label: "Vino & Degustacija", icon: Wine,     tone: "amber"  },
  { slug: "prenocisce", label: "Prenočišče",          icon: Bed,      tone: "forest" },
  { slug: "druzine",    label: "Za družine",          icon: Users,    tone: "amber"  },
  { slug: "kulinarika", label: "Kulinarika",          icon: ChefHat,  tone: "amber"  },
  { slug: "wellness",   label: "Wellness",            icon: Sparkles, tone: "amber"  },
  { slug: "narava",     label: "Naravni parki",       icon: Trees,    tone: "forest" },
  { slug: "glamping",   label: "Glamping",            icon: Tent,     tone: "forest" },
  { slug: "ekologija",  label: "Ekološko",            icon: Leaf,     tone: "forest" },
] as const;

const TONE_STYLES = {
  forest: {
    bg: "bg-forest-50",
    iconColor: "text-forest-700",
    ring: "ring-forest-200/60",
  },
  amber: {
    bg: "bg-amber-50",
    iconColor: "text-amber-700",
    ring: "ring-amber-200/60",
  },
} as const;

const SPRING = { type: "spring" as const, stiffness: 120, damping: 18, mass: 0.8 };

export function CategoryScroll() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -280 : 280,
      behavior: "smooth",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={SPRING}
      className="relative w-full max-w-6xl mx-auto"
    >
      {/* Scroll arrows */}
      <button
        onClick={() => scroll("left")}
        className="absolute -left-5 top-1/2 -translate-y-1/2 z-10 hidden md:flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-lg shadow-earth-200/50 border border-earth-200/60 text-forest-700 hover:bg-forest-50 hover:scale-110 transition-all"
        aria-label="Pomakni levo"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        onClick={() => scroll("right")}
        className="absolute -right-5 top-1/2 -translate-y-1/2 z-10 hidden md:flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-lg shadow-earth-200/50 border border-earth-200/60 text-forest-700 hover:bg-forest-50 hover:scale-110 transition-all"
        aria-label="Pomakni desno"
      >
        <ChevronRight size={20} />
      </button>

      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-paper to-transparent z-[5] pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-paper to-transparent z-[5] pointer-events-none" />

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-3 px-1 snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {CATEGORIES.map((cat, i) => {
          const Icon = cat.icon;
          const styles = TONE_STYLES[cat.tone];
          return (
            <motion.button
              key={cat.slug}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, ...SPRING }}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push(`/kmetije?dozivetje=${cat.slug}`)}
              className={`flex flex-col items-center gap-3 min-w-[120px] px-5 py-5 bg-white border border-earth-200/50 shadow-sm hover:shadow-md hover:border-forest-200/60 transition-all duration-300 snap-start group ring-1 ${styles.ring}`}
              style={{ borderRadius: "38% 62% 52% 48% / 45% 55% 45% 55%" }}
            >
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${styles.bg} group-hover:scale-110 transition-transform duration-300`}>
                <Icon size={26} className={styles.iconColor} strokeWidth={1.8} />
              </div>
              <span className="text-[13px] font-semibold text-forest-800 whitespace-nowrap">
                {cat.label}
              </span>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
