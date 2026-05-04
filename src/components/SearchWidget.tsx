"use client";

// =============================================================================
// NaKmetiji.si — SearchWidget
// Boutique Luxe glass search bar — centered in HeroVideo or any dark section.
// Uses backdrop-filter: blur(12px) per spec. Opens the existing SearchOverlay
// (Jože AI + filters + map + road trip) on click.
// =============================================================================

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Sparkles, MapPin, Route } from "lucide-react";
import { SearchOverlay, type DozivetjeOption } from "./HeroSearch";

interface SearchWidgetProps {
  dozivetja?: DozivetjeOption[];
  /** Compact: shows just the pill. Full: shows pill + quick-pick badges below */
  variant?: "compact" | "full";
}

const QUICK_LINKS = [
  { label: "🍷 Vino & kulinarika", query: "vino" },
  { label: "🏔 Gorska kmetija", query: "gorenjska" },
  { label: "👨‍👩‍👧 Družinska kmetija", query: "druzine" },
  { label: "🌿 Eko bivanje", query: "ekologija" },
] as const;

export function SearchWidget({ dozivetja = [], variant = "full" }: SearchWidgetProps) {
  const [overlayOpen, setOverlayOpen] = useState(false);

  // Prevent body scroll when overlay is open
  useEffect(() => {
    document.body.style.overflow = overlayOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [overlayOpen]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.75, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="flex flex-col items-center gap-5 w-full px-4"
      >
        {/* ── Glass search pill ── */}
        <motion.button
          onClick={() => setOverlayOpen(true)}
          whileHover={{ scale: 1.018, y: -2 }}
          whileTap={{ scale: 0.984 }}
          transition={{ type: "spring", stiffness: 380, damping: 26 }}
          aria-label="Odpri iskanje"
          className="
            group relative flex items-center gap-4
            w-full max-w-xl
            rounded-2xl px-5 py-4
            border border-white/20
            shadow-[0_8px_40px_rgba(0,0,0,0.30),0_0_0_1px_rgba(255,255,255,0.06)]
            hover:shadow-[0_12px_60px_rgba(0,0,0,0.38),0_0_0_1px_rgba(255,255,255,0.10)]
            transition-shadow duration-400
          "
          style={{
            background: "rgba(255,255,255,0.10)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          {/* Search icon circle */}
          <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-xl bg-[#064E3B] text-white shadow-sm group-hover:bg-[#0a6b51] transition-colors">
            <Search size={16} strokeWidth={2.5} />
          </div>

          {/* Text */}
          <div className="flex-1 text-left">
            <p className="text-sm font-bold text-white leading-none">
              Poiščite svojo kmetijo
            </p>
            <p className="text-xs text-white/55 mt-0.5">
              Vprašaj Jožeta · Regija · Doživetje · Road trip
            </p>
          </div>

          {/* AI sparkle badge */}
          <motion.div
            className="flex-shrink-0 flex items-center gap-1.5 rounded-full bg-[#D4AF37]/90 px-3 py-1.5 text-[#2d1f00] shadow-sm"
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
          >
            <Sparkles size={11} />
            <span className="text-[10px] font-black uppercase tracking-wide">AI</span>
          </motion.div>
        </motion.button>

        {/* ── Quick-pick badges ── only in full variant */}
        {variant === "full" && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="flex flex-wrap justify-center gap-2"
          >
            {QUICK_LINKS.map((q) => (
              <button
                key={q.query}
                onClick={() => setOverlayOpen(true)}
                className="
                  rounded-full px-4 py-2 text-[11px] font-semibold text-white/80
                  border border-white/18 transition-all duration-250
                  hover:bg-white/15 hover:text-white hover:border-white/30
                "
                style={{
                  background: "rgba(255,255,255,0.07)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                }}
              >
                {q.label}
              </button>
            ))}

            {/* Map + Road trip quick links */}
            <a
              href="/zemljevid"
              className="
                rounded-full px-4 py-2 text-[11px] font-semibold text-white/80
                border border-white/18 inline-flex items-center gap-1.5 transition-all duration-250
                hover:bg-white/15 hover:text-white hover:border-white/30
              "
              style={{
                background: "rgba(255,255,255,0.07)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            >
              <MapPin size={11} /> Zemljevid
            </a>
            <a
              href="/pot"
              className="
                rounded-full px-4 py-2 text-[11px] font-semibold text-white/80
                border border-white/18 inline-flex items-center gap-1.5 transition-all duration-250
                hover:bg-white/15 hover:text-white hover:border-white/30
              "
              style={{
                background: "rgba(255,255,255,0.07)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            >
              <Route size={11} /> Road trip
            </a>
          </motion.div>
        )}
      </motion.div>

      <SearchOverlay
        open={overlayOpen}
        onClose={() => setOverlayOpen(false)}
        dozivetja={dozivetja}
      />
    </>
  );
}
