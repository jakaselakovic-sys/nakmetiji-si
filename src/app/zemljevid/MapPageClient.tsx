"use client";

// =============================================================================
// NaKmetiji.si — Map Page Client
// 3D Mapbox zemljevid s sidebar filtri, GPS, routing, vremenskim slojem
// =============================================================================

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { fetchWeather } from "@/lib/weather";
import Image from "next/image";
import dynamic from "next/dynamic";
import {
  MapPin,
  Navigation,
  Cloud,
  X,
  Star,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Loader2,
  Mountain,
  Landmark,
  Car,
  PersonStanding,
  Bike,
  Train,
  Bus,
  Route,
  RotateCcw,
  Leaf,
  Home,
  Search,
  Info,
  SlidersHorizontal,
} from "lucide-react";
import { MOCK_FARMS } from "@/data/mock-farms";
import { MOCK_ZNAMENITOSTI } from "@/data/mock-landmarks";
import {
  Region,
  REGION_LABELS,
  EXPERIENCE_LABELS,
} from "@/types";
import type { ExperienceTag } from "@/types";
import { ZNAMENITOST_IKONE } from "@/types/landmarks";
import { InfoCard } from "./InfoCard";
import type { MapboxMapHandle, RouteInfo } from "./MapboxMap";
import { WeatherWidget } from "@/components/WeatherWidget";

// ─── Lazy-load MapboxMap (needs window/WebGL) ──────────────────────────────

const MapboxMap = dynamic(
  () => import("./MapboxMap").then((m) => m.MapboxMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-earth-100">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <Mountain className="h-10 w-10 text-forest-400" />
          <span className="text-sm font-medium text-earth-500">Nalagam 3D zemljevid...</span>
        </div>
      </div>
    ),
  }
);

// ─── Experience icons ──────────────────────────────────────────────────────

const EXP_ICONS: Record<ExperienceTag, string> = {
  vino: "🍷",
  prenocisce: "🛏️",
  druzine: "👨‍👩‍👧‍👦",
  kulinarika: "🍽️",
  wellness: "🧖",
  sport: "🏔️",
  zivali: "🐄",
  delavnice: "🎨",
  ekologija: "🌿",
  prireditve: "🎉",
};

// ─── Haversine distance ────────────────────────────────────────────────────

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h > 0) return `${h} h ${m} min`;
  return `${m} min`;
}

function formatDistance(metres: number): string {
  if (metres >= 1000) return `${(metres / 1000).toFixed(1)} km`;
  return `${Math.round(metres)} m`;
}

// ─── Route profile config ──────────────────────────────────────────────────

type RouteProfileKey = "driving" | "walking" | "cycling";

const ROUTE_PROFILES: { key: RouteProfileKey; label: string; Icon: React.ElementType; color: string }[] = [
  { key: "driving", label: "Avto", Icon: Car, color: "text-forest-700" },
  { key: "walking", label: "Peš", Icon: PersonStanding, color: "text-amber-600" },
  { key: "cycling", label: "Kolo", Icon: Bike, color: "text-forest-600" },
];

// ═══════════════════════════════════════════════════════════════════════════

type SectionKey = "region" | "experience" | "landmark";

export function MapPageClient() {
  const mapRef = useRef<MapboxMapHandle>(null);
  const searchParams = useSearchParams();

  // ── State ─────────────────────────────────────────────────────────────
  const [selectedRegions, setSelectedRegions] = useState<Region[]>([]);
  const [selectedExperiences, setSelectedExperiences] = useState<ExperienceTag[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeFarmSlug, setActiveFarmSlug] = useState<string | null>(
    () => searchParams.get("kmetija")
  );
  const [hoveredFarmSlug, setHoveredFarmSlug] = useState<string | null>(null);
  const [selectedLandmarkId, setSelectedLandmarkId] = useState<string | null>(null);
  const [showWeather, setShowWeather] = useState(false);
  const [showWeatherPanel, setShowWeatherPanel] = useState(false);
  const [onlyGoodWeather, setOnlyGoodWeather] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [routeProfile, setRouteProfile] = useState<RouteProfileKey | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  // slug → true (good weather) | false (bad) | undefined (not fetched yet)
  const [farmWeatherGood, setFarmWeatherGood] = useState<Record<string, boolean>>({});

  // Sidebar UX
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    region: true,
    experience: false,
    landmark: false,
  });
  const [landmarksVisible, setLandmarksVisible] = useState(20);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);

  // Refs
  const farmRowRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const landmarkSentinelRef = useRef<HTMLDivElement>(null);

  // ── Debounce search input (150 ms) ────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setSearchQuery(searchInput.trim().toLowerCase()), 150);
    return () => clearTimeout(t);
  }, [searchInput]);

  // ── URL state sync ────────────────────────────────────────────────────
  // Mirror activeFarmSlug to ?kmetija= so sessions are shareable. We use
  // history.replaceState directly to avoid triggering a route-level rerender
  // (router.replace would reflow the whole page including the Mapbox canvas).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const current = url.searchParams.get("kmetija");
    if (activeFarmSlug === current) return;
    if (activeFarmSlug) {
      url.searchParams.set("kmetija", activeFarmSlug);
    } else {
      url.searchParams.delete("kmetija");
    }
    window.history.replaceState({}, "", url.toString());
  }, [activeFarmSlug]);

  // ── Pre-fetch weather for all farms when good-weather filter activated ─
  // Capped at 4 concurrent requests to avoid an Open-Meteo burst.
  useEffect(() => {
    if (!onlyGoodWeather) return;
    let cancelled = false;
    const farmsWithLocation = MOCK_FARMS.filter((f) => f.location);
    const CHUNK = 4;
    (async () => {
      for (let i = 0; i < farmsWithLocation.length; i += CHUNK) {
        if (cancelled) return;
        const chunk = farmsWithLocation.slice(i, i + CHUNK);
        await Promise.all(
          chunk.map(async (farm) => {
            if (!farm.location) return;
            const w = await fetchWeather(farm.location.latitude, farm.location.longitude);
            if (cancelled || !w) return;
            setFarmWeatherGood((prev) => ({ ...prev, [farm.slug]: w.current.isGood }));
          })
        );
      }
    })();
    return () => { cancelled = true; };
  }, [onlyGoodWeather]);

  // ── Memoized counts (compute once from MOCK_FARMS) ────────────────────
  const regionCounts = useMemo(() => {
    const out = {} as Record<Region, number>;
    for (const farm of MOCK_FARMS) {
      out[farm.region] = (out[farm.region] ?? 0) + 1;
    }
    return out;
  }, []);
  const experienceCounts = useMemo(() => {
    const out = {} as Record<ExperienceTag, number>;
    for (const farm of MOCK_FARMS) {
      for (const exp of farm.experiencesOffered) {
        out[exp] = (out[exp] ?? 0) + 1;
      }
    }
    return out;
  }, []);

  // ── Filtered + sorted farms ───────────────────────────────────────────
  const filteredFarms = useMemo(() => {
    return MOCK_FARMS.filter((farm) => {
      if (selectedRegions.length > 0 && !selectedRegions.includes(farm.region)) return false;
      if (
        selectedExperiences.length > 0 &&
        !selectedExperiences.some((exp) => farm.experiencesOffered.includes(exp))
      )
        return false;
      if (onlyGoodWeather && farmWeatherGood[farm.slug] === false) return false;
      if (searchQuery) {
        const hay = `${farm.name} ${REGION_LABELS[farm.region] ?? ""} ${farm.tagline ?? ""}`.toLowerCase();
        if (!hay.includes(searchQuery)) return false;
      }
      return true;
    });
  }, [selectedRegions, selectedExperiences, onlyGoodWeather, farmWeatherGood, searchQuery]);

  const sortedFarms = useMemo(() => {
    if (!userLocation) return filteredFarms;
    return [...filteredFarms].sort((a, b) => {
      const dA = a.location
        ? haversineKm(userLocation.lat, userLocation.lng, a.location.latitude, a.location.longitude)
        : Infinity;
      const dB = b.location
        ? haversineKm(userLocation.lat, userLocation.lng, b.location.latitude, b.location.longitude)
        : Infinity;
      return dA - dB;
    });
  }, [filteredFarms, userLocation]);

  // ── Auto-start routing when farm + GPS location both active ───────────
  useEffect(() => {
    if (activeFarmSlug && userLocation) {
      setRouteProfile((prev) => prev ?? "driving");
    } else {
      setRouteProfile(null);
      setRouteInfo(null);
    }
  }, [activeFarmSlug, userLocation]);

  // ── Scroll active farm row into view when marker is clicked ────────────
  useEffect(() => {
    if (!activeFarmSlug) return;
    const row = farmRowRefs.current[activeFarmSlug];
    row?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [activeFarmSlug]);

  // ── Landmark list — load more on scroll via IntersectionObserver ──────
  useEffect(() => {
    if (!openSections.landmark) return;
    if (landmarksVisible >= MOCK_ZNAMENITOSTI.length) return;
    const sentinel = landmarkSentinelRef.current;
    if (!sentinel) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) {
        setLandmarksVisible((v) => Math.min(v + 20, MOCK_ZNAMENITOSTI.length));
      }
    }, { rootMargin: "200px" });
    io.observe(sentinel);
    return () => io.disconnect();
  }, [landmarksVisible, openSections.landmark]);

  // ── Map ready flag — drives skeleton -> real list transition ──────────
  useEffect(() => {
    const t = setTimeout(() => setMapReady(true), 700);
    return () => clearTimeout(t);
  }, []);

  const visibleLandmarks = useMemo(
    () => MOCK_ZNAMENITOSTI.slice(0, landmarksVisible),
    [landmarksVisible]
  );

  // ── Helpers ───────────────────────────────────────────────────────────

  const toggleRegion = (region: Region) =>
    setSelectedRegions((p) => (p.includes(region) ? p.filter((r) => r !== region) : [...p, region]));
  const toggleExperience = (exp: ExperienceTag) =>
    setSelectedExperiences((p) => (p.includes(exp) ? p.filter((e) => e !== exp) : [...p, exp]));
  const toggleSection = (k: SectionKey) =>
    setOpenSections((p) => ({ ...p, [k]: !p[k] }));
  const clearAll = () => {
    setSelectedRegions([]);
    setSelectedExperiences([]);
    setOnlyGoodWeather(false);
    setShowWeather(false);
    setShowWeatherPanel(false);
    setSearchInput("");
  };

  const hasFilters =
    selectedRegions.length > 0 ||
    selectedExperiences.length > 0 ||
    onlyGoodWeather ||
    searchQuery.length > 0;

  const handleFarmClick = (slug: string) => {
    setActiveFarmSlug(slug);
    setSelectedLandmarkId(null);
    mapRef.current?.flyToFarm(slug);
    setMobileSheetOpen(false);
  };

  const handleGPS = () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setGpsLoading(false);
        mapRef.current?.flyToUser(loc.lng, loc.lat);
      },
      () => setGpsLoading(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleRouteUpdate = useCallback((info: RouteInfo | null) => {
    setRouteInfo(info);
  }, []);

  // ── Active items ──────────────────────────────────────────────────────
  const activeFarm = activeFarmSlug ? sortedFarms.find((f) => f.slug === activeFarmSlug) ?? null : null;
  const activeLandmark = selectedLandmarkId
    ? MOCK_ZNAMENITOSTI.find((z) => z.id === selectedLandmarkId) ?? null
    : null;

  // Active-filter chips shown on the floating bar above the map.
  const activeChips: { key: string; label: string; onRemove: () => void }[] = [
    ...selectedRegions.map((r) => ({
      key: `r-${r}`,
      label: REGION_LABELS[r] ?? r,
      onRemove: () => toggleRegion(r),
    })),
    ...selectedExperiences.map((e) => ({
      key: `e-${e}`,
      label: EXPERIENCE_LABELS[e] ?? e,
      onRemove: () => toggleExperience(e),
    })),
    ...(onlyGoodWeather
      ? [{ key: "weather", label: "Lepo vreme", onRemove: () => setOnlyGoodWeather(false) }]
      : []),
    ...(searchQuery
      ? [{ key: "search", label: `“${searchQuery}”`, onRemove: () => setSearchInput("") }]
      : []),
  ];

  // ── Google Maps transit links ─────────────────────────────────────────
  const getTransitLink = (mode: "transit" | "train") => {
    if (!userLocation || !activeFarm?.location) return null;
    const origin = `${userLocation.lat},${userLocation.lng}`;
    const dest = `${activeFarm.location.latitude},${activeFarm.location.longitude}`;
    if (mode === "transit") {
      return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=transit`;
    }
    return `https://www.slo-zeleznice.si/sl/potniki/vozni-red`;
  };

  // ═══════════════════════════════════════════════════════════════════════
  // Shared filter body — used in desktop sidebar AND mobile bottom-sheet
  // ═══════════════════════════════════════════════════════════════════════

  const FiltersBody = (
    <>
      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-400" />
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Išči kmetijo ali regijo…"
          className="w-full rounded-xl border border-earth-200 bg-white pl-9 pr-8 py-2 text-sm text-forest-900 placeholder:text-earth-400 focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-500"
        />
        {searchInput && (
          <button
            onClick={() => setSearchInput("")}
            aria-label="Počisti iskanje"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-earth-400 hover:text-earth-700 hover:bg-earth-100"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Region — collapsible */}
      <CollapsibleSection
        title="Regija"
        icon={<MapPin size={12} className="inline mr-1" />}
        count={selectedRegions.length}
        open={openSections.region}
        onToggle={() => toggleSection("region")}
      >
        <div className="flex flex-wrap gap-2">
          {Object.entries(REGION_LABELS).map(([key, label]) => {
            const region = key as Region;
            const active = selectedRegions.includes(region);
            const count = regionCounts[region] ?? 0;
            if (count === 0) return null;
            return (
              <button
                key={key}
                onClick={() => toggleRegion(region)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-all duration-200 border ${
                  active
                    ? "bg-forest-700 text-white border-forest-700 shadow-md shadow-forest-700/20"
                    : "bg-white text-earth-700 border-earth-200 hover:border-forest-300 hover:bg-forest-50"
                }`}
              >
                {label}
                <span className={`text-[10px] ${active ? "text-white/60" : "text-earth-400"}`}>{count}</span>
              </button>
            );
          })}
        </div>
      </CollapsibleSection>

      {/* Experience — collapsible */}
      <CollapsibleSection
        title="Doživetje"
        icon={<Star size={12} className="inline mr-1" />}
        count={selectedExperiences.length}
        open={openSections.experience}
        onToggle={() => toggleSection("experience")}
      >
        <div className="flex flex-col gap-1.5">
          {(Object.entries(EXPERIENCE_LABELS) as [ExperienceTag, string][]).map(([key, label]) => {
            const active = selectedExperiences.includes(key);
            const count = experienceCounts[key] ?? 0;
            return (
              <button
                key={key}
                onClick={() => toggleExperience(key)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-left transition-all duration-200 ${
                  active
                    ? "bg-forest-50 border border-forest-300 shadow-sm"
                    : "hover:bg-earth-50 border border-transparent"
                }`}
              >
                <span className="text-lg flex-shrink-0">{EXP_ICONS[key]}</span>
                <span className={`flex-1 text-sm font-medium ${active ? "text-forest-800" : "text-earth-700"}`}>
                  {label}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    active ? "bg-forest-200 text-forest-800" : "bg-earth-100 text-earth-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </CollapsibleSection>

      {/* Landmarks — collapsible + virtualized */}
      <CollapsibleSection
        title={`Znamenitosti (${MOCK_ZNAMENITOSTI.length})`}
        icon={<Landmark size={12} className="inline mr-1" />}
        open={openSections.landmark}
        onToggle={() => toggleSection("landmark")}
      >
        <div className="space-y-1.5">
          {visibleLandmarks.map((z) => (
            <button
              key={z.id}
              onClick={() => {
                setSelectedLandmarkId(z.id);
                setActiveFarmSlug(null);
                setMobileSheetOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-left transition-all ${
                selectedLandmarkId === z.id
                  ? "bg-forest-50 border border-forest-300"
                  : "hover:bg-earth-50 border border-transparent"
              }`}
            >
              <span className="text-lg">{ZNAMENITOST_IKONE[z.kategorija]}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-forest-900 truncate">{z.ime}</p>
                <p className="text-[11px] text-earth-500 truncate">{z.opis}</p>
              </div>
            </button>
          ))}
          {landmarksVisible < MOCK_ZNAMENITOSTI.length && (
            <div ref={landmarkSentinelRef} className="h-6 flex items-center justify-center">
              <Loader2 size={14} className="animate-spin text-earth-400" />
            </div>
          )}
        </div>
      </CollapsibleSection>
    </>
  );

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className="flex h-[calc(100dvh-0px)] pt-[60px]">
      {/* ── SIDEBAR (desktop only) ─────────────────────────────────────── */}
      <aside
        className={`relative z-20 flex-col bg-white border-r border-earth-200/60 transition-all duration-500 ease-in-out overflow-hidden hidden lg:flex ${
          sidebarOpen ? "w-[340px] min-w-[340px] opacity-100" : "w-0 min-w-0 opacity-0"
        }`}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6 pt-5 pb-4 border-b border-earth-200/60 bg-gradient-to-b from-earth-50/50 to-transparent">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-[18px] font-bold text-forest-900 flex items-center gap-2 tracking-tight">
              <Mountain className="h-4 w-4 text-forest-600" />
              3D Zemljevid
            </h1>
            {hasFilters && (
              <button onClick={clearAll} className="text-xs font-medium text-forest-600 hover:text-forest-800 transition-colors">
                Počisti vse
              </button>
            )}
          </div>
          <p className="text-sm text-earth-500">
            {sortedFarms.length}{" "}
            {sortedFarms.length === 1 ? "kmetija" : sortedFarms.length === 2 ? "kmetiji" : sortedFarms.length <= 4 ? "kmetije" : "kmetij"}{" "}
            {hasFilters ? "najdenih" : "na zemljevidu"}
          </p>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={handleGPS}
              disabled={gpsLoading}
              className="flex items-center gap-1.5 rounded-xl bg-forest-50 border border-forest-200/70 px-3 py-2 text-[12px] font-semibold text-forest-700 hover:bg-forest-100 transition-colors disabled:opacity-50"
            >
              {gpsLoading ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />}
              {userLocation ? "Lokacija aktivna" : "V moji bližini"}
            </button>
            <button
              onClick={() => {
                setShowWeatherPanel(!showWeatherPanel);
                if (!showWeatherPanel) setShowWeather(true);
              }}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-[12px] font-semibold transition-colors ${
                showWeather || showWeatherPanel
                  ? "bg-blue-50 border-blue-200 text-blue-700"
                  : "bg-earth-50 border-earth-200 text-earth-600 hover:bg-earth-100"
              }`}
            >
              <Cloud size={14} />
              {showWeather ? "Vreme ✓" : "Vreme"}
            </button>
          </div>
        </div>

        {/* Weather panel */}
        {showWeatherPanel && (
          <div className="flex-shrink-0 px-6 py-4 border-b border-earth-200/60 bg-sky-50/40 space-y-3">
            <button
              onClick={() => setShowWeather(!showWeather)}
              className={`w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-[12px] font-semibold border transition-all ${
                showWeather
                  ? "bg-sky-600 text-white border-sky-600 shadow-md"
                  : "bg-white text-earth-700 border-earth-200 hover:border-sky-300 hover:bg-sky-50"
              }`}
            >
              <Cloud size={14} />
              {showWeather ? "✓ Vreme prikazano na mapi" : "Prikaži vreme na mapi"}
            </button>
            <button
              onClick={() => setOnlyGoodWeather(!onlyGoodWeather)}
              className={`w-full flex items-center gap-2 rounded-xl px-3 py-2.5 text-[12px] font-semibold border transition-all ${
                onlyGoodWeather
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-md"
                  : "bg-white text-earth-700 border-earth-200 hover:border-emerald-300 hover:bg-emerald-50"
              }`}
            >
              <Leaf size={14} />
              {onlyGoodWeather ? "✓ Samo kmetije z lepim vremenom" : "Filtriraj po lepem vremenu"}
            </button>
            <div className="rounded-xl bg-white border border-sky-100 px-3 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-sky-600 mb-2">
                Vreme — osrednja Slovenija
              </p>
              <WeatherWidget lat={46.15} lng={14.99} />
            </div>
          </div>
        )}

        {/* Scrollable filters — content-height with soft cap so sidebar doesn't leave empty air */}
        <div className="flex-shrink-0 max-h-[50vh] overflow-y-auto px-6 py-5 space-y-5">
          {FiltersBody}
        </div>

        {/* Farm list — takes the remaining vertical space */}
        <div className="flex-1 min-h-0 border-t border-earth-200/60 px-5 py-4 overflow-y-auto bg-earth-50/50">
          <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-earth-400 mb-3">
            Kmetije na zemljevidu
          </h3>
          <div className="space-y-2">
            {!mapReady ? (
              // Skeleton while the map is warming up
              <>
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3 rounded-xl p-2.5 bg-white/50">
                    <div className="h-10 w-10 rounded-lg bg-earth-200 animate-pulse" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-2/3 rounded bg-earth-200 animate-pulse" />
                      <div className="h-2.5 w-1/2 rounded bg-earth-100 animate-pulse" />
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <>
                {sortedFarms.map((farm) => {
                  const dist =
                    userLocation && farm.location
                      ? haversineKm(userLocation.lat, userLocation.lng, farm.location.latitude, farm.location.longitude)
                      : null;
                  return (
                    <button
                      key={farm.slug}
                      ref={(el) => { farmRowRefs.current[farm.slug] = el; }}
                      onClick={() => handleFarmClick(farm.slug)}
                      onMouseEnter={() => setHoveredFarmSlug(farm.slug)}
                      onMouseLeave={() => setHoveredFarmSlug((p) => (p === farm.slug ? null : p))}
                      onFocus={() => setHoveredFarmSlug(farm.slug)}
                      onBlur={() => setHoveredFarmSlug((p) => (p === farm.slug ? null : p))}
                      className={`w-full flex items-center gap-3 rounded-xl p-2.5 text-left transition-all duration-200 ${
                        activeFarmSlug === farm.slug
                          ? "bg-forest-100 border border-forest-300 shadow-sm"
                          : "hover:bg-white border border-transparent"
                      }`}
                    >
                      <div className="relative h-10 w-10 rounded-lg overflow-hidden flex-shrink-0">
                        <Image src={farm.coverImageUrl} alt={farm.name} fill className="object-cover" sizes="40px" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className={`text-sm font-semibold truncate ${activeFarmSlug === farm.slug ? "text-forest-800" : "text-forest-900"}`}>
                            {farm.name}
                          </p>
                          {farm.isPremium && <span className="text-[9px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">PRO</span>}
                          {!farm.isPremium && farm.isMedium && <span className="text-[9px] bg-teal-100 text-teal-700 font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">PLUS</span>}
                        </div>
                        <p className="text-[11px] text-earth-500 truncate">
                          {REGION_LABELS[farm.region]}
                          {farm.rating && ` · ⭐ ${farm.rating.toFixed(1)}`}
                          {dist !== null && ` · ${dist < 1 ? `${(dist * 1000).toFixed(0)} m` : `${dist.toFixed(1)} km`}`}
                        </p>
                      </div>
                    </button>
                  );
                })}
                {sortedFarms.length === 0 && (
                  <div className="text-center py-6">
                    <p className="text-sm text-earth-500">Nobena kmetija ne ustreza filtrom.</p>
                    <button onClick={clearAll} className="mt-2 text-sm font-semibold text-forest-600 hover:text-forest-800">
                      Počisti filtre
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </aside>

      {/* ── SIDEBAR TOGGLE ─────────────────────────────────────────── */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label={sidebarOpen ? "Skrij filtre" : "Prikaži filtre"}
        className="absolute top-[76px] z-30 hidden lg:flex h-10 w-8 items-center justify-center rounded-r-lg bg-white border border-l-0 border-earth-200 shadow-md hover:bg-forest-50 transition-all duration-300"
        style={{ left: sidebarOpen ? "340px" : "0px" }}
      >
        {sidebarOpen ? (
          <ChevronLeft className="h-4 w-4 text-forest-700" />
        ) : (
          <ChevronRight className="h-4 w-4 text-forest-700" />
        )}
      </button>

      {/* ── MOBILE TOP BAR — GPS + Vreme + Filtri ──────────────────── */}
      <div className="lg:hidden absolute top-[60px] left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-b border-earth-200/60 px-4 py-3 flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setMobileSheetOpen(true)}
          className="flex-shrink-0 flex items-center gap-1.5 rounded-full bg-forest-700 text-white px-3.5 py-1.5 text-[11px] font-semibold shadow-sm"
        >
          <SlidersHorizontal size={12} />
          Filtri {activeChips.length > 0 && <span className="bg-white/25 rounded-full px-1.5 py-0.5 text-[10px]">{activeChips.length}</span>}
        </button>
        <button
          onClick={handleGPS}
          disabled={gpsLoading}
          className="flex-shrink-0 flex items-center gap-1.5 rounded-full bg-forest-50 border border-forest-200 px-3 py-1.5 text-[11px] font-semibold text-forest-700"
        >
          {gpsLoading ? <Loader2 size={12} className="animate-spin" /> : <Navigation size={12} />}
          Bližina
        </button>
        <button
          onClick={() => { setShowWeatherPanel(!showWeatherPanel); if (!showWeatherPanel) setShowWeather(true); }}
          className={`flex-shrink-0 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold ${
            showWeather || showWeatherPanel ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-earth-200 text-earth-600"
          }`}
        >
          <Cloud size={12} />
          Vreme
        </button>
      </div>

      {/* ── MOBILE BOTTOM SHEET (Filters) ──────────────────────────── */}
      <AnimatePresence>
        {mobileSheetOpen && (
          <>
            <motion.div
              key="sheet-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileSheetOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />
            <motion.div
              key="sheet-panel"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.3 }}
              onDragEnd={(_, info) => {
                if (info.offset.y > 120) setMobileSheetOpen(false);
              }}
              className="lg:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-white shadow-2xl max-h-[85vh] flex flex-col"
            >
              {/* Peek handle */}
              <div className="flex-shrink-0 flex flex-col items-center pt-3 pb-1">
                <div className="h-1.5 w-10 rounded-full bg-earth-300" />
              </div>
              <div className="flex-shrink-0 flex items-center justify-between px-5 pb-3">
                <h2 className="text-base font-bold text-forest-900 flex items-center gap-2">
                  <SlidersHorizontal size={15} /> Filtri
                </h2>
                <div className="flex items-center gap-2">
                  {hasFilters && (
                    <button onClick={clearAll} className="text-xs font-medium text-forest-600">
                      Počisti
                    </button>
                  )}
                  <button
                    onClick={() => setMobileSheetOpen(false)}
                    aria-label="Zapri"
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-earth-100 text-earth-500"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-5">
                {FiltersBody}
              </div>
              <div className="flex-shrink-0 px-5 pb-5 pt-3 border-t border-earth-200/60 bg-white">
                <button
                  onClick={() => setMobileSheetOpen(false)}
                  className="w-full rounded-xl bg-forest-700 py-3 text-sm font-bold text-white hover:bg-forest-600"
                >
                  Pokaži {sortedFarms.length} kmetij
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── MAP AREA ───────────────────────────────────────────────── */}
      <div className="flex-1 relative">

        {/* Floating filter-chip bar (sidebar closed OR mobile) */}
        {activeChips.length > 0 && (
          <div
            className={`absolute top-4 left-4 right-4 lg:right-auto z-20 flex items-center gap-2 overflow-x-auto pb-1 ${
              sidebarOpen ? "lg:hidden" : ""
            }`}
          >
            {activeChips.map((chip) => (
              <span
                key={chip.key}
                className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-sm border border-earth-200/70 shadow-sm px-3 py-1.5 text-[11px] font-semibold text-forest-700"
              >
                {chip.label}
                <button
                  onClick={chip.onRemove}
                  aria-label={`Odstrani ${chip.label}`}
                  className="inline-flex h-4 w-4 items-center justify-center rounded-full text-earth-500 hover:bg-earth-100 hover:text-earth-800"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
            {activeChips.length > 1 && (
              <button
                onClick={clearAll}
                className="flex-shrink-0 text-[11px] font-semibold text-forest-600 hover:text-forest-800 px-2"
              >
                Počisti vse
              </button>
            )}
          </div>
        )}

        {/* Right-side floating control stack: reset + legend info */}
        <div className="absolute top-[140px] right-[10px] z-20 flex flex-col gap-2">
          <button
            onClick={() => mapRef.current?.resetView()}
            title="Ponastavi pogled na Slovenijo"
            aria-label="Ponastavi pogled"
            className="flex items-center justify-center h-9 w-9 rounded-lg bg-white/95 backdrop-blur-sm border border-earth-200 shadow-md text-forest-700 hover:bg-forest-50 transition-colors"
          >
            <RotateCcw size={15} />
          </button>
          <div className="relative">
            <button
              onClick={() => setLegendOpen((v) => !v)}
              onMouseEnter={() => setLegendOpen(true)}
              onMouseLeave={() => setLegendOpen(false)}
              title="Legenda"
              aria-label="Legenda"
              className="flex items-center justify-center h-9 w-9 rounded-lg bg-white/95 backdrop-blur-sm border border-earth-200 shadow-md text-forest-700 hover:bg-forest-50 transition-colors"
            >
              <Info size={15} />
            </button>
            <AnimatePresence>
              {legendOpen && (
                <motion.div
                  initial={{ opacity: 0, x: 8, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  onMouseEnter={() => setLegendOpen(true)}
                  onMouseLeave={() => setLegendOpen(false)}
                  className="absolute right-full mr-2 top-0 rounded-2xl bg-white/95 backdrop-blur-md border border-earth-200/60 shadow-lg px-4 py-3 w-[160px]"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-earth-400 mb-2.5">
                    Legenda
                  </p>
                  <div className="flex flex-col gap-2 text-[11px] text-earth-700">
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-sm ring-2 ring-white">
                        <Star size={10} fill="currentColor" />
                      </span>
                      Premium
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-teal-600 text-white shadow-sm ring-2 ring-white">
                        <Home size={10} />
                      </span>
                      Plus
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-forest-700 text-white shadow-sm ring-2 ring-white">
                        <Home size={10} />
                      </span>
                      Kmetija
                    </div>
                    <div className="flex items-center gap-2.5">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white border border-earth-300 text-earth-600 shadow-sm">
                        <Landmark size={10} />
                      </span>
                      Znamenitost
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <MapboxMap
          mapHandle={mapRef}
          farms={sortedFarms}
          landmarks={MOCK_ZNAMENITOSTI}
          activeFarmSlug={activeFarmSlug}
          hoveredFarmSlug={hoveredFarmSlug}
          onFarmSelect={(slug) => {
            setActiveFarmSlug(slug);
            if (slug) setSelectedLandmarkId(null);
          }}
          onLandmarkSelect={(id) => {
            setSelectedLandmarkId(id);
            if (id) setActiveFarmSlug(null);
          }}
          showWeather={showWeather}
          userLocation={userLocation}
          routeProfile={routeProfile}
          onRouteUpdate={handleRouteUpdate}
        />

        {/* ── Route panel ─────────────────────────────────────────── */}
        {activeFarm && userLocation && (
          <div className="absolute top-4 right-4 z-30 w-[300px] max-w-[calc(100vw-2rem)] rounded-2xl bg-white/95 backdrop-blur-sm border border-earth-200/60 shadow-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Route size={16} className="text-forest-600 flex-shrink-0" />
              <p className="text-[13px] font-bold text-forest-900 truncate">
                Pot do: {activeFarm.name}
              </p>
            </div>
            <div className="flex gap-1.5 mb-3">
              {ROUTE_PROFILES.map(({ key, label, Icon }) => (
                <button
                  key={key}
                  onClick={() => setRouteProfile(key)}
                  className={`flex-1 flex flex-col items-center gap-1 rounded-xl py-2 px-1 text-[11px] font-semibold border transition-all ${
                    routeProfile === key
                      ? "bg-forest-700 text-white border-forest-700 shadow-md"
                      : "bg-earth-50 text-earth-700 border-earth-200 hover:bg-forest-50 hover:border-forest-300"
                  }`}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>
            {routeInfo && routeInfo.profile === routeProfile && (
              <div className="flex items-center justify-between bg-forest-50 rounded-xl px-3 py-2 mb-3">
                <div className="text-center">
                  <p className="text-[10px] text-earth-500 font-medium">Razdalja</p>
                  <p className="text-[14px] font-bold text-forest-800">{formatDistance(routeInfo.distance)}</p>
                </div>
                <div className="w-px h-8 bg-earth-200" />
                <div className="text-center">
                  <p className="text-[10px] text-earth-500 font-medium">Čas</p>
                  <p className="text-[14px] font-bold text-forest-800">{formatDuration(routeInfo.duration)}</p>
                </div>
              </div>
            )}
            <div className="flex gap-1.5">
              <a
                href={getTransitLink("transit") ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-[11px] font-semibold border transition-colors ${
                  userLocation && activeFarm?.location
                    ? "bg-earth-50 text-earth-700 border-earth-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
                    : "opacity-40 pointer-events-none bg-earth-50 text-earth-400 border-earth-200"
                }`}
              >
                <Bus size={13} />
                Avtobus
              </a>
              <a
                href={getTransitLink("train") ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-[11px] font-semibold border bg-earth-50 text-earth-700 border-earth-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
              >
                <Train size={13} />
                Vlak (SŽ)
              </a>
            </div>
          </div>
        )}

        {/* Info Card overlay */}
        {activeFarm && (
          <InfoCard
            type="farm"
            farm={activeFarm}
            onClose={() => {
              setActiveFarmSlug(null);
              mapRef.current?.resetView();
            }}
          />
        )}
        {activeLandmark && !activeFarm && (
          <InfoCard
            type="landmark"
            landmark={activeLandmark}
            onClose={() => {
              setSelectedLandmarkId(null);
              mapRef.current?.resetView();
            }}
          />
        )}
      </div>
    </div>
  );
}

// ─── Collapsible section primitive ─────────────────────────────────────────

function CollapsibleSection({
  title,
  icon,
  count,
  open,
  onToggle,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  count?: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full mb-3 group"
      >
        <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-earth-400 group-hover:text-forest-700 transition-colors">
          {icon}
          {title}
          {typeof count === "number" && count > 0 && (
            <span className="ml-2 rounded-full bg-forest-100 text-forest-700 px-1.5 py-0.5 text-[10px]">
              {count}
            </span>
          )}
        </h3>
        <ChevronDown
          size={14}
          className={`text-earth-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="overflow-hidden"
          >
            <div className="pb-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
