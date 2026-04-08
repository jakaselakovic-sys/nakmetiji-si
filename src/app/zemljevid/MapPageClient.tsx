"use client";

// =============================================================================
// NaKmetiji.si — Map Page Client
// 3D Mapbox zemljevid s sidebar filtri, GPS, routing, vremenskim slojem
// =============================================================================

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { MOCK_FARMS } from "@/data/mock-farms";
import { MOCK_ZNAMENITOSTI } from "@/data/mock-landmarks";
import {
  Region,
  REGION_LABELS,
  EXPERIENCE_LABELS,
} from "@/types";
import type { ExperienceTag, Farm } from "@/types";
import type { Znamenitost } from "@/types/landmarks";
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

export function MapPageClient() {
  const mapRef = useRef<MapboxMapHandle>(null);

  // ── State ─────────────────────────────────────────────────────────────
  const [selectedRegions, setSelectedRegions] = useState<Region[]>([]);
  const [selectedExperiences, setSelectedExperiences] = useState<ExperienceTag[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeFarmSlug, setActiveFarmSlug] = useState<string | null>(null);
  const [selectedLandmarkId, setSelectedLandmarkId] = useState<string | null>(null);
  const [showWeather, setShowWeather] = useState(false);
  const [showWeatherPanel, setShowWeatherPanel] = useState(false);
  const [onlyGoodWeather, setOnlyGoodWeather] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [showLandmarks, setShowLandmarks] = useState(false);
  const [routeProfile, setRouteProfile] = useState<RouteProfileKey | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  // slug → true (good weather) | false (bad) | undefined (not fetched yet)
  const [farmWeatherGood, setFarmWeatherGood] = useState<Record<string, boolean>>({});

  // ── Pre-fetch weather for all farms when good-weather filter activated ─
  useEffect(() => {
    if (!onlyGoodWeather) return;
    let cancelled = false;
    const farmsWithLocation = MOCK_FARMS.filter((f) => f.location);
    farmsWithLocation.forEach((farm) => {
      if (!farm.location) return;
      fetchWeather(farm.location.latitude, farm.location.longitude).then((w) => {
        if (cancelled || !w) return;
        setFarmWeatherGood((prev) => ({ ...prev, [farm.slug]: w.current.isGood }));
      });
    });
    return () => { cancelled = true; };
  }, [onlyGoodWeather]);

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
      return true;
    });
  }, [selectedRegions, selectedExperiences, onlyGoodWeather, farmWeatherGood]);

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

  // ── Helpers ───────────────────────────────────────────────────────────

  const toggleRegion = (region: Region) =>
    setSelectedRegions((p) => (p.includes(region) ? p.filter((r) => r !== region) : [...p, region]));
  const toggleExperience = (exp: ExperienceTag) =>
    setSelectedExperiences((p) => (p.includes(exp) ? p.filter((e) => e !== exp) : [...p, exp]));
  const clearAll = () => {
    setSelectedRegions([]);
    setSelectedExperiences([]);
    setOnlyGoodWeather(false);
    setShowWeather(false);
    setShowWeatherPanel(false);
  };

  const hasFilters = selectedRegions.length > 0 || selectedExperiences.length > 0 || onlyGoodWeather;

  const handleFarmClick = (slug: string) => {
    setActiveFarmSlug(slug);
    setSelectedLandmarkId(null);
    mapRef.current?.flyToFarm(slug);
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

  // ── Google Maps transit links ─────────────────────────────────────────
  const getTransitLink = (mode: "transit" | "train") => {
    if (!userLocation || !activeFarm?.location) return null;
    const origin = `${userLocation.lat},${userLocation.lng}`;
    const dest = `${activeFarm.location.latitude},${activeFarm.location.longitude}`;
    if (mode === "transit") {
      return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${dest}&travelmode=transit`;
    }
    // Train — link to SŽ with approximate departure location
    return `https://www.slo-zeleznice.si/sl/potniki/vozni-red`;
  };

  // ═══════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════

  return (
    <div className="flex h-[calc(100dvh-0px)] pt-[72px]">
      {/* ── SIDEBAR ──────────────────────────────────────────────────── */}
      <aside
        className={`relative z-20 flex-col bg-white border-r border-earth-200/70 shadow-xl transition-all duration-500 ease-in-out overflow-hidden hidden lg:flex ${
          sidebarOpen ? "w-[340px] min-w-[340px] opacity-100" : "w-0 min-w-0 opacity-0"
        }`}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-earth-200/60">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-xl font-bold text-forest-900 flex items-center gap-2">
              <Mountain className="h-5 w-5 text-forest-600" />
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
            {/* Toggle map badges */}
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

            {/* Good weather filter */}
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

            {/* Live weather widget for Slovenia centre */}
            <div className="rounded-xl bg-white border border-sky-100 px-3 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-sky-600 mb-2">
                Vreme — osrednja Slovenija
              </p>
              <WeatherWidget lat={46.15} lng={14.99} />
            </div>
          </div>
        )}

        {/* Scrollable filters */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Region filter */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-earth-400 mb-3">
              <MapPin size={12} className="inline mr-1" />
              Regija
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(REGION_LABELS).map(([key, label]) => {
                const region = key as Region;
                const active = selectedRegions.includes(region);
                const count = MOCK_FARMS.filter((f) => f.region === region).length;
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
          </div>

          {/* Experience filter */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-earth-400 mb-3">
              <Star size={12} className="inline mr-1" />
              Doživetje
            </h3>
            <div className="flex flex-col gap-1.5">
              {(Object.entries(EXPERIENCE_LABELS) as [ExperienceTag, string][]).map(([key, label]) => {
                const active = selectedExperiences.includes(key);
                const count = MOCK_FARMS.filter((f) => f.experiencesOffered.includes(key)).length;
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
          </div>

          {/* Landmarks section */}
          <div>
            <button
              onClick={() => setShowLandmarks(!showLandmarks)}
              className="flex items-center justify-between w-full mb-3"
            >
              <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-earth-400">
                <Landmark size={12} className="inline mr-1" />
                Znamenitosti ({MOCK_ZNAMENITOSTI.length})
              </h3>
              <ChevronRight
                size={14}
                className={`text-earth-400 transition-transform ${showLandmarks ? "rotate-90" : ""}`}
              />
            </button>
            {showLandmarks && (
              <div className="space-y-1.5">
                {MOCK_ZNAMENITOSTI.map((z) => (
                  <button
                    key={z.id}
                    onClick={() => {
                      setSelectedLandmarkId(z.id);
                      setActiveFarmSlug(null);
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
              </div>
            )}
          </div>
        </div>

        {/* Farm list at bottom */}
        <div className="flex-shrink-0 border-t border-earth-200/60 px-5 py-4 max-h-[280px] overflow-y-auto bg-earth-50/50">
          <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-earth-400 mb-3">
            Kmetije na zemljevidu
          </h3>
          <div className="space-y-2">
            {sortedFarms.map((farm) => {
              const dist =
                userLocation && farm.location
                  ? haversineKm(userLocation.lat, userLocation.lng, farm.location.latitude, farm.location.longitude)
                  : null;
              return (
                <button
                  key={farm.slug}
                  onClick={() => handleFarmClick(farm.slug)}
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
          </div>
        </div>
      </aside>

      {/* ── SIDEBAR TOGGLE ─────────────────────────────────────────── */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label={sidebarOpen ? "Skrij filtre" : "Prikaži filtre"}
        className="absolute top-[88px] z-30 hidden lg:flex h-10 w-8 items-center justify-center rounded-r-lg bg-white border border-l-0 border-earth-200 shadow-md hover:bg-forest-50 transition-all duration-300"
        style={{ left: sidebarOpen ? "340px" : "0px" }}
      >
        {sidebarOpen ? (
          <ChevronLeft className="h-4 w-4 text-forest-700" />
        ) : (
          <ChevronRight className="h-4 w-4 text-forest-700" />
        )}
      </button>

      {/* ── MOBILE TOP BAR ─────────────────────────────────────────── */}
      <div className="lg:hidden absolute top-[72px] left-0 right-0 z-30 bg-white/90 backdrop-blur-md border-b border-earth-200/60 px-4 py-3 flex items-center gap-2 overflow-x-auto">
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
        {Object.entries(REGION_LABELS).map(([key, label]) => {
          const region = key as Region;
          const active = selectedRegions.includes(region);
          const count = MOCK_FARMS.filter((f) => f.region === region).length;
          if (count === 0) return null;
          return (
            <button
              key={key}
              onClick={() => toggleRegion(region)}
              className={`flex-shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold border transition-colors ${
                active ? "bg-forest-700 text-white border-forest-700" : "bg-white text-earth-700 border-earth-200"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* ── MAP AREA ───────────────────────────────────────────────── */}
      <div className="flex-1 relative">

        {/* Reset view button */}
        <button
          onClick={() => mapRef.current?.resetView()}
          title="Ponastavi pogled na Slovenijo"
          className="absolute top-4 left-4 z-20 flex items-center gap-1.5 rounded-xl bg-white/95 backdrop-blur-sm border border-earth-200/70 shadow-md px-3 py-2 text-[12px] font-semibold text-forest-700 hover:bg-forest-50 transition-colors"
        >
          <RotateCcw size={13} />
          Slovenija
        </button>

        <MapboxMap
          mapHandle={mapRef}
          farms={sortedFarms}
          landmarks={MOCK_ZNAMENITOSTI}
          activeFarmSlug={activeFarmSlug}
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

        {/* ── Route panel (visible when farm + GPS active) ────────── */}
        {activeFarm && userLocation && (
          <div className="absolute top-4 right-4 z-30 w-[300px] max-w-[calc(100vw-2rem)] rounded-2xl bg-white/95 backdrop-blur-sm border border-earth-200/60 shadow-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Route size={16} className="text-forest-600 flex-shrink-0" />
              <p className="text-[13px] font-bold text-forest-900 truncate">
                Pot do: {activeFarm.name}
              </p>
            </div>

            {/* Profile selector — car / walking / cycling */}
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

            {/* Route info */}
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

            {/* Transit links */}
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
            onClose={() => setActiveFarmSlug(null)}
          />
        )}
        {activeLandmark && !activeFarm && (
          <InfoCard
            type="landmark"
            landmark={activeLandmark}
            onClose={() => setSelectedLandmarkId(null)}
          />
        )}

        {/* Legend */}
        <div className="absolute bottom-6 left-6 z-20 rounded-xl bg-white/90 backdrop-blur-sm border border-earth-200/60 shadow-lg px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-earth-400 mb-2">
            Legenda
          </p>
          <div className="flex flex-col gap-1.5 text-[11px] text-earth-700">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-[8px]">⭐</span>
              Premium (zoom 1+)
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-teal-600 text-white text-[8px]">🏡</span>
              Plus (zoom 8+)
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-forest-700 text-white text-[8px]">🏡</span>
              Kmetija (zoom 9+)
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-earth-200 text-[8px]">⛰️</span>
              Znamenitost (zoom 11+)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
