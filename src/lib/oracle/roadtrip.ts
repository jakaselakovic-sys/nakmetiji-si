// =============================================================================
// NaKmetiji.si — Jožetov Road Trip planner v3.0
//
// v3 over v2: real multi-day itineraries.
//   - Multi-night stays per farm (e.g. 5 days / 2 farms → 3 nights + 2 nights).
//   - Per-day activity timeline: 4–6 timed blocks (jutro/opoldne/popoldne/večer).
//   - Travel days vs activity days vs arrival/departure days.
//   - Landmarks distributed across multi-night stays (not crammed into day 1).
//   - Departure leg back to Ljubljana counted into total km/minutes.
//   - Real driving polyline pulled by the client from Mapbox Directions API.
//
// Caller workflow:
//   planRoadTrip({ regions, days, vibes, maxGostov }) → Itinerary
// =============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Regija } from "@/types/database";
import { getDriveMinutesMatrix, classifyProximity } from "@/lib/oracle/matrix";
import { getWeatherSnapshot } from "@/lib/oracle/weather";
import type { WeatherSignal, WeatherSnapshot } from "@/lib/oracle/weather";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RoadTripInput {
  regions: Regija[];
  days?: number;
  vibes?: string[];
  maxGostov?: number;
  withDog?: boolean;
}

export type ActivityType =
  | "travel"        // driving from one place to another
  | "settle"        // arrive at farm, check in, unpack
  | "meal"          // breakfast / lunch / dinner
  | "landmark"      // visit a nearby znamenitost
  | "farm"          // farm-based dozivetje (vino tasting, baking, animals…)
  | "buffer"        // suggested mid-route stop
  | "free"          // free time / rest
  | "depart";       // checkout / heading home

export interface ActivityBlock {
  time_label: string;        // e.g. "Jutro", "Opoldne", "Popoldne", "Večer"
  time_hhmm: string;         // e.g. "09:00"
  duration_min: number;      // e.g. 90
  type: ActivityType;
  title: string;             // short headline
  description: string;       // 1-2 sentence narrative
  icon: string;              // emoji
  location: { lat: number; lng: number; name: string } | null;
  drive_minutes?: number;    // only for travel/buffer blocks
  drive_km?: number;
  distance_source?: "mapbox_matrix" | "estimated_haversine";
}

export interface FarmInfo {
  id: string;
  slug: string;
  ime: string;
  regija: Regija;
  kratki_opis: string | null;
  naslovna_slika: string;
  lat: number;
  lng: number;
  ocena: number | null;
  cena_noc: number | null;
  premium: boolean;
  dozivetja: { ime: string; slug: string }[];
}

export interface NearbyLandmark {
  ime: string;
  kategorija: string;
  razdalja_km: number;
  opis: string | null;
  lat: number;
  lng: number;
  drive_minutes: number | null;
  distance_source: "mapbox_matrix" | "estimated_haversine";
  proximity_type: "nearby" | "izletniška";
}

export interface BufferStop {
  type: "buffer";
  ime: string;
  kategorija: string;
  lat: number;
  lng: number;
  opis: string | null;
  razdalja_km: number;
  assumed_duration_min: 90;
}

export interface DayPlan {
  day: number;                 // 1-indexed
  date_offset_days: number;    // 0-indexed offset from start
  base_farm: FarmInfo;         // where the guest sleeps this night
  schedule: ActivityBlock[];   // 4–6 timed blocks for the day
  total_km: number;            // total driving km this day
  total_drive_minutes: number; // total driving minutes this day
  weather?: WeatherForecast;
  summary: string;             // one-line headline e.g. "Prihod & domača jed"
  is_arrival_day: boolean;     // true on day you first reach this farm
  is_transit_day: boolean;     // true on day you change farms
  is_departure_day: boolean;   // true on the final day (return to Ljubljana)
  drive_geometry: {
    from: { lat: number; lng: number; name: string };
    to: { lat: number; lng: number; name: string };
    via?: { lat: number; lng: number; name: string };  // buffer stop, if any
  } | null;
}

export interface WeatherForecast {
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
  nights: number;              // = days - 1 (return-day is not a night)
  created_at: string;
  vibes: string[];
  max_gostov: number | null;
  with_dog: boolean;
  circular: boolean;
  weather_forecast?: WeatherForecast[];
  packing_tips?: string[];
}

// ---------------------------------------------------------------------------
// Mojibake guard
// ---------------------------------------------------------------------------

const MOJIBAKE_FIXES: Array<[RegExp, string]> = [
  [/Ã„/g, "Ä"], [/Ã¤/g, "ä"],
  [/Ã–/g, "Ö"], [/Ã¶/g, "ö"],
  [/Ãœ/g, "Ü"], [/Ã¼/g, "ü"],
  [/Ã©/g, "é"], [/Ã¨/g, "è"],
  [/Å /g, "Š"], [/Å¡/g, "š"],
  [/Å½/g, "Ž"], [/Å¾/g, "ž"],
  [/ÄŒ/g, "Č"], [/Ä/g, "č"],
];

export function normalizeMojibake(s: string | null | undefined): string {
  if (!s) return s ?? "";
  if (!/[ÃÔÅ]/.test(s)) return s;
  let out = s;
  for (const [pat, rep] of MOJIBAKE_FIXES) out = out.replace(pat, rep);
  return out;
}

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

const LJUBLJANA = { lat: 46.05, lng: 14.51, name: "Ljubljana" };

function haversine(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function shortId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function estimateDriveMinutes(km: number): number {
  if (km <= 0) return 0;
  return Math.round((km / 70) * 60 + 10);
}

// ---------------------------------------------------------------------------
// SQL fetchers
// ---------------------------------------------------------------------------

interface RawFarm {
  id: string;
  slug: string;
  ime: string;
  regija: Regija;
  kratki_opis: string | null;
  naslovna_slika: string;
  lat: number | null;
  lng: number | null;
  ocena: number | null;
  cena_noc: number | null;
  premium: boolean;
  paket: import("@/types/database").KmetijaPaket | null;
  tier_rang: number;
  max_gostov: number | null;
  vibe_tags: string[];
  dozivetja: { ime: string; slug: string }[];
}

interface RawLandmark {
  ime: string;
  kategorija: string;
  lat: number;
  lng: number;
  opis: string | null;
  regija: Regija | null;
}

async function fetchCandidateFarmsByRegion(
  sb: SupabaseClient,
  region: Regija,
  input: RoadTripInput,
): Promise<RawFarm[]> {
  const selectFields = `
    id, slug, ime, regija, kratki_opis, naslovna_slika, lat, lng,
    ocena, cena_noc, premium, paket, tier_rang, max_gostov, vibe_tags,
    kmetija_dozivetje(dozivetja(ime, slug))
  `;

  let q = sb
    .from("kmetije")
    .select(selectFields)
    .eq("aktivna", true)
    .eq("regija", region)
    .not("lat", "is", null)
    .not("lng", "is", null)
    .order("tier_rang", { ascending: false })
    .order("premium", { ascending: false })
    .order("ocena", { ascending: false, nullsFirst: false })
    .limit(8);

  if (input.maxGostov) q = q.gte("max_gostov", input.maxGostov);

  const { data } = await q;
  if (!data) return [];

  return (data as unknown as Array<Record<string, unknown>>).map((r) => {
    const joinRows = (r.kmetija_dozivetje as Array<{ dozivetja: { ime: string; slug: string } }> | null) ?? [];
    return {
      id: r.id as string,
      slug: r.slug as string,
      ime: r.ime as string,
      regija: r.regija as Regija,
      kratki_opis: (r.kratki_opis as string) ?? null,
      naslovna_slika: r.naslovna_slika as string,
      lat: (r.lat as number) ?? null,
      lng: (r.lng as number) ?? null,
      ocena: (r.ocena as number) ?? null,
      cena_noc: (r.cena_noc as number) ?? null,
      premium: (r.premium as boolean) ?? false,
      paket: (r.paket as import("@/types/database").KmetijaPaket) ?? null,
      tier_rang: (r.tier_rang as number) ?? 0,
      max_gostov: (r.max_gostov as number) ?? null,
      vibe_tags: (r.vibe_tags as string[]) ?? [],
      dozivetja: joinRows
        .filter((kd) => kd.dozivetja)
        .map((kd) => kd.dozivetja),
    };
  });
}

async function fetchAllLandmarks(sb: SupabaseClient): Promise<RawLandmark[]> {
  const { data } = await sb
    .from("znamenitosti")
    .select("ime, kategorija, lat, lng, opis, regija");
  return (data as RawLandmark[] | null) ?? [];
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

function scoreCandidate(f: RawFarm, input: RoadTripInput): number {
  let score = 0;
  const vibeTags = f.vibe_tags ?? [];
  const dozSlugs = (f.dozivetja ?? []).map((d) => d.slug);

  if (input.vibes?.length) {
    score += vibeTags.filter((v) => input.vibes!.includes(v)).length * 3;
  }
  if (input.withDog && dozSlugs.includes("zivali")) score += 4;
  if (input.maxGostov && f.max_gostov && f.max_gostov >= input.maxGostov) score += 2;

  score += (f.ocena ?? 0) * 0.8;
  score += f.tier_rang * 10;
  return score;
}

// ---------------------------------------------------------------------------
// Weather + buffer-stop helpers
// ---------------------------------------------------------------------------

async function computeWeatherByRegion(
  farms: RawFarm[],
): Promise<Map<Regija, WeatherSnapshot>> {
  const regions = [...new Set(farms.map((f) => f.regija))];
  const map = new Map<Regija, WeatherSnapshot>();
  await Promise.all(
    regions.map(async (region) => {
      const snap = await getWeatherSnapshot(region);
      map.set(region, snap);
    }),
  );
  return map;
}

const INDOOR_KATEGORIE = new Set(["jama", "muzej"]);
const OUTDOOR_KATEGORIE = new Set(["slap", "gora", "pot", "jezero"]);
const BAD_WEATHER: Set<WeatherSignal> = new Set(["rain", "snow", "storm"]);

function findBufferStop(
  from: RawFarm,
  to: RawFarm,
  landmarks: RawLandmark[],
  weatherSignal: WeatherSignal,
): BufferStop | null {
  if (
    from.lat === null || from.lng === null ||
    to.lat === null || to.lng === null
  ) return null;

  const legKm = haversine(from.lat, from.lng, to.lat, to.lng);
  if (legKm < 30) return null;

  const midLat = (from.lat + to.lat) / 2;
  const midLng = (from.lng + to.lng) / 2;
  const prefersIndoor = BAD_WEATHER.has(weatherSignal);

  const candidates = landmarks
    .filter((z) => haversine(midLat, midLng, z.lat, z.lng) <= 25)
    .map((z) => {
      let score = 0;
      if (prefersIndoor && INDOOR_KATEGORIE.has(z.kategorija)) score += 10;
      else if (!prefersIndoor && OUTDOOR_KATEGORIE.has(z.kategorija)) score += 5;
      score -= haversine(midLat, midLng, z.lat, z.lng);
      return { z, score };
    })
    .sort((a, b) => b.score - a.score);

  if (candidates.length === 0) return null;

  const best = candidates[0].z;
  return {
    type: "buffer",
    ime: normalizeMojibake(best.ime),
    kategorija: best.kategorija,
    lat: best.lat,
    lng: best.lng,
    opis: normalizeMojibake(best.opis ?? "") || null,
    razdalja_km: Math.round(haversine(midLat, midLng, best.lat, best.lng) * 10) / 10,
    assumed_duration_min: 90,
  };
}

// ---------------------------------------------------------------------------
// TSP 2-opt — same as v2
// ---------------------------------------------------------------------------

function twoOptImprove(farms: RawFarm[]): RawFarm[] {
  if (farms.length <= 2) return farms;
  const n = farms.length;
  const result = [...farms];
  const nodeAt = (i: number) =>
    i >= 0 && i < n
      ? { lat: result[i].lat!, lng: result[i].lng! }
      : LJUBLJANA;

  let improved = true;
  while (improved) {
    improved = false;
    outer: for (let i = 0; i < n - 1; i++) {
      for (let j = i + 1; j < n; j++) {
        const d_current =
          haversine(nodeAt(i - 1).lat, nodeAt(i - 1).lng, nodeAt(i).lat, nodeAt(i).lng) +
          haversine(nodeAt(j).lat, nodeAt(j).lng, nodeAt(j + 1).lat, nodeAt(j + 1).lng);
        const d_proposed =
          haversine(nodeAt(i - 1).lat, nodeAt(i - 1).lng, nodeAt(j).lat, nodeAt(j).lng) +
          haversine(nodeAt(i).lat, nodeAt(i).lng, nodeAt(j + 1).lat, nodeAt(j + 1).lng);
        if (d_proposed < d_current - 0.01) {
          result.splice(i, j - i + 1, ...result.slice(i, j + 1).reverse());
          improved = true;
          break outer;
        }
      }
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Landmark enrichment per farm
// ---------------------------------------------------------------------------

const LANDMARK_PREFILTER_KM = 40;
const MAX_NEARBY_PER_FARM = 4;        // for distribution across multi-day stays
const MAX_IZLETNIŠKA_PER_FARM = 2;

async function enrichFarmWithLandmarks(
  farm: RawFarm,
  allLandmarks: RawLandmark[],
): Promise<NearbyLandmark[]> {
  if (farm.lat === null || farm.lng === null) return [];
  const farmCoord = { lat: farm.lat, lng: farm.lng };

  const candidates = allLandmarks.filter((z) => {
    const d = haversine(farmCoord.lat, farmCoord.lng, z.lat, z.lng);
    return d <= LANDMARK_PREFILTER_KM;
  });
  if (candidates.length === 0) return [];

  const driveTimes = await getDriveMinutesMatrix(
    farmCoord,
    candidates.map((z) => ({ lat: z.lat, lng: z.lng })),
  );

  const classified = candidates
    .map((z) => {
      const hKm = Math.round(haversine(farmCoord.lat, farmCoord.lng, z.lat, z.lng) * 10) / 10;
      const drive_minutes = driveTimes.get(`${z.lat},${z.lng}`) ?? null;
      const proximity_type = classifyProximity(drive_minutes, hKm);
      return { z, hKm, drive_minutes, proximity_type };
    })
    .filter((c) => c.proximity_type !== "daleč")
    .sort((a, b) => {
      const aMin = a.drive_minutes ?? Math.round((a.hKm / 70) * 60 + 10);
      const bMin = b.drive_minutes ?? Math.round((b.hKm / 70) * 60 + 10);
      return aMin - bMin;
    });

  const nearby = classified.filter((c) => c.proximity_type === "nearby")
    .slice(0, MAX_NEARBY_PER_FARM);
  const izletniška = classified.filter((c) => c.proximity_type === "izletniška")
    .slice(0, MAX_IZLETNIŠKA_PER_FARM);

  return [...nearby, ...izletniška].map((c) => ({
    ime: normalizeMojibake(c.z.ime),
    kategorija: c.z.kategorija,
    razdalja_km: c.hKm,
    opis: normalizeMojibake(c.z.opis ?? "") || null,
    lat: c.z.lat,
    lng: c.z.lng,
    drive_minutes: c.drive_minutes,
    distance_source: c.drive_minutes === null ? "estimated_haversine" : "mapbox_matrix",
    proximity_type: c.proximity_type as "nearby" | "izletniška",
  }));
}

// ---------------------------------------------------------------------------
// Night allocation — distribute total nights across farms
// ---------------------------------------------------------------------------

/**
 * Given totalNights and N farms, return how many nights to spend at each farm.
 * Strategy:
 *   - If totalNights <= N: take only the first totalNights farms, 1 night each.
 *   - If totalNights > N: distribute as evenly as possible, with the
 *     extra nights going to the first farms (which the TSP put first
 *     because they're closer/more central — "settle in early").
 */
function allocateNights(totalNights: number, farmCount: number): number[] {
  if (farmCount <= 0) return [];
  if (totalNights <= 0) return new Array(farmCount).fill(0);

  if (totalNights <= farmCount) {
    return new Array(totalNights).fill(1);
  }
  const base = Math.floor(totalNights / farmCount);
  const remainder = totalNights % farmCount;
  return Array.from({ length: farmCount }, (_, i) => base + (i < remainder ? 1 : 0));
}

// ---------------------------------------------------------------------------
// Activity scheduling per day
// ---------------------------------------------------------------------------

function timeBlock(hhmm: string, duration_min: number): { time_label: string; time_hhmm: string; duration_min: number } {
  const hour = parseInt(hhmm.split(":")[0], 10);
  let label = "Dopoldne";
  if (hour < 9) label = "Zgodaj zjutraj";
  else if (hour < 12) label = "Dopoldne";
  else if (hour < 14) label = "Opoldne";
  else if (hour < 17) label = "Popoldne";
  else if (hour < 20) label = "Zgodnji večer";
  else label = "Zvečer";
  return { time_label: label, time_hhmm: hhmm, duration_min };
}

function landmarkIcon(kat: string): string {
  return ({ slap: "💧", gora: "⛰️", pot: "🥾", muzej: "🏛️", jezero: "🏞️", jama: "🕳️" } as Record<string, string>)[kat] ?? "📍";
}

function farmDozivetjeBlock(farm: RawFarm, hhmm: string, weather: WeatherSignal | null): ActivityBlock | null {
  const dozMap: Record<string, { title: string; description: string; icon: string }> = {
    vino: { title: "Degustacija vin v kleti", description: "Domačin ti predstavi svoja vina in razloži, kako jih pridelujejo.", icon: "🍷" },
    kulinarika: { title: "Lokalna kuhinja", description: "Pogovor z gostiteljem ob domači jedi — tako jih jedo na kmetiji.", icon: "🍲" },
    delavnice: { title: "Domača delavnica", description: "Pridruži se gospodinji ali kmetu pri pripravi domačega izdelka.", icon: "🎨" },
    zivali: { title: "Med živalmi", description: "Pomoč pri kmečkih opravilih — pogled v hlev, krmljenje, paša.", icon: "🐄" },
    sport: { title: "Aktivnost na prostem", description: "Gostitelj predlaga pohodno ali kolesarsko traso s panoramskim razgledom.", icon: "🚴" },
    wellness: { title: "Sprostitev v sauni", description: "Topla voda, lesena sauna in tišina — popoln zaključek dneva.", icon: "🧖" },
    prenocisce: { title: "Mirno bivanje", description: "Izba s pogledom na podeželje — čas zase ali za branje.", icon: "🛏️" },
  };

  const slugs = farm.dozivetja.map((d) => d.slug);
  // In bad weather, prefer indoor activities
  const preferred = (BAD_WEATHER as Set<string>).has(weather ?? "")
    ? ["vino", "kulinarika", "delavnice", "wellness"]
    : ["sport", "zivali", "kulinarika", "vino"];

  for (const key of preferred) {
    if (slugs.includes(key) && dozMap[key]) {
      const m = dozMap[key];
      return {
        ...timeBlock(hhmm, 120),
        type: "farm",
        title: m.title,
        description: m.description,
        icon: m.icon,
        location: { lat: farm.lat!, lng: farm.lng!, name: farm.ime },
      };
    }
  }
  return null;
}

function landmarkBlock(z: NearbyLandmark, hhmm: string, durationOverride?: number): ActivityBlock {
  const baseDesc = z.opis ?? "Lokalna znamenitost — vredna ogleda.";
  const duration = durationOverride ?? (z.proximity_type === "izletniška" ? 180 : 120);
  return {
    ...timeBlock(hhmm, duration),
    type: "landmark",
    title: z.ime,
    description: baseDesc.slice(0, 160),
    icon: landmarkIcon(z.kategorija),
    location: { lat: z.lat, lng: z.lng, name: z.ime },
  };
}

function travelBlock(
  from: { name: string; lat: number; lng: number },
  to: { name: string; lat: number; lng: number },
  hhmm: string,
  drive_minutes: number,
  drive_km: number,
  distance_source: "mapbox_matrix" | "estimated_haversine",
): ActivityBlock {
  const prefix = distance_source === "mapbox_matrix" ? "" : "pribl. ";
  return {
    ...timeBlock(hhmm, drive_minutes),
    type: "travel",
    title: `Vožnja: ${from.name} → ${to.name}`,
    description: `${drive_km} km · ${prefix}${formatHm(drive_minutes)}.`,
    icon: "🚗",
    location: null,
    drive_minutes,
    drive_km,
    distance_source,
  };
}

function bufferBlock(b: BufferStop, hhmm: string): ActivityBlock {
  return {
    ...timeBlock(hhmm, b.assumed_duration_min),
    type: "buffer",
    title: `Postanek: ${b.ime}`,
    description: b.opis ?? "Predlagani postanek na poti — raztegnete noge.",
    icon: landmarkIcon(b.kategorija),
    location: { lat: b.lat, lng: b.lng, name: b.ime },
  };
}

function settleBlock(farm: RawFarm, hhmm: string): ActivityBlock {
  return {
    ...timeBlock(hhmm, 60),
    type: "settle",
    title: `Prihod: ${farm.ime}`,
    description: "Sprejem pri gostitelju, predaja ključev in razložitev po izbi.",
    icon: "🏡",
    location: { lat: farm.lat!, lng: farm.lng!, name: farm.ime },
  };
}

function mealBlock(kind: "breakfast" | "lunch" | "dinner", farm: RawFarm, hhmm: string): ActivityBlock {
  const map = {
    breakfast: { title: "Domač zajtrk", desc: "Sveže iz kmečke kuhinje — kruh, sir, jajca, marmelada in toplo mleko.", icon: "☕", dur: 60 },
    lunch:     { title: "Kosilo", desc: "Po izbiri: domača jed na kmetiji ali postanek v lokalni gostilni.", icon: "🍽️", dur: 75 },
    dinner:    { title: "Večerja na kmetiji", desc: "Topla domača kuhinja in pogovor z gostiteljem.", icon: "🍷", dur: 90 },
  };
  const m = map[kind];
  return {
    ...timeBlock(hhmm, m.dur),
    type: "meal",
    title: m.title,
    description: m.desc,
    icon: m.icon,
    location: { lat: farm.lat!, lng: farm.lng!, name: farm.ime },
  };
}

function freeEveningBlock(hhmm: string): ActivityBlock {
  return {
    ...timeBlock(hhmm, 120),
    type: "free",
    title: "Tihi večer",
    description: "Sprehod po vasi, branje na verandi ali pogled v zvezdnato nebo.",
    icon: "🌙",
    location: null,
  };
}

function departBlock(farm: RawFarm, hhmm: string): ActivityBlock {
  return {
    ...timeBlock(hhmm, 30),
    type: "depart",
    title: "Slovo & odhod",
    description: "Skledica jutranje kave, pogovor z gostiteljem, pakiranje.",
    icon: "👋",
    location: { lat: farm.lat!, lng: farm.lng!, name: farm.ime },
  };
}

// ---------------------------------------------------------------------------
// Day plan generation
// ---------------------------------------------------------------------------

interface DayContext {
  dayIndex: number;            // 0-indexed
  totalDays: number;
  baseFarm: RawFarm;
  baseLandmarks: NearbyLandmark[];  // landmarks for base farm
  landmarkOffset: number;      // which slice of baseLandmarks to use (rotates)
  prevFarm: RawFarm | null;    // farm where guest slept previous night
  nextFarm: RawFarm | null;    // farm where guest will sleep next night
  weatherSignal: WeatherSignal;
  driveFromPrevMinutes: number | null;
  driveFromPrevKm: number;
  driveToNextMinutes: number | null;
  driveToNextKm: number;
  bufferOnArrival: BufferStop | null;
  bufferOnDeparture: BufferStop | null;
  isFirstDay: boolean;         // very first day (departing from Ljubljana)
  isFinalDay: boolean;         // very last day (returning to Ljubljana)
  isTransitDay: boolean;       // changing farms on this day
  isArrivalDay: boolean;       // first day at this base farm
}

interface ScheduleResult {
  schedule: ActivityBlock[];
  summary: string;
  total_km: number;
  total_drive_min: number;
}

/**
 * Cumulative time-aware schedule builder. Each block is positioned by adding
 * the duration of the previous block to a cursor — no more hardcoded times
 * that can collide with travel duration.
 *
 * Day totals (km + drive min) are summed from every travel block we emit
 * (initial leg, landmark round-trips, return leg). This is what lets the
 * notebook's "vožnja danes: X km · Y h Z min" line tell the truth.
 */
function buildDaySchedule(ctx: DayContext): ScheduleResult {
  const blocks: ActivityBlock[] = [];
  let cursor = "08:30";
  let totalKm = 0;
  let totalDriveMin = 0;
  const farmLoc = { name: ctx.baseFarm.ime, lat: ctx.baseFarm.lat!, lng: ctx.baseFarm.lng! };

  function pushTravel(
    from: { name: string; lat: number; lng: number },
    to: { name: string; lat: number; lng: number },
    minutes: number,
    km: number,
    source: "mapbox_matrix" | "estimated_haversine",
  ) {
    blocks.push(travelBlock(from, to, cursor, minutes, Math.round(km * 10) / 10, source));
    cursor = addMinutes(cursor, minutes);
    totalKm += km;
    totalDriveMin += minutes;
  }

  function pushBlock(b: ActivityBlock) {
    blocks.push({ ...b, time_hhmm: cursor, time_label: timeBlock(cursor, b.duration_min).time_label });
    cursor = addMinutes(cursor, b.duration_min);
  }

  // ─── Day 1 — Ljubljana → first farm ───────────────────────────────────────
  if (ctx.isFirstDay) {
    cursor = "10:00";
    const driveMin = ctx.driveFromPrevMinutes ?? estimateDriveMinutes(ctx.driveFromPrevKm);
    pushTravel(LJUBLJANA, farmLoc, driveMin, ctx.driveFromPrevKm, ctx.driveFromPrevMinutes === null ? "estimated_haversine" : "mapbox_matrix");
    if (ctx.bufferOnArrival) {
      pushBlock(bufferBlock(ctx.bufferOnArrival, cursor));
    }
    pushBlock(settleBlock(ctx.baseFarm, cursor));
    // Snap dinner to 19:00 if we're earlier
    if (parseHHMM(cursor) < parseHHMM("19:00")) cursor = "19:00";
    pushBlock(mealBlock("dinner", ctx.baseFarm, cursor));
    if (parseHHMM(cursor) < parseHHMM("22:00")) {
      pushBlock(freeEveningBlock(cursor));
    }
    return { schedule: blocks, summary: `Prihod v ${ctx.baseFarm.regija.replace(/_/g, " ")}`, total_km: round1(totalKm), total_drive_min: totalDriveMin };
  }

  // ─── Final day — return to Ljubljana ──────────────────────────────────────
  if (ctx.isFinalDay) {
    pushBlock(mealBlock("breakfast", ctx.baseFarm, cursor));
    pushBlock(departBlock(ctx.baseFarm, cursor));
    if (ctx.bufferOnDeparture) {
      pushBlock(bufferBlock(ctx.bufferOnDeparture, cursor));
    }
    const driveMin = ctx.driveToNextMinutes ?? estimateDriveMinutes(ctx.driveToNextKm);
    pushTravel(farmLoc, LJUBLJANA, driveMin, ctx.driveToNextKm, ctx.driveToNextMinutes === null ? "estimated_haversine" : "mapbox_matrix");
    return { schedule: blocks, summary: "Odhod proti Ljubljani", total_km: round1(totalKm), total_drive_min: totalDriveMin };
  }

  // ─── Transit day — switch farms ───────────────────────────────────────────
  if (ctx.isTransitDay && ctx.prevFarm && ctx.driveFromPrevMinutes !== null) {
    const prevLoc = { name: ctx.prevFarm.ime, lat: ctx.prevFarm.lat!, lng: ctx.prevFarm.lng! };
    pushBlock(mealBlock("breakfast", ctx.prevFarm, cursor));
    pushBlock(departBlock(ctx.prevFarm, cursor));
    if (ctx.bufferOnArrival) {
      pushBlock(bufferBlock(ctx.bufferOnArrival, cursor));
    }
    pushTravel(prevLoc, farmLoc, ctx.driveFromPrevMinutes, ctx.driveFromPrevKm, "mapbox_matrix");
    pushBlock(settleBlock(ctx.baseFarm, cursor));
    if (parseHHMM(cursor) < parseHHMM("19:00")) cursor = "19:00";
    pushBlock(mealBlock("dinner", ctx.baseFarm, cursor));
    if (parseHHMM(cursor) < parseHHMM("22:00")) {
      pushBlock(freeEveningBlock(cursor));
    }
    return { schedule: blocks, summary: `Premik v ${ctx.baseFarm.regija.replace(/_/g, " ")}`, total_km: round1(totalKm), total_drive_min: totalDriveMin };
  }

  // ─── Activity day at the base farm ────────────────────────────────────────
  // Visit 1–2 landmarks (with explicit travel-to and travel-back blocks),
  // plus a farm dozivetje if there's room and the farm offers one.

  pushBlock(mealBlock("breakfast", ctx.baseFarm, cursor));

  const offset = ctx.landmarkOffset;
  const lm = ctx.baseLandmarks;
  const lm1 = lm[offset % Math.max(lm.length, 1)] ?? null;
  const lm2 = lm.length > 1 ? lm[(offset + 1) % lm.length] ?? null : null;

  let summary = `Dan na ${ctx.baseFarm.ime}`;
  const usedLM = new Set<string>();

  function visitLandmark(z: NearbyLandmark, isAfternoon: boolean) {
    if (!z || usedLM.has(z.ime)) return false;
    const driveMin = z.drive_minutes ?? estimateDriveMinutes(z.razdalja_km);
    const visitDur = z.proximity_type === "izletniška" ? 180 : 120;
    // Total time needed: driveTo + visit + driveBack
    const needed = driveMin * 2 + visitDur;
    const cushion = parseHHMM("18:30") - parseHHMM(cursor); // ensure we're back by 18:30
    if (needed > cushion) return false;

    const lmLoc = { name: z.ime, lat: z.lat, lng: z.lng };
    pushTravel(farmLoc, lmLoc, driveMin, z.razdalja_km, z.distance_source);
    pushBlock(landmarkBlock(z, cursor, visitDur));
    pushTravel(lmLoc, farmLoc, driveMin, z.razdalja_km, z.distance_source);
    usedLM.add(z.ime);
    if (!isAfternoon) summary = z.ime;
    return true;
  }

  // Morning slot
  let didMorning = false;
  if (lm1) didMorning = visitLandmark(lm1, false);
  if (!didMorning) {
    const dz = farmDozivetjeBlock(ctx.baseFarm, cursor, ctx.weatherSignal);
    if (dz) {
      pushBlock(dz);
      summary = dz.title;
    }
  }

  // Lunch — snap to 12:30 if we're earlier
  if (parseHHMM(cursor) < parseHHMM("12:30")) cursor = "12:30";
  pushBlock(mealBlock("lunch", ctx.baseFarm, cursor));

  // Afternoon slot
  let didAfternoon = false;
  if (lm2 && lm2 !== lm1) didAfternoon = visitLandmark(lm2, true);
  if (!didAfternoon) {
    const dz = farmDozivetjeBlock(ctx.baseFarm, cursor, ctx.weatherSignal);
    if (dz) pushBlock(dz);
  }

  // Dinner — snap to 19:00 if we're earlier, otherwise honor the cursor
  if (parseHHMM(cursor) < parseHHMM("19:00")) cursor = "19:00";
  pushBlock(mealBlock("dinner", ctx.baseFarm, cursor));

  // Free evening — only if we end before 22:00
  if (parseHHMM(cursor) < parseHHMM("22:00")) {
    pushBlock(freeEveningBlock(cursor));
  }

  return { schedule: blocks, summary, total_km: round1(totalKm), total_drive_min: totalDriveMin };
}

function parseHHMM(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function addMinutes(hhmm: string, m: number): string {
  const [h, mm] = hhmm.split(":").map(Number);
  const total = h * 60 + mm + m;
  const newH = Math.floor((total / 60) % 24);
  const newM = total % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}

export function formatHm(minutes: number): string {
  if (minutes <= 0) return "brez vožnje";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${m} min`;
}

// ---------------------------------------------------------------------------
// Drive-time computation between consecutive farms (and Ljubljana legs)
// ---------------------------------------------------------------------------

async function computeDriveMinutes(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): Promise<{ minutes: number | null; km: number }> {
  const km = haversine(from.lat, from.lng, to.lat, to.lng);
  const m = await getDriveMinutesMatrix(from, [to]);
  const minutes = m.get(`${to.lat},${to.lng}`) ?? null;
  return { minutes, km };
}

// ---------------------------------------------------------------------------
// Core planner
// ---------------------------------------------------------------------------

export async function planRoadTrip(
  sb: SupabaseClient,
  input: RoadTripInput,
): Promise<Itinerary> {
  if (input.regions.length === 0) {
    return emptyItinerary([], input);
  }

  // 1. Per region: best-scoring farm.
  const perRegionPick = new Map<Regija, RawFarm>();
  await Promise.all(
    input.regions.map(async (region) => {
      const candidates = await fetchCandidateFarmsByRegion(sb, region, input);
      if (candidates.length === 0) return;
      const scored = candidates
        .filter((f) => f.lat !== null && f.lng !== null)
        .map((f) => ({ farm: f, score: scoreCandidate(f, input) }))
        .sort((a, b) => b.score - a.score);
      if (scored.length > 0) perRegionPick.set(region, scored[0].farm);
    }),
  );

  if (perRegionPick.size === 0) {
    return emptyItinerary(input.regions, input);
  }

  // 2. Order farms via NN + 2-opt (Ljubljana as virtual start/end).
  const farmsArr = Array.from(perRegionPick.values());
  const nnOrdered: RawFarm[] = [];
  let current = farmsArr.reduce(
    (best, f) => {
      const d = haversine(LJUBLJANA.lat, LJUBLJANA.lng, f.lat ?? 0, f.lng ?? 0);
      return d < best.d ? { f, d } : best;
    },
    { f: farmsArr[0], d: Number.POSITIVE_INFINITY },
  ).f;
  nnOrdered.push(current);
  const remaining = farmsArr.filter((f) => f.id !== current.id);
  while (remaining.length > 0) {
    let bestIdx = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    for (let i = 0; i < remaining.length; i++) {
      const d = haversine(
        current.lat ?? 0, current.lng ?? 0,
        remaining[i].lat ?? 0, remaining[i].lng ?? 0,
      );
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    }
    current = remaining.splice(bestIdx, 1)[0];
    nnOrdered.push(current);
  }
  const ordered = twoOptImprove(nnOrdered);

  // 3. Allocate nights across farms.
  const totalDays = Math.min(Math.max(input.days ?? ordered.length + 1, 2), 14);
  // We need at least 1 night per farm to actually visit it. Cap farms used.
  const maxFarms = Math.min(ordered.length, totalDays - 1); // last day = return
  const usedFarms = ordered.slice(0, Math.max(1, maxFarms));
  const totalNights = totalDays - 1; // last day is travel-back
  const nightsPerFarm = allocateNights(totalNights, usedFarms.length);

  // 4. Parallel: drive matrix + landmarks + weather.
  const [allLandmarks, weatherByRegion] = await Promise.all([
    fetchAllLandmarks(sb),
    computeWeatherByRegion(usedFarms),
  ]);

  // Per-farm landmark enrichment (parallel).
  const farmLandmarks: NearbyLandmark[][] = await Promise.all(
    usedFarms.map((f) => enrichFarmWithLandmarks(f, allLandmarks)),
  );

  // 5. Build day-by-day schedule.
  const daily: DayPlan[] = [];
  let dayCounter = 1;

  // Track landmark offset per farm so multi-night stays rotate landmarks
  for (let farmIdx = 0; farmIdx < usedFarms.length; farmIdx++) {
    const baseFarm = usedFarms[farmIdx];
    const nights = nightsPerFarm[farmIdx];
    const isLastFarm = farmIdx === usedFarms.length - 1;
    const baseLM = farmLandmarks[farmIdx];
    const weather = weatherByRegion.get(baseFarm.regija);
    const weatherSignal = weather?.signal ?? "unknown";

    // Drive info from previous location (Ljubljana or previous farm)
    const fromCoord = farmIdx === 0
      ? LJUBLJANA
      : { lat: usedFarms[farmIdx - 1].lat!, lng: usedFarms[farmIdx - 1].lng! };
    const arrivalDrive = await computeDriveMinutes(
      fromCoord,
      { lat: baseFarm.lat!, lng: baseFarm.lng! },
    );
    const arrivalBuffer = farmIdx === 0
      ? null
      : findBufferStop(usedFarms[farmIdx - 1], baseFarm, allLandmarks, weatherSignal);

    for (let nightIdx = 0; nightIdx < nights; nightIdx++) {
      const isArrivalDay = nightIdx === 0;
      const isFirstDay = farmIdx === 0 && nightIdx === 0;
      const isTransitDay = isArrivalDay && farmIdx > 0;

      const ctx: DayContext = {
        dayIndex: dayCounter - 1,
        totalDays,
        baseFarm,
        baseLandmarks: baseLM,
        landmarkOffset: nightIdx * 2, // rotate 2 landmarks per night
        prevFarm: farmIdx > 0 && isArrivalDay ? usedFarms[farmIdx - 1] : null,
        nextFarm: !isLastFarm && nightIdx === nights - 1 ? usedFarms[farmIdx + 1] : null,
        weatherSignal,
        driveFromPrevMinutes: isArrivalDay ? arrivalDrive.minutes : 0,
        driveFromPrevKm: isArrivalDay ? arrivalDrive.km : 0,
        driveToNextMinutes: 0,
        driveToNextKm: 0,
        bufferOnArrival: isArrivalDay ? arrivalBuffer : null,
        bufferOnDeparture: null,
        isFirstDay,
        isFinalDay: false,
        isTransitDay,
        isArrivalDay,
      };

      const { schedule, summary, total_km, total_drive_min } = buildDaySchedule(ctx);

      daily.push({
        day: dayCounter,
        date_offset_days: dayCounter - 1,
        base_farm: toFarmInfo(baseFarm),
        schedule,
        total_km,
        total_drive_minutes: total_drive_min,
        weather: weather && weather.signal !== "unknown" ? {
          day: dayCounter,
          region: baseFarm.regija,
          signal: weather.signal,
          temp_c: weather.temp_c,
          summary: weather.summary,
        } : undefined,
        summary,
        is_arrival_day: isArrivalDay,
        is_transit_day: isTransitDay,
        is_departure_day: false,
        drive_geometry: isArrivalDay ? {
          from: farmIdx === 0
            ? LJUBLJANA
            : { lat: usedFarms[farmIdx - 1].lat!, lng: usedFarms[farmIdx - 1].lng!, name: usedFarms[farmIdx - 1].ime },
          to: { lat: baseFarm.lat!, lng: baseFarm.lng!, name: baseFarm.ime },
          via: arrivalBuffer ? { lat: arrivalBuffer.lat, lng: arrivalBuffer.lng, name: arrivalBuffer.ime } : undefined,
        } : null,
      });

      dayCounter++;
    }
  }

  // 6. Append a final return-to-Ljubljana day.
  const lastFarm = usedFarms[usedFarms.length - 1];
  const returnDrive = await computeDriveMinutes(
    { lat: lastFarm.lat!, lng: lastFarm.lng! },
    LJUBLJANA,
  );
  const returnBuffer = findBufferStop(
    lastFarm,
    { ...lastFarm, lat: LJUBLJANA.lat, lng: LJUBLJANA.lng } as RawFarm,
    allLandmarks,
    weatherByRegion.get(lastFarm.regija)?.signal ?? "unknown",
  );

  const finalCtx: DayContext = {
    dayIndex: dayCounter - 1,
    totalDays,
    baseFarm: lastFarm,
    baseLandmarks: farmLandmarks[usedFarms.length - 1],
    landmarkOffset: 0,
    prevFarm: null,
    nextFarm: null,
    weatherSignal: weatherByRegion.get(lastFarm.regija)?.signal ?? "unknown",
    driveFromPrevMinutes: null,
    driveFromPrevKm: 0,
    driveToNextMinutes: returnDrive.minutes,
    driveToNextKm: returnDrive.km,
    bufferOnArrival: null,
    bufferOnDeparture: returnBuffer,
    isFirstDay: false,
    isFinalDay: true,
    isTransitDay: false,
    isArrivalDay: false,
  };
  const { schedule: finalSched, summary: finalSummary, total_km: finalKm, total_drive_min: finalMin } = buildDaySchedule(finalCtx);
  daily.push({
    day: dayCounter,
    date_offset_days: dayCounter - 1,
    base_farm: toFarmInfo(lastFarm),
    schedule: finalSched,
    total_km: finalKm,
    total_drive_minutes: finalMin,
    summary: finalSummary,
    is_arrival_day: false,
    is_transit_day: false,
    is_departure_day: true,
    drive_geometry: {
      from: { lat: lastFarm.lat!, lng: lastFarm.lng!, name: lastFarm.ime },
      to: LJUBLJANA,
      via: returnBuffer ? { lat: returnBuffer.lat, lng: returnBuffer.lng, name: returnBuffer.ime } : undefined,
    },
  });

  // 7. Aggregate
  const totalKm = daily.reduce((s, d) => s + d.total_km, 0);
  const totalDriveMinutes = daily.reduce((s, d) => s + d.total_drive_minutes, 0);
  const weather_forecast: WeatherForecast[] = daily
    .filter((d) => d.weather)
    .map((d) => d.weather!);

  // Packing tips from weather signals
  const sigs = new Set(weather_forecast.map((w) => w.signal));
  const packing_tips: string[] = [];
  if (sigs.has("rain") || sigs.has("storm")) packing_tips.push("Dežnik in nepremočljiva obutev — počasno deževje na Slovenskem ni redko.");
  if (sigs.has("snow") || sigs.has("cold_clear")) packing_tips.push("Topla oblačila, kapa in zimska obutev.");
  if (sigs.has("clear_hot")) packing_tips.push("Sončna krema, klobuk in zračna oblačila.");
  if (sigs.has("fog") || sigs.has("cool_cloudy")) packing_tips.push("Lažja jakna za sveža jutra.");
  if (packing_tips.length === 0) packing_tips.push("Večplastna oblačila — vreme se na podeželju lahko spremeni hitro.");

  return {
    id: shortId(),
    regions: input.regions,
    daily,
    total_km: Math.round(totalKm * 10) / 10,
    total_drive_minutes: totalDriveMinutes,
    days: daily.length,
    nights: totalNights,
    created_at: new Date().toISOString(),
    vibes: input.vibes ?? [],
    max_gostov: input.maxGostov ?? null,
    with_dog: input.withDog ?? false,
    circular: true,
    weather_forecast,
    packing_tips,
  };
}

function toFarmInfo(f: RawFarm): FarmInfo {
  return {
    id: f.id,
    slug: f.slug,
    ime: normalizeMojibake(f.ime),
    regija: f.regija,
    kratki_opis: normalizeMojibake(f.kratki_opis ?? "") || null,
    naslovna_slika: f.naslovna_slika,
    lat: f.lat!,
    lng: f.lng!,
    ocena: f.ocena,
    cena_noc: f.cena_noc,
    premium: f.premium,
    dozivetja: f.dozivetja.map((d) => ({
      ime: normalizeMojibake(d.ime),
      slug: d.slug,
    })),
  };
}

function emptyItinerary(regions: Regija[], input: RoadTripInput): Itinerary {
  return {
    id: shortId(),
    regions,
    daily: [],
    total_km: 0,
    total_drive_minutes: 0,
    days: 0,
    nights: 0,
    created_at: new Date().toISOString(),
    vibes: input.vibes ?? [],
    max_gostov: input.maxGostov ?? null,
    with_dog: input.withDog ?? false,
    circular: false,
  };
}

// ---------------------------------------------------------------------------
// Display helpers (re-exported for client)
// ---------------------------------------------------------------------------

export function formatDriveTime(minutes: number): string {
  return formatHm(minutes);
}
