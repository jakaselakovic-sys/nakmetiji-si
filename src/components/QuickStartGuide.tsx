"use client";

// =============================================================================
// NaKmetiji.si — Quick Start Guide
// First-visit inline card showing the four core ways to use the platform.
// Stored as dismissed in localStorage. Non-intrusive: lives on the home page
// between StatsBar and FeaturedFarms, not as a popup.
// =============================================================================

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Feather, Route, Stamp, ChevronRight, X, Sparkles } from "lucide-react";
import { useOracleStore } from "@/lib/oracleStore";

const STORAGE_KEY = "nakmetiji-quickstart-dismissed-v1";

interface Step {
  icon: React.ReactNode;
  number: string;
  title: string;
  description: string;
  href?: string;
  action?: () => void;
  accentClass: string;
}

export function QuickStartGuide() {
  const [visible, setVisible] = useState(false);
  const openOracle = useOracleStore((s) => s.openOracle);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      // Slight delay so the user sees the hero first
      const id = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(id);
    }
  }, []);

  function dismiss() {
    setVisible(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, "1");
    }
  }

  const steps: Step[] = [
    {
      number: "01",
      icon: <Search size={18} />,
      title: "Iskanje po regiji",
      description: "Klikni iskalno polje in izberi kraj, doživetje in datum.",
      href: "/kmetije",
      accentClass: "bg-forest-50 text-forest-700 border-forest-200",
    },
    {
      number: "02",
      icon: <Feather size={18} />,
      title: "Vprašaj Jožeta",
      description: "AI svetovalec — opiši svoje sanje, najde ti pravo kmetijo.",
      action: () => { dismiss(); openOracle(); },
      accentClass: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      number: "03",
      icon: <Route size={18} />,
      title: "Načrtuj večdnevno pot",
      description: "Jožetov road trip sestavi optimalno pot z znamenitostmi.",
      href: "/pot",
      accentClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      number: "04",
      icon: <Stamp size={18} />,
      title: "Zbiraj žige",
      description: "Vsak obisk = nov žig. 12 regij, 5 nivojev, realne nagrade.",
      href: "/green-passport",
      accentClass: "bg-rose-50 text-rose-700 border-rose-200",
    },
  ];

  return (
    <AnimatePresence>
      {visible && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10, height: 0, marginTop: 0, marginBottom: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="relative mx-auto max-w-7xl px-6 lg:px-8 mt-10 mb-2 overflow-hidden"
        >
          <div className="relative rounded-3xl bg-gradient-to-br from-white via-amber-50/40 to-emerald-50/40 border border-earth-200/60 shadow-sm p-6 sm:p-8">
            {/* Dismiss */}
            <button
              onClick={dismiss}
              className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 hover:bg-white text-earth-500 hover:text-forest-800 transition-all shadow-sm"
              aria-label="Skrij vodnik"
            >
              <X size={14} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={14} className="text-amber-600" />
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">
                Prvi obisk?
              </p>
            </div>
            <h2 className="font-display text-xl sm:text-2xl font-black text-forest-900 tracking-tight mb-1">
              Štirje načini, kako najti pravo kmetijo
            </h2>
            <p className="text-sm text-earth-600 mb-6 max-w-2xl">
              NaKmetiji ni samo seznam ponudnikov — poznaš lahko Slovenijo na štiri zelo različne načine.
            </p>

            {/* Steps grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {steps.map((step) => {
                const inner = (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`inline-flex items-center justify-center w-9 h-9 rounded-xl border ${step.accentClass}`}>
                        {step.icon}
                      </span>
                      <span className="text-[10px] font-bold text-earth-300 tracking-widest">
                        {step.number}
                      </span>
                    </div>
                    <p className="font-bold text-forest-900 text-sm leading-tight mb-1">
                      {step.title}
                    </p>
                    <p className="text-xs text-earth-600 leading-snug">
                      {step.description}
                    </p>
                    <div className="flex items-center gap-1 mt-3 text-[11px] font-bold text-forest-700 group-hover:text-amber-700 transition-colors">
                      Začni <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </>
                );

                const className = "group relative flex flex-col rounded-2xl bg-white border border-earth-200 hover:border-forest-300 hover:shadow-md hover:-translate-y-0.5 p-4 text-left transition-all duration-200";

                return step.href ? (
                  <Link key={step.number} href={step.href} onClick={dismiss} className={className}>
                    {inner}
                  </Link>
                ) : (
                  <button key={step.number} onClick={step.action} className={className}>
                    {inner}
                  </button>
                );
              })}
            </div>

            {/* Footer hint */}
            <p className="text-[11px] text-earth-500 mt-5 text-center">
              Ta vodnik ti pokažemo samo enkrat. Lahko ga zapreš zgoraj desno.
            </p>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
