// =============================================================================
// NaKmetiji.si — Mapbox Directions Matrix wrapper
// Real driving times between coordinates. Used by the road trip planner so
// "1 h 25 min vožnje" is the actual road graph, not km/70 km/h estimate.
//
// Free tier: 100k Matrix requests / month. We make 1 call per planner run
// (1 source × N destinations). With ~30 plans/day = ~1k calls/month — safe.
//
// Behavior:
//   - getDriveMinutesMatrix(from, to[]) → Map<destKey, minutes | null>
//   - In-memory cache, 24h TTL — same plan replayed = 0 calls
//   - 6-second hard timeout — never blocks the planner
//   - On any failure: returns nulls for all destinations; caller falls back
//     to the existing km/70 km/h Haversine estimate
// =============================================================================

import * as Sentry from "@sentry/nextjs";

interface Coord {
  lat: number;
  lng: number;
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const HARD_TIMEOUT_MS = 6_000;
// Matrix endpoint cap is 25 coords per call (1 source + 24 destinations).
const MAX_COORDS_PER_CALL = 25;

interface CacheEntry {
  minutes: number;
  fetched_at: number;
}
const _cache = new Map<string, CacheEntry>();

function cacheKey(a: Coord, b: Coord): string {
  // Round to 4 decimals (~11 m precision) — enough for landmark/farm centroid.
  const r = (n: number) => n.toFixed(4);
  return `${r(a.lat)},${r(a.lng)}|${r(b.lat)},${r(b.lng)}`;
}

function fresh(e: CacheEntry | undefined): e is CacheEntry {
  return !!e && Date.now() - e.fetched_at < CACHE_TTL_MS;
}

function getToken(): string | null {
  // Server-side prefers MAPBOX_ACCESS_TOKEN; falls back to public for
  // dev convenience. Mapbox accepts the same format on either.
  return (
    process.env.MAPBOX_ACCESS_TOKEN ??
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ??
    null
  );
}

interface MatrixResponse {
  durations?: Array<Array<number | null>>; // seconds
  code?: string;
  message?: string;
}

/**
 * Fetch driving times in minutes from one origin to many destinations.
 *
 * Returns a Map keyed by `lat,lng` of each destination. Missing values mean
 * "no route found" (rare but possible across borders/islands). Caller decides
 * how to fall back.
 *
 * Never throws. Logs to Sentry on upstream failures.
 */
export async function getDriveMinutesMatrix(
  origin: Coord,
  destinations: Coord[],
): Promise<Map<string, number | null>> {
  const out = new Map<string, number | null>();
  if (destinations.length === 0) return out;

  // 1. Pull cached values; collect uncached for the network call.
  const uncached: Coord[] = [];
  for (const d of destinations) {
    const k = cacheKey(origin, d);
    const c = _cache.get(k);
    if (fresh(c)) {
      out.set(`${d.lat},${d.lng}`, c.minutes);
    } else {
      uncached.push(d);
    }
  }
  if (uncached.length === 0) return out;

  const token = getToken();
  if (!token) {
    // No token — caller falls back. Set null for the misses so they don't
    // get retried on every planner pass.
    for (const d of uncached) out.set(`${d.lat},${d.lng}`, null);
    return out;
  }

  // 2. Mapbox Matrix supports up to 25 coords per call (1 src + 24 dst).
  // Chunk if we have more.
  const chunks: Coord[][] = [];
  for (let i = 0; i < uncached.length; i += MAX_COORDS_PER_CALL - 1) {
    chunks.push(uncached.slice(i, i + (MAX_COORDS_PER_CALL - 1)));
  }

  for (const chunk of chunks) {
    const ok = await fetchChunk(token, origin, chunk, out);
    if (!ok) {
      // Single failure: mark this chunk's destinations as null and continue.
      for (const d of chunk) out.set(`${d.lat},${d.lng}`, null);
    }
  }

  return out;
}

async function fetchChunk(
  token: string,
  origin: Coord,
  destinations: Coord[],
  out: Map<string, number | null>,
): Promise<boolean> {
  // Mapbox URL: lng,lat semicolon-separated. Source is index 0; sources=0 limits
  // the matrix to source→destinations rather than the full N×N.
  const allCoords = [origin, ...destinations];
  const coordStr = allCoords.map((c) => `${c.lng},${c.lat}`).join(";");
  const destIndices = destinations.map((_, i) => i + 1).join(";");

  const url =
    `https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${coordStr}` +
    `?sources=0&destinations=${destIndices}&annotations=duration&access_token=${token}`;

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), HARD_TIMEOUT_MS);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(t);

    if (!res.ok) {
      Sentry.captureMessage(`Mapbox Matrix ${res.status}`, {
        level: "warning",
        tags: { route: "matrix" },
      });
      return false;
    }
    const json = (await res.json()) as MatrixResponse;
    if (!json.durations || !json.durations[0]) return false;

    const row = json.durations[0]; // single source → durations[0] = array of durations to destinations
    destinations.forEach((d, i) => {
      const seconds = row[i];
      if (typeof seconds === "number" && Number.isFinite(seconds)) {
        const minutes = Math.round(seconds / 60);
        _cache.set(cacheKey(origin, d), { minutes, fetched_at: Date.now() });
        out.set(`${d.lat},${d.lng}`, minutes);
      } else {
        out.set(`${d.lat},${d.lng}`, null);
      }
    });
    return true;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      // Timeout — silent fallback, common case.
      return false;
    }
    Sentry.captureException(err, { tags: { route: "matrix" } });
    return false;
  }
}

/** Convenience: single origin → single destination. */
export async function getDriveMinutes(
  origin: Coord,
  destination: Coord,
): Promise<number | null> {
  const m = await getDriveMinutesMatrix(origin, [destination]);
  return m.get(`${destination.lat},${destination.lng}`) ?? null;
}

// ---------------------------------------------------------------------------
// Proximity classification — shared by oracle route + roadtrip planner
// ---------------------------------------------------------------------------

export type ProximityType = "nearby" | "izletniška" | "daleč";

/**
 * Classify a landmark by proximity based on actual drive time (Matrix-verified)
 * or a haversine-based estimate when Matrix is unavailable.
 *
 *   ≤ 30 min → "nearby"      — show in standard "V bližini" section
 *   31–90 min → "izletniška"  — show as optional day-trip suggestion
 *   > 90 min → "daleč"        — discard; not relevant for this stop
 *
 * The 30-min boundary reflects a comfortable detour for a farm guest.
 * Haversine ≤ 25 km in flat terrain often ≤ 30 min. But a 15 km haversine
 * across a mountain pass can easily be 70 min — hence Matrix takes precedence.
 */
export function classifyProximity(
  drive_minutes: number | null,
  fallback_haversine_km: number,
): ProximityType {
  const minutes =
    drive_minutes !== null
      ? drive_minutes
      : Math.round((fallback_haversine_km / 70) * 60 + 10);
  if (minutes <= 30) return "nearby";
  if (minutes <= 90) return "izletniška";
  return "daleč";
}
