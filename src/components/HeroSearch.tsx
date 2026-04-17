"use client";

// =============================================================================
// NaKmetiji.si — HeroSearch
// Desktop: glassmorphism horizontal bar
// Mobile: Smart Trigger pill → AnimatePresence Bottom Sheet drawer
// =============================================================================

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Layers, CalendarDays, Search, X, SlidersHorizontal } from "lucide-react";
import { REGIJA_LABELS } from "@/types/database";

const REGIJE_OPTIONS = Object.entries(REGIJA_LABELS).map(([value, label]) => ({
  value,
  label,
}));

interface DozivetjeOption {
  id: string;
  ime: string;
  slug: string;
}

// ---------------------------------------------------------------------------
// Shared search field state hook
// ---------------------------------------------------------------------------
function useSearchState(dozivetja: DozivetjeOption[]) {
  const router = useRouter();
  const [kje, setKje] = useState("");
  const [kaj, setKaj] = useState("");
  const [kdaj, setKdaj] = useState("");
  const [showKjeDropdown, setShowKjeDropdown] = useState(false);
  const [showKajDropdown, setShowKajDropdown] = useState(false);

  const filteredRegije = REGIJE_OPTIONS.filter((r) =>
    r.label.toLowerCase().includes(kje.toLowerCase())
  );
  const filteredDozivetja = dozivetja.filter((d) =>
    d.ime.toLowerCase().includes(kaj.toLowerCase())
  );

  function handleSearch() {
    const params = new URLSearchParams();
    const matchedRegija = REGIJE_OPTIONS.find(
      (r) => r.label.toLowerCase() === kje.toLowerCase()
    );
    if (matchedRegija) params.set("regija", matchedRegija.value);
    const matchedDoz = dozivetja.find(
      (d) => d.ime.toLowerCase() === kaj.toLowerCase()
    );
    if (matchedDoz) params.set("dozivetje", matchedDoz.slug);
    if (kdaj) params.set("datum", kdaj);
    if (!matchedRegija && kje) params.set("q", kje);
    router.push(`/kmetije?${params.toString()}`);
  }

  return {
    kje, setKje, kaj, setKaj, kdaj, setKdaj,
    showKjeDropdown, setShowKjeDropdown,
    showKajDropdown, setShowKajDropdown,
    filteredRegije, filteredDozivetja,
    handleSearch,
  };
}

// ---------------------------------------------------------------------------
// Bottom sheet — mobile only
// Physics: stiffness 380 / damping 38 → fast snap with zero overshoot.
// Drag-to-dismiss: if dragged >100px down, close.
// ---------------------------------------------------------------------------
function MobileBottomSheet({
  open,
  onClose,
  dozivetja,
}: {
  open: boolean;
  onClose: () => void;
  dozivetja: DozivetjeOption[];
}) {
  const {
    kje, setKje, kaj, setKaj, kdaj, setKdaj,
    showKjeDropdown, setShowKjeDropdown,
    showKajDropdown, setShowKajDropdown,
    filteredRegije, filteredDozivetja,
    handleSearch,
  } = useSearchState(dozivetja);

  const kjeRef = useRef<HTMLDivElement>(null);
  const kajRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (kjeRef.current && !kjeRef.current.contains(event.target as Node))
        setShowKjeDropdown(false);
      if (kajRef.current && !kajRef.current.contains(event.target as Node))
        setShowKajDropdown(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setShowKjeDropdown, setShowKajDropdown]);

  function onSearch() {
    handleSearch();
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            key="sheet-drawer"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.15}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) onClose();
            }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-cream shadow-2xl"
            // touchAction must NOT be "none" on the whole drawer — that blocks
            // scrolling of dropdowns inside the sheet. Set it only on the drag
            // handle (the only element that should intercept vertical panning).
          >
            {/* Drag handle — only THIS element intercepts touch for dragging */}
            <div
              className="flex justify-center pt-4 pb-2"
              style={{ touchAction: "none" }}
            >
              <div className="h-1.5 w-12 rounded-full bg-earth-300" />
            </div>

            {/* pb accounts for iOS home-indicator (safe-area-inset-bottom) */}
            <div className="px-5 pt-2 pb-[max(40px,calc(env(safe-area-inset-bottom)+24px))]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-forest-900">Poiščite svoj košček miru</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-earth-100 transition-colors"
                  aria-label="Zapri"
                >
                  <X size={20} className="text-earth-500" />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {/* Kje */}
                <div ref={kjeRef} className="relative">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-forest-800/60 mb-1.5 ml-1">
                    Kje
                  </label>
                  <div className="flex items-center gap-3 rounded-2xl bg-white border border-earth-200 px-4 py-3.5 shadow-sm">
                    <MapPin size={18} className="text-forest-600 flex-shrink-0" strokeWidth={2} />
                    <input
                      type="text"
                      placeholder="Gorenjska, Primorska..."
                      value={kje}
                      onChange={(e) => { setKje(e.target.value); setShowKjeDropdown(true); }}
                      onFocus={() => setShowKjeDropdown(true)}
                      className="flex-1 bg-transparent text-sm text-forest-900 placeholder:text-earth-400 focus:outline-none"
                    />
                    {kje && (
                      <button onClick={() => setKje("")} className="text-earth-400 hover:text-earth-600" aria-label="Počisti">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <AnimatePresence>
                    {showKjeDropdown && filteredRegije.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute top-full left-0 right-0 z-10 mt-1 bg-white rounded-xl shadow-xl border border-earth-200 max-h-44 overflow-y-auto"
                      >
                        {filteredRegije.map((r) => (
                          <button
                            key={r.value}
                            className="w-full text-left px-4 py-2.5 text-sm text-forest-800 hover:bg-forest-50 transition-colors flex items-center gap-2"
                            onMouseDown={(e) => { e.preventDefault(); setKje(r.label); setShowKjeDropdown(false); }}
                          >
                            <MapPin size={13} className="text-forest-500" /> {r.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Kaj */}
                <div ref={kajRef} className="relative">
                  <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-forest-800/60 mb-1.5 ml-1">
                    Kaj
                  </label>
                  <div className="flex items-center gap-3 rounded-2xl bg-white border border-earth-200 px-4 py-3.5 shadow-sm">
                    <Layers size={18} className="text-forest-600 flex-shrink-0" strokeWidth={2} />
                    <input
                      type="text"
                      placeholder="Vino, Kulinarika..."
                      value={kaj}
                      onChange={(e) => { setKaj(e.target.value); setShowKajDropdown(true); }}
                      onFocus={() => setShowKajDropdown(true)}
                      className="flex-1 bg-transparent text-sm text-forest-900 placeholder:text-earth-400 focus:outline-none"
                    />
                    {kaj && (
                      <button onClick={() => setKaj("")} className="text-earth-400 hover:text-earth-600" aria-label="Počisti">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <AnimatePresence>
                    {showKajDropdown && filteredDozivetja.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="absolute top-full left-0 right-0 z-10 mt-1 bg-white rounded-xl shadow-xl border border-earth-200 max-h-44 overflow-y-auto"
                      >
                        {filteredDozivetja.map((d) => (
                          <button
                            key={d.id}
                            className="w-full text-left px-4 py-2.5 text-sm text-forest-800 hover:bg-forest-50 transition-colors flex items-center gap-2"
                            onMouseDown={(e) => { e.preventDefault(); setKaj(d.ime); setShowKajDropdown(false); }}
                          >
                            <Layers size={13} className="text-forest-500" /> {d.ime}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Kdaj */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-forest-800/60 mb-1.5 ml-1">
                    Kdaj
                  </label>
                  <div className="flex items-center gap-3 rounded-2xl bg-white border border-earth-200 px-4 py-3.5 shadow-sm">
                    <CalendarDays size={18} className="text-forest-600 flex-shrink-0" strokeWidth={2} />
                    <input
                      type="date"
                      value={kdaj}
                      onChange={(e) => setKdaj(e.target.value)}
                      className="flex-1 bg-transparent text-sm text-forest-900 focus:outline-none"
                    />
                    {kdaj && (
                      <button onClick={() => setKdaj("")} className="text-earth-400 hover:text-earth-600" aria-label="Počisti">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Search button */}
                <motion.button
                  onClick={onSearch}
                  whileTap={{ scale: 0.97 }}
                  className="mt-2 w-full flex items-center justify-center gap-2.5 rounded-3xl bg-forest-700 px-8 py-4 text-white font-bold text-base shadow-lg hover:bg-forest-600 transition-colors duration-200"
                >
                  <Search size={18} strokeWidth={2.5} />
                  Išči kmetije
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Desktop horizontal bar (unchanged logic, cleaner markup)
// ---------------------------------------------------------------------------
function DesktopSearchBar({ dozivetja }: { dozivetja: DozivetjeOption[] }) {
  const {
    kje, setKje, kaj, setKaj, kdaj, setKdaj,
    showKjeDropdown, setShowKjeDropdown,
    showKajDropdown, setShowKajDropdown,
    filteredRegije, filteredDozivetja,
    handleSearch,
  } = useSearchState(dozivetja);

  const kjeRef = useRef<HTMLDivElement>(null);
  const kajRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (kjeRef.current && !kjeRef.current.contains(event.target as Node))
        setShowKjeDropdown(false);
      if (kajRef.current && !kajRef.current.contains(event.target as Node))
        setShowKajDropdown(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setShowKjeDropdown, setShowKajDropdown]);

  return (
    <div className="paper-search relative z-20 p-3 shadow-2xl shadow-black/10 transition-all duration-500 hover:shadow-[0_20px_60px_rgba(45,90,39,0.12)] hover:scale-[1.005]">
      <div className="flex flex-row group/search">
        {/* Kje */}
        <div ref={kjeRef} className="relative flex-1 opacity-100 transition-opacity duration-300 group-focus-within/search:opacity-40 focus-within:!opacity-100">
          <div className="flex items-center gap-3 px-5 py-4">
            <MapPin size={20} className="text-forest-600 flex-shrink-0" strokeWidth={2} />
            <div className="flex-1">
              <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-forest-800/60 mb-0.5">Kje</label>
              <input
                type="text"
                placeholder="Gorenjska, Primorska..."
                value={kje}
                onChange={(e) => { setKje(e.target.value); setShowKjeDropdown(true); }}
                onFocus={() => setShowKjeDropdown(true)}
                className="w-full bg-transparent text-sm text-forest-900 placeholder:text-earth-400 focus:outline-none"
              />
            </div>
            {kje && (
              <button onClick={() => setKje("")} aria-label="Počisti lokacijo" className="text-earth-400 hover:text-earth-600 p-1">
                <X size={14} />
              </button>
            )}
          </div>
          {showKjeDropdown && filteredRegije.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-forest-50/95 backdrop-blur-md rounded-2xl shadow-2xl border border-forest-200/60 max-h-48 overflow-y-auto">
              {filteredRegije.map((r) => (
                <button
                  key={r.value}
                  className="w-full text-left px-5 py-2.5 text-sm text-forest-800 hover:bg-forest-100 transition-colors flex items-center gap-2"
                  onMouseDown={(e) => { e.preventDefault(); setKje(r.label); setShowKjeDropdown(false); }}
                >
                  <MapPin size={14} className="text-forest-500" /> {r.label}
                </button>
              ))}
            </div>
          )}
          <div className="absolute right-0 top-3 bottom-3 w-px bg-earth-200" />
        </div>

        {/* Kaj */}
        <div ref={kajRef} className="relative flex-1 opacity-100 transition-opacity duration-300 group-focus-within/search:opacity-40 focus-within:!opacity-100">
          <div className="flex items-center gap-3 px-5 py-4">
            <Layers size={20} className="text-forest-600 flex-shrink-0" strokeWidth={2} />
            <div className="flex-1">
              <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-forest-800/60 mb-0.5">Kaj</label>
              <input
                type="text"
                placeholder="Vino, Kulinarika..."
                value={kaj}
                onChange={(e) => { setKaj(e.target.value); setShowKajDropdown(true); }}
                onFocus={() => setShowKajDropdown(true)}
                className="w-full bg-transparent text-sm text-forest-900 placeholder:text-earth-400 focus:outline-none"
              />
            </div>
            {kaj && (
              <button onClick={() => setKaj("")} aria-label="Počisti doživetje" className="text-earth-400 hover:text-earth-600 p-1">
                <X size={14} />
              </button>
            )}
          </div>
          {showKajDropdown && filteredDozivetja.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-forest-50/95 backdrop-blur-md rounded-2xl shadow-2xl border border-forest-200/60 max-h-48 overflow-y-auto">
              {filteredDozivetja.map((d) => (
                <button
                  key={d.id}
                  className="w-full text-left px-5 py-2.5 text-sm text-forest-800 hover:bg-forest-100 transition-colors flex items-center gap-2"
                  onMouseDown={(e) => { e.preventDefault(); setKaj(d.ime); setShowKajDropdown(false); }}
                >
                  <Layers size={14} className="text-forest-500" /> {d.ime}
                </button>
              ))}
            </div>
          )}
          <div className="absolute right-0 top-3 bottom-3 w-px bg-earth-200" />
        </div>

        {/* Kdaj */}
        <div className="relative flex-1 opacity-100 transition-opacity duration-300 group-focus-within/search:opacity-40 focus-within:!opacity-100">
          <div className="flex items-center gap-3 px-5 py-4">
            <CalendarDays size={20} className="text-forest-600 flex-shrink-0" strokeWidth={2} />
            <div className="flex-1">
              <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-forest-800/60 mb-0.5">Kdaj</label>
              <input
                type="date"
                value={kdaj}
                onChange={(e) => setKdaj(e.target.value)}
                className="w-full bg-transparent text-sm text-forest-900 placeholder:text-earth-400 focus:outline-none"
              />
            </div>
            {kdaj && (
              <button onClick={() => setKdaj("")} aria-label="Počisti datum" className="text-earth-400 hover:text-earth-600 p-1">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Search button */}
        <div className="p-2 pl-0 transition-opacity duration-300 group-focus-within/search:opacity-80">
          <button
            onClick={handleSearch}
            className="w-full flex items-center justify-center gap-2.5 rounded-3xl bg-forest-700 px-10 py-5 text-white font-bold text-base shadow-lg hover:bg-forest-600 hover:shadow-xl hover:scale-[1.03] active:scale-[0.98] transition-all duration-300"
          >
            <Search size={18} strokeWidth={2.5} />
            <span>Poiščite pot</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main export — renders Smart Trigger on mobile, full bar on desktop
// ---------------------------------------------------------------------------
export function HeroSearch({ dozivetja = [] }: { dozivetja?: DozivetjeOption[] }) {
  const [sheetOpen, setSheetOpen] = useState(false);

  // Lock body scroll when sheet is open
  useEffect(() => {
    document.body.style.overflow = sheetOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sheetOpen]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
        className="w-full mx-auto"
      >
        {/* ── Mobile Smart Trigger (< 640px) ── */}
        <div className="sm:hidden">
          <motion.button
            onClick={() => setSheetOpen(true)}
            whileTap={{ scale: 0.97 }}
            className="w-full flex items-center gap-3 rounded-full paper-search px-5 py-4 shadow-xl shadow-black/10"
            aria-label="Odpri iskanje"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-700 text-white flex-shrink-0">
              <Search size={16} strokeWidth={2.5} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-forest-900">Kam vas kliče duša?</p>
              <p className="text-xs text-earth-500">Regija · Doživetje · Datum</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-earth-100 text-earth-600 flex-shrink-0">
              <SlidersHorizontal size={15} />
            </div>
          </motion.button>
        </div>

        {/* ── Desktop full bar (≥ 640px) ── */}
        <div className="hidden sm:block">
          <DesktopSearchBar dozivetja={dozivetja} />
        </div>
      </motion.div>

      {/* Bottom sheet — rendered outside motion wrapper so z-index works */}
      <MobileBottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        dozivetja={dozivetja}
      />
    </>
  );
}
