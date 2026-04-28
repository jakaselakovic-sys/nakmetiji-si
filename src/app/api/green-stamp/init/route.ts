// =============================================================================
// NaKmetiji.si — Green Passport: Stamp Ticket Issuer
// GET /api/green-stamp/init?farm=<slug>
//
// Issues a fresh { ts, sig } pair for the claim flow. The sig is HMAC over
// `<slug>|<ts>` using the farm's server-only qr_secret_key — client never sees
// the secret. Ticket TTL is enforced on POST (see ../route.ts).
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase/server";
import * as Sentry from "@sentry/nextjs";
import crypto from "crypto";


export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ status: "error", message: "Niste prijavljeni." }, { status: 401 });
    }

    const farmSlug = req.nextUrl.searchParams.get("farm");
    if (!farmSlug) {
      return NextResponse.json({ status: "error", message: "Kmetija ni določena." }, { status: 400 });
    }

    const { data: farm, error } = await supabase
      .from("kmetije")
      .select("slug, qr_secret_key")
      .eq("slug", farmSlug)
      .eq("aktivna", true)
      .single();

    if (error || !farm || !farm.qr_secret_key) {
      return NextResponse.json({ status: "error", message: "Kmetija ni najdena." }, { status: 404 });
    }

    const ts = Date.now();
    const sig = crypto
      .createHmac("sha256", farm.qr_secret_key)
      .update(`${farm.slug}|${ts}`)
      .digest("hex");

    return NextResponse.json({ ts, sig });
  } catch (error: unknown) {
    Sentry.captureException(error, { tags: { route: "green-stamp-init" } });
    return NextResponse.json({ status: "error", message: "Prišlo je do sistemske napake." }, { status: 500 });
  }
}
