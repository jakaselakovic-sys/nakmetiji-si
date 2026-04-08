"use client";

// =============================================================================
// NaKmetiji.si — Weather Widget
// Prikazuje trenutno vreme in 7-dnevno napoved za lokacijo kmetije
// =============================================================================

import { useEffect, useState } from "react";
import {
  fetchWeather,
  windDirLabel,
  uvLabel,
  shortDay,
  type WeatherData,
} from "@/lib/weather";

interface WeatherWidgetProps {
  lat: number;
  lng: number;
  compact?: boolean; // compact = manjša verzija za InfoCard
}

// ─── Skeleton ──────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-earth-200/60 ${className ?? ""}`}
    />
  );
}

// ─── Full widget ───────────────────────────────────────────────────────────

export function WeatherWidget({ lat, lng, compact = false }: WeatherWidgetProps) {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchWeather(lat, lng).then((w) => {
      if (!cancelled) {
        setData(w);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [lat, lng]);

  if (loading) {
    return (
      <div className="space-y-2 py-1">
        <Skeleton className="h-10 w-3/4" />
        <div className="flex gap-2">
          <Skeleton className="h-7 flex-1" />
          <Skeleton className="h-7 flex-1" />
          <Skeleton className="h-7 flex-1" />
        </div>
        {!compact && (
          <div className="flex gap-1.5 mt-1">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-16 flex-1" />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (!data) return null;

  const { current, daily } = data;

  return (
    <div className="space-y-2.5">
      {/* Current conditions header */}
      <div className="flex items-center gap-2">
        <span className="text-3xl leading-none" aria-hidden="true">
          {current.emoji}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5">
            <span className="text-[22px] font-bold text-forest-900 leading-none">
              {current.temp}°C
            </span>
            <span className="text-[11px] text-earth-500 font-medium">
              občutek {current.feelsLike}°
            </span>
          </div>
          <p className="text-[12px] font-semibold text-forest-700 truncate">
            {current.label}
          </p>
        </div>
        {current.isGood && (
          <span className="flex-shrink-0 text-[10px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
            ✓ Lepo
          </span>
        )}
      </div>

      {/* Stat grid: wind / humidity / UV */}
      <div className="grid grid-cols-3 gap-1.5">
        <div className="rounded-xl bg-sky-50 border border-sky-100 px-2 py-1.5 text-center">
          <p className="text-[10px] text-sky-500 font-medium mb-0.5">Veter</p>
          <p className="text-[12px] font-bold text-sky-800">
            {current.windSpeed} km/h
          </p>
          <p className="text-[10px] text-sky-500">
            {windDirLabel(current.windDir)}
          </p>
        </div>
        <div className="rounded-xl bg-blue-50 border border-blue-100 px-2 py-1.5 text-center">
          <p className="text-[10px] text-blue-500 font-medium mb-0.5">Vlaga</p>
          <p className="text-[12px] font-bold text-blue-800">
            {current.humidity}%
          </p>
        </div>
        <div className="rounded-xl bg-amber-50 border border-amber-100 px-2 py-1.5 text-center">
          <p className="text-[10px] text-amber-500 font-medium mb-0.5">UV</p>
          <p className="text-[12px] font-bold text-amber-800">
            {current.uvIndex}
          </p>
          <p className="text-[10px] text-amber-500">{uvLabel(current.uvIndex)}</p>
        </div>
      </div>

      {/* 7-day forecast strip (hidden in compact mode) */}
      {!compact && (
        <div className="flex gap-1">
          {daily.slice(0, 7).map((day, i) => (
            <div
              key={day.date}
              className={`flex-1 flex flex-col items-center gap-0.5 rounded-xl py-2 px-0.5 text-center transition-colors ${
                i === 0
                  ? "bg-forest-50 border border-forest-200"
                  : "bg-earth-50/60 border border-earth-100"
              }`}
            >
              <p
                className={`text-[9px] font-bold uppercase tracking-wide ${
                  i === 0 ? "text-forest-700" : "text-earth-500"
                }`}
              >
                {i === 0 ? "Danes" : shortDay(day.date)}
              </p>
              <span className="text-[15px] leading-none my-0.5">{day.emoji}</span>
              <p className="text-[10px] font-bold text-forest-800">{day.tempMax}°</p>
              <p className="text-[9px] text-earth-400">{day.tempMin}°</p>
              {day.precipProb > 20 && (
                <p className="text-[9px] text-blue-500 font-medium">
                  {day.precipProb}%
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Precipitation note */}
      {current.precipitation > 0 && (
        <p className="text-[11px] text-blue-600 font-medium">
          💧 Padavine zadnjo uro: {current.precipitation} mm
        </p>
      )}
    </div>
  );
}
