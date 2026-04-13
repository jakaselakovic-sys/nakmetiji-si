// =============================================================================
// NaKmetiji.si — /api/weather?lat=&lng=
//
// Server-side proxy for Open-Meteo with Vercel Data Cache (1-hour revalidation).
// Moves weather fetching off the client to:
//   1. Enable CDN-level caching per coordinate (no per-user API hammering)
//   2. Keep Open-Meteo calls invisible to the browser
//   3. Share one cached response across all users viewing the same farm
//
// Cache key: rounded to 2 decimal places (~1 km precision) to maximise hit rate.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Round to 2 decimal places (~1.1 km) for cache sharing between nearby viewers
function round2(n: number): string {
  return n.toFixed(2);
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const latRaw = parseFloat(searchParams.get("lat") ?? "");
  const lngRaw = parseFloat(searchParams.get("lng") ?? "");

  if (isNaN(latRaw) || isNaN(lngRaw) ||
      latRaw < -90 || latRaw > 90 || lngRaw < -180 || lngRaw > 180) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  const lat = round2(latRaw);
  const lng = round2(lngRaw);

  const params = new URLSearchParams({
    latitude:  lat,
    longitude: lng,
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "precipitation",
      "weather_code",
      "wind_speed_10m",
      "wind_direction_10m",
      "uv_index",
    ].join(","),
    daily: [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_probability_max",
      "precipitation_sum",
    ].join(","),
    timezone: "Europe/Ljubljana",
    forecast_days: "7",
  });

  const upstream = await fetch(
    `https://api.open-meteo.com/v1/forecast?${params}`,
    {
      // Vercel Data Cache: 1-hour TTL, stale-while-revalidate 6 hours
      next: { revalidate: 3600 },
    }
  );

  if (!upstream.ok) {
    return NextResponse.json(
      { error: "Weather service unavailable" },
      { status: 502 }
    );
  }

  const data = await upstream.json();

  return NextResponse.json(data, {
    headers: {
      // Browser cache: 30 minutes. CDN has already done the heavy caching.
      "Cache-Control": "public, max-age=1800, stale-while-revalidate=3600",
    },
  });
}
