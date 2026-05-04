"use client";

// =============================================================================
// NaKmetiji.si — JozeConcierge (contextual inline)
// Unlike OracleConcierge (the global corner FAB), this component is placed
// inline at logical positions: below the hero search, in farm profile sidebars,
// or after booking CTAs. It appears/disappears with a spring animation tied
// to scroll visibility.
//
// Variants:
//   "hero"    — wide card below SearchWidget in HeroVideo
//   "sidebar" — compact pill for farm profile sidebars
//   "inline"  — mid-page card within content sections
// =============================================================================

import { useState } from "react";
import { motion } from "framer-motion";
import { Feather, Sparkles, ArrowRight } from "lucide-react";
import { useOracleStore } from "@/lib/oracleStore";

interface JozeConciergeProps {
  variant?: "hero" | "sidebar" | "inline";
  /** Pre-fill the oracle with this seed query on open */
  seed?: string;
  /** Context hint shown in the card subtitle */
  context?: string;
}

// Variant configurations
const CONFIG = {
  hero: {
    wrapper: "w-full max-w-xl mx-auto",
    card: `
      flex items-center gap-4 rounded-2xl p-4
      border border-white/15
    `,
    cardStyle: {
      background: "rgba(255,255,255,0.08)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
    } as React.CSSProperties,
    avatarSize: "w-11 h-11",
    textSize: "text-sm",
    subSize: "text-xs",
  },
  sidebar: {
    wrapper: "w-full",
    card: `
      flex items-center gap-3 rounded-2xl p-4
      bg-amber-50 border border-amber-200/70
      hover:border-amber-300 hover:bg-amber-100/60
    `,
    cardStyle: {} as React.CSSProperties,
    avatarSize: "w-10 h-10",
    textSize: "text-sm",
    subSize: "text-xs",
  },
  inline: {
    wrapper: "w-full max-w-2xl mx-auto",
    card: `
      flex items-center gap-4 rounded-2xl p-5
      bg-gradient-to-r from-amber-50 via-white to-amber-50/30
      border border-amber-200/80
    `,
    cardStyle: {} as React.CSSProperties,
    avatarSize: "w-12 h-12",
    textSize: "text-base",
    subSize: "text-sm",
  },
} as const;

// Quick suggestion chips — shown in sidebar & inline variants
const CHIPS = [
  "Kaj priporoča Jože?",
  "Katera kmetija je prava zame?",
  "Pokaži mi najboljše ocene",
];

export function JozeConcierge({ variant = "inline", seed, context }: JozeConciergeProps) {
  const openOracle = useOracleStore((s) => s.openOracle);
  const [showChips, setShowChips] = useState(false);

  const cfg = CONFIG[variant];
  const isHero = variant === "hero";
  const isLight = variant === "sidebar" || variant === "inline";

  function handleOpen(query?: string) {
    openOracle(query ?? seed ?? undefined);
  }

  return (
    <motion.div
      className={cfg.wrapper}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
    >
      <button
        onClick={() => (isLight ? setShowChips((v) => !v) : handleOpen())}
        className={`w-full text-left transition-all duration-250 cursor-pointer ${cfg.card}`}
        style={cfg.cardStyle}
        aria-expanded={showChips}
      >
        {/* Jože avatar — wax seal style */}
        <div
          className={`flex-shrink-0 ${cfg.avatarSize} rounded-full flex items-center justify-center shadow-md`}
          style={{
            background: isHero
              ? "linear-gradient(135deg, rgba(212,175,55,0.9), rgba(180,140,30,0.9))"
              : "linear-gradient(135deg, #f59e0b, #d97706)",
          }}
          aria-hidden="true"
        >
          <Feather
            size={isHero ? 18 : variant === "inline" ? 20 : 16}
            className={isHero ? "text-white" : "text-amber-100"}
          />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p
            className={`font-bold leading-snug ${cfg.textSize} ${
              isHero ? "text-white" : "text-forest-900"
            }`}
          >
            {context ?? "Jože vam poišče pravo kmetijo"}
          </p>
          <p
            className={`mt-0.5 ${cfg.subSize} ${
              isHero ? "text-white/60" : "text-amber-700/80"
            }`}
          >
            {isHero
              ? "Opišite svojo idealno izkušnjo v naravnem jeziku"
              : "AI svetovalec · Osebno prilagojena priporočila"}
          </p>
        </div>

        {/* CTA arrow */}
        {isHero ? (
          <motion.div
            className="flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-[#D4AF37]/80 text-[#2d1f00]"
            whileHover={{ scale: 1.1, x: 2 }}
          >
            <ArrowRight size={15} />
          </motion.div>
        ) : (
          <Sparkles
            size={16}
            className={`flex-shrink-0 transition-colors ${
              showChips ? "text-amber-600" : "text-amber-400"
            }`}
          />
        )}
      </button>

      {/* Expandable chip row — light variants only */}
      {isLight && showChips && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="overflow-hidden"
        >
          <div className="flex flex-wrap gap-2 pt-2 px-1">
            {CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => handleOpen(chip)}
                className="rounded-full bg-amber-100 hover:bg-amber-200 border border-amber-200 px-3 py-1.5 text-[11px] font-semibold text-amber-800 transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
