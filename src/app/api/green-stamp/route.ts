// =============================================================================
// NaKmetiji.si — Green Passport: Zero-Trust Stamp Claim Endpoint
// POST /api/green-stamp
//
// Varnosti mehanizmi vgrajeni:
// 1. Upstash Redis Rate Limiting (po User ID-ju)
// 2. Geofencing Validation (± 200m tolerance za GPS)
// 3. HMAC Signature Validation (Preprečuje URL guessing)
// 4. PostgreSQL Atomic RPC (Preprečuje Double-Point Race Conditions)
// 5. Sentry Catching Errors (SRE Logging)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import { haversineKm } from "@/lib/haversine";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import * as Sentry from "@sentry/nextjs";
import crypto from "crypto";

 // Because of crypto node module

// Redis Rate Limiter (Fallback if ENV variables are missing for development)
let ratelimit: Ratelimit | null = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
  // Limit to 5 attempts per 10 minutes per User
  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "10 m"),
    analytics: true,
  });
}

// Tolerance in kilometers (200 meters)
const GEOFENCE_RADIUS_KM = 0.200;
// Ticket TTL — sig from /init must be used within 5 minutes
const TICKET_TTL_MS = 5 * 60 * 1000;
// Reject GPS fixes coarser than 50 m — indoor/VPN GPS typically reports >50 m
const MAX_GPS_ACCURACY_M = 50;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ status: "error", message: "Niste prijavljeni." }, { status: 401 });
    }

    // 1. RATE LIMITING
    if (ratelimit) {
      const { success } = await ratelimit.limit(`stamp_${user.id}`);
      if (!success) {
        // Log incident into DB if possible, or Sentry
        Sentry.captureMessage("Rate limit exceeded for green stamp", { extra: { userId: user.id } });
        return NextResponse.json({ status: "error", message: "Preveč poskusov. Poskusite kasneje." }, { status: 429 });
      }
    }

    const body = await req.json();
    const { farm: farmSlug, lat, lng, sig, ts, accuracy } = body;

    if (!farmSlug) {
      return NextResponse.json({ status: "error", message: "Kmetija ni določena." }, { status: 400 });
    }

    if (typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json({ status: "error", message: "Vaša GPS lokacija je obvezna." }, { status: 400 });
    }

    // V3 — GPS accuracy gate. navigator.geolocation.coords.accuracy is the 68%
    // confidence radius; >50 m usually means IP-geo fallback or indoor fix.
    if (typeof accuracy !== "number" || accuracy <= 0 || accuracy > MAX_GPS_ACCURACY_M) {
      Sentry.captureMessage("GPS accuracy too coarse", { extra: { userId: user.id, accuracy } });
      return NextResponse.json({
        status: "error",
        message: `Natančnost GPS signala je prenizka (${Math.round(accuracy ?? 0)}m). Premaknite se na prosto in poskusite znova.`,
      }, { status: 403 });
    }

    // V2 — ticket freshness gate. ts is issued by /api/green-stamp/init and
    // must be consumed within 5 min; prevents offline-queue replay and sig reuse.
    if (typeof ts !== "number" || !Number.isFinite(ts)) {
      return NextResponse.json({ status: "error", message: "Manjka časovni žig zahteve." }, { status: 400 });
    }
    const ticketAge = Date.now() - ts;
    if (ticketAge < -30_000 || ticketAge > TICKET_TTL_MS) {
      Sentry.captureMessage("Stale or future-dated stamp ticket", { extra: { userId: user.id, ticketAge } });
      return NextResponse.json({
        status: "error",
        message: "Povezava za žig je potekla. Skenirajte QR kodo znova.",
      }, { status: 403 });
    }

    // Look up farm details including secrets and coordinates
    const { data: farm, error: farmError } = await supabase
      .from("kmetije")
      .select("id, ime, slug, lat, lng, qr_secret_key")
      .eq("slug", farmSlug)
      .eq("aktivna", true)
      .single();

    if (farmError || !farm) {
       return NextResponse.json({ status: "error", message: "Kmetija ni najdena." }, { status: 404 });
    }

    // 2. HMAC SIGNATURE VALIDATION — sig binds slug to the ticket timestamp.
    if (!sig) {
      Sentry.captureMessage("Missing stamp signature", { extra: { userId: user.id, farmId: farm.id } });
      return NextResponse.json({ status: "error", message: "Žig je mogoče pridobiti samo s skeniranjem QR kode na kmetiji." }, { status: 403 });
    }
    if (!farm.qr_secret_key) {
      Sentry.captureMessage("Farm missing qr_secret_key", { extra: { farmSlug } });
      return NextResponse.json({ status: "error", message: "Kmetija nima aktivirane QR kode. Obrnite se na gostitelja." }, { status: 403 });
    }
    const expectedSig = crypto.createHmac("sha256", farm.qr_secret_key).update(`${farm.slug}|${ts}`).digest("hex");
    const sigBuf = Buffer.from(String(sig), "hex");
    const expectedBuf = Buffer.from(expectedSig, "hex");
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      Sentry.captureMessage("Invalid stamp signature", { extra: { userId: user.id, farmId: farm.id } });
      return NextResponse.json({ status: "error", message: "Neveljavna ali zastarela QR koda." }, { status: 403 });
    }

    // 3. GEOFENCING VALIDATION
    if (farm.lat && farm.lng) {
      const distance = haversineKm(lat, lng, farm.lat, farm.lng);
      if (distance > GEOFENCE_RADIUS_KM) {
        Sentry.captureMessage("Spoofing geofencing attempt", { 
          extra: { userId: user.id, farmId: farm.id, distance, lat, lng } 
        });
        return NextResponse.json({ 
          status: "error", 
          message: `Niste na lokaciji kmetije. (Razdalja: ${Math.round(distance * 1000)}m. Dovoljeno: 200m)` 
        }, { status: 403 });
      }

      // ── VELOCITY CHECK (Anti-Spoofing) ─────────────────────────────────────
      // Check the user's last stamp. If they moved faster than 150 km/h, it's likely a spoof.
      const { data: lastStamp } = await supabase
        .from("green_stamps")
        .select("ustvarjeno, kmetija:kmetija_id(lat, lng)")
        .eq("gost_id", user.id)
        .order("ustvarjeno", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastStamp?.kmetija) {
        const lastKmetija = Array.isArray(lastStamp.kmetija) ? lastStamp.kmetija[0] : lastStamp.kmetija;
        if (lastKmetija?.lat && lastKmetija?.lng) {
          const timeDiffHours = (Date.now() - new Date(lastStamp.ustvarjeno).getTime()) / 3_600_000;
          if (timeDiffHours > 0 && timeDiffHours < 24) {
            const distKm = haversineKm(farm.lat, farm.lng, lastKmetija.lat, lastKmetija.lng);
            const speedKmh = distKm / timeDiffHours;
            
            if (speedKmh > 150) {
              Sentry.captureMessage("Velocity check failed - spoofing likely", { 
                extra: { userId: user.id, speedKmh, distKm, timeDiffHours, farmId: farm.id } 
              });
              return NextResponse.json({ 
                status: "error", 
                message: "Zaznana je bila nenavadna lokacijska dejavnost (nemogoča hitrost potovanja). Zaradi zaščite proti zlorabam smo zahtevo zavrnili." 
              }, { status: 403 });
            }
          }
        }
      }
    } else {
        // If farm has no coords in DB, we skip strict geofencing, but we log a warning
        Sentry.captureMessage("Farm missing coordinates for geofencing", { extra: { farmSlug }});
    }

    // 4. ATOMIC POSTGRESQL TRANSACTION (RPC Call)
    // Invokes claim_green_stamp to prevent race conditions and double points
    const { data: rpcRes, error: rpcError } = await supabase.rpc("claim_green_stamp", {
      p_gost_id: user.id,
      p_kmetija_id: farm.id
    });

    if (rpcError) {
      // Fallback to direct insert. With the new per-week unique constraint
      // (uniq_green_stamp_per_week), a duplicate insert in the same week
      // raises 23505 — translate that to {duplicate} so the UI can react.
      console.warn("RPC failed or missing, falling back to manual insert:", rpcError);
      const { error: insertErr } = await supabase
        .from("green_stamps")
        .insert({ gost_id: user.id, kmetija_id: farm.id });

      if (insertErr) {
        if (insertErr.code === "23505") {
          return NextResponse.json({
            status: "duplicate",
            message: "Žig za to kmetijo si že zbral ta teden. Ponovi obisk naslednji teden.",
          });
        }
        throw insertErr;
      }
      return NextResponse.json({ status: "success", message: "Žig dodan." });
    }

    if (rpcRes?.status === "duplicate") {
       return NextResponse.json({
         status: "duplicate",
         message: "Žig za to kmetijo si že zbral ta teden.",
       });
    }

    return NextResponse.json({ status: "success", stamp_id: rpcRes?.stamp_id });

  } catch (error: unknown) {
    Sentry.captureException(error, { tags: { route: "green-stamp" } });
    return NextResponse.json({ status: "error", message: "Prišlo je do sistemske napake." }, { status: 500 });
  }
}
