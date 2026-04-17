"use client";

// =============================================================================
// NaKmetiji.si — QuickFilters (Handcrafted Luxury Redesign)
// Warm-toned filter pills on cream background
// =============================================================================

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

const QUICK_FILTERS = [
  { label: "Goriška Brda", param: "q=Goriška+Brda" },
  { label: "Vinski turizem", param: "dozivetje=vino" },
  { label: "Logarska dolina", param: "q=Logarska+dolina" },
  { label: "Ekološke kmetije", param: "dozivetje=ekologija" },
  { label: "S prenočiščem", param: "dozivetje=prenocisce" },
  { label: "Za družine", param: "dozivetje=druzine" },
  { label: "Kraška kulinarika", param: "regija=primorska&dozivetje=kulinarika" },
  { label: "Bovec & Soča", param: "q=Bovec" },
  { label: "Jeruzalem", param: "q=Jeruzalem" },
  { label: "Bled", param: "q=Bled" },
  { label: "Dolenjska", param: "regija=dolenjska" },
  { label: "Glamping", param: "dozivetje=glamping" },
] as const;

const SPRING = { type: "spring" as const, stiffness: 120, damping: 18, mass: 0.8 };

export function QuickFilters() {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="flex flex-wrap items-center justify-center gap-2 mt-2"
    >
      <span className="flex items-center gap-1.5 text-earth-500 text-xs font-semibold mr-1">
        <Sparkles size={13} className="text-gold-500" />
        Priljubljeno:
      </span>
      {QUICK_FILTERS.map((filter, i) => (
        <motion.button
          key={filter.label}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 + i * 0.03, ...SPRING }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => router.push(`/kmetije?${filter.param}`)}
          className="rounded-full bg-white border border-earth-200/60 px-3.5 py-1.5 text-[13px] font-medium text-forest-800 hover:bg-forest-50 hover:text-forest-700 hover:border-forest-300 shadow-sm shadow-earth-100/50 transition-all duration-200"
        >
          {filter.label}
        </motion.button>
      ))}
    </motion.div>
  );
}
