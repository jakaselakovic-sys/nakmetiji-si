"use client";

// =============================================================================
// NaKmetiji.si — KmetijeClient
// Grid kmetij s sidebar filtri in client-side filtriranjem mock podatkov
// =============================================================================

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
  Star,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Input, Button, Badge } from "@/components/ui";
import { FarmCard } from "@/components/FarmCard";
import {
  REGIJE,
  REGIJA_LABELS,
  type Regija,
  type KmetijaSDozivetji,
  type Dozivetje,
} from "@/types/database";

// ─── Konstante ──────────────────────────────────────────────────────────────

const SORT_OPTIONS = [
  { value: "ocena-desc", label: "Najbolje ocenjene" },
  { value: "ime-asc", label: "Po abecedi (A–Ž)" },
  { value: "ime-desc", label: "Po abecedi (Ž–A)" },
  { value: "najnovejse", label: "Najnovejše" },
];

// ─── Komponenta ─────────────────────────────────────────────────────────────

interface Props {
  initialKmetije: KmetijaSDozivetji[];
  dozivetja: Dozivetje[];
}

export function KmetijeClient({ initialKmetije, dozivetja }: Props) {
  // ── Vsi podatki iz Supabase (preneseni iz server component) ──
  const vseKmetije = initialKmetije;
  const vseDozivetja = dozivetja;

  // ── URL query params → začetno stanje filtrov ──
  const searchParams = useSearchParams();

  // ── View state ──
  const [view, setView] = useState<"grid" | "list">("grid");
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [showAllRegions, setShowAllRegions] = useState(false);

  // ── Filter state — inicializirano iz URL parametrov ──
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [selectedRegions, setSelectedRegions] = useState<Regija[]>(() => {
    const reg = searchParams.get("regija");
    return reg && reg in REGIJA_LABELS ? [reg as Regija] : [];
  });
  const [selectedExperiences, setSelectedExperiences] = useState<string[]>(() => {
    const doz = searchParams.get("dozivetje");
    return doz ? [doz] : [];
  });
  const [minRating, setMinRating] = useState<number>(0);
  const [sortMethod, setSortMethod] = useState("ocena-desc");

  // ── Client-side filtriranje v realnem času ──
  const filteredKmetije = useMemo(() => {
    let result = [...vseKmetije];

    // 1. Iskanje (ime, opis, občina)
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (k) =>
          k.ime.toLowerCase().includes(q) ||
          k.opis.toLowerCase().includes(q) ||
          (k.kratki_opis && k.kratki_opis.toLowerCase().includes(q)) ||
          (k.obcina && k.obcina.toLowerCase().includes(q))
      );
    }

    // 2. Regija filter
    if (selectedRegions.length > 0) {
      result = result.filter((k) => selectedRegions.includes(k.regija));
    }

    // 3. Doživetja filter (kmetija mora imeti vsaj eno od izbranih)
    if (selectedExperiences.length > 0) {
      result = result.filter((k) =>
        k.dozivetja.some((d) => selectedExperiences.includes(d.slug))
      );
    }

    // 4. Minimalna ocena
    if (minRating > 0) {
      result = result.filter((k) => k.ocena !== null && k.ocena >= minRating);
    }

    // 5. Sortiranje
    switch (sortMethod) {
      case "ocena-desc":
        result.sort((a, b) => (b.ocena ?? 0) - (a.ocena ?? 0));
        break;
      case "ime-asc":
        result.sort((a, b) => a.ime.localeCompare(b.ime, "sl"));
        break;
      case "ime-desc":
        result.sort((a, b) => b.ime.localeCompare(a.ime, "sl"));
        break;
      case "najnovejse":
        result.sort(
          (a, b) =>
            new Date(b.ustvarjeno).getTime() -
            new Date(a.ustvarjeno).getTime()
        );
        break;
    }

    return result;
  }, [vseKmetije, search, selectedRegions, selectedExperiences, minRating, sortMethod]);

  // ── Helpers ──
  const toggleRegion = (reg: Regija) => {
    setSelectedRegions((prev) =>
      prev.includes(reg) ? prev.filter((r) => r !== reg) : [...prev, reg]
    );
  };

  const toggleExperience = (slug: string) => {
    setSelectedExperiences((prev) =>
      prev.includes(slug) ? prev.filter((e) => e !== slug) : [...prev, slug]
    );
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedRegions([]);
    setSelectedExperiences([]);
    setMinRating(0);
  };

  const activeFiltersCount =
    selectedRegions.length +
    selectedExperiences.length +
    (minRating > 0 ? 1 : 0) +
    (search ? 1 : 0);

  // Koliko regij prikažemo (privzeto 6, ostale z "Prikaži več")
  const displayedRegions = showAllRegions ? REGIJE : REGIJE.slice(0, 6);

  // ── Računamo koliko kmetij je v vsaki regiji / doživetju ──
  const regionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const reg of REGIJE) {
      counts[reg] = vseKmetije.filter((k) => k.regija === reg).length;
    }
    return counts;
  }, [vseKmetije]);

  const experienceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const doz of vseDozivetja) {
      counts[doz.slug] = vseKmetije.filter((k) =>
        k.dozivetja.some((d) => d.slug === doz.slug)
      ).length;
    }
    return counts;
  }, [vseKmetije, vseDozivetja]);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto px-6 py-12 lg:px-8">
      {/* ════════════════════════════════════════════════════════════════════
          MOBILE FILTERS TOGGLE
          ════════════════════════════════════════════════════════════════════ */}
      <div className="lg:hidden flex items-center justify-between mb-2">
        <Button
          variant="outline"
          onClick={() => setIsMobileFiltersOpen(true)}
          className="gap-2"
        >
          <SlidersHorizontal size={18} />
          Filtri{" "}
          {activeFiltersCount > 0 && (
            <span className="bg-forest-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {activeFiltersCount}
            </span>
          )}
        </Button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setView("grid")}
            aria-label="Mrežni pogled"
            className={`p-2 rounded-lg transition-colors ${view === "grid" ? "bg-forest-100 text-forest-700" : "text-earth-500 hover:bg-earth-100"}`}
          >
            <LayoutGrid size={20} />
          </button>
          <button
            onClick={() => setView("list")}
            aria-label="Seznamski pogled"
            className={`p-2 rounded-lg transition-colors ${view === "list" ? "bg-forest-100 text-forest-700" : "text-earth-500 hover:bg-earth-100"}`}
          >
            <List size={20} />
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          SIDEBAR (FILTRI)
          ════════════════════════════════════════════════════════════════════ */}
      <aside
        className={`
          fixed inset-0 z-50 bg-cream p-6 overflow-y-auto transform transition-transform duration-300
          lg:relative lg:block lg:w-72 lg:flex-shrink-0 lg:p-0 lg:translate-x-0 lg:z-0 lg:bg-transparent lg:overflow-visible
          ${isMobileFiltersOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-forest-900">Filtri</h2>
          <button
            onClick={() => setIsMobileFiltersOpen(false)}
            aria-label="Zapri filtre"
            className="p-2 text-earth-500 hover:text-forest-800"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-8 bg-white lg:bg-white/80 lg:backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-earth-200/80 lg:sticky lg:top-28">
          {/* ── Sidebar header ── */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-forest-900 flex items-center gap-2">
              <SlidersHorizontal size={18} />
              Filtri
            </h2>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-sm text-forest-600 hover:text-forest-800 underline underline-offset-2"
              >
                Počisti vse
              </button>
            )}
          </div>

          {/* ── Iskanje ── */}
          <div>
            <label className="block text-sm font-semibold text-forest-800 mb-3">
              Iskanje
            </label>
            <Input
              icon={<Search size={16} />}
              placeholder="Ime kmetije, kraj..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* ── Regije (multi-select checkboxes) ── */}
          <div>
            <label className="block text-sm font-semibold text-forest-800 mb-3">
              Regija
            </label>
            <div className="space-y-1.5">
              {displayedRegions.map((reg) => (
                <label
                  key={reg}
                  className="flex items-center justify-between group cursor-pointer py-1 px-2 rounded-lg hover:bg-forest-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="rounded border-earth-300 text-forest-600 focus:ring-forest-500 w-4 h-4 transition-colors"
                      checked={selectedRegions.includes(reg)}
                      onChange={() => toggleRegion(reg)}
                    />
                    <span
                      className={`text-sm transition-colors ${selectedRegions.includes(reg) ? "text-forest-900 font-medium" : "text-earth-700 group-hover:text-forest-800"}`}
                    >
                      {REGIJA_LABELS[reg]}
                    </span>
                  </div>
                  <span className="text-xs text-earth-400 tabular-nums">
                    {regionCounts[reg] || 0}
                  </span>
                </label>
              ))}
            </div>
            {REGIJE.length > 6 && (
              <button
                onClick={() => setShowAllRegions(!showAllRegions)}
                className="mt-2 flex items-center gap-1 text-xs text-forest-600 hover:text-forest-800 font-medium transition-colors"
              >
                {showAllRegions ? (
                  <>
                    <ChevronUp size={14} /> Prikaži manj
                  </>
                ) : (
                  <>
                    <ChevronDown size={14} /> Prikaži vseh{" "}
                    {REGIJE.length}
                  </>
                )}
              </button>
            )}
          </div>

          {/* ── Doživetja (multi-select checkboxes) ── */}
          <div>
            <label className="block text-sm font-semibold text-forest-800 mb-3">
              Tip doživetja
            </label>
            <div className="space-y-1.5">
              {vseDozivetja.map((doz) => (
                <label
                  key={doz.id}
                  className="flex items-center justify-between group cursor-pointer py-1 px-2 rounded-lg hover:bg-forest-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      className="rounded border-earth-300 text-forest-600 focus:ring-forest-500 w-4 h-4 transition-colors"
                      checked={selectedExperiences.includes(doz.slug)}
                      onChange={() => toggleExperience(doz.slug)}
                    />
                    <span
                      className={`text-sm transition-colors ${selectedExperiences.includes(doz.slug) ? "text-forest-900 font-medium" : "text-earth-700 group-hover:text-forest-800"}`}
                    >
                      {doz.ime}
                    </span>
                  </div>
                  <span className="text-xs text-earth-400 tabular-nums">
                    {experienceCounts[doz.slug] || 0}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* ── Minimalna ocena ── */}
          <div>
            <label className="block text-sm font-semibold text-forest-800 mb-3">
              Minimalna ocena
            </label>
            <div className="flex items-center gap-2">
              {[4.5, 4.0, 3.0].map((rating) => (
                <button
                  key={rating}
                  onClick={() =>
                    setMinRating(minRating === rating ? 0 : rating)
                  }
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-all border ${
                    minRating === rating
                      ? "bg-forest-50 border-forest-300 text-forest-800 font-semibold"
                      : "bg-white border-earth-200 text-earth-600 hover:border-earth-300"
                  }`}
                >
                  {rating}+{" "}
                  <Star
                    size={14}
                    className={
                      minRating === rating
                        ? "fill-gold-500 text-gold-500"
                        : "text-earth-400"
                    }
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile apply button */}
        <div className="lg:hidden mt-8">
          <Button
            fullWidth
            onClick={() => setIsMobileFiltersOpen(false)}
          >
            Prikaži {filteredKmetije.length} rezultatov
          </Button>
        </div>
      </aside>

      {/* ════════════════════════════════════════════════════════════════════
          MAIN CONTENT (Grid)
          ════════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 min-w-0">
        {/* ── Usability bar ── */}
        <div className="hidden lg:flex items-center justify-between mb-8 pb-4 border-b border-earth-200">
          <div className="text-earth-600 font-medium">
            Najdenih{" "}
            <span className="text-forest-800 font-bold">
              {filteredKmetije.length}
            </span>{" "}
            kmetij
          </div>

          <div className="flex items-center gap-6">
            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-earth-500">Razvrsti po:</span>
              <select
                value={sortMethod}
                onChange={(e) => setSortMethod(e.target.value)}
                className="bg-transparent border-none text-forest-800 font-medium text-sm focus:ring-0 cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* View toggles */}
            <div className="flex items-center gap-1 bg-earth-100 p-1 rounded-lg">
              <button
                onClick={() => setView("grid")}
                className={`p-1.5 rounded-md transition-colors ${view === "grid" ? "bg-white text-forest-700 shadow-sm" : "text-earth-500 hover:text-forest-600"}`}
                aria-label="Mrežni pogled"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setView("list")}
                className={`p-1.5 rounded-md transition-colors ${view === "list" ? "bg-white text-forest-700 shadow-sm" : "text-earth-500 hover:text-forest-600"}`}
                aria-label="Seznamski pogled"
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Active filter badges ── */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {selectedRegions.map((reg) => (
              <Badge
                key={reg}
                variant="forest"
                className="pl-3 pr-2 py-1.5 flex items-center gap-1.5"
              >
                {REGIJA_LABELS[reg]}
                <button
                  onClick={() => toggleRegion(reg)}
                  className="text-forest-500 hover:text-forest-900 ml-1"
                >
                  <X size={14} />
                </button>
              </Badge>
            ))}
            {selectedExperiences.map((slug) => {
              const ime =
                vseDozivetja.find((d) => d.slug === slug)?.ime || slug;
              return (
                <Badge
                  key={slug}
                  variant="earth"
                  className="pl-3 pr-2 py-1.5 flex items-center gap-1.5"
                >
                  {ime}
                  <button
                    onClick={() => toggleExperience(slug)}
                    className="text-earth-500 hover:text-earth-900 ml-1"
                  >
                    <X size={14} />
                  </button>
                </Badge>
              );
            })}
            {minRating > 0 && (
              <Badge
                variant="outline"
                className="pl-3 pr-2 py-1.5 flex items-center gap-1.5"
              >
                Ocena {minRating}+
                <button
                  onClick={() => setMinRating(0)}
                  className="text-earth-500 hover:text-earth-900 ml-1"
                >
                  <X size={14} />
                </button>
              </Badge>
            )}
            {search && (
              <Badge
                variant="outline"
                className="pl-3 pr-2 py-1.5 flex items-center gap-1.5"
              >
                &quot;{search}&quot;
                <button
                  onClick={() => setSearch("")}
                  className="text-earth-500 hover:text-earth-900 ml-1"
                >
                  <X size={14} />
                </button>
              </Badge>
            )}
          </div>
        )}

        {/* ── Results grid / empty state ── */}
        {filteredKmetije.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-earth-200">
            <div className="mx-auto w-16 h-16 bg-earth-100 rounded-full flex items-center justify-center mb-4 text-earth-400">
              <Search size={28} />
            </div>
            <h3 className="text-xl font-bold text-forest-900 mb-2">
              Trenutno ni ujemanj
            </h3>
            <p className="text-earth-600 max-w-sm mx-auto mb-6">
              Žal nismo našli nobene kmetije, ki bi ustrezala vašim iskalnim
              pogojem. Poskusite zmehčati filtre.
            </p>
            <Button onClick={clearFilters} variant="secondary">
              Počisti filtre
            </Button>
          </div>
        ) : (
          <motion.div
            layout
            className={
              view === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                : "flex flex-col gap-6"
            }
          >
            <AnimatePresence mode="popLayout">
              {filteredKmetije.map((kmetija, i) => (
                <motion.div
                  key={kmetija.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                >
                  <FarmCard
                    priority={i < 3}
                    index={i}
                    farm={{
                      slug: kmetija.slug,
                      name: kmetija.ime,
                      tagline: kmetija.kratki_opis || undefined,
                      region: kmetija.regija,
                      coverImageUrl: kmetija.naslovna_slika,
                      experiencesOffered: kmetija.dozivetja.map(
                        (d) => d.slug
                      ) as unknown as import("@/types/farm").ExperienceTag[],
                      rating: kmetija.ocena,
                      reviewCount: kmetija.stevilo_ocen,
                      isPremium: kmetija.premium,
                    }}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </main>
    </div>
  );
}
