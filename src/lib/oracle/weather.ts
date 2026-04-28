// =============================================================================
// NaKmetiji.si — Vreme-barometer
// Open-Meteo wrapper for Jože and the road-trip planner. Free, no API key,
// returns current conditions for the centroid of a Slovenian region. Maps
// WMO weather codes to a coarse signal (rain/snow/storm/clear_hot/etc.) that
// drives indoor-vs-outdoor recommendations.
//
// Caching: in-memory for 30 min per region. Per Vercel instance — fine for
// low-fanout. No Redis needed.
// =============================================================================

import type { Regija } from "@/types/database";
import * as Sentry from "@sentry/nextjs";

// Coarse centroid per region — good enough for "is it going to snow in Gorenjska?".
// Values are rounded to 2 decimals (~1 km precision).
const REGION_CENTROIDS: Record<Regija, { lat: number; lng: number }> = {
  gorenjska:              { lat: 46.35, lng: 14.10 }, // Bled-ish
  primorska:              { lat: 45.80, lng: 13.90 }, // Nova Gorica
  stajerska:              { lat: 46.55, lng: 15.65 }, // Maribor
  dolenjska:              { lat: 45.80, lng: 15.15 }, // Novo mesto
  koroska:                { lat: 46.50, lng: 14.85 }, // Slovenj Gradec
  savinjska:              { lat: 46.25, lng: 15.25 }, // Celje
  pomurska:               { lat: 46.65, lng: 16.20 }, // Murska Sobota
  notranjska:             { lat: 45.80, lng: 14.20 }, // Postojna
  zasavska:               { lat: 46.13, lng: 15.00 }, // Trbovlje
  posavska:               { lat: 45.95, lng: 15.50 }, // Krško
  jugovzhodna_slovenija:  { lat: 45.70, lng: 15.20 }, // Črnomelj-ish
  osrednjeslovenska:      { lat: 46.05, lng: 14.50 }, // Ljubljana
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WeatherSnapshot {
  region: Regija;
  summary: string;        // one-line Slovenian summary
  signal: WeatherSignal;  // a coarse tag we can match against farm vibes
  temp_c: number;
  wind_kmh: number;
  fetched_at: number;     // epoch ms
}

/**
 * Coarse weather signal Jože uses to pick matching farms/activities.
 * Kept small on purpose — dozens of micro-states would noise the prompt.
 */
export type WeatherSignal =
  | "snow"        // prefer: krušna peč, klet, zidanica, notranji prostor
  | "rain"        // prefer: notranja aktivnost, kulinarika, degustacija
  | "storm"       // prefer: strictly indoor
  | "fog"         // prefer: pomirjujoče, jutranja megla kot atmosfera
  | "clear_hot"   // prefer: bazen, senca, vino, jezero
  | "clear_mild"  // prefer: kolesarjenje, pohod, zunaj
  | "cold_clear"  // prefer: krušna peč, sauna, kamin
  | "cool_cloudy" // prefer: notranjost + kratek sprehod
  | "unknown";    // fallback — no signal

// ---------------------------------------------------------------------------
// Cache (per Node instance)
// ---------------------------------------------------------------------------

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 min
const _cache = new Map<Regija, WeatherSnapshot>();

function fresh(snap: WeatherSnapshot | undefined): snap is WeatherSnapshot {
  return !!snap && Date.now() - snap.fetched_at < CACHE_TTL_MS;
}

// ---------------------------------------------------------------------------
// Open-Meteo — Free, no API key, EU-hosted
// ---------------------------------------------------------------------------

interface OpenMeteoCurrent {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
    wind_speed_10m?: number;
  };
}

/**
 * Map a WMO weather code (https://open-meteo.com/en/docs#weathervariables)
 * plus a temperature to our coarse signal vocabulary.
 *  0      Clear sky
 *  1-3    Mostly clear / partly cloudy / overcast
 *  45,48  Fog
 *  51-67  Drizzle / rain (incl. freezing)
 *  71-77  Snow
 *  80-82  Rain showers
 *  85-86  Snow showers
 *  95-99  Thunderstorm
 */
function classify(om: OpenMeteoCurrent): { signal: WeatherSignal; tempC: number; windKmh: number } {
  const tempC = Math.round(om.current?.temperature_2m ?? 12);
  const windKmh = Math.round(om.current?.wind_speed_10m ?? 0);
  const code = om.current?.weather_code ?? 0;

  let signal: WeatherSignal = "unknown";

  if (code >= 95) signal = "storm";
  else if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) signal = "snow";
  else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) signal = "rain";
  else if (code === 45 || code === 48) signal = "fog";
  else if (code === 0 || code === 1) {
    if (tempC >= 26) signal = "clear_hot";
    else if (tempC <= 2) signal = "cold_clear";
    else signal = "clear_mild";
  } else if (code === 2 || code === 3) {
    signal = tempC <= 8 ? "cool_cloudy" : "clear_mild";
  }

  return { signal, tempC, windKmh };
}

const SIGNAL_SUMMARY_SL: Record<WeatherSignal, string> = {
  snow:        "sneženje, tla bela",
  rain:        "dež, mokra zemlja",
  storm:       "nevihtno, priporočen zavetje",
  fog:         "megla nad travniki",
  clear_hot:   "sončno in toplo",
  clear_mild:  "jasno, prijetno",
  cold_clear:  "jasno, mraz",
  cool_cloudy: "oblačno, sveže",
  unknown:     "vreme brez jasnega znamenja",
};

/**
 * Natural-language narrative Jože can weave in. Avoids numeric overload —
 * we pass `temp_c` separately for the prompt when needed.
 */
function narrate(signal: WeatherSignal, tempC: number, regionLabel: string): string {
  const base = SIGNAL_SUMMARY_SL[signal];
  return `V regiji ${regionLabel} se obeta: ${base} (okoli ${tempC}°C).`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch (or return cached) weather snapshot for a region. Never throws:
 * on any failure, returns a "unknown" snapshot that the prompt layer can
 * silently ignore.
 */
export async function getWeatherSnapshot(region: Regija): Promise<WeatherSnapshot> {
  const cached = _cache.get(region);
  if (fresh(cached)) return cached;

  const { lat, lng } = REGION_CENTROIDS[region];
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,wind_speed_10m&timezone=Europe%2FLjubljana`;

  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 4_000);
    const res = await fetch(url, { signal: ctrl.signal, next: { revalidate: 0 } });
    clearTimeout(to);

    if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
    const json = (await res.json()) as OpenMeteoCurrent;
    const { signal, tempC, windKmh } = classify(json);

    const regionLabel = region.replace(/_/g, " ");
    const snap: WeatherSnapshot = {
      region,
      summary: narrate(signal, tempC, regionLabel),
      signal,
      temp_c: tempC,
      wind_kmh: windKmh,
      fetched_at: Date.now(),
    };
    _cache.set(region, snap);
    return snap;
  } catch (err) {
    Sentry.captureMessage("weather fetch failed", {
      level: "warning",
      tags: { route: "oracle", area: "weather" },
      extra: { region, err: err instanceof Error ? err.message : String(err) },
    });
    const fallback: WeatherSnapshot = {
      region,
      summary: "Vreme trenutno ni na voljo.",
      signal: "unknown",
      temp_c: 12,
      wind_kmh: 0,
      fetched_at: Date.now(),
    };
    _cache.set(region, fallback);
    return fallback;
  }
}

/**
 * Build a compact system-prompt snippet Jože can use to match farm vibes
 * to the forecast. Safe to call unconditionally — returns "" when region
 * is null or the signal is unknown.
 */
export async function getWeatherContext(region: Regija | null): Promise<string> {
  if (!region) return "";
  const snap = await getWeatherSnapshot(region);
  if (snap.signal === "unknown") return "";

  const preference = WEATHER_PREFERENCE_HINT[snap.signal];
  return `
VREMENSKI SIGNAL (za to regijo, uporabi naravno, en stavek):
${snap.summary}
Naravno nagnjenje: ${preference}
NE našteva vremena kot seznam — vplete ga v atmosferski uvod ali priporočilo
(npr. "ker se obeta sneg, ti predlagam zidanico s krušno pečjo...").`;
}

const WEATHER_PREFERENCE_HINT: Record<Exclude<WeatherSignal, "unknown">, string> = {
  snow:        "prednost kmetijam s krušno pečjo, zidanicami, notranjimi prostori, saunami.",
  rain:        "prednost notranji kulinariki, degustacijam v kleti, delavnicam, topli izbi.",
  storm:       "obvezno notranji program — degustacija v kleti, kuhanje pri ognjišču.",
  fog:         "atmosfera jutranje megle je priložnost — tihe domačije, sprehod po travniku.",
  clear_hot:   "prednost bazenom, senci, degustacijam v kleti (hladen prostor), jezeru.",
  clear_mild:  "prednost aktivnostim zunaj — kolesarjenje, pohod, piknik.",
  cold_clear:  "prednost ognjišču, kurišču, sauni, topli izbi; kozarec cvička ali vina.",
  cool_cloudy: "prednost kombinaciji notranjega programa in kratkih sprehodov; kulinarika.",
};
