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

export const runtime = "nodejs"; // Because of crypto node module

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
    const { farm: farmSlug, lat, lng, sig } = body;

    if (!farmSlug) {
      return NextResponse.json({ status: "error", message: "Kmetija ni določena." }, { status: 400 });
    }

    if (typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json({ status: "error", message: "Vaša GPS lokacija je obvezna." }, { status: 400 });
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

    // 2. HMAC QR SIGNATURE VALIDATION — always required (QR-only stamps)
    if (!sig) {
      Sentry.captureMessage("Missing QR signature", { extra: { userId: user.id, farmId: farm.id } });
      return NextResponse.json({ status: "error", message: "Žig je mogoče pridobiti samo s skeniranjem QR kode na kmetiji." }, { status: 403 });
    }
    if (!farm.qr_secret_key) {
      Sentry.captureMessage("Farm missing qr_secret_key", { extra: { farmSlug } });
      return NextResponse.json({ status: "error", message: "Kmetija nima aktivirane QR kode. Obrnite se na gostitelja." }, { status: 403 });
    }
    const expectedSig = crypto.createHmac("sha256", farm.qr_secret_key).update(farm.slug).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))) {
      Sentry.captureMessage("Invalid QR signature", { extra: { userId: user.id, farmId: farm.id, sig } });
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
      // Fallback to normal upsert if RPC doesn't exist yet (for demo)
      console.warn("RPC failed or missing, falling back to manual upsert:", rpcError);
      const { error: upsertErr } = await supabase
        .from("green_stamps")
        .upsert(
          { gost_id: user.id, kmetija_id: farm.id },
          { onConflict: "gost_id,kmetija_id", ignoreDuplicates: true }
        );

      if (upsertErr) {
        throw upsertErr;
      }
      return NextResponse.json({ status: "success", message: "Fallback" });
    }

    if (rpcRes?.status === "duplicate") {
       return NextResponse.json({ status: "duplicate", message: "Žig je bil že zbran." });
    }

    return NextResponse.json({ status: "success", stamp_id: rpcRes?.stamp_id });

  } catch (error: unknown) {
    console.error("[green-stamp POST]", error);
    Sentry.captureException(error);
    return NextResponse.json({ status: "error", message: "Prišlo je do sistemske napake." }, { status: 500 });
  }
}
