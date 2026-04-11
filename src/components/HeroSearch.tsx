"use client";

// =============================================================================
// NaKmetiji.si — HeroSearch
// Iskalnik v Hero sekciji: Kje + Kaj + Kdaj + Išči
// =============================================================================

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MapPin, Layers, CalendarDays, Search, X } from "lucide-react";
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

export function HeroSearch({ dozivetja = [] }: { dozivetja?: DozivetjeOption[] }) {
  const router = useRouter();
  const [kje, setKje] = useState("");
  const [kaj, setKaj] = useState("");
  const [kdaj, setKdaj] = useState("");
  const [showKjeDropdown, setShowKjeDropdown] = useState(false);
  const [showKajDropdown, setShowKajDropdown] = useState(false);
  const kjeRef = useRef<HTMLDivElement>(null);
  const kajRef = useRef<HTMLDivElement>(null);

  // Click-away logika
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (kjeRef.current && !kjeRef.current.contains(event.target as Node)) {
        setShowKjeDropdown(false);
      }
      if (kajRef.current && !kajRef.current.contains(event.target as Node)) {
        setShowKajDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredRegije = REGIJE_OPTIONS.filter((r) =>
    r.label.toLowerCase().includes(kje.toLowerCase())
  );

  const filteredDozivetja = dozivetja.filter((d) =>
    d.ime.toLowerCase().includes(kaj.toLowerCase())
  );

  const handleSearch = () => {
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
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.4, ease: "easeOut" }}
      className="w-full mx-auto"
    >
      {/* Dodan relative z-20 za Hero container in skupina za dimming */}
      <div className="glass relative z-20 rounded-2xl p-3 shadow-2xl shadow-black/15 transition-all duration-500 hover:shadow-[0_20px_60px_rgba(0,0,0,0.18)] hover:scale-[1.01]">
        <div className="flex flex-col md:flex-row group/search">
          {/* ── Kje ── */}
          <div ref={kjeRef} className="relative flex-1 opacity-100 transition-opacity duration-300 group-focus-within/search:opacity-40 focus-within:!opacity-100">
            <div className="flex items-center gap-3 px-5 py-4">
              <MapPin
                size={20}
                className="text-forest-600 flex-shrink-0"
                strokeWidth={2}
              />
              <div className="flex-1">
                <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-forest-800/60 mb-0.5">
                  Kje
                </label>
                <input
                  type="text"
                  placeholder="Gorenjska, Primorska..."
                  value={kje}
                  onChange={(e) => {
                    setKje(e.target.value);
                    setShowKjeDropdown(true);
                  }}
                  onFocus={() => setShowKjeDropdown(true)}
                  className="w-full bg-transparent text-sm text-forest-900 placeholder:text-earth-400 focus:outline-none"
                />
              </div>
              {kje && (
                <button
                  onClick={() => setKje("")}
                  aria-label="Počisti lokacijo"
                  className="text-earth-400 hover:text-earth-600 p-1"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {showKjeDropdown && filteredRegije.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-forest-50/95 backdrop-blur-md rounded-xl shadow-2xl border border-forest-200/60 max-h-48 overflow-y-auto">
                {filteredRegije.map((r) => (
                  <button
                    key={r.value}
                    className="w-full text-left px-5 py-2.5 text-sm text-forest-800 hover:bg-forest-100 transition-colors flex items-center gap-2"
                    onMouseDown={(e) => {
                      e.preventDefault(); 
                      setKje(r.label);
                      setShowKjeDropdown(false);
                    }}
                  >
                    <MapPin size={14} className="text-forest-500" />
                    {r.label}
                  </button>
                ))}
              </div>
            )}

            {/* Divider */}
            <div className="hidden md:block absolute right-0 top-3 bottom-3 w-px bg-earth-200" />
          </div>

          {/* ── Kaj ── */}
          <div ref={kajRef} className="relative flex-1 opacity-100 transition-opacity duration-300 group-focus-within/search:opacity-40 focus-within:!opacity-100">
            <div className="flex items-center gap-3 px-5 py-4">
              <Layers
                size={20}
                className="text-forest-600 flex-shrink-0"
                strokeWidth={2}
              />
              <div className="flex-1">
                <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-forest-800/60 mb-0.5">
                  Kaj
                </label>
                <input
                  type="text"
                  placeholder="Vino, Kulinarika..."
                  value={kaj}
                  onChange={(e) => {
                    setKaj(e.target.value);
                    setShowKajDropdown(true);
                  }}
                  onFocus={() => setShowKajDropdown(true)}
                  className="w-full bg-transparent text-sm text-forest-900 placeholder:text-earth-400 focus:outline-none"
                />
              </div>
              {kaj && (
                <button
                  onClick={() => setKaj("")}
                  aria-label="Počisti doživetje"
                  className="text-earth-400 hover:text-earth-600 p-1"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {showKajDropdown && filteredDozivetja.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-forest-50/95 backdrop-blur-md rounded-xl shadow-2xl border border-forest-200/60 max-h-48 overflow-y-auto">
                {filteredDozivetja.map((d) => (
                  <button
                    key={d.id}
                    className="w-full text-left px-5 py-2.5 text-sm text-forest-800 hover:bg-forest-100 transition-colors flex items-center gap-2"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setKaj(d.ime);
                      setShowKajDropdown(false);
                    }}
                  >
                    <Layers size={14} className="text-forest-500" />
                    {d.ime}
                  </button>
                ))}
              </div>
            )}

            <div className="hidden md:block absolute right-0 top-3 bottom-3 w-px bg-earth-200" />
          </div>

          {/* ── Kdaj ── */}
          <div className="relative flex-1 opacity-100 transition-opacity duration-300 group-focus-within/search:opacity-40 focus-within:!opacity-100">
            <div className="flex items-center gap-3 px-5 py-4">
              <CalendarDays
                size={20}
                className="text-forest-600 flex-shrink-0"
                strokeWidth={2}
              />
              <div className="flex-1">
                <label className="block text-[10px] font-bold uppercase tracking-[0.15em] text-forest-800/60 mb-0.5">
                  Kdaj
                </label>
                <input
                  type="date"
                  value={kdaj}
                  onChange={(e) => setKdaj(e.target.value)}
                  className="w-full bg-transparent text-sm text-forest-900 placeholder:text-earth-400 focus:outline-none"
                />
              </div>
              {kdaj && (
                <button
                  onClick={() => setKdaj("")}
                  aria-label="Počisti datum"
                  className="text-earth-400 hover:text-earth-600 p-1"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* ── Išči gumb ── */}
          <div className="p-2 md:pl-0 transition-opacity duration-300 group-focus-within/search:opacity-80">
            <button
              onClick={handleSearch}
              className="w-full md:w-auto flex items-center justify-center gap-2.5 rounded-2xl bg-forest-700 px-10 py-5 text-white font-bold text-base shadow-lg hover:bg-forest-600 hover:shadow-xl hover:scale-[1.03] active:scale-[0.98] transition-all duration-300"
            >
              <Search size={18} strokeWidth={2.5} />
              <span>Išči</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
