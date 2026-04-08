"use client";

// =============================================================================
// NaKmetiji.si — QuickFilters
// Hitri filtri pod iskalnikom: razširjene oznake za priljubljene destinacije
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

export function QuickFilters() {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }}
      className="flex flex-wrap items-center justify-center gap-2.5 mt-6 max-w-5xl mx-auto"
    >
      <span className="flex items-center gap-1.5 text-white/55 text-xs font-medium mr-1">
        <Sparkles size={14} />
        Priljubljeno:
      </span>
      {QUICK_FILTERS.map((filter, i) => (
        <motion.button
          key={filter.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 + i * 0.04, duration: 0.3 }}
          onClick={() => router.push(`/kmetije?${filter.param}`)}
          className="rounded-full bg-white/12 backdrop-blur-sm border border-white/18 px-4 py-2 text-sm font-medium text-white/85 hover:bg-white/22 hover:text-white hover:border-white/35 transition-all duration-300 hover:scale-105"
        >
          {filter.label}
        </motion.button>
      ))}
    </motion.div>
  );
}
