"use client";

// =============================================================================
// NaKmetiji.si — Itinerary Notebook v3
// Real multi-day trip view: per-day timed schedule + map with road geometry.
// =============================================================================

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  MapPin, ArrowRight, Star, Leaf, Clock, Compass, CheckCircle2,
  CloudRain, Sun, CloudSnow, Wind, Thermometer, Umbrella,
  ShieldCheck, Trophy, Calendar, Bookmark, Loader2,
} from "lucide-react";
import { shraniPot } from "@/lib/actions/shranjene-poti";
import { REGION_LABELS } from "@/types/farm";
import { pluralPair } from "@/lib/plural";
import type { Regija } from "@/types/database";

// ---------------------------------------------------------------------------
// Types — mirror @/lib/oracle/roadtrip
// ---------------------------------------------------------------------------

type ActivityType =
  | "travel" | "settle" | "meal" | "landmark" | "farm" | "buffer" | "free" | "depart";

interface ActivityBlock {
  time_label: string;
  time_hhmm: string;
  duration_min: number;
  type: ActivityType;
  title: string;
  description: string;
  icon: string;
  location: { lat: number; lng: number; name: string } | null;
  drive_minutes?: number;
  drive_km?: number;
  distance_source?: "mapbox_matrix" | "estimated_haversine";
}

interface FarmInfo {
  id: string;
  slug: string;
  ime: string;
  regija: Regija;
  kratki_opis: string | null;
  naslovna_slika: string;
  ocena: number | null;
  cena_noc: number | null;
  premium: boolean;
  lat: number;
  lng: number;
  dozivetja: { ime: string; slug: string }[];
}

interface DayPlan {
  day: number;
  date_offset_days: number;
  base_farm: FarmInfo;
  schedule: ActivityBlock[];
  total_km: number;
  total_drive_minutes: number;
  weather?: WeatherForecast;
  summary: string;
  is_arrival_day: boolean;
  is_transit_day: boolean;
  is_departure_day: boolean;
  drive_geometry: {
    from: { lat: number; lng: number; name: string };
    to: { lat: number; lng: number; name: string };
    via?: { lat: number; lng: number; name: string };
  } | null;
}

interface WeatherForecast {
  day: number;
  region: Regija;
  signal: string;
  temp_c: number;
  summary: string;
}

export interface Itinerary {
  id: string;
  regions: Regija[];
  daily: DayPlan[];
  total_km: number;
  total_drive_minutes: number;
  days: number;
  nights: number;
  understood?: {
    regions: Regija[];
    days: number;
    vibes: string[];
    withDog: boolean;
    maxGostov: number | null;
    from_prompt: boolean;
  };
  weather_forecast?: WeatherForecast[];
  packing_tips?: string[];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDriveTime(minutes: number): string {
  if (minutes <= 0) return "brez vožnje";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${pluralPair(h, "ura")}`;
  return `${h} h ${m} min`;
}

const WEATHER_ICONS: Record<string, React.ReactNode> = {
  rain: <CloudRain size={14} className="text-blue-500" />,
  snow: <CloudSnow size={14} className="text-sky-400" />,
  storm: <CloudRain size={14} className="text-purple-500" />,
  clear_hot: <Sun size={14} className="text-amber-500" />,
  clear_mild: <Sun size={14} className="text-yellow-500" />,
  cold_clear: <Thermometer size={14} className="text-blue-400" />,
  fog: <Wind size={14} className="text-earth-400" />,
  cool_cloudy: <Wind size={14} className="text-earth-500" />,
};

const ACTIVITY_TYPE_COLOR: Record<ActivityType, { bg: string; text: string; border: string }> = {
  travel:   { bg: "bg-slate-50",    text: "text-slate-700",    border: "border-slate-200" },
  settle:   { bg: "bg-forest-50",   text: "text-forest-700",   border: "border-forest-200" },
  meal:     { bg: "bg-amber-50",    text: "text-amber-700",    border: "border-amber-200" },
  landmark: { bg: "bg-emerald-50",  text: "text-emerald-700",  border: "border-emerald-200" },
  farm:     { bg: "bg-bark-50",     text: "text-bark-700",     border: "border-bark-200" },
  buffer:   { bg: "bg-amber-50",    text: "text-amber-700",    border: "border-amber-200" },
  free:     { bg: "bg-indigo-50",   text: "text-indigo-700",   border: "border-indigo-200" },
  depart:   { bg: "bg-slate-50",    text: "text-slate-700",    border: "border-slate-200" },
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ItineraryNotebook({ itinerary }: { itinerary: Itinerary }) {
  if (itinerary.daily.length === 0) {
    return (
      <motion.div
        id="itinerary-result"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-amber-200 bg-amber-50/80 p-8 text-center"
      >
        <p className="font-display text-xl font-bold text-amber-900 mb-1">
          Tu Jože še nima ponudnika.
        </p>
        <p className="text-sm text-amber-800 max-w-md mx-auto">
          V izbranih regijah trenutno ni aktivnih kmetij. Poskusite z drugačno
          kombinacijo — npr. dodajte sosednjo regijo.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      id="itinerary-result"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <HeaderCard itinerary={itinerary} />
      <ItineraryMap daily={itinerary.daily} />

      <ol className="relative space-y-4">
        {itinerary.daily.map((day, i) => (
          <motion.li
            key={day.day}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.08, duration: 0.4 }}
          >
            <DayCard day={day} />
          </motion.li>
        ))}
      </ol>

      <ItineraryActions itinerary={itinerary} />
      <GreenPassportTeaser stopCount={itinerary.daily.filter((d) => d.is_arrival_day || d.day === 1).length} regions={itinerary.regions} />
      {itinerary.packing_tips && itinerary.packing_tips.length > 0 && (
        <PackingTips tips={itinerary.packing_tips} />
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Header card
// ---------------------------------------------------------------------------

function HeaderCard({ itinerary }: { itinerary: Itinerary }) {
  const understood = itinerary.understood;
  const farmsVisited = new Set(itinerary.daily.map((d) => d.base_farm.slug)).size;
  return (
    <div className="rounded-3xl bg-gradient-to-br from-forest-900 via-forest-800 to-forest-900 text-white p-6 sm:p-8 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-amber-400/5 blur-3xl" />
      </div>

      <div className="relative">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold mb-4">
          <Leaf size={12} /> Jožetov Road Trip
        </div>

        <h2 className="text-2xl sm:text-4xl font-black text-white font-display tracking-tight mb-3">
          Tvoj Zvezek Poti
        </h2>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-white/80">
          <StatPill icon={<Calendar size={14} />} label={pluralPair(itinerary.days, "dan")} />
          <StatPill icon={<MapPin size={14} />} label={`${pluralPair(farmsVisited, "kmetija")}`} />
          <StatPill icon={<Clock size={14} />} label={`vožnja ${formatDriveTime(itinerary.total_drive_minutes)}`} />
          <StatPill icon={<Compass size={14} />} label={`${itinerary.total_km} km`} />
        </div>

        {understood?.from_prompt && (
          <div className="mt-5 pt-4 border-t border-white/10 text-xs text-white/70 leading-relaxed">
            <span className="inline-flex items-center gap-1.5 mr-2">
              <CheckCircle2 size={12} className="text-emerald-300" />
              <strong className="text-white/90">Jože razumel:</strong>
            </span>
            {understood.regions.map((r) => REGION_LABELS[r] ?? r).join(" + ")}
            {understood.days ? ` · ${pluralPair(understood.days, "dan")}` : ""}
            {understood.withDog ? " · s psom" : ""}
            {understood.maxGostov ? ` · ${pluralPair(understood.maxGostov, "oseba")}` : ""}
          </div>
        )}
      </div>
    </div>
  );
}

function StatPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-emerald-300">{icon}</span>
      {label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Day card with timeline
// ---------------------------------------------------------------------------

function DayCard({ day }: { day: DayPlan }) {
  const regionLabel = REGION_LABELS[day.base_farm.regija];
  const dayBadge = day.is_departure_day ? "Konec" : day.is_transit_day ? "Premik" : day.is_arrival_day ? "Prihod" : "Doživetje";

  return (
    <div className="rounded-3xl bg-white border border-earth-200/60 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
      {/* Hero strip — only show full hero on arrival/transit days */}
      {(day.is_arrival_day || day.is_transit_day) && !day.is_departure_day ? (
        <div className="relative h-44 sm:h-52 bg-earth-100 overflow-hidden">
          <Image
            src={day.base_farm.naslovna_slika || "/images/placeholder-farm.jpg"}
            alt={day.base_farm.ime}
            fill
            sizes="(min-width: 768px) 800px, 100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-forest-900 text-white font-display font-black text-sm shadow-md">
              Dan {day.day}
            </span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-500/95 text-white text-[10px] font-bold uppercase tracking-wider shadow-md">
              {dayBadge}
            </span>
            {day.base_farm.premium && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gold-500/95 text-white text-[10px] font-bold shadow-md">
                <Star size={10} fill="currentColor" /> Premium
              </span>
            )}
          </div>

          {day.weather && day.weather.signal !== "unknown" && (
            <div className="absolute top-4 right-4 inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-md">
              {WEATHER_ICONS[day.weather.signal] ?? <Sun size={14} className="text-amber-500" />}
              <span className="text-xs font-bold text-forest-900">{day.weather.temp_c}°C</span>
            </div>
          )}

          <div className="absolute bottom-0 inset-x-0 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/80 mb-0.5">
              {regionLabel} · {day.summary}
            </p>
            <h3 className="font-display font-black text-white text-xl sm:text-2xl leading-tight drop-shadow-md">
              {day.base_farm.ime}
            </h3>
            {day.total_drive_minutes > 0 && (
              <p className="text-xs text-white/80 mt-1">
                Vožnja danes: <strong>{day.total_km} km</strong> · {formatDriveTime(day.total_drive_minutes)}
              </p>
            )}
          </div>
        </div>
      ) : (
        // Compact header for activity / departure days
        <div className="px-5 sm:px-6 pt-5 pb-3 flex items-start gap-4 border-b border-earth-100">
          <span className="flex-shrink-0 inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-forest-700 to-forest-900 text-white font-display font-black text-base sm:text-lg shadow-md">
            D{day.day}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mb-0.5">{dayBadge} · {regionLabel}</p>
            <h3 className="font-display font-bold text-forest-900 text-lg leading-tight">
              {day.summary}
            </h3>
            <p className="text-xs text-earth-500 mt-1">
              <Link href={`/kmetije/${day.base_farm.slug}`} className="hover:text-forest-700 transition-colors underline decoration-dotted">
                {day.base_farm.ime}
              </Link>
              {day.total_km > 0 && (
                <> · vožnja {day.total_km} km · {formatDriveTime(day.total_drive_minutes)}</>
              )}
            </p>
          </div>
          {day.weather && day.weather.signal !== "unknown" && (
            <div className="flex items-center gap-1.5 bg-earth-50 rounded-full px-3 py-1.5 flex-shrink-0">
              {WEATHER_ICONS[day.weather.signal] ?? <Sun size={14} className="text-amber-500" />}
              <span className="text-xs font-bold text-forest-900">{day.weather.temp_c}°C</span>
            </div>
          )}
        </div>
      )}

      {/* Timeline */}
      <div className="px-5 sm:px-6 py-5">
        <ol className="relative space-y-3">
          {/* vertical timeline rail */}
          <div aria-hidden className="absolute left-[18px] top-2 bottom-2 w-px bg-gradient-to-b from-forest-300 via-earth-200 to-transparent" />

          {day.schedule.map((block, i) => (
            <ScheduleItem key={i} block={block} />
          ))}
        </ol>

        {/* Footer: profile link + price */}
        {!day.is_departure_day && (
          <div className="flex items-center gap-4 pt-4 mt-4 border-t border-earth-100">
            <Link
              href={`/kmetije/${day.base_farm.slug}`}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-forest-700 hover:text-forest-500 transition-colors"
            >
              Profil kmetije <ArrowRight size={13} />
            </Link>
            {day.base_farm.cena_noc !== null && (
              <span className="ml-auto text-sm text-earth-600">
                <strong className="text-forest-900 text-base">{day.base_farm.cena_noc} €</strong>{" "}
                / noč
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ScheduleItem({ block }: { block: ActivityBlock }) {
  const colors = ACTIVITY_TYPE_COLOR[block.type];
  return (
    <li className="relative pl-12">
      {/* Time circle on the rail */}
      <div className="absolute left-0 top-1 flex items-center justify-center w-9 h-9 rounded-full bg-white border-2 border-earth-200 shadow-sm text-base">
        {block.icon}
      </div>

      <div className={`rounded-2xl border ${colors.border} ${colors.bg} px-4 py-3`}>
        <div className="flex items-baseline justify-between gap-3 mb-0.5">
          <span className={`text-[10px] font-bold uppercase tracking-wider ${colors.text}`}>
            {block.time_hhmm} · {block.time_label}
          </span>
          <span className="text-[10px] text-earth-500">{block.duration_min} min</span>
        </div>
        <p className="text-sm font-bold text-forest-900 leading-tight">
          {block.title}
        </p>
        <p className="text-xs text-earth-700 mt-1 leading-relaxed">
          {block.description}
        </p>
        {block.type === "travel" && block.distance_source === "estimated_haversine" && (
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-amber-700">
            Ocena poti
          </p>
        )}
      </div>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Action bar — Save path to user account
// ---------------------------------------------------------------------------

function ItineraryActions({ itinerary }: { itinerary: Itinerary }) {
  const [state, setState] = useState<"idle" | "saving" | "saved" | "needs_login" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const defaultName = `Pot · ${itinerary.regions.map((r) => r.replace(/_/g, " ")).join(" + ")} · ${itinerary.days} dni`;

  async function handleSave() {
    setState("saving");
    setMessage(null);
    const result = await shraniPot({ ime: defaultName, itinerary });
    if (result.ok) {
      setState("saved");
      setMessage("Pot shranjena v moj račun.");
    } else if (result.needsLogin) {
      setState("needs_login");
      setMessage("Prijavite se za shranjevanje poti.");
    } else {
      setState("error");
      setMessage(result.napaka ?? "Napaka pri shranjevanju.");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="space-y-2"
    >
      {state === "needs_login" ? (
        <Link
          href="/prijava?redirect=/pot"
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-forest-700 hover:bg-forest-600 text-white px-4 py-3.5 text-sm font-bold shadow-md hover:shadow-lg transition-all"
        >
          <Bookmark size={15} />
          Prijavite se in shranite pot
        </Link>
      ) : (
        <button
          onClick={handleSave}
          disabled={state === "saving" || state === "saved"}
          className={`w-full flex items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-bold shadow-md hover:shadow-lg transition-all ${
            state === "saved"
              ? "bg-emerald-600 text-white"
              : "bg-forest-700 hover:bg-forest-600 text-white"
          }`}
        >
          {state === "saving" ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Shranjujem…
            </>
          ) : state === "saved" ? (
            <>
              <CheckCircle2 size={15} />
              Pot shranjena v moj račun
            </>
          ) : (
            <>
              <Bookmark size={15} />
              Shrani pot v moj račun
            </>
          )}
        </button>
      )}

      {message && state !== "saved" && (
        <p className={`text-xs text-center ${state === "error" ? "text-red-600" : "text-earth-600"}`}>
          {message}
        </p>
      )}

      {state === "saved" && (
        <Link
          href="/moj-racun"
          className="block text-xs text-center text-forest-700 hover:text-forest-500 underline decoration-dotted"
        >
          Odpri moj račun →
        </Link>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Map with real Mapbox driving geometry
// ---------------------------------------------------------------------------

function ItineraryMap({ daily }: { daily: DayPlan[] }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [tokenMissing, setTokenMissing] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current || daily.length === 0) return;

    const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";
    if (!TOKEN) {
      setTokenMissing(true);
      return;
    }

    mapboxgl.accessToken = TOKEN;

    // Collect all unique waypoints from drive_geometry across days
    const points: { lat: number; lng: number; name: string; type: "start" | "farm" | "via" }[] = [];
    daily.forEach((d, i) => {
      if (!d.drive_geometry) return;
      // First day: include "from" (Ljubljana)
      if (i === 0) {
        points.push({ ...d.drive_geometry.from, type: "start" });
      }
      if (d.drive_geometry.via) {
        points.push({ ...d.drive_geometry.via, type: "via" });
      }
      points.push({ ...d.drive_geometry.to, type: d.is_departure_day ? "start" : "farm" });
    });

    if (points.length < 2) return;

    const bounds = new mapboxgl.LngLatBounds();
    points.forEach((p) => bounds.extend([p.lng, p.lat]));

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      bounds,
      fitBoundsOptions: { padding: 50, maxZoom: 11 },
      interactive: true,
    });
    mapRef.current = map;

    map.on("load", async () => {
      // Try Mapbox Directions API for real route geometry. Fall back to straight line on failure.
      let routeGeometry: GeoJSON.LineString | null = null;
      try {
        // Mapbox Directions allows max 25 waypoints — we have at most ~14 here.
        const coordsParam = points.map((p) => `${p.lng},${p.lat}`).join(";");
        const dirUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${coordsParam}?geometries=geojson&overview=full&access_token=${TOKEN}`;
        const r = await fetch(dirUrl);
        if (r.ok) {
          const j = await r.json() as { routes?: { geometry: GeoJSON.LineString }[] };
          if (j.routes && j.routes[0]) {
            routeGeometry = j.routes[0].geometry;
          }
        }
      } catch { /* fall through */ }

      const fallbackLine: GeoJSON.LineString = {
        type: "LineString",
        coordinates: points.map((p) => [p.lng, p.lat]),
      };

      map.addSource("route", {
        type: "geojson",
        data: { type: "Feature", properties: {}, geometry: routeGeometry ?? fallbackLine },
      });
      map.addLayer({
        id: "route-shadow",
        type: "line",
        source: "route",
        paint: { "line-color": "#1a3d18", "line-width": 7, "line-opacity": 0.25 },
      });
      map.addLayer({
        id: "route-line",
        type: "line",
        source: "route",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#2D5A27",
          "line-width": 4,
          ...(routeGeometry ? {} : { "line-dasharray": [2, 2] as [number, number] }),
        },
      });

      // Markers — color-coded by point type, numbered
      let farmCounter = 1;
      points.forEach((p) => {
        const el = document.createElement("div");
        if (p.type === "start") {
          el.className = "flex h-7 w-7 items-center justify-center rounded-full bg-forest-900 text-white shadow-md ring-2 ring-white";
          el.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 21h18M5 21V8a2 2 0 012-2h10a2 2 0 012 2v13M9 9h6M9 13h6M9 17h6"/></svg>`;
          el.title = p.name;
        } else if (p.type === "via") {
          el.className = "flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white shadow-md ring-2 ring-white text-[10px] font-bold";
          el.innerText = "•";
          el.title = `Postanek: ${p.name}`;
        } else {
          el.className = "flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-sm shadow-md ring-2 ring-white";
          el.innerText = String(farmCounter++);
          el.title = p.name;
        }

        new mapboxgl.Marker({ element: el })
          .setLngLat([p.lng, p.lat])
          .setPopup(new mapboxgl.Popup({ offset: 18, closeButton: false }).setHTML(
            `<div style="padding:4px 8px;font-family:system-ui;font-size:12px;font-weight:600;color:#1f3d1c">${escapeHtml(p.name)}</div>`
          ))
          .addTo(map);
      });
    });

    return () => map.remove();
  }, [daily]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-3xl border border-earth-200/60 overflow-hidden shadow-sm h-72 sm:h-96 w-full relative bg-earth-100"
    >
      {tokenMissing ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-earth-500">
          <MapPin size={32} className="mb-3 opacity-60" />
          <p className="text-sm font-semibold mb-1">Zemljevid trenutno ni na voljo</p>
          <p className="text-xs">Manjka Mapbox API ključ — kontaktiraj administratorja.</p>
        </div>
      ) : (
        <div ref={mapContainerRef} className="absolute inset-0" />
      )}
      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-sm text-xs font-bold text-forest-900 flex items-center gap-1.5 pointer-events-none">
        <MapPin size={14} className="text-forest-600" />
        Pot s pravimi cestami
      </div>
    </motion.div>
  );
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]!));
}

// ---------------------------------------------------------------------------
// Green Passport teaser
// ---------------------------------------------------------------------------

function GreenPassportTeaser({ stopCount, regions }: { stopCount: number; regions: Regija[] }) {
  const uniqueRegions = new Set(regions).size;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="rounded-3xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/60 p-5 sm:p-6"
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
          <ShieldCheck size={24} className="text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-forest-900 text-sm mb-1">
            🌿 Green Passport Bonus
          </h3>
          <p className="text-xs text-earth-700 leading-relaxed mb-2">
            Če prevoziš to pot in zbereš{" "}
            <strong className="text-forest-800">{pluralPair(stopCount, "zig")}</strong>{" "}
            v{" "}
            <strong className="text-forest-800">{pluralPair(uniqueRegions, "regija")}</strong>,
            bo tvoj Green Passport dobil bonus značko!
          </p>
          {stopCount >= 3 && (
            <Link
              href="/green-passport"
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-200 rounded-full px-3 py-1 transition-colors"
            >
              <Trophy size={11} /> Prikaži potni list
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Packing tips
// ---------------------------------------------------------------------------

function PackingTips({ tips }: { tips: string[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8 }}
      className="rounded-3xl bg-white border border-earth-200/60 p-5 sm:p-6"
    >
      <div className="flex items-center gap-2 mb-3">
        <Umbrella size={16} className="text-sky-600" />
        <h3 className="font-display font-bold text-forest-900 text-sm">
          Jožetov pakirni seznam
        </h3>
      </div>
      <ul className="space-y-1.5">
        {tips.map((tip, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-earth-700">
            <span className="flex-shrink-0 mt-0.5 text-sky-500">•</span>
            {tip}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}
