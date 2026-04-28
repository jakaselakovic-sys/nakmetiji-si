// =============================================================================
// NaKmetiji.si — Reverse Farm Discovery
// "Kmetije v bližini kraja / znamenitosti"
//
// GET /api/kmetije/bliznje?q=Bled
// GET /api/kmetije/bliznje?lat=46.37&lng=14.11
// GET /api/kmetije/bliznje?znamenitost=Postojnska%20jama
//
// Returns farms ordered by geographic distance with the Haversine formula,
// biased by rating + premium (quality tie-breaker, not distance override).
//
// Resolution strategy:
//   1. Explicit (lat,lng) — used as-is
//   2. ?znamenitost= — looks up znamenitosti by ime (case-insensitive prefix)
//   3. ?q= — tries municipality (kmetije.obcina), then landmark, then region
//   Fails with 404 if nothing resolves — never silently returns all farms.
// =============================================================================

import { NextRequest } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { RelaxedCoordSchema, isInsideSlovenia } from "@/lib/geo/coords";
import * as Sentry from "@sentry/nextjs";


const MAX_RESULTS = 12;
const DEFAULT_RADIUS_KM = 40;

// ---------------------------------------------------------------------------
// Haversine
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Resolver: q → (lat, lng, label)
// ---------------------------------------------------------------------------

interface ResolvedOrigin {
  lat: number;
  lng: number;
  label: string;
  source: "explicit" | "znamenitost" | "obcina";
}

async function resolveOrigin(
  req: NextRequest,
): Promise<ResolvedOrigin | null> {
  const sp = req.nextUrl.searchParams;
  const latRaw = sp.get("lat");
  const lngRaw = sp.get("lng");

  // 1. Explicit coords
  if (latRaw !== null && lngRaw !== null) {
    const parsed = RelaxedCoordSchema.safeParse({
      lat: Number(latRaw),
      lng: Number(lngRaw),
    });
    if (!parsed.success) return null;
    if (!isInsideSlovenia(parsed.data.lat, parsed.data.lng)) return null;
    return { ...parsed.data, label: "vaša lokacija", source: "explicit" };
  }

  const sb = await createSupabaseServer();

  // 2. Landmark name (case-insensitive prefix)
  const znamenitost = sp.get("znamenitost") ?? sp.get("q");
  if (znamenitost) {
    const { data } = await sb
      .from("znamenitosti")
      .select("ime, lat, lng")
      .ilike("ime", `${znamenitost}%`)
      .not("lat", "is", null)
      .not("lng", "is", null)
      .limit(1)
      .maybeSingle();
    if (data && data.lat !== null && data.lng !== null) {
      return {
        lat: data.lat as number,
        lng: data.lng as number,
        label: data.ime as string,
        source: "znamenitost",
      };
    }
  }

  // 3. Fallback: municipality match — we use the centroid of any active farm
  // in that obcina as the origin. Lightweight — no gazetteer required.
  const q = sp.get("q");
  if (q) {
    const { data } = await sb
      .from("kmetije")
      .select("obcina, lat, lng")
      .eq("aktivna", true)
      .ilike("obcina", `${q}%`)
      .not("lat", "is", null)
      .not("lng", "is", null)
      .limit(5);
    if (data && data.length > 0) {
      const avgLat =
        data.reduce((s, r) => s + (r.lat as number), 0) / data.length;
      const avgLng =
        data.reduce((s, r) => s + (r.lng as number), 0) / data.length;
      return {
        lat: avgLat,
        lng: avgLng,
        label: (data[0].obcina as string) ?? q,
        source: "obcina",
      };
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

interface FarmCandidate {
  id: string;
  slug: string;
  ime: string;
  kratki_opis: string | null;
  regija: string;
  obcina: string | null;
  naslovna_slika: string;
  ocena: number | null;
  stevilo_ocen: number | null;
  cena_noc: number | null;
  premium: boolean;
  lat: number | null;
  lng: number | null;
}

export async function GET(req: NextRequest) {
  const ip =
    req.headers.get("x-vercel-forwarded-for") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  const rl = await checkRateLimit(ip, "nearby-farms", 60, 3_600);
  if (!rl.ok) {
    return new Response(
      JSON.stringify({ error: "Preveč poizvedb. Poskusite kasneje." }),
      { status: 429, headers: { "Content-Type": "application/json" } },
    );
  }

  let origin: ResolvedOrigin | null;
  try {
    origin = await resolveOrigin(req);
  } catch (err) {
    Sentry.captureException(err, { tags: { route: "kmetije.bliznje", phase: "resolve" } });
    return new Response(
      JSON.stringify({ error: "Lokacije nismo mogli razrešiti." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!origin) {
    return new Response(
      JSON.stringify({
        error:
          "Ne najdem tega kraja — poskusite z imenom občine, znamenitosti ali koordinatami.",
      }),
      { status: 404, headers: { "Content-Type": "application/json" } },
    );
  }

  const sp = req.nextUrl.searchParams;
  const radiusKm = Math.min(
    200,
    Math.max(5, Number(sp.get("radius")) || DEFAULT_RADIUS_KM),
  );

  // Fetch farms with lat/lng (the index on aktivna+lat+lng is applied).
  const sb = await createSupabaseServer();
  const { data: rawFarms, error } = await sb
    .from("kmetije")
    .select(
      "id, slug, ime, kratki_opis, regija, obcina, naslovna_slika, ocena, stevilo_ocen, cena_noc, premium, lat, lng",
    )
    .eq("aktivna", true)
    .not("lat", "is", null)
    .not("lng", "is", null);

  if (error) {
    Sentry.captureException(error, { tags: { route: "kmetije.bliznje", phase: "fetch" } });
    return new Response(
      JSON.stringify({ error: "Iskanje kmetij trenutno ni na voljo." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const farms = (rawFarms as FarmCandidate[]) ?? [];
  const scored = farms
    .map((f) => {
      const lat = f.lat;
      const lng = f.lng;
      if (lat === null || lng === null) return null;
      const distance_km = haversine(origin!.lat, origin!.lng, lat, lng);
      return { farm: f, distance_km };
    })
    .filter(
      (x): x is { farm: FarmCandidate; distance_km: number } =>
        x !== null && x.distance_km <= radiusKm,
    )
    // Rank: distance primary; quality kicker (premium +0 km, rating -0.2 km)
    .map((x) => ({
      ...x,
      rank_score:
        x.distance_km -
        (x.farm.premium ? 2 : 0) -
        ((x.farm.ocena ?? 0) - 3) * 0.5,
    }))
    .sort((a, b) => a.rank_score - b.rank_score)
    .slice(0, MAX_RESULTS);

  return new Response(
    JSON.stringify({
      origin: {
        lat: origin.lat,
        lng: origin.lng,
        label: origin.label,
        source: origin.source,
      },
      radius_km: radiusKm,
      count: scored.length,
      farms: scored.map(({ farm, distance_km }) => ({
        slug: farm.slug,
        ime: farm.ime,
        kratki_opis: farm.kratki_opis,
        regija: farm.regija,
        obcina: farm.obcina,
        naslovna_slika: farm.naslovna_slika,
        ocena: farm.ocena,
        stevilo_ocen: farm.stevilo_ocen,
        cena_noc: farm.cena_noc,
        premium: farm.premium,
        distance_km: Math.round(distance_km * 10) / 10,
      })),
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60, s-maxage=120",
      },
    },
  );
}
