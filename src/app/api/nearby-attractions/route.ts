// =============================================================================
// NaKmetiji.si — /api/nearby-attractions
// Combined verified-DB + Google Places "nearby" endpoint.
//
// GET /api/nearby-attractions?lat=46.37&lng=14.11
// GET /api/nearby-attractions?farm=kmetija-pr-jakob
//   &radius_m=30000 (default 30000)
//   &only_verified=true (default true — DB-only, skip Google)
//   &include_google=false (default false — set true to merge live Google Places)
//
// Response:
//   {
//     origin: { lat, lng, source: "explicit" | "farm" },
//     items: [
//       { name, category, lat, lng, distance_m, verified, source: "db"|"google" }
//     ],
//     summary: { db_count, google_count, total }
//   }
//
// Behavior:
//   - DB landmarks come from public.nearby_verified_landmarks RPC. Works
//     whether PostGIS is enabled or not (the RPC has a Haversine fallback).
//   - Google Places fetched only when GOOGLE_MAPS_API_KEY set AND
//     include_google=true. Otherwise stays DB-only — no upstream cost.
//   - Categories are mapped from Google `types[]` to our boutique buckets:
//       Naravna dediščina · Kulturni biseri · Skriti kotički · Kulinarika
// =============================================================================

import { NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { RelaxedCoordSchema, isInsideSlovenia } from "@/lib/geo/coords";
import * as Sentry from "@sentry/nextjs";

const DEFAULT_RADIUS_M = 30_000;
const MAX_RADIUS_M = 100_000;
const MAX_RESULTS = 12;

// ---------------------------------------------------------------------------
// Boutique category mapping
// ---------------------------------------------------------------------------

type BoutiqueCategory =
  | "Naravna dediščina"
  | "Kulturni biseri"
  | "Skriti kotički"
  | "Kulinarika"
  | "Drugo";

const GOOGLE_TYPE_MAP: Record<string, BoutiqueCategory> = {
  // Nature
  natural_feature: "Naravna dediščina",
  park:            "Naravna dediščina",
  campground:      "Naravna dediščina",
  // Culture
  museum:          "Kulturni biseri",
  art_gallery:     "Kulturni biseri",
  church:          "Kulturni biseri",
  place_of_worship:"Kulturni biseri",
  hindu_temple:    "Kulturni biseri",
  // Tourist generic
  tourist_attraction: "Skriti kotički",
  point_of_interest:  "Skriti kotički",
  // Food
  restaurant: "Kulinarika",
  cafe:       "Kulinarika",
  bakery:     "Kulinarika",
  food:       "Kulinarika",
};

const DB_KATEGORIJA_MAP: Record<string, BoutiqueCategory> = {
  slap:   "Naravna dediščina",
  gora:   "Naravna dediščina",
  jezero: "Naravna dediščina",
  jama:   "Naravna dediščina",
  pot:    "Skriti kotički",
  muzej:  "Kulturni biseri",
};

function mapGoogleTypes(types: string[]): BoutiqueCategory {
  for (const t of types) {
    const mapped = GOOGLE_TYPE_MAP[t];
    if (mapped) return mapped;
  }
  return "Drugo";
}

function mapDbKategorija(k: string): BoutiqueCategory {
  return DB_KATEGORIJA_MAP[k] ?? "Drugo";
}

// ---------------------------------------------------------------------------
// Origin resolution
// ---------------------------------------------------------------------------

interface ResolvedOrigin {
  lat: number;
  lng: number;
  source: "explicit" | "farm";
  farm_name?: string;
}

async function resolveOrigin(req: NextRequest): Promise<ResolvedOrigin | null> {
  const sp = req.nextUrl.searchParams;
  const farmSlug = sp.get("farm");
  const latRaw = sp.get("lat");
  const lngRaw = sp.get("lng");

  if (latRaw !== null && lngRaw !== null) {
    const parsed = RelaxedCoordSchema.safeParse({ lat: Number(latRaw), lng: Number(lngRaw) });
    if (!parsed.success || !isInsideSlovenia(parsed.data.lat, parsed.data.lng)) return null;
    return { ...parsed.data, source: "explicit" };
  }

  if (farmSlug) {
    const sb = await createSupabaseServer();
    const { data } = await sb
      .from("kmetije")
      .select("ime, lat, lng")
      .eq("slug", farmSlug)
      .eq("aktivna", true)
      .maybeSingle();
    if (data && data.lat !== null && data.lng !== null) {
      return {
        lat: data.lat as number,
        lng: data.lng as number,
        source: "farm",
        farm_name: (data.ime as string) ?? undefined,
      };
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// DB landmarks (PostGIS RPC, with Haversine fallback baked into the RPC)
// ---------------------------------------------------------------------------

interface DbLandmark {
  ime: string;
  kategorija: string;
  lat: number;
  lng: number;
  opis: string | null;
  zanimivost: string | null;
  distance_m: number;
  verification_status: string;
}

async function fetchDbLandmarks(
  lat: number,
  lng: number,
  radius_m: number,
  only_verified: boolean,
): Promise<DbLandmark[]> {
  const sb = await createSupabaseServer();
  const { data, error } = await sb.rpc("nearby_verified_landmarks", {
    farm_lat: lat,
    farm_lng: lng,
    radius_m,
    only_verified,
    max_results: MAX_RESULTS,
  });
  if (error) {
    Sentry.captureMessage(`nearby_verified_landmarks RPC failed: ${error.message}`, "error");
    return [];
  }
  return (data as DbLandmark[] | null) ?? [];
}

// ---------------------------------------------------------------------------
// Google Places (optional)
// ---------------------------------------------------------------------------

interface GooglePlaceMinimal {
  name: string;
  vicinity?: string;
  types?: string[];
  rating?: number;
  user_ratings_total?: number;
  geometry: { location: { lat: number; lng: number } };
}

async function fetchGooglePlaces(
  lat: number,
  lng: number,
  radius_m: number,
): Promise<GooglePlaceMinimal[]> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key) return [];

  const url = new URL(
    "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
  );
  url.searchParams.set("location", `${lat},${lng}`);
  url.searchParams.set("radius", String(Math.min(radius_m, 50_000)));
  url.searchParams.set("type", "tourist_attraction");
  url.searchParams.set("key", key);

  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 5_000);
    const res = await fetch(url.toString(), { signal: ctrl.signal });
    clearTimeout(to);
    if (!res.ok) return [];
    const json = (await res.json()) as { results?: GooglePlaceMinimal[] };
    return json.results ?? [];
  } catch (err) {
    Sentry.captureMessage("nearby-attractions: Google Places fetch failed", {
      level: "warning",
      extra: { err: err instanceof Error ? err.message : String(err) },
    });
    return [];
  }
}

function haversineMeters(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6_371_000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const ip =
    req.headers.get("x-vercel-forwarded-for") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  const rl = await checkRateLimit(ip, "nearby-attractions", 60, 3600);
  if (!rl.ok) {
    return new Response(JSON.stringify({ error: "Preveč poizvedb." }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  const origin = await resolveOrigin(req);
  if (!origin) {
    return new Response(
      JSON.stringify({
        error: "Ne najdem izhodišča — podaj ?farm=<slug> ali ?lat=&lng=.",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const sp = req.nextUrl.searchParams;
  const radius_m = Math.min(
    MAX_RADIUS_M,
    Math.max(1000, Number(sp.get("radius_m")) || DEFAULT_RADIUS_M),
  );
  const only_verified = sp.get("only_verified") !== "false"; // default true
  const include_google = sp.get("include_google") === "true"; // opt-in

  const [dbItems, googleItems] = await Promise.all([
    fetchDbLandmarks(origin.lat, origin.lng, radius_m, only_verified),
    include_google ? fetchGooglePlaces(origin.lat, origin.lng, radius_m) : Promise.resolve([]),
  ]);

  // Normalize into a single typed list
  const items = [
    ...dbItems.map((d) => ({
      name: d.ime,
      category: mapDbKategorija(d.kategorija),
      raw_kategorija: d.kategorija,
      lat: d.lat,
      lng: d.lng,
      distance_m: Math.round(d.distance_m),
      verified: d.verification_status === "verified",
      verification_status: d.verification_status,
      source: "db" as const,
      description: d.opis,
      curiosity: d.zanimivost,
    })),
    ...googleItems.map((g) => ({
      name: g.name,
      category: mapGoogleTypes(g.types ?? []),
      raw_kategorija: (g.types ?? [])[0] ?? "tourist_attraction",
      lat: g.geometry.location.lat,
      lng: g.geometry.location.lng,
      distance_m: Math.round(
        haversineMeters(origin.lat, origin.lng, g.geometry.location.lat, g.geometry.location.lng),
      ),
      verified: false,
      verification_status: "google_live",
      source: "google" as const,
      description: g.vicinity ?? null,
      curiosity: null,
      rating: g.rating ?? null,
    })),
  ]
    .sort((a, b) => a.distance_m - b.distance_m)
    .slice(0, MAX_RESULTS);

  return new Response(
    JSON.stringify({
      origin: {
        lat: origin.lat,
        lng: origin.lng,
        source: origin.source,
        farm_name: origin.farm_name ?? null,
      },
      radius_m,
      summary: {
        db_count: dbItems.length,
        google_count: googleItems.length,
        total: items.length,
        google_enabled: include_google && !!process.env.GOOGLE_MAPS_API_KEY,
      },
      items,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        // Short cache — landmarks don't move, but verification status can
        // flip after a purge run.
        "Cache-Control": "public, max-age=120, s-maxage=300",
      },
    },
  );
}
