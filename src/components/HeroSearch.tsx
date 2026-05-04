"use client";

// =============================================================================
// NaKmetiji.si — HeroSearch v4
// Hero: single inviting trigger pill.
// Overlay: Jože-first discovery — primary AI input + secondary filters + road trip.
// =============================================================================

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, X, MapPin, Layers, CalendarDays, Route, Feather, Sparkles, ArrowRight, ChevronDown,
} from "lucide-react";
import { REGIJA_LABELS, REGIJE } from "@/types/database";
import { useOracleStore } from "@/lib/oracleStore";

const REGIJE_OPTIONS = REGIJE.map((value) => ({ value, label: REGIJA_LABELS[value] }));

export interface DozivetjeOption {
  id: string;
  ime: string;
  slug: string;
}

// ---------------------------------------------------------------------------
// Discovery Overlay — Jože-first
// ---------------------------------------------------------------------------

export function SearchOverlay({
  open,
  onClose,
  dozivetja,
}: {
  open: boolean;
  onClose: () => void;
  dozivetja: DozivetjeOption[];
}) {
  const router = useRouter();
  const openOracle = useOracleStore((s) => s.openOracle);

  const [aiQuery, setAiQuery] = useState("");
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [regija, setRegija] = useState<string>("");
  const [doz, setDoz] = useState<string>("");
  const [datum, setDatum] = useState<string>("");

  const aiInputRef = useRef<HTMLTextAreaElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Focus AI input when overlay opens
  useEffect(() => {
    if (open) setTimeout(() => aiInputRef.current?.focus(), 250);
  }, [open]);

  // Auto-resize AI textarea
  useEffect(() => {
    if (aiInputRef.current) {
      aiInputRef.current.style.height = "auto";
      aiInputRef.current.style.height = `${aiInputRef.current.scrollHeight}px`;
    }
  }, [aiQuery]);

  const handleAskJoze = useCallback(() => {
    const seed = aiQuery.trim();
    onClose();
    setTimeout(() => openOracle(seed || undefined), 150);
  }, [aiQuery, onClose, openOracle]);

  const handleAiKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAskJoze();
    }
  };

  function handleFilterSearch() {
    const params = new URLSearchParams();
    if (regija) params.set("regija", regija);
    if (doz) params.set("dozivetje", doz);
    if (datum) params.set("datum", datum);
    onClose();
    router.push(`/kmetije${params.toString() ? `?${params.toString()}` : ""}`);
  }

  // Quick-pick chips for inspiration
  const QUICK_SEEDS = [
    "Tih konec tedna z dobro kuhinjo",
    "Romantična kmetija z vinom",
    "Družina z otroki in živali",
    "Eko kmetija v gorah",
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="overlay-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-[60] bg-black/55 backdrop-blur-sm"
            aria-hidden="true"
            onClick={onClose}
          />

          <motion.div
            key="overlay-panel"
            initial={{ opacity: 0, y: -28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="fixed inset-x-4 top-[6vh] z-[61] mx-auto max-w-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Iskanje kmetij"
          >
            <div className="rounded-3xl bg-[#fdf9f2] shadow-[0_32px_80px_rgba(0,0,0,0.28)] overflow-hidden max-h-[88vh] flex flex-col">

              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-2 flex-shrink-0">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-forest-600/60 mb-0.5">
                    NaKmetiji.si
                  </p>
                  <h2 className="font-display text-xl font-black text-forest-900 tracking-tight leading-none">
                    Kako naj ti pomagam?
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-earth-100 hover:bg-earth-200 text-earth-600 hover:text-forest-800 transition-all"
                  aria-label="Zapri"
                >
                  <X size={17} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-6 pt-3">
                {/* ── PRIMARY: Ask Jože ── */}
                <div className="rounded-2xl bg-gradient-to-br from-amber-50 via-white to-amber-50/40 border border-amber-200/80 p-4 sm:p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/15 text-amber-700">
                      <Feather size={15} />
                    </span>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-700">Priporočeno</p>
                      <p className="font-display font-black text-forest-900 text-base leading-none mt-0.5">
                        Povej Jožetu, kakšno kmetijo iščeš
                      </p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-white border border-amber-200 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-200 px-3 py-2.5 transition-all">
                    <textarea
                      ref={aiInputRef}
                      value={aiQuery}
                      onChange={(e) => setAiQuery(e.target.value)}
                      onKeyDown={handleAiKey}
                      rows={2}
                      placeholder="Npr. tiha kmetija z vinom in zajtrkom za par, blizu Bleda, prvi vikend junija…"
                      className="w-full resize-none bg-transparent text-sm text-forest-900 placeholder:text-earth-400 focus:outline-none leading-relaxed max-h-32 overflow-y-auto"
                      style={{ scrollbarWidth: "none" }}
                    />
                  </div>

                  {/* Quick seed chips */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {QUICK_SEEDS.map((s) => (
                      <button
                        key={s}
                        onClick={() => setAiQuery(s)}
                        className="rounded-full bg-white hover:bg-amber-100 border border-amber-200/70 hover:border-amber-300 px-3 py-1 text-[11px] text-earth-700 hover:text-amber-800 font-medium transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleAskJoze}
                    className="mt-3 w-full flex items-center justify-center gap-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm py-3 shadow-md hover:shadow-lg transition-all"
                  >
                    <Sparkles size={15} />
                    {aiQuery.trim() ? "Vprašaj Jožeta" : "Začni pogovor z Jožetom"}
                    <ArrowRight size={14} />
                  </button>
                </div>

                {/* ── Secondary: Manual filters (collapsed by default) ── */}
                <button
                  onClick={() => setFiltersExpanded((v) => !v)}
                  className="w-full mt-4 flex items-center justify-between rounded-2xl bg-white border border-earth-200 hover:border-forest-300 px-4 py-3 transition-colors"
                >
                  <span className="flex items-center gap-2 text-sm font-bold text-forest-900">
                    <Search size={14} className="text-forest-600" />
                    Iskanje po filtrih
                    <span className="text-[10px] font-medium text-earth-500">(regija · doživetje · datum)</span>
                  </span>
                  <ChevronDown
                    size={15}
                    className={`text-earth-400 transition-transform ${(open && filtersExpanded) ? "rotate-180" : ""}`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {(open && filtersExpanded) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-2xl bg-white border border-earth-200 mt-2 p-4 space-y-3">
                        {/* Regija */}
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-[0.14em] text-forest-700/60 mb-1.5">
                            <MapPin size={11} className="inline -mt-0.5 mr-1" />
                            Regija
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              onClick={() => setRegija("")}
                              className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                                regija === "" ? "bg-forest-700 text-white" : "bg-earth-50 text-earth-700 hover:bg-earth-100"
                              }`}
                            >
                              Vse
                            </button>
                            {REGIJE_OPTIONS.map((r) => (
                              <button
                                key={r.value}
                                onClick={() => setRegija(r.value)}
                                className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                                  regija === r.value ? "bg-forest-700 text-white" : "bg-earth-50 text-earth-700 hover:bg-earth-100"
                                }`}
                              >
                                {r.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Doživetje */}
                        {dozivetja.length > 0 && (
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-[0.14em] text-forest-700/60 mb-1.5">
                              <Layers size={11} className="inline -mt-0.5 mr-1" />
                              Doživetje
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                onClick={() => setDoz("")}
                                className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                                  doz === "" ? "bg-forest-700 text-white" : "bg-earth-50 text-earth-700 hover:bg-earth-100"
                                }`}
                              >
                                Vse
                              </button>
                              {dozivetja.map((d) => (
                                <button
                                  key={d.id}
                                  onClick={() => setDoz(d.slug)}
                                  className={`rounded-full px-3 py-1 text-[11px] font-medium transition-colors ${
                                    doz === d.slug ? "bg-forest-700 text-white" : "bg-earth-50 text-earth-700 hover:bg-earth-100"
                                  }`}
                                >
                                  {d.ime}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Datum */}
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-[0.14em] text-forest-700/60 mb-1.5">
                            <CalendarDays size={11} className="inline -mt-0.5 mr-1" />
                            Datum (neobvezno)
                          </label>
                          <input
                            type="date"
                            value={datum}
                            onChange={(e) => setDatum(e.target.value)}
                            className="w-full rounded-xl border border-earth-200 bg-white px-3 py-2 text-sm text-forest-900 focus:outline-none focus:border-forest-400 focus:ring-2 focus:ring-forest-200"
                          />
                        </div>

                        <button
                          onClick={handleFilterSearch}
                          className="w-full flex items-center justify-center gap-2 rounded-xl bg-forest-700 hover:bg-forest-600 text-white font-bold text-sm py-2.5 shadow-sm transition-all"
                        >
                          <Search size={14} />
                          Prikaži kmetije
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ── Tertiary: Map search ── */}
                <Link
                  href="/zemljevid"
                  onClick={onClose}
                  className="group mt-4 flex items-center gap-3 rounded-2xl bg-white border border-sky-200/70 hover:border-sky-300 hover:bg-sky-50/50 p-4 transition-all"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 group-hover:bg-sky-200 transition-colors">
                    <MapPin size={17} className="text-sky-700" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-forest-900 text-sm">Iskanje po zemljevidu</p>
                    <p className="text-[11px] text-earth-600 mt-0.5 leading-snug">
                      Poišči kmetije po regiji — interaktivni zemljevid Slovenije.
                    </p>
                  </div>
                  <ArrowRight size={14} className="text-earth-400 group-hover:text-sky-700 group-hover:translate-x-0.5 transition-all" />
                </Link>

                {/* ── Quaternary: Road trip ── */}
                <Link
                  href="/pot"
                  onClick={onClose}
                  className="group mt-3 flex items-center gap-3 rounded-2xl bg-white border border-emerald-200/70 hover:border-emerald-300 hover:bg-emerald-50/50 p-4 transition-all"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 group-hover:bg-emerald-200 transition-colors">
                    <Route size={17} className="text-emerald-700" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-forest-900 text-sm">Načrtuj večdnevno pot</p>
                    <p className="text-[11px] text-earth-600 mt-0.5 leading-snug">
                      Več regij, več dni — sestavimo optimalen road trip s znamenitostmi.
                    </p>
                  </div>
                  <ArrowRight size={14} className="text-earth-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-all" />
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Main export — clean hero trigger
// ---------------------------------------------------------------------------
export function HeroSearch({ dozivetja = [] }: { dozivetja?: DozivetjeOption[] }) {
  const [overlayOpen, setOverlayOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = overlayOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [overlayOpen]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, delay: 0.35, ease: "easeOut" }}
        className="flex flex-col items-center gap-4"
      >
        <motion.button
          onClick={() => setOverlayOpen(true)}
          whileHover={{ scale: 1.025 }}
          whileTap={{ scale: 0.98 }}
          className="group relative flex items-center gap-3 rounded-full paper-search px-5 py-3.5 sm:px-7 sm:py-4 shadow-xl shadow-black/12 hover:shadow-2xl hover:shadow-black/18 transition-shadow duration-300"
          aria-label="Odpri iskanje"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-700 text-white flex-shrink-0 group-hover:bg-forest-600 transition-colors">
            <Search size={16} strokeWidth={2.5} />
          </div>

          <div className="text-left pr-2">
            <p className="text-sm font-bold text-forest-900 leading-none">Poiščite svojo kmetijo</p>
            <p className="text-xs text-earth-500 mt-0.5">Vprašaj Jožeta · Filtri · Road trip</p>
          </div>

          <motion.span
            className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-white shadow-sm"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            aria-hidden="true"
          >
            <Sparkles size={10} />
          </motion.span>
        </motion.button>

      </motion.div>

      <SearchOverlay
        open={overlayOpen}
        onClose={() => setOverlayOpen(false)}
        dozivetja={dozivetja}
      />
    </>
  );
}
