// =============================================================================
// NaKmetiji.si — Geospatial validation
// Strict Zod schemas for all lat/lng data that crosses a trust boundary
// (admin form input, vendor self-service, CSV import, Oracle responses).
//
// Why a dedicated file:
//   - Slovenia's real-world bounding box is tight; anything outside it is
//     definitely data error (CSV drift, transposed lat↔lng, etc).
//   - A single source-of-truth schema prevents "45.1, 1394.88" from ever
//     reaching the map layer.
//
// Export:
//   - SloveniaCoordSchema      — strict (must be inside SI bbox)
//   - RelaxedCoordSchema        — permits any valid lat/lng globally
//   - verifyCoord(opts)         — optional Google Places cross-check
//     (no-op when GOOGLE_MAPS_API_KEY is absent; returns "unverified")
// =============================================================================

import { z } from "zod";

// ---------------------------------------------------------------------------
// Slovenia bounding box (generous — includes coastal waters + Alps)
// Tight enough to catch "data entered in wrong hemisphere" errors.
// Source: ARSO / Geodetska uprava national extent rounded up 0.02°.
// ---------------------------------------------------------------------------

export const SI_BBOX = {
  minLat: 45.35, maxLat: 46.90,
  minLng: 13.30, maxLng: 16.70,
} as const;

/** True iff (lat, lng) falls inside Slovenia's bounding box. */
export function isInsideSlovenia(lat: number, lng: number): boolean {
  return (
    lat >= SI_BBOX.minLat && lat <= SI_BBOX.maxLat &&
    lng >= SI_BBOX.minLng && lng <= SI_BBOX.maxLng
  );
}

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

/** Relaxed — accepts any lat/lng pair on Earth. */
export const RelaxedCoordSchema = z.object({
  lat: z.number().finite().min(-90).max(90),
  lng: z.number().finite().min(-180).max(180),
});

/**
 * Strict — must fall inside Slovenia's bounding box. Use this for kmetije,
 * znamenitosti, and any CRUD path whose domain is exclusively Slovenian.
 */
export const SloveniaCoordSchema = RelaxedCoordSchema.refine(
  (p) => isInsideSlovenia(p.lat, p.lng),
  {
    message: `Koordinati morata biti znotraj Slovenije (lat ${SI_BBOX.minLat}–${SI_BBOX.maxLat}, lng ${SI_BBOX.minLng}–${SI_BBOX.maxLng}).`,
  },
);

/** Object that carries optional coords (many farms are entered without). */
export const OptionalSloveniaCoordSchema = z
  .object({
    lat: z.number().finite().min(-90).max(90).nullable(),
    lng: z.number().finite().min(-180).max(180).nullable(),
  })
  .refine(
    (p) =>
      (p.lat === null && p.lng === null) ||
      (p.lat !== null && p.lng !== null && isInsideSlovenia(p.lat, p.lng)),
    { message: "Če sta podani, morata biti oba in znotraj Slovenije." },
  );

// ---------------------------------------------------------------------------
// Safe coercion — strips bad rows from a list without throwing.
// Use this when you want "filter out invalid entries" rather than "reject
// the whole batch". Typical use: import-time cleanup.
// ---------------------------------------------------------------------------

export function filterValidCoords<T extends { lat: number | null; lng: number | null }>(
  rows: T[],
): T[] {
  return rows.filter(
    (r) =>
      r.lat !== null &&
      r.lng !== null &&
      Number.isFinite(r.lat) &&
      Number.isFinite(r.lng) &&
      isInsideSlovenia(r.lat, r.lng),
  );
}

// ---------------------------------------------------------------------------
// Optional Google Places cross-reference
// No-op unless GOOGLE_MAPS_API_KEY is set — lets the gate exist in code
// without binding us to a third-party billed dependency.
// ---------------------------------------------------------------------------

export type VerifyResult =
  | { status: "verified"; confidence: "high" | "medium" | "low"; source: "google_places" }
  | { status: "unverified"; reason: "no_key" | "not_found" | "upstream_error" | "rate_limited" }
  | { status: "mismatch"; placeName: string; placeLat: number; placeLng: number; distance_km: number };

/**
 * Cross-reference a (lat, lng) pair against Google Places to catch drift.
 * Returns `unverified / no_key` when the API key is not configured, so the
 * caller can treat "no key" as non-blocking in dev and as a warn-only signal
 * in production.
 *
 * Gives the caller a structured answer — never throws, never silently passes.
 */
export async function verifyCoord(opts: {
  lat: number;
  lng: number;
  expectedName?: string; // if provided, we compare name similarity
  radiusM?: number;      // how close the returned place must be (default 200m)
}): Promise<VerifyResult> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return { status: "unverified", reason: "no_key" };

  const radius = opts.radiusM ?? 200;
  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
  );
  url.searchParams.set("location", `${opts.lat},${opts.lng}`);
  url.searchParams.set("radius", String(radius));
  url.searchParams.set("key", key);
  if (opts.expectedName) url.searchParams.set("keyword", opts.expectedName);

  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 4_000);
    const res = await fetch(url.toString(), { signal: ctrl.signal });
    clearTimeout(to);

    if (res.status === 429) return { status: "unverified", reason: "rate_limited" };
    if (!res.ok) return { status: "unverified", reason: "upstream_error" };

    const json = (await res.json()) as {
      status?: string;
      results?: Array<{ name: string; geometry: { location: { lat: number; lng: number } } }>;
    };

    if (json.status === "ZERO_RESULTS" || !json.results?.length) {
      return { status: "unverified", reason: "not_found" };
    }

    const hit = json.results[0];
    const dKm = haversine(opts.lat, opts.lng, hit.geometry.location.lat, hit.geometry.location.lng);
    if (dKm * 1000 > radius * 2) {
      return {
        status: "mismatch",
        placeName: hit.name,
        placeLat: hit.geometry.location.lat,
        placeLng: hit.geometry.location.lng,
        distance_km: Math.round(dKm * 100) / 100,
      };
    }
    const confidence: "high" | "medium" | "low" =
      dKm * 1000 <= radius / 2 ? "high" : dKm * 1000 <= radius ? "medium" : "low";
    return { status: "verified", confidence, source: "google_places" };
  } catch {
    return { status: "unverified", reason: "upstream_error" };
  }
}

// Local Haversine — avoids pulling the Oracle route's copy into geo code
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
